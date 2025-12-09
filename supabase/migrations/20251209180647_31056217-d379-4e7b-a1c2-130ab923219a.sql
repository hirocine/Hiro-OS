-- Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text,
  photo_url text,
  tags text[] DEFAULT '{}',
  display_order integer DEFAULT 999,
  is_visible boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view visible team members
CREATE POLICY "Authenticated users can view visible team members"
  ON public.team_members FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_visible = true);

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage team members"
  ON public.team_members FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();