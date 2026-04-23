import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProposalServices } from '@/lib/services-schema';
import { proposalServicesSchema } from '@/lib/services-schema';
import { toast } from 'sonner';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Options {
  proposalId: string | undefined;
  proposalSlug: string | undefined;
  /** debounce em ms (default 500) */
  debounceMs?: number;
}

/**
 * Autosave de `orcamentos.services` com debounce.
 * Retorna `save(next)` para chamar a cada mutação local
 * e `status` para o indicador "Salvo / Salvando…".
 */
export function useServicesAutosave({ proposalId, proposalSlug, debounceMs = 500 }: Options) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<ProposalServices | null>(null);

  const mutation = useMutation({
    mutationFn: async (services: ProposalServices) => {
      // valida antes de persistir — se o estado local sair do schema, avisa
      const parsed = proposalServicesSchema.safeParse(services);
      if (!parsed.success) {
        throw new Error('Estrutura inválida: ' + parsed.error.issues[0]?.message);
      }
      if (!proposalId) throw new Error('Proposta sem ID');
      const { error } = await supabase
        .from('orcamentos')
        .update({ services: parsed.data as any })
        .eq('id', proposalId);
      if (error) throw error;
      return parsed.data;
    },
    onSuccess: () => {
      setStatus('saved');
      // invalida cache pra refletir na próxima abertura/refetch
      if (proposalSlug) {
        queryClient.invalidateQueries({ queryKey: ['proposal', proposalSlug] });
      }
      // depois de 2s sem novo save, volta para idle
      setTimeout(() => {
        setStatus((s) => (s === 'saved' ? 'idle' : s));
      }, 2000);
    },
    onError: (err: any) => {
      setStatus('error');
      toast.error('Erro ao salvar serviços', { description: err?.message });
    },
  });

  const flush = useCallback(() => {
    if (!pendingRef.current) return;
    const next = pendingRef.current;
    pendingRef.current = null;
    setStatus('saving');
    mutation.mutate(next);
  }, [mutation]);

  const save = useCallback(
    (next: ProposalServices) => {
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, debounceMs);
    },
    [debounceMs, flush],
  );

  // ao desmontar, descarrega se houver algo pendente
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pendingRef.current) {
        const data = pendingRef.current;
        pendingRef.current = null;
        // best-effort fire-and-forget
        if (proposalId) {
          supabase.from('orcamentos').update({ services: data as any }).eq('id', proposalId);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { save, status, flush };
}
