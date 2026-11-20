// Repetición espaciada con 5 cajas de Leitner.
// Saberla sube una caja; dudar la deja donde está; fallar la devuelve a la caja 1.
import { addDays } from './dates'

export type Box = 1 | 2 | 3 | 4 | 5
export type Rating = 'again' | 'hard' | 'good'

export interface CardState {
  box: Box
  /** Fecha AAAA-MM-DD a partir de la cual toca repasarla. */
  due: string
  reviews: number
  lapses: number
}

/** Días hasta el próximo repaso según la caja. */
export const INTERVALS: Record<Box, number> = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 }

export const RATING_LABEL: Record<Rating, string> = {
  again: 'No la sabía',
  hard: 'Dudé',
  good: 'La sabía',
}

export function review(prev: CardState | undefined, rating: Rating, today: string): CardState {
  const box = prev?.box ?? 1
  const next: Box = rating === 'again' ? 1 : rating === 'hard' ? box : (Math.min(box + 1, 5) as Box)
  return {
    box: next,
    due: addDays(today, INTERVALS[next]),
    reviews: (prev?.reviews ?? 0) + 1,
    lapses: (prev?.lapses ?? 0) + (rating === 'again' ? 1 : 0),
  }
}

/** Una tarjeta nunca vista también está pendiente. */
export function isDue(state: CardState | undefined, today: string): boolean {
  return !state || state.due <= today
}

export interface QueueOptions {
  /** Máximo de tarjetas nuevas por sesión. */
  newLimit: number
}

/**
 * Cola de la sesión: primero las vencidas (caja más baja y más atrasadas primero),
 * después hasta `newLimit` tarjetas nuevas en su orden original.
 */
export function buildQueue<T extends { id: string }>(
  cards: T[],
  states: Record<string, CardState>,
  today: string,
  { newLimit }: QueueOptions,
): T[] {
  const due = cards
    .filter((c) => states[c.id] && isDue(states[c.id], today))
    .sort((a, b) => {
      const sa = states[a.id]!
      const sb = states[b.id]!
      return sa.box - sb.box || sa.due.localeCompare(sb.due)
    })
  const fresh = cards.filter((c) => !states[c.id]).slice(0, newLimit)
  return [...due, ...fresh]
}

/** Cuántas tarjetas hay en cada caja (0 = nuevas). */
export function boxCounts(cardIds: string[], states: Record<string, CardState>): [number, number, number, number, number, number] {
  const counts: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0]
  for (const id of cardIds) counts[states[id]?.box ?? 0]++
  return counts
}

export function countDue(cardIds: string[], states: Record<string, CardState>, today: string): { due: number; fresh: number } {
  let due = 0
  let fresh = 0
  for (const id of cardIds) {
    const s = states[id]
    if (!s) fresh++
    else if (isDue(s, today)) due++
  }
  return { due, fresh }
}
