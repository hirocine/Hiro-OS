
## Adicionar busca na aba de Logs de Auditoria

### O que muda

**Arquivo**: `src/pages/Admin.tsx`

1. Adicionar um estado `logSearchQuery` para armazenar o texto de busca
2. Mover o `Select` de tabelas para fora do Card (seguindo o padrão das outras abas) e adicionar um campo de busca ao lado
3. Filtrar os logs também pelo texto de busca (pesquisando em usuário, ação e detalhes)

### Layout resultante

```text
+----------------------------------------------------------+
| Logs de Auditoria                                         |
| Monitore todas as atividades do sistema                   |
+----------------------------------------------------------+
| [Q Buscar logs...]              [Todas as tabelas v]      |
+----------------------------------------------------------+
| Card                                                      |
| +------------------------------------------------------+ |
| | Tabela de logs                                       | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
```

### Detalhes tecnicos

- Novo estado: `const [logSearchQuery, setLogSearchQuery] = useState('')`
- Mover o `Select` e adicionar `Input` de busca para fora do `Card`, em um `div` com layout flex
- O filtro de busca pesquisara em: `user_email`, `action_type`, `table_name` e detalhes (description gerada)
- Manter o filtro de tabela existente funcionando junto com a busca
