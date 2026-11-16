import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker, useLocation, useNavigate, useParams } from 'react-router'
import { AppBar, BackButton, useGoBack } from '../components/AppBar'
import { AutoTextarea } from '../components/AutoTextarea'
import { DateField } from '../components/DateField'
import { IconAlert, IconCheck, IconChevronDown } from '../components/Icons'
import { RatedListField, TextListField } from '../components/ListFields'
import { Rating } from '../components/Rating'
import { cleanDraft, withBlankRows } from '../model/clean'
import { suggestions } from '../model/filter'
import {
  emptyDraft,
  isValidDate,
  OPPONENT_STYLES,
  ROUND_SUGGESTIONS,
  SURFACES,
  toDraft,
  type MatchResult,
  type NoteDraft,
  type OpponentStyle,
  type Surface,
} from '../model/note'
import { useAppState } from '../state'

const DISCARD_QUESTION = '¿Descartar los cambios?'

export function NoteForm({ mode }: { mode: 'new' | 'edit' }) {
  const { id } = useParams()
  const { status, notes } = useAppState()
  const existing = mode === 'edit' ? notes.find((n) => n.id === id) : undefined

  if (mode === 'edit' && status === 'loading') return <div className="screen" />
  if (mode === 'edit' && !existing) {
    return (
      <div className="screen">
        <AppBar left={<BackButton />} />
        <div className="empty">
          <p className="empty-title">No se ha encontrado esta nota</p>
          <Link to="/" className="text-btn">
            Volver a los partidos
          </Link>
        </div>
      </div>
    )
  }
  // key: start fresh if the user goes from editing one note to another.
  return <NoteFormInner key={existing?.id ?? 'new'} initial={existing ? toDraft(existing) : emptyDraft()} noteId={existing?.id} />
}

function NoteFormInner({ initial, noteId }: { initial: NoteDraft; noteId?: string }) {
  const { notes, saveNote } = useAppState()
  const navigate = useNavigate()
  const location = useLocation()
  const goBack = useGoBack(noteId ? `/nota/${noteId}` : '/')

  const [draft, setDraft] = useState<NoteDraft>(() => withBlankRows(initial))
  const [dateError, setDateError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const leavingRef = useRef(false)
  const dateRef = useRef<HTMLDivElement>(null)

  const initialJson = useMemo(() => JSON.stringify(cleanDraft(initial)), [initial])
  const dirty = JSON.stringify(cleanDraft(draft)) !== initialJson

  // Ask before leaving with unsaved changes (back button, swipe back, links).
  const blocker = useBlocker(() => dirty && !leavingRef.current)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm(DISCARD_QUESTION)) blocker.proceed()
    else blocker.reset()
  }, [blocker])

  // Ask before closing the tab/app page with unsaved changes (desktop browsers).
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const set = <K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const tournaments = useMemo(() => suggestions(notes, 'tournament'), [notes])
  const opponents = useMemo(() => suggestions(notes, 'opponent'), [notes])
  const rounds = useMemo(() => {
    const used = suggestions(notes, 'round')
    return [...used, ...ROUND_SUGGESTIONS.filter((r) => !used.includes(r))]
  }, [notes])

  const toggleStyle = (style: OpponentStyle, on: boolean) =>
    set(
      'opponentStyles',
      on
        ? OPPONENT_STYLES.map((s) => s.value).filter((v) => v === style || draft.opponentStyles.includes(v))
        : draft.opponentStyles.filter((s) => s !== style),
    )

  const toggleResult = (value: Exclude<MatchResult, ''>) => set('result', draft.result === value ? '' : value)

  async function save() {
    if (saving) return
    if (!isValidDate(draft.date)) {
      setDateError(true)
      dateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSaving(true)
    setSaveError(false)
    try {
      const note = await saveNote(draft, noteId)
      leavingRef.current = true
      if (noteId && location.key !== 'default') navigate(-1)
      else navigate(`/nota/${note.id}`, { replace: true })
    } catch {
      setSaveError(true)
      setSaving(false)
    }
  }

  return (
    <div className="screen">
      <AppBar
        left={
          <button type="button" className="appbar-link" onClick={goBack}>
            Cancelar
          </button>
        }
        title={noteId ? 'Editar partido' : 'Nuevo partido'}
        right={
          <button type="button" className="appbar-link appbar-strong" onClick={save} disabled={saving}>
            Guardar
          </button>
        }
      />

      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        noValidate
      >
        <section className="card">
          <h2 className="card-title">Partido</h2>

          <div className="field-group" ref={dateRef}>
            <label className="field-label" htmlFor="f-date">
              Fecha <span className="required" aria-hidden="true">*</span>
            </label>
            <DateField
              id="f-date"
              label="Fecha (obligatoria)"
              value={draft.date}
              invalid={dateError && !isValidDate(draft.date)}
              onChange={(date) => {
                set('date', date)
                if (isValidDate(date)) setDateError(false)
              }}
            />
            {dateError && !isValidDate(draft.date) && (
              <p className="field-error" role="alert">
                <IconAlert size={16} /> La fecha es obligatoria.
              </p>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="f-tournament">
              Torneo
            </label>
            <input
              id="f-tournament"
              className="field"
              list="dl-tournaments"
              autoComplete="off"
              autoCapitalize="sentences"
              value={draft.tournament}
              onChange={(e) => set('tournament', e.target.value)}
            />
            <datalist id="dl-tournaments">
              {tournaments.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div className="grid-2">
            <div className="field-group">
              <label className="field-label" htmlFor="f-round">
                Ronda
              </label>
              <input
                id="f-round"
                className="field"
                list="dl-rounds"
                autoComplete="off"
                value={draft.round}
                onChange={(e) => set('round', e.target.value)}
              />
              <datalist id="dl-rounds">
                {rounds.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="f-surface">
                Superficie
              </label>
              <div className="select-wrap">
                <select
                  id="f-surface"
                  className={`field${draft.surface ? '' : ' is-empty'}`}
                  value={draft.surface}
                  onChange={(e) => set('surface', e.target.value as Surface | '')}
                >
                  <option value="">Elegir…</option>
                  {SURFACES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <IconChevronDown size={18} className="select-chevron" />
              </div>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="f-opponent">
              Adversario
            </label>
            <input
              id="f-opponent"
              className="field"
              list="dl-opponents"
              autoComplete="off"
              autoCapitalize="words"
              value={draft.opponent}
              onChange={(e) => set('opponent', e.target.value)}
            />
            <datalist id="dl-opponents">
              {opponents.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="f-conditions">
              Condiciones
            </label>
            <input
              id="f-conditions"
              className="field"
              placeholder="Ej.: viento, calor, pista lenta"
              autoCapitalize="sentences"
              value={draft.conditions}
              onChange={(e) => set('conditions', e.target.value)}
            />
          </div>
        </section>

        <section className="card">
          <h2 className="card-title">Resultado del partido</h2>
          <div className="segmented" role="group" aria-label="Resultado">
            <button
              type="button"
              className={`segment${draft.result === 'win' ? ' is-win' : ''}`}
              aria-pressed={draft.result === 'win'}
              onClick={() => toggleResult('win')}
            >
              {draft.result === 'win' && <IconCheck size={18} />}
              Victoria
            </button>
            <button
              type="button"
              className={`segment${draft.result === 'loss' ? ' is-loss' : ''}`}
              aria-pressed={draft.result === 'loss'}
              onClick={() => toggleResult('loss')}
            >
              {draft.result === 'loss' && <IconCheck size={18} />}
              Derrota
            </button>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="f-score">
              Marcador
            </label>
            <input
              id="f-score"
              className="field tabular"
              placeholder="Ej.: 6-4 3-6 7-5"
              autoComplete="off"
              autoCorrect="off"
              value={draft.score}
              onChange={(e) => set('score', e.target.value)}
            />
          </div>
        </section>

        <section className="card">
          <div className="card-heading">
            <h2 className="card-title">Objetivos de rendimiento fijados antes del partido</h2>
            <p className="muted">Evalúa lo logrado de 1 a 10</p>
          </div>
          <RatedListField
            items={draft.goals}
            onChange={(goals) => set('goals', goals)}
            itemLabel="Objetivo"
            addLabel="Añadir objetivo"
            placeholder="Escribe un objetivo"
          />
        </section>

        <section className="card">
          <div className="card-heading">
            <h2 className="card-title">Consejos de rendimiento dados antes del partido</h2>
            <p className="muted">Evalúa lo logrado de 1 a 10</p>
          </div>
          <RatedListField
            items={draft.advice}
            onChange={(advice) => set('advice', advice)}
            itemLabel="Consejo"
            addLabel="Añadir consejo"
            placeholder="Escribe un consejo"
          />
        </section>

        <section className="card">
          <h2 className="card-title">Estilo de juego del adversario</h2>
          <div className="checklist">
            {OPPONENT_STYLES.map((s) => (
              <label key={s.value} className="check-row">
                <input
                  type="checkbox"
                  checked={draft.opponentStyles.includes(s.value)}
                  onChange={(e) => toggleStyle(s.value, e.target.checked)}
                />
                {s.label}
              </label>
            ))}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="f-style-notes">
              Otras observaciones
            </label>
            <AutoTextarea
              id="f-style-notes"
              autoCapitalize="sentences"
              value={draft.opponentStyleNotes}
              onChange={(e) => set('opponentStyleNotes', e.target.value)}
            />
          </div>
        </section>

        <section className="card">
          <h2 className="card-title">Evaluación personal</h2>
          <div className="field-group">
            <span className="field-label">Esfuerzo / espíritu de lucha</span>
            <Rating label="Esfuerzo / espíritu de lucha" value={draft.effort} onChange={(v) => set('effort', v)} />
          </div>
          <div className="field-group">
            <span className="field-label">Satisfacción del jugador</span>
            <Rating
              label="Satisfacción del jugador"
              value={draft.satisfaction}
              onChange={(v) => set('satisfaction', v)}
            />
          </div>
        </section>

        <section className="card">
          <h2 className="card-title">Áreas positivas del partido</h2>
          <TextListField
            items={draft.positives}
            onChange={(positives) => set('positives', positives)}
            itemLabel="Área positiva"
            addLabel="Añadir área positiva"
            placeholder="Algo que salió bien"
          />
        </section>

        <section className="card">
          <h2 className="card-title">Áreas que conviene mejorar</h2>
          <TextListField
            items={draft.improvements}
            onChange={(improvements) => set('improvements', improvements)}
            itemLabel="Área a mejorar"
            addLabel="Añadir área a mejorar"
            placeholder="Algo que hay que mejorar"
          />
        </section>

        <section className="card">
          <label className="card-title" htmlFor="f-different">
            Si tuvieras que jugar de nuevo el partido, ¿qué harías de forma distinta?
          </label>
          <AutoTextarea
            id="f-different"
            minRows={4}
            autoCapitalize="sentences"
            value={draft.doDifferently}
            onChange={(e) => set('doDifferently', e.target.value)}
          />
        </section>

        <section className="card">
          <label className="card-title" htmlFor="f-notes">
            Notas adicionales
          </label>
          <AutoTextarea
            id="f-notes"
            minRows={4}
            autoCapitalize="sentences"
            placeholder="Cualquier otra cosa que quieras recordar"
            value={draft.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </section>

        {saveError && (
          <p className="field-error" role="alert">
            <IconAlert size={16} /> No se ha podido guardar. Inténtalo de nuevo.
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-large" disabled={saving}>
          Guardar partido
        </button>
      </form>
    </div>
  )
}
