import { PageHeader } from '@/components/ui/page-header';
import { RentalStatsCards } from '@/features/rentals/components/RentalStatsCards';
import { RentalRevenueChart } from '@/features/rentals/components/RentalRevenueChart';
import { TopEarnersList } from '@/features/rentals/components/TopEarnersList';
import { RentalTable } from '@/features/rentals/components/RentalTable';
import {
  mockRentalStats,
  mockMonthlyRentalRevenue,
  mockTopEarners,
  mockRentals,
} from '@/features/rentals/data/mockRentalData';

export default function Rentals() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Locação de Equipamentos"
        description="Controle de entradas, saídas e rentabilidade dos seus equipamentos"
      />

      <RentalStatsCards stats={mockRentalStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RentalRevenueChart data={mockMonthlyRentalRevenue} />
        <TopEarnersList data={mockTopEarners} />
      </div>

      <RentalTable rentals={mockRentals} />
    </div>
  );
}
