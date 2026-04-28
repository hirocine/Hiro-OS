import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { queryClient } from '@/lib/queryClient'
import App from './App.tsx'
import './index.css'

const isInIframe = (() => {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
})()

const isPreviewHost =
  window.location.hostname.includes('id-preview--') ||
  window.location.hostname.includes('lovableproject.com')

const previewServiceWorkerReloadKey = 'hiro-preview-sw-cleaned'

const cleanupPreviewServiceWorkers = async () => {
  if ((!isInIframe && !isPreviewHost) || !('serviceWorker' in navigator)) return false

  const hadActiveController = Boolean(navigator.serviceWorker.controller)
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))

  if ('caches' in window) {
    const cacheKeys = await caches.keys()
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)))
  }

  return hadActiveController || registrations.length > 0
}

cleanupPreviewServiceWorkers().then((needsReload) => {
  if (needsReload && sessionStorage.getItem(previewServiceWorkerReloadKey) !== 'true') {
    sessionStorage.setItem(previewServiceWorkerReloadKey, 'true')
    window.location.reload()
    return
  }

  createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  )
})