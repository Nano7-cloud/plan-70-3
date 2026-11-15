# Plan 70.3 · Half Gasteiz Vitoria

Web estática (sin build) para que el atleta vea su plan de entrenamiento.

- `index.html`, `styles.css`, `app.js`: la app.
- `data/plan.json`: **todo el contenido del plan**. Para cambiar entrenos solo se edita este archivo.

## Estructura de `data/plan.json`

- `updated`: fecha de la última actualización (AAAA-MM-DD).
- `weeks[]`: una entrada por semana (`n`, `start` = lunes, `phase`, `hours`, `longRide`, `longRun`, `swim`, `key`).
- `weeks[].days` (opcional): 7 días, de lunes a domingo, cada uno con `sessions[]`:
  - `sport`: `swim` | `bike` | `run` | `gym` | `rest`
  - `title`, `detail` (opcional), `test: true` (opcional)
  - Si una semana no tiene `days`, la app muestra solo el resumen.

## Despliegue

Repositorio en GitHub importado en Vercel (Framework preset: **Other**, sin build command).
Cada push a `main` se publica solo.
