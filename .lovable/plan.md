
# Hiro Chat — plano de construção

Chat interno tipo Slack pra equipe Hiro: **canais com membros** + **DMs 1-a-1**, **threads**, **reações**, **anexos**, **menções**, **indicador de leitura e digitando**, tudo **ao vivo** via Supabase Realtime.

Como é grande, divido em **3 fases entregáveis**. Cada fase é usável sozinha — se quiser parar depois da Fase 1 já tem um chat funcionando.

---

## O que vai ser construído

**Página nova:** `/chat` (rota dedicada) + `/chat/:conversationId` pra abrir conversa específica. Acesso pra todo `is_approved = true`; o que define quem vê o quê é a tabela de **membros do canal** (não roles).

**Layout (igual Slack):**

```text
┌────────────┬─────────────────────────────┐
│ Canais     │ #fort-videos-site           │
│  #geral    │ ─────────────────────────── │
│  #fort     │ [Hiro] mensagem aqui   12h  │
│  #posprod  │ [Gabriel] outra        12h  │
│            │   └─ thread (3 respostas)   │
│ DMs        │                             │
│  Gabriel   │ ─────────────────────────── │
│  Maria     │ [Compor mensagem ____ ↵]    │
└────────────┴─────────────────────────────┘
```

**Visual:** segue a DS interna (`ds-shell`, hairlines, HN Display, cantos retos, `--ds-*`). Não vou copiar o HTML do Claude Design 1:1 — uso ele como referência de layout (sidebar + thread, bolhas, tipografia) e adapto pros tokens existentes pra não destoar do resto da plataforma.

---

## Fase 1 — Chat base (texto + canais + DMs + realtime)

Já é um chat de verdade utilizável.

- Tabelas: `chat_conversations`, `chat_members`, `chat_messages`
- Página `/chat` com sidebar (lista de canais que sou membro + DMs) e área de mensagens
- Criar canal (admin) e abrir DM (qualquer membro com qualquer membro)
- Enviar / editar / apagar mensagem de texto + emoji nativo
- **Realtime**: novas mensagens aparecem instantâneo via `supabase.channel().on('postgres_changes')`
- Sem refresh, sem polling
- Badge de não lidas na sidebar (contador simples por conversa)
- Bloco no `Layout.tsx` pra mostrar contador global no menu lateral existente

## Fase 2 — Rica (anexos + menções + reações + leitura)

- Tabelas: `chat_reactions`, coluna `attachments jsonb` em `chat_messages`, `chat_read_state` (último `message_id` lido por usuário/conversa)
- Bucket Supabase Storage `chat-attachments` (privado, RLS por membership do canal)
- Anexos: imagem (preview inline), arquivo genérico (card com nome+tamanho)
- Menções `@nome` → cria `inbox_item` pra notificar fora do chat (integra com o sistema de inbox que já existe)
- Reações emoji (👍 ❤️ 😂 🎉 etc) com agregação por emoji
- "Visto por" — avatares pequenos abaixo da última mensagem que cada um leu

## Fase 3 — Threads + presença

- Tabela: `chat_messages.parent_message_id` (self-FK) + contador `reply_count`
- Painel lateral de thread (drawer da direita) ao clicar em "Responder na thread"
- Indicador "fulano está digitando..." via Realtime broadcast (canal efêmero, não persiste em DB)
- Presença online/offline na sidebar de membros (Realtime Presence)
- Gerenciar membros do canal (admin do canal adiciona/remove)

---

## Estrutura técnica (resumo pro lado técnico)

**Tabelas principais (Fase 1):**

- `chat_conversations` — `id, type ('channel'|'dm'), name, slug, created_by, created_at`
- `chat_members` — `conversation_id, user_id, role ('admin'|'member'), joined_at, last_read_message_id` (PK composto)
- `chat_messages` — `id, conversation_id, user_id, body text, edited_at, deleted_at, created_at`

**RLS (crítico):**
- `chat_members`: SELECT só vê linhas onde sou membro **OU** sou admin global
- `chat_conversations` SELECT: `EXISTS (chat_members WHERE conversation_id = id AND user_id = auth.uid())` (ou admin)
- `chat_messages` SELECT/INSERT: mesmo gate via função `is_chat_member(conversation_id, auth.uid())` SECURITY DEFINER pra evitar recursão de RLS
- INSERT em `chat_messages` exige `user_id = auth.uid()` E ser membro

**Realtime:**
- Subscribe em `chat_messages` filtrado por `conversation_id` da conversa aberta
- Subscribe em `chat_members` filtrado por `user_id = auth.uid()` (pra entrar em canais novos sem refresh)

**Arquivos novos:**

```text
src/pages/Chat.tsx                      ← rota principal
src/features/chat/
  components/
    ChatSidebar.tsx                     ← lista de canais + DMs
    ChatConversation.tsx                ← área de mensagens
    ChatMessage.tsx                     ← uma mensagem (bolha)
    ChatComposer.tsx                    ← input + envio
    NewChannelDialog.tsx
    NewDMDialog.tsx
  hooks/
    useConversations.ts
    useMessages.ts                      ← com subscription realtime
    useUnreadCounts.ts
    useChatMembership.ts
  types/chat.types.ts
```

**Integrações:**
- Sidebar (`src/ds/components/SidebarReal.tsx` ou nav-data) ganha item "Chat" com badge de não lidas
- Menções viram `inbox_item` (já existe a infra) na Fase 2

---

## O que NÃO vou tocar

- `src/features/proposals/components/public/*` — intocado
- `Auth.tsx` — intocado
- DS migration — todos os componentes novos já nascem na DS atual (hairlines, `--ds-*`, HN Display)
- Sem mexer em roles existentes — controle de acesso é por `chat_members`, não por `app_role`

---

## Riscos / o que pode quebrar

- **Nada quebra no que já existe** — feature 100% nova, adita tabelas/rotas/arquivos
- Realtime tem custo de conexão; com a equipe atual (~dezenas de pessoas) é tranquilo
- RLS recursiva é o ponto delicado: vou usar função SECURITY DEFINER `is_chat_member()` pra evitar (mesmo padrão do `has_role` que já está estabelecido no projeto)

---

## Sugestão de execução

Topo confirmar e eu já começo pela **Fase 1**. Quando ela estiver no ar e validada, partimos pra 2 e depois pra 3. Cada fase fecha em uma rodada de migração + código.

Quer que eu siga assim, ou prefere mudar a ordem (ex: anexos antes de threads)?
