

## Simplificar o rodape da sidebar: apenas avatar

### Alteracoes em `src/components/Layout/SidebarUserProfile.tsx`

1. Remover o icone `ChevronsUpDown` (import e uso)
2. Remover o bloco de texto com nome e email (as duas tags `<p>`)
3. Manter apenas o avatar como trigger do dropdown menu
4. Ajustar o botao trigger para ficar compacto (sem flex-1, apenas o avatar clicavel)

O resultado sera um rodape limpo:

```text
┌─────────────────────┐
│   👤    🔔    🌙    │
└─────────────────────┘
```

### Codigo

No trigger do dropdown, substituir o botao atual (avatar + nome + email + chevron) por apenas:

```tsx
<button className="p-1.5 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors shrink-0">
  <div className="relative w-8 h-8">
    <Avatar className="w-full h-full ring-2 ring-border">
      <AvatarImage src={avatarData.url || undefined} className="object-cover" />
      <AvatarFallback className="text-xs font-medium">{avatarData.initials}</AvatarFallback>
    </Avatar>
    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-success rounded-full border-2 border-card" />
  </div>
</button>
```

Remover o import de `ChevronsUpDown` do lucide-react.

