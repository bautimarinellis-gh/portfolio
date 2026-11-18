// El cielo de fondo: estrellas que giran despacio alrededor del polo sur,
// una franja tenue de Vía Láctea, alguna estrella fugaz, y las brasas
// que suben de un fuego que no se ve.
//
// Dos lienzos: `back` (estrellas, detrás de todo) y `front` (brasas, por
// delante del mar y los médanos, sin capturar el mouse).
//
// `night` va de 0 (recién prendido el fuego) a 1 (amanece). Lo maneja el scroll.

const TAU = Math.PI * 2;

export function createSky(back, front, { reducedMotion = false } = {}) {
  const bctx = back.getContext('2d');
  const fctx = front.getContext('2d');
  let w = 0;
  let h = 0;
  let dpr = 1;
  let stars = [];
  let embers = [];
  let shooting = null;
  let nextShootingAt = performance.now() + rand(6000, 14000);
  let night = 0;
  let fireScale = 1;  let paused = false;
  let running = false;
  let raf = 0;
  let last = performance.now();
  const fireListeners = [];

  // pseudo-random estable para que el cielo sea siempre el mismo
  let seed = 1994;
  function srand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = back.clientWidth;
    h = back.clientHeight;
    for (const [c, ctx] of [[back, bctx], [front, fctx]]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    buildStars();
    if (reducedMotion) draw(performance.now(), 0);
  }

  // Polo sur celeste: abajo a la izquierda, fuera de pantalla
  function pole() {
    return { x: w * 0.18, y: h * 1.25 };
  }

  function buildStars() {
    seed = 1994;
    stars = [];
    const p = pole();
    const reach = Math.hypot(Math.max(p.x, w - p.x), p.y) * 1.1;
    const count = Math.min(1100, Math.round((w * h) / 1700));

    const pushStar = (x, y, dim) => {
      const dx = x - p.x;
      const dy = y - p.y;
      const r = srand();
      const warm = r < 0.12;
      const blue = !warm && r < 0.3;
      stars.push({
        a: Math.atan2(dy, dx),
        d: Math.hypot(dx, dy),
        size: dim ? 0.35 + srand() * 0.4 : Math.pow(srand(), 3.2) * 1.5 + 0.3,
        alpha: dim ? 0.18 + srand() * 0.25 : 0.35 + srand() * 0.6,
        tw: 0.4 + srand() * 1.6,
        ph: srand() * TAU,
        color: warm ? '255, 214, 170' : blue ? '196, 214, 255' : '240, 236, 228',
      });
    };

    for (let i = 0; i < count; i++) {
      const ang = srand() * TAU;
      const dist = Math.sqrt(srand()) * reach;
      pushStar(p.x + Math.cos(ang) * dist, p.y + Math.sin(ang) * dist, false);
    }

    // una franja tenue, en diagonal, donde las estrellas se amontonan
    const band = Math.round(count * 0.7);
    for (let i = 0; i < band; i++) {
      const t = srand() * 1.6 - 0.3;
      const spread = (srand() + srand() + srand() - 1.5) * h * 0.12;
      pushStar(t * w, h * 0.95 - t * h * 0.9 + spread, true);
    }
  }

  function spawnEmber() {
    const spread = Math.min(w * 0.38, 520);
    embers.push({
      x: w / 2 + (Math.random() + Math.random() - 1) * spread,
      y: h + 10,
      vx: rand(-0.15, 0.15),
      vy: -rand(0.35, 1.1),
      life: 0,
      max: rand(3.2, 7.5),
      size: rand(0.6, 1.9),
      sway: rand(0.6, 1.6),
      ph: Math.random() * TAU,
    });
  }

  function flicker(t) {
    const s = t / 1000;
    return 0.86 + 0.06 * Math.sin(s * 2.1) + 0.05 * Math.sin(s * 5.3 + 1.7) + 0.03 * Math.sin(s * 11.9 + 0.4);
  }

  function drawStars(now) {
    bctx.clearRect(0, 0, w, h);
    const p = pole();
    const t = now / 1000;
    const rot = reducedMotion ? 0 : t * 0.0022 + night * 0.32;
    const starFade = 1 - smooth(0.82, 1, night) * 0.75;

    for (const s of stars) {
      const a = s.a + rot;
      const x = p.x + Math.cos(a) * s.d;
      const y = p.y + Math.sin(a) * s.d;
      if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;
      const twinkle = reducedMotion ? 1 : 0.72 + 0.28 * Math.sin(t * s.tw + s.ph);
      const alpha = s.alpha * twinkle * starFade;
      bctx.fillStyle = `rgb(${s.color})`;
      if (s.size > 1.25) {
        bctx.globalAlpha = alpha * 0.18;
        bctx.beginPath();
        bctx.arc(x, y, s.size * 3, 0, TAU);
        bctx.fill();
      }
      bctx.globalAlpha = alpha;
      bctx.beginPath();
      bctx.arc(x, y, s.size, 0, TAU);
      bctx.fill();
    }
    bctx.globalAlpha = 1;
  }

  function drawShooting(now, dt) {
    if (!shooting && now > nextShootingAt && night < 0.85) {
      const fromLeft = Math.random() < 0.5;
      shooting = {
        x: rand(w * 0.2, w * 0.8),
        y: rand(h * 0.05, h * 0.3),
        vx: (fromLeft ? 1 : -1) * rand(9, 13),
        vy: rand(3, 5),
        life: 0,
        max: rand(0.6, 0.9),
      };
      nextShootingAt = now + rand(14000, 32000);
    }
    if (!shooting) return;
    shooting.life += dt;
    const k = shooting.life / shooting.max;
    const alpha = Math.sin(Math.min(k, 1) * Math.PI) * 0.8;
    const len = 14;
    const x2 = shooting.x - shooting.vx * len;
    const y2 = shooting.y - shooting.vy * len;
    const grad = bctx.createLinearGradient(shooting.x, shooting.y, x2, y2);
    grad.addColorStop(0, `rgba(255, 246, 232, ${alpha})`);
    grad.addColorStop(1, 'rgba(255, 246, 232, 0)');
    bctx.strokeStyle = grad;
    bctx.lineWidth = 1.1;
    bctx.beginPath();
    bctx.moveTo(shooting.x, shooting.y);
    bctx.lineTo(x2, y2);
    bctx.stroke();
    shooting.x += shooting.vx * dt * 60;
    shooting.y += shooting.vy * dt * 60;
    if (k >= 1) shooting = null;
  }

  function drawEmbers(now, dt) {
    fctx.clearRect(0, 0, w, h);
    const t = now / 1000;
    const fire = (1 - smooth(0.05, 0.92, night) * 0.93) * flicker(now) * fireScale;
    for (const fn of fireListeners) fn(fire);

    let toSpawn = 26 * fire * dt;
    while (toSpawn > 0) {
      if (Math.random() < toSpawn) spawnEmber();
      toSpawn -= 1;
    }

    fctx.globalCompositeOperation = 'lighter';
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.life += dt;
      const k = e.life / e.max;
      if (k >= 1) {
        embers.splice(i, 1);
        continue;
      }
      e.x += (e.vx + Math.sin(t * e.sway + e.ph) * 0.25) * dt * 60;
      e.y += e.vy * dt * 60;

      // de blanco amarillento a naranja a rojo, y se apaga
      const g = Math.round(200 - k * 150);
      const b = Math.round(120 - k * 110);
      const blink = 0.75 + 0.25 * Math.sin(t * 9 + e.ph);
      const alpha = Math.pow(1 - k, 1.4) * blink * Math.min(1, e.life * 3);
      fctx.fillStyle = `rgb(255, ${g}, ${b})`;
      fctx.globalAlpha = alpha * 0.35;
      fctx.beginPath();
      fctx.arc(e.x, e.y, e.size * 3.2, 0, TAU);
      fctx.fill();
      fctx.globalAlpha = alpha;
      fctx.beginPath();
      fctx.arc(e.x, e.y, e.size * (1 - k * 0.5), 0, TAU);
      fctx.fill();
    }
    fctx.globalCompositeOperation = 'source-over';
    fctx.globalAlpha = 1;
  }

  function draw(now, dt) {
    drawStars(now);
    if (reducedMotion) return;
    drawShooting(now, dt);
    drawEmbers(now, dt);
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    draw(now, dt);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reducedMotion || paused || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();

  return {
    setNight(v) {
      night = Math.max(0, Math.min(1, v));
      if (reducedMotion) draw(performance.now(), 0);
    },
    /** 1 = fogón prendido; menos = brasas más tranquilas */
    setFire(v) {
      fireScale = v;
    },    /** De día no hace falta dibujar nada */
    setPaused(v) {
      paused = v;
      if (v) {
        stop();
        embers = [];
        fctx.clearRect(0, 0, w, h);
      } else start();
    },
    onFire(fn) {
      fireListeners.push(fn);
    },
  };
}

function smooth(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
