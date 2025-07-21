import { Equipment } from '@/types/equipment';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, MapPin, Calendar } from 'lucide-react';
import { categoryLabels, statusLabels } from '@/data/mockData';

interface EquipmentCardProps {
  equipment: Equipment;
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
}

export function EquipmentCard({ equipment, onEdit, onDelete }: EquipmentCardProps) {
  const getStatusVariant = (status: Equipment['status']) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'in-use':
        return 'warning';
      case 'maintenance':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="shadow-card hover:shadow-elegant transition-all duration-200 hover:scale-[1.02] animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-none tracking-tight">
              {equipment.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {equipment.brand} • {equipment.model}
            </p>
          </div>
          <Badge variant={getStatusVariant(equipment.status)}>
            {statusLabels[equipment.status]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Categoria:</span>
            {categoryLabels[equipment.category]}
          </div>
          
          {equipment.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              {equipment.location}
            </div>
          )}
          
          {equipment.purchaseDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Comprado em {new Date(equipment.purchaseDate).toLocaleDateString('pt-BR')}
            </div>
          )}
          
          {equipment.value && (
            <div className="font-medium text-foreground">
              {formatCurrency(equipment.value)}
            </div>
          )}
        </div>
        
        {equipment.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {equipment.description}
          </p>
        )}
        
        {equipment.serialNumber && (
          <div className="text-xs text-muted-foreground font-mono">
            S/N: {equipment.serialNumber}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2 pt-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(equipment)}
          className="flex-1"
        >
          <Edit className="h-3 w-3" />
          Editar
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onDelete(equipment.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}