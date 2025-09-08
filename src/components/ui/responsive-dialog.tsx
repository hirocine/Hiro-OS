import * as React from "react";
import { useResponsiveDialog } from "@/hooks/useResponsiveDialog";
import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard";
import { useAutoScrollOnFocus } from "@/hooks/useAutoScrollOnFocus";
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
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  useAutoScrollOnFocus(contentRef);

  // Detectar se está em PWA mode
  const isPWA = React.useMemo(() => {
    return window.matchMedia('(display-mode: standalone)').matches;
  }, []);

  if (shouldUseDrawer) {
    let adjustedHeight: string;
    let drawerStyle: React.CSSProperties = {};

    if (isKeyboardVisible) {
      adjustedHeight = `${Math.max(visualViewportHeight * 0.8, 300)}px`;
      drawerStyle = { height: adjustedHeight, maxHeight: adjustedHeight };
    } else if (isPWA) {
      // No PWA, ajustar para não vazar na status bar
      adjustedHeight = 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))';
      drawerStyle = { 
        maxHeight: adjustedHeight,
        marginTop: 'env(safe-area-inset-top, 0px)'
      };
    } else {
      adjustedHeight = 'max(85vh, 400px)';
    }
      
    return (
      <DrawerContent 
        ref={contentRef}
        className={cn(!isPWA && "max-h-[85vh]", className)}
        style={drawerStyle}
      >
        {children}
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