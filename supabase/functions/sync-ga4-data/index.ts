import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Google OAuth secrets missing");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Refresh error: ${data.error_description ?? data.error}`);
  return { access_token: data.access_token, expires_in: data.expires_in ?? 3600 };
}

async function runReport(
  apiUrl: string,
  accessToken: string,
  body: Record<string, unknown>,
): Promise<{ rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>; error?: { message: string } }> {
  const maxAttempts = 4;
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // Retry em 429 (rate limit) e 5xx (server error)
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = res.headers.get("retry-after");
        const baseDelay = retryAfter ? parseInt(retryAfter) * 1000 : 0;
        const backoff = baseDelay || Math.min(1000 * 2 ** (attempt - 1), 8000);
        const jitter = Math.floor(Math.random() * 250);
        console.warn(`[sync-ga4] runReport HTTP ${res.status}, retry ${attempt}/${maxAttempts} in ${backoff + jitter}ms`);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, backoff + jitter));
          continue;
        }
        return { error: { message: `GA4 API HTTP ${res.status} after ${maxAttempts} attempts` } };
      }

      return await res.json();
    } catch (err) {
      lastErr = err;
      const backoff = Math.min(1000 * 2 ** (attempt - 1), 8000);
      const jitter = Math.floor(Math.random() * 250);
      console.warn(`[sync-ga4] runReport network error, retry ${attempt}/${maxAttempts} in ${backoff + jitter}ms`, err);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, backoff + jitter));
        continue;
      }
    }
  }

  const errMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  return { error: { message: `GA4 API failed after ${maxAttempts} attempts: ${errMsg}` } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Permitir bypass do cache via body (útil pro cron noturno)
    let force = false;
    try {
      const body = await req.json().catch(() => ({}));
      force = body?.force === true;
    } catch {
      // body vazio é OK
    }

    const { data: integration, error: intErr } = await supabase
      .from("marketing_integrations")
      .select("access_token, refresh_token, token_expires_at, status, account_id, last_sync_at")
      .eq("platform", "google_analytics")
      .maybeSingle();

    if (intErr) throw intErr;
    if (!integration?.access_token || integration.status !== "connected") {
      throw new Error("GA4 integration not connected");
    }
    if (!integration.account_id) {
      throw new Error("Property ID não configurado. Defina o Property ID na página de Integrações.");
    }
    if (!integration.refresh_token) {
      throw new Error("Refresh token ausente. Reconecte sua conta Google Analytics.");
    }

    // CACHE: se sincronizou há menos de 5min e não foi forçado, retorna sucesso sem chamar API
    const CACHE_DURATION_MS = 5 * 60 * 1000;
    if (!force && integration.last_sync_at) {
      const lastSyncMs = new Date(integration.last_sync_at).getTime();
      const elapsedMs = Date.now() - lastSyncMs;

      if (elapsedMs < CACHE_DURATION_MS) {
        const remainingSec = Math.ceil((CACHE_DURATION_MS - elapsedMs) / 1000);
        console.log(`[sync-ga4] cache hit, last sync ${Math.round(elapsedMs / 1000)}s ago, skip`);
        return new Response(
          JSON.stringify({
            success: true,
            cached: true,
            message: `Sincronizado recentemente. Próximo sync em ${remainingSec}s`,
            secondsUntilNextSync: remainingSec,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const propertyId = integration.account_id;

    // Renovar token se expirou ou expira em < 1 min
    let accessToken = integration.access_token;
    const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : 0;
    if (expiresAt < Date.now() + 60_000) {
      console.log("[sync-ga4] refreshing access token");
      const refreshed = await refreshAccessToken(integration.refresh_token);
      accessToken = refreshed.access_token;
      await supabase
        .from("marketing_integrations")
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        })
        .eq("platform", "google_analytics");
    }

    const apiUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

    // 1) Snapshots diários (últimos 30 dias)
    const dailyReport = await runReport(apiUrl, accessToken, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
        { name: "engagementRate" },
        { name: "conversions" },
      ],
    });

    if (dailyReport.error) throw new Error(`GA4 API error: ${dailyReport.error.message}`);

    const rows = dailyReport.rows ?? [];
    let upserted = 0;
    for (const row of rows) {
      const rawDate = row.dimensionValues[0].value; // "20260427"
      const captured_date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
      const m = row.metricValues;

      const { error: upErr } = await supabase
        .from("marketing_ga4_snapshots")
        .upsert({
          property_id: propertyId,
          captured_date,
          sessions: parseInt(m[0].value) || 0,
          total_users: parseInt(m[1].value) || 0,
          new_users: parseInt(m[2].value) || 0,
          page_views: parseInt(m[3].value) || 0,
          avg_session_duration: parseFloat(m[4].value) || 0,
          bounce_rate: parseFloat(m[5].value) || 0,
          engagement_rate: parseFloat(m[6].value) || 0,
          conversions: parseInt(m[7].value) || 0,
          raw_response: row,
        }, { onConflict: "property_id,captured_date" });
      if (upErr) console.error("upsert snapshot err:", upErr);
      else upserted += 1;
    }

    // 2) Dimensões granulares POR DIA (não agregado)
    // Todas as queries adicionam `date` como primeira dimensão.
    // Frontend agrega via PeriodPicker.

    // 2.1) Sources por dia
    const sourcesData = await runReport(apiUrl, accessToken, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }, { name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      limit: 10000,
    });

    // 2.2) Top pages por dia
    const pagesData = await runReport(apiUrl, accessToken, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }, { name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      limit: 10000,
    });

    // 2.3) Devices por dia
    const devicesData = await runReport(apiUrl, accessToken, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }, { name: "deviceCategory" }],
      metrics: [{ name: "sessions" }],
      limit: 10000,
    });

    // 2.4) Mediums por dia
    const mediumsData = await runReport(apiUrl, accessToken, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }, { name: "sessionMedium" }],
      metrics: [{ name: "sessions" }],
      limit: 10000,
    });

    // 2.5) Exit pages por dia
    const exitPagesData = await runReport(apiUrl, accessToken, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }, { name: "pagePath" }],
      metrics: [{ name: "exits" }, { name: "screenPageViews" }],
      limit: 10000,
    });

    // 2.6) Conversion events por dia
    const conversionsData = await runReport(apiUrl, accessToken, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: {
            matchType: "PARTIAL_REGEXP",
            value: "click|whatsapp|contact|conversion|generate_lead",
            caseSensitive: false,
          },
        },
      },
      limit: 10000,
    });

    // 2.7) Countries por dia
    const countriesData = await runReport(apiUrl, accessToken, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }, { name: "country" }],
      metrics: [{ name: "sessions" }],
      limit: 10000,
    });

    // 3) Reorganizar dados por dia
    const toIsoDate = (raw: string) =>
      `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;

    const sourcesByDay: Map<string, Record<string, number>> = new Map();
    const pagesByDay: Map<string, Array<{ path: string; views: number }>> = new Map();
    const devicesByDay: Map<string, Record<string, number>> = new Map();
    const mediumsByDay: Map<string, Record<string, number>> = new Map();
    const exitPagesByDay: Map<string, Array<{ path: string; exits: number; views: number; exit_rate: number }>> = new Map();
    const conversionsByDay: Map<string, Array<{ event_name: string; count: number }>> = new Map();
    const countriesByDay: Map<string, Record<string, number>> = new Map();

    const ensureRecord = <T>(map: Map<string, T>, key: string, init: T): T => {
      if (!map.has(key)) map.set(key, init);
      return map.get(key)!;
    };

    (sourcesData.rows ?? []).forEach((r) => {
      const day = toIsoDate(r.dimensionValues[0].value);
      const source = r.dimensionValues[1].value;
      const sessions = parseInt(r.metricValues[0].value) || 0;
      const dayData = ensureRecord(sourcesByDay, day, {} as Record<string, number>);
      dayData[source] = (dayData[source] ?? 0) + sessions;
    });

    (pagesData.rows ?? []).forEach((r) => {
      const day = toIsoDate(r.dimensionValues[0].value);
      const path = r.dimensionValues[1].value;
      const views = parseInt(r.metricValues[0].value) || 0;
      const arr = ensureRecord(pagesByDay, day, [] as Array<{ path: string; views: number }>);
      arr.push({ path, views });
    });

    (devicesData.rows ?? []).forEach((r) => {
      const day = toIsoDate(r.dimensionValues[0].value);
      const device = r.dimensionValues[1].value;
      const sessions = parseInt(r.metricValues[0].value) || 0;
      const dayData = ensureRecord(devicesByDay, day, {} as Record<string, number>);
      dayData[device] = (dayData[device] ?? 0) + sessions;
    });

    (mediumsData.rows ?? []).forEach((r) => {
      const day = toIsoDate(r.dimensionValues[0].value);
      const medium = r.dimensionValues[1].value;
      const sessions = parseInt(r.metricValues[0].value) || 0;
      const dayData = ensureRecord(mediumsByDay, day, {} as Record<string, number>);
      dayData[medium] = (dayData[medium] ?? 0) + sessions;
    });

    (exitPagesData.rows ?? []).forEach((r) => {
      const day = toIsoDate(r.dimensionValues[0].value);
      const path = r.dimensionValues[1].value;
      const exits = parseInt(r.metricValues[0].value) || 0;
      const views = parseInt(r.metricValues[1].value) || 0;
      const arr = ensureRecord(exitPagesByDay, day, [] as Array<{ path: string; exits: number; views: number; exit_rate: number }>);
      arr.push({ path, exits, views, exit_rate: views > 0 ? exits / views : 0 });
    });

    (conversionsData.rows ?? []).forEach((r) => {
      const day = toIsoDate(r.dimensionValues[0].value);
      const eventName = r.dimensionValues[1].value;
      const count = parseInt(r.metricValues[0].value) || 0;
      const arr = ensureRecord(conversionsByDay, day, [] as Array<{ event_name: string; count: number }>);
      arr.push({ event_name: eventName, count });
    });

    (countriesData.rows ?? []).forEach((r) => {
      const day = toIsoDate(r.dimensionValues[0].value);
      const country = r.dimensionValues[1].value;
      const sessions = parseInt(r.metricValues[0].value) || 0;
      const dayData = ensureRecord(countriesByDay, day, {} as Record<string, number>);
      dayData[country] = (dayData[country] ?? 0) + sessions;
    });

    // 4) UPSERT 1 linha por dia (granular)
    const allDays = new Set<string>([
      ...sourcesByDay.keys(),
      ...pagesByDay.keys(),
      ...devicesByDay.keys(),
      ...mediumsByDay.keys(),
      ...exitPagesByDay.keys(),
      ...conversionsByDay.keys(),
      ...countriesByDay.keys(),
    ]);

    let dimensionsUpserted = 0;
    for (const day of allDays) {
      const { error: dimErr } = await supabase
        .from("marketing_ga4_dimensions")
        .upsert(
          {
            property_id: propertyId,
            captured_date: day,
            sources_breakdown: sourcesByDay.get(day) ?? {},
            top_pages: pagesByDay.get(day) ?? [],
            devices_breakdown: devicesByDay.get(day) ?? {},
            mediums_breakdown: mediumsByDay.get(day) ?? {},
            exit_pages: exitPagesByDay.get(day) ?? [],
            conversion_events: conversionsByDay.get(day) ?? [],
            countries_breakdown: countriesByDay.get(day) ?? {},
          },
          { onConflict: "property_id,captured_date" },
        );
      if (dimErr) console.error(`[sync-ga4] upsert dimensions for ${day} failed:`, dimErr);
      else dimensionsUpserted += 1;
    }

    console.log(`[sync-ga4] dimensions upserted: ${dimensionsUpserted} days`);

    await supabase
      .from("marketing_integrations")
      .update({ last_sync_at: new Date().toISOString(), status_message: "Sincronizado" })
      .eq("platform", "google_analytics");

    return new Response(
      JSON.stringify({
        success: true,
        days_upserted: upserted,
        dimensions_days_upserted: dimensionsUpserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("sync-ga4-data error:", errorMsg);

    // Marcar erro na integração
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabase
        .from("marketing_integrations")
        .update({ status_message: errorMsg.slice(0, 500) })
        .eq("platform", "google_analytics");
    } catch {
      // ignore
    }

    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
