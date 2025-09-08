import { useState, useEffect } from 'react';

interface PWAEnvironment {
  isPWA: boolean;
  isIOSPWA: boolean;
  isStandalone: boolean;
  hasNotch: boolean;
  statusBarHeight: number;
  safeAreaTop: number;
}

/**
 * Hook para detectar ambiente PWA e características específicas
 */
export function usePWADetection(): PWAEnvironment {
  const [pwaEnv, setPWAEnv] = useState<PWAEnvironment>({
    isPWA: false,
    isIOSPWA: false,
    isStandalone: false,
    hasNotch: false,
    statusBarHeight: 0,
    safeAreaTop: 0,
  });

  useEffect(() => {
    const detectPWAEnvironment = () => {
      // Detecta se está em modo standalone (PWA instalado)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');

      // Detecta iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      // Detecta se é PWA no iOS
      const isIOSPWA = isIOS && isStandalone;
      
      // Detecta se é qualquer PWA
      const isPWA = isStandalone;

      // Calcula safe area top usando CSS custom property
      let safeAreaTop = 0;
      let statusBarHeight = 0;
      
      if (typeof document !== 'undefined') {
        // Cria elemento temporário para medir safe-area-inset-top
        const testEl = document.createElement('div');
        testEl.style.position = 'fixed';
        testEl.style.top = 'env(safe-area-inset-top, 0px)';
        testEl.style.left = '0';
        testEl.style.width = '1px';
        testEl.style.height = '1px';
        testEl.style.pointerEvents = 'none';
        testEl.style.visibility = 'hidden';
        document.body.appendChild(testEl);
        
        const computedTop = getComputedStyle(testEl).top;
        safeAreaTop = parseInt(computedTop) || 0;
        
        document.body.removeChild(testEl);

        // No iOS PWA, considera a status bar
        if (isIOSPWA) {
          statusBarHeight = Math.max(safeAreaTop, 20); // Mínimo 20px para status bar
        }
      }

      // Detecta se tem notch baseado na safe area
      const hasNotch = safeAreaTop > 24;

      setPWAEnv({
        isPWA,
        isIOSPWA,
        isStandalone,
        hasNotch,
        statusBarHeight,
        safeAreaTop,
      });
    };

    detectPWAEnvironment();

    // Re-detecta em mudanças de orientação
    const handleOrientationChange = () => {
      setTimeout(detectPWAEnvironment, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return pwaEnv;
}