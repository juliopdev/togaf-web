import { temas } from '../data/content'

export const TODOS = 'todos'

/** Opciones de tema para un <select>, solo con los temas que tienen elementos. */
export function temaOptions(items: { tema: string }[]) {
  const counts = new Map<string, number>()
  for (const it of items) counts.set(it.tema, (counts.get(it.tema) ?? 0) + 1)
  return [
    { value: TODOS, label: `Todos los temas (${items.length})` },
    ...temas.filter((t) => counts.has(t.id)).map((t) => ({ value: t.id, label: `${t.label} (${counts.get(t.id)})` })),
  ]
}

export const SOURCE_OPTIONS = [
  { value: TODOS, label: 'Curso y complemento' },
  { value: 'curso', label: 'Solo del curso' },
  { value: 'complemento', label: 'Solo del complemento' },
]

export function applyFilters<T extends { tema: string; source: string }>(items: T[], tema: string, source: string): T[] {
  return items.filter((it) => (tema === TODOS || it.tema === tema) && (source === TODOS || it.source === source))
}
