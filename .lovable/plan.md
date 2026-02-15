

## Adicionar primeiro nome do usuário ao lado do avatar no rodapé da sidebar

### Alteração em `src/components/Layout/SidebarUserProfile.tsx`

Extrair o primeiro nome do `avatarData.displayName` e exibi-lo ao lado do avatar dentro do botão trigger do dropdown.

**Detalhes técnicos:**

1. Criar uma variável `firstName` que extrai apenas o primeiro nome:
   ```tsx
   const firstName = avatarData.displayName?.split(' ')[0] || null;
   ```

2. Alterar o botão trigger para incluir o nome ao lado do avatar:
   ```tsx
   <button className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-lg cursor-pointer transition-colors shrink-0">
     <Avatar className="w-8 h-8">
       <AvatarImage src={avatarData.url || undefined} className="object-cover" />
       <AvatarFallback className="text-xs font-medium">{avatarData.initials}</AvatarFallback>
     </Avatar>
     {firstName && (
       <span className="text-sm font-medium text-foreground truncate max-w-[80px]">
         {firstName}
       </span>
     )}
   </button>
   ```

3. O tooltip continua mostrando o nome completo -- util quando o primeiro nome estiver truncado ou para ver o sobrenome.

### Resultado esperado

```text
┌─────────────────────┐
│ 👤 Lucas     🌙  🔔 │
└─────────────────────┘
```

- Se o usuario nao tiver nome cadastrado, aparece apenas o avatar (sem texto vazio)
- `truncate` com `max-w-[80px]` garante que nomes longos nao empurrem os icones
- Um unico arquivo alterado: `SidebarUserProfile.tsx`

