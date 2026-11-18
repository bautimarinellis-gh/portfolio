# bms — página personal

Hecha con [Astro](https://astro.build). La noche es lo personal; el día (`/cosas-aburridas`), lo profesional.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # chequea tipos + contenido y genera /dist (sitio estático)
npm run preview   # sirve /dist
```

## Publicar algo nuevo

Todo vive en `src/content/`. Lo más fácil es copiar un archivo de ejemplo y cambiarlo.
Mientras tenga `draft: true` se ve en `npm run dev` (con la etiqueta "borrador") pero **no se publica**.

| Qué | Dónde | Qué completar |
|---|---|---|
| Viaje | `src/content/viajes/<nombre>/index.md` + fotos en la misma carpeta | `title`, `date`, `place`, `coords`, `cover`, `photos` |
| Película | **Sola, desde Letterboxd** (ver abajo). A mano solo si querés: `src/content/pelis/<nombre>.md` | `title`, `year`, `date`, `line`; `director` y `poster` opcionales |
| Libro | `src/content/libros/<nombre>.md` | `title`, `author`, `year`; `date` (sin fecha no entra en la bitácora), `line`, `reading: true` si lo estás leyendo |
| Entrenamiento | `src/content/movimiento/<nombre>.md` | `title`, `date`, `youtubeId` (subí el video a YouTube como **no listado**) |
| Nota | `src/content/notas/<nombre>.md` | `title`, `date` y el texto abajo |
| Proyecto / laburo | `src/content/proyectos/`, `src/content/experiencia/` | ver los existentes |

Las fechas van como `2026-11-18`. Si te equivocás en un campo, `npm run build` te dice cuál.

La sección **Lo último** de la home se arma sola con lo último de cada colección.

## Películas desde Letterboxd

En cada `npm run dev` / `npm run build` se lee el RSS público de
[letterboxd.com/bautimarinellis](https://letterboxd.com/bautimarinellis/) (el usuario está en
`src/content.config.ts`, `LETTERBOXD_USER`). Tu reseña aparece como "la frase" de la peli.

- El RSS trae solo las ~50 entradas más nuevas; las anteriores se van acumulando en el caché local
  (`.astro/`). En un servidor de deploy que arranca de cero, solo aparecen las del RSS.
- Si Letterboxd no responde, el build sigue con lo que ya tenía.
- Para cambiar la frase de una peli que está en Letterboxd, creá `src/content/pelis/<nombre>.md`
  con el mismo `title` y `year`: lo que pongas ahí gana. Ejemplo:

```md
---
title: Her
year: 2013
date: 2026-03-15
line: Otra frase, distinta a la de Letterboxd.
---
```

- Las pelis nuevas aparecen cuando se vuelve a compilar el sitio (en el deploy se puede programar
  una recompilación diaria).

## Video propio en el hero

Dejá el clip (mp4, corto, sin sonido, idealmente < 8 MB) en `public/video/` y en `src/pages/index.astro`:

```astro
<HeroScene client:load words={words} video="/video/fogon.mp4" poster="/video/fogon.jpg">
```

Sin `video`, se usa la escena dibujada (cielo, luna, mar y médanos).

## Deploy

Es un sitio estático (`dist/`): sirve en Netlify, Vercel, Cloudflare Pages o GitHub Pages.
Antes de publicar, cambiar `site` en `astro.config.mjs` por el dominio real.
