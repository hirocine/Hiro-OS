import type { ProposalServices, ServiceItem } from './services-schema';

/**
 * Template master da seção "O que está incluso no processo".
 * Cada chamada gera uma nova instância com IDs únicos.
 * Mudanças feitas numa proposta jamais afetam o template.
 */

const makeItem = (label: string): ServiceItem => ({
  id: crypto.randomUUID(),
  label,
  specification: '',
  quantity: 1,
  included: false,
  isCustom: false,
});

const PRE_PRODUCAO_ITEMS = ['Roteiro', 'Storyboard', 'Cenário'];

const GRAVACAO_EQUIPE_ITEMS = [
  'Diretor',
  'Filmmaker',
  'Fotógrafo',
  'Making Of',
  'Produtor',
  'Operador de Som',
  'Operador de TP',
  'Make e Cabeleireiro',
  'Figurino',
  'Fotógrafo Fixo Backdrop',
];

const GRAVACAO_EQUIPAMENTOS_ITEMS = [
  'Câmeras',
  'Iluminação',
  'Áudio',
  'Drone',
  'Teleprompter',
];

const GRAVACAO_PRODUCAO_ITEMS = ['Estúdio'];

const POS_PRODUCAO_ITEMS = [
  'Edição',
  'Motion Graphics',
  'VFX',
  'Color Grading',
  'Trilha de Banco',
  'Banco de Imagens',
  'Geração de Cenas com AI',
];

export function createDefaultServices(): ProposalServices {
  return {
    phases: [
      {
        id: 'pre_producao',
        name: 'Pré-produção',
        enabled: true,
        subcategories: [
          { name: null, items: PRE_PRODUCAO_ITEMS.map(makeItem) },
        ],
      },
      {
        id: 'gravacao',
        name: 'Gravação',
        enabled: true,
        subcategories: [
          { name: 'Equipe', items: GRAVACAO_EQUIPE_ITEMS.map(makeItem) },
          { name: 'Equipamentos', items: GRAVACAO_EQUIPAMENTOS_ITEMS.map(makeItem) },
          { name: 'Produção', items: GRAVACAO_PRODUCAO_ITEMS.map(makeItem) },
        ],
      },
      {
        id: 'pos_producao',
        name: 'Pós-produção',
        enabled: true,
        subcategories: [
          { name: null, items: POS_PRODUCAO_ITEMS.map(makeItem) },
        ],
      },
    ],
  };
}
