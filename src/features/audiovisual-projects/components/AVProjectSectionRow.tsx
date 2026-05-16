import { useState } from 'react';
import { ChevronDown, ChevronRight, Phone, FileText, Calculator, Scale, ClipboardList, Video, Film, LucideIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AVProjectSection, AVProjectStep } from '../types';
import { AVProjectStepRow } from './AVProjectStepRow';

const ICON_MAP: Record<string, LucideIcon> = {
  Phone,
  FileText,
  Calculator,
  Scale,
  ClipboardList,
  Video,
  Film,
};

interface AVProjectSectionRowProps {
  section: AVProjectSection;
  steps: AVProjectStep[];
  projectId: string;
}

export function AVProjectSectionRow({ section, steps, projectId }: AVProjectSectionRowProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const Icon = section.icon ? ICON_MAP[section.icon] : FileText;
  const completedSteps = steps.filter((s) => s.status === 'concluido').length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="overflow-hidden border border-[hsl(var(--ds-line-1))]"
    >
      <CollapsibleTrigger className="w-full">
        <div className="grid grid-cols-12 gap-2 items-center p-3 bg-[hsl(var(--ds-bg)/0.7)] hover:bg-[hsl(var(--ds-bg))] transition-colors">
          {/* Coluna do título (5 colunas) */}
          <div className="col-span-5 flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-[hsl(var(--ds-fg-3))]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[hsl(var(--ds-fg-3))]" />
            )}
            <div className="p-1.5 rounded bg-[hsl(var(--ds-text)/0.07)]">
              <Icon className="h-4 w-4 text-[hsl(var(--ds-text))]" />
            </div>
            <span className="font-semibold text-sm uppercase tracking-wide text-left">
              {section.name}
            </span>
          </div>
          
          {/* Headers das colunas */}
          <div className="col-span-2 text-xs font-medium text-[hsl(var(--ds-fg-3))] text-left">
            Responsável
          </div>
          <div className="col-span-2 text-xs font-medium text-[hsl(var(--ds-fg-3))] text-left">
            Prazo
          </div>
          <div className="col-span-2 text-xs font-medium text-[hsl(var(--ds-fg-3))] text-left">
            Status
          </div>
          
          {/* Progresso (1 coluna) */}
          <div className="col-span-1 flex items-center justify-end gap-1">
            <span className="text-xs text-[hsl(var(--ds-fg-3))] whitespace-nowrap">
              {completedSteps}/{totalSteps}
            </span>
            <div className="w-10 h-1.5 bg-[hsl(var(--ds-bg))] rounded-full overflow-hidden">
              <div
                className="h-full bg-success transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {/* Steps */}
        <div className="divide-y">
          {steps.map((step) => (
            <AVProjectStepRow key={step.id} step={step} projectId={projectId} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
