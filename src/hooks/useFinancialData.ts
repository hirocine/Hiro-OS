import { useQuery } from '@tanstack/react-query';
import {
  mockGoals,
  mockMetrics,
  mockMonthlyData,
  type FinancialGoals,
  type FinancialMetrics,
  type MonthlyData,
} from '@/data/mockFinancialData';

interface FinancialData {
  goals: FinancialGoals;
  metrics: FinancialMetrics;
  monthlyData: MonthlyData[];
  loading: boolean;
}

export function useFinancialData(): FinancialData {
  // Prepared for Supabase integration:
  // Replace the queryFn with a real fetch from the `financial_metrics` table
  const { data, isLoading } = useQuery({
    queryKey: ['financial-data'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 400));
      return {
        goals: mockGoals,
        metrics: mockMetrics,
        monthlyData: mockMonthlyData,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    goals: data?.goals ?? mockGoals,
    metrics: data?.metrics ?? mockMetrics,
    monthlyData: data?.monthlyData ?? mockMonthlyData,
    loading: isLoading,
  };
}
