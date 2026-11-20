import { Link } from 'react-router'
import AdmWheel from '../components/AdmWheel'
import { cx, GROUP_STYLE, PageHeader } from '../components/ui'
import { phasesInOrder, phaseLabel, type PhaseGroup } from '../data/content'
import { useProgress } from '../lib/storage'

export default function AdmPage() {
  const { visited } = useProgress()
  const groups = Object.entries(GROUP_STYLE) as [PhaseGroup, (typeof GROUP_STYLE)[PhaseGroup]][]
  return (
    <>
      <PageHeader title="Rueda del ADM" kicker="Architecture Development Method">
        Elige una fase para ver su propósito, pasos, entradas y salidas, y cómo se compara el curso con el estándar. La Gestión de
        Requisitos está al centro porque se aplica en todo el ciclo.
      </PageHeader>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div>
          <AdmWheel visited={visited} />
          <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400" aria-label="Leyenda de colores">
            {groups.map(([g, s]) => (
              <li key={g} className="flex items-center gap-1.5">
                <span className={cx('size-2.5 rounded-full', s.chip.split(' ')[0])} aria-hidden="true" />
                {s.label}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-xs text-slate-500">
            La edición 10 quitó las flechas del diagrama para subrayar que el ADM es iterativo.
          </p>
        </div>
        <ol className="space-y-2">
          {phasesInOrder.map((p) => {
            const seen = visited.includes(`fase:${p.id}`)
            return (
              <li key={p.id}>
                <Link
                  to={`/fases/${p.id}`}
                  className="group flex items-start gap-4 rounded-xl bg-white p-4 ring-1 ring-slate-200 transition hover:ring-cyan-500 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-cyan-600"
                >
                  <span
                    className={cx(
                      'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      GROUP_STYLE[p.group].chip,
                    )}
                    aria-hidden="true"
                  >
                    {p.id === 'preliminar' ? 'P' : p.id === 'REQ' ? 'R' : p.codigo}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-semibold text-slate-900 group-hover:text-cyan-800 dark:text-white dark:group-hover:text-cyan-300">
                        {phaseLabel(p)}
                      </span>
                      <span className="text-xs text-slate-500">{p.nombre_en}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-slate-600 dark:text-slate-400">{p.proposito}</span>
                  </span>
                  {seen && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Vista
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </>
  )
}
