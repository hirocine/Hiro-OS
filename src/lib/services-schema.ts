import { z } from 'zod';

/**
 * Schema da seção "O que está incluso no processo" das propostas comerciais.
 *
 * Estrutura: 3 fases fixas (pre_producao → gravacao → pos_producao).
 * Dentro de gravacao, 3 subcategorias fixas (Equipe → Equipamentos → Produção).
 * Pré e Pós têm exatamente 1 subcategoria com `name: null`.
 */

export const PHASE_IDS = ['pre_producao', 'gravacao', 'pos_producao'] as const;
export const phaseIdSchema = z.enum(PHASE_IDS);
export type PhaseId = z.infer<typeof phaseIdSchema>;

export const GRAVACAO_SUBCATEGORY_ORDER = ['Equipe', 'Equipamentos', 'Produção'] as const;

export const serviceItemSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  specification: z.string(),
  quantity: z.number().int().min(1),
  included: z.boolean(),
  isCustom: z.boolean(),
});
export type ServiceItem = z.infer<typeof serviceItemSchema>;

export const subcategorySchema = z.object({
  name: z.string().nullable(),
  items: z.array(serviceItemSchema),
});
export type Subcategory = z.infer<typeof subcategorySchema>;

export const phaseSchema = z.object({
  id: phaseIdSchema,
  name: z.string(),
  enabled: z.boolean(),
  subcategories: z.array(subcategorySchema),
});
export type Phase = z.infer<typeof phaseSchema>;

export const proposalServicesSchema = z
  .object({
    phases: z.array(phaseSchema),
  })
  .superRefine((data, ctx) => {
    // Exatamente 3 fases na ordem fixa
    if (data.phases.length !== PHASE_IDS.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phases'],
        message: `Esperado exatamente ${PHASE_IDS.length} fases, recebido ${data.phases.length}.`,
      });
      return;
    }

    data.phases.forEach((phase, idx) => {
      const expected = PHASE_IDS[idx];
      if (phase.id !== expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phases', idx, 'id'],
          message: `Ordem de fases inválida: posição ${idx} deveria ser "${expected}", recebido "${phase.id}".`,
        });
      }
    });

    // Validar subcategorias da fase gravacao
    const gravacao = data.phases.find((p) => p.id === 'gravacao');
    if (gravacao) {
      if (gravacao.subcategories.length !== GRAVACAO_SUBCATEGORY_ORDER.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phases'],
          message: `Fase "gravacao" deve ter exatamente ${GRAVACAO_SUBCATEGORY_ORDER.length} subcategorias.`,
        });
      } else {
        gravacao.subcategories.forEach((sub, idx) => {
          const expected = GRAVACAO_SUBCATEGORY_ORDER[idx];
          if (sub.name !== expected) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['phases', data.phases.indexOf(gravacao), 'subcategories', idx, 'name'],
              message: `Ordem de subcategorias em "gravacao" inválida: posição ${idx} deveria ser "${expected}", recebido "${sub.name}".`,
            });
          }
        });
      }
    }

    // Pré e Pós devem ter exatamente 1 subcategoria com name === null
    (['pre_producao', 'pos_producao'] as const).forEach((phaseId) => {
      const phase = data.phases.find((p) => p.id === phaseId);
      if (!phase) return;
      if (phase.subcategories.length !== 1 || phase.subcategories[0].name !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phases', data.phases.indexOf(phase), 'subcategories'],
          message: `Fase "${phaseId}" deve ter exatamente 1 subcategoria com name=null.`,
        });
      }
    });
  });

export type ProposalServices = z.infer<typeof proposalServicesSchema>;
