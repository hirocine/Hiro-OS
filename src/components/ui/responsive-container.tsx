import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'auto';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'auto';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full'
};

export function ResponsiveContainer({ 
  children, 
  className,
  maxWidth = 'full',
  padding = 'auto',
  spacing = 'auto'
}: ResponsiveContainerProps) {
  const { breakpoint } = useResponsiveLayout();

  const getPadding = () => {
    if (padding === 'auto') {
      switch (breakpoint) {
        case 'mobile':
          return 'px-8 py-4';
        case 'tablet':
          return 'px-8 py-6';
        default:
          return 'px-10 lg:px-12 py-6 lg:py-8';
      }
    }
    
    const paddingClasses = {
      none: '',
      sm: 'p-2 lg:p-4',
      md: 'p-4 lg:p-6', 
      lg: 'p-6 lg:p-8'
    };
    return paddingClasses[padding];
  };

  const getSpacing = () => {
    if (spacing === 'auto') {
      switch (breakpoint) {
        case 'mobile':
          return 'space-y-4';
        case 'tablet':
          return 'space-y-5';
        default:
          return 'space-y-6';
      }
    }
    
    const spacingClasses = {
      none: '',
      sm: 'space-y-3',
      md: 'space-y-4 md:space-y-6', 
      lg: 'space-y-6 md:space-y-8'
    };
    return spacingClasses[spacing];
  };

  return (
    <div className={cn(
      'container mx-auto mobile-safe',
      maxWidthClasses[maxWidth],
      getPadding(),
      getSpacing(),
      'min-w-0 max-w-full overflow-x-hidden animate-fade-in',
      className
    )}>
      {children}
    </div>
  );
}