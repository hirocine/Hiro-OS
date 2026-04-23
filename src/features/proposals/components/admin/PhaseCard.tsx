import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Track newly added item id per subcategory to autofocus its label input
import {
  ClipboardList,
  Clapperboard,
  Palette,
  MoreVertical,
  Plus,
  CheckSquare,
  Square,
  Eraser,
  type LucideIcon,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Phase, PhaseId, ServiceItem } from '@/lib/services-schema';
import { ServiceItemRow } from './ServiceItemRow';

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
  // Marca uma sub onde acabamos de adicionar; o último item dessa sub recebe autofocus
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
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b">
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
            <div className="px-5 py-4 space-y-5">
              {phase.subcategories.map((sub, subIdx) => (
                <div key={subIdx}>
                  {sub.name && (
                    <p className="text-[11px] font-medium text-muted-foreground/70 mb-1.5">
                      {sub.name}
                    </p>
                  )}

                  {/* Headers de coluna */}
                  <div className="flex items-center gap-3 pb-2 border-b border-white/10 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                    <div className="w-5 flex-shrink-0" />
                    <div className="w-[180px] flex-shrink-0 px-2">Recurso</div>
                    <div className="flex-1 min-w-0 px-2">Especificação</div>
                    <div className="w-16 flex-shrink-0 px-2 text-right">Qtd</div>
                    <div className="w-8 flex-shrink-0" />
                  </div>

                  <div>
                    {sub.items.map((item) => (
                      <ServiceItemRow
                        key={item.id}
                        item={item}
                        onChange={(patch) => onUpdateItem(subIdx, item.id, patch)}
                        onRemove={() => onRemoveItem(subIdx, item.id)}
                        onDuplicate={() => onDuplicateItem(subIdx, item.id)}
                      />
                    ))}
                  </div>

                  {/* Adicionar item */}
                  {adding?.subIdx === subIdx ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        autoFocus
                        value={adding.value}
                        onChange={(e) => setAdding({ subIdx, value: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitNew();
                          if (e.key === 'Escape') setAdding(null);
                        }}
                        onBlur={submitNew}
                        placeholder="Nome do novo item…"
                        className="flex-1 h-8 px-2 text-sm rounded-md border bg-background"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAdding({ subIdx, value: '' })}
                      className="mt-2 w-full h-8 inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground border border-dashed border-border/70 rounded-md hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar item{sub.name ? ` em ${sub.name}` : ''}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
