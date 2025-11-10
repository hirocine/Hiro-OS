import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import type { CompanyPolicy, PolicyForm } from '../types';

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

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    setSaving(true);
    try {
      await onSave({ title, icon, content });
      onOpenChange(false);
      setTitle('');
      setIcon('📋');
      setContent('');
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
            <Label>Conteúdo (Markdown) *</Label>
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Editar</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="edit" className="mt-2">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# Título da Seção&#10;&#10;Escreva o conteúdo aqui...&#10;&#10;## Subtítulo&#10;&#10;- Item 1&#10;- Item 2"
                  className="min-h-[400px] font-mono text-sm"
                />
              </TabsContent>
              
              <TabsContent value="preview" className="mt-2">
                <div className="border rounded-md p-6 min-h-[400px] prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </TabsContent>
            </Tabs>
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
