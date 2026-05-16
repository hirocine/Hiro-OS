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

// Accept three flavors of caller, reject everyone else:
//   1. The Edge Function calling itself (env service_role key, opaque `sb_secret_*`)
//   2. A pg_cron job using a service_role JWT (legacy)
//   3. A real logged-in user session (JWT verifiable via getUser)
// The bare anon key is NOT accepted — verify_jwt=true alone lets the public anon
// key through, which would expose admin-only sync endpoints to the internet.
async function requireAuth(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return unauthorized();
  const token = authHeader.replace(/^Bearer\s+/i, "");

  const envServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (envServiceRole && token === envServiceRole) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    if (payload.role === "service_role") return null;
  } catch { /* not a JWT, fall through to user lookup */ }

  const ac = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );
  const { data: { user } } = await ac.auth.getUser(token);
  if (user) return null;

  return unauthorized();
}

interface IGMediaChild {
  id: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
}

interface IGMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  username?: string;
  like_count?: number;
  comments_count?: number;
  children?: { data: IGMediaChild[] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authFail = await requireAuth(req);
  if (authFail) return authFail;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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

    const fields = [
      "id",
      "caption",
      "media_type",
      "media_url",
      "thumbnail_url",
      "permalink",
      "timestamp",
      "username",
      "like_count",
      "comments_count",
      "children{id,media_type,media_url,thumbnail_url}",
    ].join(",");

    const mediaUrl =
      `https://graph.instagram.com/${apiVersion}/${accountId}/media?fields=${fields}&limit=50&access_token=${token}`;

    console.log("[discover] fetching media list");
    const mediaRes = await fetch(mediaUrl);
    const mediaData = await mediaRes.json();

    if (mediaData.error) {
      throw new Error(`Media fetch error: ${mediaData.error.message}`);
    }

    const posts: IGMedia[] = mediaData.data ?? [];
    console.log(`[discover] received ${posts.length} posts from API`);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const results: Array<{ external_id: string; action: string; title: string }> = [];

    for (const m of posts) {
      try {
        const { data: existing } = await supabase
          .from("marketing_posts")
          .select("id, source, pillar_id, title")
          .eq("platform", "instagram")
          .eq("external_id", m.id)
          .maybeSingle();

        const formatMap: Record<string, string> = {
          IMAGE: "foto",
          VIDEO: "reels",
          CAROUSEL_ALBUM: "carrossel",
        };
        const format = formatMap[m.media_type] ?? "foto";

        const captionPreview = (m.caption ?? "").trim();
        const dateStr = new Date(m.timestamp).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        const title = captionPreview
          ? captionPreview.slice(0, 80).replace(/\n/g, " ")
          : `Post de ${dateStr}`;

        const cover_url = m.media_type === "VIDEO"
          ? (m.thumbnail_url ?? m.media_url ?? null)
          : (m.media_url ?? null);

        const carousel_media_urls =
          m.media_type === "CAROUSEL_ALBUM" && m.children?.data
            ? m.children.data.map((c) => ({
              url: c.media_type === "VIDEO"
                ? (c.thumbnail_url ?? c.media_url)
                : c.media_url,
              media_type: c.media_type,
            }))
            : null;

        const hashtags = (m.caption ?? "").match(/#[\p{L}\p{N}_]+/gu)?.map((
          h,
        ) => h.slice(1)) ?? [];

        const basePayload = {
          platform: "instagram",
          format,
          status: "publicado",
          published_url: m.permalink,
          published_at: m.timestamp,
          external_id: m.id,
          media_type: m.media_type,
          cover_url,
          thumbnail_url: m.thumbnail_url ?? null,
          file_url: m.media_url ?? null,
          carousel_media_urls,
          caption: m.caption ?? null,
          hashtags,
          likes: m.like_count ?? 0,
          comments: m.comments_count ?? 0,
        };

        if (existing) {
          await supabase
            .from("marketing_posts")
            .update({
              cover_url: basePayload.cover_url,
              thumbnail_url: basePayload.thumbnail_url,
              file_url: basePayload.file_url,
              carousel_media_urls: basePayload.carousel_media_urls,
              caption: basePayload.caption,
              hashtags: basePayload.hashtags,
              likes: basePayload.likes,
              comments: basePayload.comments,
              published_url: basePayload.published_url,
              media_type: basePayload.media_type,
            })
            .eq("id", existing.id);
          updated += 1;
          results.push({
            external_id: m.id,
            action: "updated",
            title: existing.title,
          });
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from("marketing_posts")
            .insert({
              ...basePayload,
              title,
              source: "auto_discovered",
              auto_discovered_at: new Date().toISOString(),
            })
            .select("id, title")
            .single();

          if (insertError) {
            console.error(
              `[discover] insert failed for ${m.id}:`,
              insertError.message,
            );
            skipped += 1;
            continue;
          }
          created += 1;
          results.push({
            external_id: m.id,
            action: "created",
            title: inserted?.title ?? title,
          });
        }
      } catch (e) {
        console.error(
          `[discover] error processing ${m.id}:`,
          e instanceof Error ? e.message : String(e),
        );
        skipped += 1;
      }
    }

    console.log(
      `[discover] done. created=${created}, updated=${updated}, skipped=${skipped}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        total: posts.length,
        created,
        updated,
        skipped,
        results: results.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(
      "discover-instagram-posts error:",
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
