

## Mover busca e botão "Nova" para fora do Card na aba Categorias

### Problema
Na aba de categorias, a busca e o botão "Nova" estão dentro do Card. O padrão já aplicado na aba de Usuários coloca filtros/ações fora do Card, acima dele.

### O que muda

**Arquivo**: `src/components/Settings/CategoryManagement.tsx`

1. Extrair o bloco de busca + botão "Nova" para fora do `<Card>`, renderizando-os antes dele dentro de um wrapper `<div className="space-y-4">`
2. O Card fica apenas com o conteúdo da tabela/lista de categorias
3. Remover `space-y-4` do `CardContent` (já não precisa separar filtros do conteúdo)

### Layout resultante

```text
+----------------------------------------------------------+
| Gerenciamento de Categorias                               |
| Gerencie categorias e subcategorias de equipamentos       |
+----------------------------------------------------------+
| [Q Buscar categorias...]              [+ Nova]            |
+----------------------------------------------------------+
| Card                                                      |
| +------------------------------------------------------+ |
| | Lista de categorias (drag-and-drop)                  | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
```

### Detalhes técnicos

No `CategoryManagement.tsx`, o return passará de:

```tsx
<Card>
  <CardContent className="pt-4 space-y-4">
    <div className="flex ..."> {/* busca + botão */} </div>
    <div className="space-y-2"> {/* lista */} </div>
  </CardContent>
</Card>
```

Para:

```tsx
<div className="space-y-4">
  <div className="flex ..."> {/* busca + botão - FORA do card */} </div>
  <Card>
    <CardContent className="pt-4">
      <div className="space-y-2"> {/* lista */} </div>
    </CardContent>
  </Card>
</div>
```

Apenas o arquivo `src/components/Settings/CategoryManagement.tsx` será editado.

