import { formatDateShort } from '../model/format'
import { IconCalendar, IconX } from './Icons'

/**
 * A date field that shows the date the Spanish way ("14 nov 2026") and opens
 * the native date picker. The real <input type="date"> sits invisibly on top,
 * so iOS shows its own picker when tapped.
 */
export function DateField({
  id,
  value,
  onChange,
  placeholder = 'Elegir fecha',
  clearable = false,
  invalid = false,
  label,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  clearable?: boolean
  invalid?: boolean
  label?: string
}) {
  const showClear = clearable && value !== ''
  return (
    <div className="date-field-wrap">
      <div className={`field date-field${invalid ? ' is-invalid' : ''}`}>
        <span className={value ? undefined : 'placeholder'} aria-hidden="true">
          {value ? formatDateShort(value) : placeholder}
        </span>
        {!showClear && <IconCalendar size={18} className="muted-icon" />}
        <input
          id={id}
          type="date"
          aria-label={label}
          aria-invalid={invalid || undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker?.()
            } catch {
              // showPicker is not available everywhere; the native tap still works.
            }
          }}
        />
      </div>
      {showClear && (
        <button
          type="button"
          className="icon-btn date-clear"
          aria-label={`Borrar fecha: ${label ?? ''}`.trim()}
          onClick={() => onChange('')}
        >
          <IconX size={18} />
        </button>
      )}
    </div>
  )
}
