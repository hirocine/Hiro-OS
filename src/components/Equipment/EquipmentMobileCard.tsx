import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Edit, Trash2, MoreVertical, Package, Link, Upload } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEquipmentCard } from '@/hooks/useEquipmentCard';

interface EquipmentMobileCardProps {
  equipment: Equipment;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
  onImageUpload: (equipment: Equipment, file: File) => void;
  onConvertToAccessory?: (equipment: Equipment) => void;
  accessoryCount?: number;
}

export const EquipmentMobileCard = memo(function EquipmentMobileCard({
  equipment,
  onEdit,
  onDelete,
  onImageUpload,
  onConvertToAccessory,
  accessoryCount = 0,
}: EquipmentMobileCardProps) {
  const {
    getStatusVariant,
    getStatusLabel,
    formatCurrency,
    handleImageUpload,
    isUploading,
    getHierarchyIndicator,
  } = useEquipmentCard();

  const hierarchyInfo = getHierarchyIndicator(equipment, accessoryCount);
  const uploading = isUploading(equipment.id);

  const handleImageClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await handleImageUpload(equipment, file, onImageUpload);
      }
    };
    fileInput.click();
  };

  return (
    <Card className="overflow-hidden hover:shadow-elegant transition-all duration-300 animate-fade-in mobile-safe min-w-0">
      <CardContent className="p-4 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 min-w-0 gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={handleImageClick}
              disabled={uploading}
              className="w-12 h-12 flex-shrink-0 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center bg-muted/30 hover:bg-muted/50 group relative"
            >
              {uploading ? (
                <Upload className="h-5 w-5 text-primary animate-pulse" />
              ) : equipment.image ? (
                <img
                  src={equipment.image}
                  alt={equipment.name}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <Camera className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </button>
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="font-medium text-card-foreground truncate">
                {equipment?.name || 'Nome não informado'}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {equipment?.brand || 'Marca não informada'}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(equipment)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {equipment.itemType === 'main' && onConvertToAccessory && (
                <DropdownMenuItem onClick={() => onConvertToAccessory(equipment)}>
                  Converter para Acessório
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(equipment)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status and Category */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant={getStatusVariant(equipment.status)}>
            {getStatusLabel(equipment.status)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {equipment.category}
          </Badge>
          <Badge variant={hierarchyInfo.variant} className="text-xs flex items-center gap-1">
            {hierarchyInfo.icon === 'package' && <Package className="h-3 w-3" />}
            {hierarchyInfo.icon === 'link' && <Link className="h-3 w-3" />}
            {hierarchyInfo.label}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          {equipment.patrimonyNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Patrimônio:</span>
              <span className="font-medium">{equipment.patrimonyNumber}</span>
            </div>
          )}
          {equipment.subcategory && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subcategoria:</span>
              <span className="truncate ml-2">{equipment.subcategory}</span>
            </div>
          )}
          {equipment.serialNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Série:</span>
              <span className="truncate ml-2">{equipment.serialNumber}</span>
            </div>
          )}
          {equipment.value && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-medium text-success">
                {formatCurrency(equipment.value)}
              </span>
            </div>
          )}
        </div>

        {/* Current Loan Info */}
        {equipment.currentBorrower && (
          <div className="mt-3 p-2 bg-warning/10 rounded-md border border-warning/20">
            <p className="text-xs text-warning-foreground">
              <strong>Emprestado para:</strong> {equipment.currentBorrower}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});