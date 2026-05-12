import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, ProjectStep } from '@/types/project';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { stepLabels, stepIcons, canTransitionTo } from '@/lib/projectSteps';
import { AlertTriangle } from 'lucide-react';

interface StepUpdateDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (projectId: string, newStep: ProjectStep, notes?: string) => void;
}

export function StepUpdateDialog({ project, open, onOpenChange, onUpdate }: StepUpdateDialogProps) {
  const [selectedStep, setSelectedStep] = useState<ProjectStep | ''>('');
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();

  if (!project) return null;

  const currentStep = project.step;
  const availableSteps = (Object.keys(stepLabels) as ProjectStep[])
    .filter(step => step !== currentStep && canTransitionTo(currentStep, step));

  const handleSubmit = () => {
    if (!selectedStep) return;
    
    onUpdate(project.id, selectedStep, notes.trim() || undefined);
    onOpenChange(false);
    setSelectedStep('');
    setNotes('');
  };

  const willCompleteProject = selectedStep === 'verified';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar Status da Retirada</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Projeto: <span className="font-medium">{project.name}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Status atual: <span className="font-medium">{stepLabels[currentStep]}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="step">Novo Status</Label>
            <Select value={selectedStep} onValueChange={(value) => setSelectedStep(value as ProjectStep)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o novo status..." />
              </SelectTrigger>
              <SelectContent>
                {availableSteps.map((step) => {
                  const Icon = stepIcons[step];
                  return (
                    <SelectItem key={step} value={step}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {stepLabels[step]}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {willCompleteProject && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Ao marcar como "Verificado", o projeto será automaticamente finalizado.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre esta mudança..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <button type="button" className="btn" onClick={() => onOpenChange(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleSubmit}
            disabled={!selectedStep}
          >
            Atualizar Status
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}