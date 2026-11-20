// Rueda del ADM en SVG: Preliminar arriba, A–H en círculo (sentido horario desde arriba)
// y Gestión de Requisitos al centro. Cada fase es un enlace enfocable con teclado.
import { useNavigate } from 'react-router'
import { phaseById, phaseLabel, type PhaseId } from '../data/content'
import { cx, GROUP_STYLE } from './ui'

const CX = 180
const CY = 240
const R = 130
const NODE_R = 36
const RING: PhaseId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

const SHORT: Record<PhaseId, string[]> = {
  preliminar: ['Preliminar'],
  A: ['Visión'],
  B: ['Negocio'],
  C: ['Sistemas de', 'información'],
  D: ['Tecnología'],
  E: ['Oportunidades', 'y soluciones'],
  F: ['Migración'],
  G: ['Gobernanza'],
  H: ['Cambios'],
  REQ: ['Gestión de', 'Requisitos'],
}

function ringPos(i: number) {
  const a = ((-90 + i * 45) * Math.PI) / 180
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) }
}

export default function AdmWheel({ visited = [], className }: { visited?: string[]; className?: string }) {
  const navigate = useNavigate()
  const go = (id: PhaseId) => navigate(`/fases/${id}`)

  const nodes: { id: PhaseId; x: number; y: number; r: number }[] = [
    { id: 'preliminar', x: CX, y: 40, r: 30 },
    ...RING.map((id, i) => ({ id, ...ringPos(i), r: NODE_R })),
    { id: 'REQ', x: CX, y: CY, r: 54 },
  ]

  return (
    <svg viewBox="0 0 360 420" className={cx('mx-auto block h-auto w-full max-w-md select-none', className)} role="group" aria-label="Rueda del ADM de TOGAF">
      <title>Rueda del ADM de TOGAF</title>
      {/* Anillo y radios */}
      <circle cx={CX} cy={CY} r={R} fill="none" strokeWidth="10" className="stroke-slate-200 dark:stroke-slate-800" />
      {RING.map((id, i) => {
        const p = ringPos(i)
        return <line key={id} x1={CX} y1={CY} x2={p.x} y2={p.y} strokeWidth="1.5" strokeDasharray="3 4" className="stroke-slate-300 dark:stroke-slate-700" />
      })}
      <line x1={CX} y1={70} x2={CX} y2={CY - R - NODE_R} strokeWidth="3" className="stroke-slate-300 dark:stroke-slate-700" />

      {nodes.map(({ id, x, y, r }) => {
        const phase = phaseById.get(id)!
        const style = GROUP_STYLE[phase.group]
        const lines = SHORT[id]
        const isLetter = id !== 'preliminar' && id !== 'REQ'
        const seen = visited.includes(`fase:${id}`)
        return (
          <g
            key={id}
            role="link"
            tabIndex={0}
            aria-label={`${phaseLabel(phase)}${seen ? ' (vista)' : ''}`}
            onClick={() => go(id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                go(id)
              }
            }}
            className="group outline-none"
          >
            <title>{phaseLabel(phase)}</title>
            <circle cx={x} cy={y} r={r + 6} fill="none" strokeWidth="3" className="stroke-cyan-500 opacity-0 transition-opacity group-focus-visible:opacity-100" />
            <circle
              cx={x}
              cy={y}
              r={r}
              className={cx(style.fill, 'origin-center transition-transform duration-200 [transform-box:fill-box] group-hover:scale-[1.06]')}
            />
            {isLetter ? (
              <>
                <text x={x} y={y - 2} textAnchor="middle" className="pointer-events-none fill-white text-[22px] font-bold">
                  {phase.codigo}
                </text>
                {lines.map((l, i) => (
                  <text key={l} x={x} y={y + 13 + i * 9} textAnchor="middle" className="pointer-events-none fill-white/90 text-[8px] font-medium">
                    {l}
                  </text>
                ))}
              </>
            ) : (
              lines.map((l, i) => (
                <text
                  key={l}
                  x={x}
                  y={y + (i - (lines.length - 1) / 2) * 14 + 4}
                  textAnchor="middle"
                  className="pointer-events-none fill-white text-[12px] font-semibold"
                >
                  {l}
                </text>
              ))
            )}
            {seen && (
              <g className="pointer-events-none">
                <circle cx={x + r * 0.72} cy={y - r * 0.72} r="8" className="fill-white stroke-emerald-600 dark:fill-slate-950" strokeWidth="2" />
                <path
                  d={`M${x + r * 0.72 - 3.5} ${y - r * 0.72} l2.5 2.5 l4.5 -5`}
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="stroke-emerald-600"
                />
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
