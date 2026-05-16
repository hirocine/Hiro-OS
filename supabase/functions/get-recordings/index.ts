import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ensure caller is a real logged-in user, not just anyone passing the
    // public anon key. verify_jwt=true alone accepts anon JWTs because they
    // are technically valid; we want a real user session.
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: { user }, error: authError } = await sb.auth.getUser(
      authHeader.replace(/^Bearer\s+/i, "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const url = new URL(req.url);
    const timeMin = url.searchParams.get("timeMin");
    const timeMax = url.searchParams.get("timeMax");

    const API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
    const CALENDAR_ID = Deno.env.get("RECORDINGS_CALENDAR_ID");

    if (!API_KEY || !CALENDAR_ID) {
      return new Response(JSON.stringify({ error: "Calendar not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const encodedId = encodeURIComponent(CALENDAR_ID);
    const params = new URLSearchParams({
      key: API_KEY,
      singleEvents: "true",
      orderBy: "startTime",
      timeZone: "America/Sao_Paulo",
      ...(timeMin && { timeMin }),
      ...(timeMax && { timeMax }),
    });

    const gcalUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events?${params}`;
    const response = await fetch(gcalUrl);

    if (!response.ok) {
      const err = await response.text();
      console.error("Google Calendar API error:", err);
      return new Response(JSON.stringify({ error: "Failed to fetch calendar", details: err }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const data = await response.json();

    const events = (data.items || []).map((e: any) => ({
      id: e.id,
      summary: e.summary || "",
      start: e.start?.dateTime || e.start?.date || "",
      end: e.end?.dateTime || e.end?.date || "",
      allDay: !e.start?.dateTime,
      location: e.location || null,
      description: e.description || null,
      colorId: e.colorId || null,
      htmlLink: e.htmlLink || null,
    }));

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("get-recordings error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
