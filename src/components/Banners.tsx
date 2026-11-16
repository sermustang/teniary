import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { IconShare, IconX } from './Icons'

/**
 * Registers the service worker (offline support) and shows a banner when a new
 * version has been downloaded. The update is applied only when the user taps
 * "Actualizar", so a half-filled form is never lost to an automatic reload.
 */
export function UpdateBanner({ hidden }: { hidden: boolean }) {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      // Check for a new version whenever the app comes back to the foreground.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          registration.update().catch(() => {})
        }
      })
    },
  })

  if (!needRefresh || hidden) return null
  return (
    <div className="update-banner" role="status">
      <span>Hay una nueva versión de Teniary.</span>
      <button type="button" className="btn btn-small btn-primary" onClick={() => updateServiceWorker()}>
        Actualizar
      </button>
      <button type="button" className="icon-btn" aria-label="Más tarde" onClick={() => setNeedRefresh(false)}>
        <IconX size={18} />
      </button>
    </div>
  )
}

const DISMISS_KEY = 'teniary.installHintDismissed'

function isIOS(): boolean {
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

/**
 * On iPhone in Safari (not opened from the Home Screen), explains how to
 * install the app. Notes are only kept safely in the Home Screen app.
 */
export function InstallHint() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      // Storage may be unavailable; just show the hint.
    }
    setVisible(isIOS() && !isStandalone() && !dismissed)
  }, [])

  if (!visible) return null
  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Ignore: the hint simply comes back next time.
    }
    setVisible(false)
  }
  return (
    <aside className="install-hint" aria-label="Instalar Teniary">
      <span className="install-hint-icon">
        <IconShare size={18} />
      </span>
      <span className="install-hint-text">
        <strong>Instala Teniary</strong>
        <span>
          Toca Compartir y luego «Añadir a pantalla de inicio». Usa siempre el icono: así tus notas quedan
          guardadas.
        </span>
      </span>
      <button type="button" className="icon-btn" aria-label="Cerrar aviso" onClick={dismiss}>
        <IconX size={18} />
      </button>
    </aside>
  )
}
