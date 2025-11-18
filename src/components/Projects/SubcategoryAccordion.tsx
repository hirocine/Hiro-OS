import { useState, useMemo } from 'react';
import { Search, Plus, Check, ChevronDown, CheckCircle2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Equipment {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string | null;
  status: string;
  image?: string;
  patrimonyNumber?: string;
  itemType?: 'main' | 'accessory';
  hasAccessories?: boolean;
  accessoryCount?: number;
  accessories?: Equipment[];
}

interface Subcategory {
  key: string;
  name: string;
  order: number;
  equipment: Equipment[];
}

interface SubcategoryAccordionProps {
  subcategories: Subcategory[];
  selectedEquipment: string[];
  onEquipmentChange: (equipmentId: string) => void;
  className?: string;
}

export function SubcategoryAccordion({
  subcategories,
  selectedEquipment,
  onEquipmentChange,
  className,
}: SubcategoryAccordionProps) {
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Calculate total selected count for badge
  const totalSelected = useMemo(() => {
    return selectedEquipment.length;
  }, [selectedEquipment]);

  // Filter equipment by search term for each subcategory
  const getFilteredEquipment = (subcategoryKey: string, equipment: Equipment[]) => {
    const searchTerm = searchTerms[subcategoryKey]?.toLowerCase() || '';
    if (!searchTerm) return equipment;

    return equipment.filter(
      (eq) =>
        eq.name.toLowerCase().includes(searchTerm) ||
        eq.brand.toLowerCase().includes(searchTerm)
    );
  };

  // Count selected equipment in a subcategory
  const getSubcategorySelectedCount = (equipment: Equipment[]) => {
    let count = 0;
    
    equipment.forEach(eq => {
      // Contar o item principal se estiver selecionado
      if (selectedEquipment.includes(eq.id)) {
        count++;
      }
      
      // Contar os acessórios deste item se estiverem selecionados
      if (eq.accessories && eq.accessories.length > 0) {
        eq.accessories.forEach(acc => {
          if (selectedEquipment.includes(acc.id)) {
            count++;
          }
        });
      }
    });
    
    return count;
  };

  // Handle toggle (add/remove from selection)
  const handleToggle = (equipmentId: string, hasAccessories?: boolean) => {
    onEquipmentChange(equipmentId);
    
    // Se tem acessórios e está sendo adicionado, expandir automaticamente
    if (hasAccessories && !selectedEquipment.includes(equipmentId)) {
      setExpandedItems(prev => new Set(prev).add(equipmentId));
    }
  };

  // Toggle expansão de acessórios
  const toggleExpanded = (equipmentId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(equipmentId)) {
        newSet.delete(equipmentId);
      } else {
        newSet.add(equipmentId);
      }
      return newSet;
    });
  };

  // Contar acessórios selecionados de um item
  const getSelectedAccessoriesCount = (equipment: Equipment) => {
    if (!equipment.accessories) return 0;
    return equipment.accessories.filter(acc => selectedEquipment.includes(acc.id)).length;
  };


  // Filter out empty subcategories
  const nonEmptySubcategories = subcategories.filter(
    (sub) => sub.equipment.length > 0
  );

  if (nonEmptySubcategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Search className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Nenhum equipamento disponível nesta categoria</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Badge */}
      {totalSelected > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
          <span className="text-sm font-medium text-foreground">
            Total selecionado nesta categoria
          </span>
          <Badge className="bg-success/20 text-success border-success/50 text-base px-3 py-1">
            {totalSelected} {totalSelected === 1 ? 'item' : 'itens'}
          </Badge>
        </div>
      )}

      {/* Accordion with Subcategories */}
      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={setOpenItems}
        className="space-y-2"
      >
        {nonEmptySubcategories.map((subcategory) => {
          const filteredEquipment = getFilteredEquipment(
            subcategory.key,
            subcategory.equipment
          );
          const selectedCount = getSubcategorySelectedCount(subcategory.equipment);
          const availableCount = subcategory.equipment.length;

          return (
            <AccordionItem
              key={subcategory.key}
              value={subcategory.key}
              className="border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">
                      {subcategory.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {availableCount}
                    </Badge>
                  </div>
            {selectedCount > 0 && (
              <Badge className="bg-success/20 text-success border-success/50 ml-2">
                {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
              </Badge>
            )}
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Buscar em ${subcategory.name}...`}
                    value={searchTerms[subcategory.key] || ''}
                    onChange={(e) =>
                      setSearchTerms((prev) => ({
                        ...prev,
                        [subcategory.key]: e.target.value,
                      }))
                    }
                    className="pl-10"
                  />
                </div>

                {/* Equipment List */}
                <ScrollArea className="h-[400px] pr-4">
                  {filteredEquipment.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {searchTerms[subcategory.key]
                        ? 'Nenhum equipamento encontrado'
                        : 'Nenhum equipamento disponível'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredEquipment.map((equipment) => {
                        const isSelected = selectedEquipment.includes(equipment.id);
                        const isExpanded = expandedItems.has(equipment.id);
                        const selectedAccessoriesCount = getSelectedAccessoriesCount(equipment);

                        return (
                          <div key={equipment.id} className="space-y-2">
                            {/* Item Principal */}
                            <div
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 relative',
                                isSelected
                                  ? 'bg-success/10 border-success ring-1 ring-success/20 transform scale-[1.01]'
                                  : 'bg-card hover:bg-muted/50 hover:scale-[1.005] border-border'
                              )}
                            >
                              {/* Check icon para indicar seleção */}
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                              {/* Equipment Image */}
                              {equipment.image && (
                                <img
                                  src={equipment.image}
                                  alt={equipment.name}
                                  className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                                />
                              )}

                              {/* Equipment Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate text-foreground">
                                  {equipment.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {equipment.brand}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {equipment.patrimonyNumber && (
                                    <span className="text-xs text-muted-foreground/70">
                                      Pat. {equipment.patrimonyNumber}
                                    </span>
                                  )}
              {equipment.hasAccessories && (
                <Badge 
                  variant={selectedAccessoriesCount > 0 ? "default" : "outline"}
                  className={cn(
                    "text-xs",
                    selectedAccessoriesCount > 0 && "bg-success/20 text-success border-success/50"
                  )}
                >
                  {selectedAccessoriesCount > 0 
                    ? `${selectedAccessoriesCount}/${equipment.accessoryCount} acessórios`
                    : `${equipment.accessoryCount} acessórios`
                  }
                </Badge>
              )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 shrink-0">
                                {equipment.hasAccessories && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleExpanded(equipment.id)}
                                      className="px-2"
                                    >
                                      <ChevronDown
                                        className={cn(
                                          "h-4 w-4 transition-transform",
                                          isExpanded && "rotate-180"
                                        )}
                                      />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant={isSelected ? 'default' : 'outline'}
                                  onClick={() => handleToggle(equipment.id, equipment.hasAccessories)}
                                  className={cn(
                                    "transition-all duration-200",
                                    isSelected && "bg-success hover:bg-success/90 text-white border-success"
                                  )}
                                >
                                  {isSelected ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Adicionado
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-1" />
                                      Adicionar
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Lista de Acessórios (Expandível) */}
                            {equipment.hasAccessories && isExpanded && equipment.accessories && (
            <div className={cn(
              "ml-8 space-y-2 border-l-2 pl-4 transition-colors duration-300",
              isSelected ? "border-success/50" : "border-muted"
            )}>
                                {equipment.accessories.map((accessory) => {
                                  const isAccessorySelected = selectedEquipment.includes(accessory.id);
                                  
                                  return (
                <div
                  key={accessory.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md transition-all duration-300 relative',
                    isAccessorySelected
                      ? 'bg-success/15 border border-success/50 animate-in fade-in-0 duration-200'
                      : 'bg-muted/30 hover:bg-muted/50'
                  )}
                >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {accessory.image && (
                                          <img
                                            src={accessory.image}
                                            alt={accessory.name}
                                            className="w-8 h-8 object-cover rounded flex-shrink-0"
                                          />
                                        )}
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-sm font-medium truncate">
                                            {accessory.name}
                                          </span>
                                          <span className="text-xs text-muted-foreground truncate">
                                            {accessory.brand}
                                          </span>
                                        </div>
                                      </div>

                                      <Button
                                        size="sm"
                                        variant={isAccessorySelected ? 'default' : 'outline'}
                                        onClick={() => handleToggle(accessory.id)}
                                        className={cn(
                                          "shrink-0 transition-all duration-200",
                                          isAccessorySelected && "bg-success hover:bg-success/90 text-white border-success"
                                        )}
                                      >
                                        {isAccessorySelected ? (
                                          <>
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Adicionado
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="h-3 w-3 mr-1" />
                                            Adicionar
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
