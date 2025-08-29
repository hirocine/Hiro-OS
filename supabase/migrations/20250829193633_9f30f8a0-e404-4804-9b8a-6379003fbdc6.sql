-- Remove the overly permissive RLS policy that allows all users to view loan data
DROP POLICY IF EXISTS "Users can view basic loan info" ON public.loans;

-- Ensure only the admin-only SELECT policy remains
-- (The "Admins can view all loans" policy should already exist)