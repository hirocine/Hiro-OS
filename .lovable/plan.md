

# Aumentar limite da descrição no Hero da proposta

## Arquivo: `src/features/proposals/components/public/ProposalHero.tsx`

### Mudança (linha 97)
Alterar `max-w-[500px]` para `max-w-[600px]` no parágrafo da descrição, dando mais espaço horizontal para o texto respirar e evitar parágrafos muito comprimidos.

```diff
- <p style={fadeUp(300)} className='text-base md:text-lg text-gray-400 font-light mb-16 max-w-[500px] relative z-10'>
+ <p style={fadeUp(300)} className='text-base md:text-lg text-gray-400 font-light mb-16 max-w-[600px] relative z-10'>
```

Nenhum outro arquivo modificado. Componentes públicos preservados em estrutura e funcionalidade -- apenas o constraint de largura muda.

