import { setThemePref, useTheme } from '../theme'
import { IconMoon, IconSun } from './Icons'

/** Switches between light and dark; Ajustes → Apariencia goes back to "Automático". */
export function ThemeToggle() {
  const { theme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className="round-btn"
      aria-label={next === 'dark' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      onClick={() => setThemePref(next)}
    >
      {next === 'dark' ? <IconMoon size={22} /> : <IconSun size={22} />}
    </button>
  )
}
