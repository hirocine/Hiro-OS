

# Alinhar bolinhas dos subitens com o ícone pai na sidebar

## Problema
Os subitens (●) estão deslocados para a direita em relação ao ícone do item pai. Isso acontece porque o container dos children tem `px-1.5` e cada subitem tem `px-3`, somando 6+12=18px de padding esquerdo, enquanto o ícone pai tem apenas `px-3` = 12px.

## Solução
Reduzir o `px-3` dos subitens NavLink para `px-1.5`, totalizando 6+6=12px -- alinhando perfeitamente com o ícone pai.

## Arquivos editados
- `src/components/Layout/DesktopSidebar.tsx` (linha 180): `px-3` → `px-1.5`
- `src/components/Layout/MobileSidebar.tsx`: mesma alteração no componente equivalente

