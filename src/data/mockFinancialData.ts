export interface FinancialGoals {
  revenue_goal: number;
  margin_goal_pct: number;
  profit_goal_pct: number;
  cac_goal: number;
}

export interface FinancialMetrics {
  total_revenue: number;
  accumulated_revenue_ytd: number;
  avg_ticket: number;
  cac: number;
  ltv: number;
  churn_rate: number;
  burn_rate: number;
  contribution_margin_actual: number;
  contribution_margin_value: number;
  net_profit_actual: number;
  net_profit_value: number;
  nps: number;
  cash_runway_months: number;
}

export interface MonthlyData {
  month: string;
  meta: number;
  realizado: number;
}

export const mockGoals: FinancialGoals = {
  revenue_goal: 2_000_000,
  margin_goal_pct: 35,
  profit_goal_pct: 20,
  cac_goal: 500,
};

export const mockMetrics: FinancialMetrics = {
  total_revenue: 180_000,
  accumulated_revenue_ytd: 1_200_000,
  avg_ticket: 15_000,
  cac: 420,
  ltv: 45_000,
  churn_rate: 3.2,
  burn_rate: 95_000,
  contribution_margin_actual: 31,
  contribution_margin_value: 55_800,
  net_profit_actual: 17,
  net_profit_value: 30_600,
  nps: 72,
  cash_runway_months: 18,
};

// Monthly goal = revenue_goal / 12 ≈ 166_667
const monthlyGoal = Math.round(mockGoals.revenue_goal / 12);

export const mockMonthlyData: MonthlyData[] = [
  { month: 'Jan', meta: monthlyGoal, realizado: 145_000 },
  { month: 'Fev', meta: monthlyGoal, realizado: 158_000 },
  { month: 'Mar', meta: monthlyGoal, realizado: 172_000 },
  { month: 'Abr', meta: monthlyGoal, realizado: 160_000 },
  { month: 'Mai', meta: monthlyGoal, realizado: 175_000 },
  { month: 'Jun', meta: monthlyGoal, realizado: 190_000 },
  { month: 'Jul', meta: monthlyGoal, realizado: 180_000 },
  { month: 'Ago', meta: monthlyGoal, realizado: 165_000 },
  { month: 'Set', meta: monthlyGoal, realizado: 155_000 },
  { month: 'Out', meta: monthlyGoal, realizado: 0 },
  { month: 'Nov', meta: monthlyGoal, realizado: 0 },
  { month: 'Dez', meta: monthlyGoal, realizado: 0 },
];
