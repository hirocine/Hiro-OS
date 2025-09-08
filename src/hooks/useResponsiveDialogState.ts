import { useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseResponsiveDialogStateOptions {
  onClose?: () => void;
  resetStateOnClose?: boolean;
}

/**
 * Hook para gerenciar estado de dialogs responsivos com funcionalidades comuns
 */
export function useResponsiveDialogState(options: UseResponsiveDialogStateOptions = {}) {
  const { onClose, resetStateOnClose = true } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  const openDialog = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    if (resetStateOnClose) {
      setIsLoading(false);
    }
    onClose?.();
  }, [onClose, resetStateOnClose]);

  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const executeWithLoading = useCallback(async (
    action: () => Promise<void> | void,
    autoCloseOnSuccess = true
  ) => {
    setIsLoading(true);
    try {
      await action();
      if (autoCloseOnSuccess) {
        closeDialog();
      }
    } catch (error) {
      // Error should be handled by the action itself
      console.error('Dialog action failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [closeDialog]);

  const getButtonProps = useCallback((variant: 'cancel' | 'confirm' = 'confirm') => {
    const baseProps = {
      disabled: isLoading,
      className: isMobile ? 'w-full h-12' : ''
    };

    if (variant === 'cancel') {
      return {
        ...baseProps,
        variant: 'outline' as const,
        onClick: closeDialog
      };
    }

    return {
      ...baseProps,
      variant: 'default' as const
    };
  }, [isLoading, isMobile, closeDialog]);

  return {
    // Estados
    isOpen,
    isLoading,
    isMobile,

    // Ações
    openDialog,
    closeDialog,
    setLoadingState,
    executeWithLoading,

    // Helpers
    getButtonProps,
    
    // Props para o dialog
    dialogProps: {
      open: isOpen,
      onOpenChange: setIsOpen
    }
  };
}