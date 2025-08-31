import { useState } from 'react';
import { Project, ProjectStep } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { stepLabels, stepIcons, canTransitionTo } from '@/lib/projectSteps';
import { AlertTriangle } from 'lucide-react';
import { SeparationConfirmationDialog } from './SeparationConfirmationDialog';

interface StepUpdateDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (projectId: string, newStep: ProjectStep, notes?: string) => void;
}

export function StepUpdateDialog({ project, open, onOpenChange, onUpdate }: StepUpdateDialogProps) {
  const [selectedStep, setSelectedStep] = useState<ProjectStep | ''>('');
  const [notes, setNotes] = useState('');
  const [showSeparationDialog, setShowSeparationDialog] = useState(false);

  if (!project) return null;

  const currentStep = project.step;
  const availableSteps = (Object.keys(stepLabels) as ProjectStep[])
    .filter(step => step !== currentStep && canTransitionTo(currentStep, step));

  const handleSubmit = () => {
    if (!selectedStep) return;
    
    // Special handling for separation confirmation
    if (currentStep === 'pending_separation' && selectedStep === 'separated') {
      setShowSeparationDialog(true);
      return;
    }
    
    onUpdate(project.id, selectedStep, notes.trim() || undefined);
    onOpenChange(false);
    setSelectedStep('');
    setNotes('');
  };

  const handleSeparationConfirm = (projectId: string, newStep: ProjectStep, separationNotes?: string) => {
    onUpdate(projectId, newStep, separationNotes);
    setShowSeparationDialog(false);
    onOpenChange(false);
    setSelectedStep('');
    setNotes('');
  };

  const willCompleteProject = selectedStep === 'verified';

  return (
    <>
      <Dialog open={open && !showSeparationDialog} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Status do Projeto</DialogTitle>
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

            {currentStep === 'pending_separation' && selectedStep === 'separated' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Será solicitada a confirmação individual de cada equipamento e acessório.
                </AlertDescription>
              </Alert>
            )}

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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={!selectedStep}
            >
              {currentStep === 'pending_separation' && selectedStep === 'separated' 
                ? 'Iniciar Separação' 
                : 'Atualizar Status'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SeparationConfirmationDialog
        project={project}
        open={showSeparationDialog}
        onOpenChange={setShowSeparationDialog}
        onConfirm={handleSeparationConfirm}
      />
    </>
  );
}