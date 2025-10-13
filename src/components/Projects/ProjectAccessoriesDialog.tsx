import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import { Equipment } from "@/types/equipment";

interface ProjectAccessoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentEquipmentId: string | null;
  equipment: Array<Equipment & { 
    loanInfo?: any;
    accessoryCount?: number;
  }>;
}

export function ProjectAccessoriesDialog({ 
  open, 
  onOpenChange, 
  parentEquipmentId,
  equipment 
}: ProjectAccessoriesDialogProps) {
  const accessories = equipment.filter(
    eq => eq.parentId === parentEquipmentId && eq.itemType === 'accessory'
  );
  
  const parentEquipment = equipment.find(eq => eq.id === parentEquipmentId);
  
  if (!parentEquipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Acessórios de {parentEquipment.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {accessories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum acessório encontrado
            </p>
          ) : (
            accessories.map((accessory) => (
              <Card key={accessory.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-medium truncate">{accessory.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          Acessório
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span>{accessory.brand}</span>
                          {accessory.patrimonyNumber && (
                            <span>• Patrimônio: {accessory.patrimonyNumber}</span>
                          )}
                        </div>
                        
                        {accessory.serialNumber && (
                          <div className="text-xs">
                            Serial: {accessory.serialNumber}
                          </div>
                        )}
                        
                        {accessory.description && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {accessory.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {accessory.image && (
                      <img 
                        src={accessory.image} 
                        alt={accessory.name}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
