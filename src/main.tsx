import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Kiosk hardening: no pinch-zoom, context menu or rubber-banding outside scrollable screens.
const stop = (e: Event) => e.preventDefault()
;['gesturestart', 'gesturechange', 'gestureend', 'contextmenu'].forEach((t) => document.addEventListener(t, stop))
document.addEventListener(
  'touchmove',
  (e) => {
    const t = e.target as HTMLElement | null
    if (e.touches.length > 1 || !t?.closest('.modal-wrap, .summary, .attract')) e.preventDefault()
  },
  { passive: false },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined)
  })
}
