import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o Assistente Hiro, o assistente virtual inteligente do sistema de inventário e gestão da Hiro Film.

Você tem acesso aos dados de:
- Equipamentos (câmeras, lentes, áudio, iluminação, etc.) - incluindo nome, marca, status, data de compra, valor
- Projetos/Retiradas - informações sobre projetos de gravação
- Tarefas - tarefas da equipe e seus status
- Empréstimos - equipamentos emprestados e para quem

Responda de forma objetiva, útil e em português brasileiro.
Seja conciso mas completo. Use formatação markdown quando apropriado.
Se não encontrar informações específicas, diga que não encontrou mas sugira como o usuário pode buscar.

IMPORTANTE: Você só tem acesso a dados que o usuário tem permissão para ver. Não invente dados.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user's last message to understand context
    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop()?.content || "";
    
    // Fetch relevant data based on keywords in the question
    let contextData = "";
    const lowerMessage = lastUserMessage.toLowerCase();

    // Check for equipment-related queries
    if (lowerMessage.includes("equipamento") || lowerMessage.includes("câmera") || 
        lowerMessage.includes("lente") || lowerMessage.includes("comprado") ||
        lowerMessage.includes("compra") || lowerMessage.includes("inventário") ||
        lowerMessage.includes("marca") || lowerMessage.includes("status")) {
      
      const { data: equipments, error } = await supabase
        .from("equipments")
        .select("name, brand, category, subcategory, status, purchase_date, value, serial_number, patrimony_number, simplified_status")
        .limit(50);
      
      if (!error && equipments?.length) {
        contextData += `\n\n### Dados de Equipamentos (${equipments.length} itens):\n`;
        contextData += equipments.map(e => 
          `- ${e.name} (${e.brand}): ${e.category}/${e.subcategory}, Status: ${e.simplified_status || e.status}, Compra: ${e.purchase_date || 'N/A'}, Valor: R$ ${e.value || 'N/A'}`
        ).join("\n");
      }
    }

    // Check for project-related queries
    if (lowerMessage.includes("projeto") || lowerMessage.includes("retirada") || 
        lowerMessage.includes("gravação") || lowerMessage.includes("gravacao")) {
      
      const { data: projects, error } = await supabase
        .from("projects")
        .select("name, status, step, start_date, expected_end_date, responsible_name, equipment_count")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (!error && projects?.length) {
        contextData += `\n\n### Dados de Projetos/Retiradas (${projects.length} itens):\n`;
        contextData += projects.map(p => 
          `- ${p.name}: Status: ${p.status}, Etapa: ${p.step}, Início: ${p.start_date}, Responsável: ${p.responsible_name}, Equipamentos: ${p.equipment_count || 0}`
        ).join("\n");
      }
    }

    // Check for task-related queries
    if (lowerMessage.includes("tarefa") || lowerMessage.includes("pendente") || 
        lowerMessage.includes("atrasad") || lowerMessage.includes("urgente")) {
      
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("title, status, priority, due_date, department")
        .order("created_at", { ascending: false })
        .limit(30);
      
      if (!error && tasks?.length) {
        contextData += `\n\n### Dados de Tarefas (${tasks.length} itens):\n`;
        contextData += tasks.map(t => 
          `- ${t.title}: Status: ${t.status}, Prioridade: ${t.priority}, Prazo: ${t.due_date || 'Sem prazo'}, Depto: ${t.department || 'N/A'}`
        ).join("\n");
      }
    }

    // Check for loan-related queries
    if (lowerMessage.includes("empréstimo") || lowerMessage.includes("emprestado") || 
        lowerMessage.includes("devolver") || lowerMessage.includes("devolução")) {
      
      const { data: loans, error } = await supabase
        .from("loans")
        .select("equipment_name, borrower_name, loan_date, expected_return_date, status, project")
        .eq("status", "active")
        .limit(30);
      
      if (!error && loans?.length) {
        contextData += `\n\n### Empréstimos Ativos (${loans.length} itens):\n`;
        contextData += loans.map(l => 
          `- ${l.equipment_name}: Emprestado para ${l.borrower_name}, Projeto: ${l.project || 'N/A'}, Retorno previsto: ${l.expected_return_date}`
        ).join("\n");
      }
    }

    // If no specific context, provide general stats
    if (!contextData) {
      const [equipStats, projectStats, taskStats] = await Promise.all([
        supabase.from("equipments").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("tasks").select("id", { count: "exact", head: true }).in("status", ["pendente", "em_progresso"])
      ]);

      contextData = `\n\n### Resumo do Sistema:\n`;
      contextData += `- Total de equipamentos: ${equipStats.count || 0}\n`;
      contextData += `- Projetos ativos: ${projectStats.count || 0}\n`;
      contextData += `- Tarefas pendentes: ${taskStats.count || 0}\n`;
      contextData += `\nPara informações mais específicas, faça uma pergunta sobre equipamentos, projetos, tarefas ou empréstimos.`;
    }

    // Prepare messages with context
    const enhancedMessages = [
      { role: "system", content: SYSTEM_PROMPT + contextData },
      ...messages
    ];

    // Call Lovable AI Gateway with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: enhancedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Entre em contato com o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua pergunta. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
