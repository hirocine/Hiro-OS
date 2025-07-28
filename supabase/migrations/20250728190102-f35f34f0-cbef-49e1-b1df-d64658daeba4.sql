-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  position TEXT,
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipments table
CREATE TABLE public.equipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('camera', 'audio', 'lighting', 'accessories')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance')),
  item_type TEXT NOT NULL DEFAULT 'main' CHECK (item_type IN ('main', 'accessory')),
  parent_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  serial_number TEXT,
  purchase_date DATE,
  last_maintenance DATE,
  description TEXT,
  image TEXT,
  value DECIMAL(10,2),
  patrimony_number TEXT,
  depreciated_value DECIMAL(10,2),
  receive_date DATE,
  store TEXT,
  invoice TEXT,
  current_loan_id UUID,
  current_borrower TEXT,
  last_loan_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  expected_end_date DATE NOT NULL,
  actual_end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  step TEXT NOT NULL DEFAULT 'pending_separation' CHECK (step IN ('pending_separation', 'separated', 'in_use', 'pending_verification', 'verified')),
  step_history JSONB DEFAULT '[]'::jsonb,
  responsible_name TEXT NOT NULL,
  responsible_email TEXT,
  department TEXT,
  equipment_count INTEGER DEFAULT 0,
  loan_ids UUID[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loans table
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  borrower_email TEXT,
  borrower_phone TEXT,
  department TEXT,
  project TEXT,
  loan_date DATE NOT NULL,
  expected_return_date DATE NOT NULL,
  actual_return_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
  notes TEXT,
  return_condition TEXT CHECK (return_condition IN ('excellent', 'good', 'fair', 'damaged')),
  return_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for equipments (all authenticated users can access)
CREATE POLICY "Authenticated users can view equipments" 
ON public.equipments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert equipments" 
ON public.equipments 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update equipments" 
ON public.equipments 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete equipments" 
ON public.equipments 
FOR DELETE 
TO authenticated
USING (true);

-- Create policies for projects (all authenticated users can access)
CREATE POLICY "Authenticated users can view projects" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert projects" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete projects" 
ON public.projects 
FOR DELETE 
TO authenticated
USING (true);

-- Create policies for loans (all authenticated users can access)
CREATE POLICY "Authenticated users can view loans" 
ON public.loans 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert loans" 
ON public.loans 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update loans" 
ON public.loans 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete loans" 
ON public.loans 
FOR DELETE 
TO authenticated
USING (true);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create policies for avatar uploads
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipments_updated_at
  BEFORE UPDATE ON public.equipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, position, department)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'position',
    NEW.raw_user_meta_data ->> 'department'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();