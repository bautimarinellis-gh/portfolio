import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { letterboxdLoader } from './lib/letterboxd-loader';

/** Tu usuario de Letterboxd: de acá salen las pelis del estante. */
export const LETTERBOXD_USER = 'bautimarinellis';

// ------------------------------------------------------------------
// Lo personal (la noche)
// ------------------------------------------------------------------

/** Un viaje: carpeta con index.md + las fotos al lado. */
const viajes = defineCollection({
  loader: glob({ pattern: '**/index.{md,mdx}', base: './src/content/viajes' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      place: z.string(),
      coords: z.string().optional(), // "38°00′S · 57°33′O"
      summary: z.string().optional(),
      cover: image(),
      photos: z
        .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() }))
        .default([]),
      draft: z.boolean().default(false),
    }),
});

/** Entrenamiento: videos en YouTube (no listados). */
const movimiento = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/movimiento' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    youtubeId: z.string(),
    note: z.string().optional(),
    draft: z.boolean().default(false),
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
      year: z.number().int().optional(),
      author: z.string(),
      // cuándo lo terminé (o empecé, si reading). Opcional: sin fecha aparece
      // en el estante pero no en la bitácora.
      date: z.coerce.date().optional(),
      reading: z.boolean().default(false),
      line: z.string().optional(),
      cover: image().optional(),
      draft: z.boolean().default(false),
    }),
});

/** Notas cortas, cuando haya algo para decir. */
const notas = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notas' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

// ------------------------------------------------------------------
// Cosas aburridas (el día)
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

export const collections = { viajes, movimiento, letterboxd, pelis, libros, notas, proyectos, experiencia };
