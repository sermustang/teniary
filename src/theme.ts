import { useSyncExternalStore } from 'react'

/** 'auto' follows the iPhone's light/dark setting. */
export type ThemePref = 'auto' | 'light' | 'dark'
export type Theme = 'light' | 'dark'

/** Also read by the inline script in index.html: keep both in sync. */
const STORAGE_KEY = 'teniary-theme'
/** Same values as --bg in styles.css. */
const THEME_COLORS: Record<Theme, string> = { light: '#f3f4ef', dark: '#0f100d' }

export function parseThemePref(value: unknown): ThemePref {
  return value === 'light' || value === 'dark' ? value : 'auto'
}

export function resolveTheme(pref: ThemePref, systemDark: boolean): Theme {
  if (pref !== 'auto') return pref
  return systemDark ? 'dark' : 'light'
}

const listeners = new Set<() => void>()
let pref: ThemePref = readStoredPref()
let systemQuery: MediaQueryList | null = null

function readStoredPref(): ThemePref {
  try {
    return parseThemePref(globalThis.localStorage?.getItem(STORAGE_KEY))
  } catch {
    return 'auto'
  }
}

function currentTheme(): Theme {
  return resolveTheme(pref, systemQuery?.matches ?? false)
}

/** Puts the theme on <html data-theme> and tints the status bar to match. */
function applyTheme() {
  const theme = currentTheme()
  document.documentElement.dataset.theme = theme
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute('content', THEME_COLORS[theme])
  }
}

function emit() {
  applyTheme()
  for (const listener of listeners) listener()
}

/** Called once at startup; follows changes of the system setting. */
export function initTheme() {
  systemQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemQuery.addEventListener('change', emit)
  applyTheme()
}

export function setThemePref(next: ThemePref) {
  pref = next
  try {
    if (next === 'auto') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Storage unavailable: the choice still applies until the app is closed.
  }
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useTheme() {
  const currentPref = useSyncExternalStore(subscribe, () => pref)
  const theme = useSyncExternalStore(subscribe, currentTheme)
  return { pref: currentPref, theme }
}
