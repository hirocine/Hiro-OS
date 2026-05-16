import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        // DS look: hairline border, squared corners, no shadow, text aligned
        // left, HN font via inherit. Sonner's default rounded+shadow theme
        // doesn't match the rest of the app.
        unstyled: false,
        classNames: {
          toast: [
            "group toast",
            "!rounded-none",
            "!border !border-[hsl(var(--ds-line-1))]",
            "!bg-[hsl(var(--ds-surface))]",
            "!text-[hsl(var(--ds-text))]",
            "!shadow-none",
            "!text-left",
            "!font-sans",
          ].join(" "),
          title: "!text-left !font-medium",
          description: "!text-left !text-[hsl(var(--ds-fg-3))]",
          actionButton:
            "!bg-[hsl(var(--ds-text))] !text-[hsl(var(--ds-surface))] !rounded-none",
          cancelButton:
            "!bg-transparent !text-[hsl(var(--ds-fg-3))] !rounded-none",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
