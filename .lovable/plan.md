

## Mover filtros para fora do Card na aba Usuarios

### Problema
Na aba "Gerenciamento de Usuarios", a barra de busca, filtro de role e botao "Adicionar Usuario" estao dentro do Card, criando espaco desnecessario e layout inconsistente com outras paginas como Plataformas.

### O que muda

**Arquivo**: `src/pages/Admin.tsx`

1. **Mover o bloco de filtros** (search input + select + botao) para **fora e acima** do `<Card>`, dentro do `<TabsContent>` mas antes do Card
2. O Card fica apenas com a tabela de usuarios
3. Remover o `pt-6` do CardContent (a tabela comeca direto)

### Layout resultante

```text
+------------------------------------------+
| PageHeader (titulo + subtitulo)           |
+------------------------------------------+
| [Q Buscar usuarios...]  [Todos v]  [+ Adicionar Usuario] |
+------------------------------------------+
| Card                                      |
| +--------------------------------------+ |
| | Tabela de usuarios                   | |
| +--------------------------------------+ |
+------------------------------------------+
```

### Detalhes tecnicos

No `TabsContent value="users"`:

```tsx
<TabsContent value="users" className="space-y-4">
  {/* Filtros FORA do card */}
  <div className="flex items-center justify-between gap-4">
    <div className="relative flex-1">
      <Search ... />
      <Input ... />
    </div>
    <Select ...> ... </Select>
    <Button ...>Adicionar Usuario</Button>
  </div>

  {/* Card so com a tabela */}
  <Card>
    <CardContent className="pt-0">
      <Table> ... </Table>
    </CardContent>
  </Card>
</TabsContent>
```

Apenas o arquivo `src/pages/Admin.tsx` sera editado.

