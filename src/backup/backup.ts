import { normalizeNote, todayISO, type Note } from '../model/note'

// Backup file format. Bump SCHEMA_VERSION only when the Note shape changes in
// a way normalizeNote() can't absorb, and teach parseBackup() to migrate.
export const BACKUP_APP = 'teniary'
export const SCHEMA_VERSION = 1

export interface BackupFile {
  app: typeof BACKUP_APP
  schemaVersion: number
  exportedAt: string
  notes: Note[]
}

export function buildBackup(notes: Note[], now: Date = new Date()): BackupFile {
  return { app: BACKUP_APP, schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), notes }
}

export function backupFileName(now: Date = new Date()): string {
  return `teniary-copia-${todayISO(now)}.json`
}

export type ParseResult = { ok: true; notes: Note[] } | { ok: false; error: string }

const NOT_A_BACKUP = 'Este archivo no es una copia de Teniary.'

export function parseBackup(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: NOT_A_BACKUP }
  }
  if (typeof data !== 'object' || data === null) return { ok: false, error: NOT_A_BACKUP }
  const d = data as Record<string, unknown>
  if (d.app !== BACKUP_APP || !Array.isArray(d.notes)) return { ok: false, error: NOT_A_BACKUP }
  if (typeof d.schemaVersion === 'number' && d.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      error: 'Esta copia se hizo con una versión más nueva de Teniary. Actualiza la app y vuelve a intentarlo.',
    }
  }
  const notes = d.notes.map(normalizeNote).filter((n): n is Note => n !== null)
  if (d.notes.length > 0 && notes.length === 0) {
    return { ok: false, error: 'No se ha encontrado ninguna nota válida en el archivo.' }
  }
  return { ok: true, notes }
}

export interface MergeResult {
  /** Notes to write to the database. */
  toWrite: Note[]
  added: number
  updated: number
  unchanged: number
}

/**
 * Merges imported notes into the existing ones by id. New notes are added; an
 * existing note is replaced only if the imported copy was edited later.
 * Nothing is ever deleted.
 */
export function mergeNotes(existing: Note[], incoming: Note[]): MergeResult {
  const byId = new Map(existing.map((n) => [n.id, n]))
  const result: MergeResult = { toWrite: [], added: 0, updated: 0, unchanged: 0 }
  for (const note of incoming) {
    const current = byId.get(note.id)
    if (!current) {
      result.toWrite.push(note)
      result.added++
    } else if (note.updatedAt > current.updatedAt) {
      result.toWrite.push(note)
      result.updated++
    } else {
      result.unchanged++
    }
    byId.set(note.id, current && note.updatedAt <= current.updatedAt ? current : note)
  }
  return result
}

export type ExportOutcome =
  | { kind: 'shared'; fileName: string }
  | { kind: 'downloaded'; fileName: string }
  | { kind: 'cancelled' }

/**
 * Exports all notes as a JSON file. On iPhone this opens the share sheet,
 * where "Guardar en Archivos" lets the user choose the folder. Elsewhere the
 * file is downloaded. Must be called directly from a tap (no awaits before).
 */
export async function exportNotes(notes: Note[], now: Date = new Date()): Promise<ExportOutcome> {
  const fileName = backupFileName(now)
  const json = JSON.stringify(buildBackup(notes, now), null, 2)
  const file = new File([json], fileName, { type: 'application/json' })

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Copia de Teniary' })
      return { kind: 'shared', fileName }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return { kind: 'cancelled' }
      // Sharing failed for another reason: fall back to a download.
    }
  }

  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return { kind: 'downloaded', fileName }
}
