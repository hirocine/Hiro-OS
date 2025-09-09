import { useState, useEffect } from 'react';

/**
 * Hook para detectar se o app está rodando em modo PWA
 */
export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInWebAppChrome = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      setIsPWA(isStandalone || isInWebAppiOS || isInWebAppChrome);
    };

    checkPWA();
    
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWA);
    
    return () => mediaQuery.removeEventListener('change', checkPWA);
  }, []);

  return isPWA;
}