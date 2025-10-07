import { useEffect, useRef } from 'react';
import { useVirtualKeyboard } from './useVirtualKeyboard';

/**
 * Hook aprimorado que implementa scroll automático quando um input recebe foco
 * Considera safe-areas, dialogs e drawers
 */
export function useAutoScrollOnFocus(containerRef?: React.RefObject<HTMLElement>) {
  const { scrollToField, isVisible } = useVirtualKeyboard();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      // Verifica se é um input, textarea ou elemento editável
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Se há um container específico, verifica se o elemento está dentro dele
        if (containerRef?.current) {
          if (!containerRef.current.contains(target)) {
            return;
          }
        }
        
        // Debounce para evitar scroll excessivo
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          scrollToField(target);
        }, 100);
      }
    };

    document.addEventListener('focusin', handleFocusIn);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [scrollToField, containerRef]);

  return { isKeyboardVisible: isVisible };
}