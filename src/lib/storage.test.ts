import { emptyProgress, exportProgress, markVisited, parseImport, progressStore, recordAnswers, recordCard, STORAGE_KEY } from './storage'

beforeEach(() => {
  localStorage.clear()
  progressStore.reload()
})

describe('progreso', () => {
  it('persiste en localStorage y sobrevive a una recarga', () => {
    recordCard('f1', { box: 2, due: '2026-11-21', reviews: 1, lapses: 0 })
    recordAnswers([{ id: 'c01', ok: true }, { id: 'c01', ok: false }])
    markVisited('fase:A')
    markVisited('fase:A')
    progressStore.reload()
    const p = progressStore.get()
    expect(p.cards.f1?.box).toBe(2)
    expect(p.questions.c01).toEqual({ seen: 2, correct: 1, last: false })
    expect(p.visited).toEqual(['fase:A'])
  })

  it('ignora datos corruptos o de otra versión', () => {
    localStorage.setItem(STORAGE_KEY, '{no es json')
    progressStore.reload()
    expect(progressStore.get()).toEqual(emptyProgress())
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, cards: { x: 1 } }))
    progressStore.reload()
    expect(progressStore.get()).toEqual(emptyProgress())
  })

  it('exportar → reiniciar → importar restaura el progreso', async () => {
    recordCard('k01', { box: 4, due: '2026-11-27', reviews: 5, lapses: 1 })
    progressStore.update((p) => ({
      ...p,
      exams: [{ id: 'e1', date: '2026-11-20T10:00:00Z', mode: 'ea1', correct: 24, total: 40, passed: true, durationSec: 1800, byTema: {}, wrong: [] }],
    }))
    const backup = exportProgress()
    const before = progressStore.get()
    progressStore.reset()
    expect(progressStore.get().exams).toHaveLength(0)
    progressStore.replace(await parseImport(backup))
    expect(progressStore.get()).toEqual(before)
  })

  it('rechaza archivos que no son de la app', async () => {
    await expect(parseImport('hola')).rejects.toThrow(/JSON/)
    await expect(parseImport('{"version":1}')).rejects.toThrow(/formato/)
  })

  it('sigue funcionando si localStorage lanza errores', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded')
    })
    expect(() => recordCard('f2', { box: 1, due: '2026-11-20', reviews: 1, lapses: 1 })).not.toThrow()
    expect(progressStore.get().cards.f2?.box).toBe(1)
    spy.mockRestore()
  })
})
