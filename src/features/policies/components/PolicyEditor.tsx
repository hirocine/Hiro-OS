import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CompanyPolicy, PolicyForm } from '../types';
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (policy) {
        // Modo edição: carregar dados da policy
        setTitle(policy.title);
        setIcon(policy.icon_url || '📋');
        setContent(policy.content);
      } else {
        // Modo criação: campos vazios
        setTitle('');
        setIcon('📋');
        setContent('');
      }
    }
  }, [open]); // Removido policy para evitar reset durante digitação

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    setSaving(true);
    try {
      await onSave({ title, icon, content });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            <p className="text-xs text-muted-foreground">
              Use a barra de ferramentas acima para formatar o texto. O conteúdo será salvo em Markdown.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim() || saving}
          >
            {saving ? 'Salvando...' : 'Salvar Política'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
