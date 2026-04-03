

# Campos sempre editáveis na página de detalhes da proposta

## O que muda
Remover o padrão de click-to-edit (botão de lápis / SectionHeader com toggle). Todos os campos ficam permanentemente como inputs/textareas, com auto-save por seção ao sair do campo (onBlur) ou com botão "Salvar" discreto.

## Plano

### 1. Remover lógica de `editingSection`
- Remover estado `editingSection`, função `startEdit`, componente `SectionHeader` com botão de edição
- Remover componente `InfoRow` (não será mais usado)

### 2. Inicializar forms a partir dos dados da proposta
- Usar `useEffect` para popular `clientForm`, `investForm`, `diagForm`, `testimonialForm` quando `proposal` carregar (em vez de popular apenas ao clicar em editar)

### 3. Cada seção mostra sempre os inputs
- Remover todos os ternários `editingSection === 'x' ? (...inputs...) : (...InfoRow...)` 
- Manter apenas o bloco de inputs, sempre visível
- Cabeçalhos simplificados: ícone + título, sem botões de editar/cancelar/confirmar

### 4. Botão "Salvar" por seção
- Cada Card terá um botão "Salvar" discreto no rodapé, que chama `saveSection`
- O botão só fica habilitado quando há mudanças (comparar form atual vs dados da proposta)

### Resultado
A página fica como um formulário contínuo, pronto para edição imediata, sem necessidade de clique extra.

