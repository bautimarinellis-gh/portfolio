// Dos idiomas: castellano (por defecto, sin prefijo) e inglés (bajo /en).
// Lo que escribe Bauti (posts del blog, reseñas de Letterboxd) queda en castellano;
// se traduce todo lo demás: menú, títulos, textos de la página, fechas.

export type Lang = 'es' | 'en';

/** Las rutas de cada página, en cada idioma. */
const ROUTES: Record<string, Record<Lang, string>> = {
  home: { es: '/', en: '/en/' },
  blog: { es: '/blog', en: '/en/blog' },
  shelf: { es: '/estante', en: '/en/shelf' },
  work: { es: '/trabajo', en: '/en/work' },
};

export const route = (key: keyof typeof ROUTES, lang: Lang) => ROUTES[key][lang];
export const postPath = (slug: string, lang: Lang) => (lang === 'en' ? `/en/blog/${slug}` : `/blog/${slug}`);

export const langFromPath = (pathname: string): Lang => (/^\/en(\/|$)/.test(pathname) ? 'en' : 'es');

/** La misma página en el otro idioma (para el selector ES / EN). */
export function altPath(pathname: string): string {
  const clean = pathname.replace(/\/$/, '') || '/';
  const from = langFromPath(clean);
  const to: Lang = from === 'es' ? 'en' : 'es';
  for (const r of Object.values(ROUTES)) {
    if ((r[from].replace(/\/$/, '') || '/') === clean) return r[to];
  }
  const post = clean.match(/^(?:\/en)?\/blog\/(.+)$/);
  if (post) return postPath(post[1], to);
  return ROUTES.home[to];
}

const DATE_LOCALE: Record<Lang, string> = { es: 'es-AR', en: 'en-GB' };

export function formatDate(d: Date, lang: Lang = 'es') {
  return new Intl.DateTimeFormat(DATE_LOCALE[lang], { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(d)
    .replace(/\./g, '');
}

export function formatMonth(d: Date, lang: Lang = 'es') {
  return new Intl.DateTimeFormat(DATE_LOCALE[lang], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

/** Textos de la interfaz. */
export const ui = {
  es: {
    nav: { blog: 'blog', shelf: 'estante', work: 'trabajo' },
    langSwitch: 'EN',
    langSwitchLabel: 'English',
    skip: 'Saltar al contenido',
    menu: 'menú',
    close: 'cerrar',
    siteDescription:
      'Bautista Marinelli Scaglia. Rosario. Un blog de días, viajes y entrenamientos; libros y películas; y también lo profesional: trabajo, estudios y proyectos.',
    dayFooter: 'Ya es de día.',
    backToNight: 'Volver a la noche →',
    // home
    heroLede: 'Un lugar para dejar lo que pasa: un viaje, un libro, una película, una tarde.',
    heroLinks: { blog: 'Blog', work: 'Trabajo', cv: 'cv' },
    clockNight: 'De noche, como acá.',
    latest: 'Lo último',
    latestUpdated: 'actualizado el',
    reading: 'leyendo',
    lastRead: 'lo último que leí',
    lastSeen: 'lo último que vi',
    onTheBlog: 'en el blog',
    blogTitle: 'Blog',
    all: 'todo',
    doorKicker: '05:50 — ya casi es de día',
    doorTitle: 'Trabajo y estudios',
    doorSub: 'Proyectos, experiencia y CV. Si llegaste buscando eso, es por acá.',
    doorCta: 'entrar →',
    nowPlaying: 'sonando',
    lastPlayed: 'lo último que sonó',
    hint: 'bajá despacio',
    empty: 'Todavía no hay nada acá. Pronto.',
    draft: 'borrador',
    // blog
    blogLede: 'Lo que queda de los días.',
    filterBy: 'Filtrar por tipo',
    backToBlog: '← todo el blog',
    stack: { next: 'siguiente', prev: 'anterior', open: 'ver grande', hint: 'arrastrá o tocá la foto para pasar' },
    draftNote: 'borrador: no se publica',
    writtenInSpanish: '',
    // estante
    shelfTitle: 'Estante',
    shelfLede: 'Películas que vi y libros que leí. Una línea cada uno, nada de reseñas. Las pelis salen solas de mi',
    films: 'pelis',
    filmsTitle: 'Lo que vi',
    books: 'libros',
    booksTitle: 'Lo que leí',
    readingNow: 'leyéndolo',
    again: 'otra vez',
    nothingYet: 'Nada por ahora.',
  },
  en: {
    nav: { blog: 'blog', shelf: 'shelf', work: 'work' },
    langSwitch: 'ES',
    langSwitchLabel: 'Español',
    skip: 'Skip to content',
    menu: 'menu',
    close: 'close',
    siteDescription:
      'Bautista Marinelli Scaglia. Rosario, Argentina. A blog of days, trips and training; books and films; and the professional side: work, studies and projects.',
    dayFooter: "It's daytime.",
    backToNight: 'Back to the night →',
    heroLede:
      'A place to leave what happens: a trip, a book, a film, an afternoon.',
    heroLinks: { blog: 'Blog', work: 'Work', cv: 'cv' },
    clockNight: 'Night here too.',
    latest: 'Latest',
    latestUpdated: 'updated',
    reading: 'reading',
    lastRead: 'last read',
    lastSeen: 'last watched',
    onTheBlog: 'on the blog',
    blogTitle: 'Blog',
    all: 'all',
    doorKicker: '05:50 — almost daytime',
    doorTitle: 'Work and studies',
    doorSub: 'Projects, experience and CV. If that is what you came for, this way.',
    doorCta: 'enter →',
    nowPlaying: 'playing',
    lastPlayed: 'last played',
    hint: 'scroll slowly',
    empty: 'Nothing here yet. Soon.',
    draft: 'draft',
    blogLede: 'What the days leave behind.',
    filterBy: 'Filter by type',
    backToBlog: '← all posts',
    stack: { next: 'next', prev: 'previous', open: 'full size', hint: 'drag or tap the photo to flip through' },
    draftNote: 'draft: not published',
    writtenInSpanish: 'Written in Spanish.',
    shelfTitle: 'Shelf',
    shelfLede: 'Films I watched and books I read. One line each, no reviews. The films come straight from my',
    films: 'films',
    filmsTitle: 'Watched',
    books: 'books',
    booksTitle: 'Read',
    readingNow: 'reading',
    again: 'again',
    nothingYet: 'Nothing yet.',
  },
} as const;

export type UI = (typeof ui)[Lang];
