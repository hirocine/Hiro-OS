import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Sparkles, Lock, Loader2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProposalServices } from '@/lib/services-schema';
import { createDefaultServices } from '@/lib/services-template';
import type { InclusoCategory } from '../../types';
import { ServicesEditor } from './ServicesEditor';

interface Props {
  proposalId: string;
  proposalSlug: string;
  /** atual valor de orcamentos.services (jsonb) */
  services: ProposalServices | null;
  /** legado vindo de orcamentos.entregaveis -> bloco "Serviços".cards */
  legacyInclusoCategories: InclusoCategory[];
}

export function ServicesSection({
  proposalId,
  proposalSlug,
  services,
  legacyInclusoCategories,
}: Props) {
  const queryClient = useQueryClient();
  const [showMigrateDialog, setShowMigrateDialog] = useState(false);

  const migrate = useMutation({
    mutationFn: async () => {
      const fresh = createDefaultServices();
      const { error } = await supabase
        .from('orcamentos')
        .update({ services: fresh as any })
        .eq('id', proposalId);
      if (error) throw error;
      return fresh;
    },
    onSuccess: () => {
      toast.success('Editor migrado', {
        description:
          'Os dados antigos foram preservados e continuam visíveis para o cliente até você reconfigurar tudo no novo formato.',
      });
      queryClient.invalidateQueries({ queryKey: ['proposal', proposalSlug] });
      setShowMigrateDialog(false);
    },
    onError: (err: any) => {
      toast.error('Falha ao migrar', { description: err?.message });
    },
  });

  // === Caso 1: já tem services -> renderiza novo editor ===
  if (services) {
    return (
      <ServicesEditor
        proposalId={proposalId}
        proposalSlug={proposalSlug}
        initialServices={services}
      />
    );
  }

  // === Caso 2: sem services -> render legado read-only + CTA ===
  return (
    <>
      <div
        className="lg:col-span-2"
        style={{
          border: '1px dashed hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-surface))',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '14px 18px',
            borderBottom: '1px solid hsl(var(--ds-line-1))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Package size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
            <span
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: 'hsl(var(--ds-fg-2))',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Serviços Inclusos
            </span>
            <span
              className="pill muted"
              style={{
                fontSize: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Lock size={11} strokeWidth={1.5} /> Legado · somente leitura
            </span>
          </div>
          <button
            type="button"
            className="btn primary"
            onClick={() => setShowMigrateDialog(true)}
            style={{ flexShrink: 0 }}
          >
            <Sparkles size={13} strokeWidth={1.5} />
            <span>Migrar para o novo editor</span>
          </button>
        </div>

        <div style={{ padding: 18, opacity: 0.7, pointerEvents: 'none', userSelect: 'none' }}>
          {legacyInclusoCategories.length === 0 ? (
            <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', fontStyle: 'italic' }}>
              Esta proposta não tem o bloco antigo de Serviços. Clique em <strong>Migrar</strong>{' '}
              para criar do zero no novo formato.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {legacyInclusoCategories.map((cat, catIdx) => {
                const phaseEmoji =
                  cat.categoria === 'Pré-produção'
                    ? '📋'
                    : cat.categoria === 'Gravação'
                    ? '🎬'
                    : '✂️';
                return (
                  <div
                    key={catIdx}
                    style={{
                      border: '1px solid hsl(var(--ds-line-1))',
                      background: 'hsl(var(--ds-line-2) / 0.3)',
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        borderBottom: '1px solid hsl(var(--ds-line-1))',
                        paddingBottom: 12,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{phaseEmoji}</span>
                      <h4
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'hsl(var(--ds-fg-1))',
                          fontFamily: '"HN Display", sans-serif',
                        }}
                      >
                        {cat.categoria}
                      </h4>
                    </div>
                    {cat.itens && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {cat.itens.map((item, i) => (
                          <label
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              fontSize: 13,
                              padding: '4px 8px',
                              margin: '0 -8px',
                            }}
                          >
                            <Checkbox checked={item.ativo} disabled />
                            <span
                              style={{
                                color: item.ativo ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
                              }}
                            >
                              {item.nome}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    {cat.subcategorias?.map((sub, subIdx) => (
                      <div key={subIdx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <p
                          style={{
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                            fontSize: 10,
                            color: 'hsl(var(--ds-fg-3))',
                            fontWeight: 600,
                            padding: '4px 8px 2px',
                          }}
                        >
                          {sub.nome}
                        </p>
                        {sub.itens.map((item, i) => (
                          <label
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              fontSize: 13,
                              padding: '4px 8px',
                              margin: '0 -8px',
                            }}
                          >
                            <Checkbox checked={item.ativo} disabled />
                            <span
                              style={{
                                color: item.ativo ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
                              }}
                            >
                              {item.nome}
                            </span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showMigrateDialog} onOpenChange={setShowMigrateDialog}>
        <DialogContent className="ds-shell">
          <DialogHeader>
            <DialogTitle>
              <span style={{ fontFamily: '"HN Display", sans-serif' }}>
                Migrar para o novo editor de Serviços?
              </span>
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2 text-sm leading-relaxed">
              <span className="block">
                O card legado <strong>"Serviços Inclusos"</strong> ficará oculto e em seu lugar
                aparece o novo editor com fases (Pré, Gravação, Pós), especificações,
                quantidades e itens custom.
              </span>
              <span className="block">
                Os dados antigos <strong>não são apagados</strong> — você reconfigura no novo
                formato olhando o legado como referência. Use o cancelar para sair sem mudar nada.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" className="btn" onClick={() => setShowMigrateDialog(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => migrate.mutate()}
              disabled={migrate.isPending}
            >
              {migrate.isPending && <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />}
              <span>Confirmar migração</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
