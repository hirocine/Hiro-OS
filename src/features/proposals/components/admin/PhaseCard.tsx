import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Clapperboard,
  Palette,
  MoreVertical,
  CheckSquare,
  Square,
  Eraser,
  type LucideIcon,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Phase, PhaseId, ServiceItem } from '@/lib/services-schema';
import { ServiceItemRow, ROW_GRID } from './ServiceItemRow';

const PHASE_ICONS: Record<PhaseId, LucideIcon> = {
  pre_producao: ClipboardList,
  gravacao: Clapperboard,
  pos_producao: Palette,
};

interface Props {
  phase: Phase;
  onTogglePhase: (enabled: boolean) => void;
  onUpdateItem: (subIdx: number, itemId: string, patch: Partial<Pick<ServiceItem, 'label' | 'specification' | 'quantity' | 'included'>>) => void;
  onAddItem: (subIdx: number, label?: string) => void;
  onRemoveItem: (subIdx: number, itemId: string) => void;
  onDuplicateItem: (subIdx: number, itemId: string) => void;
  onSelectAll: () => void;
  onUnselectAll: () => void;
  onClearSpecs: () => void;
}

export function PhaseCard({
  phase,
  onTogglePhase,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onDuplicateItem,
  onSelectAll,
  onUnselectAll,
  onClearSpecs,
}: Props) {
  const Icon = PHASE_ICONS[phase.id];
  const [pendingFocusSub, setPendingFocusSub] = useState<number | null>(null);
  const totalItems = phase.subcategories.reduce((acc, s) => acc + s.items.length, 0);
  const includedCount = phase.subcategories.reduce(
    (acc, s) => acc + s.items.filter((i) => i.included).length,
    0,
  );

  const handleAddItem = (subIdx: number) => {
    onAddItem(subIdx, '');
    setPendingFocusSub(subIdx);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header da fase */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
              phase.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold leading-tight truncate">{phase.name}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {phase.enabled ? `${includedCount}/${totalItems} inclusos` : 'Fase desativada'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch
            checked={phase.enabled}
            onCheckedChange={onTogglePhase}
            aria-label={`Ativar ${phase.name}`}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Ações da fase"
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSelectAll}>
                <CheckSquare className="h-3.5 w-3.5 mr-2" /> Marcar todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onUnselectAll}>
                <Square className="h-3.5 w-3.5 mr-2" /> Desmarcar todos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClearSpecs}>
                <Eraser className="h-3.5 w-3.5 mr-2" /> Limpar especificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Conteúdo colapsável */}
      <AnimatePresence initial={false}>
        {phase.enabled && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            {/* Header de colunas */}
            <div
              className={`${ROW_GRID} bg-muted/30 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-medium`}
            >
              <div className="py-2.5" />
              <div className="py-2.5 px-3 border-l border-border">Recurso</div>
              <div className="py-2.5 px-3 border-l border-border">Especificação</div>
              <div className="py-2.5 px-3 border-l border-border text-right">Qtd</div>
              <div className="py-2.5 border-l border-border" />
            </div>

            {/* Subcategorias + items */}
            {phase.subcategories.map((sub, subIdx) => (
              <div key={subIdx}>
                {sub.name && (
                  <div className="px-3 py-2 bg-muted/20 border-b border-border/50 text-[11px] font-medium text-muted-foreground">
                    {sub.name}
                  </div>
                )}

                <div>
                  {sub.items.map((item, itemIdx) => {
                    const isLast = itemIdx === sub.items.length - 1;
                    const shouldFocus =
                      pendingFocusSub === subIdx && isLast && item.isCustom && item.label === '';
                    return (
                      <ServiceItemRow
                        key={item.id}
                        item={item}
                        autoFocusLabel={shouldFocus}
                        onChange={(patch) => {
                          if (shouldFocus) setPendingFocusSub(null);
                          onUpdateItem(subIdx, item.id, patch);
                        }}
                        onRemove={() => onRemoveItem(subIdx, item.id)}
                        onDuplicate={() => onDuplicateItem(subIdx, item.id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Footer adicionar item */}
            <div className="p-3 bg-muted/20 border-t border-border space-y-2">
              {phase.subcategories.map((sub, subIdx) => (
                <button
                  key={subIdx}
                  type="button"
                  onClick={() => handleAddItem(subIdx)}
                  className="w-full py-2 text-[13px] text-muted-foreground border border-dashed border-border rounded-md hover:bg-accent/50 hover:text-foreground transition"
                >
                  + Adicionar item{sub.name ? ` em ${sub.name}` : ''}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
