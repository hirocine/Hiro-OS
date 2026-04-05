

# 2 ajustes: RLS pública + slug mais curto

## 1. Migration: policy de leitura pública na tabela `orcamentos`
Criar migration com `CREATE POLICY "Allow public read by slug"` para permitir SELECT sem autenticação.

## 2. Encurtar slug
**Arquivo:** `src/features/proposals/hooks/useProposals.ts`, linha 8

Trocar:
```tsx
const raw = `hiro-${clientName}-${projectName}-${year}`;
```
Por:
```tsx
const raw = `${clientName}-${projectName}-${year}`;
```

Nenhum arquivo em `src/features/proposals/components/public/` será alterado.

