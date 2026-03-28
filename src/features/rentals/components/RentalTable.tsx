import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Rental } from '@/features/rentals/types';

interface RentalTableProps {
  rentals: Rental[];
}

const statusConfig: Record<Rental['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'Ativa', variant: 'default' },
  returned: { label: 'Devolvido', variant: 'secondary' },
  overdue: { label: 'Atrasado', variant: 'destructive' },
};

export function RentalTable({ rentals }: RentalTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Histórico de Locações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Retorno</TableHead>
                <TableHead>Diária</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentals.map((rental) => {
                const cfg = statusConfig[rental.status];
                return (
                  <TableRow key={rental.id}>
                    <TableCell className="font-medium">{rental.equipmentName}</TableCell>
                    <TableCell>{rental.clientName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(parseISO(rental.startDate), 'dd MMM', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {rental.actualReturnDate
                        ? format(parseISO(rental.actualReturnDate), 'dd MMM', { locale: ptBR })
                        : format(parseISO(rental.endDate), 'dd MMM', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm">R$ {rental.dailyRate.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="font-semibold text-sm">R$ {rental.totalValue.toLocaleString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
