-- Create storage bucket for platform icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('platform-icons', 'platform-icons', true);

-- RLS policies for platform-icons bucket
CREATE POLICY "Authenticated users can upload icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'platform-icons');

CREATE POLICY "Anyone can view icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'platform-icons');

CREATE POLICY "Users can update their own icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'platform-icons' AND owner = auth.uid());

CREATE POLICY "Users can delete their own icons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'platform-icons' AND owner = auth.uid());

-- Create enum for platform categories
CREATE TYPE platform_category AS ENUM (
  'development',
  'infrastructure', 
  'design',
  'communication',
  'analytics',
  'storage',
  'other'
);

-- Create platform_accesses table
CREATE TABLE platform_accesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL,
  platform_icon_url TEXT,
  platform_url TEXT NOT NULL,
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  notes TEXT,
  category platform_category DEFAULT 'other',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_platform_accesses_user_id ON platform_accesses(user_id);
CREATE INDEX idx_platform_accesses_category ON platform_accesses(category);
CREATE INDEX idx_platform_accesses_is_favorite ON platform_accesses(is_favorite);
CREATE INDEX idx_platform_accesses_platform_name ON platform_accesses(platform_name);

-- Trigger for updated_at
CREATE TRIGGER update_platform_accesses_updated_at
  BEFORE UPDATE ON platform_accesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE platform_accesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can view all accesses (team sharing)
CREATE POLICY "Authenticated users can view all accesses"
ON platform_accesses FOR SELECT
TO authenticated
USING (true);

-- Users can create their own accesses
CREATE POLICY "Users can create own accesses"
ON platform_accesses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own accesses
CREATE POLICY "Users can update own accesses"
ON platform_accesses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete only their own accesses
CREATE POLICY "Users can delete own accesses"
ON platform_accesses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all accesses
CREATE POLICY "Admins can manage all accesses"
ON platform_accesses FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));