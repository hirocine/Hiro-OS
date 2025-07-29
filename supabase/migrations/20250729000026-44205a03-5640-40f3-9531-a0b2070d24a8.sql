-- Grant admin role to current user for testing
INSERT INTO public.user_roles (user_id, role) 
VALUES ('0cfed947-81df-4c9b-a134-2144215597ae', 'admin')
ON CONFLICT (user_id, role) DO UPDATE SET role = 'admin';