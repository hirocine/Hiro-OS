import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, Send, Trash2, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { useAuthContext } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SUGGESTIONS = [
  "Resumo da plataforma agora",
  "Orçamentos que vencem essa semana",
  "Equipamentos emprestados",
  "Tarefas urgentes",
];

function MessageContent({ content }: { content: string }) {
  const navigate = useNavigate();
  const lines = content.split("\n");

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5">
      {lines.map((line, lineIdx) => {
        const linkRegex = /\[LINK:([^\]]+)\]/g;
        const hasLink = linkRegex.test(line);

        if (!hasLink) {
          return (
            <ReactMarkdown key={lineIdx} remarkPlugins={[remarkGfm]}>
              {line}
            </ReactMarkdown>
          );
        }

        const path = line.match(/\[LINK:([^\]]+)\]/)?.[1] || "";
        const cleanLine = line.replace(/\[LINK:[^\]]+\]/g, "").trim();

        return (
          <div key={lineIdx} className="flex items-start gap-2 flex-wrap">
            <ReactMarkdown remarkPlugins={[remarkGfm]} className="flex-1 min-w-0">
              {cleanLine}
            </ReactMarkdown>
            {path && (
              <button
                onClick={() => navigate(path)}
                className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors font-medium whitespace-nowrap"
              >
                Ver →
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function HiroBubble() {
  const { role, roleLoading } = useAuthContext();
  const { messages, isLoading, sendMessage, clearMessages } = useAIAssistant();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasAccess = !roleLoading && (role === "admin" || role === "producao");
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  if (!hasAccess) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleSuggestion = (s: string) => {
    if (!isLoading) sendMessage(s);
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label="Assistente Hiro"
      >
        {open
          ? <ChevronDown className="h-6 w-6" />
          : <Sparkles className="h-6 w-6" />
        }
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: hasMessages ? "520px" : "auto" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Hiro</p>
                <p className="text-[10px] text-muted-foreground">Assistente · Claude</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {hasMessages && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearMessages}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {hasMessages && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  }`}>
                    {msg.role === "assistant"
                      ? <MessageContent content={msg.content} />
                      : <p>{msg.content}</p>
                    }
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Consultando dados...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {!hasMessages && (
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Sugestões:</p>
              <div className="flex flex-col gap-1.5">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s)}
                    disabled={isLoading}
                    className="text-left text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 py-3 border-t border-border shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pergunte qualquer coisa..."
                disabled={isLoading}
                className="flex-1 text-sm bg-muted/50 border border-border rounded-xl px-3.5 py-2 outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all placeholder:text-muted-foreground/60 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
