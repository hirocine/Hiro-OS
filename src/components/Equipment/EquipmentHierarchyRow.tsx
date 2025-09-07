import React, { useRef, memo, useCallback } from 'react';
import { Equipment } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronRight, ChevronDown, Edit, Trash2, Camera, Package, MoreVertical, ArrowUpRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { categoryLabels, statusLabels } from '@/data/mockData';
import { AdminOnly } from '@/components/RoleGuard';

interface EquipmentHierarchyRowProps {
  equipment: Equipment;
  accessories?: Equipment[];
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
  onToggleExpansion: (id: string) => void;
  onImageUpload?: (equipmentId: string, file: File) => void;
  onConvertToAccessory?: (equipment: Equipment) => void;
  level?: number;
  isSelected?: boolean;
  onSelectionChange?: () => void;
}

export const EquipmentHierarchyRow = memo(function EquipmentHierarchyRow({
  equipment,
  accessories = [],
  onEdit,
  onDelete,
  onToggleExpansion,
  onImageUpload,
  onConvertToAccessory,
  level = 0,
  isSelected = false,
  onSelectionChange
}: EquipmentHierarchyRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'maintenance': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(equipment.id, file);
    }
  }, [equipment.id, onImageUpload]);

  const isMainItem = equipment.itemType === 'main';
  const hasAccessories = accessories.length > 0;
  const isExpanded = equipment.isExpanded;

  return (
    <>
      <div 
        className={`grid grid-cols-13 gap-3 px-4 py-3 border-b transition-all duration-200 ${
          isSelected ? 'bg-accent/20 border-accent/50' : 'hover:bg-muted/50 border-border'
        } ${level > 0 ? 'ml-8 border-l-2 border-primary/30' : ''}`}
      >
        {/* Seleção */}
        {level === 0 && (
          <div className="col-span-1 flex items-center justify-center">
            {onSelectionChange && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelectionChange}
                className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
              />
            )}
          </div>
        )}
        
        {/* Espacer para acessórios */}
        {level > 0 && <div className="col-span-1"></div>}

        {/* Expansão / Tipo */}
        <div className="col-span-1 flex items-center justify-center">
          {isMainItem && hasAccessories ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpansion(equipment.id)}
              className="h-7 w-7 p-0 hover:bg-accent/30"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="h-7 w-7 flex items-center justify-center">
              {isMainItem ? (
                <Package className="h-4 w-4 text-primary" />
              ) : (
                <div className="flex items-center text-muted-foreground">
                  <div className="w-3 h-3 border-l-2 border-b-2 border-muted-foreground/40 mr-1"></div>
                  <Package className="h-3 w-3" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Imagem */}
        <div className="col-span-1 flex items-center justify-center">
          <div 
            className="w-10 h-10 rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/50 cursor-pointer hover:border-accent hover:bg-accent/10 transition-all duration-200 flex items-center justify-center group"
            onClick={handleImageClick}
          >
            {equipment.image ? (
              <img src={equipment.image} alt={equipment.name} className="w-full h-full object-cover rounded-md" />
            ) : (
              <Camera className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Patrimônio */}
        <div className="col-span-1 flex items-center text-sm font-mono">
          {equipment.patrimonyNumber || '-'}
        </div>

        {/* Nome */}
        <div className="col-span-3 flex flex-col min-w-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium truncate" title={equipment.name}>
                  {equipment.name}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{equipment.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isMainItem && hasAccessories && (
            <div className="mt-1">
              <Badge variant="outline" className="text-xs">
                {accessories.length} acessório{accessories.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        {/* Marca */}
        <div className="col-span-1 flex items-center text-sm min-w-0 overflow-hidden">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium truncate" title={equipment.brand}>
                  {equipment.brand}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{equipment.brand}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Categoria */}
        <div className="col-span-1 flex items-center text-sm min-w-0 overflow-hidden">
          <span className="truncate">
            {categoryLabels[equipment.category]}
          </span>
        </div>

        {/* Subcategoria */}
        <div className="col-span-1 flex items-center text-sm min-w-0 overflow-hidden">
          <span className="truncate">
            {equipment.subcategory || '-'}
          </span>
        </div>

        {/* Valor */}
        <div className="col-span-1 flex items-center text-sm font-medium">
          {formatCurrency(equipment.value)}
        </div>

        {/* Ações */}
        <div className="col-span-2 flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEdit(equipment)}
                  className="h-8 w-8 p-0 hover:bg-accent/30 hover:text-accent-foreground"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar equipamento</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {isMainItem && onConvertToAccessory && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onConvertToAccessory(equipment)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-accent hover:bg-accent/10"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Converter para acessório</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <AdminOnly 
            fallback={
              <div className="h-8 w-8" /> // Placeholder para manter alinhamento
            }
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDelete(equipment.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Excluir equipamento</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </AdminOnly>
        </div>
      </div>

      {/* Acessórios expandidos */}
      {isMainItem && isExpanded && accessories.map((accessory) => (
        <EquipmentHierarchyRow
          key={accessory.id}
          equipment={accessory}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleExpansion={onToggleExpansion}
          onImageUpload={onImageUpload}
          onConvertToAccessory={onConvertToAccessory}
          level={level + 1}
        />
      ))}
    </>
  );
});