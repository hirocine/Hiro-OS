import { describe, it, expect } from 'vitest';
import { proposalServicesSchema } from '../services-schema';
import { createDefaultServices } from '../services-template';

describe('proposalServicesSchema', () => {
  it('aceita o objeto produzido por createDefaultServices()', () => {
    const result = proposalServicesSchema.safeParse(createDefaultServices());
    expect(result.success).toBe(true);
  });

  it('rejeita ordem errada de fases', () => {
    const data = createDefaultServices();
    [data.phases[0], data.phases[1]] = [data.phases[1], data.phases[0]];
    const result = proposalServicesSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejeita ordem errada de subcategorias dentro de gravacao', () => {
    const data = createDefaultServices();
    const gravacao = data.phases.find((p) => p.id === 'gravacao')!;
    [gravacao.subcategories[0], gravacao.subcategories[1]] = [
      gravacao.subcategories[1],
      gravacao.subcategories[0],
    ];
    const result = proposalServicesSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejeita quantity menor que 1', () => {
    const data = createDefaultServices();
    data.phases[0].subcategories[0].items[0].quantity = 0;
    const result = proposalServicesSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejeita id que não é uuid', () => {
    const data = createDefaultServices();
    data.phases[0].subcategories[0].items[0].id = 'not-a-uuid';
    const result = proposalServicesSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejeita número errado de fases', () => {
    const data = createDefaultServices();
    data.phases.pop();
    const result = proposalServicesSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
