import { describe, expect, it } from 'vitest'
import { emptyDraft, type Note } from '../model/note'
import { backupFileName, buildBackup, mergeNotes, parseBackup, SCHEMA_VERSION } from './backup'

function note(id: string, updatedAt: string, extra: Partial<Note> = {}): Note {
  return { ...emptyDraft('2026-11-14'), id, createdAt: '2026-11-01T00:00:00.000Z', updatedAt, ...extra }
}

describe('backup file', () => {
  it('round-trips through JSON', () => {
    const notes = [note('a', '2026-11-02T00:00:00.000Z', { tournament: 'Copa', goals: [{ text: 'Saque', rating: 8 }] })]
    const parsed = parseBackup(JSON.stringify(buildBackup(notes)))
    expect(parsed).toEqual({ ok: true, notes })
  })

  it('names the file with the local date', () => {
    expect(backupFileName(new Date(2026, 10, 14, 23, 59))).toBe('teniary-copia-2026-11-14.json')
  })

  it('rejects files that are not Teniary backups', () => {
    for (const text of ['no es json', '[]', '{"app":"otra","notes":[]}', '{"app":"teniary"}']) {
      const r = parseBackup(text)
      expect(r.ok).toBe(false)
    }
  })

  it('rejects backups from a newer app version', () => {
    const r = parseBackup(JSON.stringify({ app: 'teniary', schemaVersion: SCHEMA_VERSION + 1, notes: [] }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/versión más nueva/)
  })

  it('rejects a file whose notes are all invalid', () => {
    const r = parseBackup(JSON.stringify({ app: 'teniary', schemaVersion: 1, notes: [{ foo: 1 }] }))
    expect(r.ok).toBe(false)
  })

  it('accepts an empty backup', () => {
    expect(parseBackup(JSON.stringify(buildBackup([])))).toEqual({ ok: true, notes: [] })
  })
})

describe('merging an import', () => {
  const existing = [note('a', '2026-11-05T00:00:00.000Z'), note('b', '2026-11-05T00:00:00.000Z')]

  it('adds new notes, updates newer ones and never deletes', () => {
    const incoming = [
      note('a', '2026-11-06T00:00:00.000Z', { tournament: 'Editada' }), // newer → update
      note('b', '2026-11-04T00:00:00.000Z', { tournament: 'Vieja' }), // older → keep current
      note('c', '2026-11-01T00:00:00.000Z'), // new → add
    ]
    const r = mergeNotes(existing, incoming)
    expect([r.added, r.updated, r.unchanged]).toEqual([1, 1, 1])
    expect(r.toWrite.map((n) => n.id).sort()).toEqual(['a', 'c'])
    expect(r.toWrite.find((n) => n.id === 'a')!.tournament).toBe('Editada')
  })

  it('importing the same export again changes nothing', () => {
    const r = mergeNotes(existing, existing)
    expect(r.toWrite).toEqual([])
    expect(r.unchanged).toBe(2)
  })
})
