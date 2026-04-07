
Objetivo: eliminar o efeito de “abre outro calendário e fecha” ao selecionar data no modal de novo vídeo da Status Post.

Diagnóstico:
- O Popover já está controlado, então o bug atual não é mais um estado realmente “infinito”.
- O replay mostra dois problemas juntos no fechamento:
  1) o Popover devolve foco para o botão trigger;
  2) quando a data é selecionada, o footer com “Limpar” entra no DOM no mesmo render do fechamento, o que força recálculo de posição e cria um flicker/flip visual.
- Isso gera a sensação de um segundo calendário abrindo/fechando.

Implementação:

1. Arquivo: `src/features/post-production/components/PPDialog.tsx`
   - Adicionar `onCloseAutoFocus={(e) => e.preventDefault()}` nos dois `<PopoverContent>`.
   - Isso impede o foco automático de voltar para o trigger ao fechar.

2. Campo “Início”
   - Ajustar a renderização do bloco “Limpar” para depender também de `startDateOpen`.
   - Trocar:
     - `{form.start_date && (...)}`
   - Por:
     - `{form.start_date && startDateOpen && (...)}`
   - Assim, ao selecionar a primeira data, o footer não aparece no frame de fechamento.

3. Campo “Data de Entrega”
   - Aplicar o mesmo ajuste usando `dueDateOpen`.
   - Trocar:
     - `{form.due_date && (...)}`
   - Por:
     - `{form.due_date && dueDateOpen && (...)}`

4. Manter sem alteração
   - `modal={false}`
   - `open` / `onOpenChange`
   - handlers de seleção de data
   - classes de z-index e `side="bottom"`
   - qualquer lógica de criação/edição

Resultado esperado:
- selecionar uma data fecha o calendário de forma limpa;
- não há mais “segundo calendário” piscando;
- alterar uma data existente também fecha sem bounce visual;
- o botão “Limpar” continua aparecendo normalmente quando o calendário estiver aberto e já houver uma data preenchida.

Escopo:
- somente `src/features/post-production/components/PPDialog.tsx`
- nenhuma outra alteração
