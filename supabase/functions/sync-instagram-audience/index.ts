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

    const metrics = [
      "audience_gender_age",
      "audience_city",
      "audience_country",
      "audience_locale",
    ];

    const result: Record<string, Record<string, number>> = {
      gender_age: {},
      cities: {},
      countries: {},
      locales: {},
    };
    const rawData: Record<string, unknown> = {};

    for (const metric of metrics) {
      try {
        const res = await fetch(
          `https://graph.instagram.com/${apiVersion}/${accountId}/insights?metric=${metric}&period=lifetime&access_token=${token}`,
        );
        const data = await res.json();
        rawData[metric] = data;

        const value = data.data?.[0]?.values?.[0]?.value;
        if (value && typeof value === "object") {
          if (metric === "audience_gender_age") result.gender_age = value;
          else if (metric === "audience_city") result.cities = value;
          else if (metric === "audience_country") result.countries = value;
          else if (metric === "audience_locale") result.locales = value;
        }
      } catch (e) {
        console.warn(
          `Metric ${metric} failed:`,
          e instanceof Error ? e.message : String(e),
        );
      }
    }

    const { error } = await supabase
      .from("marketing_account_audience")
      .insert({
        platform: "instagram",
        account_id: accountId,
        gender_age: result.gender_age,
        cities: result.cities,
        countries: result.countries,
        locales: result.locales,
        raw_response: rawData,
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, audience: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(
      "sync-instagram-audience error:",
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
