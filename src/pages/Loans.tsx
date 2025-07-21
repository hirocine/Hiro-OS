import { useLoans } from '@/hooks/useLoans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, User, Package, AlertTriangle } from 'lucide-react';
import { statusLabels } from '@/data/mockLoans';

export default function Loans() {
  const { loans, stats } = useLoans();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'overdue': return 'destructive';
      case 'returned': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Empréstimos</h1>
        <p className="text-muted-foreground">
          Gerencie retiradas e devoluções de equipamentos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Devolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.returned}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loans.map((loan) => (
          <Card key={loan.id} className="shadow-card hover:shadow-elegant transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{loan.equipmentName}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <User className="h-3 w-3" />
                    {loan.borrowerName}
                  </p>
                </div>
                <Badge variant={getStatusVariant(loan.status)}>
                  {statusLabels[loan.status]}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3 w-3" />
                  <span>Retirada: {new Date(loan.loanDate).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-3 w-3" />
                  <span>Devolução: {new Date(loan.expectedReturnDate).toLocaleDateString('pt-BR')}</span>
                </div>
                {loan.project && (
                  <p className="text-muted-foreground">Projeto: {loan.project}</p>
                )}
              </div>
              
              {loan.status === 'overdue' && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertTriangle className="h-3 w-3" />
                  Equipamento em atraso
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}