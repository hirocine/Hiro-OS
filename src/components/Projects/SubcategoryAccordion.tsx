import { useState, useMemo } from 'react';
import { Search, Plus, ChevronDown, CheckCircle2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusPill } from '@/ds/components/StatusPill';
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
      if (selectedEquipment.includes(eq.id)) {
        count++;
      }

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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 0',
          color: 'hsl(var(--ds-fg-3))',
        }}
      >
        <Search size={32} strokeWidth={1.5} style={{ marginBottom: 16, opacity: 0.5 }} />
        <p style={{ fontSize: 13 }}>Nenhum equipamento disponível nesta categoria</p>
      </div>
    );
  }

  return (
    <div className={cn(className)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary */}
      {totalSelected > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-surface))',
          }}
        >
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-2))',
            }}
          >
            Total selecionado nesta categoria
          </span>
          <StatusPill
            label={`${totalSelected} ${totalSelected === 1 ? 'item' : 'itens'}`}
            tone="success"
          />
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
              className="border-0"
              style={{
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-surface))',
              }}
            >
              <AccordionTrigger
                className="hover:no-underline"
                style={{ padding: '14px 18px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    paddingRight: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        fontFamily: '"HN Display", sans-serif',
                        fontWeight: 500,
                        color: 'hsl(var(--ds-fg-1))',
                      }}
                    >
                      {subcategory.name}
                    </span>
                    <span className="pill muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {availableCount}
                    </span>
                  </div>
                  {selectedCount > 0 && (
                    <span style={{ marginLeft: 8 }}>
                      <StatusPill
                        label={`${selectedCount} selecionado${selectedCount > 1 ? 's' : ''}`}
                        tone="success"
                      />
                    </span>
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent style={{ padding: '0 18px 18px' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <Search
                    size={14}
                    strokeWidth={1.5}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'hsl(var(--ds-fg-3))',
                    }}
                  />
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
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '32px 0',
                        color: 'hsl(var(--ds-fg-3))',
                        fontSize: 13,
                      }}
                    >
                      {searchTerms[subcategory.key]
                        ? 'Nenhum equipamento encontrado'
                        : 'Nenhum equipamento disponível'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {filteredEquipment.map((equipment) => {
                        const isSelected = selectedEquipment.includes(equipment.id);
                        const isExpanded = expandedItems.has(equipment.id);
                        const selectedAccessoriesCount = getSelectedAccessoriesCount(equipment);

                        return (
                          <div key={equipment.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Item Principal */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 12,
                                border: isSelected
                                  ? '1px solid hsl(var(--ds-success) / 0.5)'
                                  : '1px solid hsl(var(--ds-line-1))',
                                background: isSelected
                                  ? 'hsl(var(--ds-success) / 0.06)'
                                  : 'hsl(var(--ds-surface))',
                                transition: 'border-color 0.15s, background 0.15s',
                              }}
                            >
                              {/* Equipment Image */}
                              {equipment.image && (
                                <img
                                  src={equipment.image}
                                  alt={equipment.name}
                                  style={{
                                    width: 48,
                                    height: 48,
                                    objectFit: 'cover',
                                    flexShrink: 0,
                                    border: '1px solid hsl(var(--ds-line-1))',
                                  }}
                                />
                              )}

                              {/* Equipment Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p
                                  style={{
                                    fontWeight: 500,
                                    fontSize: 13,
                                    color: 'hsl(var(--ds-fg-1))',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {equipment.name}
                                </p>
                                <p
                                  style={{
                                    fontSize: 12,
                                    color: 'hsl(var(--ds-fg-3))',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {equipment.brand}
                                </p>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginTop: 4,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  {equipment.patrimonyNumber && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: 'hsl(var(--ds-fg-4))',
                                        fontVariantNumeric: 'tabular-nums',
                                      }}
                                    >
                                      Pat. {equipment.patrimonyNumber}
                                    </span>
                                  )}
                                  {equipment.hasAccessories && (
                                    <StatusPill
                                      label={
                                        selectedAccessoriesCount > 0
                                          ? `${selectedAccessoriesCount}/${equipment.accessoryCount} acessórios`
                                          : `${equipment.accessoryCount} acessórios`
                                      }
                                      tone={selectedAccessoriesCount > 0 ? 'success' : 'muted'}
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                {equipment.hasAccessories && (
                                  <button
                                    type="button"
                                    className="btn"
                                    onClick={() => toggleExpanded(equipment.id)}
                                    style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                                    aria-label={isExpanded ? 'Recolher acessórios' : 'Expandir acessórios'}
                                  >
                                    <ChevronDown
                                      size={14}
                                      strokeWidth={1.5}
                                      style={{
                                        transition: 'transform 0.15s',
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                      }}
                                    />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={isSelected ? 'btn primary' : 'btn'}
                                  onClick={() => handleToggle(equipment.id, equipment.hasAccessories)}
                                >
                                  {isSelected ? (
                                    <>
                                      <CheckCircle2 size={13} strokeWidth={1.5} />
                                      <span>Adicionado</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus size={13} strokeWidth={1.5} />
                                      <span>Adicionar</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Lista de Acessórios (Expandível) */}
                            {equipment.hasAccessories && isExpanded && equipment.accessories && (
                              <div
                                style={{
                                  marginLeft: 16,
                                  marginTop: 8,
                                  padding: 12,
                                  border: isSelected
                                    ? '1px solid hsl(var(--ds-success) / 0.3)'
                                    : '1px solid hsl(var(--ds-line-1))',
                                  background: isSelected
                                    ? 'hsl(var(--ds-success) / 0.04)'
                                    : 'hsl(var(--ds-line-2) / 0.3)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 8,
                                }}
                              >
                                {/* Título dos acessórios */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 4,
                                    paddingBottom: 8,
                                    borderBottom: '1px solid hsl(var(--ds-line-1))',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 11,
                                      letterSpacing: '0.14em',
                                      textTransform: 'uppercase',
                                      fontWeight: 500,
                                      color: 'hsl(var(--ds-fg-3))',
                                    }}
                                  >
                                    Acessórios deste equipamento
                                  </span>
                                </div>

                                {equipment.accessories.map((accessory) => {
                                  const isAccessorySelected = selectedEquipment.includes(accessory.id);

                                  return (
                                    <div
                                      key={accessory.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 8,
                                        border: isAccessorySelected
                                          ? '1px solid hsl(var(--ds-success) / 0.5)'
                                          : '1px solid hsl(var(--ds-line-1))',
                                        background: isAccessorySelected
                                          ? 'hsl(var(--ds-success) / 0.08)'
                                          : 'hsl(var(--ds-surface))',
                                        transition: 'border-color 0.15s, background 0.15s',
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 8,
                                          flex: 1,
                                          minWidth: 0,
                                        }}
                                      >
                                        {accessory.image && (
                                          <img
                                            src={accessory.image}
                                            alt={accessory.name}
                                            style={{
                                              width: 32,
                                              height: 32,
                                              objectFit: 'cover',
                                              flexShrink: 0,
                                              border: '1px solid hsl(var(--ds-line-1))',
                                            }}
                                          />
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                          <span
                                            style={{
                                              fontSize: 13,
                                              fontWeight: 500,
                                              color: 'hsl(var(--ds-fg-1))',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                            }}
                                          >
                                            {accessory.name}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: 11,
                                              color: 'hsl(var(--ds-fg-3))',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                            }}
                                          >
                                            {accessory.brand}
                                          </span>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        className={isAccessorySelected ? 'btn primary' : 'btn'}
                                        onClick={() => handleToggle(accessory.id)}
                                        style={{ flexShrink: 0 }}
                                      >
                                        {isAccessorySelected ? (
                                          <>
                                            <CheckCircle2 size={12} strokeWidth={1.5} />
                                            <span>Adicionado</span>
                                          </>
                                        ) : (
                                          <>
                                            <Plus size={12} strokeWidth={1.5} />
                                            <span>Adicionar</span>
                                          </>
                                        )}
                                      </button>
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
