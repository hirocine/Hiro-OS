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
  "pt-PT": "Portuguese (European)",
  "en": "English",
  "es": "Spanish",
  "fr": "French",
  "it": "Italian",
  "de": "German",
  "ja": "Japanese",
};

const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_NAMES);

function buildPrompt(opts: {
  srt: string;
  aspectRatio: string;
  sourceLanguage: string;
  targetLanguage: string;
  maxCharsPerLine: number;
  maxLines: number;
  glossary: string[];
}): string {
  const sourceName = LANGUAGE_NAMES[opts.sourceLanguage] ?? opts.sourceLanguage;
  const targetName = LANGUAGE_NAMES[opts.targetLanguage] ?? opts.targetLanguage;
  const isTranslation = opts.sourceLanguage !== opts.targetLanguage;

  const glossaryBlock = opts.glossary.length
    ? `\n<glossary>\n${opts.glossary.map((t) => `- ${t}`).join("\n")}\n</glossary>\n\nUse the exact spelling from the glossary above whenever those terms appear (in any language).\n`
    : "";

  const task = isTranslation
    ? `The user uploaded an SRT file with speech in ${sourceName} and wants the subtitles in ${targetName} for a ${opts.aspectRatio} video. Translate the speech faithfully and produce clean subtitles in ${targetName}.`
    : `The user uploaded an SRT file in ${sourceName} and needs it cleaned up for a ${opts.aspectRatio} video.`;

  const rules = isTranslation
    ? `Rules:
- Preserve every timecode exactly. Never change the timing lines.
- Preserve the cue numbering and order.
- Translate the speech naturally into ${targetName}. Don't paraphrase or expand — match the speaker's tone and register.
- Use correct punctuation, capitalization, and accents for ${targetName}.
- Add ellipses (…) when a cue trails off into the next.
- Re-break lines so no line exceeds ${opts.maxCharsPerLine} characters and no cue has more than ${opts.maxLines} lines. Prefer breaking at natural pause points (after punctuation, between clauses).
- If a cue is too long for ${opts.maxLines} lines at ${opts.maxCharsPerLine} chars/line, leave it as a single readable block — splitting cues would change timing.
- Keep filler words ("um", "uh", "you know") only if culturally appropriate in ${targetName}; otherwise drop them naturally.${glossaryBlock}`
    : `Rules:
- Preserve every timecode exactly. Never change the timing lines.
- Preserve the cue numbering and order.
- Preserve what the speaker actually said. Don't paraphrase or summarize. You are correcting the *transcription*, not rewriting it.
- Fix obvious transcription errors (mishears, missing accents, wrong proper nouns) only when you are confident.
- Fix punctuation: capitalization, periods, commas, question marks. Add ellipses (…) when a cue trails off into the next.
- Re-break lines so no line exceeds ${opts.maxCharsPerLine} characters and no cue has more than ${opts.maxLines} lines. Prefer breaking at natural pause points (after punctuation, between clauses).
- If a cue is too long for ${opts.maxLines} lines at ${opts.maxCharsPerLine} chars/line, leave it as-is — splitting cues would change timing.
- Keep filler words ("um", "uh", "tipo", "né", "you know") if they're clearly there. The user can ask to remove them separately.${glossaryBlock}`;

  return `You are a professional subtitle editor. ${task}

${rules}

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
    const aspectRatio = ["16:9", "9:16", "1:1", "4:5"].includes(body?.aspectRatio) ? body.aspectRatio : "16:9";
    const sourceLanguage = SUPPORTED_LANGUAGES.includes(body?.sourceLanguage) ? body.sourceLanguage : "pt-BR";
    const targetLanguage = SUPPORTED_LANGUAGES.includes(body?.targetLanguage) ? body.targetLanguage : sourceLanguage;
    const maxCharsPerLine = Math.min(80, Math.max(10, Number(body?.maxCharsPerLine) || 42));
    const maxLines = Math.min(4, Math.max(1, Number(body?.maxLines) || 2));
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

    const prompt = buildPrompt({ srt, aspectRatio, sourceLanguage, targetLanguage, maxCharsPerLine, maxLines, glossary });

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
