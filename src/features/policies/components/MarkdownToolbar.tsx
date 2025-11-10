import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  FileCode,
  Quote,
  Minus,
  CornerDownLeft,
} from 'lucide-react';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  setContent: (content: string) => void;
}

export function MarkdownToolbar({ textareaRef, content, setContent }: MarkdownToolbarProps) {
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newText: string;
    let cursorPosition: number;

    if (selectedText) {
      // Se há texto selecionado, envolve com a sintaxe
      newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
      cursorPosition = start + before.length + selectedText.length + after.length;
    } else {
      // Se não há texto selecionado, insere placeholder
      const placeholder = 'texto';
      newText = content.substring(0, start) + before + placeholder + after + content.substring(end);
      cursorPosition = start + before.length + placeholder.length;
    }

    setContent(newText);
    
    // Restaura o foco e posição do cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newText = content.substring(0, start) + text + content.substring(end);
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Encontra o início da linha atual
    const beforeCursor = content.substring(0, start);
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    
    const selectedText = content.substring(start, end);
    const afterSelection = content.substring(end);
    
    let newText: string;
    let cursorPosition: number;

    if (selectedText.includes('\n')) {
      // Múltiplas linhas selecionadas - adiciona prefixo em cada linha
      const lines = selectedText.split('\n');
      const prefixedLines = lines.map(line => line ? prefix + line : line).join('\n');
      newText = content.substring(0, start) + prefixedLines + afterSelection;
      cursorPosition = start + prefixedLines.length;
    } else {
      // Adiciona prefixo no início da linha atual
      const currentLine = content.substring(lineStart, end);
      const restOfLine = content.substring(end);
      newText = content.substring(0, lineStart) + prefix + currentLine + restOfLine;
      cursorPosition = lineStart + prefix.length + (start - lineStart);
    }

    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  const buttons = [
    // Grupo: Texto
    [
      { icon: Bold, label: 'Negrito (Ctrl+B)', onClick: () => insertMarkdown('**', '**') },
      { icon: Italic, label: 'Itálico (Ctrl+I)', onClick: () => insertMarkdown('*', '*') },
    ],
    // Grupo: Títulos
    [
      { icon: Heading1, label: 'Título 1', onClick: () => insertLinePrefix('# ') },
      { icon: Heading2, label: 'Título 2', onClick: () => insertLinePrefix('## ') },
      { icon: Heading3, label: 'Título 3', onClick: () => insertLinePrefix('### ') },
    ],
    // Grupo: Listas
    [
      { icon: List, label: 'Lista com marcadores', onClick: () => insertLinePrefix('- ') },
      { icon: ListOrdered, label: 'Lista numerada', onClick: () => insertLinePrefix('1. ') },
    ],
    // Grupo: Inserções
    [
      { icon: Link, label: 'Link', onClick: () => insertMarkdown('[', '](url)') },
      { icon: Image, label: 'Imagem', onClick: () => insertMarkdown('![', '](url)') },
      { icon: Code, label: 'Código inline', onClick: () => insertMarkdown('`', '`') },
      { icon: FileCode, label: 'Bloco de código', onClick: () => insertMarkdown('```\n', '\n```') },
    ],
    // Grupo: Formatação extra
    [
      { icon: Quote, label: 'Citação', onClick: () => insertLinePrefix('> ') },
      { icon: Minus, label: 'Linha horizontal', onClick: () => insertAtCursor('\n---\n') },
      { icon: CornerDownLeft, label: 'Quebra de linha', onClick: () => insertAtCursor('\n\n') },
    ],
  ];

  return (
    <TooltipProvider>
      <div className="border rounded-md p-2 bg-muted/30">
        <div className="flex flex-wrap items-center gap-1">
          {buttons.map((group, groupIndex) => (
            <div key={groupIndex} className="flex items-center gap-1">
              {group.map((btn, btnIndex) => (
                <Tooltip key={btnIndex}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={btn.onClick}
                      className="h-8 w-8 p-0"
                    >
                      <btn.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{btn.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {groupIndex < buttons.length - 1 && (
                <Separator orientation="vertical" className="h-6 mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
