import { getCollection, type CollectionKey, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

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

export type LogType = 'viaje' | 'movimiento' | 'peli' | 'libro' | 'nota';

export interface LogItem {
  type: LogType;
  date: Date;
  title: string;
  meta?: string;
  href: string;
  draft: boolean;
}

export const typeLabel: Record<LogType, string> = {
  viaje: 'viaje',
  movimiento: 'movimiento',
  peli: 'película',
  libro: 'libro',
  nota: 'nota',
};

/** Todo lo personal junto, lo más nuevo primero. */
export async function getLog(): Promise<LogItem[]> {
  const [viajes, movimiento, pelis, libros, notas] = await Promise.all([
    published('viajes'),
    published('movimiento'),
    getPelis(),
    published('libros'),
    published('notas'),
  ]);

  const items: LogItem[] = [
    ...viajes.map((e) => ({
      type: 'viaje' as const,
      date: e.data.date,
      title: e.data.title,
      meta: e.data.place,
      href: `/viajes/${e.id}`,
      draft: e.data.draft,
    })),
    ...movimiento.map((e) => ({
      type: 'movimiento' as const,
      date: e.data.date,
      title: e.data.title,
      meta: e.data.note,
      href: `/movimiento#${e.id}`,
      draft: e.data.draft,
    })),
    ...pelis.map((p) => ({
      type: 'peli' as const,
      date: p.date,
      title: p.title,
      meta: [p.director, p.year].filter(Boolean).join(', ') + (p.rewatch ? ' · otra vez' : ''),
      href: `/estante#${p.id}`,
      draft: p.draft,
    })),
    // los libros sin fecha no entran en la bitácora (no hay cuándo)
    ...libros.flatMap((e) => (e.data.date ? [{ ...e, date: e.data.date }] : [])).map((e) => ({
      type: 'libro' as const,
      date: e.date,
      title: e.data.title,
      meta: e.data.reading ? `${e.data.author} — leyéndolo` : e.data.author,
      href: `/estante#${e.id}`,
      draft: e.data.draft,
    })),
    ...notas.map((e) => ({
      type: 'nota' as const,
      date: e.data.date,
      title: e.data.title,
      href: `/notas/${e.id}`,
      draft: e.data.draft,
    })),
  ];

  return items.sort((a, b) => b.date.getTime() - a.date.getTime());
}

const dateFmt = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const monthFmt = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export const formatDate = (d: Date) => dateFmt.format(d).replace(/\./g, '');
export const formatMonth = (d: Date) => monthFmt.format(d);
export const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
