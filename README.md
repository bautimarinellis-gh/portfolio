# bms — página personal

Hecha con [Astro](https://astro.build). La noche es lo personal; el día (`/trabajo`), lo profesional.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # chequea tipos + contenido y genera /dist (sitio estático)
npm run preview   # sirve /dist
```

## Publicar desde el celular (Pages CMS)

La forma rápida: entrá a [app.pagescms.org](https://app.pagescms.org), iniciá sesión con GitHub y abrí
este repo. Vas a ver **Blog** y **Libros**: completás título, fecha, tipo, texto, subís fotos o pegás
un link de YouTube, y guardás. Cada guardado es un commit, y el hosting vuelve a publicar la página solo.

- Solo puede guardar quien tiene permiso de escritura en el repo (o sea, vos). Conviene tener activada
  la verificación en dos pasos en GitHub.
- Las fotos se guardan en `src/assets/blog/` y la página las optimiza. Los posts creados desde el panel
  quedan como `src/content/blog/AAAA-MM-DD-titulo.md`.
- Para publicar sin que se vea todavía, marcá **Borrador**.
- La configuración del panel está en `.pages.yml`.

## Publicar algo nuevo (a mano)

Todo vive en `src/content/`. Lo más fácil es copiar un archivo de ejemplo y cambiarlo.
Mientras tenga `draft: true` se ve en `npm run dev` (con la etiqueta "borrador") pero **no se publica**.

| Qué | Dónde | Qué completar |
|---|---|---|
| Post del blog (un viaje, un entrenamiento, un día, una tarde…) | `src/content/blog/<nombre>/index.md` + fotos en la misma carpeta | `title`, `date`, `tipo` (texto libre: "viaje", "una tarde"…); opcionales: `place`, `coords`, `summary`, `cover`, `photos`, `youtube` (ID de un video **no listado**) y el texto abajo |
| Película | **Sola, desde Letterboxd** (ver abajo). A mano solo si querés: `src/content/pelis/<nombre>.md` | `title`, `year`, `date`, `line`; `director` y `poster` opcionales |
| Libro | `src/content/libros/<nombre>.md` | `title`, `author`, `year`; `date` (sin fecha no entra en "lo último"), `line`, `reading: true` si lo estás leyendo |
| Proyecto / laburo | `src/content/proyectos/`, `src/content/experiencia/` (versión en inglés en `en/`) | ver los existentes |

Hay tres posts de ejemplo en `src/content/blog/`: uno con fotos (`ejemplo-costa`), uno con video
(`ejemplo-entreno`) y uno solo con texto (`ejemplo-tarde`). Copiá el que se parezca a lo que querés
publicar. Los filtros del blog se arman solos con los `tipo` que vayas usando.

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
