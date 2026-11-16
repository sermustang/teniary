import type { Note, Surface } from './note'
import { monthTitle } from './format'

export interface Filters {
  /** Searched in the tournament name. */
  query: string
  /** YYYY-MM-DD, inclusive; '' = no limit. */
  from: string
  /** YYYY-MM-DD, inclusive; '' = no limit. */
  to: string
  surface: Surface | ''
}

export const EMPTY_FILTERS: Filters = { query: '', from: '', to: '', surface: '' }

/** Lowercases and strips accents, so "alcala" matches "Alcalá". */
export function normalizeText(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

export function filterNotes(notes: Note[], f: Filters): Note[] {
  const q = normalizeText(f.query)
  return notes.filter((n) => {
    if (q && !normalizeText(n.tournament).includes(q)) return false
    if (f.from && n.date < f.from) return false
    if (f.to && n.date > f.to) return false
    if (f.surface && n.surface !== f.surface) return false
    return true
  })
}

/** Newest match first; for the same day, the most recently created first. */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) =>
    a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1,
  )
}

/** Number of active filters in the panel (the search box is not counted). */
export function activeFilterCount(f: Filters): number {
  return [f.from, f.to, f.surface].filter(Boolean).length
}

export interface MonthGroup {
  key: string
  title: string
  notes: Note[]
}

/** Groups already-sorted notes by month, keeping their order. */
export function groupByMonth(sorted: Note[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  for (const n of sorted) {
    const key = n.date.slice(0, 7)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.notes.push(n)
    else groups.push({ key, title: monthTitle(n.date), notes: [n] })
  }
  return groups
}

/** Unique non-empty values of a text field, most frequent first; for autocomplete. */
export function suggestions(notes: Note[], field: 'tournament' | 'opponent' | 'round'): string[] {
  const counts = new Map<string, { value: string; count: number }>()
  for (const n of notes) {
    const value = n[field].trim()
    if (!value) continue
    const key = normalizeText(value)
    const entry = counts.get(key)
    if (entry) entry.count++
    else counts.set(key, { value, count: 1 })
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'es'))
    .map((e) => e.value)
}
