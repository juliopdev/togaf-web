import { z } from 'zod'

const box = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const count = z.number().int().nonnegative()

export const progressSchema = z.object({
  version: z.literal(1),
  cards: z.record(z.object({ box, due: fecha, reviews: count, lapses: count })),
  questions: z.record(z.object({ seen: count, correct: count, last: z.boolean() })),
  exams: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      mode: z.enum(['curso', 'ea1']),
      correct: count,
      total: count,
      passed: z.boolean(),
      durationSec: count,
      byTema: z.record(z.object({ correct: count, total: count })),
      wrong: z.array(z.string()),
    }),
  ),
  visited: z.array(z.string()),
})
