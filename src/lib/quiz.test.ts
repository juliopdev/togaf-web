import { questions } from '../data/content'
import { buildExam, EXAM_MODES, formatClock, isPassing, mulberry32, pickBalanced, scoreExam, shuffleOptions, type QuizQuestion } from './quiz'

const q = (id: string, tema: string, correcta = 0, source: QuizQuestion['source'] = 'curso'): QuizQuestion => ({
  id,
  tema,
  correcta,
  source,
  opciones: ['w', 'x', 'y', 'z'],
})

describe('umbral de aprobación', () => {
  it('24/40 aprueba y 23/40 no', () => {
    expect(isPassing(24, 40)).toBe(true)
    expect(isPassing(23, 40)).toBe(false)
  })
  it('12/20 aprueba y 11/20 no', () => {
    expect(isPassing(12, 20)).toBe(true)
    expect(isPassing(11, 20)).toBe(false)
  })
  it('un examen vacío no aprueba', () => expect(isPassing(0, 0)).toBe(false))
})

describe('shuffleOptions', () => {
  it('mantiene la respuesta correcta tras barajar', () => {
    const rng = mulberry32(7)
    for (let i = 0; i < 50; i++) {
      const original = { ...q('a', 't', i % 4), opciones: ['A', 'B', 'C', 'D'] }
      const s = shuffleOptions(original, rng)
      expect(s.opciones[s.correcta]).toBe(original.opciones[original.correcta])
      expect([...s.opciones].sort()).toEqual(['A', 'B', 'C', 'D'])
    }
  })
})

describe('pickBalanced', () => {
  const pool = [
    ...Array.from({ length: 30 }, (_, i) => q(`a${i}`, 'grande')),
    ...Array.from({ length: 3 }, (_, i) => q(`b${i}`, 'chico')),
    ...Array.from({ length: 3 }, (_, i) => q(`c${i}`, 'otro')),
  ]

  it('no repite y reparte entre temas', () => {
    const picked = pickBalanced(pool, 9, mulberry32(1))
    expect(new Set(picked.map((x) => x.id)).size).toBe(9)
    const porTema = (t: string) => picked.filter((x) => x.tema === t).length
    expect(porTema('chico')).toBe(3)
    expect(porTema('otro')).toBe(3)
    expect(porTema('grande')).toBe(3)
  })

  it('si pide más de las que hay, devuelve todas', () => {
    expect(pickBalanced(pool.slice(0, 5), 10, mulberry32(2))).toHaveLength(5)
  })

  it('es determinista con la misma semilla', () => {
    const a = pickBalanced(pool, 10, mulberry32(42)).map((x) => x.id)
    const b = pickBalanced(pool, 10, mulberry32(42)).map((x) => x.id)
    expect(a).toEqual(b)
  })
})

describe('simulacros con el banco real', () => {
  it('EA Part 1 arma 40 preguntas distintas sin temas exclusivos del curso', () => {
    const exam = buildExam(EXAM_MODES.ea1, questions, mulberry32(3))
    expect(exam).toHaveLength(40)
    expect(new Set(exam.map((x) => x.id)).size).toBe(40)
    expect(exam.some((x) => x.tema === 'ae' || x.tema === 'frameworks')).toBe(false)
    expect(exam.some((x) => /\bcurso\b/i.test(x.enunciado))).toBe(false)
  })

  it('el banco de EA Part 1 deja margen para variar entre intentos', () => {
    expect(questions.filter(EXAM_MODES.ea1.filter).length).toBeGreaterThanOrEqual(55)
  })

  it('el examen del curso usa solo preguntas del curso', () => {
    const exam = buildExam(EXAM_MODES.curso, questions, mulberry32(4))
    expect(exam).toHaveLength(EXAM_MODES.curso.n)
    expect(exam.every((x) => x.source === 'curso')).toBe(true)
  })
})

describe('scoreExam', () => {
  it('puntúa, desglosa por tema y lista los errores', () => {
    const qs = [q('1', 'A', 0), q('2', 'A', 1), q('3', 'B', 2)]
    const s = scoreExam(qs, [0, 0, null])
    expect(s).toMatchObject({ correct: 1, total: 3, pct: 33, passed: false, wrong: ['2', '3'] })
    expect(s.byTema).toEqual({ A: { correct: 1, total: 2 }, B: { correct: 0, total: 1 } })
  })
})

it('formatClock', () => {
  expect(formatClock(3600)).toBe('60:00')
  expect(formatClock(65.9)).toBe('01:05')
  expect(formatClock(-3)).toBe('00:00')
})
