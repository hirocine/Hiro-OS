

# Adicionar Open Sans como fonte padrão

## Alterações

1. **`index.html`** — Adicionar import do Google Fonts para Open Sans (pesos 400, 500, 600, 700)
2. **`tailwind.config.ts`** — Definir `fontFamily.sans` com `"Open Sans"` como primeira opção, seguida do fallback padrão
3. **`src/index.css`** — Aplicar `font-family` no `body` via `@layer base`

| Arquivo | Mudança |
|---|---|
| `index.html` | `<link>` Google Fonts Open Sans |
| `tailwind.config.ts` | `fontFamily: { sans: ['"Open Sans"', ...] }` |
| `src/index.css` | Garantir que `body` use a fonte via Tailwind |

