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
      `https://graph.instagram.com/${apiVersion}/${accountId}?fields=followers_count,follows_count,media_count,name,username&access_token=${token}`,
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

    // Map: date (YYYY-MM-DD) → { reach, views, profile_views }
    const dailyMetrics: Record<string, { reach: number; views: number; profile_views: number }> = {};

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
              dailyMetrics[day] = { reach: 0, views: 0, profile_views: 0 };
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

    // 3.2 Buscar profile_views separadamente
    try {
      const pvRes = await fetch(
        `https://graph.instagram.com/${apiVersion}/${accountId}/insights?metric=profile_views&period=day&since=${sinceStr}&until=${untilStr}&access_token=${token}`,
      );
      const pvData = await pvRes.json();
      console.log(
        "[sync-account] profile_views response:",
        JSON.stringify(pvData).slice(0, 500),
      );

      const pvSeries = pvData?.data?.[0]?.values ?? [];
      for (const v of pvSeries) {
        const day = String(v.end_time ?? "").split("T")[0];
        if (!day) continue;
        if (!dailyMetrics[day]) {
          dailyMetrics[day] = { reach: 0, views: 0, profile_views: 0 };
        }
        dailyMetrics[day].profile_views = v.value ?? 0;
      }
    } catch {
      console.warn("profile_views not available (deprecated for some accounts)");
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
    const todayStr = new Date().toISOString().split("T")[0];

    for (const day of sortedDays) {
      const metrics = dailyMetrics[day];
      const capturedAt = new Date(`${day}T12:00:00.000Z`).toISOString();
      const isToday = day === todayStr;

      const payload = {
        platform: "instagram",
        account_id: accountId,
        followers_count: userData.followers_count ?? 0,
        follows_count: userData.follows_count ?? 0,
        media_count: userData.media_count ?? 0,
        reach_day: metrics.reach,
        views_day: metrics.views,
        profile_views_day: metrics.profile_views,
        followers_delta: isToday ? followers_delta : null,
        captured_at: capturedAt,
        raw_response: { user: userData, day_metrics: metrics },
      };

      const { data: existing } = await supabase
        .from("marketing_account_snapshots")
        .select("id")
        .eq("platform", "instagram")
        .eq("account_id", accountId)
        .eq("captured_date", day)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("marketing_account_snapshots")
          .update(payload)
          .eq("id", existing.id);
      } else {
        await supabase.from("marketing_account_snapshots").insert(payload);
      }
      upsertedDays += 1;
    }

    // 6. Atualizar last_sync_at
    await supabase
      .from("marketing_integrations")
      .update({ last_sync_at: new Date().toISOString() })
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
