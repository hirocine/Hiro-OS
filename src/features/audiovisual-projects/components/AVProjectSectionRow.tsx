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
        <div className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <div className="p-1.5 rounded bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          </div>
          
          <span className="font-semibold text-sm uppercase tracking-wide flex-1 text-left">
            {section.name}
          </span>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {completedSteps}/{totalSteps} concluídos
            </span>
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-success transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/30 text-xs font-medium text-muted-foreground border-t">
          <div className="col-span-5">Step</div>
          <div className="col-span-2">Responsável</div>
          <div className="col-span-2">Prazo</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>

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
