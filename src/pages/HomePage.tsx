import { Link } from 'react-router'
import AdmWheel from '../components/AdmWheel'
import { ButtonLink, Card, PageHeader, ProgressBar, Stat } from '../components/ui'
import { cards, phases, questions, topics } from '../data/content'
import { todayStr, formatDate } from '../lib/dates'
import { countDue } from '../lib/leitner'
import { EXAM_MODES } from '../lib/quiz'
import { useProgress } from '../lib/storage'

const MODULES = [
  { to: '/adm', title: 'Rueda ADM', text: 'Las 10 fases con propósito, pasos, entradas, salidas y la comparación curso ↔ estándar.' },
  { to: '/teoria', title: 'Teoría', text: `${topics.length} temas: dominios, gobernabilidad, Content Framework, Continuum, técnicas y más.` },
  { to: '/tarjetas', title: 'Tarjetas', text: `${cards.length} tarjetas con repaso espaciado: vuelven justo antes de que las olvides.` },
  { to: '/practica', title: 'Práctica', text: `${questions.length} preguntas con explicación inmediata, por tema o por fase.` },
  { to: '/simulacro', title: 'Simulacro', text: 'Examen del curso o estilo EA Part 1: 40 preguntas, 60 minutos, 60 % para aprobar.' },
  { to: '/progreso', title: 'Progreso', text: 'Historial de simulacros, dominio por tema y copia de seguridad.' },
]

export default function HomePage() {
  const progress = useProgress()
  const today = todayStr()
  const { due, fresh } = countDue(
    cards.map((c) => c.id),
    progress.cards,
    today,
  )
  const fasesVistas = phases.filter((p) => progress.visited.includes(`fase:${p.id}`)).length
  const last = progress.exams.at(-1)

  return (
    <>
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <PageHeader title="Estudia TOGAF a tu ritmo" kicker="Diseño e Implementación de Arquitectura Empresarial">
            Teoría del curso y del estándar en un solo lugar, tarjetas que se repasan solas y simulacros con tiempo. Cada contenido indica
            si viene de las diapositivas o del complemento, y qué tan fiable es la fuente.
          </PageHeader>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to="/tarjetas">{due > 0 ? `Repasar ${due} ${due === 1 ? 'tarjeta pendiente' : 'tarjetas pendientes'}` : 'Empezar a repasar'}</ButtonLink>
            <ButtonLink to="/adm" variant="secondary">
              Recorrer el ADM
            </ButtonLink>
          </div>
        </div>
        <div className="hidden lg:block">
          <AdmWheel visited={progress.visited} />
        </div>
      </div>

      <section aria-label="Resumen" className="mt-10 grid gap-3 sm:grid-cols-3">
        <Stat label="Tarjetas para hoy" value={due} hint={`${fresh} nuevas sin estudiar`} />
        <Card className="p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">Fases vistas</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {fasesVistas}
            <span className="text-base font-normal text-slate-500"> / {phases.length}</span>
          </div>
          <ProgressBar value={fasesVistas} max={phases.length} label="Fases vistas" className="mt-3" />
        </Card>
        <Stat
          label="Último simulacro"
          value={last ? `${last.correct}/${last.total}` : '—'}
          hint={
            last ? (
              <>
                {EXAM_MODES[last.mode].nombre} · {formatDate(last.date)} ·{' '}
                <span className={last.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}>
                  {last.passed ? 'Aprobado' : 'No aprobado'}
                </span>
              </>
            ) : (
              'Aún no has rendido ninguno'
            )
          }
        />
      </section>

      <section aria-label="Módulos" className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Módulos</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <li key={m.to}>
              <Link
                to={m.to}
                className="block h-full rounded-xl bg-white p-4 ring-1 ring-slate-200 transition hover:ring-cyan-500 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-cyan-600"
              >
                <span className="font-semibold text-slate-900 dark:text-white">{m.title}</span>
                <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">{m.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
