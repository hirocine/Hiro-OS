import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  mockGoals,
  mockMetrics,
  mockMonthlyData,
  type FinancialGoals,
  type FinancialMetrics,
  type MonthlyData,
} from '@/data/mockFinancialData';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface FinancialData {
  goals: FinancialGoals;
  metrics: FinancialMetrics;
  monthlyData: MonthlyData[];
  loading: boolean;
  lastSyncedAt: Date | null;
}

export function useFinancialData(): FinancialData {
  const currentYear = new Date().getFullYear();

  const { data, isLoading } = useQuery({
    queryKey: ['financial', 'dashboard', currentYear],
    queryFn: async () => {
      // Fetch goals, raw snapshots, and computed metrics in parallel
      const [goalsRes, snapshotsRes, computedRes] = await Promise.all([
        supabase
          .from('financial_goals')
          .select('*')
          .eq('year', currentYear)
          .maybeSingle(),
        supabase
          .from('financial_snapshots')
          .select('id, year, month, revenue, avg_ticket, cac, ltv, churn_rate, burn_rate, cash_balance, nps, costs, costs_projects, refund, refund_projects, realized_income, realized_expenses, updated_at')
          .eq('year', currentYear)
          .order('month', { ascending: true }),
        supabase
          .from('financial_computed' as any)
          .select('snapshot_id, revenue_goal_monthly, contribution_margin_value, contribution_margin_pct, net_profit_value, net_profit_pct')
          .eq('year', currentYear)
          .order('month', { ascending: true }),
      ]);

      if (goalsRes.error) console.error('Goals fetch error:', goalsRes.error);
      if (snapshotsRes.error) console.error('Snapshots fetch error:', snapshotsRes.error);

      const goalsRow = goalsRes.data;
      const snapshots = snapshotsRes.data ?? [];
      const computedRows = (computedRes.data as any[]) ?? [];

      // If no data in DB, return null to trigger fallback
      if (!goalsRow && snapshots.length === 0) return null;

      // Build computed lookup by snapshot_id
      const computedBySnapshot = new Map(
        computedRows.map((c: any) => [c.snapshot_id, c])
      );

      // Build goals
      const goals: FinancialGoals = {
        revenue_goal: Number(goalsRow?.revenue_goal ?? 0),
        margin_goal_pct: Number(goalsRow?.margin_goal_pct ?? 0),
        profit_goal_pct: Number(goalsRow?.profit_goal_pct ?? 0),
        cac_goal: Number(goalsRow?.cac_goal ?? 0),
      };

      // Current month snapshot (based on actual calendar month)
      const currentMonth = new Date().getMonth() + 1;
      const currentMonthSnapshot = snapshots.find(s => s.month === currentMonth);
      const latestSnapshot = currentMonthSnapshot ?? snapshots[snapshots.length - 1];
      const latestComputed = latestSnapshot ? computedBySnapshot.get(latestSnapshot.id) as any : null;

      // Accumulated YTD (only months up to current)
      const accumulated_revenue_ytd = snapshots
        .filter(s => s.month <= currentMonth)
        .reduce((sum, s) => sum + Number(s.revenue ?? 0), 0);

      // Cash runway
      const burnRate = Number(latestSnapshot?.burn_rate ?? 0);
      const cashBalance = Number(latestSnapshot?.cash_balance ?? 0);
      const cash_runway_months = burnRate > 0
        ? Math.round(cashBalance / burnRate)
        : 0;

      const metrics: FinancialMetrics = {
        total_revenue: Number(latestSnapshot?.revenue ?? 0),
        accumulated_revenue_ytd,
        avg_ticket: Number(latestSnapshot?.avg_ticket ?? 0),
        cac: Number(latestSnapshot?.cac ?? 0),
        ltv: Number(latestSnapshot?.ltv ?? 0),
        churn_rate: Number(latestSnapshot?.churn_rate ?? 0),
        burn_rate: burnRate,
        contribution_margin_actual: Number(latestComputed?.contribution_margin_pct ?? latestSnapshot?.contribution_margin_pct ?? 0),
        contribution_margin_value: Number(latestComputed?.contribution_margin_value ?? latestSnapshot?.contribution_margin_value ?? 0),
        net_profit_actual: Number(latestComputed?.net_profit_pct ?? latestSnapshot?.net_profit_pct ?? 0),
        net_profit_value: Number(latestComputed?.net_profit_value ?? latestSnapshot?.net_profit_value ?? 0),
        nps: Number(latestSnapshot?.nps ?? 0),
        cash_runway_months,
      };

      // Build 12-month chart data
      const monthlyGoal = goals.revenue_goal > 0 ? Math.round(goals.revenue_goal / 12) : 0;
      const snapshotByMonth = new Map(snapshots.map(s => [s.month, s]));
      const computedByMonth = new Map(computedRows.map((c: any) => [c.month ?? 0, c]));

      const monthlyData: MonthlyData[] = MONTH_LABELS.map((label, i) => {
        const monthNum = i + 1;
        const snap = snapshotByMonth.get(monthNum);
        const comp = computedByMonth.get(monthNum) as any;
        const revenueGoal = comp ? Number(comp.revenue_goal_monthly ?? 0) : (snap ? Number(snap.revenue_goal ?? 0) : 0);
        const isFutureMonth = monthNum > currentMonth;
        return {
          month: label,
          meta: isFutureMonth ? 0 : (revenueGoal > 0 ? revenueGoal : monthlyGoal),
          realizado: isFutureMonth ? 0 : Number(snap?.revenue ?? 0),
        };
      });

      // Last synced = updated_at of the most recent snapshot
      const lastSyncedAt = latestSnapshot?.updated_at
        ? new Date(latestSnapshot.updated_at)
        : null;

      return { goals, metrics, monthlyData, lastSyncedAt };
    },
    staleTime: 60 * 1000, // 60 seconds
    refetchOnWindowFocus: true,
  });

  return {
    goals: data?.goals ?? mockGoals,
        contribution_margin_actual: Number(latestComputed?.contribution_margin_pct ?? 0),
        contribution_margin_value: Number(latestComputed?.contribution_margin_value ?? 0),
        net_profit_actual: Number(latestComputed?.net_profit_pct ?? 0),
        net_profit_value: Number(latestComputed?.net_profit_value ?? 0),
    monthlyData: data?.monthlyData ?? mockMonthlyData,
    loading: isLoading,
    lastSyncedAt: data?.lastSyncedAt ?? null,
  };
}
