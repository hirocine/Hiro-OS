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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg overflow-hidden">
      <CollapsibleTrigger className="w-full">
        <div className="grid grid-cols-12 gap-2 items-center p-3 bg-muted/50 hover:bg-muted transition-colors">
          {/* Coluna do título (5 colunas) */}
          <div className="col-span-5 flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <div className="p-1.5 rounded bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-sm uppercase tracking-wide text-left">
              {section.name}
            </span>
          </div>
          
          {/* Headers das colunas */}
          <div className="col-span-2 text-xs font-medium text-muted-foreground text-left">
            Responsável
          </div>
          <div className="col-span-2 text-xs font-medium text-muted-foreground text-left">
            Prazo
          </div>
          <div className="col-span-2 text-xs font-medium text-muted-foreground text-left">
            Status
          </div>
          
          {/* Progresso (1 coluna) */}
          <div className="col-span-1 flex items-center justify-end gap-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completedSteps}/{totalSteps}
            </span>
            <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
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
