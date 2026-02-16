export interface CashFlowData {
  total_balance: number;
  monthly_income: number;
  monthly_expenses: number;
  net_flow: number;
  receivables_30d: number;
  payables_30d: number;
  projected_balance: number;
}

export const mockCashFlowData: CashFlowData = {
  total_balance: 320_000,
  monthly_income: 180_000,
  monthly_expenses: 145_000,
  net_flow: 35_000, // 180k - 145k
  receivables_30d: 95_000,
  payables_30d: 72_000,
  projected_balance: 343_000, // 320k + 95k - 72k
};
