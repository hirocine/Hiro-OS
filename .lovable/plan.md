

# Restaurar Separador Arredondado na Seção de Clientes

## Problema

No projeto original ([Proposta Hiro Films](/projects/249b22d2-8eb4-4dab-b92c-7e7411639f99)), a seção `Clients` tem a classe `rounded-t-[40px] border-t border-gray-800` no container principal, criando uma borda superior arredondada que funciona como separador visual entre o Hero e os Clientes.

Na versão atual (`ProposalClients.tsx`), a `<section>` usa apenas `py-14 md:py-20` — sem borda nem arredondamento.

## Correção

**Arquivo**: `src/features/proposals/components/public/ProposalClients.tsx`

Alterar linha 10 de:
```tsx
<section className='py-14 md:py-20'>
```
Para:
```tsx
<section className='py-14 md:py-20 rounded-t-[40px] border-t border-gray-800'>
```

Uma linha alterada, zero risco.

