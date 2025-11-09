import { useState } from 'react';
import { Edit, Trash2, Upload, MoreVertical, Paperclip, Camera, Package, Link } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useEquipmentCard } from '@/hooks/useEquipmentCard';

interface SelectableEquipmentCardProps {
  equipment: Equipment;
  isSelected: boolean;
  onToggleSelect: (equipmentId: string) => void;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
  onImageUpload: (equipment: Equipment, file: File) => void;
  onConvertToAccessory?: (equipment: Equipment) => void;
  isLoading?: boolean;
  accessoryCount?: number;
}

export function SelectableEquipmentCard({
  equipment,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onImageUpload,
  onConvertToAccessory,
  isLoading = false,
  accessoryCount = 0
}: SelectableEquipmentCardProps) {
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

  const handleImageUploadWrapper = async (file: File) => {
    await handleImageUpload(equipment, file, onImageUpload);
  };

  return (
    <Card className={cn(
      "relative transition-all duration-200 hover:shadow-md",
      isSelected && "ring-2 ring-green-500 shadow-lg bg-green-50/50 dark:bg-green-950/20",
      isLoading && "opacity-50 pointer-events-none"
    )}>
      <div className="absolute top-4 left-4 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(equipment.id)}
          className="bg-background shadow-sm"
        />
      </div>

      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Image Section */}
          <div className="relative">
            <div 
              className="h-48 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group"
              onClick={() => document.getElementById(`file-input-${equipment.id}`)?.click()}
            >
              {equipment.image ? (
                <img 
                  src={equipment.image} 
                  alt={equipment.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center text-muted-foreground group-hover:text-primary transition-colors">
                  <Camera className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm font-medium">Adicionar foto</p>
                </div>
              )}
              
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm">Enviando...</p>
                  </div>
                </div>
              )}
              
              <input
                id={`file-input-${equipment.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUploadWrapper(file);
                }}
              />
            </div>
          </div>

          {/* Equipment Info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm leading-tight truncate" title={equipment.name}>
                  {equipment.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {equipment.brand} • {equipment.category}
                </p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Menu de ações</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover">
                  <DropdownMenuItem onClick={() => onEdit(equipment)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  {equipment.itemType === 'main' && onConvertToAccessory && (
                    <DropdownMenuItem onClick={() => onConvertToAccessory(equipment)}>
                      <Paperclip className="h-4 w-4 mr-2" />
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

            {/* Details */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Patrimônio:</span>
                <span className="font-medium">{equipment.patrimonyNumber || 'N/A'}</span>
              </div>
              
              {equipment.value && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium">{formatCurrency(equipment.value)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={getStatusVariant(equipment.status)} className="text-xs">
                  {getStatusLabel(equipment.status)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <Badge variant={hierarchyInfo.variant} className="text-xs flex items-center gap-1">
                  {hierarchyInfo.icon === 'package' && <Package className="h-3 w-3" />}
                  {hierarchyInfo.icon === 'link' && <Link className="h-3 w-3" />}
                  {hierarchyInfo.label}
                </Badge>
              </div>
              
              {equipment.subcategory && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subcategoria:</span>
                  <span className="font-medium truncate max-w-24" title={equipment.subcategory}>
                    {equipment.subcategory}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}