import type { RentalEquipment, Rental, RentalStats, MonthlyRentalRevenue, TopEarner } from '../types';

export const mockRentalEquipment: RentalEquipment[] = [
  { id: '1', name: 'Sony FX6', category: 'Câmeras', dailyRate: 800, purchaseValue: 45000, totalRevenue: 38400, totalRentals: 16, totalDaysRented: 48, status: 'rented' },
  { id: '2', name: 'Canon C70', category: 'Câmeras', dailyRate: 600, purchaseValue: 32000, totalRevenue: 25200, totalRentals: 14, totalDaysRented: 42, status: 'available' },
  { id: '3', name: 'DJI Ronin 4D', category: 'Estabilizadores', dailyRate: 500, purchaseValue: 28000, totalRevenue: 18000, totalRentals: 12, totalDaysRented: 36, status: 'available' },
  { id: '4', name: 'Aputure 600d Pro', category: 'Iluminação', dailyRate: 350, purchaseValue: 12000, totalRevenue: 14700, totalRentals: 14, totalDaysRented: 42, status: 'rented' },
  { id: '5', name: 'Sennheiser MKH 416', category: 'Áudio', dailyRate: 150, purchaseValue: 5500, totalRevenue: 7200, totalRentals: 16, totalDaysRented: 48, status: 'available' },
  { id: '6', name: 'Blackmagic ATEM Mini', category: 'Switcher', dailyRate: 250, purchaseValue: 8000, totalRevenue: 6000, totalRentals: 8, totalDaysRented: 24, status: 'maintenance' },
  { id: '7', name: 'Sigma 18-35mm', category: 'Lentes', dailyRate: 200, purchaseValue: 6000, totalRevenue: 9600, totalRentals: 16, totalDaysRented: 48, status: 'available' },
  { id: '8', name: 'Tripé Sachtler', category: 'Suportes', dailyRate: 180, purchaseValue: 7500, totalRevenue: 5400, totalRentals: 10, totalDaysRented: 30, status: 'available' },
];

const totalInvested = mockRentalEquipment.reduce((s, e) => s + e.purchaseValue, 0);
const totalRevenue = mockRentalEquipment.reduce((s, e) => s + e.totalRevenue, 0);
const totalDaysPossible = mockRentalEquipment.length * 90; // last 90 days
const totalDaysRented = mockRentalEquipment.reduce((s, e) => s + e.totalDaysRented, 0);

export const mockRentalStats: RentalStats = {
  totalEquipment: mockRentalEquipment.length,
  totalInvested,
  totalRevenue,
  roi: Math.round((totalRevenue / totalInvested) * 100),
  avgOccupancy: Math.round((totalDaysRented / totalDaysPossible) * 100),
  activeRentals: mockRentalEquipment.filter(e => e.status === 'rented').length,
  overdueRentals: 1,
};

export const mockRentals: Rental[] = [
  { id: 'r1', equipmentId: '1', equipmentName: 'Sony FX6', clientName: 'Produtora Alfa', startDate: '2026-03-20', endDate: '2026-03-28', dailyRate: 800, totalValue: 6400, status: 'active' },
  { id: 'r2', equipmentId: '4', equipmentName: 'Aputure 600d Pro', clientName: 'Studio Beta', startDate: '2026-03-22', endDate: '2026-03-26', dailyRate: 350, totalValue: 1400, status: 'active' },
  { id: 'r3', equipmentId: '2', equipmentName: 'Canon C70', clientName: 'Agência Gama', startDate: '2026-03-10', endDate: '2026-03-15', actualReturnDate: '2026-03-15', dailyRate: 600, totalValue: 3000, status: 'returned' },
  { id: 'r4', equipmentId: '5', equipmentName: 'Sennheiser MKH 416', clientName: 'Produtora Alfa', startDate: '2026-03-05', endDate: '2026-03-08', actualReturnDate: '2026-03-08', dailyRate: 150, totalValue: 450, status: 'returned' },
  { id: 'r5', equipmentId: '3', equipmentName: 'DJI Ronin 4D', clientName: 'Filmmaker Delta', startDate: '2026-03-01', endDate: '2026-03-04', actualReturnDate: '2026-03-06', dailyRate: 500, totalValue: 1500, status: 'returned', notes: 'Devolvido com 2 dias de atraso' },
  { id: 'r6', equipmentId: '7', equipmentName: 'Sigma 18-35mm', clientName: 'Studio Beta', startDate: '2026-02-25', endDate: '2026-02-28', actualReturnDate: '2026-02-28', dailyRate: 200, totalValue: 600, status: 'returned' },
  { id: 'r7', equipmentId: '1', equipmentName: 'Sony FX6', clientName: 'Agência Gama', startDate: '2026-02-15', endDate: '2026-02-20', actualReturnDate: '2026-02-20', dailyRate: 800, totalValue: 4000, status: 'returned' },
  { id: 'r8', equipmentId: '6', equipmentName: 'Blackmagic ATEM Mini', clientName: 'Evento Corp', startDate: '2026-02-10', endDate: '2026-02-12', dailyRate: 250, totalValue: 500, status: 'overdue', notes: 'Cliente não devolveu no prazo' },
];

export const mockMonthlyRentalRevenue: MonthlyRentalRevenue[] = [
  { month: 'Out', revenue: 8200, rentals: 6 },
  { month: 'Nov', revenue: 12500, rentals: 9 },
  { month: 'Dez', revenue: 15800, rentals: 11 },
  { month: 'Jan', revenue: 18200, rentals: 14 },
  { month: 'Fev', revenue: 21400, rentals: 16 },
  { month: 'Mar', revenue: 24500, rentals: 18 },
];

export const mockTopEarners: TopEarner[] = mockRentalEquipment
  .map(e => ({
    equipmentId: e.id,
    equipmentName: e.name,
    category: e.category,
    totalRevenue: e.totalRevenue,
    totalRentals: e.totalRentals,
    occupancyRate: Math.round((e.totalDaysRented / 90) * 100),
    roi: Math.round((e.totalRevenue / e.purchaseValue) * 100),
  }))
  .sort((a, b) => b.totalRevenue - a.totalRevenue);
