import { Equipment } from '@/types/equipment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Upload, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRef } from 'react';

interface EquipmentRowProps {
  equipment: Equipment;
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
  onImageUpload: (id: string, file: File) => void;
}

export function EquipmentRow({ equipment, onEdit, onDelete, onImageUpload }: EquipmentRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusVariant = (status: Equipment['status']) => {
    switch (status) {
      case 'available': return 'success';
      case 'maintenance': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: Equipment['status']) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'maintenance': return 'Manutenção';
      default: return status;
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(equipment.id, file);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 py-4 px-4 border-b border-border hover:bg-accent/50 transition-colors items-center">
      {/* Image */}
      <div className="col-span-1">
        <div 
          className="w-12 h-12 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors group"
          onClick={handleImageClick}
        >
          {equipment.image ? (
            <img 
              src={equipment.image} 
              alt={equipment.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Camera className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          )}
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Patrimony */}
      <div className="col-span-1">
        <div className="text-sm">{equipment.patrimonyNumber || '-'}</div>
      </div>

      {/* Name */}
      <div className="col-span-2">
        <div className="font-medium">{equipment.name}</div>
      </div>

      {/* Brand */}
      <div className="col-span-1">
        <div className="text-sm text-muted-foreground">{equipment.brand}</div>
      </div>

      {/* Model */}
      <div className="col-span-1">
        <div className="text-sm">{equipment.model}</div>
      </div>

      {/* Category */}
      <div className="col-span-1">
        <div className="text-sm capitalize">{equipment.category}</div>
      </div>

      {/* Serial Number */}
      <div className="col-span-1">
        <div className="text-sm font-mono">{equipment.serialNumber || '-'}</div>
      </div>

      {/* Value */}
      <div className="col-span-1">
        <div className="text-sm">{formatCurrency(equipment.value)}</div>
      </div>

      {/* Status */}
      <div className="col-span-1">
        <Badge variant={getStatusVariant(equipment.status)}>
          {getStatusLabel(equipment.status)}
        </Badge>
      </div>

      {/* Actions */}
      <div className="col-span-2 flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(equipment)}
        >
          <Edit className="h-3 w-3 mr-1" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(equipment.id)}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Excluir
        </Button>
      </div>
    </div>
  );
}