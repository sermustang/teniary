import type { RatedItem } from '../model/note'
import { AutoTextarea } from './AutoTextarea'
import { IconPlus, IconX } from './Icons'
import { Rating } from './Rating'

function RowNumber({ n }: { n: number }) {
  return (
    <span className="row-number" aria-hidden="true">
      {n}
    </span>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="icon-btn" aria-label={label} onClick={onClick}>
      <IconX />
    </button>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="add-btn" onClick={onClick}>
      <IconPlus size={18} />
      {label}
    </button>
  )
}

/** Unlimited list of text + 1–10 rating rows (goals, advice). */
export function RatedListField({
  items,
  onChange,
  itemLabel,
  addLabel,
  placeholder,
}: {
  items: RatedItem[]
  onChange: (items: RatedItem[]) => void
  itemLabel: string
  addLabel: string
  placeholder: string
}) {
  const update = (i: number, patch: Partial<RatedItem>) =>
    onChange(items.map((item, j) => (j === i ? { ...item, ...patch } : item)))
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i))
  const add = () => onChange([...items, { text: '', rating: null }])

  return (
    <>
      {items.map((item, i) => (
        <div className="rated-row" key={i}>
          <div className="row-line row-line-top">
            <RowNumber n={i + 1} />
            <AutoTextarea
              aria-label={`${itemLabel} ${i + 1}`}
              placeholder={placeholder}
              minRows={1}
              value={item.text}
              onChange={(e) => update(i, { text: e.target.value })}
            />
            <RemoveButton label={`Quitar ${itemLabel.toLowerCase()} ${i + 1}`} onClick={() => remove(i)} />
          </div>
          <Rating
            label={`Evaluación: ${itemLabel.toLowerCase()} ${i + 1}`}
            value={item.rating}
            onChange={(rating) => update(i, { rating })}
          />
        </div>
      ))}
      <AddButton label={addLabel} onClick={add} />
    </>
  )
}

/** Unlimited list of short texts (positive areas, areas to improve). */
export function TextListField({
  items,
  onChange,
  itemLabel,
  addLabel,
  placeholder,
}: {
  items: string[]
  onChange: (items: string[]) => void
  itemLabel: string
  addLabel: string
  placeholder: string
}) {
  const update = (i: number, text: string) => onChange(items.map((t, j) => (j === i ? text : t)))
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i))
  const add = () => onChange([...items, ''])

  return (
    <>
      {items.map((text, i) => (
        <div className="row-line" key={i}>
          <RowNumber n={i + 1} />
          <AutoTextarea
            aria-label={`${itemLabel} ${i + 1}`}
            placeholder={placeholder}
            minRows={1}
            value={text}
            onChange={(e) => update(i, e.target.value)}
          />
          <RemoveButton label={`Quitar ${itemLabel.toLowerCase()} ${i + 1}`} onClick={() => remove(i)} />
        </div>
      ))}
      <AddButton label={addLabel} onClick={add} />
    </>
  )
}
