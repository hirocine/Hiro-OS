import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@/components/ui/theme-provider'
import App from './App.tsx'
import './index.css'
import { AdvancedPWAFeatures } from '@/components/PWA/AdvancedPWAFeatures'

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <AdvancedPWAFeatures />
    <App />
  </ThemeProvider>
)
