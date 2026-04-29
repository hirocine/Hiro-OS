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

    // Nova métrica follower_demographics (Meta depreciou as legacy audience_* em 2024)
    const breakdowns = ["age", "gender", "city", "country", "locale"] as const;

    const prefixKeys = (obj: Record<string, number>, prefix: string): Record<string, number> => {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(obj)) {
        out[`${prefix}${k}`] = v;
      }
      return out;
    };

    const result: Record<string, Record<string, number>> = {
      gender_age: {},
      cities: {},
      countries: {},
      locales: {},
    };
    const rawData: Record<string, unknown> = {};

    for (const breakdown of breakdowns) {
      try {
        const url = `https://graph.instagram.com/${apiVersion}/${accountId}/insights` +
          `?metric=follower_demographics` +
          `&period=lifetime` +
          `&metric_type=total_value` +
          `&breakdown=${breakdown}` +
          `&access_token=${token}`;

        console.log(`[audience] fetching breakdown=${breakdown}`);
        const res = await fetch(url);
        const data = await res.json();
        rawData[`follower_demographics_${breakdown}`] = data;

        console.log(
          `[audience] breakdown=${breakdown} response:`,
          JSON.stringify(data).slice(0, 1000),
        );

        if (data?.error) {
          console.error(
            `[audience] breakdown=${breakdown} ERROR:`,
            JSON.stringify(data.error),
          );
          continue;
        }

        const results = data?.data?.[0]?.total_value?.breakdowns?.[0]?.results;
        console.log(
          `[audience] breakdown=${breakdown} parsed:`,
          Array.isArray(results) ? `${results.length} entries` : "no results",
        );

        if (Array.isArray(results)) {
          const dict: Record<string, number> = {};
          for (const r of results) {
            const key = Array.isArray(r.dimension_values)
              ? r.dimension_values.join(".")
              : String(r.dimension_values ?? "unknown");
            dict[key] = r.value ?? 0;
          }

          if (breakdown === "age") {
            result.gender_age = { ...result.gender_age, ...prefixKeys(dict, "age:") };
          } else if (breakdown === "gender") {
            result.gender_age = { ...result.gender_age, ...prefixKeys(dict, "gender:") };
          } else if (breakdown === "city") {
            result.cities = dict;
          } else if (breakdown === "country") {
            result.countries = dict;
          } else if (breakdown === "locale") {
            result.locales = dict;
          }
        }
      } catch (e) {
        console.warn(
          `[audience] follower_demographics breakdown=${breakdown} failed:`,
          e instanceof Error ? e.message : String(e),
        );
      }
    }

    console.log("[audience] final result keys:", {
      gender_age: Object.keys(result.gender_age).length,
      cities: Object.keys(result.cities).length,
      countries: Object.keys(result.countries).length,
      locales: Object.keys(result.locales).length,
    });

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
