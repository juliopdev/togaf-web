import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { applyFilters, SOURCE_OPTIONS, temaOptions, TODOS } from '../components/filters'
import { QuestionCard } from '../components/QuestionCard'
import { Button, Card, Kbd, PageHeader, ProgressBar, Select } from '../components/ui'
import { labelDeTema, questions, type Question } from '../data/content'
import { mulberry32, shuffle, shuffleOptions } from '../lib/quiz'
import { recordAnswers, useProgress } from '../lib/storage'

type Step = 'setup' | 'run' | 'done'

export default function PracticePage() {
  const [params, setParams] = useSearchParams()
  const tema = params.get('tema') ?? TODOS
  const source = params.get('fuente') ?? TODOS
  const progress = useProgress()
  const pool = useMemo(() => applyFilters(questions, tema, source), [tema, source])

  const [step, setStep] = useState<Step>('setup')
  const [size, setSize] = useState('10')
  const [onlyFailed, setOnlyFailed] = useState(false)
  const [items, setItems] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])

  const failedPool = pool.filter((q) => progress.questions[q.id] && !progress.questions[q.id]!.last)
  const source_ = onlyFailed ? failedPool : pool

  const setFilter = (key: 'tema' | 'fuente', value: string) => {
    const next = new URLSearchParams(params)
    if (value === TODOS) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const start = () => {
    const rng = mulberry32(Date.now() % 2 ** 31)
    const n = size === 'all' ? source_.length : Number(size)
    const picked = shuffle(source_, rng).slice(0, n).map((q) => shuffleOptions(q, rng))
    setItems(picked)
    setAnswers(picked.map(() => null))
    setIdx(0)
    setStep(picked.length ? 'run' : 'setup')
  }

  const current = items[idx]
  const answered = answers[idx] ?? null

  const answer = (i: number) => {
    if (!current || answered !== null) return
    setAnswers((a) => a.map((x, j) => (j === idx ? i : x)))
    recordAnswers([{ id: current.id, ok: i === current.correcta }])
  }
  const next = () => (idx + 1 >= items.length ? setStep('done') : setIdx(idx + 1))

  useEffect(() => {
    if (step !== 'run') return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLSelectElement) return
      if (answered === null && ['1', '2', '3', '4'].includes(e.key)) answer(Number(e.key) - 1)
      else if (answered !== null && e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (step === 'run' && current) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>{answers.filter((a, i) => a !== null && a === items[i]!.correcta).length} correctas</span>
          <Button variant="ghost" onClick={() => setStep('done')}>
            Terminar
          </Button>
        </div>
        <ProgressBar value={idx} max={items.length} label="Avance" className="mb-6" />
        <QuestionCard question={current} number={idx + 1} total={items.length} selected={answered} onSelect={answer} reveal={answered !== null} />
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            <Kbd>1</Kbd>–<Kbd>4</Kbd> responden · <Kbd>Enter</Kbd> siguiente
          </p>
          <Button onClick={next} disabled={answered === null}>
            {idx + 1 >= items.length ? 'Ver resultado' : 'Siguiente'}
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    const done = items.filter((_, i) => answers[i] !== null)
    const ok = items.filter((q, i) => answers[i] === q.correcta).length
    const wrong = items.filter((q, i) => answers[i] !== null && answers[i] !== q.correcta)
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title={`${ok} de ${done.length} correctas`} kicker="Práctica terminada">
          {wrong.length ? 'Repasa las que fallaste; también puedes practicar solo los errores desde el inicio.' : 'Sin errores. ¡Bien hecho!'}
        </PageHeader>
        <div className="space-y-4">
          {wrong.map((q) => (
            <QuestionCard key={q.id} question={q} number={items.indexOf(q) + 1} total={items.length} selected={answers[items.indexOf(q)] ?? null} reveal />
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <Button onClick={start}>Otra ronda</Button>
          <Button variant="secondary" onClick={() => setStep('setup')}>
            Cambiar filtros
          </Button>
        </div>
      </div>
    )
  }

  const seen = pool.filter((q) => progress.questions[q.id]).length
  return (
    <>
      <PageHeader title="Práctica" kicker="Preguntas con explicación">
        Responde y mira al instante si acertaste y por qué. Sin tiempo ni nota: es para aprender. Para medirte, usa el simulacro.
      </PageHeader>
      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Tema" value={tema} onChange={(v) => setFilter('tema', v)} options={temaOptions(applyFilters(questions, TODOS, source))} />
          <Select label="Procedencia" value={source} onChange={(v) => setFilter('fuente', v)} options={SOURCE_OPTIONS} />
          <Select
            label="Preguntas"
            value={size}
            onChange={setSize}
            options={[...['5', '10', '20'].map((v) => ({ value: v, label: v })), { value: 'all', label: 'Todas' }]}
          />
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyFailed} onChange={(e) => setOnlyFailed(e.target.checked)} className="size-4 accent-cyan-700" />
          Solo las que fallé la última vez ({failedPool.length})
        </label>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{tema === TODOS ? 'Todos los temas' : labelDeTema(tema)}</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {pool.length} preguntas · {seen} ya respondidas alguna vez
        </p>
        <Button className="mt-5" onClick={start} disabled={source_.length === 0}>
          {source_.length ? 'Empezar' : 'No hay preguntas con estos filtros'}
        </Button>
      </Card>
    </>
  )
}
