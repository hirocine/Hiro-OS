

## Corrigir layout da seção de Logs de Auditoria

### Problemas identificados

1. Botao "Atualizar" ocupa uma linha inteira sozinho, criando espaco vazio desnecessario (e conforme decisao anterior, refresh manual foi removido pois os dados atualizam automaticamente ao trocar de aba)
2. `pt-6` no CardContent cria padding excessivo no topo
3. O filtro com icone tem layout desalinhado e espaçamento ruim

### O que muda

**Arquivo**: `src/pages/Admin.tsx`

1. **Remover o botao "Atualizar"** — os logs ja atualizam automaticamente ao navegar para a aba via sidebar (conforme decisao anterior do projeto)

2. **Reduzir padding do CardContent** — trocar `pt-6` por `pt-4` para diminuir o espaco no topo

3. **Simplificar o layout do filtro** — remover o wrapper `flex items-center gap-2` desnecessario e o icone `Filter` solto, deixando apenas o `Select` diretamente com `mb-4`

**Resultado**: o filtro fica logo no topo do card, sem espaco desperdicado, e a tabela começa imediatamente abaixo.

