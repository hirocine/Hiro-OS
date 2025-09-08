import { useEffect } from 'react';
import { useVirtualKeyboard } from './useVirtualKeyboard';

/**
 * Hook que implementa scroll automático quando um input recebe foco
 */
export function useAutoScrollOnFocus(containerRef?: React.RefObject<HTMLElement>) {
  const { scrollToField, isVisible } = useVirtualKeyboard();

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
        
        scrollToField(target);
      }
    };

    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [scrollToField, containerRef]);

  return { isKeyboardVisible: isVisible };
}