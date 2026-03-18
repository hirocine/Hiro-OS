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
      // Fetch current year snapshots, all snapshots for cumulative balance, and 30d projections in parallel
      const [currentYearRes, projectionsRes] = await Promise.all([
        supabase
          .from('financial_snapshots')
          .select('*')
          .eq('year', currentYear)
          .lte('month', currentMonth)
          .order('month', { ascending: true }),
        supabase
          .from('cash_flow_projections')
          .select('income_30d, expenses_30d, net_cash_flow_30d')
          .limit(1)
          .single()
      ]);

      if (currentYearRes.error) {
        console.error('Cash flow fetch error:', currentYearRes.error);
        return null;
      }

      const snapshots = currentYearRes.data ?? [];
      if (snapshots.length === 0) return null;

      // Current month snapshot (or latest available)
      const currentSnap = snapshots.find(s => s.month === currentMonth)
        ?? snapshots[snapshots.length - 1];

      const realizedIncome = Number(currentSnap.realized_income ?? 0);
      const realizedExpenses = Number(currentSnap.realized_expenses ?? 0);

      // 30d projections from dedicated table
      const proj = projectionsRes.data;
      const receivables = Number(proj?.income_30d ?? 0);
      const payables = Number(proj?.expenses_30d ?? 0);

      // Saldo Atual = soma de TODOS os net_cash_flow (todos os anos)
      const allSnapshots = allSnapshotsRes.data ?? [];
      const totalBalance = allSnapshots.reduce(
        (sum, s) => sum + Number(s.net_cash_flow ?? 0), 0
      );

      const cashFlow: CashFlowData = {
        total_balance: totalBalance,
        realized_income: realizedIncome,
        realized_expenses: realizedExpenses,
        monthly_income: realizedIncome,
        monthly_expenses: realizedExpenses,
        net_flow: Number(currentSnap.net_cash_flow ?? (realizedIncome - realizedExpenses)),
        receivables_30d: receivables,
        payables_30d: payables,
        projected_balance: totalBalance + receivables - payables,
      };

      // Build cumulative evolution
      const priorYearTotal = allSnapshots
        .filter(s => s.year < currentYear)
        .reduce((sum, s) => sum + Number(s.net_cash_flow ?? 0), 0);

      let runningTotal = priorYearTotal;
      const evolution: MonthlyCashEvolution[] = snapshots.map(s => {
        runningTotal += Number(s.net_cash_flow ?? 0);
        return {
          month: MONTH_LABELS[s.month - 1],
          balance: runningTotal,
        };
      });

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
