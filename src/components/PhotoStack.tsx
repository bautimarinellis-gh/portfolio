import { useCallback, useMemo, useState } from 'react';
import { motion, useReducedMotion, type PanInfo } from 'motion/react';

/**
 * Las fotos de un post como una pila de fotos reveladas sobre la mesa: cada una con su borde
 * de papel y un ángulo apenas distinto. La de arriba se arrastra (o se toca, o flecha →) y
 * pasa al fondo de la pila. Inspirado en "Stack" de React Bits.
 */
export interface Photo {
  src: string;
  srcset?: string;
  full: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
}

interface Props {
  photos: Photo[];
  labels?: { next: string; prev: string; open: string; hint: string };
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function PhotoStack({
  photos,
  labels = { next: 'siguiente', prev: 'anterior', open: 'ver grande', hint: 'arrastrá o tocá para pasar' },
}: Props) {
  const reduce = useReducedMotion();
  const [order, setOrder] = useState(() => photos.map((_, i) => i));

  // un ángulo fijo por foto, siempre el mismo (no cambia en cada visita)
  const tilt = useMemo(
    () =>
      photos.map((_, i) => {
        const r = Math.sin((i + 1) * 12.9898) * 43758.5453;
        // redondeado: el servidor y el navegador tienen que calcular exactamente lo mismo
        return Math.round(((r - Math.floor(r)) * 2 - 1) * 5 * 10) / 10;
      }),
    [photos],
  );

  const next = useCallback(() => setOrder((o) => [...o.slice(1), o[0]]), []);
  const prev = useCallback(() => setOrder((o) => [o[o.length - 1], ...o.slice(0, -1)]), []);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 500 || Math.abs(info.offset.y) > 120) next();
  };

  const top = photos[order[0]];

  return (
    <div
      className="pstack"
      tabIndex={0}
      role="group"
      aria-roledescription="pila de fotos"
      aria-label={`${top.alt} (${order[0] + 1} / ${photos.length})`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          next();
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prev();
        }
      }}
    >
      <div className="pstack-table">
        {[...order].reverse().map((idx) => {
          const depth = order.indexOf(idx);
          const p = photos[idx];
          const isTop = depth === 0;
          return (
            <motion.figure
              key={idx}
              className={`pstack-card ${isTop ? 'is-top' : ''}`}
              style={{ zIndex: photos.length - depth }}
              initial={false}
              animate={{
                rotate: isTop ? tilt[idx] * 0.4 : tilt[idx],
                scale: 1 - Math.min(depth, 4) * 0.035,
                y: Math.min(depth, 4) * 7,
                opacity: depth > 4 ? 0 : 1,
              }}
              transition={reduce ? { duration: 0 } : { duration: 0.7, ease }}
              drag={isTop && !reduce}
              dragSnapToOrigin
              dragElastic={0.6}
              whileDrag={{ scale: 1.03, rotate: tilt[idx] * 0.4 + 2, cursor: 'grabbing' }}
              onDragEnd={isTop ? onDragEnd : undefined}
              onTap={isTop ? next : undefined}
            >
              <img
                src={p.src}
                srcSet={p.srcset}
                sizes="(max-width: 700px) 86vw, 600px"
                width={p.width}
                height={p.height}
                alt={p.alt}
                loading={depth < 2 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
              />
            </motion.figure>
          );
        })}
      </div>

      <div className="pstack-foot">
        <p className="pstack-caption">{top.caption ?? top.alt}</p>
        <div className="pstack-controls mono">
          <button type="button" onClick={prev} aria-label={labels.prev}>
            ←
          </button>
          <span>
            {order[0] + 1} / {photos.length}
          </span>
          <button type="button" onClick={next} aria-label={labels.next}>
            →
          </button>
          <a href={top.full} target="_blank" rel="noopener">
            {labels.open}
          </a>
        </div>
      </div>
      <p className="pstack-hint mono">{labels.hint}</p>
    </div>
  );
}
