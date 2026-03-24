import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Equipment } from '@/types/equipment';
import { LucideIcon } from 'lucide-react';

interface EquipmentSelectionStepProps {
  availableItems: Equipment[];
  selectedItems: Equipment[];
  onSelect: (item: Equipment) => void;
  onDeselect: (itemId: string) => void;
  icon: LucideIcon;
  availableTitle: string;
  selectedTitle: string;
  emptyAvailableText: string;
  emptySelectedText: string;
  loading: boolean;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  searchLabel?: string;
}

export function EquipmentSelectionStep({
  availableItems,
  selectedItems,
  onSelect,
  onDeselect,
  icon: Icon,
  availableTitle,
  selectedTitle,
  emptyAvailableText,
  emptySelectedText,
  loading,
  searchTerm,
  onSearchChange,
  searchLabel,
}: EquipmentSelectionStepProps) {
  const filteredItems = searchTerm
    ? availableItems.filter((item) => {
        const lowerSearch = searchTerm.toLowerCase();
        return (
          item.name?.toLowerCase().includes(lowerSearch) ||
          item.brand?.toLowerCase().includes(lowerSearch)
        );
      })
    : availableItems;

  return (
    <div className="space-y-6 flex-1 overflow-y-auto animate-fade-in">
      {/* Search Input (optional) */}
      {onSearchChange && searchLabel && (
        <div className="space-y-2">
          <Label htmlFor="search-equipment">{searchLabel}</Label>
          <Input
            id="search-equipment"
            placeholder="Digite nome ou marca..."
            value={searchTerm || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-md"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Items */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 flex-shrink-0 mb-4">
            <Icon className="h-5 w-5" />
            <h4 className="font-medium">{availableTitle}</h4>
            <Badge variant="secondary">
              {filteredItems.length} disponíveis
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
              <Card className="border-dashed">
                <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                  <div className="text-center text-sm text-muted-foreground space-y-2">
                    <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">{emptyAvailableText}</p>
                    <p className="text-xs">Todos os itens estão em uso ou seu filtro não encontrou resultados</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
              {filteredItems.map((item) => {
                const isSelected = selectedItems.some((s) => s.id === item.id);
                return (
                  <Card
                    key={item.id}
                    className={cn(
                      "transition-all border-2 h-24",
                      isSelected
                        ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-md cursor-default"
                        : "cursor-pointer hover:bg-accent/50 hover-scale hover:border-primary/30 bg-card"
                    )}
                    onClick={() => !isSelected && onSelect(item)}
                  >
                    <CardContent className="p-4 h-full">
                      <div className="flex items-center gap-3 h-full">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                            isSelected
                              ? "bg-green-500/10 border border-green-500/30"
                              : "bg-primary/10"
                          )}
                        >
                          {isSelected ? (
                            <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                          ) : item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Icon className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 h-full">
                          <div className="flex items-center justify-between h-full">
                            <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="font-medium text-sm truncate">
                                    {item.name}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{item.name}</p>
                                </TooltipContent>
                              </Tooltip>
                              <p className="text-xs text-muted-foreground">
                                {item.brand}
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              disabled={isSelected}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isSelected) onSelect(item);
                              }}
                              className={
                                isSelected
                                  ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600"
                                  : ""
                              }
                            >
                              {isSelected ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Selecionado
                                </>
                              ) : (
                                "Selecionar"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Items */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 flex-shrink-0 mb-4">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h4 className="font-medium">{selectedTitle}</h4>
            <Badge variant="default">{selectedItems.length}</Badge>
          </div>

          {selectedItems.length === 0 ? (
            <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
              <Card className="border-dashed">
                <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                  <div className="text-center text-sm text-muted-foreground space-y-2">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">{emptySelectedText}</p>
                    <p className="text-xs">Clique nos itens disponíveis para adicioná-los</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
              {selectedItems.map((item) => (
                <Card key={item.id} className="border-primary/30 bg-primary/5 h-24 animate-fade-in">
                  <CardContent className="p-4 h-full">
                    <div className="flex items-center gap-3 h-full">
                      <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0 h-full">
                        <div className="flex items-center justify-between h-full">
                          <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                            <p className="font-medium text-sm truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.brand}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeselect(item.id);
                            }}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
