import { useResponsiveLayout } from './useResponsiveLayout';

export type PageLayoutType = 'default' | 'dashboard' | 'form' | 'table';

export function usePageLayout(type: PageLayoutType = 'default') {
  const { breakpoint, isMobile, getContainerPadding } = useResponsiveLayout();

  const getPagePadding = () => {
    switch (breakpoint) {
      case 'mobile':
        return 'p-4';
      case 'tablet':
        return 'p-6';
      default:
        return 'p-6 lg:p-8';
    }
  };

  const getContentSpacing = () => {
    switch (breakpoint) {
      case 'mobile':
        return 'space-y-4';
      case 'tablet':
        return 'space-y-5';
      default:
        return 'space-y-6';
    }
  };

  const getGridGap = () => {
    switch (breakpoint) {
      case 'mobile':
        return 'gap-4';
      case 'tablet':
        return 'gap-5';
      default:
        return 'gap-6';
    }
  };

  const getSectionSpacing = () => {
    switch (breakpoint) {
      case 'mobile':
        return 'space-y-6';
      case 'tablet':
        return 'space-y-7';
      default:
        return 'space-y-8';
    }
  };

  const getMaxWidth = () => {
    switch (type) {
      case 'form':
        return 'max-w-4xl';
      case 'dashboard':
        return 'max-w-7xl';
      case 'table':
        return 'max-w-full';
      default:
        return 'max-w-6xl';
    }
  };

  return {
    breakpoint,
    isMobile,
    classes: {
      page: `container mx-auto mobile-safe ${getPagePadding()} ${getContentSpacing()} animate-fade-in ${getMaxWidth()}`,
      content: getContentSpacing(),
      section: getSectionSpacing(),
      grid: getGridGap(),
      container: getContainerPadding()
    }
  };
}