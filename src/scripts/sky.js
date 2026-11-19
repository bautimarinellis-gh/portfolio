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
  let fireScale = 1;
  let fireBoost = 0; // alguien tiró leña (escribiendo "fogón")
  let paused = false;
  let running = false;
  let raf = 0;
  let last = performance.now();
  const fireListeners = [];

  // Cruz del Sur (y los punteros, Alfa y Beta Centauri), escondida en el cielo
  let crux = [];
  let cruxReveal = 0; // 0 escondida → 1 dibujada
  let cruxHourAngle = 0; // ángulo horario real en Rosario (horas): define cómo está inclinada
  let pointer = { x: -9999, y: -9999 };

  // el clima real de Rosario
  let cloudCover = 0; // 0–100
  let rainRate = 0; // mm/h
  let clouds = [];
  let drops = [];

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

    buildCrux();
    buildClouds();
  }

  /** Nubes: manchas grandes y difusas que tapan estrellas, según la nubosidad real. */
  function buildClouds() {
    let s = 77;
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    const n = Math.round((cloudCover / 100) * 10);
    clouds = Array.from({ length: n }, () => ({
      x: r() * w * 1.3 - w * 0.15,
      y: h * (0.04 + r() * 0.55),
      rx: w * (0.16 + r() * 0.22),
      ry: h * (0.05 + r() * 0.06),
      vx: 3 + r() * 7, // px/s, de oeste a este como el viento de la costa
      a: 0.55 + r() * 0.35,
    }));
  }

  function drawClouds(dt) {
    for (const c of clouds) {
      if (!reducedMotion) {
        c.x += c.vx * dt;
        if (c.x - c.rx > w) c.x = -c.rx;
      }
      bctx.save();
      bctx.translate(c.x, c.y);
      bctx.scale(1, c.ry / c.rx);
      const g = bctx.createRadialGradient(0, 0, 0, 0, 0, c.rx);
      g.addColorStop(0, `rgba(14, 17, 27, ${c.a})`);
      g.addColorStop(0.55, `rgba(16, 20, 31, ${c.a * 0.7})`);
      g.addColorStop(1, 'rgba(16, 20, 31, 0)');
      bctx.fillStyle = g;
      bctx.beginPath();
      bctx.arc(0, 0, c.rx, 0, TAU);
      bctx.fill();
      // un borde apenas iluminado por la luna
      const rim = bctx.createRadialGradient(-c.rx * 0.2, -c.rx * 0.35, c.rx * 0.2, 0, 0, c.rx);
      rim.addColorStop(0, `rgba(80, 90, 115, ${c.a * 0.06})`);
      rim.addColorStop(1, 'rgba(80, 90, 115, 0)');
      bctx.fillStyle = rim;
      bctx.fill();
      bctx.restore();
    }
  }

  /** Lluvia: rayitas finas en diagonal, por delante de todo. */
  function drawRain(dt) {
    if (rainRate <= 0 || reducedMotion) return;
    const target = Math.min(170, 24 + rainRate * 45);
    while (drops.length < target) {
      drops.push({ x: Math.random() * w * 1.2, y: Math.random() * -h, v: 520 + Math.random() * 260, len: 9 + Math.random() * 10 });
    }
    fctx.strokeStyle = 'rgba(200, 212, 232, 0.16)';
    fctx.lineWidth = 0.8;
    fctx.beginPath();
    for (const d of drops) {
      d.y += d.v * dt;
      d.x -= d.v * dt * 0.18;
      if (d.y > h) {
        d.y = -d.len;
        d.x = Math.random() * w * 1.2;
      }
      fctx.moveTo(d.x, d.y);
      fctx.lineTo(d.x + d.len * 0.18, d.y - d.len);
    }
    fctx.stroke();
  }

  /**
   * La Cruz del Sur con sus proporciones reales. Su eje mayor (Gacrux → Acrux) siempre
   * apunta al polo sur; a lo largo de la noche gira alrededor de él. La inclinación sale
   * del ángulo horario real en Rosario: en la culminación (0 h) está parada, con Acrux abajo;
   * seis horas después queda acostada, apuntando a la izquierda.
   * Coordenadas de plantilla: eje mayor hacia +y (abajo), en unidades ≈ px.
   */
  function buildCrux() {
    const p = pole();
    const unit = Math.max(0.75, Math.min(1.25, Math.min(w, h) / 760));
    const cx = w * (w < 700 ? 0.7 : 0.6);
    const cy = h * (w < 700 ? 0.2 : 0.24);
    const template = [
      { id: 'gacrux', x: 0, y: -46, size: 1.55, color: '255, 205, 170' },
      { id: 'acrux', x: 4, y: 46, size: 1.85, color: '220, 230, 255' },
      { id: 'mimosa', x: -33, y: 4, size: 1.7, color: '215, 228, 255' },
      { id: 'delta', x: 29, y: -12, size: 1.25, color: '225, 232, 255' },
      { id: 'epsilon', x: 15, y: 17, size: 0.85, color: '255, 225, 200' },
      { id: 'betacen', x: -128, y: 50, size: 1.75, color: '215, 228, 255' },
      { id: 'alphacen', x: -186, y: 66, size: 2, color: '255, 240, 215' },
    ];
    // mirando al sur, las estrellas giran en sentido horario alrededor del polo
    const rot = (cruxHourAngle / 24) * TAU;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    crux = template.map((s) => {
      const x = cx + (s.x * cos - s.y * sin) * unit;
      const y = cy + (s.x * sin + s.y * cos) * unit;
      return { ...s, a: Math.atan2(y - p.y, x - p.x), d: Math.hypot(x - p.x, y - p.y), ph: srand() * TAU };
    });
  }

  function drawCrux(now, rot, starFade) {
    if (!crux.length) return;
    const p = pole();
    const t = now / 1000;
    const pos = {};
    for (const s of crux) {
      const a = s.a + rot;
      pos[s.id] = { x: p.x + Math.cos(a) * s.d, y: p.y + Math.sin(a) * s.d };
    }

    // ¿el mouse anda cerca? se dibuja de a poco; si se va, se borra despacio
    const c = { x: (pos.gacrux.x + pos.acrux.x) / 2, y: (pos.gacrux.y + pos.acrux.y) / 2 };
    const near = Math.hypot(pointer.x - c.x, pointer.y - c.y) < 140;
    cruxReveal += ((near ? 1 : 0) - cruxReveal) * (near ? 0.045 : 0.025);
    if (reducedMotion) cruxReveal = near ? 1 : 0;

    // las estrellas, un poco más brillantes que el resto
    for (const s of crux) {
      const q = pos[s.id];
      const tw = reducedMotion ? 1 : 0.82 + 0.18 * Math.sin(t * 0.9 + s.ph);
      const alpha = (0.75 + cruxReveal * 0.25) * tw * starFade;
      bctx.fillStyle = `rgb(${s.color})`;
      bctx.globalAlpha = alpha * 0.16;
      bctx.beginPath();
      bctx.arc(q.x, q.y, s.size * 3.4, 0, TAU);
      bctx.fill();
      bctx.globalAlpha = alpha;
      bctx.beginPath();
      bctx.arc(q.x, q.y, s.size, 0, TAU);
      bctx.fill();
    }

    if (cruxReveal < 0.01) {
      bctx.globalAlpha = 1;
      return;
    }

    // líneas finas: la cruz, y los punteros más tenues
    const line = (a, b, alpha, dash = []) => {
      const A = pos[a];
      const B = pos[b];
      const gap = 6; // no tocan las estrellas
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;
      bctx.setLineDash(dash);
      bctx.strokeStyle = `rgba(235, 226, 208, ${alpha})`;
      bctx.lineWidth = 0.7;
      bctx.beginPath();
      bctx.moveTo(A.x + ux * gap, A.y + uy * gap);
      bctx.lineTo(A.x + ux * (gap + (len - gap * 2) * Math.min(1, cruxReveal * 1.4)), A.y + uy * (gap + (len - gap * 2) * Math.min(1, cruxReveal * 1.4)));
      bctx.stroke();
    };
    bctx.globalAlpha = 1;
    line('gacrux', 'acrux', 0.38 * cruxReveal * starFade);
    line('mimosa', 'delta', 0.38 * cruxReveal * starFade);
    line('alphacen', 'betacen', 0.2 * cruxReveal * starFade, [2, 4]);
    bctx.setLineDash([]);

    // el nombre, chiquito, al costado
    bctx.globalAlpha = Math.max(0, cruxReveal - 0.3) / 0.7 * 0.7 * starFade;
    bctx.fillStyle = 'rgb(235, 226, 208)';
    bctx.font = '10.5px "IBM Plex Mono", Consolas, monospace';
    bctx.fillText('cruz del sur', pos.delta.x + 14, pos.delta.y + 4);
    bctx.globalAlpha = 1;
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

  function drawStars(now, dt = 0) {
    bctx.clearRect(0, 0, w, h);
    const p = pole();
    const t = now / 1000;
    const rot = reducedMotion ? 0 : t * 0.0022 + night * 0.32;
    // al amanecer se apagan; con el cielo nublado se ven menos
    const starFade = (1 - smooth(0.82, 1, night) * 0.75) * (1 - (cloudCover / 100) * 0.35);

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
    drawCrux(now, rot, starFade);
    drawClouds(dt);
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
    // la leña nueva se consume en unos segundos
    fireBoost *= Math.pow(0.82, dt);
    const fire = (1 - smooth(0.05, 0.92, night) * 0.93) * flicker(now) * fireScale * (1 + fireBoost);
    for (const fn of fireListeners) fn(Math.min(fire, 1.35));

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
    drawStars(now, dt);
    if (reducedMotion) return;
    drawShooting(now, dt);
    drawEmbers(now, dt);
    drawRain(dt);
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
  // el lienzo no captura el mouse: lo escuchamos en la ventana (el cielo es fijo, así que coinciden)
  const onPointer = (e) => {
    pointer = { x: e.clientX, y: e.clientY };
    if (reducedMotion && !paused) draw(performance.now(), 0);
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerdown', onPointer, { passive: true });
  document.addEventListener('pointerleave', () => (pointer = { x: -9999, y: -9999 }));
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
    },
    /** Un clic es como tocar el fogón con un palo: suben unas pocas brasas desde ahí */
    burst(x, y, n = 7) {
      if (reducedMotion || paused) return;
      for (let i = 0; i < n; i++) {
        embers.push({
          x: x + rand(-6, 6),
          y: y + rand(-4, 4),
          vx: rand(-0.7, 0.7),
          vy: -rand(0.6, 1.6),
          life: 0,
          max: rand(1.1, 2.4),
          size: rand(0.7, 1.6),
          sway: rand(0.8, 2),
          ph: Math.random() * TAU,
        });
      }
    },
    /** Alguien tiró leña: el fuego crece y suben más brasas por un rato */
    boostFire() {
      if (reducedMotion || paused) return;
      fireBoost = 1.8;
      for (let i = 0; i < 70; i++) {
        spawnEmber();
        const e = embers[embers.length - 1];
        e.vy *= 1.6;
        e.y += Math.random() * 30;
      }
    },
    /** Inclinación real de la Cruz del Sur (ángulo horario en horas) */
    setCruxHourAngle(ha) {
      cruxHourAngle = ha;
      seed = 4242;
      buildCrux();
      if (reducedMotion) draw(performance.now(), 0);
    },
    /** Clima real: nubosidad (0–100) y lluvia (mm/h) */
    setWeather({ cloud = 0, rain = 0 } = {}) {
      cloudCover = Math.max(0, Math.min(100, cloud));
      rainRate = Math.max(0, rain);
      if (rainRate === 0) drops = [];
      buildClouds();
      if (reducedMotion) draw(performance.now(), 0);
    },
    /** De día no hace falta dibujar nada */
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
