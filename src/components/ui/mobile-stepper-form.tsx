import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MobileStepperFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  steps: {
    title: string;
    content: React.ReactNode;
  }[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitText?: string;
}

/**
 * Formulário com navegação step-by-step otimizada para mobile
 */
export const MobileStepperForm = React.forwardRef<
  HTMLFormElement,
  MobileStepperFormProps
>(({ 
  steps, 
  currentStep, 
  onStepChange, 
  onSubmit,
  isSubmitting = false,
  submitText = "Salvar",
  className, 
  ...props 
}, ref) => {
  const isMobile = useIsMobile();
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (!isLastStep) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLastStep) {
      onSubmit(e);
    } else {
      handleNext();
    }
  };

  // No desktop, mostra formulário normal (sem steps)
  if (!isMobile) {
    return (
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index}>
            <h3 className="font-medium text-base mb-4">{step.title}</h3>
            {step.content}
          </div>
        ))}
      </div>
    );
  }

  // No mobile, usa navegação step-by-step
  return (
    <div className="space-y-4">
      {/* Header com progresso */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">
            Etapa {currentStep + 1} de {steps.length}
          </h3>
          <span className="text-xs text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <h4 className="font-semibold text-base">
          {steps[currentStep]?.title}
        </h4>
      </div>

      {/* Conteúdo do step atual */}
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn("space-y-4", className)}
        {...props}
      >
        <div className="min-h-[300px]">
          {steps[currentStep]?.content}
        </div>

        {/* Botões de navegação */}
        <div className="flex gap-3 pt-4 border-t">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              className="flex items-center gap-2 h-12"
              disabled={isSubmitting}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
          )}
          
          <Button
            type="submit"
            className={cn(
              "flex items-center gap-2 h-12",
              isFirstStep ? "w-full" : "flex-1"
            )}
            disabled={isSubmitting}
          >
            {isLastStep ? (
              <>
                {isSubmitting ? "Salvando..." : submitText}
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
});

MobileStepperForm.displayName = "MobileStepperForm";