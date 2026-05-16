import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useProjectEquipment } from '@/features/projects';
import { useSeparationChecklist } from '@/hooks/useSeparationChecklist';
import { useProjectDetails } from '@/features/projects';
import { useToast } from '@/hooks/use-toast';
import { VerificationDialog } from '@/components/Projects/VerificationDialog';
import { useAuthContext } from '@/contexts/AuthContext';
import { StatusPill } from '@/ds/components/StatusPill';
import {
  CheckCircle2,
  CheckCircle,
  AlertTriangle,
  Camera,
  Mic,
  Lightbulb,
  Settings,
  HardDrive,
  ClipboardCheck,
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

export default function ProjectVerification() {
  useCategories();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
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
    setShowVerificationDialog(true);
  };

  const handleVerificationConfirm = async (data: { userId: string; userName: string; timestamp: string }) => {
    setIsSubmitting(true);
    try {
      await updateProjectStep('pending_verification', notes.trim() || undefined, {
        userId: data.userId,
        userName: data.userName,
        timestamp: data.timestamp,
      });

      toast({
        title: 'Verificação concluída',
        description: 'A verificação dos equipamentos foi confirmada com sucesso.',
      });
      navigate(`/retiradas/${id}`);
    } catch (error) {
      toast({
        title: 'Erro ao confirmar verificação',
        description: 'Não foi possível confirmar a verificação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setShowVerificationDialog(false);
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
          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>Preparando lista de verificação</p>
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
            { label: 'Verificação' },
          ]}
        />

        {/* Header */}
        <div className="ph">
          <div>
            <h1 className="ph-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClipboardCheck size={20} strokeWidth={1.5} />
              Check de Desmontagem.
            </h1>
            <p className="ph-sub">Verifique cada equipamento ao receber de volta no escritório.</p>
          </div>
        </div>

        {/* Progress Section */}
        <div style={sectionWrap}>
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <StatusPill
                label={`${checkedCount}/${totalCount} itens verificados`}
                tone={allItemsChecked ? 'success' : 'muted'}
              />
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
                  <span style={{ fontWeight: 500 }}>Todos os itens verificados</span>
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
                <span>Progresso da verificação</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(progressPercentage)}%</span>
              </div>
              <div style={{ height: 4, background: 'hsl(var(--ds-line-1))', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPercentage}%`, background: 'hsl(var(--ds-text))', transition: 'width 0.25s ease' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Equipment List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {categorizedEquipment.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-surface))',
              }}
            >
              <AlertTriangle size={16} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: 'hsl(var(--ds-text))', lineHeight: 1.5 }}>Nenhum equipamento encontrado para este projeto.</div>
            </div>
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
                    <span className="pill muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
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
                              <div style={{ marginLeft: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
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
            <span style={eyebrow}>Observações da Verificação</span>
          </div>
          <div style={{ padding: 18 }}>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre o estado dos equipamentos após desmontagem... (opcional)"
              rows={4}
              className="w-full"
            />
          </div>
        </div>

        {/* Alert */}
        {!allItemsChecked && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
            }}
          >
            <AlertTriangle size={16} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: 'hsl(var(--ds-text))', lineHeight: 1.5 }}>
              Todos os equipamentos e acessórios devem ser verificados antes de finalizar o projeto.
            </div>
          </div>
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
                <span>Finalizando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} strokeWidth={1.5} />
                <span>Finalizar Verificação</span>
              </>
            )}
          </button>
        </div>

        <VerificationDialog
          open={showVerificationDialog}
          onOpenChange={setShowVerificationDialog}
          onConfirm={handleVerificationConfirm}
          loading={isSubmitting}
        />
      </div>
    </div>
  );
}
