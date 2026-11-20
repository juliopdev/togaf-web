import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import type { Fiabilidad, PhaseGroup, Source } from '../data/content'

export function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

// ── Colores por grupo de fases ──

export const GROUP_STYLE: Record<PhaseGroup, { fill: string; text: string; chip: string; label: string }> = {
  marco: { fill: 'fill-slate-500', text: 'text-slate-600 dark:text-slate-300', chip: 'bg-slate-600 text-white', label: 'Marco' },
  vision: { fill: 'fill-violet-600', text: 'text-violet-700 dark:text-violet-300', chip: 'bg-violet-600 text-white', label: 'Visión' },
  diseno: { fill: 'fill-sky-600', text: 'text-sky-700 dark:text-sky-300', chip: 'bg-sky-600 text-white', label: 'Diseño de arquitecturas' },
  planificacion: { fill: 'fill-amber-600', text: 'text-amber-700 dark:text-amber-300', chip: 'bg-amber-500 text-slate-900', label: 'Planificación' },
  gobierno: { fill: 'fill-rose-600', text: 'text-rose-700 dark:text-rose-300', chip: 'bg-rose-600 text-white', label: 'Gobierno y cambio' },
  requisitos: { fill: 'fill-emerald-600', text: 'text-emerald-700 dark:text-emerald-300', chip: 'bg-emerald-600 text-white', label: 'Requisitos (transversal)' },
}

// ── Procedencia ──

const FIABILIDAD: Record<Fiabilidad, { label: string; title: string; cls: string }> = {
  curso: {
    label: 'Curso',
    title: 'Contenido de las diapositivas del curso.',
    cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-800',
  },
  oficial_leido: {
    label: 'Oficial · leído',
    title: 'Documento oficial de The Open Group leído completo.',
    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800',
  },
  oficial_indirecto: {
    label: 'Estándar · indirecto',
    title: 'Texto del estándar 9.x/10 citado mediante buscadores o espejos de la 9.1.',
    cls: 'bg-cyan-50 text-cyan-800 ring-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:ring-cyan-800',
  },
  secundario: {
    label: 'Fuente secundaria',
    title: 'Guías de terceros (Visual Paradigm, blogs, consultoras).',
    cls: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800',
  },
  no_contrastado: {
    label: 'No contrastado',
    title: 'Conocimiento previo no verificado con una fuente.',
    cls: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800',
  },
}

export function SourceBadge({ source, fiabilidad }: { source: Source; fiabilidad: Fiabilidad }) {
  const f = FIABILIDAD[source === 'curso' ? 'curso' : fiabilidad]
  return (
    <span
      title={f.title}
      className={cx('inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', f.cls)}
    >
      {source === 'complemento' && <span className="mr-1 opacity-70">Complemento ·</span>}
      {f.label}
    </span>
  )
}

// ── Botones y contenedores ──

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const VARIANT: Record<Variant, string> = {
  primary: 'bg-cyan-700 text-white hover:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 shadow-sm',
  secondary:
    'bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800',
  ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
}
const BASE_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 select-none'

export function Button({ variant = 'primary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={cx(BASE_BTN, VARIANT[variant], className)} {...props} />
}

export function ButtonLink({ variant = 'primary', className, ...props }: LinkProps & { variant?: Variant }) {
  return <Link className={cx(BASE_BTN, VARIANT[variant], className)} {...props} />
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx('rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800', className)}>
      {children}
    </div>
  )
}

export function PageHeader({ title, kicker, children }: { title: string; kicker?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6">
      {kicker && <div className="mb-1 text-sm font-medium text-cyan-700 dark:text-cyan-400">{kicker}</div>}
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{title}</h1>
      {children && <div className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">{children}</div>}
    </header>
  )
}

export function ProgressBar({ value, max, label, className }: { value: number; max: number; label: string; className?: string }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cx('h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', className)}
    >
      <div className="h-full rounded-full bg-cyan-600 transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 rounded-lg border-0 bg-white px-3 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </Card>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {children}
    </kbd>
  )
}
