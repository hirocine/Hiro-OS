import { useState, useMemo } from 'react';
import { Search, Plus, Minus, Package } from 'lucide-react';
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
}

interface Subcategory {
  key: string;
  name: string;
  order: number;
  equipment: Equipment[];
}

interface SubcategoryAccordionProps {
  subcategories: Subcategory[];
  selectedEquipment: Record<string, number>;
  onEquipmentChange: (equipmentId: string, quantity: number) => void;
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

  // Calculate total selected count for badge
  const totalSelected = useMemo(() => {
    return Object.values(selectedEquipment).reduce((sum, qty) => sum + qty, 0);
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
    return equipment.reduce((count, eq) => {
      return count + (selectedEquipment[eq.id] || 0);
    }, 0);
  };

  // Handle increment/decrement
  const handleIncrement = (equipmentId: string) => {
    const currentQty = selectedEquipment[equipmentId] || 0;
    onEquipmentChange(equipmentId, currentQty + 1);
  };

  const handleDecrement = (equipmentId: string) => {
    const currentQty = selectedEquipment[equipmentId] || 0;
    if (currentQty > 0) {
      onEquipmentChange(equipmentId, currentQty - 1);
    }
  };

  // Filter out empty subcategories
  const nonEmptySubcategories = subcategories.filter(
    (sub) => sub.equipment.length > 0
  );

  if (nonEmptySubcategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mb-4 opacity-50" />
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
          <Badge variant="default" className="text-base px-3 py-1">
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
                    <Badge variant="default" className="ml-2">
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
                <ScrollArea className="h-[300px] pr-4">
                  {filteredEquipment.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {searchTerms[subcategory.key]
                        ? 'Nenhum equipamento encontrado'
                        : 'Nenhum equipamento disponível'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredEquipment.map((equipment) => {
                        const quantity = selectedEquipment[equipment.id] || 0;
                        const isSelected = quantity > 0;

                        return (
                          <div
                            key={equipment.id}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-md border transition-all',
                              isSelected
                                ? 'bg-primary/5 border-primary/30 shadow-sm'
                                : 'bg-card border-border hover:bg-muted/50'
                            )}
                          >
                            {/* Equipment Info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {equipment.image && (
                                <img
                                  src={equipment.image}
                                  alt={equipment.name}
                                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium text-sm text-foreground truncate">
                                  {equipment.name}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {equipment.brand}
                                </span>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDecrement(equipment.id)}
                                disabled={quantity === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>

                              <span
                                className={cn(
                                  'w-8 text-center font-semibold text-sm',
                                  isSelected ? 'text-primary' : 'text-muted-foreground'
                                )}
                              >
                                {quantity}
                              </span>

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleIncrement(equipment.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
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
