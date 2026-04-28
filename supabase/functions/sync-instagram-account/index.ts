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

    // 3. Insights do dia (reach, views) — views substituiu impressions em 2025
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let reach_day = 0;
    let views_day = 0;
    let profile_views_day = 0;
    let insightsRaw: unknown = null;

    try {
      const insightsRes = await fetch(
        `https://graph.instagram.com/${apiVersion}/${accountId}/insights?metric=reach,views&period=day&since=${yesterdayStr}&until=${yesterdayStr}&access_token=${token}`,
      );
      const insightsData = await insightsRes.json();
      insightsRaw = insightsData;

      if (insightsData.data) {
        for (const m of insightsData.data) {
          const value = m.values?.[0]?.value ?? 0;
          if (m.name === "reach") reach_day = value;
          if (m.name === "views") views_day = value;
        }
      }
    } catch (e) {
      console.error(
        "Insights fetch failed:",
        e instanceof Error ? e.message : String(e),
      );
    }

    // profile_views (pode estar deprecated em algumas contas)
    try {
      const pvRes = await fetch(
        `https://graph.instagram.com/${apiVersion}/${accountId}/insights?metric=profile_views&period=day&since=${yesterdayStr}&until=${yesterdayStr}&access_token=${token}`,
      );
      const pvData = await pvRes.json();
      if (pvData.data?.[0]?.values?.[0]?.value) {
        profile_views_day = pvData.data[0].values[0].value;
      }
    } catch {
      console.warn("profile_views not available (deprecated for some accounts)");
    }

    // 4. Delta de seguidores vs último snapshot
    const { data: lastSnapshot } = await supabase
      .from("marketing_account_snapshots")
      .select("followers_count")
      .eq("platform", "instagram")
      .eq("account_id", accountId)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const followers_delta = lastSnapshot
      ? (userData.followers_count ?? 0) - lastSnapshot.followers_count
      : 0;

    // 5. Inserir snapshot
    const payload = {
      platform: "instagram",
      account_id: accountId,
      followers_count: userData.followers_count ?? 0,
      follows_count: userData.follows_count ?? 0,
      media_count: userData.media_count ?? 0,
      reach_day,
      views_day,
      profile_views_day,
      followers_delta,
      raw_response: { user: userData, insights: insightsRaw },
    };

    const { error: insertError } = await supabase
      .from("marketing_account_snapshots")
      .insert(payload);

    if (insertError) {
      // Conflito de unicidade do dia → atualiza snapshot existente
      if (insertError.code === "23505") {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        await supabase
          .from("marketing_account_snapshots")
          .update(payload)
          .eq("platform", "instagram")
          .eq("account_id", accountId)
          .gte("captured_at", startOfDay.toISOString());
      } else {
        throw insertError;
      }
    }

    // 6. Atualizar last_sync_at
    await supabase
      .from("marketing_integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("platform", "instagram");

    return new Response(
      JSON.stringify({
        success: true,
        snapshot: {
          followers: userData.followers_count,
          posts: userData.media_count,
          reach_day,
          views_day,
          profile_views_day,
          followers_delta,
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
