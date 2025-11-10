import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import ReactMarkdown from 'react-markdown';
import type { CompanyPolicy, PolicyForm } from '../types';
import { MarkdownToolbar } from './MarkdownToolbar';

interface PolicyEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (form: PolicyForm) => Promise<void>;
  policy?: CompanyPolicy;
}

export function PolicyEditor({ open, onOpenChange, onSave, policy }: PolicyEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
  }, [open, policy]);

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
            <Label>Conteúdo (Markdown) *</Label>
            
            {/* Container vertical */}
            <div className="space-y-4">
              
              {/* Editor (em cima) */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-medium mb-1">
                  Editor
                </div>
                <MarkdownToolbar
                  textareaRef={textareaRef}
                  content={content}
                  setContent={setContent}
                />
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# Título da Seção&#10;&#10;Escreva o conteúdo aqui...&#10;&#10;## Subtítulo&#10;&#10;- Item 1&#10;- Item 2"
                  className="min-h-[400px] font-mono text-sm resize-none"
                />
              </div>
              
              {/* Preview (embaixo) */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-medium mb-1">
                  Preview
                </div>
                <div className="border rounded-md p-6 min-h-[300px] max-h-[400px] overflow-y-auto bg-muted/20 prose prose-sm dark:prose-invert max-w-none">
                  {content ? (
                    <ReactMarkdown>{content}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground italic">
                      O preview aparecerá aqui conforme você digita...
                    </p>
                  )}
                </div>
              </div>
              
            </div>
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
