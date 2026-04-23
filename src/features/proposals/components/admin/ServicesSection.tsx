import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      <Card className="lg:col-span-2 border-dashed">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 rounded-md bg-muted">
              <Package className="h-4 w-4 text-foreground/70" />
            </div>
            <CardTitle className="text-sm font-semibold tracking-tight truncate">
              Serviços Inclusos
            </CardTitle>
            <Badge variant="outline" className="text-[10px] gap-1 font-normal">
              <Lock className="h-3 w-3" /> Legado · somente leitura
            </Badge>
          </div>
          <Button size="sm" onClick={() => setShowMigrateDialog(true)} className="shrink-0">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Migrar para o novo editor
          </Button>
        </div>

        <div className="p-6 opacity-70 pointer-events-none select-none">
          {legacyInclusoCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
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
                  <div key={catIdx} className="border rounded-xl bg-muted/30 p-5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                      <span className="text-base">{phaseEmoji}</span>
                      <h4 className="text-sm font-semibold">{cat.categoria}</h4>
                    </div>
                    {cat.itens && (
                      <div className="space-y-0.5">
                        {cat.itens.map((item, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2.5 text-sm rounded-md px-2 py-1 -mx-2"
                          >
                            <Checkbox checked={item.ativo} disabled />
                            <span className={item.ativo ? 'text-foreground' : 'text-muted-foreground'}>
                              {item.nome}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    {cat.subcategorias?.map((sub, subIdx) => (
                      <div key={subIdx} className="space-y-0.5">
                        <p className="uppercase tracking-wider text-[10px] text-muted-foreground font-semibold px-2 pt-1 pb-0.5">
                          {sub.nome}
                        </p>
                        {sub.itens.map((item, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2.5 text-sm rounded-md px-2 py-1 -mx-2"
                          >
                            <Checkbox checked={item.ativo} disabled />
                            <span className={item.ativo ? 'text-foreground' : 'text-muted-foreground'}>
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
      </Card>

      <Dialog open={showMigrateDialog} onOpenChange={setShowMigrateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Migrar para o novo editor de Serviços?</DialogTitle>
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
            <Button variant="ghost" onClick={() => setShowMigrateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => migrate.mutate()} disabled={migrate.isPending}>
              {migrate.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Confirmar migração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
