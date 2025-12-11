import React, { useRef, memo, useCallback } from 'react';
import { Equipment } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronRight, ChevronDown, Edit, Trash2, Camera, Package, ArrowUpRight, Upload } from 'lucide-react';
import { AdminOnly } from '@/components/RoleGuard';
import { useEquipmentCard } from '@/hooks/useEquipmentCard';
import { useCategories } from '@/hooks/useCategories';

interface EquipmentTableRowProps {
  equipment: Equipment;
  accessories?: Equipment[];
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
  onToggleExpansion: (id: string) => void;
  onImageUpload?: (equipmentId: string, file: File) => void;
  onConvertToAccessory?: (equipment: Equipment) => void;
  level?: number;
  className?: string;
  selected?: boolean;
  onToggleSelection?: (id: string) => void;
}

export const EquipmentTableRow = memo(function EquipmentTableRow({
  equipment,
  accessories = [],
  onEdit,
  onDelete,
  onToggleExpansion,
  onImageUpload,
  onConvertToAccessory,
  level = 0,
  className = '',
  selected = false,
  onToggleSelection,
}: EquipmentTableRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getCategoryTitle } = useCategories();
  const {
    getStatusVariant,
    getStatusLabel,
    formatCurrency,
    handleImageUpload,
    isUploading,
  } = useEquipmentCard();

  const uploading = isUploading(equipment.id);

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      await handleImageUpload(equipment, file, (eq, f) => onImageUpload(eq.id, f));
    }
  }, [equipment, onImageUpload, handleImageUpload]);

  const isMainItem = equipment.itemType === 'main';
  const hasAccessories = accessories.length > 0;
  const isExpanded = equipment.isExpanded;

  return (
    <>
      <div 
        className={`grid grid-cols-[40px_40px_60px_minmax(250px,1fr)_minmax(140px,200px)_minmax(120px,160px)_100px_120px_120px] gap-2 lg:gap-3 px-2 lg:px-4 py-3 border-b transition-all duration-200 hover:bg-muted/30 border-border ${
          selected ? 'bg-primary/5 border-primary/20' : ''
        } ${level > 0 ? 'ml-6 border-l-2 border-primary/20 bg-muted/10' : ''} ${className}`}
      >

        {/* Checkbox */}
        <div className="flex items-center justify-center">
          {onToggleSelection && level === 0 && (
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelection(equipment.id)}
            />
          )}
        </div>

        {/* Expansão / Tipo */}
        <div className="flex items-center justify-center">
          {isMainItem && hasAccessories ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExpansion(equipment.id)}
                    className="h-7 w-7 p-0 hover:bg-accent/30 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExpanded ? 'Recolher' : 'Expandir'} acessórios</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="h-7 w-7 flex items-center justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-default">
                      {isMainItem ? (
                        <Package className="h-4 w-4 text-primary" />
                      ) : (
                        <div className="flex items-center text-muted-foreground">
                          <div className="w-3 h-3 border-l-2 border-b-2 border-muted-foreground/40 mr-1"></div>
                          <Package className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isMainItem ? 'Item principal' : 'Acessório'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Imagem */}
        <div className="flex items-center justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 cursor-pointer hover:border-accent hover:bg-accent/10 transition-all duration-200 flex items-center justify-center group relative overflow-hidden"
                  onClick={handleImageClick}
                >
                  {uploading ? (
                    <div className="animate-pulse">
                      <Upload className="h-4 w-4 text-primary animate-bounce" />
                    </div>
                  ) : equipment.image ? (
                    <>
                      <img 
                        src={equipment.image} 
                        alt={equipment.name} 
                        className="w-full h-full object-cover rounded-md"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-4 w-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <Camera className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{equipment.image ? 'Alterar imagem' : 'Adicionar imagem'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Nome e modelo */}
        <div className="flex flex-col justify-center min-w-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-default">
                  <span className="font-medium text-sm leading-tight truncate block" title={equipment.name}>
                    {equipment.name}
                  </span>
                  {equipment.serialNumber && (
                    <span className="text-xs text-muted-foreground truncate block mt-0.5" title={`SN: ${equipment.serialNumber}`}>
                      SN: {equipment.serialNumber}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div>
                  <p className="font-medium">{equipment.name}</p>
                  {equipment.serialNumber && (
                    <p className="text-xs text-muted-foreground">Serial: {equipment.serialNumber}</p>
                  )}
                  {equipment.patrimonyNumber && (
                    <p className="text-xs text-muted-foreground">Patrimônio: {equipment.patrimonyNumber}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isMainItem && hasAccessories && (
            <div className="mt-1">
              <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                {accessories.length} acessório{accessories.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        {/* Marca */}
        <div className="flex items-center min-w-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm truncate cursor-default" title={equipment.brand}>
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
        <div className="flex items-center min-w-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-default">
                  <span className="text-sm truncate block">
                    {getCategoryTitle(equipment.category)}
                  </span>
                  {equipment.subcategory && (
                    <span className="text-xs text-muted-foreground truncate block">
                      {equipment.subcategory}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div>
                  <p>{getCategoryTitle(equipment.category)}</p>
                  {equipment.subcategory && (
                    <p className="text-xs text-muted-foreground">{equipment.subcategory}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Status */}
        <div className="flex items-center">
          <Badge 
            variant={getStatusVariant(equipment.status)}
            className="text-xs font-medium"
          >
            {getStatusLabel(equipment.status)}
          </Badge>
        </div>

        {/* Valor */}
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium cursor-default">
                  {formatCurrency(equipment.value)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div>
                  {equipment.value && (
                    <>
                      <p>Valor: {formatCurrency(equipment.value)}</p>
                      {equipment.depreciatedValue && equipment.depreciatedValue !== equipment.value && (
                        <p className="text-xs text-muted-foreground">
                          Depreciado: {formatCurrency(equipment.depreciatedValue)}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEdit(equipment)}
                  className="h-8 w-8 p-0 hover:bg-accent/30 hover:text-accent-foreground transition-colors"
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
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
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
            fallback={<div className="h-8 w-8" />}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDelete(equipment.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
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

      {/* Acessórios expandidos com animação */}
      {isMainItem && isExpanded && accessories.length > 0 && (
        <div className="animate-fade-in">
          {accessories.map((accessory) => (
            <EquipmentTableRow
              key={accessory.id}
              equipment={accessory}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleExpansion={onToggleExpansion}
              onImageUpload={onImageUpload}
              onConvertToAccessory={onConvertToAccessory}
              level={level + 1}
              className="animate-fade-in"
            />
          ))}
        </div>
      )}
    </>
  );
});