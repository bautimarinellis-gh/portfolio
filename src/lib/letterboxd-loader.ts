import type { Loader } from 'astro/loaders';
import { parseLetterboxd } from './letterboxd-parse.js';

/**
 * Carga el diario público de Letterboxd (RSS) en una colección de Astro.
 *
 * - Corre en cada `astro build` / `astro dev`.
 * - Acumula: el RSS solo trae las ~50 entradas más nuevas, así que las viejas
 *   no se borran del store local cuando dejan de aparecer.
 * - Si Letterboxd no responde, avisa y sigue con lo que ya había.
 */
export function letterboxdLoader({ username }: { username: string }): Loader {
  const url = `https://letterboxd.com/${username}/rss/`;

  return {
    name: 'letterboxd',
    async load({ store, logger, parseData, generateDigest }) {
      let xml: string;
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'personal-site-build (astro)' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        xml = await res.text();
      } catch (err) {
        logger.warn(`No pude leer ${url} (${(err as Error).message}). Sigo con ${store.keys().length} pelis guardadas.`);
        return;
      }

      const films = parseLetterboxd(xml);
      let added = 0;
      for (const film of films) {
        const data = await parseData({ id: film.id, data: film });
        if (store.set({ id: film.id, data, digest: generateDigest(data) })) added++;
      }
      logger.info(`Letterboxd: ${films.length} en el RSS, ${added} nuevas o actualizadas, ${store.keys().length} en total.`);
    },
  };
}
