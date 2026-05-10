import { useState } from 'react';
import { Equipment } from '@/types/equipment';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Loader2, Package2, Package, Check, ChevronsUpDown } from 'lucide-react';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { logger } from '@/lib/logger';
import { MobileFriendlyForm, MobileFriendlyFormActions } from '@/components/ui/mobile-friendly-form';
import { useIsMobile } from '@/hooks/use-mobile';

interface ConvertToAccessoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment;
  mainItems: Equipment[];
  onConvert: (equipmentId: string, parentId: string) => Promise<{ success: boolean } | undefined>;
}

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

export function ConvertToAccessoryDialog({
  open,
  onOpenChange,
  equipment,
  mainItems,
  onConvert,
}: ConvertToAccessoryDialogProps) {
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleConvert = async () => {
    if (!selectedParentId) {
      enhancedToast.error({
        title: 'Item principal necessário',
        description: 'Selecione um item principal para associar este acessório.',
      });
      return;
    }

    setIsConverting(true);

    try {
      const result = await onConvert(equipment.id, selectedParentId);

      if (result?.success) {
        enhancedToast.success({
          title: 'Item convertido',
          description: `"${equipment.name}" agora é um acessório do item principal selecionado.`,
        });
        onOpenChange(false);
        setSelectedParentId('');
      }
    } catch (error) {
      logger.error('Error converting equipment to accessory', {
        module: 'equipment',
        action: 'convert_to_accessory',
        error,
        data: { equipmentId: equipment.id, equipmentName: equipment.name, parentId: selectedParentId },
      });
      enhancedToast.error({
        title: 'Erro na conversão',
        description: 'Ocorreu um erro ao converter o item. Tente novamente.',
      });
    } finally {
      setIsConverting(false);
    }
  };

  const availableMainItems = mainItems.filter((item) => item.id !== equipment.id);
  const selectedItem = availableMainItems.find((item) => item.id === selectedParentId);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className={isMobile ? '' : 'max-w-md'}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: '"HN Display", sans-serif',
              }}
            >
              <Package size={18} strokeWidth={1.5} />
              Converter para Acessório
            </span>
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <MobileFriendlyForm
          onSubmit={(e) => {
            e.preventDefault();
            handleConvert();
          }}
        >
          <div
            style={{
              padding: 12,
              background: 'hsl(var(--ds-line-2) / 0.4)',
              border: '1px solid hsl(var(--ds-line-1))',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: 'hsl(var(--ds-fg-3))',
              }}
            >
              <Package2 size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-accent))' }} />
              Item a ser convertido
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                {equipment.patrimonyNumber || 'S/N'} - {equipment.name}
              </p>
              <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                {equipment.brand}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={fieldLabel}>
              Selecionar Item Principal
              <span style={{ marginLeft: 4, color: 'hsl(var(--ds-danger))' }}>*</span>
            </label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="btn"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  disabled={availableMainItems.length === 0}
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    height: isMobile ? 44 : undefined,
                    color: selectedItem ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-4))',
                  }}
                >
                  {selectedItem ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'hsl(var(--ds-accent))',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                        {selectedItem.patrimonyNumber || 'S/N'}
                      </span>
                      <span style={{ color: 'hsl(var(--ds-fg-3))' }}>—</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedItem.name}
                      </span>
                    </div>
                  ) : (
                    'Selecione um item principal…'
                  )}
                  <ChevronsUpDown size={13} strokeWidth={1.5} style={{ opacity: 0.5, flexShrink: 0 }} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Pesquisar itens principais…" />
                  <CommandList>
                    <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                    {availableMainItems.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={`${item.patrimonyNumber || ''} ${item.name} ${item.brand}`}
                        onSelect={() => {
                          setSelectedParentId(item.id === selectedParentId ? '' : item.id);
                          setPopoverOpen(false);
                        }}
                      >
                        <Check
                          size={13}
                          strokeWidth={1.5}
                          style={{
                            marginRight: 8,
                            opacity: selectedParentId === item.id ? 1 : 0,
                            color: 'hsl(var(--ds-accent))',
                          }}
                        />
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: 'hsl(var(--ds-accent))',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                            {item.patrimonyNumber || 'S/N'}
                          </span>
                          <span style={{ color: 'hsl(var(--ds-fg-3))' }}>—</span>
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.name}
                          </span>
                          <span style={{ color: 'hsl(var(--ds-fg-3))', fontSize: 12 }}>
                            ({item.brand})
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {availableMainItems.length === 0 && (
              <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 6 }}>
                Não há itens principais disponíveis para associação.
              </p>
            )}
          </div>

          {selectedParentId && (
            <div
              style={{
                padding: 12,
                background: 'hsl(var(--ds-success) / 0.08)',
                border: '1px solid hsl(var(--ds-success) / 0.3)',
              }}
            >
              <p style={{ fontSize: 12, color: 'hsl(var(--ds-success))', lineHeight: 1.5 }}>
                ✓ Este item será convertido em acessório e aparecerá agrupado com o item principal selecionado.
              </p>
            </div>
          )}
        </MobileFriendlyForm>

        <ResponsiveDialogFooter>
          <MobileFriendlyFormActions>
            <button
              type="button"
              className="btn"
              onClick={() => onOpenChange(false)}
              disabled={isConverting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleConvert}
              disabled={isConverting || !selectedParentId || availableMainItems.length === 0}
            >
              {isConverting && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />}
              <span>Converter em Acessório</span>
            </button>
          </MobileFriendlyFormActions>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
