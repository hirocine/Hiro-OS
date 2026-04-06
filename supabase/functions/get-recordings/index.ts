import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
