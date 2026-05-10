import { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useIsMobile } from '@/hooks/use-mobile';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SUGGESTIONS = [
  'Quantos equipamentos temos no inventário?',
  'Quais tarefas estão atrasadas?',
  'Quais projetos estão ativos?',
  'Quais equipamentos estão emprestados?',
];

export function AIAssistant() {
  const { messages, isLoading, sendMessage, clearMessages } = useAIAssistant();
  const isMobile = useIsMobile();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const handleSuggestion = (suggestion: string) => {
    if (!isLoading) {
      sendMessage(suggestion);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div
      className="ai-assistant-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: hasMessages ? 500 : undefined,
        minHeight: hasMessages ? undefined : isMobile ? 120 : 180,
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        transition: 'height 0.5s ease-out, min-height 0.5s ease-out',
        willChange: 'height',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                display: 'grid',
                placeItems: 'center',
                background: 'hsl(var(--ds-accent) / 0.1)',
                border: '1px solid hsl(var(--ds-accent) / 0.25)',
                color: 'hsl(var(--ds-accent))',
                flexShrink: 0,
              }}
            >
              <Sparkles size={14} strokeWidth={1.5} />
            </div>
            <span
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: 'hsl(var(--ds-fg-1))',
              }}
            >
              Assistente Hiro
            </span>
            <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', whiteSpace: 'nowrap' }}>
              · Gemini
            </span>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              className="btn"
              onClick={clearMessages}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                justifyContent: 'center',
                flexShrink: 0,
                color: 'hsl(var(--ds-fg-3))',
              }}
              aria-label="Limpar conversa"
            >
              <Trash2 size={13} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 14, overflow: 'hidden' }}>
        {hasMessages && (
          <ScrollArea className="flex-1 animate-fade-in" ref={scrollRef}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 8 }}>
              {messages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: 10,
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {message.role === 'assistant' && (
                    <div
                      style={{
                        flexShrink: 0,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'hsl(var(--ds-accent) / 0.1)',
                        border: '1px solid hsl(var(--ds-accent) / 0.25)',
                        color: 'hsl(var(--ds-accent))',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Sparkles size={14} strokeWidth={1.5} />
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '8px 14px',
                      fontSize: 13,
                      background:
                        message.role === 'user' ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-line-2) / 0.5)',
                      color: message.role === 'user' ? '#fff' : 'hsl(var(--ds-fg-1))',
                      border:
                        message.role === 'user'
                          ? '1px solid hsl(var(--ds-accent))'
                          : '1px solid hsl(var(--ds-line-1))',
                    }}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div
                      style={{
                        flexShrink: 0,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'hsl(var(--ds-accent))',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <User size={14} strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'hsl(var(--ds-accent) / 0.1)',
                      border: '1px solid hsl(var(--ds-accent) / 0.25)',
                      color: 'hsl(var(--ds-accent))',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Sparkles size={14} strokeWidth={1.5} />
                  </div>
                  <div
                    style={{
                      padding: '8px 14px',
                      background: 'hsl(var(--ds-line-2) / 0.5)',
                      border: '1px solid hsl(var(--ds-line-1))',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      color: 'hsl(var(--ds-fg-3))',
                    }}
                  >
                    <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                    <span>Pensando...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div style={{ marginTop: hasMessages ? 0 : 'auto' }}>
          {!isMobile && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                justifyContent: 'flex-start',
                overflow: 'hidden',
                opacity: hasMessages ? 0 : 1,
                maxHeight: hasMessages ? 0 : 80,
                marginBottom: hasMessages ? 0 : 10,
                transition: 'opacity 0.3s, max-height 0.3s, margin 0.3s',
              }}
            >
              {SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="btn"
                  onClick={() => handleSuggestion(suggestion)}
                  style={{
                    fontSize: 11,
                    fontStyle: 'italic',
                    color: 'hsl(var(--ds-fg-3))',
                    justifyContent: 'flex-start',
                    height: 'auto',
                    padding: '6px 10px',
                    whiteSpace: 'normal',
                    textAlign: 'left',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta..."
              disabled={isLoading}
              style={{ paddingRight: 36 }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                position: 'absolute',
                right: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 28,
                height: 28,
                display: 'grid',
                placeItems: 'center',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                color: 'hsl(var(--ds-fg-3))',
                opacity: !input.trim() || isLoading ? 0.3 : 1,
                transition: 'color 0.15s, opacity 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!(!input.trim() || isLoading)) {
                  e.currentTarget.style.color = 'hsl(var(--ds-accent))';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(var(--ds-fg-3))';
              }}
            >
              <Send size={14} strokeWidth={1.5} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
