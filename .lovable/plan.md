
Não é o melhor caminho “só puxar a escrita para frente”.

## O que está acontecendo
No `PdfHero`, o background está assim:

- `position: 'absolute', inset: 0` no bloco interno
- mas o container do `PdfHero` não está com `position: 'relative'`

Como a página (`pageStyle`) já tem `position: 'relative'`, esse background acaba se ancorando na página inteira, não só no hero. Resultado: ele fica por cima visualmente da área de clientes e apaga o texto.

## Por que só aumentar z-index não é a solução ideal
Daria para “forçar” o texto dos clientes para frente com `position: 'relative'` + `zIndex` alto, mas isso é um remendo:

- resolve só o título/subtítulo;
- pode deixar o overlay ainda escurecendo os logos;
- mantém a causa raiz no layout;
- pode gerar novos bugs em outras áreas da página 1.

## Melhor correção
Conter o background dentro do próprio hero.

### Arquivo
`src/features/proposals/components/public/ProposalPdfDocument.tsx`

### Ajuste principal
No container raiz do `PdfHero`, adicionar:

- `position: 'relative'`
- `overflow: 'hidden'`

Hoje ele está assim:
```ts
<div style={{ padding: '60px 60px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
```

Vai passar a ficar conceitualmente assim:
```ts
<div style={{
  padding: '60px 60px 30px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
}}>
```

## Ajuste complementar
Para blindar a seção de clientes no PDF, também vale deixar o wrapper dela explicitamente acima no stacking context:

- `position: 'relative'`
- `zIndex: 2`

no container do `PdfClients`.

Isso não substitui a correção principal, mas ajuda a garantir consistência no `html2canvas`.

## Resultado esperado
- o background e gradiente ficam limitados ao hero;
- “Quem confia na Hiro Films” e “Nossos Clientes” deixam de ficar apagados;
- os logos continuam no final da página 1;
- a página fica estruturalmente correta, sem depender de gambiarra de camada.

## Resumo da decisão
Então: sim, até daria para “puxar a escrita para frente”, mas o correto é primeiro impedir que o background do hero invada a área dos clientes. Depois, se necessário, reforçar o `z-index` da seção de clientes como proteção extra.
