import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddSSDDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddSSDDialog({ open, onOpenChange, onSuccess }: AddSSDDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    capacity: '',
    serialNumber: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('equipments')
        .insert({
          name: formData.name,
          brand: formData.brand,
          category: 'storage',
          subcategory: 'SSD',
          capacity: parseFloat(formData.capacity),
          serial_number: formData.serialNumber,
          status: 'available',
          item_type: 'main',
          display_order: 0, // Available column
        });

      if (error) throw error;

      toast({
        title: 'SSD adicionado!',
        description: 'O SSD foi adicionado com sucesso.',
      });

      setFormData({ name: '', brand: '', capacity: '', serialNumber: '' });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Erro ao adicionar SSD',
        description: 'Não foi possível adicionar o SSD.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar SSD/HD</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Samsung 980 PRO"
              required
            />
          </div>
          <div>
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Samsung"
              required
            />
          </div>
          <div>
            <Label htmlFor="capacity">Capacidade (GB)</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="1000"
              required
            />
          </div>
          <div>
            <Label htmlFor="serialNumber">Número de Série</Label>
            <Input
              id="serialNumber"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              placeholder="SN123456"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
