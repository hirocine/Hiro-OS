import { useState } from 'react';
import { Package, AlertTriangle, HardDrive, ChevronDown, ChevronUp } from "lucide-react";
import { useProjectEquipment } from "@/features/projects";
import { Skeleton } from "@/components/ui/skeleton";
import { ReminderDialog } from '@/components/Equipment/ReminderDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { StatusPill } from '@/ds/components/StatusPill';

interface ProjectEquipmentListProps {
  projectId: string;
}

export function ProjectEquipmentList({ projectId }: ProjectEquipmentListProps) {
  const { equipment, loading, error } = useProjectEquipment(projectId);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedLoanData, setSelectedLoanData] = useState<any>(null);
  const [expandedEquipment, setExpandedEquipment] = useState<Set<string>>(new Set());

  const toggleExpanded = (equipmentId: string) => {
    setExpandedEquipment(prev => {
      const next = new Set(prev);
      if (next.has(equipmentId)) {
        next.delete(equipmentId);
      } else {
        next.add(equipmentId);
      }
      return next;
    });
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
        <AlertTriangle className="h-8 w-8 text-[hsl(0_84%_60%)] mx-auto mb-2" />
        <p className="text-sm text-[hsl(0_84%_60%)]">{error}</p>
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="text-center py-8">
        <Package size={40} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" className="mx-auto mb-4" />
        <p style={{ color: 'hsl(var(--ds-fg-3))', marginBottom: 16 }}>Nenhum equipamento encontrado para este projeto</p>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            // Emit event to parent to open add equipment dialog
            window.dispatchEvent(new CustomEvent('openAddEquipmentDialog'));
          }}
        >
          Adicionar Equipamentos
        </button>
      </div>
    );
  }

  const getStatusTone = (status: string): 'success' | 'danger' | 'muted' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'overdue':
        return 'danger';
      default:
        return 'muted';
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

  // Group equipment by category and sort categories alphabetically (main items only)
  const equipmentByCategory = equipment
    .filter(item => item.itemType === 'main')
    .reduce((acc, item) => {
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
    return item.category === 'Armazenamento' && 
           (item.subcategory?.toLowerCase().includes('ssd') || 
            item.subcategory?.toLowerCase().includes('hd'));
  };

  return (
    <div className="space-y-4">
      {sortedCategories.map((category) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2 py-2">
            <Package size={14} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" />
            <h3
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 12,
                fontWeight: 500,
                color: 'hsl(var(--ds-fg-3))',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {category}
            </h3>
            <div style={{ flex: 1, borderBottom: '1px solid hsl(var(--ds-line-1))' }} />
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                border: '1px solid hsl(var(--ds-line-1))',
                color: 'hsl(var(--ds-fg-3))',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {equipmentByCategory[category].length}
            </span>
          </div>

          <div className="space-y-3">
            {equipmentByCategory[category].map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-surface))',
                }}
              >
                <div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4
                            className="truncate"
                            style={{
                              fontFamily: '"HN Display", sans-serif',
                              fontSize: 14,
                              fontWeight: 500,
                              color: 'hsl(var(--ds-text))',
                            }}
                          >
                            {item.name}
                          </h4>
                          <StatusPill tone={getStatusTone(item.loanInfo.status)}>
                            {getStatusLabel(item.loanInfo.status)}
                          </StatusPill>

                          {/* Tag de acessórios */}
                          {item.accessoryCount && item.accessoryCount > 0 && (
                            <span
                              className="flex items-center gap-1"
                              style={{
                                fontSize: 11,
                                padding: '2px 6px',
                                border: '1px solid hsl(var(--ds-line-1))',
                                color: 'hsl(var(--ds-fg-3))',
                              }}
                            >
                              <Package size={11} strokeWidth={1.5} />
                              {item.accessoryCount} acessório{item.accessoryCount !== 1 ? 's' : ''}
                            </span>
                          )}

                          {item.loanInfo.status === 'overdue' && (
                            <AlertTriangle size={14} strokeWidth={1.5} color="hsl(var(--ds-danger, 0 84% 60%))" className="flex-shrink-0" />
                          )}

                          {/* Indicador especial para SSDs/HDs */}
                          {isStorageDevice(item) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className="flex items-center gap-1"
                                    style={{
                                      fontSize: 11,
                                      padding: '2px 6px',
                                      border: '1px solid hsl(var(--ds-text))',
                                      color: 'hsl(var(--ds-text))',
                                    }}
                                  >
                                    <HardDrive size={11} strokeWidth={1.5} />
                                    <span>Kanban</span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Status gerenciado na página de Controle de SSDs</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>

                        <div className="space-y-1" style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                          <div className="flex items-center gap-1">
                            <Package size={12} strokeWidth={1.5} />
                            <span>{item.brand}</span>
                            {item.patrimonyNumber && (
                              <span>• Patrimônio: {item.patrimonyNumber}</span>
                            )}
                          </div>

                          {/* Para SSDs/HDs, mostrar mensagem informativa */}
                          {isStorageDevice(item) && (
                            <p style={{ fontSize: 11, fontStyle: 'italic', color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                              Use a página de Controle de SSDs para gerenciar o status
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {item.loanInfo.status === 'overdue' && (
                          <button
                            type="button"
                            className="btn danger primary sm"
                            onClick={() => handleSendReminder(item)}
                          >
                            Cobrar Retorno
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible de Acessórios */}
                  {item.accessoryCount && item.accessoryCount > 0 && (
                    <Collapsible 
                      open={expandedEquipment.has(item.id)}
                      onOpenChange={() => toggleExpanded(item.id)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="px-4 py-2 flex items-center justify-between" style={{ borderTop: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-bg))' }}>
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {item.accessoryCount} acessório{item.accessoryCount !== 1 ? 's' : ''} incluído{item.accessoryCount !== 1 ? 's' : ''}
                          </span>
                          {expandedEquipment.has(item.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-4 py-3 space-y-2" style={{ borderTop: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-bg))' }}>
                          {equipment
                            .filter(acc => acc.parentId === item.id && acc.itemType === 'accessory')
                            .map(accessory => (
                              <div key={accessory.id} className="flex items-start gap-2 text-sm">
                                <span style={{ color: 'hsl(var(--ds-fg-3))' }}>•</span>
                                <div className="flex-1">
                                  <span className="font-medium">{accessory.name}</span>
                                  {accessory.brand && (
                                    <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginLeft: 8 }}>
                                      {accessory.brand}
                                    </span>
                                  )}
                                  {accessory.patrimonyNumber && (
                                    <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginLeft: 8 }}>
                                      • Patrimônio: {accessory.patrimonyNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <ReminderDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        loanData={selectedLoanData}
      />
    </div>
  );
}