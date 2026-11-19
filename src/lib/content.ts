import { getCollection, type CollectionKey, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { formatDate, formatMonth, postPath, type Lang } from './i18n';

export { formatDate, formatMonth };

/** Borradores visibles en `astro dev`, ocultos en el build. */
export async function published<C extends CollectionKey>(name: C): Promise<CollectionEntry<C>[]> {
  const all = await getCollection(name);
  return all.filter((e) => import.meta.env.DEV || !(e.data as { draft?: boolean }).draft);
}

export const byDateDesc = (a: { data: { date?: Date } }, b: { data: { date?: Date } }) =>
  (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0);

// ------------------------------------------------------------------
// Películas: Letterboxd + las cargadas a mano (estas ganan)
// ------------------------------------------------------------------

export interface Peli {
  id: string;
  title: string;
  year: number;
  director?: string;
  date: Date;
  line?: string;
  /** imagen local (astro:assets) o URL remota de Letterboxd */
  poster?: ImageMetadata | string;
  /** link a la entrada en Letterboxd */
  url?: string;
  rewatch?: boolean;
  draft: boolean;
}

const filmKey = (title: string, year: number) => `${title.toLowerCase().trim()}|${year}`;

/** Todas las pelis, la más reciente primero. */
export async function getPelis(): Promise<Peli[]> {
  const [lb, manual] = await Promise.all([getCollection('letterboxd'), published('pelis')]);
  const map = new Map<string, Peli>();

  for (const e of lb) {
    const d = e.data;
    map.set(filmKey(d.title, d.year), {
      id: `lb-${e.id}`,
      title: d.title,
      year: d.year,
      date: d.watched,
      line: d.review ?? undefined,
      poster: d.poster ?? undefined,
      url: d.url,
      rewatch: d.rewatch,
      draft: false,
    });
  }

  for (const e of manual) {
    const d = e.data;
    const key = filmKey(d.title, d.year);
    const prev = map.get(key);
    map.set(key, {
      ...prev,
      id: prev?.id ?? e.id,
      title: d.title,
      year: d.year,
      director: d.director ?? prev?.director,
      date: d.date,
      line: d.line ?? prev?.line,
      poster: d.poster ?? prev?.poster,
      draft: d.draft,
    });
  }

  return [...map.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Una entrada del blog, lista para listar. */
export interface LogItem {
  /** clave para filtrar (el tipo, normalizado) */
  kind: string;
  /** el tipo tal como lo escribiste: "viaje", "una tarde"... */
  label: string;
  date: Date;
  title: string;
  meta?: string;
  href: string;
  draft: boolean;
}

export const kindOf = (tipo: string) =>
  tipo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // sin tildes: "día" y "dia" filtran igual
    .trim();

/** Los posts del blog, el más nuevo primero. */
export async function getPosts(lang: Lang = 'es'): Promise<LogItem[]> {
  const posts = await published('blog');
  return posts
    .map((e) => ({
      kind: kindOf(e.data.tipo),
      label: e.data.tipo,
      date: e.data.date,
      title: e.data.title,
      meta: [e.data.place, e.data.summary].filter(Boolean).join(' — ') || undefined,
      href: postPath(e.id, lang),
      draft: e.data.draft,
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
