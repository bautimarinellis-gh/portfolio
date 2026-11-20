import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/content';

export async function GET(context: APIContext) {
  const posts = (await getPosts()).filter((p) => !p.draft);
  return rss({
    title: 'Blog — Bautista Marinelli Scaglia',
    description: 'Lo que queda de los días.',
    site: context.site!,
    items: posts.map((p) => ({
      title: p.title,
      pubDate: p.date,
      description: p.meta,
      categories: [p.label],
      link: p.href,
    })),
    customData: '<language>es-ar</language>',
  });
}
