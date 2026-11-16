import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { normalizeNote, type Note } from '../model/note'

// All notes live in this IndexedDB database on the device. Nothing is sent
// anywhere. The app's code (cached by the service worker) is stored
// separately, so updating the app never touches this data.

interface TeniaryDB extends DBSchema {
  notes: { key: string; value: Note }
  meta: { key: string; value: unknown }
}

const DB_NAME = 'teniary'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<TeniaryDB>> | null = null

function db(): Promise<IDBPDatabase<TeniaryDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TeniaryDB>(DB_NAME, DB_VERSION, {
      upgrade(database, oldVersion) {
        // Future schema changes go here as `if (oldVersion < 2) { ... }`.
        if (oldVersion < 1) {
          database.createObjectStore('notes', { keyPath: 'id' })
          database.createObjectStore('meta')
        }
      },
    })
  }
  return dbPromise
}

export async function getAllNotes(): Promise<Note[]> {
  const raw = await (await db()).getAll('notes')
  return raw.map(normalizeNote).filter((n): n is Note => n !== null)
}

export async function putNote(note: Note): Promise<void> {
  await (await db()).put('notes', note)
}

export async function putNotes(notes: Note[]): Promise<void> {
  const tx = (await db()).transaction('notes', 'readwrite')
  await Promise.all([...notes.map((n) => tx.store.put(n)), tx.done])
}

export async function deleteNote(id: string): Promise<void> {
  await (await db()).delete('notes', id)
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await (await db()).get('meta', key)) as T | undefined
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await (await db()).put('meta', value, key)
}

/**
 * Asks the browser to keep this app's data even when the device runs low on
 * space. Returns whether storage is persistent.
 */
export async function ensurePersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
