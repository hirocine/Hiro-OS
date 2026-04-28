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
    const { post_id } = await req.json();
    if (!post_id) throw new Error("post_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Buscar post
    const { data: post, error: postError } = await supabase
      .from("marketing_posts")
      .select("id, published_url, platform")
      .eq("id", post_id)
      .single();
    if (postError || !post) throw new Error("Post not found");
    if (post.platform !== "linkedin") {
      throw new Error("Post is not from LinkedIn");
    }
    if (!post.published_url) throw new Error("Post has no published_url");

    // 2. Buscar credenciais
    const { data: integration } = await supabase
      .from("marketing_integrations")
      .select("access_token, account_id, status")
      .eq("platform", "linkedin")
      .single();
    if (!integration?.access_token || integration.status !== "connected") {
      throw new Error("LinkedIn integration not configured");
    }
    if (!integration.account_id) {
      throw new Error("LinkedIn organization id not configured");
    }

    // 3. Extrair activity ID do URL
    // formato: https://www.linkedin.com/feed/update/urn:li:activity:{id}/
    // ou pode vir como urn:li:share:{id}
    const activityMatch = post.published_url.match(/urn:li:activity:(\d+)/);
    const shareMatch = post.published_url.match(/urn:li:share:(\d+)/);
    if (!activityMatch && !shareMatch) {
      throw new Error("Could not extract LinkedIn activity/share URN from URL");
    }
    const shareUrn = shareMatch
      ? `urn:li:share:${shareMatch[1]}`
      : `urn:li:activity:${activityMatch![1]}`;

    // 4. organizationalEntity URN
    const orgUrn = integration.account_id.startsWith("urn:li:")
      ? integration.account_id
      : `urn:li:organization:${integration.account_id}`;

    // 5. Chamar Community Management API
    const url = new URL(
      "https://api.linkedin.com/rest/organizationalEntityShareStatistics",
    );
    url.searchParams.set("q", "organizationalEntity");
    url.searchParams.set("organizationalEntity", orgUrn);
    url.searchParams.set("shares[0]", shareUrn);

    const apiRes = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${integration.access_token}`,
        "Linkedin-Version": "202601",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });
    const apiJson = await apiRes.json();
    if (!apiRes.ok) {
      throw new Error(
        `LinkedIn API error: ${apiJson.message ?? JSON.stringify(apiJson)}`,
      );
    }

    const element = apiJson.elements?.[0];
    if (!element) {
      throw new Error(
        "No statistics returned. Make sure the post belongs to the connected organization.",
      );
    }

    const stats = element.totalShareStatistics ?? element;
    const metricsMap = {
      views: Number(stats.impressionCount ?? 0),
      likes: Number(stats.likeCount ?? 0),
      comments: Number(stats.commentCount ?? 0),
      shares: Number(stats.shareCount ?? 0),
      reach: Number(
        stats.uniqueImpressionsCount ?? stats.impressionCount ?? 0,
      ),
      profile_clicks: Number(stats.clickCount ?? 0),
    };

    // 6. Atualizar post
    const { error: updateError } = await supabase
      .from("marketing_posts")
      .update({
        ...metricsMap,
        metrics_updated_at: new Date().toISOString(),
        metrics_source: "api_linkedin",
      })
      .eq("id", post_id);
    if (updateError) throw updateError;

    await supabase
      .from("marketing_integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("platform", "linkedin");

    return new Response(
      JSON.stringify({ success: true, metrics: metricsMap }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
