

# Padronização dos Stats Cards

## Problema
Existem 6 implementações diferentes de stats cards:

| Página | Layout | border-l | bg tint | Ícone |
|--------|--------|----------|---------|-------|
| Esteira de Pós | horizontal simples | ❌ | ❌ | inline |
| Retiradas | border-l + tint | ✅ | ✅ | em bg rounded |
| Projetos AV | border-l + tint | ✅ | ✅ | em bg rounded |
| Inventário | CardHeader/Content | ❌ | ✅ | top-right em bg |
| Armazenamento | CardHeader/Content | ❌ | ❌ | top-right simples |
| Tarefas | border-l + CardHeader | ✅ | ✅ | top-right em bg |

## Solução
Criar um componente reutilizável `StatsCard` e refatorar todas as páginas para usá-lo.

### Estilo unificado (baseado no padrão mais comum: Retiradas/Projetos AV/Tarefas)
- `border-l-4` com cor temática
- Background tint sutil (`bg-[cor]/5`)
- Ícone dentro de um `div` com `bg-[cor]/10 rounded-lg`
- Layout: título muted em cima, valor grande embaixo
- Descrição opcional abaixo do valor

### Novo componente: `src/components/ui/stats-card.tsx`
```typescript
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;        // ex: 'text-primary'
  bgColor: string;      // ex: 'bg-primary/10'
  borderColor: string;  // ex: 'border-l-primary'
  description?: string;
}
```

### Arquivos editados
1. **`src/components/ui/stats-card.tsx`** — Novo componente reutilizável (card + skeleton loader)
2. **`src/features/post-production/components/PPStatsCards.tsx`** — Usar novo componente
3. **`src/components/Projects/ProjectStatsCards.tsx`** — Usar novo componente
4. **`src/features/audiovisual-projects/components/AVProjectStatsCards.tsx`** — Usar novo componente
5. **`src/components/Equipment/EquipmentStatsCards.tsx`** — Usar novo componente
6. **`src/features/tasks/components/TaskStatsCards.tsx`** — Usar novo componente
7. **`src/pages/SSDs.tsx`** — Extrair stats cards inline para usar novo componente

Todas as páginas manterão seus dados/lógica próprios, apenas delegando a renderização ao componente padronizado.

