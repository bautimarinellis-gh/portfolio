import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export interface Photo {
  src: string; // versión optimizada para la grilla
  srcset?: string;
  full: string; // versión grande para el lightbox
  width: number;
  height: number;
  alt: string;
  caption?: string;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function Gallery({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, step]);

  const current = open === null ? null : photos[open];

  return (
    <>
      <div className="gallery">
        {photos.map((p, i) => (
          <figure key={p.full} className={`g-item ${p.height > p.width ? 'g-item--tall' : ''}`}>
            <button type="button" className="g-open" onClick={() => setOpen(i)} aria-label={`Ampliar: ${p.alt}`}>
              <img src={p.src} srcSet={p.srcset} sizes="(max-width: 760px) 100vw, 70vw" width={p.width} height={p.height} alt={p.alt} loading="lazy" decoding="async" />
            </button>
            {p.caption && <figcaption>{p.caption}</figcaption>}
          </figure>
        ))}
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={current.alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease }}
            onClick={close}
          >
            <AnimatePresence mode="wait">
              <motion.figure
                key={current.full}
                className="lb-figure"
                initial={{ opacity: 0, scale: 0.985, filter: 'blur(6px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(4px)' }}
                transition={{ duration: 0.6, ease }}
                onClick={(e) => e.stopPropagation()}
              >
                <img src={current.full} alt={current.alt} />
                <figcaption>
                  <span>{current.caption ?? current.alt}</span>
                  <span className="mono">
                    {(open ?? 0) + 1} / {photos.length}
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
            {photos.length > 1 && (
              <>
                <button type="button" className="lb-nav lb-prev" onClick={(e) => (e.stopPropagation(), step(-1))} aria-label="Anterior">
                  ←
                </button>
                <button type="button" className="lb-nav lb-next" onClick={(e) => (e.stopPropagation(), step(1))} aria-label="Siguiente">
                  →
                </button>
              </>
            )}
            <button type="button" className="lb-close mono" onClick={close}>
              cerrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
