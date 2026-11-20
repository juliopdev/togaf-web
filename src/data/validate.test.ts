// Validación de datos: corre en `pnpm validate:data` y antes de cada build.
// Un JSON roto rompe el deploy, no la web publicada.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import cursoJson from './raw/togaf_data.json'
import complementoJson from './raw/togaf_complemento.json'
import bancoJson from './raw/banco_preguntas.json'
import tarjetasJson from './raw/flashcards_complemento.json'
import { bancoSchema, complementoSchema, cursoSchema, tarjetasSchema } from './schema'
import {
  cards,
  complemento,
  curso,
  phases,
  questions,
  TEMA_FLASHCARD_CURSO,
  TEMA_QUIZ_COMPLEMENTO,
  temas,
} from './content'

const temaIds = new Set(temas.map((t) => t.id))

describe('esquemas de los JSON crudos', () => {
  it.each([
    ['togaf_data.json', cursoSchema, cursoJson],
    ['togaf_complemento.json', complementoSchema, complementoJson],
    ['banco_preguntas.json', bancoSchema, bancoJson],
    ['flashcards_complemento.json', tarjetasSchema, tarjetasJson],
  ] as const)('%s cumple su esquema', (_name, schema, json) => {
    const r = schema.safeParse(json)
    if (!r.success) throw new Error(JSON.stringify(r.error.issues.slice(0, 5), null, 2))
  })

  it('no publica datos personales del docente', () => {
    expect(cursoJson.meta).not.toHaveProperty('docente')
  })
})

describe('preguntas', () => {
  it('tienen ids únicos', () => {
    const ids = questions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('hay suficientes para un simulacro EA Part 1 (40)', () => {
    expect(questions.length).toBeGreaterThanOrEqual(40)
  })

  it.each(questions.map((q) => [q.id, q] as const))('%s es coherente', (_id, q) => {
    expect(q.opciones).toHaveLength(4)
    expect(new Set(q.opciones.map((o) => o.trim().toLowerCase())).size).toBe(4)
    expect(q.correcta).toBeGreaterThanOrEqual(0)
    expect(q.correcta).toBeLessThan(4)
    expect(temaIds.has(q.tema), `tema desconocido: ${q.tema}`).toBe(true)
    expect(q.enunciado.trim()).not.toBe('')
    expect(q.explicacion.trim()).not.toBe('')
  })

  it('todos los temas del quiz del complemento están mapeados', () => {
    for (const q of complemento.quiz) expect(TEMA_QUIZ_COMPLEMENTO, q.tema).toHaveProperty(q.tema)
  })

  it('los temas del banco están declarados en su meta', () => {
    const validos = new Set(bancoJson.meta.temas_validos)
    for (const q of bancoJson.preguntas) expect(validos.has(q.tema), q.tema).toBe(true)
  })

  it('las respuestas correctas no se concentran en una sola posición', () => {
    const porPosicion = [0, 1, 2, 3].map((i) => questions.filter((q) => q.correcta === i).length)
    for (const n of porPosicion) expect(n / questions.length).toBeLessThan(0.45)
  })
})

describe('tarjetas', () => {
  it('tienen ids únicos', () => {
    const ids = cards.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todas apuntan a un tema existente', () => {
    for (const c of cards) expect(temaIds.has(c.tema), `${c.id}: ${c.tema}`).toBe(true)
  })

  it('las fases de las flashcards del curso se resuelven', () => {
    for (const f of curso.flashcards) {
      const tema = TEMA_FLASHCARD_CURSO[f.fase] ?? `fase-${f.fase}`
      expect(temaIds.has(tema), f.fase).toBe(true)
    }
  })
})

describe('fases', () => {
  it('están las 10 y cada una tiene contenido', () => {
    expect(phases).toHaveLength(10)
    for (const p of phases) expect(p.sections.length, p.id).toBeGreaterThan(0)
  })

  it('cada fila del mapa curso↔estándar aparece en alguna fase', () => {
    const fasesTema = complemento.mapa_curso_estandar.filter((m) => /Fase/.test(m.tema))
    for (const m of fasesTema) {
      const usada = phases.some((p) =>
        p.sections.some((s) => s.blocks.some((b) => b.kind === 'table' && b.rows.some((r) => r[0] === m.tema))),
      )
      expect(usada, m.tema).toBe(true)
    }
  })

  it('cada grupo de entregables oficiales llega a alguna fase', () => {
    for (const e of complemento.content_framework.entregables_por_fase) {
      const usada = phases.some((p) =>
        p.sections.some((s) => s.blocks.some((b) => b.kind === 'list' && b.items === e.salidas)),
      )
      expect(usada, e.fase).toBe(true)
    }
  })
})

// Solo en local: comprueba que src/data/raw está sincronizado con ../togaf-estudio.
const fuente = join(process.cwd(), '..', 'togaf-estudio')
describe.skipIf(!existsSync(fuente))('sincronización con togaf-estudio', () => {
  it.each(['togaf_complemento.json', 'banco_preguntas.json', 'flashcards_complemento.json', 'togaf_data.json'])(
    '%s está al día (si falla: pnpm sync-data)',
    (name) => {
      const original = JSON.parse(readFileSync(join(fuente, name), 'utf8'))
      if (name === 'togaf_data.json') delete original.meta.docente
      const copia = JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'raw', name), 'utf8'))
      expect(copia).toEqual(original)
    },
  )
})
