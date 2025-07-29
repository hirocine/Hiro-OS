-- Phase 1: Fix Critical Privilege Escalation
-- Update user_roles policies to prevent self-role-elevation

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create secure policies for user_roles
CREATE POLICY "Admins can insert roles for others" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND user_id != auth.uid()  -- Prevent self-role-elevation
);

CREATE POLICY "Admins can update roles for others" 
ON public.user_roles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND user_id != auth.uid()  -- Prevent self-role-elevation
);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Phase 2: Fix Overly Permissive RLS Policies
-- Update equipments table policies

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can delete equipments" ON public.equipments;
DROP POLICY IF EXISTS "Authenticated users can insert equipments" ON public.equipments;
DROP POLICY IF EXISTS "Authenticated users can update equipments" ON public.equipments;
DROP POLICY IF EXISTS "Authenticated users can view equipments" ON public.equipments;

-- Create secure equipment policies
CREATE POLICY "All authenticated users can view equipments" 
ON public.equipments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can insert equipments" 
ON public.equipments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update equipments" 
ON public.equipments 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete equipments" 
ON public.equipments 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update projects table policies
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;

-- Create secure project policies
CREATE POLICY "All authenticated users can view projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can insert projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete projects" 
ON public.projects 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update loans table policies
DROP POLICY IF EXISTS "Authenticated users can delete loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can insert loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can update loans" ON public.loans;
DROP POLICY IF EXISTS "Authenticated users can view loans" ON public.loans;

-- Create secure loan policies
CREATE POLICY "All authenticated users can view loans" 
ON public.loans 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can insert loans" 
ON public.loans 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update loans" 
ON public.loans 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete loans" 
ON public.loans 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create enhanced audit logging function for role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes with enhanced security info
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'role_change',
      'user_roles',
      NEW.user_id::text,
      jsonb_build_object('old_role', OLD.role),
      jsonb_build_object('new_role', NEW.role, 'changed_user_id', NEW.user_id)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;