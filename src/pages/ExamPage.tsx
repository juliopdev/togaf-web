import { useCallback, useEffect, useRef, useState } from 'react'
import { QuestionCard } from '../components/QuestionCard'
import { Button, Card, cx, PageHeader } from '../components/ui'
import { labelDeTema, questions, type Question } from '../data/content'
import { buildExam, EXAM_MODES, formatClock, mulberry32, scoreExam, type ExamModeId, type ExamScore } from '../lib/quiz'
import { recordAnswers, recordExam } from '../lib/storage'

// El intento en curso se guarda en sessionStorage: sobrevive a recargar la página
// o a visitar otra sección, y el reloj sigue corriendo mientras tanto.
const SESSION_KEY = 'togaf-estudio:simulacro'

interface Attempt {
  mode: ExamModeId
  items: Question[]
  answers: (number | null)[]
  startedAt: number
  endsAt: number
}

interface Result {
  attempt: Attempt
  score: ExamScore
  durationSec: number
}

function loadAttempt(): Attempt | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Attempt) : null
  } catch {
    return null
  }
}
function saveAttempt(a: Attempt | null) {
  try {
    if (a) sessionStorage.setItem(SESSION_KEY, JSON.stringify(a))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // sin sessionStorage el intento solo vive en memoria
  }
}

export default function ExamPage() {
  const [attempt, setAttempt] = useState<Attempt | null>(loadAttempt)
  const [result, setResult] = useState<Result | null>(null)

  const update = (a: Attempt | null) => {
    setAttempt(a)
    saveAttempt(a)
  }

  const start = (mode: ExamModeId) => {
    const m = EXAM_MODES[mode]
    const items = buildExam(m, questions, mulberry32(Date.now() % 2 ** 31))
    const now = Date.now()
    update({ mode, items, answers: items.map(() => null), startedAt: now, endsAt: now + m.minutes * 60_000 })
    setResult(null)
  }

  // Evita registrar dos veces el mismo intento (reloj a cero + StrictMode, doble clic).
  const finished = useRef<number | null>(null)

  const finish = useCallback((a: Attempt) => {
    if (finished.current === a.startedAt) return
    finished.current = a.startedAt
    const score = scoreExam(a.items, a.answers)
    const durationSec = Math.round((Math.min(Date.now(), a.endsAt) - a.startedAt) / 1000)
    recordExam({
      id: `${a.startedAt}`,
      date: new Date(a.startedAt).toISOString(),
      mode: a.mode,
      correct: score.correct,
      total: score.total,
      passed: score.passed,
      durationSec,
      byTema: score.byTema,
      wrong: score.wrong,
    })
    recordAnswers(a.items.map((q, i) => ({ id: q.id, ok: a.answers[i] === q.correcta })))
    setResult({ attempt: a, score, durationSec })
    setAttempt(null)
    saveAttempt(null)
    window.scrollTo(0, 0)
  }, [])

  if (result) return <Results result={result} onRestart={() => setResult(null)} />
  if (attempt) return <Running attempt={attempt} onChange={update} onFinish={finish} onAbandon={() => update(null)} />

  return (
    <>
      <PageHeader title="Simulacro" kicker="Examen con tiempo">
        Sin pistas hasta el final. Al terminar verás tu nota, el desglose por tema y la explicación de cada error. Las preguntas son de
        práctica, escritas a partir del material; no son preguntas oficiales.
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.values(EXAM_MODES) as (typeof EXAM_MODES)[ExamModeId][]).map((m) => {
          const available = questions.filter(m.filter).length
          return (
            <Card key={m.id} className="flex flex-col">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{m.nombre}</h2>
              <p className="mt-1 flex-1 text-slate-600 dark:text-slate-400">{m.descripcion}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                  <dt className="text-slate-500">Preguntas</dt>
                  <dd className="font-semibold tabular-nums">{m.n}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                  <dt className="text-slate-500">Minutos</dt>
                  <dd className="font-semibold tabular-nums">{m.minutes}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                  <dt className="text-slate-500">Aprueba</dt>
                  <dd className="font-semibold tabular-nums">{Math.ceil(m.n * 0.6)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">Se eligen al azar de un banco de {available}, repartidas entre temas.</p>
              <Button className="mt-4" onClick={() => start(m.id)}>
                Empezar
              </Button>
            </Card>
          )
        })}
      </div>
    </>
  )
}

function Running({
  attempt,
  onChange,
  onFinish,
  onAbandon,
}: {
  attempt: Attempt
  onChange: (a: Attempt) => void
  onFinish: (a: Attempt) => void
  onAbandon: () => void
}) {
  const [idx, setIdx] = useState(0)
  const [now, setNow] = useState(Date.now)
  const [confirm, setConfirm] = useState<null | 'finish' | 'abandon'>(null)
  const remaining = (attempt.endsAt - now) / 1000
  const mode = EXAM_MODES[attempt.mode]
  const unanswered = attempt.answers.filter((a) => a === null).length
  const q = attempt.items[idx]!

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    if (remaining <= 0) onFinish(attempt)
  }, [remaining, attempt, onFinish])

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const select = (i: number) => onChange({ ...attempt, answers: attempt.answers.map((a, j) => (j === idx ? i : a)) })
  const low = remaining < 5 * 60

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
      <div className="min-w-0">
        <div className="sticky top-[97px] z-20 -mx-4 mb-4 flex items-center justify-between gap-3 bg-stone-50/95 px-4 py-2 backdrop-blur md:top-[61px] dark:bg-slate-950/95">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{mode.nombre}</span>
          <span
            role="timer"
            aria-label={`Tiempo restante ${formatClock(remaining)}`}
            className={cx(
              'rounded-lg px-3 py-1 font-mono text-lg font-semibold tabular-nums',
              low ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' : 'bg-white text-slate-900 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-slate-800',
            )}
          >
            {formatClock(remaining)}
          </span>
        </div>

        <QuestionCard question={q} number={idx + 1} total={attempt.items.length} selected={attempt.answers[idx] ?? null} onSelect={select} />

        <div className="mt-4 flex justify-between gap-2">
          <Button variant="secondary" onClick={() => setIdx(idx - 1)} disabled={idx === 0}>
            ← Anterior
          </Button>
          {idx + 1 < attempt.items.length ? (
            <Button variant="secondary" onClick={() => setIdx(idx + 1)}>
              Siguiente →
            </Button>
          ) : (
            <Button onClick={() => setConfirm('finish')}>Terminar</Button>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <Card className="p-4">
          <div className="mb-3 flex items-baseline justify-between text-sm">
            <span className="font-semibold text-slate-900 dark:text-white">Preguntas</span>
            <span className="text-slate-500">{attempt.items.length - unanswered} respondidas</span>
          </div>
          <ol className="grid grid-cols-8 gap-1.5 lg:grid-cols-6">
            {attempt.items.map((it, i) => (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Ir a la pregunta ${i + 1}${attempt.answers[i] === null ? ' (sin responder)' : ''}`}
                  aria-current={i === idx ? 'step' : undefined}
                  className={cx(
                    'flex aspect-square w-full items-center justify-center rounded-md text-xs font-medium tabular-nums',
                    i === idx && 'ring-2 ring-cyan-600',
                    attempt.answers[i] !== null
                      ? 'bg-cyan-700 text-white dark:bg-cyan-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300',
                  )}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ol>
        </Card>

        {confirm === null && (
          <div className="flex flex-col gap-2">
            <Button onClick={() => setConfirm('finish')}>Entregar examen</Button>
            <Button variant="ghost" onClick={() => setConfirm('abandon')}>
              Abandonar sin guardar
            </Button>
          </div>
        )}
        {confirm && (
          <Card className="p-4" >
            <div role="alertdialog" aria-labelledby="confirm-title">
              <p id="confirm-title" className="text-sm font-medium text-slate-900 dark:text-white">
                {confirm === 'finish'
                  ? unanswered
                    ? `Te quedan ${unanswered} sin responder, que contarán como incorrectas. ¿Entregar igual?`
                    : '¿Entregar el examen?'
                  : 'Se perderá este intento y no quedará en tu historial.'}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant={confirm === 'finish' ? 'primary' : 'danger'}
                  onClick={() => (confirm === 'finish' ? onFinish(attempt) : onAbandon())}
                >
                  {confirm === 'finish' ? 'Sí, entregar' : 'Sí, abandonar'}
                </Button>
                <Button variant="secondary" onClick={() => setConfirm(null)}>
                  Seguir
                </Button>
              </div>
            </div>
          </Card>
        )}
      </aside>
    </div>
  )
}

function Results({ result, onRestart }: { result: Result; onRestart: () => void }) {
  const { score, attempt, durationSec } = result
  const mode = EXAM_MODES[attempt.mode]
  const [showAll, setShowAll] = useState(false)
  const temas = Object.entries(score.byTema).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
  const review = attempt.items.map((q, i) => ({ q, i })).filter(({ q, i }) => showAll || attempt.answers[i] !== q.correcta)

  return (
    <div className="mx-auto max-w-3xl">
      <Card className={cx('mb-6 text-center ring-2', score.passed ? 'ring-emerald-500' : 'ring-red-400')}>
        <div className="text-sm font-medium text-slate-500">{mode.nombre}</div>
        <div className="mt-2 text-5xl font-bold tabular-nums text-slate-900 dark:text-white">
          {score.correct}
          <span className="text-2xl font-medium text-slate-400">/{score.total}</span>
        </div>
        <div className={cx('mt-2 text-lg font-semibold', score.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400')}>
          {score.passed ? 'Aprobado' : 'No aprobado'} · {score.pct} %
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Necesitabas {Math.ceil(score.total * 0.6)} · tiempo usado {formatClock(durationSec)}
        </p>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Por tema</h2>
        <ul className="space-y-2.5">
          {temas.map(([t, s]) => {
            const pct = Math.round((s.correct / s.total) * 100)
            return (
              <li key={t} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(0,16rem)_1fr_3.5rem]">
                <span className="truncate text-slate-700 dark:text-slate-300">{labelDeTema(t)}</span>
                <span className="col-span-2 row-start-2 h-2 overflow-hidden rounded-full bg-slate-100 sm:col-span-1 sm:row-start-auto dark:bg-slate-800">
                  <span
                    className={cx('block h-full rounded-full', pct >= 60 ? 'bg-emerald-500' : 'bg-red-400')}
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  />
                </span>
                <span className="col-start-2 row-start-1 text-right tabular-nums sm:col-start-auto sm:row-start-auto">
                  {s.correct}/{s.total}
                </span>
              </li>
            )
          })}
        </ul>
      </Card>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{showAll ? 'Todas las preguntas' : `Errores (${score.wrong.length})`}</h2>
        <Button variant="ghost" onClick={() => setShowAll((s) => !s)}>
          {showAll ? 'Ver solo errores' : 'Ver todas'}
        </Button>
      </div>
      <div className="space-y-4">
        {review.map(({ q, i }) => (
          <QuestionCard key={q.id} question={q} number={i + 1} total={attempt.items.length} selected={attempt.answers[i] ?? null} reveal />
        ))}
        {review.length === 0 && <p className="text-slate-600 dark:text-slate-400">Ningún error. ¡Excelente!</p>}
      </div>

      <div className="mt-8 flex gap-2">
        <Button onClick={onRestart}>Nuevo simulacro</Button>
      </div>
    </div>
  )
}
