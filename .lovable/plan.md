
## Varredura Mobile -- Problemas Encontrados e Correcoes

Apos verificacao completa da aplicacao em viewport mobile (390x844), identifiquei os seguintes pontos:

### Problemas Encontrados

**1. SSD Details Dialog nao e responsivo no mobile**
O `SSDDetailsDialog` usa `Dialog` puro ao inves de um componente responsivo. No mobile, dialogs podem ficar dificeis de interagir -- o padrao da aplicacao e usar Drawer (bottom sheet) para mobile. Alem disso, o form de datas com `grid-cols-2` fica apertado em telas pequenas.

**2. 5 chamadas `alert()` nativo no SSD Details Dialog**
Validacoes usam `alert()` do navegador, que quebra a experiencia no mobile (especialmente PWA). Deve usar `toast` como o resto da aplicacao.

**3. Kanban Board sem suporte a touch adequado**
O `SSDKanbanBoard` usa apenas `PointerSensor` com `distance: 8`. No mobile, seria ideal adicionar `TouchSensor` com `delay` para diferenciar scroll de drag, evitando ativacoes acidentais.

**4. TopBar com altura excessiva (h-28 = 112px)**
A barra superior mobile ocupa 112px, o que e bastante para telas pequenas. Isso reduz o espaco util disponivel, especialmente na pagina de SSDs com o Kanban.

### Plano de Correcoes

**Arquivo 1: `src/components/SSD/SSDDetailsDialog.tsx`**
- Trocar `Dialog` por `ResponsiveDialog` (que usa Drawer no mobile)
- Adaptar o layout das datas para `grid-cols-1` no mobile
- Substituir os 5 `alert()` por `toast.error()` usando o `enhancedToast` ja existente

**Arquivo 2: `src/components/SSD/SSDKanbanBoard.tsx`**
- Adicionar `TouchSensor` com `activationConstraint: { delay: 250, tolerance: 5 }` para suporte touch adequado
- Isso permite scroll normal e so ativa drag apos segurar 250ms

**Arquivo 3: `src/components/Layout/TopBar.tsx`**
- Reduzir altura de `h-28` para `h-16` (64px, padrao mobile)
- Ajustar o padding-top correspondente no Layout.tsx

**Arquivo 4: `src/components/Layout/Layout.tsx`**
- Atualizar o padding-top do main content para acompanhar a nova altura da TopBar (de `pt-28` para `pt-16`, e o calculo PWA correspondente)

### Detalhes Tecnicos

**SSDDetailsDialog -- Migracao para ResponsiveDialog:**
- Importar `ResponsiveDialog` e `ResponsiveDialogContent` do componente existente `@/components/ui/responsive-dialog`
- Trocar `Dialog` por `ResponsiveDialog`, `DialogContent` por `ResponsiveDialogContent`
- Grid de datas: `grid-cols-1 sm:grid-cols-2`
- Trocar `alert('mensagem')` por `toast.error('mensagem')` importando de `sonner`

**SSDKanbanBoard -- TouchSensor:**
```text
import { TouchSensor } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
);
```

**TopBar + Layout -- Reducao de altura:**
- TopBar: `h-28` para `h-16`
- Layout.tsx: `pt-28` para `pt-16`, e calculo PWA de `7rem` para `4rem`
