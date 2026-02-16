

## Destacar Numero do SSD no Lugar do Icone

Substituir o icone `HardDrive` pelo numero do SSD quando ele existir. O numero sera exibido em destaque dentro do mesmo container arredondado, funcionando como identificador visual principal do card.

### Mudanca

**Arquivo:** `src/components/SSD/SSDCard.tsx`

- Quando `ssd.ssdNumber` existir: exibir o numero (ex: "01") em texto bold dentro do container `bg-primary/10`, sem o icone de HardDrive
- Quando nao existir: manter o icone `HardDrive` como fallback
- Remover o badge circular sobreposto (adicionado anteriormente) ja que o numero agora ocupa o espaco principal
- Manter o badge `#01` na linha de tags abaixo (ja existe)
- Estilo do numero: `text-sm font-bold text-primary` centralizado no container de 36x36px (mesmo tamanho do icone+padding atual)

