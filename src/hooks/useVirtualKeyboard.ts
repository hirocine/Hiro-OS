import { useState, useEffect } from 'react';

interface VirtualKeyboardState {
  isVisible: boolean;
  height: number;
  visualViewportHeight: number;
}

/**
 * Hook para detectar teclado virtual no iOS e outros dispositivos móveis
 */
export function useVirtualKeyboard() {
  const [keyboardState, setKeyboardState] = useState<VirtualKeyboardState>({
    isVisible: false,
    height: 0,
    visualViewportHeight: window.innerHeight
  });

  useEffect(() => {
    const supportsVisualViewport = 'visualViewport' in window;
    let debounceTimeout: NodeJS.Timeout;
    
    const updateKeyboardState = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const currentHeight = window.innerHeight;
        const visualHeight = supportsVisualViewport 
          ? window.visualViewport?.height ?? currentHeight
          : currentHeight;
        
        const keyboardHeight = Math.max(0, currentHeight - visualHeight);
        const isKeyboardVisible = keyboardHeight > 50; // Threshold para evitar falsos positivos

        setKeyboardState({
          isVisible: isKeyboardVisible,
          height: keyboardHeight,
          visualViewportHeight: visualHeight
        });
      }, 100); // Debounce de 100ms
    };

    // Event listeners principais
    if (supportsVisualViewport && window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateKeyboardState);
    } else {
      window.addEventListener('resize', updateKeyboardState);
    }

    // Detecta foco em inputs
    const handleFocusIn = () => {
      setTimeout(updateKeyboardState, 150);
    };

    const handleFocusOut = () => {
      // Delay maior para focusout para garantir que o teclado realmente fechou
      setTimeout(() => {
        if (!document.activeElement || 
            (document.activeElement.tagName !== 'INPUT' && 
             document.activeElement.tagName !== 'TEXTAREA')) {
          updateKeyboardState();
        }
      }, 150);
    };

    // Reset forçado para iOS
    const handleOrientationChange = () => {
      setTimeout(updateKeyboardState, 500);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Cleanup
    return () => {
      clearTimeout(debounceTimeout);
      if (supportsVisualViewport && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateKeyboardState);
      } else {
        window.removeEventListener('resize', updateKeyboardState);
      }
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Função para scroll automático ao campo focado
  const scrollToField = (element: HTMLElement) => {
    if (!keyboardState.isVisible) return;

    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = keyboardState.visualViewportHeight;
      const scrollOffset = 20; // Margem adicional

      // Verifica se o campo está sendo coberto pelo teclado
      if (rect.bottom > viewportHeight - scrollOffset) {
        const scrollTop = window.scrollY + rect.bottom - viewportHeight + scrollOffset;
        
        window.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  return {
    ...keyboardState,
    scrollToField,
    // Altura disponível considerando o teclado
    availableHeight: keyboardState.visualViewportHeight,
    // CSS custom property para usar em estilos
    cssVarHeight: `${keyboardState.visualViewportHeight}px`
  };
}