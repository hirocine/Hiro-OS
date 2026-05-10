import { useParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { useEquipmentForm } from '@/hooks/useEquipmentForm';
import { EquipmentForm } from '@/components/Equipment/EquipmentForm';

export default function AddEquipment() {
  const { id } = useParams<{ id: string }>();
  const {
    formData,
    isSubmitting,
    isLoading,
    updateField,
    handleSubmit,
    handleCancel,
    formatCurrency,
    parseCurrencyInput,
    getMainItems,
    getSelectedParentName,
    imageUrl,
    isUploadingImage,
    handleImageUpload,
    handleImageRemove,
    isEditMode,
  } = useEquipmentForm({ equipmentId: id });

  if (isLoading) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner">
          <div className="ph">
            <div>
              <span className="sk line lg" style={{ width: 240 }} />
            </div>
          </div>
          <div style={{ marginTop: 24, border: '1px solid hsl(var(--ds-line-1))', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span className="sk line" style={{ width: '100%' }} />
            <span className="sk line" style={{ width: '100%' }} />
            <span className="sk line lg" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <BreadcrumbNav
          items={[
            { label: 'Inventário', href: '/inventario' },
            { label: isEditMode ? 'Editar Equipamento' : 'Adicionar Equipamento' },
          ]}
        />

        <div className="ph">
          <div>
            <h1 className="ph-title">{isEditMode ? 'Editar Equipamento.' : 'Adicionar Equipamento.'}</h1>
            <p className="ph-sub">
              {isEditMode ? 'Atualize as informações do equipamento.' : 'Preencha os dados para adicionar um novo equipamento ao inventário.'}
            </p>
          </div>
        </div>

        <div style={{ marginTop: 24, border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--ds-line-1))', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: 'hsl(var(--ds-accent) / 0.1)', color: 'hsl(var(--ds-accent))' }}>
              <Package size={16} strokeWidth={1.5} />
            </div>
            <div>
              <h2 style={{ fontFamily: '"HN Display", sans-serif', fontSize: 15, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>
                Dados do Equipamento
              </h2>
              <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                Campos marcados com * são obrigatórios
              </p>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            <EquipmentForm
              formData={formData}
              updateField={updateField}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              isEditMode={isEditMode}
              formatCurrency={formatCurrency}
              parseCurrencyInput={parseCurrencyInput}
              getMainItems={getMainItems}
              getSelectedParentName={getSelectedParentName}
              imageUrl={imageUrl}
              isUploadingImage={isUploadingImage}
              handleImageUpload={handleImageUpload}
              handleImageRemove={handleImageRemove}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
