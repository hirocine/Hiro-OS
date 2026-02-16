import { useQuery } from '@tanstack/react-query';
import { mockCashFlowData, type CashFlowData } from '@/data/mockCashFlowData';

export function useCashFlowData() {
  const { data, isLoading } = useQuery({
    queryKey: ['cash-flow-data'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return mockCashFlowData;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data ?? mockCashFlowData,
    loading: isLoading,
  };
}
