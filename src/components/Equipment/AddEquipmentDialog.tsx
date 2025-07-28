import { useState, useEffect } from 'react';
import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentItemType } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { categoryLabels, statusLabels } from '@/data/mockData';

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (equipment: Omit<Equipment, 'id'>) => void;
  equipment?: Equipment;
  mainItems?: Equipment[];
}

export function AddEquipmentDialog({ open, onOpenChange, onSubmit, equipment, mainItems = [] }: AddEquipmentDialogProps) {
  const [formData, setFormData] = useState<Omit<Equipment, 'id'>>({
    name: '',
    brand: '',
    model: '',
    category: 'camera',
    status: 'available',
    itemType: 'main' as EquipmentItemType,
    parentId: '',
    serialNumber: '',
    purchaseDate: '',
    lastMaintenance: '',
    description: '',
    value: 0,
    patrimonyNumber: '',
    depreciatedValue: 0,
    receiveDate: '',
    store: '',
    invoice: '',
  });

  useEffect(() => {
    if (equipment) {
      setFormData(equipment);
    } else {
      setFormData({
        name: '',
        brand: '',
        model: '',
        category: 'camera',
        status: 'available',
        itemType: 'main' as EquipmentItemType,
        parentId: '',
        serialNumber: '',
        purchaseDate: '',
        lastMaintenance: '',
        description: '',
        value: 0,
        patrimonyNumber: '',
        depreciatedValue: 0,
        receiveDate: '',
        store: '',
        invoice: '',
      });
    }
  }, [equipment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
    // Reset form if it's a new equipment
    if (!equipment) {
      setFormData({
        name: '',
        brand: '',
        model: '',
        category: 'camera',
        status: 'available',
        itemType: 'main' as EquipmentItemType,
        parentId: '',
        serialNumber: '',
        purchaseDate: '',
        lastMaintenance: '',
        description: '',
        value: 0,
        patrimonyNumber: '',
        depreciatedValue: 0,
        receiveDate: '',
        store: '',
        invoice: '',
      });
    }
  };

  const updateField = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {equipment ? 'Editar Equipamento' : 'Adicionar Novo Equipamento'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => updateField('brand', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model">Modelo *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => updateField('model', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => updateField('category', value as EquipmentCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => updateField('status', value as EquipmentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemType">Tipo de Item *</Label>
              <Select 
                value={formData.itemType} 
                onValueChange={(value: EquipmentItemType) => {
                  updateField('itemType', value);
                  if (value === 'main') {
                    updateField('parentId', '');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Item Principal</SelectItem>
                  <SelectItem value="accessory">Acessório</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.itemType === 'accessory' && (
              <div className="space-y-2">
                <Label htmlFor="parentId">Item Principal</Label>
                <Select 
                  value={formData.parentId || ''} 
                  onValueChange={(value) => updateField('parentId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um item principal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum (acessório independente)</SelectItem>
                    {mainItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.patrimonyNumber ? `${item.patrimonyNumber} - ` : ''}{item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Número de Série</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => updateField('serialNumber', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value">Valor de Compra (R$)</Label>
              <Input
                id="value"
                type="number"
                value={formData.value || ''}
                onChange={(e) => updateField('value', parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="patrimonyNumber">Patrimônio</Label>
              <Input
                id="patrimonyNumber"
                value={formData.patrimonyNumber}
                onChange={(e) => updateField('patrimonyNumber', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Data de Compra</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => updateField('purchaseDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastMaintenance">Última Manutenção</Label>
              <Input
                id="lastMaintenance"
                type="date"
                value={formData.lastMaintenance}
                onChange={(e) => updateField('lastMaintenance', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>
          
          {/* Hidden fields for additional equipment data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <h3 className="md:col-span-2 text-lg font-semibold">Informações Adicionais</h3>
            
            <div className="space-y-2">
              <Label htmlFor="depreciatedValue">Valor com Depreciação (R$)</Label>
              <Input
                id="depreciatedValue"
                type="number"
                value={formData.depreciatedValue || ''}
                onChange={(e) => updateField('depreciatedValue', parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receiveDate">Data de Recebimento</Label>
              <Input
                id="receiveDate"
                type="date"
                value={formData.receiveDate}
                onChange={(e) => updateField('receiveDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="store">Loja</Label>
              <Input
                id="store"
                value={formData.store}
                onChange={(e) => updateField('store', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invoice">NFe ou Recibo (Link)</Label>
              <Input
                id="invoice"
                type="url"
                value={formData.invoice}
                onChange={(e) => updateField('invoice', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {equipment ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}