
## Redesign do Card de SSD no Kanban

### Objetivo

Tornar o card mais limpo, com hierarquia visual clara: numero do SSD em destaque, nome do equipamento, e badges informativos organizados.

### Mudancas no arquivo `src/components/SSD/SSDCard.tsx`

**1. Numero do SSD com mais destaque**
- Aumentar o container do numero para `w-11 h-11` com `rounded-xl`
- Usar `text-base font-bold` para o numero ficar maior e mais legivel
- Manter fallback do icone `HardDrive` quando nao ha numero

**2. Remover badge duplicado `#01`**
- O numero ja aparece no quadrado a esquerda, nao precisa repetir como badge na linha de tags
- Remover o badge `#{ssd.ssdNumber}` da secao de badges

**3. Melhorar tipografia do nome**
- Aumentar o nome para `text-sm font-medium` com `line-clamp-2` ao inves de `truncate`, permitindo ate 2 linhas para nomes longos

**4. Reorganizar badges**
- Badges de capacidade e status ficam em uma linha abaixo do nome
- Adicionar gap e alinhamento vertical centralizado entre badges
- Badge de capacidade: mostrar barra de uso simplificada como texto (ex: "8.2 TB / 16 TB")

**5. Padding e espacamento**
- Manter `p-4` no CardContent
- Usar `gap-3` entre o numero e o conteudo textual
- Adicionar `items-center` no flex principal para alinhar verticalmente o numero com o texto

### Resultado visual esperado

```text
+------------------------------------------+
|  +------+  LaCie 16TB d2 Professional    |
|  |  01  |  USB-C 3.2 Gen 2 ...           |
|  +------+  [8.2 TB / 16 TB] [Em uso]     |
+------------------------------------------+
```
