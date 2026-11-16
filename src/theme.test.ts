import { describe, expect, it } from 'vitest'
import { parseThemePref, resolveTheme } from './theme'

describe('theme', () => {
  it('reads only known stored values, anything else means automatic', () => {
    expect(parseThemePref('light')).toBe('light')
    expect(parseThemePref('dark')).toBe('dark')
    expect(parseThemePref(null)).toBe('auto')
    expect(parseThemePref('sepia')).toBe('auto')
  })

  it('automatic follows the system, a choice overrides it', () => {
    expect(resolveTheme('auto', true)).toBe('dark')
    expect(resolveTheme('auto', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})
