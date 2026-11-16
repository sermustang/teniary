import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as db from './db/db'
import { mergeNotes, type MergeResult } from './backup/backup'
import { cleanDraft } from './model/clean'
import { EMPTY_FILTERS, type Filters } from './model/filter'
import type { Note, NoteDraft } from './model/note'

type LoadStatus = 'loading' | 'ready' | 'error'

interface AppState {
  status: LoadStatus
  notes: Note[]
  persistent: boolean | null
  lastExportAt: string | null
  saveNote: (draft: NoteDraft, id?: string) => Promise<Note>
  removeNote: (id: string) => Promise<void>
  importNotes: (incoming: Note[]) => Promise<Omit<MergeResult, 'toWrite'>>
  markExported: () => Promise<void>
  /** List filters live here so they survive opening a note and coming back. */
  filters: Filters
  setFilters: (f: Filters) => void
  filtersOpen: boolean
  setFiltersOpen: (open: boolean) => void
}

const Ctx = createContext<AppState | null>(null)

const LAST_EXPORT_KEY = 'lastExportAt'

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [notes, setNotes] = useState<Note[]>([])
  const [persistent, setPersistent] = useState<boolean | null>(null)
  const [lastExportAt, setLastExportAt] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([db.getAllNotes(), db.getMeta<string>(LAST_EXPORT_KEY)])
      .then(([loaded, exported]) => {
        if (cancelled) return
        setNotes(loaded)
        setLastExportAt(exported ?? null)
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('error'))
    db.ensurePersistentStorage().then((p) => !cancelled && setPersistent(p))
    return () => {
      cancelled = true
    }
  }, [])

  const saveNote = useCallback(
    async (draft: NoteDraft, id?: string) => {
      const now = new Date().toISOString()
      const existing = id ? notes.find((n) => n.id === id) : undefined
      const note: Note = {
        ...cleanDraft(draft),
        id: existing?.id ?? newId(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      await db.putNote(note)
      setNotes((prev) => [...prev.filter((n) => n.id !== note.id), note])
      return note
    },
    [notes],
  )

  const removeNote = useCallback(async (id: string) => {
    await db.deleteNote(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const importNotes = useCallback(
    async (incoming: Note[]) => {
      const { toWrite, ...counts } = mergeNotes(notes, incoming)
      if (toWrite.length) {
        await db.putNotes(toWrite)
        setNotes(await db.getAllNotes())
      }
      return counts
    },
    [notes],
  )

  const markExported = useCallback(async () => {
    const now = new Date().toISOString()
    await db.setMeta(LAST_EXPORT_KEY, now)
    setLastExportAt(now)
  }, [])

  const value = useMemo<AppState>(
    () => ({
      status,
      notes,
      persistent,
      lastExportAt,
      saveNote,
      removeNote,
      importNotes,
      markExported,
      filters,
      setFilters,
      filtersOpen,
      setFiltersOpen,
    }),
    [status, notes, persistent, lastExportAt, saveNote, removeNote, importNotes, markExported, filters, filtersOpen],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}
