import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getLog, typeLabel } from '../lib/content';

export async function GET(context: APIContext) {
  const log = (await getLog()).filter((i) => !i.draft);
  return rss({
    title: 'Bitácora — Bautista Marinelli Scaglia',
    description: 'Viajes, películas, libros y lo que entreno.',
    site: context.site!,
    items: log.map((i) => ({
      title: `${typeLabel[i.type]}: ${i.title}`,
      pubDate: i.date,
      description: i.meta,
      link: i.href,
    })),
    customData: '<language>es-ar</language>',
  });
}
