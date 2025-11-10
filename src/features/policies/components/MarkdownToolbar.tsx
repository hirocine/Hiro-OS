import { useEffect } from 'react';
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
  // Toggle wrap (negrito, itálico, código inline)
  const toggleWrap = (before: string, after: string = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newText: string;
    let cursorPosition: number;

    // Verifica se já está aplicado
    const beforeStart = content.substring(start - before.length, start);
    const afterEnd = content.substring(end, end + after.length);
    
    if (beforeStart === before && afterEnd === after && selectedText) {
      // Remove o wrap
      newText = 
        content.substring(0, start - before.length) + 
        selectedText + 
        content.substring(end + after.length);
      cursorPosition = start - before.length + selectedText.length;
    } else if (selectedText) {
      // Aplica o wrap
      newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
      cursorPosition = start + before.length + selectedText.length + after.length;
    } else {
      // Sem seleção: insere placeholder
      const placeholder = 'texto';
      newText = content.substring(0, start) + before + placeholder + after + content.substring(end);
      cursorPosition = start + before.length;
    }

    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      if (selectedText || beforeStart !== before) {
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      } else {
        // Seleciona o placeholder
        textarea.setSelectionRange(cursorPosition, cursorPosition + 5);
      }
    }, 0);
  };

  // Toggle heading (H1, H2, H3)
  const toggleHeading = (level: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Encontra início e fim das linhas selecionadas
    const beforeCursor = content.substring(0, start);
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    
    const afterCursor = content.substring(end);
    const nextNewline = afterCursor.indexOf('\n');
    const lineEnd = nextNewline === -1 ? content.length : end + nextNewline;
    
    const selectedLines = content.substring(lineStart, lineEnd);
    const lines = selectedLines.split('\n');
    const prefix = '#'.repeat(level) + ' ';
    
    const processedLines = lines.map(line => {
      // Remove heading existente
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const [, existingLevel, rest] = headingMatch;
        // Se for o mesmo nível, remove; senão, substitui
        if (existingLevel.length === level) {
          return rest;
        } else {
          return prefix + rest;
        }
      } else if (line.trim()) {
        // Adiciona heading
        return prefix + line;
      }
      return line;
    });
    
    const newLines = processedLines.join('\n');
    const newText = content.substring(0, lineStart) + newLines + content.substring(lineEnd);
    
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = lineStart + newLines.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Toggle list prefix (listas com marcadores ou numeradas)
  const toggleListPrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Encontra início da primeira linha
    const beforeCursor = content.substring(0, start);
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    
    // Se há múltiplas linhas selecionadas
    const selectedText = content.substring(start, end);
    
    if (selectedText.includes('\n')) {
      // Múltiplas linhas
      const lines = selectedText.split('\n');
      const processedLines = lines.map(line => {
        if (!line.trim()) return line;
        // Verifica se já tem o prefixo
        if (line.trimStart().startsWith(prefix)) {
          // Remove o prefixo
          return line.replace(new RegExp(`^(\\s*)${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '$1');
        } else {
          // Adiciona o prefixo
          const indent = line.match(/^\s*/)?.[0] || '';
          return indent + prefix + line.trimStart();
        }
      });
      
      const newLines = processedLines.join('\n');
      const newText = content.substring(0, start) + newLines + content.substring(end);
      
      setContent(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + newLines.length, start + newLines.length);
      }, 0);
    } else {
      // Linha única
      const lineEnd = content.indexOf('\n', lineStart);
      const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
      const line = content.substring(lineStart, actualLineEnd);
      
      let newLine: string;
      if (line.trimStart().startsWith(prefix)) {
        // Remove
        newLine = line.replace(new RegExp(`^(\\s*)${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '$1');
      } else {
        // Adiciona
        const indent = line.match(/^\s*/)?.[0] || '';
        newLine = indent + prefix + line.trimStart();
      }
      
      const newText = content.substring(0, lineStart) + newLine + content.substring(actualLineEnd);
      
      setContent(newText);
      
      setTimeout(() => {
        textarea.focus();
        const newPosition = lineStart + newLine.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  // Inserir texto no cursor
  const insertAtCursor = (text: string, selectAfter: boolean = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let insertText = text;
    let cursorPosition = start + text.length;
    
    // Para link e imagem, usar seleção como texto/alt
    if (text.includes('[') && text.includes('](') && selectedText) {
      if (text.startsWith('![')) {
        // Imagem
        insertText = `![${selectedText}](https://exemplo.com/imagem.jpg)`;
        cursorPosition = start + insertText.length;
      } else {
        // Link
        insertText = `[${selectedText}](https://exemplo.com)`;
        cursorPosition = start + insertText.length;
      }
    }
    
    const newText = content.substring(0, start) + insertText + content.substring(end);
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      if (selectAfter && !selectedText) {
        // Seleciona o placeholder (URL ou texto)
        if (text.includes('](')) {
          const urlStart = start + insertText.indexOf('](') + 2;
          const urlEnd = start + insertText.indexOf(')');
          textarea.setSelectionRange(urlStart, urlEnd);
        } else {
          textarea.setSelectionRange(cursorPosition, cursorPosition);
        }
      } else {
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  // Quebra de linha hard (dois espaços + newline)
  const insertLineBreak = () => {
    insertAtCursor('  \n');
  };

  // Atalhos de teclado
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      
      if (isMod && e.key === 'b') {
        e.preventDefault();
        toggleWrap('**');
      } else if (isMod && e.key === 'i') {
        e.preventDefault();
        toggleWrap('*');
      } else if (isMod && e.key === '1') {
        e.preventDefault();
        toggleHeading(1);
      } else if (isMod && e.key === '2') {
        e.preventDefault();
        toggleHeading(2);
      } else if (isMod && e.key === '3') {
        e.preventDefault();
        toggleHeading(3);
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);
    return () => textarea.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  const buttons = [
    // Grupo: Texto
    [
      { icon: Bold, label: 'Negrito (Ctrl+B)', onClick: () => toggleWrap('**') },
      { icon: Italic, label: 'Itálico (Ctrl+I)', onClick: () => toggleWrap('*') },
    ],
    // Grupo: Títulos
    [
      { icon: Heading1, label: 'Título 1 (Ctrl+1)', onClick: () => toggleHeading(1) },
      { icon: Heading2, label: 'Título 2 (Ctrl+2)', onClick: () => toggleHeading(2) },
      { icon: Heading3, label: 'Título 3 (Ctrl+3)', onClick: () => toggleHeading(3) },
    ],
    // Grupo: Listas
    [
      { icon: List, label: 'Lista com marcadores', onClick: () => toggleListPrefix('- ') },
      { icon: ListOrdered, label: 'Lista numerada', onClick: () => toggleListPrefix('1. ') },
    ],
    // Grupo: Inserções
    [
      { icon: Link, label: 'Link', onClick: () => insertAtCursor('[texto](https://exemplo.com)', true) },
      { icon: Image, label: 'Imagem', onClick: () => insertAtCursor('![alt](https://exemplo.com/imagem.jpg)', true) },
      { icon: Code, label: 'Código inline', onClick: () => toggleWrap('`') },
      { icon: FileCode, label: 'Bloco de código', onClick: () => insertAtCursor('```\ncódigo\n```') },
    ],
    // Grupo: Formatação extra
    [
      { icon: Quote, label: 'Citação', onClick: () => toggleListPrefix('> ') },
      { icon: Minus, label: 'Linha horizontal', onClick: () => insertAtCursor('\n---\n') },
      { icon: CornerDownLeft, label: 'Quebra de linha', onClick: insertLineBreak },
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