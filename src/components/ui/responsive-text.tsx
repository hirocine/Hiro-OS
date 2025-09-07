import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface ResponsiveTextProps {
  children: ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  className?: string;
  mobileText?: ReactNode;
  tabletText?: ReactNode;
  desktopText?: ReactNode;
}

export function ResponsiveText({ 
  children, 
  size = 'base',
  className,
  mobileText,
  tabletText,
  desktopText
}: ResponsiveTextProps) {
  const { breakpoint, getTextSize } = useResponsiveLayout();

  const getContent = () => {
    switch (breakpoint) {
      case 'mobile':
        return mobileText || children;
      case 'tablet':
        return tabletText || mobileText || children;
      default:
        return desktopText || children;
    }
  };

  return (
    <span className={cn(getTextSize(size), className)}>
      {getContent()}
    </span>
  );
}

interface ResponsiveHideProps {
  children: ReactNode;
  hideOn?: ('mobile' | 'tablet' | 'desktop' | 'wide')[];
  showOn?: ('mobile' | 'tablet' | 'desktop' | 'wide')[];
  className?: string;
}

export function ResponsiveHide({ 
  children, 
  hideOn = [],
  showOn = [],
  className 
}: ResponsiveHideProps) {
  const { breakpoint } = useResponsiveLayout();

  // If showOn is specified, only show on those breakpoints
  if (showOn.length > 0) {
    if (!showOn.includes(breakpoint)) {
      return null;
    }
  }

  // If hideOn is specified, hide on those breakpoints
  if (hideOn.length > 0) {
    if (hideOn.includes(breakpoint)) {
      return null;
    }
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}