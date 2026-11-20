# TOGAF Estudio

Web para estudiar TOGAF: rueda ADM interactiva, teoría del curso y del estándar, tarjetas con repaso espaciado (Leitner, 5 cajas), práctica con explicaciones y simulacros con tiempo (examen del curso y estilo EA Part 1).

Vite + React + TypeScript, Tailwind CSS 4, React Router 7. El progreso se guarda en `localStorage` del navegador; no hay backend.

## Comandos

```bash
pnpm install
pnpm dev            # servidor de desarrollo
pnpm test           # todos los tests
pnpm lint
pnpm build          # valida datos + tipos + build a dist/
pnpm preview        # sirve dist/
```

## Datos

La fuente de verdad son los JSON de `../togaf-estudio/`. Después de editarlos:

```bash
pnpm sync-data      # copia a src/data/raw/ (quita datos personales del docente)
pnpm validate:data  # esquemas Zod, ids únicos, temas válidos, sincronización
```

`pnpm build` corre `validate:data` primero: un dato roto rompe el deploy, no la web publicada.

| Archivo | Contenido |
| --- | --- |
| `togaf_data.json` | Contenido de las diapositivas del curso |
| `togaf_complemento.json` | Lo que el curso no cubre, con nivel de fiabilidad por bloque |
| `banco_preguntas.json` | Preguntas adicionales (curso y complemento) |
| `flashcards_complemento.json` | Tarjetas de los temas del complemento |

## Deploy en Netlify

`netlify.toml` ya define el build (`pnpm build` → `dist/`), Node 22 y la redirección SPA para que las URLs profundas (`/fases/E`) funcionen al recargar. No usa Netlify Functions.
