// Progreso del estudiante en localStorage, versionado.
// Todo acceso va en try/catch: en modo privado o con el almacenamiento bloqueado
// la web sigue funcionando y el progreso solo vive mientras la pestaña esté abierta.
import { useSyncExternalStore } from 'react'
import type { CardState } from './leitner'
import type { ExamModeId } from './quiz'

export const STORAGE_KEY = 'togaf-estudio:progreso'
export const PROGRESS_VERSION = 1

export interface QuestionStat {
  seen: number
  correct: number
  /** Resultado de la última vez que se respondió. */
  last: boolean
}

export interface ExamRecord {
  id: string
  date: string
  mode: ExamModeId
  correct: number
  total: number
  passed: boolean
  durationSec: number
  byTema: Record<string, { correct: number; total: number }>
  wrong: string[]
}

export interface Progress {
  version: typeof PROGRESS_VERSION
  cards: Record<string, CardState>
  questions: Record<string, QuestionStat>
  exams: ExamRecord[]
  visited: string[]
}

export const emptyProgress = (): Progress => ({ version: PROGRESS_VERSION, cards: {}, questions: {}, exams: [], visited: [] })

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    const data = JSON.parse(raw) as Partial<Progress>
    if (data.version !== PROGRESS_VERSION) return emptyProgress()
    return { ...emptyProgress(), ...data }
  } catch {
    return emptyProgress()
  }
}

let state: Progress = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Sin almacenamiento disponible: se mantiene en memoria.
  }
}

export const progressStore = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  update(fn: (p: Progress) => Progress) {
    state = fn(state)
    persist()
    listeners.forEach((l) => l())
  },
  replace(p: Progress) {
    progressStore.update(() => p)
  },
  reset() {
    progressStore.update(emptyProgress)
  },
  /** Solo para tests: vuelve a leer localStorage. */
  reload() {
    state = load()
    listeners.forEach((l) => l())
  },
}

export function useProgress(): Progress {
  return useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.get)
}

// ── Mutaciones de uso frecuente ──

export function recordCard(id: string, next: CardState) {
  progressStore.update((p) => ({ ...p, cards: { ...p.cards, [id]: next } }))
}

export function recordAnswers(results: { id: string; ok: boolean }[]) {
  progressStore.update((p) => {
    const questions = { ...p.questions }
    for (const { id, ok } of results) {
      const prev = questions[id] ?? { seen: 0, correct: 0, last: false }
      questions[id] = { seen: prev.seen + 1, correct: prev.correct + (ok ? 1 : 0), last: ok }
    }
    return { ...p, questions }
  })
}

export function recordExam(exam: ExamRecord) {
  progressStore.update((p) => ({ ...p, exams: [...p.exams, exam].slice(-50) }))
}

export function markVisited(key: string) {
  if (state.visited.includes(key)) return
  progressStore.update((p) => ({ ...p, visited: [...p.visited, key] }))
}

// ── Exportar / importar ──

export function exportProgress(p: Progress = state): string {
  return JSON.stringify({ app: 'togaf-estudio', exportedAt: new Date().toISOString(), ...p }, null, 2)
}

/** Valida un archivo exportado. Zod se carga solo aquí para no engordar el bundle inicial. */
export async function parseImport(text: string): Promise<Progress> {
  const { progressSchema } = await import('./progressSchema')
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  const r = progressSchema.safeParse(json)
  if (!r.success) throw new Error('El archivo no tiene el formato de progreso de TOGAF Estudio.')
  const { cards, questions, exams, visited } = r.data
  return { version: PROGRESS_VERSION, cards, questions, exams, visited }
}
