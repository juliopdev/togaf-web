import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { SectionView } from '../components/SectionView'
import { ButtonLink, Card, cx, GROUP_STYLE } from '../components/ui'
import { cards, phaseById, phasesInOrder, phaseLabel, questions, type PhaseId } from '../data/content'
import { markVisited } from '../lib/storage'
import NotFoundPage from './NotFoundPage'

export default function PhasePage() {
  const { id } = useParams()
  const phase = id ? phaseById.get(id as PhaseId) : undefined

  useEffect(() => {
    if (phase) {
      markVisited(`fase:${phase.id}`)
      document.title = `${phaseLabel(phase)} · TOGAF Estudio`
    }
    return () => {
      document.title = 'TOGAF Estudio'
    }
  }, [phase])

  if (!phase) return <NotFoundPage />

  const idx = phasesInOrder.findIndex((p) => p.id === phase.id)
  const prev = phasesInOrder[idx - 1]
  const next = phasesInOrder[idx + 1]
  const nCards = cards.filter((c) => c.tema === phase.tema).length
  const nQuestions = questions.filter((q) => q.tema === phase.tema).length
  const style = GROUP_STYLE[phase.group]

  return (
    <article>
      <nav aria-label="Ruta" className="mb-4 text-sm text-slate-500">
        <Link to="/adm" className="hover:text-cyan-700 hover:underline dark:hover:text-cyan-400">
          Rueda ADM
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span>{phaseLabel(phase)}</span>
      </nav>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <span
          className={cx('flex size-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold', style.chip)}
          aria-hidden="true"
        >
          {phase.id === 'preliminar' ? 'P' : phase.id === 'REQ' ? 'R' : phase.codigo}
        </span>
        <div className="min-w-0">
          <div className={cx('text-sm font-medium', style.text)}>
            {style.label} · {phase.nombre_en}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{phaseLabel(phase)}</h1>
          {phase.subtitulo && <p className="mt-1 text-slate-600 dark:text-slate-400">{phase.subtitulo}</p>}
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        <ButtonLink to={`/tarjetas?tema=${phase.tema}`} variant="secondary">
          Repasar tarjetas ({nCards})
        </ButtonLink>
        <ButtonLink to={`/practica?tema=${phase.tema}`} variant="secondary">
          Practicar preguntas ({nQuestions})
        </ButtonLink>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <div className="min-w-0 space-y-4">
          {phase.sections.map((s, i) => (
            <SectionView key={i} section={s} id={`s${i}`} />
          ))}
          {phase.casos.length > 0 && (
            <Card>
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Casos del curso</h2>
              <ul className="space-y-3">
                {phase.casos.map((c) => (
                  <li key={c.id}>
                    <div className="font-medium text-slate-900 dark:text-white">{c.titulo}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{c.descripcion}</div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="hidden lg:block">
          <nav aria-label="En esta fase" className="sticky top-24 text-sm">
            <div className="mb-2 font-semibold text-slate-900 dark:text-white">En esta fase</div>
            <ul className="space-y-1 border-l border-slate-200 dark:border-slate-800">
              {phase.sections.map((s, i) => (
                <li key={i}>
                  <a
                    href={`#s${i}`}
                    className="-ml-px block border-l border-transparent py-0.5 pl-3 text-slate-600 hover:border-cyan-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>

      <nav aria-label="Fases" className="mt-8 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link to={`/fases/${prev.id}`} className="rounded-xl p-4 ring-1 ring-slate-200 hover:ring-cyan-500 dark:ring-slate-800">
            <div className="text-xs text-slate-500">← Anterior</div>
            <div className="font-medium">{phaseLabel(prev)}</div>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/fases/${next.id}`} className="rounded-xl p-4 text-right ring-1 ring-slate-200 hover:ring-cyan-500 dark:ring-slate-800">
            <div className="text-xs text-slate-500">Siguiente →</div>
            <div className="font-medium">{phaseLabel(next)}</div>
          </Link>
        )}
      </nav>
    </article>
  )
}
