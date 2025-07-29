import React, { useRef } from 'react';
import { Equipment } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronRight, ChevronDown, Edit, Trash2, Camera, Package, MoreVertical, ArrowUpRight } from 'lucide-react';
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
}

export function EquipmentHierarchyRow({
  equipment,
  accessories = [],
  onEdit,
  onDelete,
  onToggleExpansion,
  onImageUpload,
  onConvertToAccessory,
  level = 0
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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(equipment.id, file);
    }
  };

  const isMainItem = equipment.itemType === 'main';
  const hasAccessories = accessories.length > 0;
  const isExpanded = equipment.isExpanded;

  return (
    <>
      <div 
        className={`grid grid-cols-12 gap-4 p-4 border-b hover:bg-accent/50 transition-colors ${
          level > 0 ? 'ml-8 border-l-2 border-primary/20' : ''
        }`}
      >
        {/* Expansão / Tipo */}
        <div className="col-span-1 flex items-center">
          {isMainItem && hasAccessories ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpansion(equipment.id)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="h-6 w-6 flex items-center justify-center">
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
        <div className="col-span-1 flex items-center">
          <div 
            className="w-12 h-12 rounded border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-primary transition-colors flex items-center justify-center"
            onClick={handleImageClick}
          >
            {equipment.image ? (
              <img src={equipment.image} alt={equipment.name} className="w-full h-full object-cover rounded" />
            ) : (
              <Camera className="h-5 w-5 text-gray-400" />
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
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit(equipment)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          {isMainItem && onConvertToAccessory && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onConvertToAccessory(equipment)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
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
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDelete(equipment.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
}