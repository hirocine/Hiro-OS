

# Ajustar cards de Entregáveis: reposicionar número e remover efeito fantasma

## Mudanças no arquivo

`src/features/proposals/components/public/ProposalEntregaveis.tsx` — bloco `bloco.itens.map` (linhas 71-101)

## Alterações específicas

### 1. Card de entregável (linhas 77-97)

**Estrutura atual:**
```tsx
<div className='... p-[18px] ... flex gap-4'>
  <div className='flex-1 min-w-0'>
    <div className='... mb-4'>...</div>
    <h4>...</h4>
    <p>...</p>
  </div>
  {item.quantidade && (
    <div className='border-l border-[#1f3d26] pl-4 min-w-[56px] flex items-center justify-center'>
      <span className='text-[42px] ...'>...</span>
    </div>
  )}
</div>
```

**Nova estrutura:**
```tsx
<div className='... p-5 ... flex justify-between items-start gap-4'>
  <div className='flex-1 min-w-0'>
    <div className='... mb-[14px]'>...</div>
    <h4 className='text-[14px] font-medium mb-1'>...</h4>
    <p className='text-[12px] text-[#777] leading-[1.5]'>...</p>
  </div>
  {item.quantidade && (
    <span className='flex-shrink-0 text-[26px] font-medium tracking-[-0.02em] text-[#4CFF5C] leading-none'>
      {item.quantidade}
    </span>
  )}
</div>
```

**Mudanças detalhadas:**
- Padding: `p-[18px]` → `p-5` (20px)
- Layout: `flex gap-4` → `flex justify-between items-start gap-4`
- Ícone: `mb-4` → `mb-[14px]`
- Título: manter `text-[15px] font-bold` (mas ajustar para `text-[14px] font-medium` conforme especificação do usuário)
- Descrição: `text-[13px] text-gray-400 leading-relaxed` → `text-[12px] text-[#777] leading-[1.5]`
- Número: remove div wrapper com `border-l`, coloca `span` direto
- Número: `text-[42px]` → `text-[26px]`
- Número: `tracking-[-0.03em]` → `tracking-[-0.02em]`
- Número: alinhado ao topo via `items-start` no flex pai

### 2. Grid externo

Linha 72: `gap-3` já está correto (12px), manter.

## Escopo

- 1 arquivo, ~20 linhas ajustadas
- Apenas bloco `itens` (cards de Entregáveis)
- Bloco `cards` (Serviços) mantido intacto
- Zero mudanças em DB ou outros componentes

