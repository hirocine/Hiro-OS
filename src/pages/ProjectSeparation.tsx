import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useProjectEquipment } from '@/features/projects';
import { useSeparationChecklist } from '@/hooks/useSeparationChecklist';
import { useProjectDetails } from '@/features/projects';
import { useToast } from '@/hooks/use-toast';
import { SeparationDialog } from '@/components/Projects/SeparationDialog';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Camera,
  Mic,
  Lightbulb,
  Settings,
  HardDrive,
  type LucideIcon,
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';

const categoryIcons: Record<string, LucideIcon> = {
  camera: Camera,
  audio: Mic,
  lighting: Lightbulb,
  accessories: Settings,
  storage: HardDrive,
};

const sectionWrap: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
};

const sectionHeader: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid hsl(var(--ds-line-1))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
};

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-2))',
};

export default function ProjectSeparation() {
  useCategories();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSeparationDialog, setShowSeparationDialog] = useState(false);
  useAuthContext();

  const { project } = useProjectDetails(id!);
  const { equipment, loading, error } = useProjectEquipment(id || '');
  const { updateProjectStep } = useProjectDetails(id!);

  // Transform equipment data for the checklist
  const equipmentData = equipment.map((eq) => ({
    id: eq.id,
    name: eq.name,
    category: eq.category,
    itemType: eq.itemType,
    parentId: eq.parentId,
    patrimonyNumber: eq.patrimonyNumber,
    brand: eq.brand,
  }));

  const {
    categorizedEquipment,
    checkedItems,
    allItemsChecked,
    checkedCount,
    totalCount,
    toggleItem,
    toggleMainItemWithAccessories,
    allAccessoriesChecked,
    getAccessoriesForItem,
  } = useSeparationChecklist(equipmentData);

  const handleConfirm = async () => {
    if (!allItemsChecked || !project) return;
    setShowSeparationDialog(true);
  };

  const handleSeparationConfirm = async (data: { userId: string; userName: string; timestamp: string }) => {
    setIsSubmitting(true);
    try {
      await updateProjectStep('ready_for_pickup', notes.trim() || undefined, {
        userId: data.userId,
        userName: data.userName,
        timestamp: data.timestamp,
      });

      toast({
        title: 'Equipamentos separados',
        description: 'A separação dos equipamentos foi confirmada com sucesso.',
      });
      navigate(`/retiradas/${id}`);
    } catch (error) {
      toast({
        title: 'Erro ao confirmar separação',
        description: 'Não foi possível confirmar a separação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setShowSeparationDialog(false);
    }
  };

  const handleCancel = () => {
    navigate(`/retiradas/${id}`);
  };

  const progressPercentage = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ textAlign: 'center', padding: '64px 0' }}>
          <div
            className="animate-spin"
            style={{
              width: 32,
              height: 32,
              border: '2px solid hsl(var(--ds-accent))',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ fontSize: 15, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>Carregando equipamentos…</p>
          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>Preparando lista de separação</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="ds-shell ds-page">
        <div
          className="ds-page-inner"
          style={{
            textAlign: 'center',
            padding: '64px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <AlertTriangle size={40} strokeWidth={1.25} style={{ color: 'hsl(var(--ds-danger))' }} />
          <h1 className="ph-title" style={{ color: 'hsl(var(--ds-danger))' }}>
            Erro ao Carregar.
          </h1>
          <p style={{ color: 'hsl(var(--ds-fg-3))' }}>{error || 'Não foi possível carregar os dados do projeto.'}</p>
          <button className="btn primary" onClick={handleCancel} type="button">
            Voltar ao Projeto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <BreadcrumbNav
          items={[
            { label: 'Retiradas', href: '/retiradas' },
            { label: project.name, href: `/retiradas/${id}` },
            { label: 'Separação' },
          ]}
        />

        {/* Header */}
        <div className="ph">
          <div>
            <h1 className="ph-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Package size={20} strokeWidth={1.5} />
              Confirmar Separação.
            </h1>
            <p className="ph-sub">Marque cada equipamento conforme for separando para retirada.</p>
          </div>
        </div>

        {/* Progress Section */}
        <div style={sectionWrap}>
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span
                className="pill"
                style={
                  allItemsChecked
                    ? {
                        color: 'hsl(var(--ds-success))',
                        borderColor: 'hsl(var(--ds-success) / 0.3)',
                        background: 'hsl(var(--ds-success) / 0.08)',
                        fontVariantNumeric: 'tabular-nums',
                      }
                    : { fontVariantNumeric: 'tabular-nums' }
                }
              >
                {checkedCount}/{totalCount} itens confirmados
              </span>
              {allItemsChecked && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    color: 'hsl(var(--ds-success))',
                  }}
                >
                  <CheckCircle size={14} strokeWidth={1.5} />
                  <span style={{ fontWeight: 500 }}>Todos os itens confirmados</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: 'hsl(var(--ds-fg-3))',
                }}
              >
                <span>Progresso da separação</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </div>

        {/* Equipment List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {categorizedEquipment.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Nenhum equipamento encontrado para este projeto.</AlertDescription>
            </Alert>
          ) : (
            categorizedEquipment.map((category) => {
              const CategoryIcon = categoryIcons[category.category] || Settings;
              const mainItems = category.items.filter((item) => item.itemType === 'main');
              const standaloneAccessories = category.items.filter((item) => {
                if (item.itemType !== 'accessory') return false;
                if (!item.parentId) return true;
                const parentExists = equipmentData.some((eq) => eq.id === item.parentId);
                return !parentExists;
              });

              return (
                <div key={category.category} style={sectionWrap}>
                  <div style={sectionHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CategoryIcon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                      <span style={eyebrow}>{category.category}</span>
                    </div>
                    <span
                      className="pill muted"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {category.items.length} {category.items.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  <div style={{ padding: 18 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                      {mainItems.map((mainItem) => {
                        const accessories = getAccessoriesForItem(mainItem.id);
                        const mainItemChecked = checkedItems[mainItem.id];
                        const allAccessoriesCheckedForItem = allAccessoriesChecked(mainItem.id);

                        return (
                          <div key={mainItem.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Main Item */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 12,
                                border: '1px solid hsl(var(--ds-line-1))',
                                background: 'hsl(var(--ds-surface))',
                              }}
                            >
                              <Checkbox
                                id={mainItem.id}
                                checked={mainItemChecked}
                                onCheckedChange={() => toggleMainItemWithAccessories(mainItem.id)}
                                className="flex-shrink-0"
                              />
                              <div
                                style={{ flex: 1, minWidth: 0, fontWeight: 500, cursor: 'pointer' }}
                                onClick={() => toggleMainItemWithAccessories(mainItem.id)}
                              >
                                <span
                                  style={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    color: 'hsl(var(--ds-fg-1))',
                                  }}
                                >
                                  {mainItem.name}
                                  {accessories.length > 0 && (
                                    <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginLeft: 8 }}>
                                      • {accessories.length} acessório{accessories.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </span>
                              </div>
                              {mainItemChecked && allAccessoriesCheckedForItem && (
                                <CheckCircle
                                  size={14}
                                  strokeWidth={1.5}
                                  style={{ color: 'hsl(var(--ds-success))', flexShrink: 0 }}
                                />
                              )}
                            </div>

                            {/* Accessories */}
                            {accessories.length > 0 && (
                              <div
                                style={{ marginLeft: 24, display: 'flex', flexDirection: 'column', gap: 4 }}
                              >
                                {accessories.map((accessory) => (
                                  <div
                                    key={accessory.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 12,
                                      padding: '8px 12px',
                                      border: '1px dashed hsl(var(--ds-line-1))',
                                      background: 'hsl(var(--ds-line-2) / 0.3)',
                                    }}
                                  >
                                    <Checkbox
                                      id={accessory.id}
                                      checked={checkedItems[accessory.id] || false}
                                      onCheckedChange={() => toggleItem(accessory.id)}
                                      className="flex-shrink-0"
                                    />
                                    <div
                                      style={{ flex: 1, minWidth: 0, fontSize: 13, cursor: 'pointer' }}
                                      onClick={() => toggleItem(accessory.id)}
                                    >
                                      <span
                                        style={{
                                          display: 'block',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          color: 'hsl(var(--ds-fg-2))',
                                        }}
                                      >
                                        {accessory.name}
                                      </span>
                                    </div>
                                    {checkedItems[accessory.id] && (
                                      <CheckCircle
                                        size={12}
                                        strokeWidth={1.5}
                                        style={{ color: 'hsl(var(--ds-success))', flexShrink: 0 }}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Standalone Accessories */}
                      {standaloneAccessories.length > 0 && (
                        <>
                          {mainItems.length > 0 && (
                            <div style={{ height: 1, background: 'hsl(var(--ds-line-1))', margin: '6px 0' }} />
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <p
                              style={{
                                fontSize: 11,
                                color: 'hsl(var(--ds-fg-3))',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.14em',
                              }}
                            >
                              Acessórios avulsos
                            </p>
                            {standaloneAccessories.map((accessory) => (
                              <div
                                key={accessory.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  padding: 12,
                                  border: '1px dashed hsl(var(--ds-line-1))',
                                  background: 'hsl(var(--ds-line-2) / 0.3)',
                                }}
                              >
                                <Checkbox
                                  id={accessory.id}
                                  checked={checkedItems[accessory.id] || false}
                                  onCheckedChange={() => toggleItem(accessory.id)}
                                  className="flex-shrink-0"
                                />
                                <div
                                  style={{ flex: 1, minWidth: 0, fontSize: 13, cursor: 'pointer' }}
                                  onClick={() => toggleItem(accessory.id)}
                                >
                                  <span
                                    style={{
                                      display: 'block',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      color: 'hsl(var(--ds-fg-2))',
                                    }}
                                  >
                                    {accessory.name}
                                  </span>
                                </div>
                                {checkedItems[accessory.id] && (
                                  <CheckCircle
                                    size={12}
                                    strokeWidth={1.5}
                                    style={{ color: 'hsl(var(--ds-success))', flexShrink: 0 }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Notes Section */}
        <div style={sectionWrap}>
          <div style={sectionHeader}>
            <span style={eyebrow}>Observações da Separação</span>
          </div>
          <div style={{ padding: 18 }}>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre a separação dos equipamentos... (opcional)"
              rows={4}
              className="w-full"
            />
          </div>
        </div>

        {/* Alert */}
        {!allItemsChecked && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Todos os equipamentos e acessórios devem ser confirmados antes de prosseguir com a separação.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 12,
            paddingTop: 24,
            borderTop: '1px solid hsl(var(--ds-line-1))',
            flexWrap: 'wrap',
          }}
        >
          <button type="button" className="btn" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleConfirm}
            disabled={!allItemsChecked || isSubmitting}
            style={{ minWidth: 200 }}
          >
            {isSubmitting ? (
              <>
                <div
                  className="animate-spin"
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                  }}
                />
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                <CheckCircle size={14} strokeWidth={1.5} />
                <span>Confirmar Separação</span>
              </>
            )}
          </button>
        </div>

        <SeparationDialog
          open={showSeparationDialog}
          onOpenChange={setShowSeparationDialog}
          onConfirm={handleSeparationConfirm}
          loading={isSubmitting}
        />
      </div>
    </div>
  );
}
