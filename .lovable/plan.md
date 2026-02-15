

## Adicionar animação de entrada no PageHeader da Administração

### Problema

O `PageHeader` (título + subtítulo) muda de conteúdo ao trocar de aba, mas como o componente não é desmontado/remontado (apenas o texto muda), a animação `animate-fade-in` nunca é disparada.

### Solução

**Arquivo: `src/pages/Admin.tsx`**

Adicionar duas props ao `PageHeader` (linha 550):

1. `key={activeTab}` — força o React a desmontar e remontar o componente ao trocar de aba, disparando a animação
2. `className="animate-fade-in"` — aplica a animação de fade-in ao montar

```tsx
<PageHeader 
  key={activeTab}
  className="animate-fade-in"
  title={...}
  subtitle={...}
  actions={...}
/>
```

Nenhum arquivo novo, dependência ou alteração no componente `PageHeader` base. A prop `className` já é suportada pelo componente.

