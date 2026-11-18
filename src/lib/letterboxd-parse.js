// Parser mínimo del RSS público de Letterboxd (sin dependencias).
// Devuelve solo entradas de diario de películas; ignora listas.

const decode = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : '';
};

const stripHtml = (s) => decode(s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

/**
 * @param {string} xml
 * @returns {Array<{id:string,title:string,year:number,watched:string,rating:number|null,liked:boolean,rewatch:boolean,review:string|null,poster:string|null,url:string,tmdbId:string|null}>}
 */
export function parseLetterboxd(xml) {
  const out = [];
  for (const block of xml.split('<item>').slice(1)) {
    const title = tag(block, 'letterboxd:filmTitle');
    const watched = tag(block, 'letterboxd:watchedDate');
    if (!title || !watched) continue; // listas u otras cosas

    const descRaw = (block.match(/<description>([\s\S]*?)<\/description>/) ?? [])[1] ?? '';
    const desc = descRaw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    const poster = (desc.match(/<img[^>]+src="([^"]+)"/) ?? [])[1] ?? null;
    const paragraphs = [...desc.matchAll(/<p>([\s\S]*?)<\/p>/g)]
      .map((m) => m[1])
      .filter((p) => !p.includes('<img'))
      .map(stripHtml)
      .filter((p) => p && !/^Watched on /i.test(p) && !/^This review may contain spoilers/i.test(p));
    const rating = tag(block, 'letterboxd:memberRating');
    const url = tag(block, 'link');
    const guid = tag(block, 'guid');

    out.push({
      id: guid.replace(/^letterboxd-/, '') || url,
      title,
      year: Number(tag(block, 'letterboxd:filmYear')) || 0,
      watched,
      rating: rating ? Number(rating) : null,
      liked: tag(block, 'letterboxd:memberLike') === 'Yes',
      rewatch: tag(block, 'letterboxd:rewatch') === 'Yes',
      review: paragraphs.length ? paragraphs.join(' ') : null,
      poster,
      url,
      tmdbId: tag(block, 'tmdb:movieId') || null,
    });
  }
  return out;
}
