
-- =========================================
-- HIRO CHAT — Fase 1 (base: canais + DMs + msgs + realtime)
-- =========================================

-- 1) CONVERSATIONS -------------------------------------------------
CREATE TABLE public.chat_conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL CHECK (type IN ('channel','dm')),
  name        text,                 -- nome do canal (#fort-videos). null pra DM
  slug        text UNIQUE,          -- url-friendly do canal. null pra DM
  description text,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz
);

CREATE INDEX idx_chat_conversations_type ON public.chat_conversations(type);
CREATE INDEX idx_chat_conversations_last_msg ON public.chat_conversations(last_message_at DESC NULLS LAST);

-- 2) MEMBERS -------------------------------------------------------
CREATE TABLE public.chat_members (
  conversation_id       uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role                  text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  joined_at             timestamptz NOT NULL DEFAULT now(),
  last_read_message_id  uuid,
  last_read_at          timestamptz,
  muted                 boolean NOT NULL DEFAULT false,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_chat_members_user ON public.chat_members(user_id);
CREATE INDEX idx_chat_members_conv ON public.chat_members(conversation_id);

-- 3) MESSAGES ------------------------------------------------------
CREATE TABLE public.chat_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            text NOT NULL,
  edited_at       timestamptz,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_conv_created ON public.chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);

-- 4) HELPER FUNCTIONS ---------------------------------------------
-- SECURITY DEFINER evita recursão de RLS (mesmo padrão do has_role)
CREATE OR REPLACE FUNCTION public.is_chat_member(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
  );
$$;

-- bump conversations.last_message_at quando uma mensagem é criada
CREATE OR REPLACE FUNCTION public.bump_chat_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_conversations
     SET last_message_at = NEW.created_at,
         updated_at = now()
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_chat_conversation_on_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_chat_conversation_on_message();

-- updated_at touch
CREATE TRIGGER trg_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) RLS -----------------------------------------------------------
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages      ENABLE ROW LEVEL SECURITY;

-- chat_conversations
CREATE POLICY "members can view their conversations"
ON public.chat_conversations FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.is_chat_member(id, auth.uid())
);

CREATE POLICY "approved users can create conversations"
ON public.chat_conversations FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles
              WHERE user_id = auth.uid() AND is_approved = true)
  -- só admin pode criar CANAL; DM pode qualquer aprovado
  AND (type = 'dm' OR public.has_role(auth.uid(),'admin'::app_role))
);

CREATE POLICY "admins of conversation can update"
ON public.chat_conversations FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.chat_members
             WHERE conversation_id = id
               AND user_id = auth.uid()
               AND role = 'admin')
);

CREATE POLICY "global admins can delete conversations"
ON public.chat_conversations FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role));

-- chat_members
CREATE POLICY "see members of conversations I'm in"
ON public.chat_members FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR user_id = auth.uid()
  OR public.is_chat_member(conversation_id, auth.uid())
);

-- INSERT: criador inicial da conversa adiciona membros (inclusive ele próprio);
-- admin do canal adiciona; admin global adiciona.
CREATE POLICY "add members to conversation"
ON public.chat_members FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'admin'::app_role)
  -- sou criador da conversa
  OR EXISTS (SELECT 1 FROM public.chat_conversations c
             WHERE c.id = conversation_id AND c.created_by = auth.uid())
  -- sou admin desta conversa
  OR EXISTS (SELECT 1 FROM public.chat_members
             WHERE conversation_id = chat_members.conversation_id
               AND user_id = auth.uid()
               AND role = 'admin')
);

CREATE POLICY "update my own membership row"
ON public.chat_members FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(),'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.chat_members m2
             WHERE m2.conversation_id = chat_members.conversation_id
               AND m2.user_id = auth.uid()
               AND m2.role = 'admin')
);

CREATE POLICY "remove member from conversation"
ON public.chat_members FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()  -- sair sozinho
  OR public.has_role(auth.uid(),'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.chat_members m2
             WHERE m2.conversation_id = chat_members.conversation_id
               AND m2.user_id = auth.uid()
               AND m2.role = 'admin')
);

-- chat_messages
CREATE POLICY "members can read messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.is_chat_member(conversation_id, auth.uid())
);

CREATE POLICY "members can send messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.is_chat_member(conversation_id, auth.uid())
);

CREATE POLICY "authors can update own messages"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "authors or global admin can delete"
ON public.chat_messages FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(),'admin'::app_role)
);

-- 6) REALTIME PUBLICATION -----------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- garantir REPLICA IDENTITY FULL pra UPDATE/DELETE chegarem completos
ALTER TABLE public.chat_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.chat_members       REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages      REPLICA IDENTITY FULL;

-- 7) SEED do canal #geral -----------------------------------------
-- Cria o canal #geral com TODOS os usuários aprovados como membros.
DO $$
DECLARE
  v_conv_id uuid;
  v_first_admin uuid;
BEGIN
  -- pega o primeiro admin como "created_by" simbólico
  SELECT ur.user_id INTO v_first_admin
    FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
   WHERE ur.role = 'admin' AND p.is_approved = true
   ORDER BY ur.created_at NULLS LAST
   LIMIT 1;

  IF v_first_admin IS NULL THEN
    RETURN; -- sem admin aprovado, pula o seed
  END IF;

  INSERT INTO public.chat_conversations (type, name, slug, description, created_by)
  VALUES ('channel','geral','geral','Canal geral da Hiro', v_first_admin)
  RETURNING id INTO v_conv_id;

  INSERT INTO public.chat_members (conversation_id, user_id, role)
  SELECT v_conv_id, p.user_id,
         CASE WHEN p.user_id = v_first_admin THEN 'admin' ELSE 'member' END
    FROM public.profiles p
   WHERE p.is_approved = true;
END $$;
