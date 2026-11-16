import { describe, expect, it } from 'vitest'
import { cleanDraft, withBlankRows } from './clean'
import { activeFilterCount, EMPTY_FILTERS, filterNotes, groupByMonth, normalizeText, sortNotes, suggestions } from './filter'
import { dayBlock, formatDateLong, formatDateShort, monthTitle } from './format'
import { emptyDraft, isValidDate, normalizeNote, todayISO, type Note } from './note'

function note(overrides: Partial<Note>): Note {
  return {
    ...emptyDraft('2026-01-01'),
    id: Math.random().toString(36).slice(2),
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('search and filters', () => {
  const notes = [
    note({ id: 'a', date: '2026-09-14', tournament: 'Torneo Social', surface: 'clay' }),
    note({ id: 'b', date: '2026-10-25', tournament: 'Liga Interclubes', surface: 'hard' }),
    note({ id: 'c', date: '2026-11-08', tournament: 'Open de Otoño — Alcalá', surface: 'clay' }),
  ]

  it('ignores accents and case when searching the tournament', () => {
    expect(normalizeText('  ÁlCalá ')).toBe('alcala')
    expect(filterNotes(notes, { ...EMPTY_FILTERS, query: 'alcala' }).map((n) => n.id)).toEqual(['c'])
    expect(filterNotes(notes, { ...EMPTY_FILTERS, query: 'OTONO' }).map((n) => n.id)).toEqual(['c'])
  })

  it('searches only the tournament field', () => {
    const withOpponent = [note({ id: 'x', tournament: 'Copa', opponent: 'Alcalá' })]
    expect(filterNotes(withOpponent, { ...EMPTY_FILTERS, query: 'alcala' })).toEqual([])
  })

  it('treats the date range as inclusive on both ends', () => {
    const ids = filterNotes(notes, { ...EMPTY_FILTERS, from: '2026-09-14', to: '2026-10-25' }).map((n) => n.id)
    expect(ids).toEqual(['a', 'b'])
    expect(filterNotes(notes, { ...EMPTY_FILTERS, from: '2026-11-09' })).toEqual([])
    expect(filterNotes(notes, { ...EMPTY_FILTERS, to: '2026-09-13' })).toEqual([])
  })

  it('filters by surface and combines with other filters', () => {
    expect(filterNotes(notes, { ...EMPTY_FILTERS, surface: 'clay' }).map((n) => n.id)).toEqual(['a', 'c'])
    expect(
      filterNotes(notes, { ...EMPTY_FILTERS, surface: 'clay', from: '2026-10-01' }).map((n) => n.id),
    ).toEqual(['c'])
  })

  it('counts active panel filters, not the search text', () => {
    expect(activeFilterCount({ query: 'x', from: '2026-01-01', to: '', surface: 'clay' })).toBe(2)
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0)
  })
})

describe('sorting and grouping', () => {
  it('sorts newest first, then by creation time', () => {
    const sorted = sortNotes([
      note({ id: 'old', date: '2026-01-02' }),
      note({ id: 'same-early', date: '2026-03-01', createdAt: '2026-03-01T08:00:00Z' }),
      note({ id: 'same-late', date: '2026-03-01', createdAt: '2026-03-01T20:00:00Z' }),
    ])
    expect(sorted.map((n) => n.id)).toEqual(['same-late', 'same-early', 'old'])
  })

  it('groups by month with Spanish titles', () => {
    const groups = groupByMonth(
      sortNotes([note({ date: '2026-11-08' }), note({ date: '2026-11-01' }), note({ date: '2026-10-25' })]),
    )
    expect(groups.map((g) => [g.title, g.notes.length])).toEqual([
      ['Noviembre 2026', 2],
      ['Octubre 2026', 1],
    ])
  })

  it('suggests previous values, most used first, without duplicates', () => {
    const list = suggestions(
      [note({ tournament: 'Liga' }), note({ tournament: 'Copa' }), note({ tournament: 'liga ' }), note({ tournament: '' })],
      'tournament',
    )
    expect(list).toEqual(['Liga', 'Copa'])
  })
})

describe('dates', () => {
  it('formats dates in Spanish', () => {
    expect(formatDateShort('2026-11-14')).toBe('14 nov 2026')
    expect(formatDateLong('2026-11-08')).toBe('Domingo, 8 de noviembre de 2026')
    expect(dayBlock('2026-09-05')).toEqual({ day: '05', month: 'sep' })
    expect(monthTitle('2026-01-31')).toBe('Enero 2026')
  })

  it('validates calendar dates', () => {
    expect(isValidDate('2026-02-28')).toBe(true)
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('')).toBe(false)
    expect(isValidDate('14/11/2026')).toBe(false)
  })

  it('uses the local date for today', () => {
    expect(todayISO(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})

describe('cleaning a draft before saving', () => {
  it('drops empty rows and trims text', () => {
    const cleaned = cleanDraft({
      ...emptyDraft('2026-11-14'),
      tournament: '  Copa  ',
      goals: [
        { text: ' Primer saque ', rating: 7 },
        { text: '   ', rating: 5 },
        { text: '', rating: null },
      ],
      positives: ['Buena actitud', '', '  '],
      improvements: [''],
    })
    expect(cleaned.tournament).toBe('Copa')
    expect(cleaned.goals).toEqual([{ text: 'Primer saque', rating: 7 }])
    expect(cleaned.positives).toEqual(['Buena actitud'])
    expect(cleaned.improvements).toEqual([])
  })

  it('keeps more than three rows (no limit from the paper form)', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ text: `Objetivo ${i + 1}`, rating: i + 1 }))
    expect(cleanDraft({ ...emptyDraft(), goals: many }).goals).toHaveLength(6)
  })

  it('offers one blank row in empty lists for the form', () => {
    const d = withBlankRows(emptyDraft())
    expect(d.goals).toEqual([{ text: '', rating: null }])
    expect(d.positives).toEqual([''])
    expect(cleanDraft(d).goals).toEqual([])
  })
})

describe('normalizing stored or imported notes', () => {
  it('fills in missing fields with defaults', () => {
    const n = normalizeNote({ id: 'x', date: '2026-11-14', tournament: 'Copa' })
    expect(n).not.toBeNull()
    expect(n!.goals).toEqual([])
    expect(n!.effort).toBeNull()
    expect(n!.surface).toBe('')
    expect(n!.notes).toBe('')
  })

  it('drops invalid values', () => {
    const n = normalizeNote({
      id: 'x',
      date: '2026-11-14',
      surface: 'ice',
      result: 'draw',
      effort: 11,
      satisfaction: 7,
      goals: [{ text: 'A', rating: 0 }, 'junk', { text: 'B', rating: 9 }],
      opponentStyles: ['net-rusher', 'unknown'],
    })!
    expect(n.surface).toBe('')
    expect(n.result).toBe('')
    expect(n.effort).toBeNull()
    expect(n.satisfaction).toBe(7)
    expect(n.goals).toEqual([
      { text: 'A', rating: null },
      { text: 'B', rating: 9 },
    ])
    expect(n.opponentStyles).toEqual(['net-rusher'])
  })

  it('rejects notes without an id or a valid date', () => {
    expect(normalizeNote({ date: '2026-11-14' })).toBeNull()
    expect(normalizeNote({ id: 'x', date: 'ayer' })).toBeNull()
    expect(normalizeNote(null)).toBeNull()
  })
})
