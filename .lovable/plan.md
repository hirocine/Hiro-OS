

# Ajustes no campo WhatsApp e botão de aprovação

## Problemas identificados

1. **Label do campo**: Está como "WhatsApp", deveria ser "WhatsApp para Aprovação"
2. **Formatação do número**: O campo não formata automaticamente (ex: `(11) 95151-3862`)
3. **Botão na proposta pública não abre WhatsApp**: O número salvo é `5511951513862` (com código do país), mas o `wa.me` precisa do formato `+5511951513862` ou apenas digits sem o `+`. O problema real é que o número pode conter caracteres de formatação que quebram a URL.

## Solução

### 1. Renomear label (ProposalDetails.tsx, linha 627)
- Alterar `"WhatsApp"` para `"WhatsApp para Aprovação"`

### 2. Formatar número automaticamente no input (ProposalDetails.tsx)
- Aplicar máscara brasileira no `onChange`: ao digitar, formatar como `(XX) XXXXX-XXXX`
- Ao salvar, limpar para apenas dígitos

### 3. Corrigir URL do WhatsApp (ProposalDownloadButton.tsx)
- Sanitizar o número removendo tudo que não é dígito antes de montar a URL `wa.me`
- Garantir que o formato final seja apenas números (ex: `5511951513862`)

## Arquivos alterados
- `src/pages/ProposalDetails.tsx` -- label + máscara de formatação no input
- `src/features/proposals/components/public/ProposalDownloadButton.tsx` -- sanitizar número na URL

