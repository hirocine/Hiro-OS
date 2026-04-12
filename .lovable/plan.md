

# Aplicar Helvetica Now Display como fonte global

## Arquivo: `src/index.css`

### Mudança única
No bloco `@layer base`, adicionar `font-family` ao `body`:

```css
body {
  @apply bg-background text-foreground;
  font-family: 'Helvetica Now Display', 'Inter', system-ui, sans-serif;
}
```

Nenhum outro arquivo modificado. Os `@font-face` e `.proposal-page` existentes permanecem intactos.

