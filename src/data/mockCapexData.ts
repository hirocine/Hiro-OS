export interface CapexData {
  total_invested: number;
  total_current: number;
  monthly_depreciation: number;
  av_equipment: number;
  tech_post: number;
  general_assets: number;
  capex_current_year: number;
}

export const mockCapexData: CapexData = {
  total_invested: 1_420_000,
  total_current: 1_185_000,
  monthly_depreciation: 6_528,
  av_equipment: 680_000,
  tech_post: 345_000,
  general_assets: 160_000,
  capex_current_year: 92_000,
};
