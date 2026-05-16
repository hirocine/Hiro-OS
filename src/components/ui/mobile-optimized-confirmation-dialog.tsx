import * as React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileOptimizedConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  icon?: "warning" | "delete";
}

export function MobileOptimizedConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  icon = "warning",
}: MobileOptimizedConfirmationDialogProps) {
  const isMobile = useIsMobile();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const IconComponent = icon === "delete" ? Trash2 : AlertTriangle;
  const iconColor = variant === "destructive" ? "text-destructive" : "text-warning";

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className={`ds-shell ${isMobile ? "mx-4" : ""}`}>
        <ResponsiveDialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <IconComponent className={`h-6 w-6 ${iconColor}`} />
          </div>
          <ResponsiveDialogTitle className={`text-center ${isMobile ? 'text-lg' : 'text-xl'}`}>
            {title}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className={`text-center ${isMobile ? 'text-sm' : 'text-base'}`}>
            {description}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogFooter className={isMobile ? "flex-col-reverse gap-3" : "gap-2"}>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={isMobile ? "w-full h-12" : ""}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            className={isMobile ? "w-full h-12" : ""}
          >
            {confirmText}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}