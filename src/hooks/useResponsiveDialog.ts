import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Hook que determina se deve usar Dialog ou Drawer baseado no tamanho da tela
 */
export function useResponsiveDialog() {
  const isMobile = useIsMobile();
  
  return {
    isMobile,
    // No mobile, prefere Drawer para melhor UX
    shouldUseDrawer: isMobile,
    // No desktop, prefere Dialog
    shouldUseDialog: !isMobile,
  };
}