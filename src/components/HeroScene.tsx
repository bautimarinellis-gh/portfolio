import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';

type Word = { text: string; dim?: boolean; br?: boolean };

interface Props {
  /** Titular en dos tonos: las palabras `dim` van en itálica y más apagadas */
  words: Word[];
  /** Clip propio (mp4/webm en /public). Si está, reemplaza la escena dibujada. */
  video?: string;
  poster?: string;
  children?: ReactNode;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function HeroScene({ words, video, poster, children }: Props) {
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
  const clock = useRosarioClock();

  return (
    <section ref={ref} className={`hero ${video ? 'hero--video' : ''}`} aria-labelledby="hero-title">
      <div className="hero-layers" aria-hidden="true">
        {video ? (
          <video className="hero-video" src={video} poster={poster} autoPlay muted loop playsInline preload="metadata" />
        ) : (
          <>
            <motion.div className="moon" style={still ? undefined : { y: moonY, x: moonX }} />
            <motion.div className="sea" style={still ? undefined : { y: seaY }}>
              <Sea still={still} />
            </motion.div>
            <motion.div className="dunes" style={still ? undefined : { y: duneY, x: duneX }}>
              <Dunes />
            </motion.div>
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

        <h1 id="hero-title" className="hero-title">
          {words.map((w, i) => (
            <Fragment key={i}>
              <motion.span
                className={w.dim ? 'w w--dim' : 'w'}
                initial={still ? false : { opacity: 0, y: '0.35em', filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: '0em', filter: 'blur(0px)' }}
                transition={{ duration: 1.5, delay: 0.45 + i * 0.14, ease }}
              >
                {w.text}
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

      <p className="hero-hint mono" aria-hidden="true">bajá despacio</p>
    </section>
  );
}

/** "Rosario, 23:14. De noche, como acá." — se actualiza cada 30 s */
function useRosarioClock() {
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
      setText(hour >= 20 || hour < 7 ? `Rosario, ${time}. De noche, como acá.` : `Rosario, ${time}`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return text;
}

/* ------------------------------------------------------------------
   El mar: reflejo de la luna temblando y un poco del fuego en la orilla
   ------------------------------------------------------------------ */
function Sea({ still }: { still: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    };

    // posición de la luna en x (tiene que coincidir con .moon en CSS)
    const moonX = () => w * (w < 700 ? 0.74 : 0.7);

    const draw = (now: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);

      // agua: oscura, apenas azul cerca del horizonte
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(20, 28, 44, 0.96)');
      g.addColorStop(0.25, 'rgba(9, 12, 20, 0.98)');
      g.addColorStop(1, 'rgba(6, 7, 11, 1)');
      ctx.fillStyle = g;
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
        const alpha = (1 - k) * 0.55 * (0.5 + 0.5 * Math.sin(t * 2.7 + i * 1.3));
        if (alpha < 0.02 || len < 1) continue;
        ctx.fillStyle = `rgba(244, 234, 214, ${alpha})`;
        ctx.fillRect(mx + wobble - len / 2, y, len, 1 + k * 1.2);
      }

      // luz del fuego llegando al agua, abajo al centro
      const fg = ctx.createRadialGradient(w / 2, h * 1.15, 0, w / 2, h * 1.15, Math.max(w * 0.5, 420));
      fg.addColorStop(0, 'rgba(255, 128, 52, 0.22)');
      fg.addColorStop(1, 'rgba(255, 128, 52, 0)');
      ctx.fillStyle = fg;
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
