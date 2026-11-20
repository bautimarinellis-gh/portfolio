import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { litPath, moonPhase, type MoonPhase } from '../lib/moon';
import NowPlaying from './NowPlaying';
import { ui, type Lang } from '../lib/i18n';

type Word = { text: string; dim?: boolean; br?: boolean };

interface Props {
  /** Titular en dos tonos: las palabras `dim` van en itálica y más apagadas */
  words: Word[];
  /** Clip propio (mp4/webm en /public). Si está, reemplaza la escena dibujada. */
  video?: string;
  poster?: string;
  /** Last.fm: si están, aparece lo que está sonando */
  lastfm?: { user?: string; apiKey?: string };
  lang?: Lang;
  children?: ReactNode;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function HeroScene({ words, video, poster, lastfm, lang = 'es', children }: Props) {
  const t = ui[lang];
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // capas que se mueven a distinta velocidad con el scroll
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const moonY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const seaY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const duneY = useTransform(scrollYProgress, [0, 1], ['0%', '-6%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  // y apenas con el mouse
  const mx = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 40, damping: 20 });
  const moonX = useTransform(smx, (v) => v * -10);
  const duneX = useTransform(smx, (v) => v * 14);
  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => mx.set(e.clientX / window.innerWidth - 0.5);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduce, mx]);

  const still = !!reduce;
  const clock = useRosarioClock(t.clockNight);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useWarmLetters(titleRef, still);
  // la fase se calcula en el navegador (el día de la visita, no el del build)
  const [moon, setMoon] = useState<MoonPhase | null>(null);
  useEffect(() => setMoon(moonPhase()), []);

  return (
    <section ref={ref} className={`hero ${video ? 'hero--video' : ''}`} aria-labelledby="hero-title">
      <div className="hero-layers" aria-hidden="true">
        {video ? (
          <video className="hero-video" src={video} poster={poster} autoPlay muted loop playsInline preload="metadata" />
        ) : (
          <>
            <motion.div className="moon" style={still ? undefined : { y: moonY, x: moonX }}>
              {moon && <Moon phase={moon} />}
            </motion.div>
            <motion.div className="sea" style={still ? undefined : { y: seaY }}>
              <Sea still={still} moonLight={moon ? 0.2 + moon.illumination * 0.8 : 0.8} />
            </motion.div>
            <motion.div className="dunes" style={still ? undefined : { y: duneY, x: duneX }}>
              <Dunes />
            </motion.div>
            {/* el fuego (fuera de cuadro, abajo) ilumina la arena: titila con --fire */}
            <div className="sand-glow" data-fire-target />
          </>
        )}
        <div className="hero-vignette" />
      </div>

      <motion.div className="hero-content wrap" style={still ? undefined : { y: textY, opacity: textOpacity }}>
        <motion.p
          className="hero-coords mono"
          initial={still ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.2, ease }}
        >
          32°57′S · 60°39′O — <span>{clock}</span>
        </motion.p>
        <NowPlaying user={lastfm?.user} apiKey={lastfm?.apiKey} labels={{ now: t.nowPlaying, last: t.lastPlayed }} />

        <h1 id="hero-title" className="hero-title" ref={titleRef} aria-label={words.map((w) => w.text).join(' ')}>
          {words.map((w, i) => (
            <Fragment key={i}>
              <motion.span
                className={w.dim ? 'w w--dim' : 'w'}
                aria-hidden="true"
                initial={still ? false : { opacity: 0, y: '0.35em', filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: '0em', filter: 'blur(0px)' }}
                transition={{ duration: 1.5, delay: 0.45 + i * 0.14, ease }}
              >
                {[...w.text].map((c, j) => (
                  <span key={j} className="ch" data-soft={w.dim ? 100 : 60} data-wght={w.dim ? 300 : 330}>
                    {c}
                  </span>
                ))}
              </motion.span>
              {w.br ? <br /> : ' '}
            </Fragment>
          ))}
        </h1>

        <motion.div
          className="hero-rest"
          initial={still ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.6 + words.length * 0.12, ease }}
        >
          {children}
        </motion.div>
      </motion.div>

      <p className="hero-hint mono" aria-hidden="true">{t.hint}</p>
    </section>
  );
}

/**
 * Las letras del nombre se "calientan" con el mouse cerca: se ablandan (eje SOFT de Fraunces)
 * y ganan un poco de peso, como si les llegara el calor del fuego. Inspirado en
 * "Variable Proximity" de React Bits. Sin mouse (celular) o con movimiento reducido, no hace nada.
 */
function useWarmLetters(ref: React.RefObject<HTMLHeadingElement | null>, still: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || still || !window.matchMedia('(pointer: fine)').matches) return;
    const letters = [...el.querySelectorAll<HTMLSpanElement>('.ch')];
    const RADIUS = 170;
    let raf = 0;
    let mouse: { x: number; y: number } | null = null;

    // Rendimiento: primero se leen todas las posiciones y después se escribe. Leer y escribir
    // intercalado obligaba al navegador a recalcular el layout una vez por letra. Además, solo se
    // escribe la letra que cambió, y si el mouse está lejos del nombre no se toca nada.
    const last = new Map<HTMLSpanElement, string>();
    const paint = () => {
      raf = 0;
      const box = el.getBoundingClientRect();
      const near =
        mouse &&
        mouse.x > box.left - RADIUS &&
        mouse.x < box.right + RADIUS &&
        mouse.y > box.top - RADIUS &&
        mouse.y < box.bottom + RADIUS;
      const rects = near ? letters.map((ch) => ch.getBoundingClientRect()) : null;
      letters.forEach((ch, i) => {
        let k = 0;
        if (rects && mouse) {
          const r = rects[i];
          const d = Math.hypot(mouse.x - (r.left + r.width / 2), mouse.y - (r.top + r.height / 2));
          k = Math.max(0, 1 - d / RADIUS);
          k = k * k * (3 - 2 * k); // suave en los bordes
        }
        const base = Number(ch.dataset.soft);
        const baseW = Number(ch.dataset.wght);
        const soft = (base + (100 - base) * k).toFixed(0);
        const wght = (baseW + 150 * k).toFixed(0);
        const v = `"SOFT" ${soft}, "opsz" 144, "wght" ${wght}`;
        if (last.get(ch) === v) return;
        last.set(ch, v);
        ch.style.fontVariationSettings = v;
      });
    };
    const onMove = (e: PointerEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      mouse = null;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [ref, still]);
}

/** "Rosario, 23:14. De noche, como acá." — se actualiza cada 30 s */
function useRosarioClock(nightNote: string) {
  const [text, setText] = useState('Rosario');
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires',
    });
    const tick = () => {
      const time = fmt.format(new Date());
      const hour = Number(time.slice(0, 2));
      setText(hour >= 20 || hour < 7 ? `Rosario, ${time}. ${nightNote}` : `Rosario, ${time}`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [nightNote]);
  return text;
}

/* ------------------------------------------------------------------
   La luna, con la fase real del día y vista desde el hemisferio sur
   ------------------------------------------------------------------ */
function Moon({ phase }: { phase: MoonPhase }) {
  const r = 20;
  // en el sur la creciente se ilumina a la izquierda: espejamos lo que en el norte va a la derecha
  const southern = true;
  const mirror = phase.waxing === southern;
  const lit = litPath(phase.phase, r);
  return (
    <svg
      viewBox={`${-r - 1} ${-r - 1} ${2 * r + 2} ${2 * r + 2}`}
      className="moon-svg"
      role="img"
      aria-label={`Luna de hoy: ${Math.round(phase.illumination * 100)} % iluminada`}
      style={{ '--moon-light': phase.illumination } as React.CSSProperties}
    >
      <defs>
        <radialGradient id="moon-lit" cx="40%" cy="38%" r="70%">
          <stop offset="0" stopColor="#fbf5e9" />
          <stop offset="0.65" stopColor="#ece0c6" />
          <stop offset="1" stopColor="#cdbd9c" />
        </radialGradient>
        <filter id="moon-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
        <clipPath id="moon-lit-clip">
          <path d={lit} transform={mirror ? 'scale(-1 1)' : undefined} />
        </clipPath>
      </defs>
      {/* la parte en sombra, apenas visible (luz cenicienta) */}
      <circle r={r} fill="#1a2030" opacity="0.85" />
      <g clipPath="url(#moon-lit-clip)">
        <circle r={r} fill="url(#moon-lit)" />
        {/* mares lunares: manchas suaves, siempre en el mismo lugar */}
        <g fill="#8d8270" opacity="0.32" filter="url(#moon-soft)">
          <ellipse cx="-6" cy="-7" rx="6.5" ry="4.8" />
          <ellipse cx="3" cy="-9" rx="4.2" ry="3.4" />
          <ellipse cx="6.5" cy="-1" rx="4.4" ry="5.6" />
          <ellipse cx="-3" cy="4" rx="5.2" ry="3.6" />
          <ellipse cx="-9" cy="2" rx="3" ry="4" />
          <ellipse cx="2" cy="11" rx="2.6" ry="2" />
        </g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------
   El mar: reflejo de la luna temblando y un poco del fuego en la orilla
   ------------------------------------------------------------------ */
function Sea({ still, moonLight }: { still: boolean; moonLight: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // cuánta luz da la luna hoy (luna nueva casi no se refleja); en un ref para no reiniciar el loop
  const light = useRef(moonLight);
  light.current = moonLight;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGradients();
    };

    // posición de la luna en x (tiene que coincidir con .moon en CSS)
    const moonX = () => w * (w < 700 ? 0.74 : 0.7);

    // los degradados no cambian entre cuadros: se arman una vez por tamaño
    let water: CanvasGradient | null = null;
    let fireGlow: CanvasGradient | null = null;
    const buildGradients = () => {
      water = ctx.createLinearGradient(0, 0, 0, h);
      water.addColorStop(0, 'rgba(20, 28, 44, 0.96)');
      water.addColorStop(0.25, 'rgba(9, 12, 20, 0.98)');
      water.addColorStop(1, 'rgba(6, 7, 11, 1)');
      fireGlow = ctx.createRadialGradient(w / 2, h * 1.15, 0, w / 2, h * 1.15, Math.max(w * 0.5, 420));
      fireGlow.addColorStop(0, 'rgba(255, 128, 52, 0.22)');
      fireGlow.addColorStop(1, 'rgba(255, 128, 52, 0)');
    };

    const draw = (now: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);

      // agua: oscura, apenas azul cerca del horizonte
      ctx.fillStyle = water!;
      ctx.fillRect(0, 0, w, h);

      // línea de horizonte
      ctx.fillStyle = 'rgba(200, 210, 230, 0.18)';
      ctx.fillRect(0, 0, w, 1);

      // reflejo de la luna: rayitas horizontales que tiemblan, más anchas cerca
      const mx = moonX();
      const rows = Math.round(h / 5);
      for (let i = 0; i < rows; i++) {
        const k = i / rows; // 0 horizonte → 1 orilla
        const y = Math.pow(k, 1.6) * h;
        const spread = 6 + k * w * 0.09;
        const wobble = Math.sin(t * 0.9 + i * 0.7) * spread * 0.35 + Math.sin(t * 2.3 + i * 1.9) * spread * 0.15;
        const len = (4 + k * 46) * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 2.1));
        const alpha = (1 - k) * 0.55 * light.current * (0.5 + 0.5 * Math.sin(t * 2.7 + i * 1.3));
        if (alpha < 0.02 || len < 1) continue;
        ctx.fillStyle = `rgba(244, 234, 214, ${alpha})`;
        ctx.fillRect(mx + wobble - len / 2, y, len, 1 + k * 1.2);
      }

      // espuma: olas finas que llegan a la orilla y se esconden detrás del médano
      for (let i = 0; i < 3; i++) {
        const q = (t / 9 + i / 3) % 1; // 0 aparece → 1 llega
        const y0 = (0.24 + q * 0.2) * h;
        const a = Math.sin(q * Math.PI) * 0.14 * (0.6 + 0.4 * light.current);
        if (a < 0.01) continue;
        ctx.strokeStyle = `rgba(214, 224, 240, ${a})`;
        ctx.lineWidth = 0.8 + q * 0.6;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const y = y0 + Math.sin(x * 0.009 + t * 0.4 + i * 2) * 2.2 + Math.sin(x * 0.031 + i) * 1.1;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // luz del fuego llegando al agua, abajo al centro
      ctx.fillStyle = fireGlow!;
      ctx.fillRect(0, 0, w, h);
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (still) draw(performance.now());
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !still) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);

    if (still) draw(performance.now());

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [still]);

  return <canvas ref={canvasRef} />;
}

/* ------------------------------------------------------------------
   Médanos en primer plano, con pasto, recortados contra el fuego
   ------------------------------------------------------------------ */
function Dunes() {
  // pasto determinístico (siempre el mismo dibujo)
  const blades = useMemo(() => {
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    const out: string[] = [];
    const ridge = (x: number) => 112 - 30 * Math.sin((x / 1600) * Math.PI * 1.1 + 0.4) - 14 * Math.sin(x / 140);
    const clumps = [80, 210, 330, 1180, 1290, 1420, 1530];
    for (const cx of clumps) {
      const n = 7 + Math.floor(r() * 7);
      for (let i = 0; i < n; i++) {
        const x = cx + (r() - 0.5) * 50;
        const y = ridge(x) + 4;
        const hgt = 18 + r() * 34;
        const lean = (r() - 0.4) * 22;
        out.push(`M${x.toFixed(1)} ${y.toFixed(1)} q${(lean * 0.3).toFixed(1)} ${(-hgt * 0.6).toFixed(1)} ${lean.toFixed(1)} ${(-hgt).toFixed(1)}`);
      }
    }
    return out.join(' ');
  }, []);

  const ridgePath = useMemo(() => {
    const pts: string[] = [];
    for (let x = 0; x <= 1600; x += 20) {
      const y = 112 - 30 * Math.sin((x / 1600) * Math.PI * 1.1 + 0.4) - 14 * Math.sin(x / 140);
      pts.push(`${x} ${y.toFixed(1)}`);
    }
    return pts;
  }, []);

  return (
    <svg viewBox="0 0 1600 240" preserveAspectRatio="xMidYMax slice" role="presentation">
      <defs>
        <linearGradient id="rim" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ff8a3d" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ff8a3d" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* médano del fondo, más claro */}
      <path d="M0 150 C 300 120, 520 140, 800 132 S 1300 118, 1600 140 L1600 240 L0 240 Z" fill="#0a0c12" />
      {/* médano del frente */}
      <path d={`M${ridgePath.join(' L')} L1600 240 L0 240 Z`} fill="#040507" />
      {/* borde iluminado por el fuego */}
      <path d={`M${ridgePath.join(' L')}`} fill="none" stroke="url(#rim)" strokeWidth="1.2" />
      <path d={blades} fill="none" stroke="#040507" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
