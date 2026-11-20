import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { cx } from './ui'

const NAV: { to: string; label: string; end?: boolean; also?: string }[] = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/adm', label: 'Rueda ADM', also: '/fases' },
  { to: '/teoria', label: 'Teoría' },
  { to: '/tarjetas', label: 'Tarjetas' },
  { to: '/practica', label: 'Práctica' },
  { to: '/simulacro', label: 'Simulacro' },
  { to: '/progreso', label: 'Progreso' },
]

/** Sigue el tema del sistema hasta que la persona elige uno con el botón; solo entonces se guarda. */
function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  const toggle = () => {
    const next = !dark
    setDark(next)
    try {
      localStorage.setItem('togaf-theme', next ? 'dark' : 'light')
    } catch {
      // sin almacenamiento: el tema dura lo que la pestaña
    }
  }
  return [dark, toggle] as const
}

export default function Layout() {
  const [dark, toggleTheme] = useTheme()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-stone-50/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
              <circle cx="16" cy="16" r="14" className="fill-cyan-700 dark:fill-cyan-600" />
              <circle cx="16" cy="16" r="6" className="fill-white dark:fill-slate-950" />
            </svg>
            TOGAF Estudio
          </Link>
          <nav aria-label="Principal" className="hidden flex-1 items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavItem key={n.to} {...n} />
            ))}
          </nav>
          <button
            type="button"
            onClick={toggleTheme}
            className="ml-auto rounded-lg p-2 text-slate-600 hover:bg-slate-200/60 md:ml-0 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={dark ? 'Modo claro' : 'Modo oscuro'}
          >
            {dark ? (
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
        <nav aria-label="Principal (móvil)" className="-mt-1 flex gap-1 overflow-x-auto px-3 pb-2 md:hidden [scrollbar-width:none]">
          {NAV.map((n) => (
            <NavItem key={n.to} {...n} />
          ))}
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
        <p className="mx-auto max-w-3xl px-4">
          Material de estudio basado en las diapositivas del curso y en fuentes públicas sobre TOGAF®. No es un producto de The Open Group;
          las preguntas son de práctica y no oficiales. Tu progreso se guarda solo en este navegador.
        </p>
      </footer>
    </div>
  )
}

function NavItem({ to, label, end, also }: { to: string; label: string; end?: boolean; also?: string }) {
  const { pathname } = useLocation()
  const alsoActive = also !== undefined && pathname.startsWith(also)
  return (
    <NavLink
      to={to}
      end={end}
      aria-current={alsoActive ? 'page' : undefined}
      className={({ isActive }) =>
        cx(
          'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          isActive || alsoActive
            ? 'bg-cyan-700/10 text-cyan-800 dark:bg-cyan-400/10 dark:text-cyan-300'
            : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
        )
      }
    >
      {label}
    </NavLink>
  )
}
