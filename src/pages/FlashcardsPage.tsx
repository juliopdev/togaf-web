import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { applyFilters, SOURCE_OPTIONS, temaOptions, TODOS } from '../components/filters'
import { Button, Card, cx, Kbd, PageHeader, ProgressBar, Select, SourceBadge } from '../components/ui'
import { cards, labelDeTema, type Card as StudyCard } from '../data/content'
import { formatDate, todayStr } from '../lib/dates'
import { boxCounts, buildQueue, countDue, INTERVALS, RATING_LABEL, review, type Box, type Rating } from '../lib/leitner'
import { progressStore, recordCard, useProgress } from '../lib/storage'

type Phase = 'setup' | 'session' | 'done'
const MAX_REPEATS = 2

export default function FlashcardsPage() {
  const [params, setParams] = useSearchParams()
  const tema = params.get('tema') ?? TODOS
  const source = params.get('fuente') ?? TODOS
  const progress = useProgress()
  const today = todayStr()

  const filtered = useMemo(() => applyFilters(cards, tema, source), [tema, source])
  const ids = filtered.map((c) => c.id)
  const { due, fresh } = countDue(ids, progress.cards, today)
  const boxes = boxCounts(ids, progress.cards)

  const [phase, setPhase] = useState<Phase>('setup')
  const [newLimit, setNewLimit] = useState('20')
  const [queue, setQueue] = useState<StudyCard[]>([])
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [repeats, setRepeats] = useState<Record<string, number>>({})
  const [tally, setTally] = useState<Record<Rating, number>>({ again: 0, hard: 0, good: 0 })

  const setFilter = (key: 'tema' | 'fuente', value: string) => {
    const next = new URLSearchParams(params)
    if (value === TODOS) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const start = (all = false) => {
    const q = all
      ? [...filtered].sort((a, b) => (progress.cards[a.id]?.box ?? 0) - (progress.cards[b.id]?.box ?? 0))
      : buildQueue(filtered, progress.cards, today, { newLimit: Number(newLimit) })
    setQueue(q)
    setPos(0)
    setFlipped(false)
    setRepeats({})
    setTally({ again: 0, hard: 0, good: 0 })
    setPhase(q.length ? 'session' : 'setup')
  }

  const current = queue[pos]

  const rate = useCallback(
    (rating: Rating) => {
      if (!current) return
      const next = review(progressStore.get().cards[current.id], rating, today)
      recordCard(current.id, next)
      setTally((t) => ({ ...t, [rating]: t[rating] + 1 }))
      let newQueue = queue
      const n = repeats[current.id] ?? 0
      if (next.due <= today && n < MAX_REPEATS) {
        newQueue = [...queue, current]
        setQueue(newQueue)
        setRepeats((r) => ({ ...r, [current.id]: n + 1 }))
      }
      setFlipped(false)
      if (pos + 1 >= newQueue.length) setPhase('done')
      else setPos(pos + 1)
    },
    [current, queue, pos, repeats, today],
  )

  useEffect(() => {
    if (phase !== 'session') return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (e.key === ' ' || e.key === 'Enter') {
        if (e.target instanceof HTMLButtonElement) return
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (flipped && ['1', '2', '3'].includes(e.key)) {
        rate((['again', 'hard', 'good'] as const)[Number(e.key) - 1]!)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, flipped, rate])

  if (phase === 'session' && current) {
    const state = progress.cards[current.id]
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
          <span>
            Tarjeta {pos + 1} de {queue.length}
          </span>
          <Button variant="ghost" onClick={() => setPhase('done')}>
            Terminar sesión
          </Button>
        </div>
        <ProgressBar value={pos} max={queue.length} label="Avance de la sesión" className="mb-6" />

        <div className="flip">
          {/* key: cada tarjeta monta su propio giro, para no ver la respuesta de la siguiente al volver al frente */}
          <div key={pos} className={cx('flip-inner grid', flipped && 'is-flipped')}>
            <CardFace card={current} side="front" box={state?.box} hidden={flipped} onClick={() => setFlipped(true)} />
            <CardFace card={current} side="back" box={state?.box} hidden={!flipped} onClick={() => setFlipped(false)} />
          </div>
        </div>

        <div className="mt-6" aria-live="polite">
          {flipped ? (
            <div className="grid grid-cols-3 gap-2">
              {(['again', 'hard', 'good'] as const).map((r, i) => (
                <Button
                  key={r}
                  variant="secondary"
                  onClick={() => rate(r)}
                  className={cx(
                    'flex-col py-3',
                    r === 'again' && 'hover:!bg-red-50 dark:hover:!bg-red-950/50',
                    r === 'good' && 'hover:!bg-emerald-50 dark:hover:!bg-emerald-950/50',
                  )}
                >
                  <span>{RATING_LABEL[r]}</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    <Kbd>{i + 1}</Kbd> {nextLabel(state?.box, r)}
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            <Button className="w-full py-3" onClick={() => setFlipped(true)}>
              Mostrar respuesta
            </Button>
          )}
          <p className="mt-3 text-center text-xs text-slate-500">
            <Kbd>Espacio</Kbd> gira la tarjeta · <Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> califican
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    const total = tally.again + tally.hard + tally.good
    return (
      <div className="mx-auto max-w-xl text-center">
        <PageHeader title="Sesión terminada">
          <span className="block">
            Repasaste {total} {total === 1 ? 'tarjeta' : 'tarjetas'}. Las que fallaste volverán hoy mismo; las que sabías, en unos días.
          </span>
        </PageHeader>
        <div className="mb-6 grid grid-cols-3 gap-3">
          {(['again', 'hard', 'good'] as const).map((r) => (
            <Card key={r} className="p-4">
              <div className="text-2xl font-semibold tabular-nums">{tally[r]}</div>
              <div className="text-sm text-slate-500">{RATING_LABEL[r]}</div>
            </Card>
          ))}
        </div>
        <div className="flex justify-center gap-2">
          <Button onClick={() => setPhase('setup')}>Volver al mazo</Button>
        </div>
      </div>
    )
  }

  const nextDue = filtered
    .map((c) => progress.cards[c.id]?.due)
    .filter((d): d is string => !!d && d > today)
    .sort()[0]
  const sessionSize = due + Math.min(fresh, Number(newLimit))

  return (
    <>
      <PageHeader title="Tarjetas" kicker="Repaso espaciado">
        Cada tarjeta vive en una de 5 cajas. Si la sabes sube de caja y tarda más en volver (1, 3, 7 y 14 días); si la fallas vuelve a la
        caja 1 y la repasas hoy.
      </PageHeader>

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Tema" value={tema} onChange={(v) => setFilter('tema', v)} options={temaOptions(applyFilters(cards, TODOS, source))} />
          <Select label="Procedencia" value={source} onChange={(v) => setFilter('fuente', v)} options={SOURCE_OPTIONS} />
          <Select
            label="Nuevas por sesión"
            value={newLimit}
            onChange={setNewLimit}
            options={['5', '10', '20', '50'].map((v) => ({ value: v, label: `${v} tarjetas` }))}
          />
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {tema === TODOS ? 'Todos los temas' : labelDeTema(tema)}
          </h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {due} {due === 1 ? 'pendiente' : 'pendientes'} de repaso · {fresh} {fresh === 1 ? 'nueva' : 'nuevas'} · {filtered.length} en total
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => start()} disabled={sessionSize === 0}>
              {sessionSize ? `Empezar sesión (${sessionSize})` : 'Nada pendiente hoy'}
            </Button>
            {filtered.length > 0 && (
              <Button variant="secondary" onClick={() => start(true)}>
                Repasar todas igualmente
              </Button>
            )}
          </div>
          {sessionSize === 0 && nextDue && (
            <p className="mt-3 text-sm text-slate-500">Próximo repaso de este mazo: {formatDate(nextDue + 'T12:00:00')}.</p>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Cajas</h2>
          <BoxChart counts={boxes} />
        </Card>
      </div>
    </>
  )
}

function nextLabel(box: Box | undefined, r: Rating): string {
  const b = box ?? 1
  const next: Box = r === 'again' ? 1 : r === 'hard' ? b : (Math.min(b + 1, 5) as Box)
  const d = INTERVALS[next]
  return d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`
}

export function BoxChart({ counts }: { counts: readonly number[] }) {
  const max = Math.max(1, ...counts)
  const labels = ['Nuevas', 'Caja 1', 'Caja 2', 'Caja 3', 'Caja 4', 'Caja 5']
  return (
    <ul className="space-y-2 text-sm">
      {counts.map((n, i) => (
        <li key={i} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2">
          <span className="text-slate-600 dark:text-slate-400">{labels[i]}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <span
              className={cx('block h-full rounded-full', i === 0 ? 'bg-slate-400' : 'bg-cyan-600')}
              style={{ width: `${(n / max) * 100}%`, opacity: i === 0 ? 1 : 0.45 + i * 0.11 }}
            />
          </span>
          <span className="text-right tabular-nums text-slate-700 dark:text-slate-300">{n}</span>
        </li>
      ))}
    </ul>
  )
}

function CardFace({
  card,
  side,
  box,
  hidden,
  onClick,
}: {
  card: StudyCard
  side: 'front' | 'back'
  box?: Box
  hidden: boolean
  onClick: () => void
}) {
  return (
    <div
      className={cx(
        'flip-face col-start-1 row-start-1 flex min-h-64 flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 dark:bg-slate-900 dark:ring-slate-800',
        side === 'back' && 'flip-back',
      )}
      aria-hidden={hidden}
      onClick={onClick}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {labelDeTema(card.tema)} · {box ? `Caja ${box}` : 'Nueva'}
        </span>
        <SourceBadge source={card.source} fiabilidad={card.fiabilidad} />
      </div>
      <div className="flex flex-1 items-center justify-center text-center">
        {side === 'front' ? (
          <p className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-white">{card.front}</p>
        ) : (
          <div>
            <p className="mb-3 text-sm font-medium text-slate-500">{card.front}</p>
            <p className="text-lg leading-relaxed text-slate-800 dark:text-slate-100">{card.back}</p>
          </div>
        )}
      </div>
      <div className="mt-4 text-center text-xs text-slate-400">{side === 'front' ? 'Toca para ver la respuesta' : 'Toca para volver'}</div>
    </div>
  )
}
