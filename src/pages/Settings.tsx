import { useRef, useState } from 'react'
import { AppBar, BackButton } from '../components/AppBar'
import { isStandalone } from '../components/Banners'
import { IconAlert, IconCheck, IconImport, IconShare } from '../components/Icons'
import { exportNotes, parseBackup } from '../backup/backup'
import { formatTimestampDate, pluralize } from '../model/format'
import { useAppState } from '../state'

type Message = { tone: 'success' | 'error'; text: string } | null

export function Settings() {
  const { status, notes, persistent, lastExportAt, importNotes, markExported } = useAppState()
  const [message, setMessage] = useState<Message>(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  async function onExport() {
    setMessage(null)
    try {
      // Called straight from the tap: iOS only opens the share sheet then.
      const outcome = await exportNotes(notes)
      if (outcome.kind === 'cancelled') {
        setMessage({ tone: 'error', text: 'Exportación cancelada. No se ha guardado ningún archivo.' })
        return
      }
      await markExported()
      const count = pluralize(notes.length, 'nota exportada', 'notas exportadas')
      setMessage({
        tone: 'success',
        text:
          outcome.kind === 'shared'
            ? `${count} en «${outcome.fileName}». Si elegiste «Guardar en Archivos», el archivo está en la carpeta que seleccionaste.`
            : `${count} en «${outcome.fileName}». El archivo está en tu carpeta de Descargas.`,
      })
    } catch {
      setMessage({ tone: 'error', text: 'No se ha podido exportar. Inténtalo de nuevo.' })
    }
  }

  async function onFileChosen(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setMessage(null)
    try {
      const parsed = parseBackup(await file.text())
      if (!parsed.ok) {
        setMessage({ tone: 'error', text: parsed.error })
        return
      }
      const { added, updated, unchanged } = await importNotes(parsed.notes)
      const parts = [
        pluralize(added, 'nota nueva', 'notas nuevas'),
        pluralize(updated, 'actualizada', 'actualizadas'),
        pluralize(unchanged, 'sin cambios', 'sin cambios'),
      ]
      setMessage({ tone: 'success', text: `Importación completada: ${parts.join(', ')}.` })
    } catch {
      setMessage({ tone: 'error', text: 'No se ha podido leer el archivo.' })
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const lastExportText = !lastExportAt
    ? 'Nunca'
    : formatTimestampDate(lastExportAt) === formatTimestampDate(new Date().toISOString())
      ? `Hoy, ${formatTimestampDate(lastExportAt)}`
      : formatTimestampDate(lastExportAt)

  return (
    <div className="screen">
      <AppBar left={<BackButton />} title="Ajustes" />

      <div className="stack">
        <section className="card">
          <h2 className="card-title">Copia de seguridad</h2>
          <p className="muted prose">
            Tus notas solo se guardan en este iPhone. Exporta una copia de vez en cuando y guárdala en Archivos o en
            iCloud Drive.
          </p>
          <div className="info-pill">
            <span className="muted">Última copia</span>
            <strong>{lastExportText}</strong>
          </div>

          {message && (
            <div className={`message message-${message.tone}`} role={message.tone === 'error' ? 'alert' : 'status'}>
              {message.tone === 'success' ? <IconCheck size={20} /> : <IconAlert size={20} />}
              <span>{message.text}</span>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary btn-large"
            onClick={onExport}
            disabled={status !== 'ready' || notes.length === 0 || busy}
          >
            <IconShare />
            Exportar notas
          </button>
          {status === 'ready' && notes.length === 0 && <p className="muted small">No hay notas para exportar.</p>}

          <button
            type="button"
            className="btn btn-secondary btn-large"
            onClick={() => fileInput.current?.click()}
            disabled={status !== 'ready' || busy}
          >
            <IconImport />
            Importar copia
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => onFileChosen(e.target.files?.[0])}
          />
          <p className="muted small">Importar añade las notas del archivo y actualiza las que ya tienes. Nunca borra nada.</p>
        </section>

        <section className="card card-rows">
          <div className="info-row">
            <span>Notas guardadas</span>
            <strong>{status === 'ready' ? notes.length : '…'}</strong>
          </div>
          <div className="info-row">
            <span>Almacenamiento persistente</span>
            <strong className="info-value">
              {persistent === null ? '…' : persistent ? (
                <>
                  <IconCheck size={18} /> Activado
                </>
              ) : (
                'No confirmado'
              )}
            </strong>
          </div>
          <div className="info-row">
            <span>Versión</span>
            <span className="muted">{__APP_VERSION__}</span>
          </div>
        </section>

        {persistent === false && !isStandalone() && (
          <p className="muted small center">
            Abre Teniary desde el icono de la pantalla de inicio para que tus notas queden guardadas de forma segura.
          </p>
        )}
        <p className="muted small center">Teniary funciona sin conexión. Tus notas nunca salen de este dispositivo.</p>
      </div>
    </div>
  )
}
