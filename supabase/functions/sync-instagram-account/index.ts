import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Buscar credenciais Instagram
    const { data: integration } = await supabase
      .from("marketing_integrations")
      .select("access_token, account_id, status")
      .eq("platform", "instagram")
      .single();

    if (!integration?.access_token || integration.status !== "connected") {
      throw new Error("Instagram integration not connected");
    }

    const token = integration.access_token;
    const accountId = integration.account_id;
    const apiVersion = "v22.0";

    // 2. Dados básicos da conta
    const userRes = await fetch(
      `https://graph.instagram.com/${apiVersion}/${accountId}?fields=followers_count,follows_count,media_count,name,username,profile_picture_url&access_token=${token}`,
    );
    const userData = await userRes.json();
    if (userData.error) {
      throw new Error(`Account fetch error: ${userData.error.message}`);
    }

    // 3. Insights (reach, views) — janela de 30 dias para BACKFILL completo
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date();
    const sinceStr = thirtyDaysAgo.toISOString().split("T")[0];
    const untilStr = today.toISOString().split("T")[0];

    // Map: date (YYYY-MM-DD) → { reach, views }
    const dailyMetrics: Record<string, { reach: number; views: number }> = {};

    // 3.1 Buscar reach + views
    try {
      const insightsRes = await fetch(
        `https://graph.instagram.com/${apiVersion}/${accountId}/insights?metric=reach,views&period=day&since=${sinceStr}&until=${untilStr}&access_token=${token}`,
      );
      const insightsData = await insightsRes.json();

      console.log(
        "[sync-account] reach/views response:",
        JSON.stringify(insightsData).slice(0, 500),
      );

      if (insightsData.data) {
        for (const m of insightsData.data) {
          const values = m.values ?? [];
          for (const v of values) {
            const day = String(v.end_time ?? "").split("T")[0];
            if (!day) continue;
            if (!dailyMetrics[day]) {
              dailyMetrics[day] = { reach: 0, views: 0 };
            }
            if (m.name === "reach") dailyMetrics[day].reach = v.value ?? 0;
            if (m.name === "views") dailyMetrics[day].views = v.value ?? 0;
          }
        }
      }
    } catch (e) {
      console.error(
        "Insights fetch failed:",
        e instanceof Error ? e.message : String(e),
      );
    }


    console.log(
      `[sync-account] backfilling ${Object.keys(dailyMetrics).length} days`,
    );

    // 4. Pegar último snapshot pra calcular delta de seguidores
    const { data: lastSnapshot } = await supabase
      .from("marketing_account_snapshots")
      .select("followers_count, captured_at")
      .eq("platform", "instagram")
      .eq("account_id", accountId)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const followers_delta = lastSnapshot
      ? (userData.followers_count ?? 0) - (lastSnapshot.followers_count ?? 0)
      : 0;

    // 5. UPSERT um snapshot por dia (backfill)
    let upsertedDays = 0;
    const sortedDays = Object.keys(dailyMetrics).sort();

    // FIX timezone: o "dia atual" para fins de salvar contadores lifetime é
    // o ÚLTIMO dia retornado pela API (não new Date() que está em UTC).
    // Isso evita bug onde sync à noite (horário local) cai no dia seguinte UTC,
    // fazendo nenhum dia bater com `todayStr` e todos os snapshots ficarem com
    // followers_count/media_count = NULL.
    const mostRecentDay = sortedDays[sortedDays.length - 1] ?? null;

    for (const day of sortedDays) {
      const metrics = dailyMetrics[day];
      const capturedAt = new Date(`${day}T12:00:00.000Z`).toISOString();
      const isToday = day === mostRecentDay;

      // Lifetime counters (followers/follows/media) só são reais pro dia de HOJE.
      // Para dias passados ficam null para não poluir o gráfico de evolução.
      const payload: Record<string, unknown> = {
        platform: "instagram",
        account_id: accountId,
        followers_count: isToday ? (userData.followers_count ?? 0) : null,
        follows_count: isToday ? (userData.follows_count ?? 0) : null,
        media_count: isToday ? (userData.media_count ?? 0) : null,
        reach_day: metrics.reach,
        views_day: metrics.views,
        followers_delta: isToday ? followers_delta : null,
        captured_at: capturedAt,
        raw_response: { user: isToday ? userData : null, day_metrics: metrics },
      };

      const { data: existing } = await supabase
        .from("marketing_account_snapshots")
        .select("id, followers_count, follows_count, media_count")
        .eq("platform", "instagram")
        .eq("account_id", accountId)
        .eq("captured_date", day)
        .maybeSingle();

      if (existing) {
        // Ao reprocessar um dia passado, preservar contadores lifetime já coletados
        // (que podem ter sido capturados pelo cron diário em outro dia).
        const updatePayload = isToday
          ? payload
          : {
              ...payload,
              followers_count: existing.followers_count ?? null,
              follows_count: existing.follows_count ?? null,
              media_count: existing.media_count ?? null,
            };
        await supabase
          .from("marketing_account_snapshots")
          .update(updatePayload)
          .eq("id", existing.id);
      } else {
        await supabase.from("marketing_account_snapshots").insert(payload);
      }
      upsertedDays += 1;
    }

    // 6. Atualizar last_sync_at + foto de perfil + username
    const integrationUpdate: Record<string, unknown> = {
      last_sync_at: new Date().toISOString(),
      profile_picture_url: userData.profile_picture_url ?? null,
    };
    if (userData.username) {
      integrationUpdate.account_name = `@${userData.username}`;
    }
    await supabase
      .from("marketing_integrations")
      .update(integrationUpdate)
      .eq("platform", "instagram");

    return new Response(
      JSON.stringify({
        success: true,
        backfilled_days: upsertedDays,
        snapshot: {
          followers: userData.followers_count,
          posts: userData.media_count,
          followers_delta,
          sample_day: sortedDays[sortedDays.length - 1],
          sample_metrics: dailyMetrics[sortedDays[sortedDays.length - 1]],
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(
      "sync-instagram-account error:",
      e instanceof Error ? e.message : String(e),
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
