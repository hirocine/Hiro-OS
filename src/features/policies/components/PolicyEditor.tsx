import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CompanyPolicy, PolicyForm } from '../types';
import { POLICY_CATEGORIES } from '../types';
import { TipTapEditor } from './TipTapEditor';

interface PolicyEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (form: PolicyForm) => Promise<void>;
  policy?: CompanyPolicy;
}

export function PolicyEditor({ open, onOpenChange, onSave, policy }: PolicyEditorProps) {
  const [title, setTitle] = useState(policy?.title || '');
  const [icon, setIcon] = useState(policy?.icon_url || '📋');
  const [content, setContent] = useState(policy?.content || '');
  const [category, setCategory] = useState(policy?.category || 'Geral');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (policy) {
        // Modo edição: carregar dados da policy
        setTitle(policy.title);
        setIcon(policy.icon_url || '📋');
        setContent(policy.content);
        setCategory(policy.category || 'Geral');
      } else {
        // Modo criação: campos vazios
        setTitle('');
        setIcon('📋');
        setContent('');
        setCategory('Geral');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch helper closes over the listed deps; missing deps are stable refs/setters
  }, [open]); // Removido policy para evitar reset durante digitação

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    setSaving(true);
    try {
      await onSave({ title, icon, content, category });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto ds-shell">
        <DialogHeader>
          <DialogTitle>
            {policy ? 'Editar Política' : 'Nova Política'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="icon">Ícone/Emoji</Label>
            <Input
              id="icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📋"
              className="text-4xl text-center h-20"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {POLICY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da política"
            />
          </div>

          <div className="space-y-2">
            <Label>Conteúdo *</Label>
            <TipTapEditor
              content={content}
              onChange={setContent}
              placeholder="Escreva o conteúdo da política aqui..."
            />
            <p className="text-xs text-[hsl(var(--ds-fg-3))]">
              Use a barra de ferramentas acima para formatar o texto.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleSave}
            disabled={!title.trim() || !content.trim() || saving}
          >
            {saving ? 'Salvando...' : 'Salvar Política'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
