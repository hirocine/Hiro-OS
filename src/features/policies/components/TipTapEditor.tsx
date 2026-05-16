import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  ImageIcon,
  Undo,
  Redo,
} from 'lucide-react';
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const toolbarBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  padding: 0,
  justifyContent: 'center',
};

const activeStyle = (active: boolean): React.CSSProperties =>
  active
    ? {
        ...toolbarBtnStyle,
        background: 'hsl(var(--ds-accent) / 0.1)',
        color: 'hsl(var(--ds-accent))',
      }
    : toolbarBtnStyle;

export function TipTapEditor({ content, onChange, placeholder }: TipTapEditorProps) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);

  // Debounced onChange function
  const debouncedChange = useCallback((html: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Check size limit (50,000 characters)
      if (html.length > 50000) {
        toast.warning('Texto muito grande', {
          description: 'Documentos muito grandes podem afetar a performance. Considere dividir em múltiplas políticas.',
        });
      }

      onChange(html);
    }, 300);
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false, // Disable duplicate Link extension from StarterKit
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[hsl(var(--ds-text))] underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Escreva o conteúdo da política aqui...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (!isUpdatingRef.current) {
        debouncedChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain') || '';
        const html = event.clipboardData?.getData('text/html') || '';

        if (text.length > 100000) {
          event.preventDefault();
          toast.error('Texto muito grande', {
            description: 'O texto colado excede o limite máximo. Por favor, divida em partes menores.',
          });
          return true;
        }

        // Sanitize Office HTML (remove MS Office artifacts)
        if (html) {
          const sanitized = html
            .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
            .replace(/class="Mso[^"]*"/gi, '') // Remove MS Office classes
            .replace(/style="[^"]*mso-[^"]*"/gi, '') // Remove MS Office styles
            .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '') // Remove Office paragraph tags
            .replace(/<\/?span[^>]*>/gi, ''); // Remove span tags

          if (sanitized !== html) {
            // Insert sanitized HTML
            event.preventDefault();
            editor?.chain().focus().insertContent(sanitized).run();
            return true;
          }
        }

        return false; // Allow default paste behavior
      },
    },
  });

  useEffect(() => {
    if (editor && !isUpdatingRef.current && content !== editor.getHTML()) {
      isUpdatingRef.current = true;
      editor.commands.setContent(content, { emitUpdate: false });
      isUpdatingRef.current = false;
    }
  }, [content, editor]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('URL do link:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('URL da imagem:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div style={{ border: '1px solid hsl(var(--ds-line-1))', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-1 p-2"
        style={{
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-line-2) / 0.3)',
        }}
      >
        <button
          type="button"
          className="btn"
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={activeStyle(editor.isActive('bold'))}
          title="Negrito (Ctrl+B)"
        >
          <Bold size={14} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={activeStyle(editor.isActive('italic'))}
          title="Itálico (Ctrl+I)"
        >
          <Italic size={14} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          style={activeStyle(editor.isActive('strike'))}
          title="Tachado"
        >
          <Strikethrough size={14} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => editor.chain().focus().toggleCode().run()}
          style={activeStyle(editor.isActive('code'))}
          title="Código"
        >
          <Code size={14} strokeWidth={1.5} />
        </button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <button
          type="button"
          className="btn"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          style={activeStyle(editor.isActive('heading', { level: 1 }))}
          title="Título 1"
        >
          <Heading1 size={14} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={activeStyle(editor.isActive('heading', { level: 2 }))}
          title="Título 2"
        >
          <Heading2 size={14} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          style={activeStyle(editor.isActive('heading', { level: 3 }))}
          title="Título 3"
        >
          <Heading3 size={14} strokeWidth={1.5} />
        </button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <button
          type="button"
          className="btn"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={activeStyle(editor.isActive('bulletList'))}
          title="Lista com marcadores"
        >
          <List size={14} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={activeStyle(editor.isActive('orderedList'))}
          title="Lista numerada"
        >
          <ListOrdered size={14} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          style={activeStyle(editor.isActive('blockquote'))}
          title="Citação"
        >
          <Quote size={14} strokeWidth={1.5} />
        </button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <button
          type="button"
          className="btn"
          onClick={addLink}
          style={activeStyle(editor.isActive('link'))}
          title="Adicionar link"
        >
          <Link2 size={14} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          className="btn"
          onClick={addImage}
          style={toolbarBtnStyle}
          title="Adicionar imagem"
        >
          <ImageIcon size={14} strokeWidth={1.5} />
        </button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <button
          type="button"
          className="btn"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          style={toolbarBtnStyle}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo size={14} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          style={toolbarBtnStyle}
          title="Refazer (Ctrl+Y)"
        >
          <Redo size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Editor */}
      <div style={{ background: 'hsl(var(--ds-surface))' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
