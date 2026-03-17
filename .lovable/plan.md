

# Melhorar visualmente o PPDialog

O dialog atual usa selects com texto simples para Status, Prioridade e Editor. Precisa mostrar badges coloridas e avatares com foto, seguindo o padrão do TaskDialog.

## Alterações em `src/features/post-production/components/PPDialog.tsx`

### 1. Selects de Etapa e Prioridade com Badges
- Importar `PPStatusBadge` e `PPPriorityBadge`
- No `SelectTrigger`, renderizar o badge correspondente via `<SelectValue>` customizado
- Nos `SelectItem`, renderizar os badges em vez de texto puro

### 2. Select de Editor com Avatar + Foto
- Importar `Avatar`, `AvatarImage`, `AvatarFallback`
- Cada `SelectItem` mostra avatar com foto (`u.avatar_url`) + nome
- O trigger também mostra o avatar do editor selecionado

### 3. Pequenos ajustes visuais
- Dialog um pouco mais largo (`max-w-2xl` em vez de `max-w-lg`) para dar respiro
- Scroll se necessário (`max-h-[90vh] overflow-y-auto`)
- Labels com `htmlFor` para acessibilidade
- Botão Excluir com confirmação visual mais clara (ícone + texto)

Apenas um arquivo alterado: `PPDialog.tsx`.

