import { describe, it, expect } from 'vitest';
import { createDefaultServices } from '../services-template';
import { proposalServicesSchema } from '../services-schema';

describe('createDefaultServices()', () => {
  it('retorna 3 fases na ordem pre_producao → gravacao → pos_producao', () => {
    const services = createDefaultServices();
    expect(services.phases.map((p) => p.id)).toEqual([
      'pre_producao',
      'gravacao',
      'pos_producao',
    ]);
  });

  it('pré e pós têm exatamente 1 subcategoria com name=null', () => {
    const services = createDefaultServices();
    const pre = services.phases.find((p) => p.id === 'pre_producao')!;
    const pos = services.phases.find((p) => p.id === 'pos_producao')!;
    expect(pre.subcategories).toHaveLength(1);
    expect(pre.subcategories[0].name).toBeNull();
    expect(pos.subcategories).toHaveLength(1);
    expect(pos.subcategories[0].name).toBeNull();
  });

  it('gravacao tem 3 subcategorias na ordem Equipe → Equipamentos → Produção', () => {
    const services = createDefaultServices();
    const gravacao = services.phases.find((p) => p.id === 'gravacao')!;
    expect(gravacao.subcategories.map((s) => s.name)).toEqual([
      'Equipe',
      'Equipamentos',
      'Produção',
    ]);
  });

  it('total de itens é 26 (3 + 10 + 5 + 1 + 7)', () => {
    const services = createDefaultServices();
    const total = services.phases.reduce(
      (sum, phase) =>
        sum + phase.subcategories.reduce((s, sub) => s + sub.items.length, 0),
      0,
    );
    expect(total).toBe(26);
  });

  it('cada item nasce com defaults corretos', () => {
    const services = createDefaultServices();
    services.phases.forEach((phase) => {
      phase.subcategories.forEach((sub) => {
        sub.items.forEach((item) => {
          expect(item.included).toBe(false);
          expect(item.isCustom).toBe(false);
          expect(item.specification).toBe('');
          expect(item.quantity).toBe(1);
          expect(item.label).toBeTruthy();
          expect(item.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
          );
        });
      });
    });
  });

  it('cada fase nasce com enabled=true', () => {
    const services = createDefaultServices();
    services.phases.forEach((phase) => {
      expect(phase.enabled).toBe(true);
    });
  });

  it('chamadas distintas geram IDs distintos', () => {
    const a = createDefaultServices();
    const b = createDefaultServices();
    const idsA = a.phases.flatMap((p) => p.subcategories.flatMap((s) => s.items.map((i) => i.id)));
    const idsB = b.phases.flatMap((p) => p.subcategories.flatMap((s) => s.items.map((i) => i.id)));
    const intersection = idsA.filter((id) => idsB.includes(id));
    expect(intersection).toHaveLength(0);
  });

  it('output passa pelo proposalServicesSchema.parse sem erro', () => {
    expect(() => proposalServicesSchema.parse(createDefaultServices())).not.toThrow();
  });
});
