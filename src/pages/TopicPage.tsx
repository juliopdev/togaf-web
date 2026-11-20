import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { SectionView } from '../components/SectionView'
import { ButtonLink } from '../components/ui'
import { cards, questions, topicById } from '../data/content'
import { markVisited } from '../lib/storage'
import NotFoundPage from './NotFoundPage'

export default function TopicPage() {
  const { id } = useParams()
  const topic = id ? topicById.get(id) : undefined

  useEffect(() => {
    if (topic) {
      markVisited(`tema:${topic.id}`)
      document.title = `${topic.title} · TOGAF Estudio`
    }
    return () => {
      document.title = 'TOGAF Estudio'
    }
  }, [topic])

  if (!topic) return <NotFoundPage />
  const nCards = cards.filter((c) => c.tema === topic.id).length
  const nQuestions = questions.filter((q) => q.tema === topic.id).length

  return (
    <article>
      <nav aria-label="Ruta" className="mb-4 text-sm text-slate-500">
        <Link to="/teoria" className="hover:text-cyan-700 hover:underline dark:hover:text-cyan-400">
          Teoría
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span>{topic.title}</span>
      </nav>
      <header className="mb-6">
        <div className="mb-1 text-sm font-medium text-cyan-700 dark:text-cyan-400">{topic.group === 'curso' ? 'Del curso' : 'Complemento'}</div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{topic.title}</h1>
        <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">{topic.summary}</p>
      </header>
      {(nCards > 0 || nQuestions > 0) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {nCards > 0 && (
            <ButtonLink to={`/tarjetas?tema=${topic.id}`} variant="secondary">
              Repasar tarjetas ({nCards})
            </ButtonLink>
          )}
          {nQuestions > 0 && (
            <ButtonLink to={`/practica?tema=${topic.id}`} variant="secondary">
              Practicar preguntas ({nQuestions})
            </ButtonLink>
          )}
        </div>
      )}
      <div className="max-w-4xl space-y-4">
        {topic.sections.map((s, i) => (
          <SectionView key={i} section={s} />
        ))}
      </div>
    </article>
  )
}
