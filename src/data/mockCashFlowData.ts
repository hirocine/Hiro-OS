export interface CashFlowData {
  total_balance: number;
  realized_income: number;
  realized_expenses: number;
  monthly_income: number;
  monthly_expenses: number;
  net_flow: number;
  receivables_30d: number;
  payables_30d: number;
  projected_balance: number;
  receivables_90d: number;
  payables_90d: number;
  projected_balance_90d: number;
}

export interface MonthlyCashEvolution {
  month: string;
  balance: number;
}

export const mockCashFlowData: CashFlowData = {
  total_balance: 320_000,
  realized_income: 142_000,
  realized_expenses: 108_000,
  monthly_income: 180_000,
  monthly_expenses: 145_000,
  net_flow: 34_000,
  receivables_30d: 95_000,
  payables_30d: 72_000,
  projected_balance: 343_000,
};

export const mockCashEvolution: MonthlyCashEvolution[] = [
  { month: 'Jan', balance: 280_000 },
  { month: 'Fev', balance: 295_000 },
  { month: 'Mar', balance: 260_000 },
  { month: 'Abr', balance: 310_000 },
  { month: 'Mai', balance: 290_000 },
  { month: 'Jun', balance: 305_000 },
  { month: 'Jul', balance: 330_000 },
  { month: 'Ago', balance: 315_000 },
  { month: 'Set', balance: 340_000 },
  { month: 'Out', balance: 325_000 },
  { month: 'Nov', balance: 350_000 },
  { month: 'Dez', balance: 320_000 },
];
