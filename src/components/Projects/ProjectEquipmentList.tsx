import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, HardDrive } from "lucide-react";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { Skeleton } from "@/components/ui/skeleton";
import { EquipmentDetailsDialog } from '@/components/Equipment/EquipmentDetailsDialog';
import { ReminderDialog } from '@/components/Equipment/ReminderDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectEquipmentListProps {
  projectId: string;
}

export function ProjectEquipmentList({ projectId }: ProjectEquipmentListProps) {
  const { equipment, loading, error } = useProjectEquipment(projectId);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedLoanData, setSelectedLoanData] = useState<any>(null);

  const handleViewDetails = (equipmentId: string) => {
    setSelectedEquipmentId(equipmentId);
    setDetailsDialogOpen(true);
  };

  const handleSendReminder = (item: any) => {
    const overdueDays = Math.floor(
      (Date.now() - new Date(item.loanInfo.expectedReturnDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    setSelectedLoanData({
      id: item.loanInfo.loanId,
      equipmentName: item.name,
      borrowerName: item.loanInfo.borrowerName,
      borrowerEmail: item.loanInfo.borrowerEmail,
      borrowerPhone: item.loanInfo.borrowerPhone,
      expectedReturnDate: item.loanInfo.expectedReturnDate,
      loanDate: item.loanInfo.loanDate,
      overdueDays: Math.max(0, overdueDays)
    });
    setReminderDialogOpen(true);
  };

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
        return 'Gravação';
      case 'overdue':
        return 'Em atraso';
      default:
        return status;
    }
  };

  // Group equipment by category and sort categories alphabetically
  const equipmentByCategory = equipment.reduce((acc, item) => {
    const category = item.category || 'Sem categoria';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof equipment>);

  const sortedCategories = Object.keys(equipmentByCategory).sort();

  // Helper to check if equipment is SSD/HD
  const isStorageDevice = (item: any) => {
    return item.category === 'storage' && 
           (item.subcategory?.toLowerCase().includes('ssd') || 
            item.subcategory?.toLowerCase().includes('hd'));
  };

  return (
    <div className="space-y-4">
      {sortedCategories.map((category) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2 py-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {category}
            </h3>
            <div className="flex-1 border-b border-border" />
            <Badge variant="secondary" className="text-xs">
              {equipmentByCategory[category].length}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {equipmentByCategory[category].map((item) => (
              <Card key={item.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        <Badge variant={getStatusVariant(item.loanInfo.status)}>
                          {getStatusLabel(item.loanInfo.status)}
                        </Badge>
                        {item.loanInfo.status === 'overdue' && (
                          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                        )}
                        
                        {/* Indicador especial para SSDs/HDs */}
                        {isStorageDevice(item) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs gap-1 border-primary/50">
                                  <HardDrive className="h-3 w-3" />
                                  <span>Kanban</span>
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Status gerenciado na página de Controle de SSDs</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                       </div>
                       
                       <div className="text-sm text-muted-foreground space-y-1">
                         <div className="flex items-center gap-1">
                           <Package className="h-3 w-3" />
                           <span>{item.brand}</span>
                           {item.patrimonyNumber && (
                             <span>• Patrimônio: {item.patrimonyNumber}</span>
                           )}
                         </div>
                         
                         {/* Para SSDs/HDs, mostrar mensagem informativa */}
                         {isStorageDevice(item) && (
                           <p className="text-xs italic text-muted-foreground mt-1">
                             Use a página de Controle de SSDs para gerenciar o status
                           </p>
                         )}
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(item.id)}
                      >
                        Ver Detalhes
                      </Button>
                      
                      {item.loanInfo.status === 'overdue' && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleSendReminder(item)}
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
        </div>
      ))}

      <EquipmentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        equipmentId={selectedEquipmentId}
      />

      <ReminderDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        loanData={selectedLoanData}
      />
    </div>
  );
}