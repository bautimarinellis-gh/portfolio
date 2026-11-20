import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { letterboxdLoader } from './lib/letterboxd-loader';

/** Tu usuario de Letterboxd: de acá salen las pelis del estante. */
export const LETTERBOXD_USER = 'bautimarinellis';

// ------------------------------------------------------------------
// Lo personal (la noche)
// ------------------------------------------------------------------

/** Un campo vacío (lo que deja el panel de Pages CMS si no completás algo) cuenta como "no hay". */
const blank = (v: unknown) => (v === '' || v === null ? undefined : v);

/** Acepta el link entero de YouTube (o youtu.be, o shorts) y se queda con el ID. */
const youtubeId = (v: unknown) => {
  if (typeof v !== 'string' || !v.trim()) return undefined;
  const s = v.trim();
  const m = s.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);
  return m ? m[1] : s;
};

/**
 * El blog: un viaje, un entrenamiento, un día, una tarde... lo que sea.
 * Dos formas de crear un post:
 *  - desde el panel (Pages CMS): un archivo `AAAA-MM-DD-titulo.md`, con las fotos en src/assets/blog
 *  - a mano: una carpeta con index.md y las fotos al lado
 * `tipo` es texto libre ("viaje", "entrenamiento", "una tarde"): el blog arma los filtros con lo que uses.
 */
const blog = defineCollection({
  loader: glob({ pattern: ['**/index.{md,mdx}', '*.{md,mdx}'], base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      tipo: z.preprocess(blank, z.string().default('un día')),
      place: z.preprocess(blank, z.string().optional()),
      coords: z.preprocess(blank, z.string().optional()), // "38°00′S · 57°33′O"
      summary: z.preprocess(blank, z.string().optional()),
      cover: z.preprocess(blank, image().optional()),
      photos: z.preprocess(
        (v) => (Array.isArray(v) ? v.filter((p) => p && typeof p === 'object' && (p as { src?: unknown }).src) : blank(v)),
        z
          .array(
            z.object({
              src: image(),
              alt: z.preprocess(blank, z.string().default('')),
              caption: z.preprocess(blank, z.string().optional()),
            }),
          )
          .default([]),
      ),
      youtube: z.preprocess(youtubeId, z.string().optional()), // ID o link de un video de YouTube (no listado)
      video: z.preprocess(blank, z.string().optional()), // un clip corto subido desde el panel (/videos/…)
      draft: z.preprocess(blank, z.boolean().default(false)),
    }),
});

/** Películas desde tu diario de Letterboxd (RSS público). */
const letterboxd = defineCollection({
  loader: letterboxdLoader({ username: LETTERBOXD_USER }),
  schema: z.object({
    title: z.string(),
    year: z.number().int(),
    watched: z.coerce.date(),
    rating: z.number().nullable(),
    liked: z.boolean(),
    rewatch: z.boolean(),
    review: z.string().nullable(),
    poster: z.string().nullable(),
    url: z.string(),
    tmdbId: z.string().nullable(),
  }),
});

/**
 * Películas a mano. Opcional: si una peli también está en Letterboxd
 * (mismo título y año), lo que pongas acá le gana (por ejemplo, otra frase).
 */
const pelis = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pelis' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      year: z.number().int(),
      director: z.string().optional(),
      date: z.coerce.date(), // cuándo la vi
      line: z.string().optional(),
      poster: image().optional(),
      draft: z.boolean().default(false),
    }),
});

/** Libros: igual que las pelis. `reading: true` si lo estoy leyendo ahora. */
const libros = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/libros' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      year: z.preprocess((v) => (blank(v) === undefined ? undefined : Number(v)), z.number().int().optional()),
      author: z.string(),
      // cuándo lo terminé (o empecé, si reading). Opcional: sin fecha aparece
      // en el estante pero no entra en "lo último".
      date: z.preprocess(blank, z.coerce.date().optional()),
      reading: z.preprocess(blank, z.boolean().default(false)),
      line: z.preprocess(blank, z.string().optional()),
      cover: z.preprocess(blank, image().optional()),
      draft: z.preprocess(blank, z.boolean().default(false)),
    }),
});


// ------------------------------------------------------------------
// Trabajo (el día)
// ------------------------------------------------------------------

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/proyectos' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    status: z.string(),
    active: z.boolean().default(false),
    problem: z.string(),
    stack: z.array(z.string()),
    links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
  }),
});

const experiencia = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/experiencia' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    when: z.string(),
    where: z.string(),
    link: z.object({ label: z.string(), href: z.url() }).optional(),
  }),
});

export const collections = { blog, letterboxd, pelis, libros, proyectos, experiencia };
