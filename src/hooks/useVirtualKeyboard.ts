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
    // Detecta se o navegador suporta Visual Viewport API
    const supportsVisualViewport = 'visualViewport' in window;
    
    const updateKeyboardState = () => {
      const currentHeight = window.innerHeight;
      const visualHeight = supportsVisualViewport 
        ? window.visualViewport?.height ?? currentHeight
        : currentHeight;
      
      const keyboardHeight = Math.max(0, currentHeight - visualHeight);
      const isKeyboardVisible = keyboardHeight > 0;

      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: keyboardHeight,
        visualViewportHeight: visualHeight
      });
    };

    // Event listeners
    if (supportsVisualViewport && window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateKeyboardState);
    } else {
      // Fallback para navegadores sem Visual Viewport API
      window.addEventListener('resize', updateKeyboardState);
    }

    // Detecta foco em inputs para iOS
    const handleFocusIn = () => {
      // Pequeno delay para aguardar o teclado aparecer
      setTimeout(updateKeyboardState, 300);
    };

    const handleFocusOut = () => {
      setTimeout(updateKeyboardState, 300);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // Cleanup
    return () => {
      if (supportsVisualViewport && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateKeyboardState);
      } else {
        window.removeEventListener('resize', updateKeyboardState);
      }
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
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