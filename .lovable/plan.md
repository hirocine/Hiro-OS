

## Remover TabsList do header da pagina Admin

### O que muda

Como a navegacao entre as secoes de Administracao agora e feita pela sidebar (subitens), a barra de abas (TabsList) no topo da pagina se torna redundante e sera removida.

### Detalhes tecnicos

**Arquivo**: `src/pages/Admin.tsx`

1. **Remover o bloco `<TabsList>` inteiro** (linhas 556-577) que contem os 5 `TabsTrigger` (Usuarios, Logs, Categorias, Notificacoes, Sistema).

2. **Manter o componente `<Tabs>`** com `value={activeTab}` e o `onValueChange` para que a logica de refresh automatico ao trocar de aba continue funcionando (o `onValueChange` e disparado quando a URL muda via sidebar).

3. **Manter todos os `<TabsContent>`** inalterados — eles continuam controlados pelo `activeTab` derivado da URL.

Resultado: a pagina mostra direto o conteudo da aba ativa sem a barra de navegacao duplicada no topo.

