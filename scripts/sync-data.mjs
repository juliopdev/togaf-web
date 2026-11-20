// Copia los JSON de ../togaf-estudio (fuente de verdad) a src/data/raw/.
// Netlify construye solo desde este repo, así que la copia debe vivir aquí.
// Uso: pnpm sync-data
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, '..', 'togaf-estudio')
const target = join(root, 'src', 'data', 'raw')

const files = ['togaf_data.json', 'togaf_complemento.json', 'banco_preguntas.json', 'flashcards_complemento.json']

// Datos personales que no deben llegar a una web pública.
function sanitize(name, data) {
  if (name === 'togaf_data.json' && data.meta) {
    delete data.meta.docente
  }
  return data
}

await mkdir(target, { recursive: true })
for (const name of files) {
  const data = sanitize(name, JSON.parse(await readFile(join(source, name), 'utf8')))
  await writeFile(join(target, name), JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`✓ ${name}`)
}
