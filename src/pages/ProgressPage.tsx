import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { Button, Card, cx, PageHeader, Stat } from '../components/ui'
import { cards, phases, questions, temas, topics } from '../data/content'
import { formatDate, todayStr } from '../lib/dates'
import { boxCounts, countDue } from '../lib/leitner'
import { EXAM_MODES, formatClock } from '../lib/quiz'
import { exportProgress, parseImport, progressStore, useProgress, type Progress } from '../lib/storage'
import { BoxChart } from './FlashcardsPage'

export default function ProgressPage() {
  const progress = useProgress()
  const today = todayStr()
  const allIds = cards.map((c) => c.id)
  const { due } = countDue(allIds, progress.cards, today)
  const answered = Object.values(progress.questions)
  const totalSeen = answered.reduce((s, q) => s + q.seen, 0)
  const totalOk = answered.reduce((s, q) => s + q.correct, 0)
  const exams = [...progress.exams].reverse()
  const visitedCount =
    phases.filter((p) => progress.visited.includes(`fase:${p.id}`)).length + topics.filter((t) => progress.visited.includes(`tema:${t.id}`)).length

  return (
    <>
      <PageHeader title="Progreso" kicker="Tu avance">
        Todo se guarda en este navegador. Si cambias de equipo o vas a borrar los datos del navegador, exporta una copia y luego impórtala.
      </PageHeader>

      <section aria-label="Resumen" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Páginas de teoría vistas" value={`${visitedCount}/${phases.length + topics.length}`} />
        <Stat label="Tarjetas para hoy" value={due} hint={`${Object.keys(progress.cards).length} de ${cards.length} estudiadas`} />
        <Stat
          label="Aciertos en preguntas"
          value={totalSeen ? `${Math.round((totalOk / totalSeen) * 100)} %` : '—'}
          hint={`${answered.length} de ${questions.length} preguntas vistas`}
        />
        <Stat label="Simulacros" value={progress.exams.length} hint={`${progress.exams.filter((e) => e.passed).length} aprobados`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">Dominio por tema</h2>
            <p className="mb-4 text-sm text-slate-500">Aciertos de la última respuesta a cada pregunta del tema y tarjetas en caja 3 o más.</p>
            <Mastery progress={progress} />
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Historial de simulacros</h2>
            {exams.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400">
                Aún no hay simulacros.{' '}
                <Link to="/simulacro" className="font-medium text-cyan-700 hover:underline dark:text-cyan-400">
                  Rinde el primero
                </Link>
                .
              </p>
            ) : (
              <div className="-mx-5 overflow-x-auto px-5">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th scope="col" className="py-2 pr-4 font-semibold">Fecha</th>
                      <th scope="col" className="py-2 pr-4 font-semibold">Modo</th>
                      <th scope="col" className="py-2 pr-4 text-right font-semibold">Nota</th>
                      <th scope="col" className="py-2 pr-4 text-right font-semibold">Tiempo</th>
                      <th scope="col" className="py-2 font-semibold">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((e) => (
                      <tr key={e.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                        <td className="py-2 pr-4 whitespace-nowrap">{formatDate(e.date)}</td>
                        <td className="py-2 pr-4">{EXAM_MODES[e.mode].nombre}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {e.correct}/{e.total}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">{formatClock(e.durationSec)}</td>
                        <td className={cx('py-2 font-medium', e.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400')}>
                          {e.passed ? 'Aprobado' : 'No aprobado'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Tarjetas por caja</h2>
            <BoxChart counts={boxCounts(allIds, progress.cards)} />
          </Card>
          <Backup />
        </div>
      </div>
    </>
  )
}

function Mastery({ progress }: { progress: Progress }) {
  const rows = temas
    .map((t) => {
      const qs = questions.filter((q) => q.tema === t.id)
      const seen = qs.filter((q) => progress.questions[q.id])
      const ok = seen.filter((q) => progress.questions[q.id]!.last).length
      const cs = cards.filter((c) => c.tema === t.id)
      const learned = cs.filter((c) => (progress.cards[c.id]?.box ?? 0) >= 3).length
      return { ...t, qTotal: qs.length, qSeen: seen.length, qOk: ok, cTotal: cs.length, cLearned: learned }
    })
    .filter((r) => r.qTotal || r.cTotal)

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[30rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th scope="col" className="py-2 pr-4 font-semibold">Tema</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Preguntas</th>
            <th scope="col" className="py-2 font-semibold">Tarjetas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="py-2 pr-4">
                <Link to={r.kind === 'fase' ? `/fases/${r.id.replace('fase-', '')}` : `/teoria/${r.id}`} className="hover:text-cyan-700 hover:underline dark:hover:text-cyan-400">
                  {r.label}
                </Link>
              </td>
              <td className="py-2 pr-4">
                <Meter value={r.qOk} max={r.qTotal} empty={r.qSeen === 0} />
              </td>
              <td className="py-2">
                <Meter value={r.cLearned} max={r.cTotal} empty={false} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Meter({ value, max, empty }: { value: number; max: number; empty: boolean }) {
  if (!max) return <span className="text-slate-400">—</span>
  const pct = Math.round((value / max) * 100)
  return (
    <span className="flex items-center gap-2">
      <span className="h-2 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
        <span className="block h-full rounded-full bg-cyan-600" style={{ width: `${pct}%` }} />
      </span>
      <span className={cx('tabular-nums', empty && 'text-slate-400')}>
        {value}/{max}
      </span>
    </span>
  )
}

function Backup() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `togaf-estudio-progreso-${todayStr()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg({ tone: 'ok', text: 'Copia descargada.' })
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      progressStore.replace(await parseImport(await file.text()))
      setMsg({ tone: 'ok', text: 'Progreso importado.' })
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'No se pudo importar.' })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Copia de seguridad</h2>
      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={download}>
          Exportar progreso
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          Importar progreso…
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        {!confirmReset ? (
          <Button variant="ghost" className="text-red-700 dark:text-red-400" onClick={() => setConfirmReset(true)}>
            Reiniciar progreso
          </Button>
        ) : (
          <div role="alertdialog" aria-labelledby="reset-title" className="rounded-lg bg-red-50 p-3 dark:bg-red-950/40">
            <p id="reset-title" className="text-sm text-red-900 dark:text-red-200">
              Se borrarán tarjetas, respuestas, simulacros y páginas vistas. No se puede deshacer si no exportaste una copia.
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                variant="danger"
                onClick={() => {
                  progressStore.reset()
                  setConfirmReset(false)
                  setMsg({ tone: 'ok', text: 'Progreso reiniciado.' })
                }}
              >
                Borrar todo
              </Button>
              <Button variant="secondary" onClick={() => setConfirmReset(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
      {msg && (
        <p role="status" className={cx('mt-3 text-sm', msg.tone === 'ok' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400')}>
          {msg.text}
        </p>
      )}
    </Card>
  )
}
