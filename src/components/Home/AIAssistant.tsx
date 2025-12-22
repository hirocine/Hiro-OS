import { useState, useRef, useEffect } from "react";
import { Send, User, Sparkles, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { useIsMobile } from "@/hooks/use-mobile";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SUGGESTIONS = [
  "Quantos equipamentos temos no inventário?",
  "Quais tarefas estão atrasadas?",
  "Quais projetos estão ativos?",
  "Quais equipamentos estão emprestados?",
];

export function AIAssistant() {
  const { messages, isLoading, sendMessage, clearMessages } = useAIAssistant();
  const isMobile = useIsMobile();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  const handleSuggestion = (suggestion: string) => {
    if (!isLoading) {
      sendMessage(suggestion);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <Card className={`ai-assistant-card flex flex-col transition-[height] duration-500 ease-out will-change-[height] ${
      hasMessages ? "h-[500px]" : "min-h-[120px] sm:min-h-[180px] sm:h-[220px]"
    }`}>
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg">
              <div className="p-1 sm:p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-primary" />
              </div>
              Assistente Hiro
            </CardTitle>
            <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">· Gemini</span>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="text-muted-foreground hover:text-destructive flex-shrink-0 h-7 w-7 p-0 sm:h-8 sm:w-8"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-3 sm:p-4 pt-0 overflow-hidden">
        {/* Messages area - only show when there are messages */}
        {hasMessages && (
          <ScrollArea className="flex-1 pr-4 animate-fade-in" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
        {/* Wrapper para empurrar sugestões e input para baixo quando não há mensagens */}
        <div className={!hasMessages ? 'mt-auto' : ''}>
          {!isMobile && (
            <div className={`flex flex-wrap gap-2 justify-start transition-all duration-300 overflow-hidden ${
              hasMessages ? "opacity-0 max-h-0 mb-0" : "opacity-100 max-h-20 mb-3"
            }`}>
              {SUGGESTIONS.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestion(suggestion)}
                  className="text-xs italic text-muted-foreground justify-start h-auto py-2 whitespace-normal text-left"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}

          {/* Input form */}
          <form onSubmit={handleSubmit} className="relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta..."
              disabled={isLoading}
              className="pr-10"
            />
            <Button 
              type="submit" 
              variant="ghost"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary disabled:opacity-30"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
