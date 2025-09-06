import { useState, useEffect } from 'react';
import { Project } from '@/types/project';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EditProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (projectId: string, updates: Partial<Project>) => void;
}

export function EditProjectDialog({ project, open, onOpenChange, onSave }: EditProjectDialogProps) {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    expectedEndDate: project?.expectedEndDate || '',
    notes: project?.notes || ''
  });

  const [showCalendar, setShowCalendar] = useState(false);

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        expectedEndDate: project.expectedEndDate,
        notes: project.notes || ''
      });
    }
  }, [project]);

  const handleSave = () => {
    if (!project) return;
    
    onSave(project.id, {
      name: formData.name,
      description: formData.description,
      expectedEndDate: formData.expectedEndDate,
      notes: formData.notes
    });
    onOpenChange(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        expectedEndDate: date.toISOString().split('T')[0]
      }));
    }
    setShowCalendar(false);
  };

  const isFormValid = formData.name.trim() && formData.expectedEndDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome do projeto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Produtor/Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Digite a descrição ou nome do produtor"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Data de Devolução *</Label>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expectedEndDate ? 
                    format(new Date(formData.expectedEndDate), 'dd/MM/yyyy') : 
                    'Selecione a data'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.expectedEndDate ? new Date(formData.expectedEndDate) : undefined}
                  onSelect={handleDateSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid} className="flex-1">
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}