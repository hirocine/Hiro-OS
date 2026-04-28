import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://os.hiro.film";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // user_id
    const errorParam = url.searchParams.get("error");

    if (errorParam) {
      const errUrl = `${APP_URL}/administracao/integracoes?ga4=error&reason=${encodeURIComponent(errorParam)}`;
      return new Response(null, { status: 302, headers: { ...corsHeaders, Location: errUrl } });
    }

    if (!code) throw new Error("No authorization code received");

    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new Error("Google OAuth secrets not configured");

    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ga4-oauth-callback`;

    // Trocar code por tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(`Token exchange error: ${tokens.error_description ?? tokens.error}`);

    const { access_token, refresh_token, expires_in } = tokens;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Buscar email do usuário Google p/ display name
    let accountName: string | null = null;
    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const userInfo = await userInfoRes.json();
      accountName = userInfo.email ?? null;
    } catch {
      // ignore
    }

    // Preservar account_id (Property ID) se já existia
    const { data: existing } = await supabase
      .from("marketing_integrations")
      .select("account_id")
      .eq("platform", "google_analytics")
      .maybeSingle();

    const upsertPayload: Record<string, unknown> = {
      platform: "google_analytics",
      access_token,
      token_expires_at: new Date(Date.now() + (expires_in ?? 3600) * 1000).toISOString(),
      status: "connected",
      status_message: "Conectado ao Google Analytics",
      connected_at: new Date().toISOString(),
      connected_by: state || null,
      account_name: accountName,
    };
    if (refresh_token) upsertPayload.refresh_token = refresh_token;
    if (existing?.account_id) upsertPayload.account_id = existing.account_id;

    const { error: upsertError } = await supabase
      .from("marketing_integrations")
      .upsert(upsertPayload, { onConflict: "platform" });

    if (upsertError) throw upsertError;

    const redirectUrl = `${APP_URL}/administracao/integracoes?ga4=connected`;
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: redirectUrl },
    });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("ga4-oauth-callback error:", errorMsg);
    const errUrl = `${APP_URL}/administracao/integracoes?ga4=error&reason=${encodeURIComponent(errorMsg)}`;
    return new Response(null, { status: 302, headers: { ...corsHeaders, Location: errUrl } });
  }
});
