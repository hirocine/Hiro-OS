import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mockCashFlowData, mockCashEvolution, type CashFlowData, type MonthlyCashEvolution } from '@/data/mockCashFlowData';

interface CashFlowResult {
  data: CashFlowData;
  evolution: MonthlyCashEvolution[];
  loading: boolean;
  lastSyncedAt: Date | null;
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function useCashFlowData(): CashFlowResult {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const { data, isLoading } = useQuery({
    queryKey: ['financial', 'cash-flow', currentYear],
    queryFn: async () => {
      const { data: snapshots, error } = await supabase
        .from('financial_snapshots')
        .select('*')
        .eq('year', currentYear)
        .order('month', { ascending: true });

      if (error) {
        console.error('Cash flow fetch error:', error);
        return null;
      }

      if (!snapshots || snapshots.length === 0) return null;

      // Current month snapshot (or latest available)
      const currentSnap = snapshots.find(s => s.month === currentMonth)
        ?? snapshots[snapshots.length - 1];

      const realizedIncome = Number(currentSnap.realized_income ?? 0);
      const realizedExpenses = Number(currentSnap.realized_expenses ?? 0);
      const cashBalance = Number(currentSnap.cash_balance ?? 0);
      const receivables = Number(currentSnap.receivables_30d ?? 0);
      const payables = Number(currentSnap.payables_30d ?? 0);

      const cashFlow: CashFlowData = {
        total_balance: cashBalance,
        realized_income: realizedIncome,
        realized_expenses: realizedExpenses,
        monthly_income: realizedIncome,
        monthly_expenses: realizedExpenses,
        net_flow: Number(currentSnap.net_cash_flow ?? (realizedIncome - realizedExpenses)),
        receivables_30d: receivables,
        payables_30d: payables,
        projected_balance: cashBalance + receivables - payables,
      };

      // Build evolution from all snapshots
      const evolution: MonthlyCashEvolution[] = snapshots.map(s => ({
        month: MONTH_LABELS[s.month - 1],
        balance: Number(s.cash_balance ?? 0),
      }));

      const latestSnapshot = snapshots[snapshots.length - 1];
      const lastSyncedAt = latestSnapshot?.updated_at
        ? new Date(latestSnapshot.updated_at)
        : null;

      return { cashFlow, evolution, lastSyncedAt };
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return {
    data: data?.cashFlow ?? mockCashFlowData,
    evolution: data?.evolution ?? mockCashEvolution,
    loading: isLoading,
    lastSyncedAt: data?.lastSyncedAt ?? null,
  };
}
