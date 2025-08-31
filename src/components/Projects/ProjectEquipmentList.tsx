import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Calendar, User, AlertTriangle } from "lucide-react";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectEquipmentListProps {
  projectId: string;
}

export function ProjectEquipmentList({ projectId }: ProjectEquipmentListProps) {
  const { equipment, loading, error } = useProjectEquipment(projectId);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">Nenhum equipamento encontrado para este projeto</p>
        <Button 
          onClick={() => {
            // Emit event to parent to open add equipment dialog
            window.dispatchEvent(new CustomEvent('openAddEquipmentDialog'));
          }}
        >
          Adicionar Equipamentos
        </Button>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Em uso';
      case 'overdue':
        return 'Em atraso';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-3">
      {equipment.map((item) => (
        <Card key={item.id} className="transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium truncate">{item.name}</h4>
                  <Badge variant={getStatusVariant(item.loanInfo.status)}>
                    {getStatusLabel(item.loanInfo.status)}
                  </Badge>
                  {item.loanInfo.status === 'overdue' && (
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{item.brand} • {item.category}</span>
                    {item.patrimonyNumber && (
                      <span>• Patrimônio: {item.patrimonyNumber}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{item.loanInfo.borrowerName}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Emprestado em {format(new Date(item.loanInfo.loanDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    <span>•</span>
                    <span>
                      Retorno previsto: {format(new Date(item.loanInfo.expectedReturnDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // TODO: Implementar navegação para detalhes do equipamento
                    console.log('View equipment details:', item.id);
                  }}
                >
                  Ver Detalhes
                </Button>
                
                {item.loanInfo.status === 'overdue' && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      // TODO: Implementar ação de cobrança/lembrete
                      console.log('Send reminder for:', item.loanInfo.loanId);
                    }}
                  >
                    Cobrar Retorno
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}