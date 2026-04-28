import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: posts, error: postsError } = await supabase
      .from("marketing_posts")
      .select("id, published_url, title")
      .eq("platform", "instagram")
      .eq("status", "publicado")
      .not("published_url", "is", null);

    if (postsError) throw postsError;
    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No posts to sync", synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const post of posts) {
      try {
        const syncRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-instagram-post`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ post_id: post.id }),
          }
        );

        const syncData = await syncRes.json();
        results.push({
          id: post.id,
          success: syncData.success ?? false,
          error: syncData.error,
        });

        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        results.push({
          id: post.id,
          success: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        total: posts.length,
        synced: successCount,
        failed: posts.length - successCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("auto-sync-instagram-posts error:", e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
