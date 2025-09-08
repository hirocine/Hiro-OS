import { useState, useEffect, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export type BreakpointSize = 'mobile' | 'tablet' | 'desktop' | 'wide';
export type ViewMode = 'table' | 'grid' | 'cards';

const TABLET_BREAKPOINT = 1024;
const WIDE_BREAKPOINT = 1440;

export function useResponsiveLayout() {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const breakpoint: BreakpointSize = useMemo(() => {
    // Considera tanto isMobile (que verifica user agent) quanto dimensões da tela
    const isSmallScreen = windowWidth < 768; // Mobile breakpoint
    if (isMobile || isSmallScreen) return 'mobile';
    if (windowWidth < TABLET_BREAKPOINT) return 'tablet';
    if (windowWidth < WIDE_BREAKPOINT) return 'desktop';
    return 'wide';
  }, [isMobile, windowWidth]);

  const getOptimalViewMode = (preferredMode: ViewMode): ViewMode => {
    switch (breakpoint) {
      case 'mobile':
        return 'cards';
      case 'tablet':
        return preferredMode === 'table' ? 'grid' : preferredMode;
      default:
        return preferredMode;
    }
  };

  const getGridColumns = (totalItems: number) => {
    switch (breakpoint) {
      case 'mobile':
        return { base: 1, max: 1 };
      case 'tablet':
        return { base: 2, max: 2 };
      case 'desktop':
        return { base: 3, max: 4 };
      case 'wide':
        return { base: 4, max: 6 };
      default:
        return { base: 1, max: 4 };
    }
  };

  const getContainerPadding = () => {
    switch (breakpoint) {
      case 'mobile':
        return 'p-4';
      case 'tablet':
        return 'p-6';
      default:
        return 'p-6 lg:p-8';
    }
  };

  const getTextSize = (size: 'xs' | 'sm' | 'base' | 'lg' | 'xl') => {
    const sizes = {
      xs: isMobile ? 'text-xs' : 'text-xs',
      sm: isMobile ? 'text-xs' : 'text-sm',  
      base: isMobile ? 'text-sm' : 'text-base',
      lg: isMobile ? 'text-base' : 'text-lg',
      xl: isMobile ? 'text-lg' : 'text-xl'
    };
    return sizes[size];
  };

  return {
    breakpoint,
    isMobile,
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isWide: breakpoint === 'wide',
    windowWidth,
    getOptimalViewMode,
    getGridColumns,
    getContainerPadding,
    getTextSize
  };
}