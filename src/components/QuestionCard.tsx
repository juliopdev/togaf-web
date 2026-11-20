import type { Question } from '../data/content'
import { labelDeTema } from '../data/content'
import { cx, SourceBadge } from './ui'

const LETTERS = ['A', 'B', 'C', 'D']

export function QuestionCard({
  question,
  number,
  total,
  selected,
  onSelect,
  reveal = false,
}: {
  question: Question
  number: number
  total: number
  selected: number | null
  onSelect?: (i: number) => void
  /** Muestra la correcta, el error y la explicación. */
  reveal?: boolean
}) {
  const name = `q-${question.id}`
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          Pregunta {number} de {total} · {labelDeTema(question.tema)}
        </span>
        <SourceBadge source={question.source} fiabilidad={question.fiabilidad} />
      </div>
      <h2 id={`${name}-label`} className="mb-4 text-lg font-semibold leading-snug text-slate-900 dark:text-white">
        {question.enunciado}
      </h2>
      <div role="radiogroup" aria-labelledby={`${name}-label`} className="space-y-2">
        {question.opciones.map((op, i) => {
          const isSel = selected === i
          const isOk = i === question.correcta
          const state = reveal ? (isOk ? 'ok' : isSel ? 'bad' : 'idle') : isSel ? 'sel' : 'idle'
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSel}
              disabled={reveal || !onSelect}
              onClick={() => onSelect?.(i)}
              className={cx(
                'flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left ring-1 ring-inset transition-colors disabled:cursor-default',
                state === 'idle' && 'ring-slate-200 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800/60',
                state === 'sel' && 'bg-cyan-50 ring-2 ring-cyan-600 dark:bg-cyan-950/50',
                state === 'ok' && 'bg-emerald-50 ring-2 ring-emerald-600 dark:bg-emerald-950/50',
                state === 'bad' && 'bg-red-50 ring-2 ring-red-500 dark:bg-red-950/50',
                reveal && state === 'idle' && 'opacity-70',
              )}
            >
              <span
                className={cx(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  state === 'idle' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                  state === 'sel' && 'bg-cyan-600 text-white',
                  state === 'ok' && 'bg-emerald-600 text-white',
                  state === 'bad' && 'bg-red-500 text-white',
                )}
                aria-hidden="true"
              >
                {LETTERS[i]}
              </span>
              <span className="pt-0.5">{op}</span>
              {reveal && isOk && <span className="sr-only">(respuesta correcta)</span>}
              {reveal && isSel && !isOk && <span className="sr-only">(tu respuesta, incorrecta)</span>}
            </button>
          )
        })}
      </div>
      {reveal && (
        <div
          className={cx(
            'mt-4 rounded-xl px-4 py-3 text-sm leading-relaxed',
            selected === question.correcta
              ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
          )}
        >
          <span className="font-semibold">
            {selected === null ? 'Sin responder. ' : selected === question.correcta ? '¡Correcto! ' : `Incorrecto: era la ${LETTERS[question.correcta]}. `}
          </span>
          {question.explicacion}
        </div>
      )}
    </div>
  )
}
