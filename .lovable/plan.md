

# Adicionar botão "Voltar para Orçamentos" na tela de sucesso

## Mudança

**Arquivo:** `src/features/proposals/components/ProposalGuidedWizard.tsx`

Na linha 537, antes da div de ações alinhada à direita, adicionar uma row com layout `flex justify-between items-start`:
- Esquerda: botão "Voltar para Orçamentos" (variant="outline", com ícone ArrowLeft) que navega para `/orcamentos`
- Direita: os 3 botões existentes (Copiar Link, Editar Proposta, Ver Proposta)

O link mono fica abaixo, alinhado à direita como está.

Verificar se `ArrowLeft` já está nos imports de lucide-react.

