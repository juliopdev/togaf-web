import { addDays } from './dates'
import { boxCounts, buildQueue, countDue, isDue, review, type CardState } from './leitner'

const today = '2026-11-20'

describe('review', () => {
  it('una tarjeta nueva que se sabe pasa a la caja 2 y vuelve mañana', () => {
    expect(review(undefined, 'good', today)).toEqual({ box: 2, due: '2026-11-21', reviews: 1, lapses: 0 })
  })

  it('sube una caja por acierto hasta la 5 (14 días)', () => {
    let s: CardState | undefined
    const dues: string[] = []
    for (let i = 0; i < 6; i++) {
      s = review(s, 'good', today)
      dues.push(s.due)
    }
    expect(s!.box).toBe(5)
    expect(dues).toEqual([addDays(today, 1), addDays(today, 3), addDays(today, 7), addDays(today, 14), addDays(today, 14), addDays(today, 14)])
  })

  it('fallar devuelve a la caja 1, para hoy, y cuenta un lapso', () => {
    const s = review({ box: 4, due: today, reviews: 3, lapses: 0 }, 'again', today)
    expect(s).toEqual({ box: 1, due: today, reviews: 4, lapses: 1 })
  })

  it('dudar mantiene la caja', () => {
    expect(review({ box: 3, due: today, reviews: 2, lapses: 0 }, 'hard', today)).toMatchObject({ box: 3, due: addDays(today, 3) })
  })

  it('cruza fin de mes y de año', () => {
    expect(addDays('2026-12-25', 14)).toBe('2027-01-08')
  })
})

describe('cola de repaso', () => {
  const cards = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }))
  const states: Record<string, CardState> = {
    a: { box: 3, due: '2026-11-19', reviews: 2, lapses: 0 },
    b: { box: 1, due: '2026-11-20', reviews: 1, lapses: 1 },
    c: { box: 2, due: '2026-11-25', reviews: 1, lapses: 0 },
  }

  it('pone primero las vencidas (caja baja primero) y luego las nuevas con límite', () => {
    expect(buildQueue(cards, states, today, { newLimit: 1 }).map((c) => c.id)).toEqual(['b', 'a', 'd'])
  })

  it('no incluye las que aún no vencen', () => {
    expect(isDue(states.c, today)).toBe(false)
    expect(isDue(undefined, today)).toBe(true)
  })

  it('cuenta cajas y pendientes', () => {
    const ids = cards.map((c) => c.id)
    expect(boxCounts(ids, states)).toEqual([2, 1, 1, 1, 0, 0])
    expect(countDue(ids, states, today)).toEqual({ due: 2, fresh: 2 })
  })
})
