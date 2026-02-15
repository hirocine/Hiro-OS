

## Remover tooltip do avatar no rodapé da sidebar

Agora que o primeiro nome já aparece ao lado do avatar, o tooltip com o nome completo é redundante e atrapalha visualmente.

### Alteração em `src/components/Layout/SidebarUserProfile.tsx`

Remover o wrapper `Tooltip` / `TooltipTrigger` / `TooltipContent` ao redor do botão do avatar, mantendo apenas o `DropdownMenu` funcionando normalmente.

O botão trigger do dropdown continua igual, apenas sem o tooltip envolvendo.

