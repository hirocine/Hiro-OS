import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Authenticate via x-api-key header
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("FINANCIAL_SYNC_API_KEY");

  if (!expectedKey || apiKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate required fields
    const { year, month } = body;
    if (!year || !month || month < 1 || month > 12) {
      return new Response(
        JSON.stringify({ error: "year and month (1-12) are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // UPSERT financial snapshot
    const snapshotData = {
      year,
      month,
      revenue: body.revenue ?? 0,
      revenue_goal: body.revenue_goal ?? 0,
      contribution_margin_pct: body.contribution_margin_pct ?? 0,
      contribution_margin_value: body.contribution_margin_value ?? 0,
      net_profit_pct: body.net_profit_pct ?? 0,
      net_profit_value: body.net_profit_value ?? 0,
      avg_ticket: body.avg_ticket ?? 0,
      cac: body.cac ?? 0,
      ltv: body.ltv ?? 0,
      churn_rate: body.churn_rate ?? 0,
      burn_rate: body.burn_rate ?? 0,
      nps: body.nps ?? 0,
      cash_balance: body.cash_balance ?? 0,
      realized_income: body.realized_income ?? 0,
      realized_expenses: body.realized_expenses ?? 0,
      receivables_30d: body.receivables_30d ?? 0,
      payables_30d: body.payables_30d ?? 0,
    };

    const { error: snapshotError } = await supabase
      .from("financial_snapshots")
      .upsert(snapshotData, { onConflict: "year,month" });

    if (snapshotError) {
      console.error("Snapshot upsert error:", snapshotError);
      return new Response(
        JSON.stringify({ error: "Failed to upsert snapshot", details: snapshotError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Optional: upsert goals
    if (body.goals) {
      const goalsData = {
        year: body.goals.year ?? year,
        revenue_goal: body.goals.revenue_goal ?? 0,
        margin_goal_pct: body.goals.margin_goal_pct ?? 0,
        profit_goal_pct: body.goals.profit_goal_pct ?? 0,
        cac_goal: body.goals.cac_goal ?? 0,
      };

      const { error: goalsError } = await supabase
        .from("financial_goals")
        .upsert(goalsData, { onConflict: "year" });

      if (goalsError) {
        console.error("Goals upsert error:", goalsError);
        return new Response(
          JSON.stringify({ error: "Snapshot saved, but goals failed", details: goalsError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Snapshot for ${year}-${month} saved` }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
