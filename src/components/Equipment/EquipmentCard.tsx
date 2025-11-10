import { Equipment } from '@/types/equipment';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Calendar, UserCheck, Package, Link } from 'lucide-react';
import { useEquipmentCard } from '@/hooks/useEquipmentCard';
import { getCategoryTitle } from '@/lib/categoryUtils';

interface EquipmentCardProps {
  equipment: Equipment;
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
  onLoan?: (equipment: Equipment) => void;
  onReturn?: (equipment: Equipment) => void;
  accessoryCount?: number;
}

export function EquipmentCard({ 
  equipment, 
  onEdit, 
  onDelete, 
  onLoan, 
  onReturn,
  accessoryCount = 0 
}: EquipmentCardProps) {
  const {
    getStatusVariant,
    getStatusLabel,
    formatCurrency,
    getHierarchyIndicator,
  } = useEquipmentCard();

  const hierarchyInfo = getHierarchyIndicator(equipment, accessoryCount);

  return (
    <Card className="shadow-card hover:shadow-elegant transition-all duration-200 hover:scale-[1.02] animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-none tracking-tight">
              {equipment.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {equipment.brand}
            </p>
          </div>
          <Badge variant={getStatusVariant(equipment.status)}>
            {getStatusLabel(equipment.status)}
          </Badge>
        </div>
        {/* Hierarchy indicator */}
        <div className="mt-2">
          <Badge variant={hierarchyInfo.variant} className="text-xs flex items-center gap-1">
            {hierarchyInfo.icon === 'package' && <Package className="h-3 w-3" />}
            {hierarchyInfo.icon === 'link' && <Link className="h-3 w-3" />}
            {hierarchyInfo.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Categoria:</span>
            {getCategoryTitle(equipment.category)}
          </div>
          
          {equipment.patrimonyNumber && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Patrimônio:</span>
              {equipment.patrimonyNumber}
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
        
        {equipment.currentBorrower && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <UserCheck className="h-4 w-4 text-primary" />
              <span className="font-medium">Em projetos</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Último empréstimo: {equipment.currentBorrower}
            </p>
            {equipment.lastLoanDate && (
              <p className="text-xs text-muted-foreground">
                Retirado em {new Date(equipment.lastLoanDate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        )}
        
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
        
        {onLoan && (
          <Button 
            variant="success" 
            size="sm" 
            onClick={() => onLoan(equipment)}
          >
            <UserCheck className="h-3 w-3" />
            Retirar
          </Button>
        )}
        
        
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