

## Mais espaco entre Menu e Administracao

### Alteracao

No arquivo `src/components/Layout/DesktopSidebar.tsx`, linha 171:

Trocar `my-3` por `my-5` no container do `Separator` que divide as secoes Menu e Administracao.

```
// De:
<div className="px-3 my-3">
  <Separator />
</div>

// Para:
<div className="px-3 my-5">
  <Separator />
</div>
```

Isso adiciona mais respiro vertical (20px ao inves de 12px) entre as duas secoes, deixando a separacao mais clara visualmente.

