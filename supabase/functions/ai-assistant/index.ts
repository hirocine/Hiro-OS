import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const AI_ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export function useAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    const newMessage: Message = { role: "user", content: userMessage };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado para usar o assistente");
        setIsLoading(false);
        return;
      }

      const response = await fetch(AI_ASSISTANT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        toast.error(err.error || "Erro ao processar sua mensagem");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.text || "Não consegui processar sua pergunta.",
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Erro ao se comunicar com o assistente");
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages };
}
