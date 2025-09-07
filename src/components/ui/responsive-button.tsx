import { ReactNode } from 'react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { LucideIcon } from 'lucide-react';

interface ResponsiveButtonProps extends ButtonProps {
  children?: ReactNode;
  icon?: LucideIcon;
  iconOnly?: boolean;
  mobileText?: string;
  tabletText?: string;
  desktopText?: string;
}

export function ResponsiveButton({ 
  children, 
  icon: Icon,
  iconOnly = false,
  mobileText,
  tabletText, 
  desktopText,
  className,
  size = 'default',
  ...props 
}: ResponsiveButtonProps) {
  const { breakpoint, isMobile } = useResponsiveLayout();

  const getButtonText = () => {
    const fallbackText = mobileText || tabletText || desktopText || 'Button';
    
    switch (breakpoint) {
      case 'mobile':
        return mobileText || children || fallbackText;
      case 'tablet':
        return tabletText || mobileText || children || fallbackText;
      default:
        return desktopText || children || fallbackText;
    }
  };

  const getButtonSize = () => {
    if (isMobile && size === 'default') {
      return 'sm';
    }
    return size;
  };

  const shouldShowIconOnly = () => {
    return iconOnly && isMobile && Icon;
  };

  return (
    <Button 
      size={getButtonSize()}
      className={cn(
        // Ensure minimum touch target on mobile
        isMobile && "min-h-[44px] min-w-[44px]",
        // Better text scaling
        isMobile && "text-sm px-3",
        className
      )}
      {...props}
    >
      {Icon && (
        <Icon className={cn(
          "h-4 w-4",
          !shouldShowIconOnly() && (isMobile ? "mr-1" : "mr-2")
        )} />
      )}
      {!shouldShowIconOnly() && (
        <span className={isMobile ? "text-xs" : undefined}>
          {getButtonText()}
        </span>
      )}
    </Button>
  );
}