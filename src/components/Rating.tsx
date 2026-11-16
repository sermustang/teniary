const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/**
 * A 1–10 rating as one row of buttons. Values below the chosen one are tinted
 * so the row reads like a meter. Tapping the chosen value again clears it.
 */
export function Rating({
  value,
  onChange,
  label,
}: {
  value: number | null
  onChange: (value: number | null) => void
  label: string
}) {
  return (
    <div className="rating" role="group" aria-label={`${label}, de 1 a 10`}>
      {VALUES.map((n) => {
        const selected = n === value
        const below = value !== null && n < value
        return (
          <button
            key={n}
            type="button"
            className={`rating-btn${selected ? ' is-selected' : ''}${below ? ' is-below' : ''}`}
            aria-pressed={selected}
            aria-label={`${n} de 10`}
            onClick={() => onChange(selected ? null : n)}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

/** Read-only 10-segment meter for the note view. */
export function RatingMeter({ value }: { value: number }) {
  return (
    <div className="meter" aria-hidden="true">
      {VALUES.map((n) => (
        <span key={n} className={n <= value ? 'is-on' : undefined} />
      ))}
    </div>
  )
}
