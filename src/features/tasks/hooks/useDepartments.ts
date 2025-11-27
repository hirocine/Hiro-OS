import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface Department {
  id: string;
  name: string;
  created_at: string;
}

export function useDepartments() {
  const queryClient = useQueryClient();

  // Fetch departments
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching departments', { error });
        throw error;
      }

      return data as Department[];
    },
  });

  // Create department
  const createDepartment = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('departments')
        .insert({ name: name.trim() })
        .select()
        .single();

      if (error) {
        logger.error('Error creating department', { error });
        throw error;
      }

      return data as Department;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Departamento criado com sucesso');
    },
    onError: (error: any) => {
      logger.error('Error in createDepartment mutation', { error });
      if (error.code === '23505') {
        toast.error('Este departamento já existe');
      } else {
        toast.error('Erro ao criar departamento');
      }
    },
  });

  return {
    departments,
    isLoading,
    createDepartment,
  };
}
