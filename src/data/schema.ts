// Esquemas Zod de los JSON crudos (src/data/raw/). Solo modelan los campos que usa la web;
// si un JSON cambia de forma, la validación falla en `pnpm build` en vez de romper la página.
import { z } from 'zod'

const str = z.string()
const strs = z.array(str)

export const fiabilidadSchema = z.enum(['curso', 'oficial_leido', 'oficial_indirecto', 'secundario', 'no_contrastado'])

const phaseIdSchema = z.enum(['preliminar', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'REQ'])

const subdominioSchema = z.object({
  id: str,
  nombre: str,
  definicion: str,
  pasos: strs,
  salidas: strs,
  matrices: strs,
  diagramas: strs,
})

const faseSchema = z.object({
  id: phaseIdSchema,
  orden: z.number(),
  codigo: str,
  nombre: str,
  nombre_en: str,
  subtitulo: str.optional(),
  proposito: str,
  objetivos: strs,
  actividades: strs,
  entradas: strs,
  salidas: strs,
  diagramas_matrices: strs.optional(),
  dinamica: str,
  fuente: strs,
  cobertura: str.optional(),
  nota: str.optional(),
  subdominios: z.array(subdominioSchema).optional(),
  soluciones_tecnologicas: z.array(z.object({ bloque: str, ejemplos: strs })).optional(),
  ejemplo_practico: z
    .object({
      proyectos: z.array(z.object({ id: str, descripcion: str, prioridad: str })),
      dependencias: strs,
      plan: z.array(z.object({ etapa: z.number(), actividad: str, duracion: str })),
      riesgo: z.object({ descripcion: str, mitigacion: str }),
      recursos: str,
    })
    .optional(),
  elementos: z.array(z.object({ nombre: str, ejemplo: str })).optional(),
})

const nombreDetalle = z.array(z.object({ nombre: str, detalle: str }))

export const cursoSchema = z.object({
  meta: z.object({ curso: str, institucion: str, generado: str }),
  fuentes: z.array(z.object({ id: str, archivo: str, sesion: str, tema: str })),
  definiciones: z.record(z.object({ texto: str, fuente: str })),
  beneficios_ae: nombreDetalle,
  usos_togaf: strs,
  dominios: z.array(
    z.object({ id: str, nombre: str, funcion: str, descripcion: str, ejemplo: str, fase_adm: str, fuente: str }),
  ),
  importancia_ae: strs,
  transformacion_digital_pilares: nombreDetalle,
  fases: z.array(faseSchema).length(10),
  gobernabilidad: z.object({
    definicion: str,
    pilares: nombreDetalle,
    importancia: strs,
    componentes: strs,
    comite_arquitectura: z.object({ nombre: str, responsabilidades: strs }),
    trm: z.object({ nombre: str, definicion: str, partes: nombreDetalle, beneficios: strs }),
    fuente: str,
  }),
  frameworks: z.array(z.object({ nombre: str, descripcion: str })),
  metamodelo: z.object({
    definicion: str,
    capas: z.array(z.object({ nombre: str, contenido: str })),
    soporte_implementacion: strs,
  }),
  herramientas: z.object({ modelado: strs, arquitectura_empresarial: strs, gestion: strs, laboratorio_curso: strs }),
  casos: z.array(z.object({ id: str, titulo: str, usado_en: strs, descripcion: str })),
  glosario: z.array(z.object({ es: str, en: str, def: str })),
  flashcards: z.array(z.object({ origen: str, fase: str, q: str, a: str })),
  advertencias_material: strs,
})

const conFiabilidad = { fiabilidad: fiabilidadSchema }

export const complementoSchema = z.object({
  meta: z.object({ advertencia: str, niveles_fiabilidad: z.record(str) }),
  estructura_estandar: z.object({
    edicion_10: z.object({ fecha: str, fundamental_content: strs, series_guides_ejemplos: strs, ...conFiabilidad }),
    equivalencia_9x_a_10: z.array(z.object({ v9: str, v10: str })),
    historia: z.array(z.object({ version: str, fecha: str, nota: str.optional() })),
    novedades_10: strs,
    fiabilidad_novedades: fiabilidadSchema,
  }),
  preliminar: z.object({ pregunta_clave: str, objetivos: strs, pasos: strs, entradas: strs, salidas: strs, ...conFiabilidad }),
  gestion_requisitos: z.object({
    aclaracion: str,
    objetivos: strs,
    pasos: strs,
    entradas: strs,
    salidas: strs,
    nota_numeracion: str,
    ...conFiabilidad,
  }),
  content_framework: z.object({
    idea_central: str,
    categorias: z.array(z.object({ id: str, nombre: str, def: str, ejemplos: strs })),
    abb_vs_sbb: z.object({ ABB: str, SBB: str, cadena: str }),
    metamodelo_contenido: str,
    entregables_por_fase: z.array(z.object({ fase: str, salidas: strs, nota: str.optional() })),
    artefactos_por_fase: z.array(z.object({ fase: str, catalogos: strs, matrices: strs, diagramas: strs })),
    conteo_9x: z.object({ catalogos: z.number(), matrices: z.number(), diagramas: z.number(), total: z.number() }),
    puente_curso: str,
    ...conFiabilidad,
  }),
  enterprise_continuum: z.object({
    def: str,
    partes: z.array(z.object({ nombre: str, contenido: str })),
    niveles: strs,
    ejemplos_oficiales: z.array(z.object({ elemento: str, nivel: str })),
    ejemplos_soluciones_secundario: strs,
    relacion_repositorio: str,
    ...conFiabilidad,
  }),
  architecture_repository: z.object({
    clases_9x: z.array(z.object({ nombre: str, def: str, ...conFiabilidad })),
    areas_10: strs,
    fiabilidad_10: fiabilidadSchema,
  }),
  niveles_arquitectura: z.object({
    niveles: z.array(z.object({ nombre: str, muestra: str, uso: str })),
    dimensiones_alcance: strs,
    nota_horizontes: str,
    coherencia: str,
    ...conFiabilidad,
  }),
  tecnicas: z.object({
    lista_9_1: strs,
    iteracion: z.object({
      entre_ciclos: str,
      dentro_de_ciclo: z.array(z.object({ tipo: str, fases: str })),
      ...conFiabilidad,
    }),
    stakeholder_management: z.object({
      pasos: strs,
      matriz: z.array(z.object({ poder: str, interes: str, accion: str })),
      actitudes_10: strs,
      ...conFiabilidad,
    }),
    architecture_principles: z.object({
      plantilla: z.array(z.object({ parte: str, def: str })),
      cualidades_conjunto: strs,
      evitar_palabras: strs,
      ejemplo_propio_no_oficial: z.object({ name: str, statement: str, rationale: str, implications: str }),
      ...conFiabilidad,
    }),
    business_scenarios: z.object({ pasos: strs, regla: str, ...conFiabilidad }),
    gap_analysis: z.object({ def: str, matriz: str, regla: str, ...conFiabilidad }),
    migration_planning: z.array(z.object({ tecnica: str, para: str })),
    migration_planning_fiabilidad: fiabilidadSchema,
    interoperabilidad: z.object({ def: str, tipos: strs, grados: strs, ...conFiabilidad }),
    btra: str,
    riesgos: z.object({ niveles: strs, efecto: strs, frecuencia: strs, impacto_combinado: strs, ...conFiabilidad }),
    capability_based_planning: str,
    architecture_patterns: str,
  }),
  gobernanza_formal: z.object({
    capability_framework_9_1: strs,
    architecture_board: z.object({ rol: str, responsabilidades: strs, equivalente_curso: str }),
    architecture_contract: str,
    maturity_models: str,
    skills_framework: str,
    niveles_conformidad: z.array(z.object({ nivel: str, orden: z.number(), def: str })),
    nota_conformidad: str,
    ...conFiabilidad,
  }),
  archimate: z.object({
    relacion: str,
    mapeo_capas_fases: z.array(z.object({ fase: str, capa: str })),
    nota: str,
    herramienta_curso: str,
    ...conFiabilidad,
  }),
  certificacion: z.object({
    fuente: str,
    ...conFiabilidad,
    examenes: z.array(
      z.object({
        nombre: str,
        codigo: str.optional(),
        base: str,
        items: z.union([z.number(), str]),
        tipo: str.optional(),
        tiempo_min: z.union([z.number(), str]),
        aprobacion: str,
        libro: str.optional(),
        prerrequisitos: str.optional(),
        otorga: str.optional(),
      }),
    ),
    entrega: str,
  }),
  mapa_curso_estandar: z.array(z.object({ tema: str, curso: str, estandar: str })),
  quiz: z.array(
    z.object({ id: z.number(), tema: str, pregunta: str, opciones: z.array(str).length(4), correcta: z.number().int().min(0).max(3), explicacion: str }),
  ),
  pendientes: strs,
})

export const bancoSchema = z.object({
  meta: z.object({ temas_validos: strs }),
  preguntas: z.array(
    z.object({
      id: str,
      tema: str,
      source: z.enum(['curso', 'complemento']),
      fiabilidad: fiabilidadSchema,
      enunciado: str,
      opciones: z.array(str).length(4),
      correcta: z.number().int().min(0).max(3),
      explicacion: str,
    }),
  ),
})

export const tarjetasSchema = z.object({
  tarjetas: z.array(
    z.object({ id: str, tema: str, fase: phaseIdSchema.optional(), fiabilidad: fiabilidadSchema, front: str, back: str }),
  ),
})

export type CursoRaw = z.infer<typeof cursoSchema>
export type ComplementoRaw = z.infer<typeof complementoSchema>
export type FaseRaw = CursoRaw['fases'][number]
export type PhaseId = z.infer<typeof phaseIdSchema>
export type Fiabilidad = z.infer<typeof fiabilidadSchema>
export const PHASE_IDS = phaseIdSchema.options
