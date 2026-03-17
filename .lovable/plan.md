

# Calendário Full-Page para Esteira de Pós

## Problema
O calendário atual usa o componente date-picker pequeno com uma lista lateral. A referência mostra um calendário mensal full-page estilo Google Calendar, onde cada dia é uma célula grande que exibe os vídeos diretamente dentro dela.

## Alteração

### `src/features/post-production/components/PPCalendar.tsx` — reescrever completamente

Substituir o componente atual por um calendário mensal customizado (grid):

- **Header**: navegação mês anterior/próximo + nome do mês/ano
- **Grid 7 colunas**: seg, ter, qua, qui, sex (+ sáb, dom opcionais) — dias da semana como cabeçalho
- **Células de dia**: cada célula ocupa espaço proporcional (min-height ~120px), mostra o número do dia e lista os vídeos daquele dia como chips/pills truncados
- **Chips de vídeo**: mostram título truncado, clicáveis (`onItemClick`), com cor/estilo baseado no status ou prioridade
- **Dia atual**: highlight visual (borda ou badge colorido no número)
- **Dias fora do mês**: exibidos em tom mais claro (padding do grid)
- **Responsivo**: em mobile, células menores mostrando apenas contagem ou pontos indicadores

Não usa mais o componente `Calendar` do shadcn — é um grid customizado com `div`s.

Nenhum outro arquivo precisa mudar (a interface `PPCalendarProps` permanece igual).

