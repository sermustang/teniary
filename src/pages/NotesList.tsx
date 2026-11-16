import { useMemo } from 'react'
import { Link } from 'react-router'
import { InstallHint } from '../components/Banners'
import { DateField } from '../components/DateField'
import { IconChevronDown, IconPlus, IconSearch, IconSettings, IconSliders } from '../components/Icons'
import { activeFilterCount, EMPTY_FILTERS, filterNotes, groupByMonth, sortNotes } from '../model/filter'
import { dayBlock, formatDateLong, pluralize } from '../model/format'
import { SURFACES, surfaceInfo, type Note, type Surface } from '../model/note'
import { useAppState } from '../state'

const ICON_URL = `${import.meta.env.BASE_URL}pwa-192x192.png`

export function NotesList() {
  const { status, notes, filters, setFilters, filtersOpen, setFiltersOpen } = useAppState()

  const sorted = useMemo(() => sortNotes(notes), [notes])
  const visible = useMemo(() => filterNotes(sorted, filters), [sorted, filters])
  const groups = useMemo(() => groupByMonth(visible), [visible])
  const activeCount = activeFilterCount(filters)
  const isFiltering = activeCount > 0 || filters.query.trim() !== ''

  return (
    <div className="screen screen-list">
      <header className="list-header">
        <img src={ICON_URL} alt="" className="app-icon" width={44} height={44} />
        <div className="list-header-text">
          <h1>Teniary</h1>
          <p>{status === 'ready' ? `${pluralize(notes.length, 'partido guardado', 'partidos guardados')}` : ' '}</p>
        </div>
        <Link to="/ajustes" className="round-btn" aria-label="Ajustes">
          <IconSettings size={22} />
        </Link>
      </header>

      <InstallHint />

      <div className="search-row">
        <label className="search-box">
          <IconSearch size={18} />
          <input
            type="search"
            placeholder="Buscar por torneo"
            aria-label="Buscar por torneo"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            enterKeyHint="search"
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          className={`filter-toggle${filtersOpen ? ' is-open' : ''}`}
          aria-expanded={filtersOpen}
          aria-controls="filters-panel"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <IconSliders size={18} />
          Filtros
          {activeCount > 0 && (
            <span className="badge-count" aria-label={`${activeCount} activos`}>
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {filtersOpen && (
        <section id="filters-panel" className="card filters" aria-label="Filtros">
          <div className="grid-2">
            <div className="field-group">
              <span className="field-label-small">Desde</span>
              <DateField
                label="Desde"
                value={filters.from}
                onChange={(from) => setFilters({ ...filters, from })}
                placeholder="Cualquiera"
                clearable
              />
            </div>
            <div className="field-group">
              <span className="field-label-small">Hasta</span>
              <DateField
                label="Hasta"
                value={filters.to}
                onChange={(to) => setFilters({ ...filters, to })}
                placeholder="Cualquiera"
                clearable
              />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label-small" htmlFor="filter-surface">
              Superficie
            </label>
            <div className="select-wrap">
              <select
                id="filter-surface"
                className="field"
                value={filters.surface}
                onChange={(e) => setFilters({ ...filters, surface: e.target.value as Surface | '' })}
              >
                <option value="">Todas</option>
                {SURFACES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <IconChevronDown size={18} className="select-chevron" />
            </div>
          </div>
          <div className="filters-footer">
            <span className="muted">
              {visible.length} de {pluralize(notes.length, 'partido', 'partidos')}
            </span>
            {isFiltering && (
              <button type="button" className="text-btn" onClick={() => setFilters(EMPTY_FILTERS)}>
                Limpiar filtros
              </button>
            )}
          </div>
        </section>
      )}

      <div className="list">
        {status === 'error' && (
          <p className="empty">No se han podido cargar las notas. Cierra Teniary y vuelve a abrirla.</p>
        )}
        {status === 'ready' && notes.length === 0 && (
          <div className="empty">
            <p className="empty-title">Aún no hay partidos</p>
            <p>Después de tu próximo partido, toca «Nuevo partido» y rellena el formulario.</p>
          </div>
        )}
        {status === 'ready' && notes.length > 0 && visible.length === 0 && (
          <div className="empty">
            <p className="empty-title">Ningún partido coincide</p>
            <button type="button" className="text-btn" onClick={() => setFilters(EMPTY_FILTERS)}>
              Limpiar búsqueda y filtros
            </button>
          </div>
        )}
        {groups.map((g) => (
          <section key={g.key} className="month-group" aria-label={g.title}>
            <h2 className="month-title">{g.title}</h2>
            {g.notes.map((n) => (
              <NoteCard key={n.id} note={n} />
            ))}
          </section>
        ))}
      </div>

      <Link to="/nueva" className="fab">
        <IconPlus size={22} />
        Nuevo partido
      </Link>
    </div>
  )
}

function NoteCard({ note }: { note: Note }) {
  const { day, month } = dayBlock(note.date)
  const surface = surfaceInfo(note.surface)
  const subtitle = [note.opponent && `vs ${note.opponent}`, note.round].filter(Boolean).join(' · ')

  return (
    <Link to={`/nota/${note.id}`} className="note-card">
      <span className="sr-only">{formatDateLong(note.date)}: </span>
      <span className="date-block" aria-hidden="true">
        <span className="date-day">{day}</span>
        <span className="date-month">{month}</span>
      </span>
      <span className="note-card-main">
        <span className="note-card-title">{note.tournament || 'Partido sin torneo'}</span>
        {subtitle && <span className="note-card-sub">{subtitle}</span>}
        {surface && (
          <span className="note-card-surface">
            <span className="dot" style={{ background: surface.color }} />
            {surface.label}
          </span>
        )}
      </span>
      {(note.result || note.score) && (
        <span className="note-card-result">
          {note.result && <ResultBadge result={note.result} />}
          {note.score && <span className="score">{note.score}</span>}
        </span>
      )}
    </Link>
  )
}

export function ResultBadge({ result }: { result: 'win' | 'loss' }) {
  return result === 'win' ? (
    <span className="result-badge is-win" aria-label="Victoria">
      V
    </span>
  ) : (
    <span className="result-badge is-loss" aria-label="Derrota">
      D
    </span>
  )
}
