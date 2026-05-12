# Roadmap — ideias de ferramentas

Lugar único pra registrar tudo que pode vir a entrar no Hiro OS,
ordenado por impacto percebido pra uma produtora de vídeo. Atualiza
quando inicia, conclui, ou quando uma ideia muda de tier.

> Status: `🔵 idea` · `🟡 em design` · `🟢 em construção` · `✅ entregue` · `⚪️ adiado`

---

## 🚀 Em construção / recente

| ferramenta | status | notas |
|---|---|---|
| Caixa de Entrada | 🟢 **em produção** · backend Supabase + realtime · 1 trigger ativo (`task_assigned`) | Mais triggers virão: loan overdue, proposal viewed, pp new_version, deal status_change, etc. |
| Jurídico/Contratos | 🟡 UI pronta · **escondida em produção** | Aguarda backend Supabase + integração ZapSign webhook (modelo shadow) |

> **Re-habilitar Jurídico em prod (quando backend ficar pronto):** descomentar a
> seção em `src/ds/nav-data.tsx`, rotas em `src/App.tsx` e o toggle em
> `src/pages/AdminPermissions.tsx`. Marcadores `// hidden until ... ships`.

---

## 🥇 Tier 1 — alto impacto pra produtora

### Time tracking + Rentabilidade por projeto
🔵 idea · **Por que importa**: descobre margem real por projeto. Hoje é estimativa.
- Marcação de horas por pessoa/projeto
- Cruza com orçamento aprovado + custos de freelancer + Capex
- Liga em: Projetos AV, Esteira, Orçamentos, Fornecedores

### Briefing / Pré-produção hub
🔵 idea · **Por que importa**: fecha o ciclo. Hoje começa "no meio" (orçamento ou projeto).
- Form de briefing → AI sugere treatment + storyboard + referências
- Vira projeto + orçamento + checklist com 1 click
- Liga: Marketing/Referências, Orçamentos, Projetos AV

### Cronograma master (Gantt multi-projeto)
🔵 idea · **Por que importa**: produtor enxerga conflitos antes que aconteçam.
- View de todos os projetos rolando
- Detecta conflito de equipamento, freelancer dobrado, deadline impossível
- Liga: Tarefas, Projetos AV, Retiradas, Fornecedores

### Call sheets / Diária de produção
🔵 idea · **Por que importa**: alto uso, alta percepção de valor.
- PDF gerado automático pro dia da gravação
- Horários, endereço, equipe, equipamento separado, talents, contatos
- Liga: Projetos AV (data + locação), Retiradas, Fornecedores

---

## 🥈 Tier 2 — valor real mas mais nichado

### Music & SFX library com tracking de licenças
🔵 idea · biblioteca interna + cada faixa rastreia licença vigente (uso/mídia/tempo)

### Contratos com e-signature
🔵 idea · templates (NDA, prestação serviço, freelancer) → cliente assina → arquivado. Integra com Clicksign/ZapSign/D4Sign.
> **Faz parte do módulo Jurídico** (ver abaixo)

### Portal do cliente
🔵 idea · cliente loga (link mágico), vê orçamentos, status, aprovação de vídeo, NFs

### Manutenção preventiva de equipamentos
🔵 idea · histórico de manutenção, próxima revisão, alerta na Caixa de Entrada

---

## 🥉 Tier 3 — qualidade de vida

### Wiki / Documentação interna
🔵 idea · processos do dia a dia, onboarding, FAQ. Hoje tem só Políticas formais.

### Aniversários + datas importantes
🔵 idea · aniversário do time, do cliente, contrato anual. Vira item na Caixa de Entrada.

### DRE expandido
🔵 idea · receita real vs custos, margem operacional, projeção. Vai além do Capex atual.

### Pesquisa de satisfação pós-projeto (NPS)
🔵 idea · form automático X dias após entrega. Score consolidado no Dashboard.

---

## 📦 Módulo Jurídico (em design)

Detalhado em discussão separada. Contém:
- Contratos (templates + e-signature)
- Direitos de imagem / cessão (talents)
- Licenças (música, SFX, footage)
- Documentos societários + CNDs com alertas de validade
- Compliance / LGPD básico
- (futuro) Marcas / IP, Processos / Disputas

---

## ⚪️ Adiado / dependências

| ferramenta | bloqueio |
|---|---|
| Etapa 2 Permissões → Supabase | Decisão de quando migrar do mock |
| Inbox triggers → Supabase | Idem |
| Auditoria queries Supabase | Sessão dedicada |
| Lighthouse local (browser logado) | Você roda no seu Chrome |
