import { Link } from 'react-router'
import { PageHeader } from '../components/ui'
import { advertencias, topics, type Topic } from '../data/content'
import { useProgress } from '../lib/storage'

export default function TopicsPage() {
  const { visited } = useProgress()
  const curso = topics.filter((t) => t.group === 'curso')
  const complemento = topics.filter((t) => t.group === 'complemento')
  return (
    <>
      <PageHeader title="Teoría" kicker="Temas">
        Los temas del curso salen de las diapositivas. Los del complemento cubren lo que el curso no trata, con una etiqueta que indica
        qué tan fiable es cada fuente. Las fases del ADM están en la{' '}
        <Link to="/adm" className="font-medium text-cyan-700 underline-offset-2 hover:underline dark:text-cyan-400">
          rueda ADM
        </Link>
        .
      </PageHeader>
      <Group title="Del curso" items={curso} visited={visited} />
      <Group title="Complemento: lo que el curso no cubre" items={complemento} visited={visited} />

      <details className="mt-10 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900">
        <summary className="cursor-pointer font-medium">Advertencias sobre el material del curso</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {advertencias.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </details>
    </>
  )
}

function Group({ title, items, visited }: { title: string; items: Topic[]; visited: string[] }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <li key={t.id}>
            <Link
              to={`/teoria/${t.id}`}
              className="flex h-full flex-col rounded-xl bg-white p-4 ring-1 ring-slate-200 transition hover:ring-cyan-500 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-cyan-600"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">{t.title}</span>
                {visited.includes(`tema:${t.id}`) && (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Visto
                  </span>
                )}
              </span>
              <span className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.summary}</span>
              <span className="mt-auto pt-3 text-xs text-slate-500">{t.sections.length} secciones</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
