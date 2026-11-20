// Modelo normalizado que consume la web: fases, temas de teoría, tarjetas y preguntas.
// Los JSON se validan con Zod en los tests (`pnpm validate:data`, que corre antes de cada build);
// aquí solo se tipan, para no cargar Zod en el bundle del navegador.
import cursoJson from './raw/togaf_data.json'
import complementoJson from './raw/togaf_complemento.json'
import bancoJson from './raw/banco_preguntas.json'
import tarjetasJson from './raw/flashcards_complemento.json'
import type { ComplementoRaw, CursoRaw, FaseRaw, Fiabilidad, PhaseId } from './schema'
import type { bancoSchema, tarjetasSchema } from './schema'
import type { z } from 'zod'

export type { Fiabilidad, PhaseId }
export type Source = 'curso' | 'complemento'

export const curso = cursoJson as unknown as CursoRaw
export const complemento = complementoJson as unknown as ComplementoRaw
const banco = bancoJson as unknown as z.infer<typeof bancoSchema>
const tarjetas = tarjetasJson as unknown as z.infer<typeof tarjetasSchema>

// ───────────────────────── Bloques de contenido ─────────────────────────

export type Block =
  | { kind: 'text'; text: string; label?: string }
  | { kind: 'list'; items: string[]; ordered?: boolean; label?: string }
  | { kind: 'defs'; items: { term: string; def: string }[]; label?: string }
  | { kind: 'table'; columns: string[]; rows: string[][]; label?: string }
  | { kind: 'note'; tone: 'info' | 'warn'; text: string }

export interface Section {
  title: string
  source: Source
  fiabilidad: Fiabilidad
  blocks: Block[]
}

const text = (t: string, label?: string): Block => ({ kind: 'text', text: t, label })
const list = (items: string[], label?: string, ordered = false): Block => ({ kind: 'list', items, label, ordered })
const defs = (items: { term: string; def: string }[], label?: string): Block => ({ kind: 'defs', items, label })
const table = (columns: string[], rows: string[][], label?: string): Block => ({ kind: 'table', columns, rows, label })
const note = (t: string, tone: 'info' | 'warn' = 'info'): Block => ({ kind: 'note', tone, text: t })

const sec = (title: string, source: Source, fiabilidad: Fiabilidad, blocks: (Block | null | false)[]): Section | null => {
  const kept = blocks.filter((b): b is Block => {
    if (!b) return false
    if (b.kind === 'list' || b.kind === 'defs') return b.items.length > 0
    if (b.kind === 'table') return b.rows.length > 0
    return b.text.trim().length > 0
  })
  return kept.length ? { title, source, fiabilidad, blocks: kept } : null
}
const compact = (xs: (Section | null)[]) => xs.filter((x): x is Section => x !== null)

// ───────────────────────── Fases ─────────────────────────

export type PhaseGroup = 'marco' | 'vision' | 'diseno' | 'planificacion' | 'gobierno' | 'requisitos'

export interface Caso {
  id: string
  titulo: string
  descripcion: string
}

export interface Phase {
  id: PhaseId
  orden: number
  codigo: string
  nombre: string
  nombre_en: string
  subtitulo?: string
  proposito: string
  group: PhaseGroup
  tema: string
  sections: Section[]
  casos: Caso[]
}

const GROUP: Record<PhaseId, PhaseGroup> = {
  preliminar: 'marco',
  A: 'vision',
  B: 'diseno',
  C: 'diseno',
  D: 'diseno',
  E: 'planificacion',
  F: 'planificacion',
  G: 'gobierno',
  H: 'gobierno',
  REQ: 'requisitos',
}

export const temaDeFase = (id: PhaseId) => `fase-${id}`

/** Claves con que el complemento y los casos se refieren a cada fase. */
const ETIQUETAS: Record<PhaseId, string[]> = {
  preliminar: ['Preliminar'],
  A: ['A'],
  B: ['B', 'B/C/D'],
  C: ['C', 'C-datos', 'C-aplicaciones', 'B/C/D'],
  D: ['D', 'B/C/D'],
  E: ['E', 'E-F'],
  F: ['F', 'E-F'],
  G: ['G'],
  H: ['H'],
  REQ: ['Requisitos'],
}

const coincideFase = (id: PhaseId, etiqueta: string) => ETIQUETAS[id].includes(etiqueta)

function seccionesCurso(f: FaseRaw): Section[] {
  const s: (Section | null)[] = []
  const nota = [f.nota, f.cobertura].filter(Boolean).join(' ')
  s.push(sec('Propósito', 'curso', 'curso', [text(f.proposito), nota ? note(nota, 'warn') : null]))
  s.push(sec('Objetivos', 'curso', 'curso', [list(f.objetivos)]))
  s.push(sec(f.id === 'D' ? 'Pasos' : 'Actividades', 'curso', 'curso', [list(f.actividades, undefined, f.id === 'D')]))
  for (const sd of f.subdominios ?? []) {
    s.push(
      sec(sd.nombre, 'curso', 'curso', [
        text(sd.definicion),
        list(sd.pasos, 'Pasos', true),
        list(sd.salidas, 'Salidas'),
        list(sd.matrices, 'Matrices'),
        list(sd.diagramas, 'Diagramas'),
      ]),
    )
  }
  s.push(sec('Entradas y salidas', 'curso', 'curso', [list(f.entradas, 'Entradas'), list(f.salidas, 'Salidas')]))
  s.push(sec('Diagramas y matrices', 'curso', 'curso', [list(f.diagramas_matrices ?? [])]))
  if (f.soluciones_tecnologicas) {
    s.push(
      sec('Soluciones tecnológicas', 'curso', 'curso', [
        table(['Bloque', 'Ejemplos'], f.soluciones_tecnologicas.map((b) => [b.bloque, b.ejemplos.join(', ')])),
      ]),
    )
  }
  if (f.ejemplo_practico) {
    const e = f.ejemplo_practico
    s.push(
      sec('Ejemplo práctico', 'curso', 'curso', [
        table(['Proyecto', 'Descripción', 'Prioridad'], e.proyectos.map((p) => [p.id, p.descripcion, p.prioridad]), 'Proyectos'),
        list(e.dependencias, 'Dependencias'),
        table(['Etapa', 'Actividad', 'Duración'], e.plan.map((p) => [String(p.etapa), p.actividad, p.duracion]), 'Plan'),
        defs([{ term: e.riesgo.descripcion, def: `Mitigación: ${e.riesgo.mitigacion}` }], 'Riesgo'),
        text(e.recursos, 'Recursos'),
      ]),
    )
  }
  if (f.elementos) {
    s.push(sec('Elementos de la gobernanza', 'curso', 'curso', [defs(f.elementos.map((x) => ({ term: x.nombre, def: x.ejemplo })))]))
  }
  s.push(sec('Dinámica de clase', 'curso', 'curso', [text(f.dinamica)]))
  return compact(s)
}

function seccionesComplemento(id: PhaseId): Section[] {
  const c = complemento
  const cf = c.content_framework
  const s: (Section | null)[] = []

  if (id === 'preliminar') {
    const p = c.preliminar
    s.push(
      sec('Según el estándar', 'complemento', p.fiabilidad, [
        note(`Pregunta clave: «${p.pregunta_clave}»`),
        list(p.objetivos, 'Objetivos'),
        list(p.pasos, 'Pasos', true),
        list(p.entradas, 'Entradas'),
        list(p.salidas, 'Salidas'),
      ]),
    )
  }
  if (id === 'REQ') {
    const r = c.gestion_requisitos
    s.push(
      sec('Según el estándar', 'complemento', r.fiabilidad, [
        note(r.aclaracion),
        list(r.objetivos, 'Objetivos'),
        list(r.pasos, 'Pasos', true),
        list(r.entradas, 'Entradas'),
        list(r.salidas, 'Salidas'),
        note(r.nota_numeracion),
      ]),
    )
  }

  const entregables = cf.entregables_por_fase.filter((e) => coincideFase(id, e.fase))
  const artefactos = cf.artefactos_por_fase.filter((a) => coincideFase(id, a.fase))
  s.push(
    sec('Entregables y artefactos oficiales', 'complemento', cf.fiabilidad, [
      ...entregables.flatMap((e) => [
        list(e.salidas, entregables.length > 1 || e.fase.includes('/') ? `Salidas (${e.fase})` : 'Salidas formales'),
        e.nota ? note(e.nota, 'warn') : null,
      ]),
      artefactos.length
        ? table(
            ['Grupo', 'Catálogos', 'Matrices', 'Diagramas'],
            artefactos.map((a) => [a.fase, a.catalogos.join(', ') || '—', a.matrices.join(', ') || '—', a.diagramas.join(', ') || '—']),
            'Artefactos (TOGAF 9.x)',
          )
        : null,
      id === 'C' || id === 'D' ? note(cf.puente_curso) : null,
    ]),
  )

  if (id === 'A') {
    s.push(sec('Técnica asociada', 'complemento', 'oficial_indirecto', [text(c.tecnicas.btra)]))
  }

  const letra = id === 'preliminar' || id === 'REQ' ? null : id
  const mapa = letra
    ? c.mapa_curso_estandar.filter((m) => new RegExp(`Fases? (?:[A-H]/)?${letra}\\b|Fases? ${letra}/`).test(m.tema))
    : []
  const capa = c.archimate.mapeo_capas_fases.filter((m) => coincideFase(id, m.fase))
  s.push(
    sec('Curso vs. estándar', 'complemento', 'oficial_indirecto', [
      table(['Tema', 'En el curso', 'En el estándar'], mapa.map((m) => [m.tema, m.curso, m.estandar])),
      capa.length ? text(capa.map((m) => m.capa).join('; '), 'Capa ArchiMate equivalente') : null,
    ]),
  )
  return compact(s)
}

function casosDeFase(f: FaseRaw): Caso[] {
  const clave = f.id === 'preliminar' ? 'Preliminar' : f.id
  return curso.casos
    .filter((c) => c.usado_en.includes(clave))
    .map(({ id, titulo, descripcion }) => ({ id, titulo, descripcion }))
}

export const phases: Phase[] = curso.fases.map((f) => ({
  id: f.id,
  orden: f.orden,
  codigo: f.codigo,
  nombre: f.nombre,
  nombre_en: f.nombre_en,
  subtitulo: f.subtitulo,
  proposito: f.proposito,
  group: GROUP[f.id],
  tema: temaDeFase(f.id),
  sections: [...seccionesCurso(f), ...seccionesComplemento(f.id)],
  casos: casosDeFase(f),
}))

export const phaseById = new Map(phases.map((p) => [p.id, p]))

/** «Fase A · Visión de la Arquitectura», «Fase Preliminar», «Gestión de Requisitos». */
export function phaseLabel(p: Pick<Phase, 'id' | 'codigo' | 'nombre'>): string {
  if (p.id === 'preliminar') return 'Fase Preliminar'
  if (p.id === 'REQ') return 'Gestión de Requisitos'
  return `Fase ${p.codigo} · ${p.nombre}`
}
/** Orden de lectura del ciclo: Preliminar, A–H y Requisitos al final. */
export const phasesInOrder = [...phases].sort((a, b) => a.orden - b.orden)

// ───────────────────────── Temas de teoría ─────────────────────────

export interface Topic {
  id: string
  title: string
  summary: string
  group: Source
  sections: Section[]
}

function topicsCurso(): Topic[] {
  const d = curso
  const g = d.gobernabilidad
  const gf = complemento.gobernanza_formal
  return [
    {
      id: 'ae',
      title: 'Arquitectura empresarial y dominios',
      summary: 'Qué es la AE, sus cuatro dominios, beneficios y relación con la transformación digital.',
      group: 'curso',
      sections: compact([
        sec('Definición', 'curso', 'curso', [text(d.definiciones.arquitectura_empresarial?.texto ?? '')]),
        sec('Los cuatro dominios', 'curso', 'curso', [
          table(
            ['Dominio', 'Función', 'Descripción', 'Ejemplo', 'Fase ADM'],
            d.dominios.map((x) => [x.nombre, x.funcion, x.descripcion, x.ejemplo, x.fase_adm]),
          ),
        ]),
        sec('Beneficios', 'curso', 'curso', [defs(d.beneficios_ae.map((b) => ({ term: b.nombre, def: b.detalle })))]),
        sec('Importancia', 'curso', 'curso', [list(d.importancia_ae)]),
        sec('Pilares de la transformación digital', 'curso', 'curso', [
          defs(d.transformacion_digital_pilares.map((b) => ({ term: b.nombre, def: b.detalle }))),
        ]),
      ]),
    },
    {
      id: 'togaf-adm',
      title: 'TOGAF y el ADM',
      summary: 'Qué es TOGAF, para qué sirve y cómo se organiza el ciclo ADM.',
      group: 'curso',
      sections: compact([
        sec('Qué es TOGAF', 'curso', 'curso', [text(d.definiciones.togaf?.texto ?? '')]),
        sec('Para qué se usa', 'curso', 'curso', [list(d.usos_togaf)]),
        sec('El ciclo ADM', 'curso', 'curso', [
          text(d.definiciones.adm?.texto ?? ''),
          list(
            phasesInOrder.map((p) => `${p.codigo === '—' ? 'Centro' : p.codigo} · ${p.nombre} (${p.nombre_en})`),
            'Fases',
          ),
        ]),
        sec('Novedades de la edición 10', 'complemento', complemento.estructura_estandar.fiabilidad_novedades, [
          list(complemento.estructura_estandar.novedades_10),
        ]),
      ]),
    },
    {
      id: 'gobernanza',
      title: 'Gobernabilidad, TRM y conformidad',
      summary: 'Pilares de la gobernabilidad, Comité de Arquitectura, TRM y niveles de conformidad del estándar.',
      group: 'curso',
      sections: compact([
        sec('Gobernabilidad de arquitectura', 'curso', 'curso', [
          text(g.definicion),
          defs(g.pilares.map((p) => ({ term: p.nombre, def: p.detalle })), 'Pilares'),
          list(g.importancia, 'Importancia'),
          list(g.componentes, 'Componentes'),
        ]),
        sec(g.comite_arquitectura.nombre, 'curso', 'curso', [list(g.comite_arquitectura.responsabilidades, 'Responsabilidades')]),
        sec(g.trm.nombre, 'curso', 'curso', [
          text(g.trm.definicion),
          defs(g.trm.partes.map((p) => ({ term: p.nombre, def: p.detalle })), 'Partes'),
          list(g.trm.beneficios, 'Beneficios'),
        ]),
        sec('Architecture Board (estándar)', 'complemento', gf.fiabilidad, [
          text(gf.architecture_board.rol),
          list(gf.architecture_board.responsabilidades, 'Responsabilidades'),
          note(`Equivale en el curso a: ${gf.architecture_board.equivalente_curso}.`),
        ]),
        sec('Niveles de conformidad', 'complemento', gf.fiabilidad, [
          table(
            ['Nivel', 'Significado'],
            [...gf.niveles_conformidad].sort((a, b) => a.orden - b.orden).map((n) => [n.nivel, n.def]),
          ),
          note(gf.nota_conformidad),
        ]),
        sec('Architecture Capability Framework', 'complemento', gf.fiabilidad, [
          list(gf.capability_framework_9_1, 'Componentes (9.1)'),
          defs([
            { term: 'Architecture Contract', def: gf.architecture_contract },
            { term: 'Maturity Models', def: gf.maturity_models },
            { term: 'Skills Framework', def: gf.skills_framework },
          ]),
        ]),
      ]),
    },
    {
      id: 'frameworks',
      title: 'Frameworks, metamodelo y herramientas',
      summary: 'TOGAF frente a Zachman, FEAF y Gartner; el metamodelo y las herramientas del curso.',
      group: 'curso',
      sections: compact([
        sec('Frameworks de AE', 'curso', 'curso', [defs(d.frameworks.map((f) => ({ term: f.nombre, def: f.descripcion })))]),
        sec('Metamodelo', 'curso', 'curso', [
          text(d.metamodelo.definicion),
          defs(d.metamodelo.capas.map((c) => ({ term: c.nombre, def: c.contenido })), 'Capas'),
          list(d.metamodelo.soporte_implementacion, 'Soporte a la implementación'),
        ]),
        sec('Herramientas', 'curso', 'curso', [
          list(d.herramientas.modelado, 'Modelado'),
          list(d.herramientas.arquitectura_empresarial, 'Arquitectura empresarial'),
          list(d.herramientas.gestion, 'Gestión'),
          list(d.herramientas.laboratorio_curso, 'Laboratorio del curso'),
        ]),
        sec('Metamodelo en el estándar', 'complemento', 'oficial_indirecto', [text(complemento.content_framework.metamodelo_contenido)]),
      ]),
    },
    {
      id: 'glosario',
      title: 'Glosario',
      summary: 'Términos clave en español e inglés.',
      group: 'curso',
      sections: compact([
        sec('Términos', 'curso', 'curso', [table(['Español', 'Inglés', 'Definición'], d.glosario.map((t) => [t.es, t.en, t.def]))]),
      ]),
    },
  ]
}

function topicsComplemento(): Topic[] {
  const c = complemento
  const e = c.estructura_estandar
  const cf = c.content_framework
  const ec = c.enterprise_continuum
  const ar = c.architecture_repository
  const na = c.niveles_arquitectura
  const t = c.tecnicas
  return [
    {
      id: 'estandar',
      title: 'Estructura del estándar',
      summary: 'Documentos de la edición 10, equivalencias con la 9.x e historia de versiones.',
      group: 'complemento',
      sections: compact([
        sec(`Edición 10 (${e.edicion_10.fecha})`, 'complemento', e.edicion_10.fiabilidad, [
          list(e.edicion_10.fundamental_content, 'Fundamental Content', true),
          list(e.edicion_10.series_guides_ejemplos, 'Ejemplos de Series Guides'),
        ]),
        sec('De la 9.x a la 10', 'complemento', e.edicion_10.fiabilidad, [
          table(['TOGAF 9.x', 'TOGAF 10'], e.equivalencia_9x_a_10.map((x) => [x.v9, x.v10])),
        ]),
        sec('Novedades de la edición 10', 'complemento', e.fiabilidad_novedades, [list(e.novedades_10)]),
        sec('Historia', 'complemento', 'secundario', [
          table(['Versión', 'Fecha', 'Nota'], e.historia.map((h) => [h.version, h.fecha || '—', h.nota ?? ''])),
        ]),
      ]),
    },
    {
      id: 'content-framework',
      title: 'Content Framework',
      summary: 'Entregables, artefactos y building blocks (ABB y SBB).',
      group: 'complemento',
      sections: compact([
        sec('Idea central', 'complemento', cf.fiabilidad, [note(cf.idea_central)]),
        sec('Categorías de contenido', 'complemento', cf.fiabilidad, [
          table(['Categoría', 'Definición', 'Ejemplos'], cf.categorias.map((x) => [x.nombre, x.def, x.ejemplos.join(', ')])),
        ]),
        sec('ABB vs. SBB', 'complemento', cf.fiabilidad, [
          defs([
            { term: 'ABB', def: cf.abb_vs_sbb.ABB },
            { term: 'SBB', def: cf.abb_vs_sbb.SBB },
          ]),
          note(cf.abb_vs_sbb.cadena),
        ]),
        sec('Entregables por fase', 'complemento', cf.fiabilidad, [
          table(['Fase', 'Salidas'], cf.entregables_por_fase.map((x) => [x.fase, x.salidas.join(' · ') + (x.nota ? ` (${x.nota})` : '')])),
        ]),
        sec('Artefactos por fase (9.x)', 'complemento', cf.fiabilidad, [
          table(
            ['Fase', 'Catálogos', 'Matrices', 'Diagramas'],
            cf.artefactos_por_fase.map((a) => [a.fase, a.catalogos.join(', ') || '—', a.matrices.join(', ') || '—', a.diagramas.join(', ') || '—']),
          ),
          note(
            `TOGAF 9.x define ${cf.conteo_9x.catalogos} catálogos, ${cf.conteo_9x.matrices} matrices y ${cf.conteo_9x.diagramas} diagramas (${cf.conteo_9x.total} en total, según fuentes secundarias).`,
          ),
        ]),
        sec('Puente con el curso', 'complemento', 'secundario', [text(cf.puente_curso)]),
      ]),
    },
    {
      id: 'continuum',
      title: 'Enterprise Continuum y repositorio',
      summary: 'Cómo se clasifican los activos (continuo) y dónde se guardan (repositorio).',
      group: 'complemento',
      sections: compact([
        sec('Enterprise Continuum', 'complemento', ec.fiabilidad, [
          text(ec.def),
          defs(ec.partes.map((p) => ({ term: p.nombre, def: p.contenido })), 'Partes'),
          list(ec.niveles, 'Niveles (de genérico a específico)', true),
          table(['Elemento', 'Nivel'], ec.ejemplos_oficiales.map((x) => [x.elemento, x.nivel]), 'Ejemplos oficiales'),
        ]),
        sec('Ejemplos de soluciones', 'complemento', 'secundario', [list(ec.ejemplos_soluciones_secundario)]),
        sec('Continuo vs. repositorio', 'complemento', ec.fiabilidad, [note(ec.relacion_repositorio)]),
        sec('Architecture Repository (9.x)', 'complemento', 'oficial_indirecto', [
          defs(ar.clases_9x.map((x) => ({ term: x.nombre + (x.fiabilidad === 'no_contrastado' ? ' (no contrastado)' : ''), def: x.def }))),
        ]),
        sec('Áreas del repositorio en la edición 10', 'complemento', ar.fiabilidad_10, [list(ar.areas_10)]),
      ]),
    },
    {
      id: 'niveles',
      title: 'Niveles de arquitectura',
      summary: 'Strategic, Segment y Capability Architecture, y las dimensiones del alcance.',
      group: 'complemento',
      sections: compact([
        sec('Niveles', 'complemento', na.fiabilidad, [table(['Nivel', 'Qué muestra', 'Para qué'], na.niveles.map((n) => [n.nombre, n.muestra, n.uso]))]),
        sec('Dimensiones del alcance', 'complemento', na.fiabilidad, [list(na.dimensiones_alcance), note(na.nota_horizontes, 'warn')]),
        sec('Coherencia', 'complemento', na.fiabilidad, [text(na.coherencia)]),
      ]),
    },
    {
      id: 'tecnicas',
      title: 'Técnicas del ADM',
      summary: 'Iteración, stakeholders, principios, escenarios de negocio, brechas, migración, interoperabilidad y riesgos.',
      group: 'complemento',
      sections: compact([
        sec('Técnicas de TOGAF 9.1', 'complemento', 'oficial_indirecto', [list(t.lista_9_1)]),
        sec('Iteración', 'complemento', t.iteracion.fiabilidad, [
          text(t.iteracion.entre_ciclos, 'Entre ciclos'),
          table(['Tipo', 'Fases'], t.iteracion.dentro_de_ciclo.map((x) => [x.tipo, x.fases]), 'Dentro de un ciclo'),
        ]),
        sec('Gestión de interesados', 'complemento', t.stakeholder_management.fiabilidad, [
          list(t.stakeholder_management.pasos, 'Pasos', true),
          table(['Poder', 'Interés', 'Acción'], t.stakeholder_management.matriz.map((m) => [m.poder, m.interes, m.accion]), 'Matriz poder/interés'),
          list(t.stakeholder_management.actitudes_10, 'Actitudes (ed. 10)'),
        ]),
        sec('Principios de arquitectura', 'complemento', t.architecture_principles.fiabilidad, [
          defs(t.architecture_principles.plantilla.map((p) => ({ term: p.parte, def: p.def })), 'Plantilla'),
          list(t.architecture_principles.cualidades_conjunto, 'Cualidades del conjunto'),
          list(t.architecture_principles.evitar_palabras, 'Palabras a evitar'),
          defs(
            [
              { term: 'Name', def: t.architecture_principles.ejemplo_propio_no_oficial.name },
              { term: 'Statement', def: t.architecture_principles.ejemplo_propio_no_oficial.statement },
              { term: 'Rationale', def: t.architecture_principles.ejemplo_propio_no_oficial.rationale },
              { term: 'Implications', def: t.architecture_principles.ejemplo_propio_no_oficial.implications },
            ],
            'Ejemplo propio (no oficial)',
          ),
        ]),
        sec('Business Scenarios', 'complemento', t.business_scenarios.fiabilidad, [
          list(t.business_scenarios.pasos, 'Pasos', true),
          note(t.business_scenarios.regla),
        ]),
        sec('Análisis de brechas', 'complemento', t.gap_analysis.fiabilidad, [
          text(t.gap_analysis.def),
          text(t.gap_analysis.matriz, 'Matriz'),
          note(t.gap_analysis.regla),
        ]),
        sec('Técnicas de planificación de la migración', 'complemento', t.migration_planning_fiabilidad, [
          defs(t.migration_planning.map((m) => ({ term: m.tecnica, def: m.para }))),
        ]),
        sec('Interoperabilidad', 'complemento', t.interoperabilidad.fiabilidad, [
          text(t.interoperabilidad.def),
          list(t.interoperabilidad.tipos, 'Tipos'),
          list(t.interoperabilidad.grados, 'Grados'),
        ]),
        sec('Gestión de riesgos', 'complemento', t.riesgos.fiabilidad, [
          list(t.riesgos.niveles, 'Niveles'),
          list(t.riesgos.efecto, 'Efecto'),
          list(t.riesgos.frecuencia, 'Frecuencia'),
          list(t.riesgos.impacto_combinado, 'Impacto combinado'),
        ]),
        sec('Otras técnicas', 'complemento', 'oficial_indirecto', [
          defs([
            { term: 'Business Transformation Readiness Assessment', def: t.btra },
            { term: 'Capability-Based Planning', def: t.capability_based_planning },
            { term: 'Architecture Patterns', def: t.architecture_patterns },
          ]),
        ]),
      ]),
    },
    {
      id: 'archimate',
      title: 'ArchiMate',
      summary: 'El lenguaje de modelado que complementa a TOGAF y su relación con las fases.',
      group: 'complemento',
      sections: compact([
        sec('Relación con TOGAF', 'complemento', c.archimate.fiabilidad, [text(c.archimate.relacion)]),
        sec('Capas y fases', 'complemento', c.archimate.fiabilidad, [
          table(['Fase ADM', 'Capa ArchiMate'], c.archimate.mapeo_capas_fases.map((m) => [m.fase, m.capa])),
          note(c.archimate.nota),
          text(c.archimate.herramienta_curso, 'En el curso'),
        ]),
      ]),
    },
    {
      id: 'certificacion',
      title: 'Certificación',
      summary: 'Formato de los exámenes oficiales de TOGAF.',
      group: 'complemento',
      sections: compact([
        sec('Exámenes', 'complemento', c.certificacion.fiabilidad, [
          table(
            ['Examen', 'Código', 'Preguntas', 'Minutos', 'Aprobación', 'Libro'],
            c.certificacion.examenes.map((x) => [x.nombre, x.codigo ?? '—', String(x.items), String(x.tiempo_min), x.aprobacion, x.libro ?? '—']),
          ),
          note(`Fuente: ${c.certificacion.fuente}.`),
        ]),
        sec('Detalle de EA Part 1 y Part 2', 'complemento', c.certificacion.fiabilidad, [
          defs(
            c.certificacion.examenes
              .filter((x) => x.codigo === 'OGEA-101' || x.codigo === 'OGEA-102')
              .map((x) => ({ term: x.nombre, def: [x.tipo, `Prerrequisitos: ${x.prerrequisitos}`, `Otorga: ${x.otorga}`].join('. ') })),
          ),
          text(c.certificacion.entrega, 'Modalidad'),
        ]),
      ]),
    },
  ]
}

export const topics: Topic[] = [...topicsCurso(), ...topicsComplemento()]
export const topicById = new Map(topics.map((t) => [t.id, t]))

// ───────────────────────── Temas (para filtros y estadísticas) ─────────────────────────

export const temas: { id: string; label: string; kind: 'fase' | 'topic' }[] = [
  ...phasesInOrder.map((p) => ({ id: p.tema, label: phaseLabel(p), kind: 'fase' as const })),
  ...topics.map((t) => ({ id: t.id, label: t.title, kind: 'topic' as const })),
]
const temaLabel = new Map(temas.map((t) => [t.id, t.label]))
export const labelDeTema = (id: string) => temaLabel.get(id) ?? id

export const faseDeTema = (tema: string): PhaseId | undefined => {
  const m = /^fase-(.+)$/.exec(tema)
  return m && phaseById.has(m[1] as PhaseId) ? (m[1] as PhaseId) : undefined
}

// ───────────────────────── Preguntas ─────────────────────────

export interface Question {
  id: string
  enunciado: string
  opciones: string[]
  correcta: number
  explicacion: string
  tema: string
  fase?: PhaseId
  source: Source
  fiabilidad: Fiabilidad
}

/** Temas del quiz original del complemento → ids de tema de la web. */
export const TEMA_QUIZ_COMPLEMENTO: Record<string, string> = {
  ADM: 'togaf-adm',
  'Fase A': 'fase-A',
  'Fase H': 'fase-H',
  'Content Framework': 'content-framework',
  Entregables: 'content-framework',
  Continuum: 'continuum',
  Repositorio: 'continuum',
  Niveles: 'niveles',
  Principios: 'tecnicas',
  'Gap Analysis': 'tecnicas',
  Stakeholders: 'tecnicas',
  Técnicas: 'tecnicas',
  Iteración: 'tecnicas',
  Gobernanza: 'gobernanza',
  Certificación: 'certificacion',
  ArchiMate: 'archimate',
  Requisitos: 'fase-REQ',
}

const FIABILIDAD_QUIZ: Record<string, Fiabilidad> = {
  Certificación: 'oficial_leido',
  ArchiMate: 'secundario',
  Iteración: 'secundario',
  Stakeholders: 'secundario',
}

export const questions: Question[] = [
  ...complemento.quiz.map((q) => {
    const tema = TEMA_QUIZ_COMPLEMENTO[q.tema] ?? q.tema
    return {
      id: `q${q.id}`,
      enunciado: q.pregunta,
      opciones: q.opciones,
      correcta: q.correcta,
      explicacion: q.explicacion,
      tema,
      fase: faseDeTema(tema),
      source: 'complemento' as const,
      fiabilidad: FIABILIDAD_QUIZ[q.tema] ?? ('oficial_indirecto' as const),
    }
  }),
  ...banco.preguntas.map((q) => ({
    id: q.id,
    enunciado: q.enunciado,
    opciones: q.opciones,
    correcta: q.correcta,
    explicacion: q.explicacion,
    tema: q.tema,
    fase: faseDeTema(q.tema),
    source: q.source,
    fiabilidad: q.fiabilidad,
  })),
]

// ───────────────────────── Tarjetas ─────────────────────────

export interface Card {
  id: string
  front: string
  back: string
  tema: string
  fase?: PhaseId
  source: Source
  fiabilidad: Fiabilidad
}

/** Campo `fase` de las flashcards del curso → tema de la web. */
export const TEMA_FLASHCARD_CURSO: Record<string, string> = {
  AE: 'ae',
  TOGAF: 'togaf-adm',
  ADM: 'togaf-adm',
  'Prel.': 'fase-preliminar',
  'C/D': 'fase-C',
  'Gob.': 'gobernanza',
  TRM: 'gobernanza',
  Frameworks: 'frameworks',
  Metamodelo: 'frameworks',
  Herramientas: 'frameworks',
}

export const cards: Card[] = [
  ...curso.flashcards.map((f, i) => {
    const tema = TEMA_FLASHCARD_CURSO[f.fase] ?? `fase-${f.fase}`
    return { id: `f${i + 1}`, front: f.q, back: f.a, tema, fase: faseDeTema(tema), source: 'curso' as const, fiabilidad: 'curso' as const }
  }),
  ...curso.glosario.map((g, i) => ({
    id: `g${i + 1}`,
    front: g.es,
    back: g.es === g.en ? g.def : `${g.en} — ${g.def}`,
    tema: 'glosario',
    source: 'curso' as const,
    fiabilidad: 'curso' as const,
  })),
  ...tarjetas.tarjetas.map((t) => ({
    id: t.id,
    front: t.front,
    back: t.back,
    tema: t.tema,
    fase: t.fase ?? faseDeTema(t.tema),
    source: 'complemento' as const,
    fiabilidad: t.fiabilidad,
  })),
]

export const advertencias = curso.advertencias_material
export const fuentes = curso.fuentes
export const NIVELES_FIABILIDAD = complemento.meta.niveles_fiabilidad
