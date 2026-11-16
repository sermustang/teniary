// The match note: the digital version of the paper
// "Formulario de rendimiento del partido" (without "Nombre del jugador").
// Field names are English; Spanish labels live in the constant maps below.

export type Surface = 'clay' | 'hard' | 'grass' | 'artificial-grass' | 'carpet' | 'other'
export type MatchResult = '' | 'win' | 'loss'
export type OpponentStyle = 'net-rusher' | 'aggressive-baseliner' | 'counterpuncher' | 'all-court'

export interface RatedItem {
  text: string
  /** 1–10, or null when not rated yet. */
  rating: number | null
}

export interface Note {
  id: string
  createdAt: string
  updatedAt: string
  /** YYYY-MM-DD. The only required field. */
  date: string
  conditions: string
  tournament: string
  round: string
  opponent: string
  surface: Surface | ''
  result: MatchResult
  score: string
  /** Objetivos de rendimiento fijados antes del partido. */
  goals: RatedItem[]
  /** Consejos de rendimiento dados antes del partido. */
  advice: RatedItem[]
  opponentStyles: OpponentStyle[]
  /** The free-text blank after "Estilo de juego del adversario". */
  opponentStyleNotes: string
  effort: number | null
  satisfaction: number | null
  positives: string[]
  improvements: string[]
  doDifferently: string
  /** Notas adicionales. */
  notes: string
}

/** What the form edits: everything except identity and timestamps. */
export type NoteDraft = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>

export const SURFACES: { value: Surface; label: string; color: string }[] = [
  { value: 'clay', label: 'Tierra batida', color: '#d0662f' },
  { value: 'hard', label: 'Pista dura', color: '#3f7fd9' },
  { value: 'grass', label: 'Hierba', color: '#3f9a4a' },
  { value: 'artificial-grass', label: 'Hierba artificial', color: '#1fa58f' },
  { value: 'carpet', label: 'Moqueta', color: '#8a5cc8' },
  { value: 'other', label: 'Otra', color: '#8a8d84' },
]

export const OPPONENT_STYLES: { value: OpponentStyle; label: string }[] = [
  { value: 'net-rusher', label: 'Suele subir rápido a la red' },
  { value: 'aggressive-baseliner', label: 'Agresivo desde la línea de fondo' },
  { value: 'counterpuncher', label: 'Jugador al contragolpe' },
  { value: 'all-court', label: 'Jugador completo' },
]

export const ROUND_SUGGESTIONS = [
  'Previa',
  '1ª ronda',
  '2ª ronda',
  'Dieciseisavos',
  'Octavos',
  'Cuartos',
  'Semifinal',
  'Final',
  'Fase de grupos',
  'Amistoso',
]

export function surfaceInfo(value: Surface | ''): { label: string; color: string } | null {
  return SURFACES.find((s) => s.value === value) ?? null
}

/** Today's date in the device's local time zone, as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

export function emptyDraft(date: string = todayISO()): NoteDraft {
  return {
    date,
    conditions: '',
    tournament: '',
    round: '',
    opponent: '',
    surface: '',
    result: '',
    score: '',
    goals: [],
    advice: [],
    opponentStyles: [],
    opponentStyleNotes: '',
    effort: null,
    satisfaction: null,
    positives: [],
    improvements: [],
    doDifferently: '',
    notes: '',
  }
}

export function toDraft(note: Note): NoteDraft {
  const { id: _id, createdAt: _c, updatedAt: _u, ...draft } = note
  return structuredClone(draft)
}

// ---------------------------------------------------------------------------
// Normalization: turns anything read from storage or an imported file into a
// complete, valid Note. Missing fields get defaults, so older or partial data
// keeps working. This is also the place to migrate data from future versions.

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function rating(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 10 ? v : null
}

function ratedItems(v: unknown): RatedItem[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
    .map((x) => ({ text: str(x.text), rating: rating(x.rating) }))
}

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback
}

const SURFACE_VALUES: (Surface | '')[] = ['', ...SURFACES.map((s) => s.value)]
const STYLE_VALUES = OPPONENT_STYLES.map((s) => s.value)

/** Returns a complete Note, or null if the input has no usable id or date. */
export function normalizeNote(raw: unknown): Note | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const id = str(r.id)
  const date = str(r.date)
  if (!id || !isValidDate(date)) return null
  const createdAt = str(r.createdAt) || new Date(0).toISOString()
  return {
    id,
    createdAt,
    updatedAt: str(r.updatedAt) || createdAt,
    date,
    conditions: str(r.conditions),
    tournament: str(r.tournament),
    round: str(r.round),
    opponent: str(r.opponent),
    surface: oneOf(r.surface, SURFACE_VALUES, ''),
    result: oneOf<MatchResult>(r.result, ['', 'win', 'loss'], ''),
    score: str(r.score),
    goals: ratedItems(r.goals),
    advice: ratedItems(r.advice),
    opponentStyles: strings(r.opponentStyles).filter((s): s is OpponentStyle =>
      STYLE_VALUES.includes(s as OpponentStyle),
    ),
    opponentStyleNotes: str(r.opponentStyleNotes),
    effort: rating(r.effort),
    satisfaction: rating(r.satisfaction),
    positives: strings(r.positives),
    improvements: strings(r.improvements),
    doDifferently: str(r.doDifferently),
    notes: str(r.notes),
  }
}
