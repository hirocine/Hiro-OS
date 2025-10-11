import { forwardRef } from "react"
import { Moon, Sun } from "lucide-react"
import { Button, ButtonProps } from "@/components/ui/button"
import { useTheme } from "@/components/ui/theme-provider"
import { cn } from "@/lib/utils"

interface ThemeSwitcherProps extends Omit<ButtonProps, 'onClick'> {}

export const ThemeSwitcher = forwardRef<HTMLButtonElement, ThemeSwitcherProps>(
  ({ className, ...props }, ref) => {
    const { theme, setTheme } = useTheme()

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="sm"
        onClick={() => {
          const currentTheme = theme === "system"
            ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
            : theme
          
          setTheme(currentTheme === "light" ? "dark" : "light")
        }}
        className={cn("relative text-foreground hover:bg-muted hover:text-foreground", className)}
        {...props}
      >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
})

ThemeSwitcher.displayName = "ThemeSwitcher"