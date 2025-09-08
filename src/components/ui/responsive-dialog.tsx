import * as React from "react";
import { useResponsiveDialog } from "@/hooks/useResponsiveDialog";
import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard";
import { useAutoScrollOnFocus } from "@/hooks/useAutoScrollOnFocus";
import { usePWADetection } from "@/hooks/usePWADetection";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface ResponsiveDialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

// Root component
export function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const { shouldUseDrawer } = useResponsiveDialog();

  if (shouldUseDrawer) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

// Content component
export function ResponsiveDialogContent({ className, children }: ResponsiveDialogContentProps) {
  const { shouldUseDrawer } = useResponsiveDialog();
  const { visualViewportHeight, isVisible: isKeyboardVisible } = useVirtualKeyboard();
  const { isPWA, isIOSPWA, statusBarHeight, safeAreaTop } = usePWADetection();
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  useAutoScrollOnFocus(contentRef);

  if (shouldUseDrawer) {
    // Constantes base para cálculo de altura
    const BASE_APP_HEADER_HEIGHT = 64;
    const DRAWER_HANDLE_HEIGHT = 24;
    const SAFE_MARGINS = 16;
    
    // Ajusta altura do header baseado no ambiente PWA
    const APP_HEADER_HEIGHT = isPWA 
      ? BASE_APP_HEADER_HEIGHT + safeAreaTop // Adiciona safe area no PWA
      : BASE_APP_HEADER_HEIGHT;
    
    const TOTAL_OFFSET = APP_HEADER_HEIGHT + DRAWER_HANDLE_HEIGHT + SAFE_MARGINS;
    
    // Calcula altura disponível específica para PWA vs Web
    let availableHeight: number;
    let keyboardAdjustedHeight: number;
    
    if (isPWA) {
      // No PWA, usa screen.availHeight quando possível, senão window.innerHeight
      const screenHeight = window.screen?.availHeight || window.innerHeight;
      availableHeight = screenHeight - TOTAL_OFFSET;
      keyboardAdjustedHeight = visualViewportHeight - TOTAL_OFFSET;
    } else {
      // No navegador web, usa comportamento padrão
      availableHeight = window.innerHeight - TOTAL_OFFSET;
      keyboardAdjustedHeight = visualViewportHeight - TOTAL_OFFSET;
    }
    
    const dynamicHeight = isKeyboardVisible 
      ? `${Math.max(keyboardAdjustedHeight, 200)}px` // Min 200px
      : `${Math.max(availableHeight, 300)}px`; // Min 300px
    
    // Margem superior específica para PWA
    const marginTop = isPWA ? `${APP_HEADER_HEIGHT}px` : `${BASE_APP_HEADER_HEIGHT}px`;
      
    return (
      <DrawerContent 
        ref={contentRef}
        className={cn(
          "transition-all duration-200 ease-out",
          "focus:outline-none",
          // Classes específicas para PWA iOS
          isPWA && "pwa-drawer-content",
          isIOSPWA && "ios-pwa-drawer",
          className
        )}
        style={{
          height: dynamicHeight,
          maxHeight: dynamicHeight,
          marginTop: marginTop,
          // CSS variables para safe areas no PWA
          ...(isPWA && {
            '--safe-area-inset-top': `${safeAreaTop}px`,
            '--status-bar-height': `${statusBarHeight}px`,
          }),
        }}
      >
        <div className="mx-auto w-full max-w-[calc(100vw-1rem)] px-3 h-full flex flex-col">
          {/* Handle visual do drawer */}
          <div className="flex-shrink-0 h-6 flex items-center justify-center">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>
          
          {/* Conteúdo scrollável */}
          <div className="flex-1 min-h-0 overflow-y-auto pb-safe-bottom">
            {children}
          </div>
        </div>
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={cn("max-w-[96vw] max-h-[96vh] overflow-y-auto", className)}>
      {children}
    </DialogContent>
  );
}

// Header component
export function ResponsiveDialogHeader({ className, children }: ResponsiveDialogHeaderProps) {
  const { shouldUseDrawer } = useResponsiveDialog();

  if (shouldUseDrawer) {
    return (
      <DrawerHeader className={className}>
        {children}
      </DrawerHeader>
    );
  }

  return (
    <DialogHeader className={className}>
      {children}
    </DialogHeader>
  );
}

// Title component
export function ResponsiveDialogTitle({ className, children }: ResponsiveDialogTitleProps) {
  const { shouldUseDrawer } = useResponsiveDialog();

  if (shouldUseDrawer) {
    return (
      <DrawerTitle className={className}>
        {children}
      </DrawerTitle>
    );
  }

  return (
    <DialogTitle className={className}>
      {children}
    </DialogTitle>
  );
}

// Description component
export function ResponsiveDialogDescription({ className, children }: ResponsiveDialogDescriptionProps) {
  const { shouldUseDrawer } = useResponsiveDialog();

  if (shouldUseDrawer) {
    return (
      <DrawerDescription className={className}>
        {children}
      </DrawerDescription>
    );
  }

  return (
    <DialogDescription className={className}>
      {children}
    </DialogDescription>
  );
}

// Footer component
export function ResponsiveDialogFooter({ className, children }: ResponsiveDialogFooterProps) {
  const { shouldUseDrawer } = useResponsiveDialog();

  if (shouldUseDrawer) {
    return (
      <DrawerFooter className={className}>
        {children}
      </DrawerFooter>
    );
  }

  return (
    <DialogFooter className={className}>
      {children}
    </DialogFooter>
  );
}