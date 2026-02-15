

## Ajustes Visuais na Sidebar - Busca e Separador

### Problema 1: Linha saindo para fora da sidebar
O `Separator` na linha 151 usa `mx-3` mas visualmente ainda sangra. Vou trocar para `px-3` no container ou aplicar o separador dentro de um wrapper com padding adequado.

### Problema 2: Espacamento da secao de busca
A area de busca tem pouco respiro entre o header (border-b) e o separador abaixo. Precisa de padding top e bottom mais equilibrados.

### Solucao

No arquivo `src/components/Layout/DesktopSidebar.tsx`:

- Adicionar `pt-3` ao container da busca (linha 135) para dar respiro acima, ficando `px-3 py-3`
- Remover o `Separator` standalone (linha 151) -- usar `border-b` no container da busca para criar uma divisao mais limpa e contida, sem risco de sangrar
- Resultado: header com border-b, secao de busca com padding uniforme e border-b, navegacao abaixo

### Resultado visual esperado

```text
[Logo] Hiro Hub
─────────────────────  (border-b do header)
   [ Q Buscar...  ⌘K ]
─────────────────────  (border-b do container de busca)
   MENU
   Home
   Tarefas
   ...
```

