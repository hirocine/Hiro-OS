import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        info:
          "border-transparent bg-blue-500 text-white hover:bg-blue-600",
        neutral:
          "border-transparent bg-gray-600 text-white hover:bg-gray-700",
        "step-pending":
          "border-transparent bg-step-pending text-step-pending-foreground hover:bg-step-pending/80",
        "step-pickup":
          "border-transparent bg-step-pickup text-step-pickup-foreground hover:bg-step-pickup/80",
        "step-separated":
          "border-transparent bg-step-separated text-step-separated-foreground hover:bg-step-separated/80",
        "step-in-use":
          "border-transparent bg-step-in-use text-step-in-use-foreground hover:bg-step-in-use/80",
        "step-verification":
          "border-transparent bg-step-verification text-step-verification-foreground hover:bg-step-verification/80",
        "step-office-receipt":
          "border-transparent bg-step-office-receipt text-step-office-receipt-foreground hover:bg-step-office-receipt/80",
        "step-verified":
          "border-transparent bg-step-verified text-step-verified-foreground hover:bg-step-verified/80",
        "status-active":
          "border-transparent bg-status-active text-status-active-foreground hover:bg-status-active/80",
        "status-completed":
          "border-transparent bg-status-completed text-status-completed-foreground hover:bg-status-completed/80",
        "status-archived":
          "border-transparent bg-status-archived text-status-archived-foreground hover:bg-status-archived/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
