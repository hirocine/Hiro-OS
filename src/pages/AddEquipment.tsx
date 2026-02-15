import { useParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { useEquipmentForm } from '@/hooks/useEquipmentForm';
import { EquipmentForm } from '@/components/Equipment/EquipmentForm';
import { Skeleton } from '@/components/ui/skeleton';

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
    isEditMode
  } = useEquipmentForm({ equipmentId: id });

  if (isLoading) {
    return (
      <ResponsiveContainer maxWidth="4xl" className="min-h-screen">
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="4xl" className="min-h-screen pb-8 animate-fade-in">
      <BreadcrumbNav 
        items={[
          { label: 'Inventário', href: '/inventario' },
          { label: isEditMode ? 'Editar Equipamento' : 'Adicionar Equipamento' }
        ]} 
      />

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          {isEditMode ? 'Editar Equipamento' : 'Adicionar Equipamento'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEditMode ? 'Atualize as informações do equipamento' : 'Preencha os dados para adicionar um novo equipamento ao inventário'}
        </p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Dados do Equipamento</h2>
              <p className="text-sm text-muted-foreground">
                Campos marcados com * são obrigatórios
              </p>
            </div>
          </div>

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
        </CardContent>
      </Card>
    </ResponsiveContainer>
  );
}
