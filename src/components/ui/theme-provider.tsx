import * as React from "react"
import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react"
import { logger } from "@/lib/logger"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [themeState, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    
    root.classList.remove("light", "dark")

    if (themeState === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      root.setAttribute("data-theme", systemTheme)
      root.style.colorScheme = systemTheme
      
      logger.debug("Theme applied (system)", { 
        module: 'theme',
        data: { theme: themeState, resolved: systemTheme, classList: root.classList.toString() }
      })
      return
    }

    root.classList.add(themeState)
    root.setAttribute("data-theme", themeState)
    root.style.colorScheme = themeState
    
    logger.debug("Theme applied", { 
      module: 'theme',
      data: { theme: themeState, classList: root.classList.toString() }
    })
  }, [themeState])

  const value = useMemo(() => ({
    theme: themeState,
    setTheme: (theme: Theme) => {
      logger.debug("setTheme called", { 
        module: 'theme',
        data: { currentTheme: themeState, newTheme: theme }
      })
      localStorage.setItem(storageKey, theme)
      setThemeState(theme)
    },
  }), [themeState, storageKey])

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}