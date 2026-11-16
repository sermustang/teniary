import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { IconChevronLeft } from './Icons'

/** Top bar for inner screens: left action, centered title, right action. */
export function AppBar({ left, title, right }: { left?: ReactNode; title?: ReactNode; right?: ReactNode }) {
  return (
    <header className="appbar">
      <div className="appbar-side">{left}</div>
      {title ? <h1 className="appbar-title">{title}</h1> : <span />}
      <div className="appbar-side appbar-side-end">{right}</div>
    </header>
  )
}

/**
 * Goes back in history when there is somewhere to go back to (so the iOS
 * swipe-back gesture and the button agree); otherwise replaces with `fallback`.
 */
export function useGoBack(fallback = '/') {
  const navigate = useNavigate()
  const location = useLocation()
  return () => {
    if (location.key !== 'default') navigate(-1)
    else navigate(fallback, { replace: true })
  }
}

export function BackButton({ label = 'Partidos', fallback = '/' }: { label?: string; fallback?: string }) {
  const goBack = useGoBack(fallback)
  return (
    <button type="button" className="appbar-link appbar-back" onClick={goBack}>
      <IconChevronLeft size={24} />
      {label}
    </button>
  )
}
