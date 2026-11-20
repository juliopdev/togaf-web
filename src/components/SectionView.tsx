import type { Block, Section } from '../data/content'
import { cx, SourceBadge } from './ui'

export function SectionView({ section, id }: { section: Section; id?: string }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{section.title}</h2>
        <SourceBadge source={section.source} fiabilidad={section.fiabilidad} />
      </div>
      <div className="space-y-4">
        {section.blocks.map((b, i) => (
          <BlockView key={i} block={b} />
        ))}
      </div>
    </section>
  )
}

function Label({ children }: { children: string }) {
  return <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{children}</h3>
}

export function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'text':
      return (
        <div>
          {block.label && <Label>{block.label}</Label>}
          <p className="leading-relaxed">{block.text}</p>
        </div>
      )
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul'
      return (
        <div>
          {block.label && <Label>{block.label}</Label>}
          <Tag className={cx('space-y-1.5 pl-5 leading-relaxed', block.ordered ? 'list-decimal marker:text-slate-400' : 'list-disc marker:text-cyan-600')}>
            {block.items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </Tag>
        </div>
      )
    }
    case 'defs':
      return (
        <div>
          {block.label && <Label>{block.label}</Label>}
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            {block.items.map((d, i) => (
              <div key={i} className="grid gap-1 py-2 first:pt-0 last:pb-0 sm:grid-cols-[minmax(10rem,14rem)_1fr] sm:gap-4">
                <dt className="font-medium text-slate-900 dark:text-white">{d.term}</dt>
                <dd className="leading-relaxed text-slate-700 dark:text-slate-300">{d.def}</dd>
              </div>
            ))}
          </dl>
        </div>
      )
    case 'table':
      return (
        <div>
          {block.label && <Label>{block.label}</Label>}
          <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {block.columns.map((c) => (
                    <th key={c} scope="col" className="py-2 pr-4 font-semibold text-slate-900 dark:text-white">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 align-top last:border-0 dark:border-slate-800">
                    {r.map((cell, j) => (
                      <td key={j} className={cx('py-2 pr-4 leading-relaxed', j === 0 && 'font-medium text-slate-900 dark:text-white')}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    case 'note':
      return (
        <p
          className={cx(
            'rounded-lg px-4 py-2.5 text-sm leading-relaxed ring-1 ring-inset',
            block.tone === 'warn'
              ? 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900'
              : 'bg-cyan-50 text-cyan-900 ring-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-100 dark:ring-cyan-900',
          )}
        >
          {block.text}
        </p>
      )
  }
}
