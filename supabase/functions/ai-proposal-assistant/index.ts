import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o assistente de propostas da Hiro Films, uma produtora audiovisual premium de São Paulo.

## Sobre a Hiro Films
- Produtora audiovisual boutique focada em conteúdo premium para marcas
- Especializada em vídeos institucionais, campanhas publicitárias, conteúdo digital e eventos
- Clientes incluem grandes marcas e empresários de destaque
- Posicionamento: qualidade cinematográfica com storytelling estratégico
- Equipe enxuta e ágil, atendimento personalizado

## Faixas de preço típicas
- Vídeo institucional simples: R$ 8.000 – R$ 25.000
- Campanha publicitária: R$ 25.000 – R$ 80.000
- Série de conteúdo digital (pacote mensal): R$ 15.000 – R$ 50.000
- Cobertura de evento: R$ 5.000 – R$ 20.000
- Projetos especiais / premium: R$ 80.000+

## Como responder
- Sempre em português brasileiro
- Tom profissional mas acessível
- Foque em dados reais e verificáveis sobre a empresa do cliente
- Seja objetivo e direto`;

async function callAnthropic(
  messages: { role: string; content: string }[],
  tools?: any[],
  apiKey?: string
) {
  const body: any = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages,
  };
  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Anthropic error:", res.status, errText);
    throw new Error(`Anthropic API error: ${res.status}`);
  }

  return await res.json();
}

async function callLovableGateway(
  messages: { role: string; content: string }[],
  apiKey: string
) {
  const res = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error("Lovable gateway error:", res.status, errText);
    throw new Error(`Lovable AI error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

function extractTextFromAnthropicResponse(response: any): string {
  if (!response?.content) return "";
  for (const block of response.content) {
    if (block.type === "text") return block.text;
  }
  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const useAnthropic = !!anthropicKey;

    if (!anthropicKey && !lovableKey) {
      return new Response(
        JSON.stringify({ error: "No AI API key configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result: any;

    if (action === "enrich_client") {
      const { client_name } = params;
      if (!client_name) {
        return new Response(
          JSON.stringify({ error: "client_name is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const prompt = `Pesquise sobre a empresa "${client_name}" e escreva um parágrafo curto (2-3 frases) descrevendo o que a empresa faz, seu segmento de atuação e posicionamento. Esse texto será usado como subtítulo de uma proposta comercial da Hiro Films para esse cliente. Responda APENAS com o parágrafo descritivo, sem prefixos ou explicações.`;

      if (useAnthropic) {
        const response = await callAnthropic(
          [{ role: "user", content: prompt }],
          [{ type: "web_search_20250305", name: "web_search" }],
          anthropicKey
        );
        result = {
          company_description: extractTextFromAnthropicResponse(response),
        };
      } else {
        const text = await callLovableGateway(
          [{ role: "user", content: prompt }],
          lovableKey!
        );
        result = { company_description: text };
      }
    } else if (action === "parse_transcript") {
      const { transcript } = params;
      if (!transcript) {
        return new Response(
          JSON.stringify({ error: "transcript is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const prompt = `Analise a transcrição abaixo de uma reunião de briefing entre a Hiro Films e um cliente. Extraia as informações estruturadas e retorne APENAS um JSON válido (sem markdown, sem blocos de código) com os campos:

{
  "client_name": "nome da empresa cliente",
  "project_name": "nome do projeto ou campanha",
  "client_responsible": "nome da pessoa de contato do cliente",
  "objetivo": "texto descritivo do objetivo estratégico do projeto (2-4 parágrafos)",
  "diagnostico_dores": [
    { "label": "RÓTULO CURTO", "title": "Título da dor", "desc": "Descrição detalhada" }
  ],
  "entregaveis": [
    { "titulo": "Nome do entregável", "descricao": "Descrição breve", "quantidade": "1", "icone": "🎬" }
  ]
}

Se algum campo não puder ser identificado, use string vazia ou array vazio. Para diagnostico_dores, extraia até 3 dores. Para entregaveis, liste todos os mencionados.

TRANSCRIÇÃO:
${transcript}`;

      if (useAnthropic) {
        const response = await callAnthropic(
          [{ role: "user", content: prompt }],
          [],
          anthropicKey
        );
        const text = extractTextFromAnthropicResponse(response);
        try {
          result = JSON.parse(text);
        } catch {
          // Try to extract JSON from the text
          const match = text.match(/\{[\s\S]*\}/);
          result = match ? JSON.parse(match[0]) : { error: "Could not parse response" };
        }
      } else {
        const text = await callLovableGateway(
          [{ role: "user", content: prompt }],
          lovableKey!
        );
        try {
          result = JSON.parse(text);
        } catch {
          const match = text.match(/\{[\s\S]*\}/);
          result = match ? JSON.parse(match[0]) : { error: "Could not parse response" };
        }
      }
    } else if (action === "suggest_pain_points") {
      const { client_name, project_name, objetivo } = params;

      const prompt = `Com base no contexto abaixo, sugira exatamente 3 "dores" (pain points) que o cliente pode estar enfrentando e que a Hiro Films pode resolver com produção audiovisual. Retorne APENAS um JSON válido (sem markdown, sem blocos de código) como array:

[
  { "label": "RÓTULO CURTO EM CAPS", "title": "Título conciso da dor", "desc": "Descrição em 1-2 frases de como essa dor impacta o negócio do cliente" }
]

Contexto:
- Cliente: ${client_name || "Não informado"}
- Projeto: ${project_name || "Não informado"}
- Objetivo: ${objetivo || "Não informado"}`;

      if (useAnthropic) {
        const response = await callAnthropic(
          [{ role: "user", content: prompt }],
          [{ type: "web_search_20250305", name: "web_search" }],
          anthropicKey
        );
        const text = extractTextFromAnthropicResponse(response);
        try {
          result = { diagnostico_dores: JSON.parse(text) };
        } catch {
          const match = text.match(/\[[\s\S]*\]/);
          result = match
            ? { diagnostico_dores: JSON.parse(match[0]) }
            : { diagnostico_dores: [] };
        }
      } else {
        const text = await callLovableGateway(
          [{ role: "user", content: prompt }],
          lovableKey!
        );
        try {
          result = { diagnostico_dores: JSON.parse(text) };
        } catch {
          const match = text.match(/\[[\s\S]*\]/);
          result = match
            ? { diagnostico_dores: JSON.parse(match[0]) }
            : { diagnostico_dores: [] };
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-proposal-assistant error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
