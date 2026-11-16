// Spanish date formatting. Done by hand (not Intl) so the output is identical
// on every device and in tests, and dates never shift with the time zone.

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function parts(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "2026-11-14" → "14 nov 2026" */
export function formatDateShort(iso: string): string {
  const { y, m, d } = parts(iso)
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`
}

/** "2026-11-08" → "Sábado, 8 de noviembre de 2026" */
export function formatDateLong(iso: string): string {
  const { y, m, d } = parts(iso)
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return capitalize(`${weekday}, ${d} de ${MONTHS[m - 1]} de ${y}`)
}

/** "2026-11-08" → { day: "08", month: "nov" } for the list's date block. */
export function dayBlock(iso: string): { day: string; month: string } {
  const { m, d } = parts(iso)
  return { day: String(d).padStart(2, '0'), month: MONTHS_SHORT[m - 1] }
}

/** "2026-11-08" → "Noviembre 2026" */
export function monthTitle(iso: string): string {
  const { y, m } = parts(iso)
  return `${capitalize(MONTHS[m - 1])} ${y}`
}

/** An ISO timestamp → "14 nov 2026" in local time. */
export function formatTimestampDate(isoTimestamp: string): string {
  const dt = new Date(isoTimestamp)
  return `${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]} ${dt.getFullYear()}`
}

export function pluralize(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}
