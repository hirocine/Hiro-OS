# 🎨 Guia de Animações

## Durações Padrão

- **200ms** (`duration-200`): Hover, clicks, interações rápidas
- **300ms** (`duration-300`): Fade-in, slide, transições de entrada/saída
- **400ms** (`duration-400`): Animações complexas (raramente usado)

## Padrões de Hover

### Cards
```tsx
className="hover:shadow-elegant transition-all duration-200 hover:scale-[1.02]"
```

**Ou usando constantes:**
```tsx
import { HOVER_EFFECTS } from '@/lib/animations';

<Card className={HOVER_EFFECTS.card}>...</Card>
```

### Botões
```tsx
// Já incluído no buttonVariants, não precisa adicionar
<Button>...</Button>
```

### Ícones
```tsx
className="transition-transform duration-200 hover:scale-110"
```

**Ou usando constantes:**
```tsx
import { HOVER_EFFECTS } from '@/lib/animations';

<Icon className={HOVER_EFFECTS.icon} />
```

### Links
```tsx
className="transition-colors duration-200 hover:text-primary"
```

## Animações de Entrada

- `animate-fade-in`: Fade + slide sutil (300ms)
- `animate-scale-in`: Scale de 0.95 → 1 (200ms)
- `animate-slide-in-right`: Slide da direita (300ms)

**Exemplo:**
```tsx
import { ENTRY_ANIMATIONS } from '@/lib/animations';

<div className={ENTRY_ANIMATIONS.fadeIn}>
  Conteúdo que aparece suavemente
</div>
```

## Acessibilidade

Sempre adicionar suporte a `prefers-reduced-motion` para respeitar preferências do usuário:

```tsx
import { cn } from '@/lib/utils';
import { ACCESSIBILITY } from '@/lib/animations';

<div className={cn('animate-fade-in', ACCESSIBILITY.reduceMotion)}>
  Conteúdo animado
</div>
```

Isso desabilita animações para usuários que configuraram o sistema para reduzir movimento.

## Componentes Radix UI

Os seguintes componentes já vêm com animações pré-configuradas:
- Dialog
- Popover
- Tooltip
- HoverCard
- DropdownMenu
- AlertDialog
- Select

**Não precisa adicionar animações adicionais** a esses componentes.

## Biblioteca de Constantes

Use o arquivo `src/lib/animations.ts` para referências rápidas:

```tsx
import { 
  ANIMATION_DURATIONS,
  HOVER_EFFECTS,
  ENTRY_ANIMATIONS,
  ACCESSIBILITY 
} from '@/lib/animations';

// Durações
ANIMATION_DURATIONS.fast      // 'duration-200'
ANIMATION_DURATIONS.medium    // 'duration-300'
ANIMATION_DURATIONS.slow      // 'duration-400'

// Hovers
HOVER_EFFECTS.card    // Para cards
HOVER_EFFECTS.button  // Para botões personalizados
HOVER_EFFECTS.icon    // Para ícones
HOVER_EFFECTS.link    // Para links

// Entradas
ENTRY_ANIMATIONS.fadeIn
ENTRY_ANIMATIONS.scaleIn
ENTRY_ANIMATIONS.slideRight

// Acessibilidade
ACCESSIBILITY.reduceMotion
```

## Boas Práticas

1. **Use durações consistentes**: Sempre 200ms para hovers, 300ms para entradas
2. **Combine transições**: `transition-all` para múltiplas propriedades
3. **Respeite acessibilidade**: Sempre inclua `motion-reduce`
4. **Evite animações excessivas**: Menos é mais
5. **Teste em dispositivos móveis**: Animações devem ser suaves em todos os dispositivos

## Exemplos Completos

### Card Interativo
```tsx
<Card className="hover:shadow-elegant transition-all duration-200 hover:scale-[1.02] animate-fade-in">
  <CardContent>...</CardContent>
</Card>
```

### Botão Personalizado (se não usar o componente Button)
```tsx
<button className="hover:shadow-elegant transition-all duration-200 hover:scale-105">
  Clique aqui
</button>
```

### Modal com Backdrop Blur
```tsx
// Já implementado no Dialog component
<Dialog>
  <DialogContent>
    Conteúdo do modal
  </DialogContent>
</Dialog>
```
