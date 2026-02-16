import { useQuery } from '@tanstack/react-query';
import { mockCapexData, type CapexData } from '@/data/mockCapexData';

export function useCapexData() {
  const { data, isLoading } = useQuery({
    queryKey: ['capex-data'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return mockCapexData;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data ?? mockCapexData,
    loading: isLoading,
  };
}
