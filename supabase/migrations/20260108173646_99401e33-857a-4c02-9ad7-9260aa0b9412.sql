-- Create table for withdrawal drafts
CREATE TABLE public.withdrawal_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 1,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_drafts ENABLE ROW LEVEL SECURITY;

-- RLS: Each user can only manage their own drafts
CREATE POLICY "Users can view own drafts" ON public.withdrawal_drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drafts" ON public.withdrawal_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts" ON public.withdrawal_drafts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts" ON public.withdrawal_drafts
  FOR DELETE USING (auth.uid() = user_id);

-- Index for fast user lookup
CREATE INDEX idx_withdrawal_drafts_user_id ON public.withdrawal_drafts(user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_withdrawal_drafts_updated_at
  BEFORE UPDATE ON public.withdrawal_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();