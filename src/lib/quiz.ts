// Muestreo de preguntas, barajado y puntuación de quiz y simulacros.

export interface QuizQuestion {
  id: string
  opciones: string[]
  correcta: number
  tema: string
  source: 'curso' | 'complemento'
  enunciado?: string
}

export type Rng = () => number

/** PRNG determinista (para tests y para poder repetir un simulacro). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(xs: readonly T[], rng: Rng): T[] {
  const out = [...xs]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/**
 * Elige `n` preguntas repartidas entre temas: recorre los temas en turnos
 * y toma una de cada uno, para que ningún tema acapare el simulacro.
 */
export function pickBalanced<T extends QuizQuestion>(pool: readonly T[], n: number, rng: Rng): T[] {
  const byTema = new Map<string, T[]>()
  for (const q of shuffle(pool, rng)) {
    const g = byTema.get(q.tema)
    if (g) g.push(q)
    else byTema.set(q.tema, [q])
  }
  const groups = shuffle([...byTema.values()], rng)
  const picked: T[] = []
  while (picked.length < n && groups.some((g) => g.length)) {
    for (const g of groups) {
      const q = g.pop()
      if (q) picked.push(q)
      if (picked.length === n) break
    }
  }
  return shuffle(picked, rng)
}

/** Baraja las opciones manteniendo el índice de la correcta. */
export function shuffleOptions<T extends QuizQuestion>(q: T, rng: Rng): T {
  const order = shuffle([0, 1, 2, 3].slice(0, q.opciones.length), rng)
  return { ...q, opciones: order.map((i) => q.opciones[i]!), correcta: order.indexOf(q.correcta) }
}

export type ExamModeId = 'curso' | 'ea1'

export interface ExamMode {
  id: ExamModeId
  nombre: string
  descripcion: string
  n: number
  minutes: number
  filter: (q: QuizQuestion) => boolean
}

/** Temas propios del curso que el examen oficial no evalúa. */
const FUERA_DE_EA1 = new Set(['ae', 'frameworks', 'glosario'])

export const EXAM_MODES: Record<ExamModeId, ExamMode> = {
  curso: {
    id: 'curso',
    nombre: 'Examen del curso',
    descripcion: '20 preguntas solo con el contenido de las diapositivas, 30 minutos.',
    n: 20,
    minutes: 30,
    filter: (q) => q.source === 'curso',
  },
  ea1: {
    id: 'ea1',
    nombre: 'Estilo EA Part 1',
    descripcion: '40 preguntas, 60 minutos y 60 % para aprobar, como el examen oficial Foundation. Simulación no oficial.',
    n: 40,
    minutes: 60,
    // Fuera: temas propios del curso y preguntas redactadas «según el curso».
    filter: (q) => !FUERA_DE_EA1.has(q.tema) && !(q.source === 'curso' && /\bcurso\b/i.test(q.enunciado ?? '')),
  },
}

export function buildExam<T extends QuizQuestion>(mode: ExamMode, pool: readonly T[], rng: Rng): T[] {
  return pickBalanced(pool.filter(mode.filter), mode.n, rng).map((q) => shuffleOptions(q, rng))
}

export const PASS_RATIO = 0.6

/** Aprobado con al menos 60 %: 24/40 aprueba, 23/40 no. Cálculo entero para evitar redondeos. */
export const isPassing = (correct: number, total: number) => total > 0 && correct * 5 >= total * 3

export interface ExamScore {
  correct: number
  total: number
  pct: number
  passed: boolean
  byTema: Record<string, { correct: number; total: number }>
  wrong: string[]
}

export function scoreExam(questions: readonly QuizQuestion[], answers: readonly (number | null)[]): ExamScore {
  const byTema: ExamScore['byTema'] = {}
  const wrong: string[] = []
  let correct = 0
  questions.forEach((q, i) => {
    const ok = answers[i] === q.correcta
    const t = (byTema[q.tema] ??= { correct: 0, total: 0 })
    t.total++
    if (ok) {
      t.correct++
      correct++
    } else wrong.push(q.id)
  })
  const total = questions.length
  return { correct, total, pct: total ? Math.round((correct / total) * 100) : 0, passed: isPassing(correct, total), byTema, wrong }
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
