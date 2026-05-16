import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Real-user gate: ANON JWT alone shouldn't be able to burn Anthropic
// credits. Matches the pattern used by ai-assistant.
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

const LANGUAGE_NAMES: Record<string, string> = {
  "pt-BR": "Portuguese (Brazilian)",
  "en": "English",
  "es": "Spanish",
};

function buildPrompt(opts: {
  srt: string;
  aspectRatio: "16:9" | "9:16";
  language: string;
  maxCharsPerLine: number;
  glossary: string[];
}): string {
  const langName = LANGUAGE_NAMES[opts.language] ?? opts.language;
  const glossaryBlock = opts.glossary.length
    ? `\n<glossary>\n${opts.glossary.map((t) => `- ${t}`).join("\n")}\n</glossary>\n\nUse the exact spelling from the glossary above whenever those terms appear.\n`
    : "";

  return `You are a professional subtitle editor. The user uploaded an SRT file in ${langName} and needs it cleaned up for a ${opts.aspectRatio} video.

Rules:
- Preserve every timecode exactly. Never change the timing lines.
- Preserve the cue numbering and order.
- Preserve what the speaker actually said. Don't paraphrase or summarize. You are correcting the *transcription*, not rewriting it.
- Fix obvious transcription errors (mishears, missing accents, wrong proper nouns) only when you are confident.
- Fix punctuation: capitalization, periods, commas, question marks. Add ellipses (…) when a cue trails off into the next.
- Re-break lines so no line exceeds ${opts.maxCharsPerLine} characters and no cue has more than 2 lines. Prefer breaking at natural pause points (after punctuation, between clauses).
- If a cue is too long for 2 lines at ${opts.maxCharsPerLine} chars/line, leave it as-is — splitting cues would change timing.
- Keep filler words ("um", "uh", "tipo", "né", "you know") if they're clearly there. The user can ask to remove them separately.${glossaryBlock}

Output the corrected SRT in full. No commentary, no markdown fences, no preface. Start directly with "1\\n".

<srt>
${opts.srt}
</srt>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authFail = await requireAuth(req);
  if (authFail) return authFail;

  try {
    const body = await req.json();
    const srt = String(body?.srt ?? "").trim();
    const aspectRatio = body?.aspectRatio === "9:16" ? "9:16" : "16:9";
    const language = ["pt-BR", "en", "es"].includes(body?.language) ? body.language : "pt-BR";
    const maxCharsPerLine = Number(body?.maxCharsPerLine) || (aspectRatio === "16:9" ? 42 : 28);
    const glossary = Array.isArray(body?.glossary)
      ? body.glossary.filter((t: unknown) => typeof t === "string").slice(0, 50)
      : [];

    if (!srt) {
      return new Response(JSON.stringify({ error: "srt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (srt.length > 200_000) {
      return new Response(JSON.stringify({ error: "srt too large (max 200kB)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const prompt = buildPrompt({ srt, aspectRatio, language, maxCharsPerLine, glossary });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 16384,
      system: "You output corrected SRT subtitle files. You never add commentary, code fences, or explanations — only the raw SRT.",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((b): b is { type: "text"; text: string } => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    // Strip accidental code fences if the model added them despite the system prompt.
    const cleaned = text.replace(/^```(?:srt)?\n?/i, "").replace(/\n?```$/, "").trim();

    return new Response(JSON.stringify({ srt: cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("correct-subtitle error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
