import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o Hiro, o assistente inteligente do Hiro OS® — sistema de gestão da Hiro Films, produtora audiovisual premium de São Paulo.

Você tem acesso a ferramentas para consultar dados reais da plataforma. Use-as sempre que o usuário pedir informações específicas.

PERSONALIDADE:
- Direto, profissional, mas com um toque humano
- Conhece o universo de produção audiovisual
- Responde sempre em português brasileiro

FORMATAÇÃO:
- Use markdown com moderação
- Para listas de resultados, use bullet points limpos
- Para valores financeiros, sempre formate como "R$ X.XXX,XX"

PROPOSTAS / ORÇAMENTOS:
- Todas as propostas retornadas pela ferramenta já são a versão mais recente (is_latest_version=true)
- Status "new_version" significa que esta proposta FOI CRIADA como nova versão de uma anterior — ela É a versão atual e deve ser considerada ativa
- Quando o usuário perguntar por propostas "ativas", inclua TODOS os status exceto "expired" (arquivada) e "draft" (rascunho), ou seja: sent, opened, approved, new_version

LINKS NAVEGÁVEIS:
Quando mencionar um item específico, sempre inclua ao final da linha:
- Proposta: [LINK:/orcamentos/SLUG/overview]
- Projeto: [LINK:/retiradas]
- Tarefa: [LINK:/tarefas]
- Equipamento: [LINK:/inventario]
- Fornecedor: [LINK:/fornecedores]
- Política: [LINK:/politicas]
- Plataforma: [LINK:/plataformas]
- Esteira de Pós: [LINK:/pos-producao]
- Armazenamento/SSD: [LINK:/armazenamento]
- Projeto AV: [LINK:/projetos-av]

IMPORTANTE: Nunca invente dados. Se não encontrar, diga claramente.`;

const tools: Anthropic.Tool[] = [
  {
    name: "search_proposals",
    description: "Busca orçamentos/propostas por cliente, nome do projeto ou status.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Termo de busca: nome do cliente ou projeto" },
        status: { type: "string", description: "Filtrar por status: draft, sent, opened, approved, expired" }
      }
    }
  },
  {
    name: "search_equipment",
    description: "Busca equipamentos no inventário por nome, marca, categoria ou status.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Nome, marca ou categoria do equipamento" },
        status: { type: "string", description: "Status: available, borrowed, maintenance" }
      }
    }
  },
  {
    name: "search_projects",
    description: "Busca retiradas/projetos de gravação por nome, responsável ou status.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Nome do projeto ou responsável" },
        status: { type: "string", description: "Status do projeto" }
      }
    }
  },
  {
    name: "search_tasks",
    description: "Busca tarefas por título, prioridade ou status.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Título da tarefa" },
        priority: { type: "string", description: "Prioridade: urgente, alta, media, baixa" },
        status: { type: "string", description: "Status: pendente, em_progresso, concluida" }
      }
    }
  },
  {
    name: "get_platform_summary",
    description: "Retorna um resumo geral da plataforma: orçamentos, equipamentos, projetos, tarefas.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "get_active_loans",
    description: "Lista equipamentos atualmente emprestados e para quem.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Filtrar por nome de equipamento ou pessoa" }
      }
    }
  },
  {
    name: "get_proposals_expiring_soon",
    description: "Lista orçamentos que vencem nos próximos dias.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Quantos dias à frente verificar (padrão: 7)" }
      }
    }
  },
  {
    name: "search_suppliers",
    description: "Busca fornecedores e freelancers cadastrados por nome, especialidade ou tipo.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Nome ou especialidade do fornecedor" },
        role: { type: "string", description: "Função principal: ex. Cinegrafista, Editor, Fotógrafo" }
      }
    }
  },
  {
    name: "search_policies",
    description: "Busca políticas e documentos internos da empresa por título ou categoria.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Título ou assunto da política" }
      }
    }
  },
  {
    name: "search_platform_accesses",
    description: "Busca acessos e credenciais de plataformas cadastradas. NUNCA mostre senhas — mostre apenas que existe o acesso.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Nome da plataforma ou serviço" }
      }
    }
  },
  {
    name: "get_post_production_queue",
    description: "Lista os vídeos na esteira de pós-produção, seus status e editores responsáveis.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Filtrar por título ou editor" },
        status: { type: "string", description: "Status do vídeo na esteira" }
      }
    }
  },
  {
    name: "get_ssds_status",
    description: "Mostra o status dos SSDs — quais estão livres, em uso ou com quem estão.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Filtrar por nome do SSD" }
      }
    }
  },
  {
    name: "search_av_projects",
    description: "Busca projetos audiovisuais por título, empresa ou status.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Título ou empresa do projeto" },
        status: { type: "string", description: "Status do projeto" }
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const executeTool = async (toolName: string, toolInput: any): Promise<string> => {
      try {
        if (toolName === "search_proposals") {
          let q = supabase.from("orcamentos").select(
            "id, slug, project_name, client_name, final_value, status, validity_date, version, is_latest_version"
          ).eq("is_latest_version", true);

          if (toolInput.query) {
            q = q.or(`client_name.ilike.%${toolInput.query}%,project_name.ilike.%${toolInput.query}%`);
          }
          if (toolInput.status) q = q.eq("status", toolInput.status);
          q = q.order("created_at", { ascending: false }).limit(10);

          const { data, error } = await q;
          if (error) return `Erro: ${error.message}`;
          if (!data?.length) return "Nenhum orçamento encontrado.";

          const statusLabels: Record<string, string> = {
            draft: "Rascunho", sent: "Enviada", opened: "Aberta",
            approved: "Aprovada", expired: "Arquivada", new_version: "Nova Versão"
          };

          return data.map((p: any) =>
            `- **${p.project_name}** (${p.client_name}) · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.final_value || 0)} · ${statusLabels[p.status] || p.status}${p.version > 1 ? ` · v${p.version}` : ""} · Validade: ${p.validity_date ? new Date(p.validity_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"} [LINK:/orcamentos/${p.slug}/overview]`
          ).join("\n");
        }

        if (toolName === "search_equipment") {
          let q = supabase.from("equipments").select(
            "name, brand, category, subcategory, simplified_status, status, value"
          );
          if (toolInput.query) {
            q = q.or(`name.ilike.%${toolInput.query}%,brand.ilike.%${toolInput.query}%,category.ilike.%${toolInput.query}%`);
          }
          if (toolInput.status) q = q.eq("simplified_status", toolInput.status);
          q = q.limit(15);

          const { data, error } = await q;
          if (error) return `Erro: ${error.message}`;
          if (!data?.length) return "Nenhum equipamento encontrado.";

          return (data as any[]).map(e =>
            `- **${e.name}** (${e.brand}) · ${e.category} · Status: ${e.simplified_status || e.status} · R$ ${e.value?.toLocaleString("pt-BR") || "N/A"} [LINK:/inventario]`
          ).join("\n");
        }

        if (toolName === "search_projects") {
          let q = supabase.from("projects").select(
            "id, name, status, step, start_date, responsible_name, equipment_count"
          ).order("created_at", { ascending: false });

          if (toolInput.query) {
            q = q.or(`name.ilike.%${toolInput.query}%,responsible_name.ilike.%${toolInput.query}%`);
          }
          if (toolInput.status) q = q.eq("status", toolInput.status);
          q = q.limit(10);

          const { data, error } = await q;
          if (error) return `Erro: ${error.message}`;
          if (!data?.length) return "Nenhum projeto encontrado.";

          return (data as any[]).map(p =>
            `- **${p.name}** · ${p.status} · Responsável: ${p.responsible_name || "—"} · ${p.equipment_count || 0} equipamentos [LINK:/retiradas]`
          ).join("\n");
        }

        if (toolName === "search_tasks") {
          let q = supabase.from("tasks").select(
            "id, title, status, priority, due_date"
          ).order("created_at", { ascending: false });

          if (toolInput.query) q = q.ilike("title", `%${toolInput.query}%`);
          if (toolInput.priority) q = q.eq("priority", toolInput.priority);
          if (toolInput.status) q = q.eq("status", toolInput.status);
          q = q.limit(15);

          const { data, error } = await q;
          if (error) return `Erro: ${error.message}`;
          if (!data?.length) return "Nenhuma tarefa encontrada.";

          return (data as any[]).map(t =>
            `- **${t.title}** · ${t.status} · Prioridade: ${t.priority || "—"} · Prazo: ${t.due_date ? new Date(t.due_date).toLocaleDateString("pt-BR") : "Sem prazo"} [LINK:/tarefas]`
          ).join("\n");
        }

        if (toolName === "get_platform_summary") {
          const [proposals, equipment, projects, tasks, loans] = await Promise.all([
            supabase.from("orcamentos").select("id, status, final_value").eq("is_latest_version", true),
            supabase.from("equipments").select("id, simplified_status"),
            supabase.from("projects").select("id, status").eq("status", "active"),
            supabase.from("tasks").select("id, status, priority").in("status", ["pendente", "em_progresso"]),
            supabase.from("loans").select("id").eq("status", "active"),
          ]);

          const activeProposals = (proposals.data || []).filter((p: any) => ["sent", "opened", "new_version"].includes(p.status));
          const totalPipeline = activeProposals.reduce((sum: number, p: any) => sum + (p.final_value || 0), 0);
          const urgentTasks = (tasks.data || []).filter((t: any) => t.priority === "urgente").length;
          const availableEquipment = (equipment.data || []).filter((e: any) => e.simplified_status === "available").length;

          return `**Resumo do Hiro OS® agora:**
- 📋 Orçamentos ativos: ${activeProposals.length} · Pipeline: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPipeline)}
- 📦 Equipamentos disponíveis: ${availableEquipment} de ${(equipment.data || []).length} total
- 🎬 Projetos/Retiradas ativas: ${(projects.data || []).length}
- ✅ Tarefas pendentes: ${(tasks.data || []).length} (${urgentTasks} urgentes)
- 🔄 Empréstimos ativos: ${(loans.data || []).length}`;
        }

        if (toolName === "get_active_loans") {
          let q = supabase.from("loans").select(
            "equipment_name, borrower_name, loan_date, expected_return_date, project"
          ).eq("status", "active").order("loan_date", { ascending: false });

          if (toolInput.query) {
            q = q.or(`equipment_name.ilike.%${toolInput.query}%,borrower_name.ilike.%${toolInput.query}%`);
          }

          const { data, error } = await q;
          if (error) return `Erro: ${error.message}`;
          if (!data?.length) return "Nenhum equipamento emprestado no momento.";

          return (data as any[]).map(l =>
            `- **${l.equipment_name}** → ${l.borrower_name} · Projeto: ${l.project || "—"} · Devolução: ${l.expected_return_date ? new Date(l.expected_return_date).toLocaleDateString("pt-BR") : "—"} [LINK:/inventario]`
          ).join("\n");
        }

        if (toolName === "get_proposals_expiring_soon") {
          const days = toolInput.days || 7;
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + days);
          const today = new Date().toLocaleDateString("en-CA");
          const future = futureDate.toLocaleDateString("en-CA");

          const { data, error } = await supabase.from("orcamentos")
            .select("slug, project_name, client_name, final_value, validity_date, status")
            .eq("is_latest_version", true)
            .in("status", ["sent", "opened"])
            .gte("validity_date", today)
            .lte("validity_date", future)
            .order("validity_date", { ascending: true });

          if (error) return `Erro: ${error.message}`;
          if (!data?.length) return `Nenhum orçamento vence nos próximos ${days} dias.`;

          return (data as any[]).map(p =>
            `- **${p.project_name}** (${p.client_name}) · Vence: ${new Date(p.validity_date + "T12:00:00").toLocaleDateString("pt-BR")} · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.final_value || 0)} [LINK:/orcamentos/${p.slug}/overview]`
          ).join("\n");
        }

        return "Ferramenta não reconhecida.";
      } catch (err) {
        return `Erro: ${err}`;
      }
    };

    // Agentic loop
    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    let finalText = "";
    let loopMessages = [...anthropicMessages];
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages: loopMessages,
      });

      const currentText = response.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("");

      if (response.stop_reason === "end_turn") {
        finalText = currentText;
        break;
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter((b: any) => b.type === "tool_use");
        if (!toolUseBlocks.length) {
          finalText = currentText;
          break;
        }

        loopMessages.push({ role: "assistant", content: response.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of toolUseBlocks) {
          if (block.type !== "tool_use") continue;
          const result = await executeTool((block as any).name, (block as any).input);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }

        loopMessages.push({ role: "user", content: toolResults });
      } else {
        finalText = currentText;
        break;
      }
    }

    return new Response(JSON.stringify({ text: finalText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
