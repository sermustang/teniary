import type { NoteDraft, RatedItem } from './note'

/**
 * Prepares a draft for saving: trims text and drops empty list rows.
 * A rated row without text is dropped too: a rating alone has no meaning.
 */
export function cleanDraft(draft: NoteDraft): NoteDraft {
  const cleanRated = (items: RatedItem[]) =>
    items
      .map((i) => ({ text: i.text.trim(), rating: i.rating }))
      .filter((i) => i.text !== '')
  const cleanList = (items: string[]) => items.map((s) => s.trim()).filter((s) => s !== '')

  return {
    ...draft,
    date: draft.date.trim(),
    conditions: draft.conditions.trim(),
    tournament: draft.tournament.trim(),
    round: draft.round.trim(),
    opponent: draft.opponent.trim(),
    score: draft.score.trim(),
    goals: cleanRated(draft.goals),
    advice: cleanRated(draft.advice),
    opponentStyles: [...draft.opponentStyles],
    opponentStyleNotes: draft.opponentStyleNotes.trim(),
    positives: cleanList(draft.positives),
    improvements: cleanList(draft.improvements),
    doDifferently: draft.doDifferently.trim(),
    notes: draft.notes.trim(),
  }
}

/** Adds one blank row to every empty list so the form always offers a field to type in. */
export function withBlankRows(draft: NoteDraft): NoteDraft {
  const blankRated = (items: RatedItem[]) => (items.length ? items : [{ text: '', rating: null }])
  const blankList = (items: string[]) => (items.length ? items : [''])
  return {
    ...draft,
    goals: blankRated(draft.goals),
    advice: blankRated(draft.advice),
    positives: blankList(draft.positives),
    improvements: blankList(draft.improvements),
  }
}
