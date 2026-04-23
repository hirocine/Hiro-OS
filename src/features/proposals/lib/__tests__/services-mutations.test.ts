import { describe, it, expect } from 'vitest';
import { createDefaultServices } from '@/lib/services-template';
import {
  setPhaseEnabled,
  toggleAllInPhase,
  clearPhaseSpecs,
  updateItem,
  addItem,
  removeItem,
  duplicateItem,
  makeBlankItem,
} from '../services-mutations';

describe('services-mutations', () => {
  it('setPhaseEnabled altera só a fase indicada e é imutável', () => {
    const s = createDefaultServices();
    const next = setPhaseEnabled(s, 'gravacao', false);
    expect(next).not.toBe(s);
    expect(next.phases.find((p) => p.id === 'gravacao')!.enabled).toBe(false);
    expect(s.phases.find((p) => p.id === 'gravacao')!.enabled).toBe(true);
  });

  it('toggleAllInPhase marca/desmarca todos os items', () => {
    const s = createDefaultServices();
    const on = toggleAllInPhase(s, 'pre_producao', true);
    expect(on.phases[0].subcategories[0].items.every((i) => i.included)).toBe(true);
    const off = toggleAllInPhase(on, 'pre_producao', false);
    expect(off.phases[0].subcategories[0].items.every((i) => !i.included)).toBe(true);
  });

  it('updateItem clamps quantity para >= 1', () => {
    const s = createDefaultServices();
    const item = s.phases[0].subcategories[0].items[0];
    const next = updateItem(s, 'pre_producao', 0, item.id, { quantity: -5 });
    expect(next.phases[0].subcategories[0].items[0].quantity).toBe(1);
  });

  it('addItem insere um custom no fim da subcategoria', () => {
    const s = createDefaultServices();
    const before = s.phases[0].subcategories[0].items.length;
    const next = addItem(s, 'pre_producao', 0, 'Item Novo');
    const items = next.phases[0].subcategories[0].items;
    expect(items.length).toBe(before + 1);
    expect(items[items.length - 1].label).toBe('Item Novo');
    expect(items[items.length - 1].isCustom).toBe(true);
    expect(items[items.length - 1].included).toBe(true);
  });

  it('removeItem tira por id', () => {
    const s = createDefaultServices();
    const item = s.phases[0].subcategories[0].items[0];
    const next = removeItem(s, 'pre_producao', 0, item.id);
    expect(next.phases[0].subcategories[0].items.find((i) => i.id === item.id)).toBeUndefined();
  });

  it('duplicateItem cria cópia com novo id e isCustom=true', () => {
    const s = createDefaultServices();
    const item = s.phases[0].subcategories[0].items[0];
    const next = duplicateItem(s, 'pre_producao', 0, item.id);
    const dup = next.phases[0].subcategories[0].items[1];
    expect(dup.id).not.toBe(item.id);
    expect(dup.isCustom).toBe(true);
    expect(dup.label).toBe(item.label);
  });

  it('clearPhaseSpecs zera specification e qty=1', () => {
    const s = createDefaultServices();
    let next = updateItem(s, 'pre_producao', 0, s.phases[0].subcategories[0].items[0].id, {
      specification: 'X',
      quantity: 7,
    });
    next = clearPhaseSpecs(next, 'pre_producao');
    expect(next.phases[0].subcategories[0].items[0].specification).toBe('');
    expect(next.phases[0].subcategories[0].items[0].quantity).toBe(1);
  });

  it('makeBlankItem retorna defaults consistentes', () => {
    const it = makeBlankItem('Foo');
    expect(it.label).toBe('Foo');
    expect(it.isCustom).toBe(true);
    expect(it.included).toBe(true);
    expect(it.quantity).toBe(1);
  });
});
