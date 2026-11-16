import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { emptyDraft, type Note } from '../model/note'
import { deleteNote, getAllNotes, getMeta, putNote, putNotes, setMeta } from './db'

function note(id: string): Note {
  return { ...emptyDraft('2026-11-14'), id, createdAt: '2026-11-14T10:00:00.000Z', updatedAt: '2026-11-14T10:00:00.000Z' }
}

describe('IndexedDB storage', () => {
  it('saves, reads, updates and deletes notes', async () => {
    await putNote({ ...note('a'), tournament: 'Copa' })
    await putNotes([note('b'), note('c')])
    expect((await getAllNotes()).map((n) => n.id).sort()).toEqual(['a', 'b', 'c'])

    await putNote({ ...note('a'), tournament: 'Liga' })
    expect((await getAllNotes()).find((n) => n.id === 'a')!.tournament).toBe('Liga')

    await deleteNote('b')
    expect((await getAllNotes()).map((n) => n.id).sort()).toEqual(['a', 'c'])
  })

  it('stores metadata such as the last export date', async () => {
    expect(await getMeta('lastExportAt')).toBeUndefined()
    await setMeta('lastExportAt', '2026-11-14T12:00:00.000Z')
    expect(await getMeta('lastExportAt')).toBe('2026-11-14T12:00:00.000Z')
  })
})
