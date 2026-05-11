import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription
} from '@/components/ui/responsive-dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEquipment } from '@/features/equipment';
import { useLoans } from '@/features/loans';
import { useToast } from '@/hooks/use-toast';
import { Equipment } from '@/types/equipment';
import { Project } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useDebounce } from '@/hooks/useDebounce';
import { StatusPill } from '@/ds/components/StatusPill';

interface AddEquipmentToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSuccess?: () => void;
}

export function AddEquipmentToProjectDialog({
  open,
  onOpenChange,
  project,
  onSuccess
}: AddEquipmentToProjectDialogProps) {
  const { toast } = useToast();
  const { allEquipment } = useEquipment();
  const { addLoan } = useLoans();

  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState('');
  const [displayLimit, setDisplayLimit] = useState(30);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const debouncedSearchTerm = useDebounce(searchInput, 300);

  // Refs to avoid recreating scroll listener on every state change
  const displayLimitRef = useRef(displayLimit);
  const isLoadingMoreRef = useRef(isLoadingMore);

  // Sync refs with state
  useEffect(() => {
    displayLimitRef.current = displayLimit;
    isLoadingMoreRef.current = isLoadingMore;
  }, [displayLimit, isLoadingMore]);

  // Filter equipment (show all equipment, regardless of current loan status)
  const availableEquipment = useMemo(() => {
    return allEquipment.filter(equipment => {
      // Apply search filter
      if (debouncedSearchTerm) {
        const search = debouncedSearchTerm.toLowerCase();
        return equipment.name.toLowerCase().includes(search) ||
               equipment.brand.toLowerCase().includes(search) ||
               equipment.patrimonyNumber?.toLowerCase().includes(search);
      }

      return true;
    });
  }, [allEquipment, debouncedSearchTerm]);

  // Limit visible equipment for performance (lazy rendering)
  const visibleEquipment = useMemo(() => {
    return availableEquipment.slice(0, displayLimit);
  }, [availableEquipment, displayLimit]);

  // Function to get project count for equipment
  const getEquipmentProjectCount = async (equipmentId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_equipment_project_count', { equipment_id: equipmentId });

      if (error) {
        logger.error('Error getting project count', {
          module: 'equipment-project-count',
          error,
          data: { equipment_id: equipmentId }
        });
        return 0;
      }

      return data || 0;
    } catch (error) {
      logger.error('Error getting project count', {
        module: 'equipment-project-count',
        error,
        data: { equipment_id: equipmentId }
      });
      return 0;
    }
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    const newSelected = new Set(selectedEquipment);
    if (newSelected.has(equipmentId)) {
      newSelected.delete(equipmentId);
    } else {
      newSelected.add(equipmentId);
    }
    setSelectedEquipment(newSelected);
  };

  // Lazy loading via IntersectionObserver with retry
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let cleanup = () => {};

    const attachObserver = (attempt = 0) => {
      if (cancelled) return;

      const scrollArea = scrollAreaRef.current;
      const loadMoreEl = loadMoreRef.current;

      if (!scrollArea || !loadMoreEl) {
        if (attempt < 10) {
          setTimeout(() => attachObserver(attempt + 1), 50);
        }
        return;
      }

      const viewport = scrollArea.querySelector('[data-lovable-scroll-viewport]') as HTMLElement | null;

      if (!viewport) {
        if (attempt < 10) {
          setTimeout(() => attachObserver(attempt + 1), 50);
        } else {
          logger.debug('io_setup_missing_viewport', {
            module: 'project-equipment',
            data: { attempt }
          });
        }
        return;
      }

      // Garantir início no topo a cada abertura
      viewport.scrollTo({ top: 0 });

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (
            entry.isIntersecting &&
            !isLoadingMoreRef.current &&
            displayLimitRef.current < availableEquipment.length
          ) {
            logger.debug('io_triggered', {
              module: 'project-equipment',
              data: {
                displayLimit: displayLimitRef.current,
                total: availableEquipment.length
              }
            });
            setIsLoadingMore(true);
            setTimeout(() => {
              setDisplayLimit((prev) => Math.min(prev + 30, availableEquipment.length));
              setIsLoadingMore(false);
            }, 150);
          }
        },
        {
          root: viewport,
          rootMargin: '160px 0px 0px 0px',
          threshold: 0.01,
        }
      );

      observer.observe(loadMoreEl);

      logger.debug('io_listener_attached', {
        module: 'project-equipment',
        data: { total: availableEquipment.length }
      });

      cleanup = () => observer.disconnect();
    };

    attachObserver();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [open, availableEquipment.length]);

  // Reset displayLimit when search changes
  useEffect(() => {
    setDisplayLimit(30);
  }, [debouncedSearchTerm]);

  // Reset displayLimit when dialog closes
  useEffect(() => {
    if (!open) {
      setDisplayLimit(30);
      setIsLoadingMore(false);
    }
  }, [open]);


  const handleSubmit = async () => {
    if (selectedEquipment.size === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um equipamento",
        variant: "destructive"
      });
      return;
    }

    logger.info('Starting loan creation process', {
      module: 'project-equipment',
      action: 'create_loans',
      data: {
        selectedEquipmentCount: selectedEquipment.size,
        project: project.name,
        borrower: project.responsibleName,
        selectedEquipmentIds: Array.from(selectedEquipment)
      }
    });

    try {
      setLoading(true);

      let successCount = 0;
      let errors: string[] = [];

      // Create loans for all selected equipment
      const loanPromises = Array.from(selectedEquipment).map(async (equipmentId) => {
        const equipment = allEquipment.find(eq => eq.id === equipmentId);
        if (!equipment) {
          logger.error('Equipment not found for loan creation', {
            module: 'project-equipment',
            action: 'create_loan',
            data: { equipmentId }
          });
          errors.push(`Equipamento não encontrado: ${equipmentId}`);
          return;
        }

        try {
          logger.debug('Creating loan for equipment', {
            module: 'project-equipment',
            action: 'create_loan',
            data: { equipmentName: equipment.name, equipmentId }
          });

          await addLoan({
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            borrowerName: project.responsibleName,
            project: project.name,
            loanDate: format(new Date(), 'yyyy-MM-dd'),
            expectedReturnDate: format(new Date(project.expectedEndDate), 'yyyy-MM-dd'),
            status: 'active'
          });

          successCount++;
          logger.debug('Loan created successfully', {
            module: 'project-equipment',
            action: 'loan_created',
            data: { equipmentName: equipment.name }
          });

        } catch (loanError) {
          logger.error('Error creating loan for equipment', {
            module: 'project-equipment',
            action: 'create_loan',
            error: loanError,
            data: { equipmentName: equipment.name }
          });
          const errorMessage = loanError instanceof Error ? loanError.message : 'Erro desconhecido';
          errors.push(`${equipment.name}: ${errorMessage}`);
        }
      });

      await Promise.all(loanPromises);

      if (successCount > 0) {
        // Verificar quantos SSDs/HDs foram selecionados
        const storageDevices = Array.from(selectedEquipment).filter(id => {
          const equipment = allEquipment.find(e => e.id === id);
          return equipment?.category === 'Armazenamento' &&
                 (equipment?.subcategory?.toLowerCase().includes('ssd') ||
                  equipment?.subcategory?.toLowerCase().includes('hd'));
        });

        // Mensagem diferenciada para SSDs/HDs
        if (storageDevices.length > 0 && storageDevices.length === successCount) {
          toast({
            title: "SSDs/HDs adicionados ao projeto",
            description: `${successCount} SSD(s)/HD(s) registrado(s) no projeto. O status é gerenciado na página de Controle de SSDs.`,
          });
        } else if (storageDevices.length > 0) {
          toast({
            title: "Equipamentos adicionados",
            description: `${successCount} equipamento(s) adicionado(s). SSDs/HDs têm status gerenciado na página de Controle de SSDs.`,
          });
        } else {
          toast({
            title: "Sucesso",
            description: `${successCount} equipamento(s) adicionado(s) ao projeto`,
          });
        }

        logger.info('Loans created successfully', {
          module: 'project-equipment',
          action: 'loans_completed',
          data: { successCount, storageDevicesCount: storageDevices.length }
        });

        // Reset form and close dialog
        setSelectedEquipment(new Set());
        setSearchInput('');
        onOpenChange(false);
        onSuccess?.();
      }

      if (errors.length > 0) {
        logger.error('Loan creation completed with errors', {
          module: 'project-equipment',
          action: 'loan_creation_errors',
          data: { errors, errorCount: errors.length }
        });
        toast({
          title: "Erros detectados",
          description: errors.slice(0, 3).join('\n') + (errors.length > 3 ? '\n...' : ''),
          variant: "destructive"
        });
      }

    } catch (error) {
      logger.error('Error in loan creation process', {
        module: 'project-equipment',
        action: 'loan_creation_process',
        error
      });
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro",
        description: `Erro ao adicionar equipamentos ao projeto: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="w-full max-w-5xl flex flex-col h-[80vh] overflow-hidden">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            <span style={{ fontFamily: '"HN Display", sans-serif' }}>
              Adicionar Equipamentos ao Projeto
            </span>
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Selecione os equipamentos que deseja vincular ao projeto "{project.name}"
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {/* Equipment Selection */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  strokeWidth={1.5}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'hsl(var(--ds-fg-3))',
                  }}
                />
                <Input
                  placeholder="Buscar equipamentos..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>

              <span style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: 'hsl(var(--ds-fg-2))',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {visibleEquipment.length === availableEquipment.length
                  ? `Todos os Equipamentos (${availableEquipment.length})`
                  : `Mostrando ${visibleEquipment.length} de ${availableEquipment.length} equipamentos`
                }
              </span>
            </div>

            <ScrollArea
              ref={scrollAreaRef}
              className="flex-1 min-h-0 h-full"
              style={{ border: '1px solid hsl(var(--ds-line-1))' }}
            >
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visibleEquipment.map((equipment) => {
                  const isSelected = selectedEquipment.has(equipment.id);
                  return (
                    <div
                      key={equipment.id}
                      onClick={() => handleEquipmentToggle(equipment.id)}
                      style={{
                        cursor: 'pointer',
                        border: isSelected
                          ? '1px solid hsl(var(--ds-accent))'
                          : '1px solid hsl(var(--ds-line-1))',
                        background: isSelected
                          ? 'hsl(var(--ds-accent) / 0.05)'
                          : 'hsl(var(--ds-surface))',
                        padding: 12,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'hsl(var(--ds-surface))';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleEquipmentToggle(equipment.id)}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <h4 style={{
                              fontWeight: 500,
                              fontSize: 13,
                              color: 'hsl(var(--ds-fg-1))',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {equipment.name}
                            </h4>
                            <StatusPill
                              label={equipment.currentBorrower ? 'Em projetos' : 'Disponível'}
                              tone={equipment.currentBorrower ? 'warning' : 'success'}
                            />
                          </div>

                          <div style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Package size={11} strokeWidth={1.5} />
                              <span>{equipment.brand} • {equipment.category}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {visibleEquipment.length < availableEquipment.length && (
                  <div
                    ref={loadMoreRef}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '24px 0',
                      fontSize: 12,
                      color: 'hsl(var(--ds-fg-3))',
                    }}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                        <span>Carregando mais equipamentos...</span>
                      </>
                    ) : (
                      <span>Role para carregar mais</span>
                    )}
                  </div>
                )}

                {availableEquipment.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <Package size={28} strokeWidth={1.5} style={{ margin: '0 auto 8px', color: 'hsl(var(--ds-fg-3))' }} />
                    <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                      Nenhum equipamento encontrado
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer with Action Buttons */}
          <div style={{
            paddingTop: 16,
            borderTop: '1px solid hsl(var(--ds-line-1))',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
              {selectedEquipment.size} equipamento(s) selecionado(s)
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn"
                onClick={() => onOpenChange(false)}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={handleSubmit}
                disabled={loading || selectedEquipment.size === 0}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {loading ? 'Adicionando...' : 'Adicionar ao Projeto'}
              </button>
            </div>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
