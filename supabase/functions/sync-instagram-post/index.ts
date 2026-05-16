import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Same gate used by other sync functions. Accept env service_role key,
// service_role JWT, or a real user session. Reject everything else.
async function requireAuth(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return unauthorized();
  const token = authHeader.replace(/^Bearer\s+/i, "");

  const envServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (envServiceRole && token === envServiceRole) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    if (payload.role === "service_role") return null;
  } catch { /* not a JWT */ }

  const ac = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );
  const { data: { user } } = await ac.auth.getUser(token);
  if (user) return null;

  return unauthorized();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authFail = await requireAuth(req);
  if (authFail) return authFail;

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
    if (post.platform !== "instagram") {
      throw new Error("Post is not from Instagram");
    }
    if (!post.published_url) throw new Error("Post has no published_url");

    // 2. Buscar credenciais
    const { data: integration } = await supabase
      .from("marketing_integrations")
      .select("access_token, account_id, status")
      .eq("platform", "instagram")
      .single();
    if (!integration?.access_token || integration.status !== "connected") {
      throw new Error("Instagram integration not configured");
    }

    // 3. Extrair shortcode do URL
    const match = post.published_url.match(/\/(p|reel|reels|tv)\/([^/?]+)/);
    if (!match) {
      throw new Error("Could not extract media shortcode from URL");
    }
    const shortcode = match[2];

    // 4. Buscar media ID via shortcode (paginar até encontrar)
    let mediaId: string | null = null;
    let nextUrl: string | null =
      `https://graph.instagram.com/v22.0/${integration.account_id}/media?fields=id,permalink&limit=100&access_token=${integration.access_token}`;
    let pages = 0;
    while (nextUrl && pages < 5) {
      const res = await fetch(nextUrl);
      const json = await res.json();
      if (json.error) {
        throw new Error(`Instagram API error: ${json.error.message}`);
      }
      const found = json.data?.find((m: { permalink?: string; id: string }) =>
        m.permalink?.includes(shortcode)
      );
      if (found) {
        mediaId = found.id;
        break;
      }
      nextUrl = json.paging?.next ?? null;
      pages += 1;
    }
    if (!mediaId) {
      throw new Error(
        "Media not found in account. Make sure the post belongs to the connected Instagram Business account.",
      );
    }

    // 5. Buscar insights
    const insightsRes = await fetch(
      `https://graph.instagram.com/v22.0/${mediaId}/insights?metric=views,reach,likes,comments,shares,saved&access_token=${integration.access_token}`,
    );
    const insights = await insightsRes.json();
    if (insights.error) {
      throw new Error(`Instagram API error: ${insights.error.message}`);
    }

    // 6. Mapear métricas
    const metricsMap: Record<string, number> = {};
    insights.data?.forEach(
      (m: { name: string; values?: Array<{ value: number }> }) => {
        metricsMap[m.name] = m.values?.[0]?.value ?? 0;
      },
    );

    // 7. Atualizar post (trigger cria snapshot automaticamente)
    const { error: updateError } = await supabase
      .from("marketing_posts")
      .update({
        views: metricsMap.views ?? 0,
        likes: metricsMap.likes ?? 0,
        comments: metricsMap.comments ?? 0,
        shares: metricsMap.shares ?? 0,
        saves: metricsMap.saved ?? 0,
        reach: metricsMap.reach ?? 0,
        metrics_updated_at: new Date().toISOString(),
        metrics_source: "api_instagram",
      })
      .eq("id", post_id);
    if (updateError) throw updateError;

    // 8. Atualizar last_sync_at da integração
    await supabase
      .from("marketing_integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("platform", "instagram");

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
