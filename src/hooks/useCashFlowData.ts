import { useQuery } from '@tanstack/react-query';
import { mockCashFlowData, mockCashEvolution, type CashFlowData, type MonthlyCashEvolution } from '@/data/mockCashFlowData';

export function useCashFlowData() {
  const { data, isLoading } = useQuery({
    queryKey: ['cash-flow-data'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return { cashFlow: mockCashFlowData, evolution: mockCashEvolution };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data?.cashFlow ?? mockCashFlowData,
    evolution: data?.evolution ?? mockCashEvolution,
    loading: isLoading,
  };
}
