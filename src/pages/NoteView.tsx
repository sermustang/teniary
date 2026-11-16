import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AppBar, BackButton } from '../components/AppBar'
import { IconAlert, IconPencil, IconTrash, IconWind } from '../components/Icons'
import { RatingMeter } from '../components/Rating'
import { formatDateLong } from '../model/format'
import { OPPONENT_STYLES, surfaceInfo, type RatedItem } from '../model/note'
import { useAppState } from '../state'

export function NoteView() {
  const { id } = useParams()
  const { status, notes, removeNote } = useAppState()
  const navigate = useNavigate()
  const [deleteError, setDeleteError] = useState(false)
  const note = notes.find((n) => n.id === id)

  if (status === 'loading') return <div className="screen" />
  if (!note) {
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

  const surface = surfaceInfo(note.surface)
  const styles = OPPONENT_STYLES.filter((s) => note.opponentStyles.includes(s.value))

  async function onDelete() {
    if (!note || !window.confirm('¿Eliminar esta nota? No se puede deshacer.')) return
    try {
      await removeNote(note.id)
      navigate('/', { replace: true })
    } catch {
      setDeleteError(true)
    }
  }

  return (
    <div className="screen">
      <AppBar
        left={<BackButton />}
        right={
          <Link to={`/nota/${note.id}/editar`} className="appbar-link appbar-strong">
            <IconPencil size={18} />
            Editar
          </Link>
        }
      />

      <div className="stack">
        <section className="card hero">
          <p className="hero-date">{formatDateLong(note.date)}</p>
          <h1 className="hero-title">{note.tournament || 'Partido sin torneo'}</h1>
          {(note.round || surface) && (
            <div className="chips">
              {note.round && <span className="chip">{note.round}</span>}
              {surface && (
                <span className="chip">
                  <span className="dot" style={{ background: surface.color }} />
                  {surface.label}
                </span>
              )}
            </div>
          )}
          {note.opponent && (
            <p className="hero-opponent">
              vs <strong>{note.opponent}</strong>
            </p>
          )}
          {(note.result || note.score) && (
            <div className="hero-result">
              {note.result === 'win' && <span className="result-pill is-win">Victoria</span>}
              {note.result === 'loss' && <span className="result-pill is-loss">Derrota</span>}
              {note.score && <span className="hero-score">{note.score}</span>}
            </div>
          )}
          {note.conditions && (
            <p className="hero-conditions">
              <IconWind size={18} />
              <span>
                <span className="sr-only">Condiciones: </span>
                {note.conditions}
              </span>
            </p>
          )}
        </section>

        <RatedSection title="Objetivos de rendimiento" items={note.goals} />
        <RatedSection title="Consejos de rendimiento" items={note.advice} />

        {(styles.length > 0 || note.opponentStyleNotes) && (
          <section className="card">
            <h2 className="card-title">Estilo de juego del adversario</h2>
            {styles.length > 0 && (
              <div className="chips">
                {styles.map((s) => (
                  <span key={s.value} className="chip chip-accent">
                    {s.label}
                  </span>
                ))}
              </div>
            )}
            {note.opponentStyleNotes && <p className="prose">{note.opponentStyleNotes}</p>}
          </section>
        )}

        {(note.effort !== null || note.satisfaction !== null) && (
          <section className="card">
            <h2 className="card-title">Evaluación personal</h2>
            {note.effort !== null && <MeterRow label="Esfuerzo / espíritu de lucha" value={note.effort} />}
            {note.satisfaction !== null && <MeterRow label="Satisfacción del jugador" value={note.satisfaction} />}
          </section>
        )}

        <ListSection title="Áreas positivas" items={note.positives} />
        <ListSection title="Áreas que conviene mejorar" items={note.improvements} />
        <TextSection title="¿Qué harías de forma distinta?" text={note.doDifferently} />
        <TextSection title="Notas adicionales" text={note.notes} />

        {deleteError && (
          <p className="field-error" role="alert">
            <IconAlert size={16} /> No se ha podido eliminar. Inténtalo de nuevo.
          </p>
        )}
        <button type="button" className="btn btn-danger btn-large" onClick={onDelete}>
          <IconTrash />
          Eliminar nota
        </button>
      </div>
    </div>
  )
}

function RatedSection({ title, items }: { title: string; items: RatedItem[] }) {
  if (items.length === 0) return null
  return (
    <section className="card">
      <h2 className="card-title">{title}</h2>
      <ul className="rated-list">
        {items.map((item, i) => (
          <li key={i}>
            <span className="prose">{item.text}</span>
            {item.rating !== null && <span className="score-pill">{item.rating}/10</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}

function MeterRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="meter-row">
      <div className="meter-row-head">
        <span className="field-label">{label}</span>
        <span className="meter-value">{value}/10</span>
      </div>
      <RatingMeter value={value} />
    </div>
  )
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <section className="card">
      <h2 className="card-title">{title}</h2>
      <ol className="numbered">
        {items.map((t, i) => (
          <li key={i} className="prose">
            {t}
          </li>
        ))}
      </ol>
    </section>
  )
}

function TextSection({ title, text }: { title: string; text: string }) {
  if (!text) return null
  return (
    <section className="card">
      <h2 className="card-title">{title}</h2>
      <p className="prose">{text}</p>
    </section>
  )
}
