// Comportamiento común a todas las páginas. Corre una vez; lo que depende
// de la página se rearma en cada `astro:page-load` (navegación con ClientRouter).

import { animate, inView, scroll } from 'motion';
import { createSky } from './sky.js';
import { cruxHourAngle, fireForHour, isDawnNow, rosarioWeather } from './rosario.js';

const ease = [0.22, 1, 0.36, 1];

export function setupSite() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const sky = createSky(document.getElementById('sky-back'), document.getElementById('sky-front'), {
    reducedMotion,
  });
  window.__skyReady = true;

  // El titileo del fuego llega en cada cuadro; escribirlo en el CSS 60 veces por segundo obliga
  // al navegador a recalcular estilos todo el tiempo. Con ~20 por segundo el ojo no lo distingue.
  let fireTargets = [];
  let lastFire = -1;
  let lastFireAt = 0;
  sky.onFire((fire) => {
    const now = performance.now();
    if (now - lastFireAt < 50 || Math.abs(fire - lastFire) < 0.01) return;
    lastFire = fire;
    lastFireAt = now;
    const v = fire.toFixed(2);
    for (const el of fireTargets) el.style.setProperty('--fire', v);
  });

  // ---------- el cielo real de Rosario (una vez, no por página) ----------
  // la Cruz del Sur con su inclinación de esta noche; se actualiza cada 5 minutos
  const tiltCrux = () => sky.setCruxHourAngle(cruxHourAngle());
  tiltCrux();
  setInterval(tiltCrux, 5 * 60_000);
  // nubes y lluvia si en Rosario está nublado o lloviendo
  rosarioWeather().then((wx) => wx && sky.setWeather(wx));
  // si entrás justo cuando amanece en Rosario, la página ya está amaneciendo
  const dawnNow = isDawnNow();

  // ---------- "fogón": alguien tira leña ----------
  let typed = '';
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-6);
    if (/fog[oó]n$/.test(typed)) {
      typed = '';
      sky.boostFire();
    }
  });

  // ---------- un clic suelta unas brasas (solo de noche) ----------
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (root.dataset.theme === 'day' || e.button !== 0) return;
      sky.burst(e.clientX, e.clientY);
    },
    { passive: true }
  );

  // ---------- para quien abre la consola ----------
  try {
    if (!sessionStorage.getItem('bms-hola')) {
      sessionStorage.setItem('bms-hola', '1');
      console.log(
        '%cHola.%c\nSi estás mirando cómo está hecha, ya tenemos algo en común.\nAstro + React + Motion, y un cielo dibujado a mano en canvas.\n\nbautimarinelli100@gmail.com\n\n(probá escribir «fogón»)',
        'font: 600 20px Georgia, serif; color: #f1d9b8',
        'font: 13px ui-monospace, Consolas, monospace; color: #a59e90; line-height: 1.6'
      );
    }
  } catch {}

  let cleanups = [];
  const later = (fn) => cleanups.push(fn);

  // ClientRouter reemplaza los atributos de <html>: volvemos a marcar `js`
  document.addEventListener('astro:after-swap', () => root.classList.add('js'));

  // ---------- de la noche al día (y al revés) ----------
  // Sin escenografía nueva: es el mismo cielo de la página que termina la noche.
  // Al ir a Trabajo, el texto se apaga y queda el cielo; las estrellas se apagan, el fuego
  // se consume en brasas, aparece una línea finísima de luz en el horizonte y desde ahí sube
  // la luz del día, despacio, hasta ser papel. Al volver, la luz se hunde en el horizonte,
  // queda el crepúsculo y vuelven las estrellas.
  const isDayPath = (p) => /\/(trabajo|work)\/?$/.test(p);
  let veil = null;
  let currentNight = 0; // dónde está la noche ahora (lo actualiza el scroll)
  const dawnLayer = () => document.querySelector('.dawn');
  const setNightVisual = (n) => {
    sky.setNight(n);
    const t = Math.max(0, Math.min(1, (n - 0.8) / 0.2));
    const d = dawnLayer();
    if (d) d.style.opacity = (t * t * (3 - 2 * t)).toFixed(3);
  };

  const buildVeil = () => {
    const v = document.createElement('div');
    v.className = 'veil';
    v.innerHTML = '<div class="veil-dusk"></div><div class="veil-line"></div><div class="veil-day"></div>';
    root.appendChild(v); // fuera del <body>: sobrevive al cambio de página
    return {
      root: v,
      dusk: v.querySelector('.veil-dusk'),
      line: v.querySelector('.veil-line'),
      day: v.querySelector('.veil-day'),
    };
  };

  async function sunrise(v) {
    const slow = [0.45, 0, 0.25, 1];
    // el texto se apaga: queda solo el cielo
    const page = [document.querySelector('main'), document.querySelector('.site-footer'), document.querySelector('.site-header')];
    page.forEach((el) => el && animate(el, { opacity: [1, 0] }, { duration: 0.5, ease: slow }));
    // la noche termina: las estrellas se apagan, el fuego queda en brasas, el cielo aclara apenas
    const from = currentNight;
    animate(0, 1, { duration: 1.2, ease: slow, onUpdate: (p) => setNightVisual(from + (1 - from) * p) });
    v.root.style.opacity = '1';
    // una línea finísima de luz en el horizonte
    await animate(v.line, { opacity: [0, 1], scaleX: [0.15, 1] }, { duration: 0.9, delay: 0.45, ease: slow });
    // la luz del día sube desde el horizonte hasta cubrir todo
    animate(v.line, { opacity: [1, 0] }, { duration: 0.5, delay: 0.25 });
    await animate(v.day, { y: ['100%', '-16%'] }, { duration: 1.05, ease: [0.5, 0, 0.3, 1] });
  }

  async function sunset(v) {
    const slow = [0.45, 0, 0.25, 1];
    // arranca igual que la página de día: todo papel, con el crepúsculo esperando abajo
    v.root.style.opacity = '1';
    v.dusk.style.opacity = '1';
    v.day.style.transform = 'translateY(-16%)';
    // la luz se hunde en el horizonte
    animate(v.line, { opacity: [0, 1, 1, 0], scaleX: [1, 1, 0.6, 0.15] }, { duration: 1.5, delay: 0.55, ease: slow });
    await animate(v.day, { y: ['-16%', '100%'] }, { duration: 1.05, ease: [0.5, 0, 0.3, 1] });
    await new Promise((r) => setTimeout(r, 450));
  }

  document.addEventListener('astro:before-preparation', (e) => {
    if (reducedMotion) return;
    const fromDay = root.dataset.theme === 'day';
    const toDay = isDayPath(e.to.pathname);
    if (fromDay === toDay) return;
    veil = buildVeil();
    const v = veil;
    const original = e.loader;
    e.loader = async () => {
      await Promise.all([original(), toDay ? sunrise(v) : sunset(v)]);
    };
  });
  document.addEventListener('astro:after-swap', () => {
    if (!veil) return;
    const v = veil;
    veil = null;
    // de día, el velo es papel sobre papel: se retira sin que se note.
    // de noche, el crepúsculo se abre despacio y aparecen las estrellas y las brasas.
    const toNight = root.dataset.theme !== 'day';
    animate(v.root, { opacity: [1, 0] }, { duration: toNight ? 1.4 : 0.6, ease, delay: toNight ? 0.1 : 0.05 }).then(() =>
      v.root.remove()
    );
  });

  document.addEventListener('astro:before-swap', () => {
    cleanups.forEach((fn) => fn());
    cleanups = [];
  });

  document.addEventListener('astro:page-load', () => {
    const isDay = root.dataset.theme === 'day';
    const start = Math.max(Number(root.dataset.nightStart || 0), dawnNow ? 0.8 : 0);
    sky.setPaused(isDay);
    // el fuego de la página, según la hora real en Rosario
    sky.setFire(Number(root.dataset.fire || 1) * fireForHour());
    fireTargets = [...document.querySelectorAll('[data-fire-target]')];

    // ---------- el scroll es el paso del tiempo ----------
    const dawn = document.querySelector('.dawn');
    later(
      scroll((progress) => {
        if (veil) return; // durante la transición manda la transición
        const night = start + (1 - start) * progress;
        currentNight = night;
        sky.setNight(night);
        const t = Math.max(0, Math.min(1, (night - 0.8) / 0.2));
        dawn.style.opacity = (t * t * (3 - 2 * t)).toFixed(3);
      })
    );

    // ---------- header ----------
    const header = document.querySelector('.site-header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    later(() => window.removeEventListener('scroll', onScroll));
    onScroll();

    const toggle = document.querySelector('.nav-toggle');
    const links = document.getElementById('nav-links');
    toggle?.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? toggle.dataset.close || 'cerrar' : toggle.dataset.open || 'menú';
      links.classList.toggle('is-open', open);
    });

    // ---------- aparecer despacio ----------
    if (reducedMotion) {
      document.querySelectorAll('.reveal').forEach((el) => (el.style.opacity = '1'));
    } else {
      later(
        inView(
          '.reveal',
          (el) => {
            animate(el, { opacity: [0, 1], y: [16, 0], filter: ['blur(6px)', 'blur(0px)'] }, { duration: 1.1, ease });
          },
          { amount: 0.15 }
        )
      );
    }

    // ---------- la firma, escrita con una brasa ----------
    // Una punta encendida recorre cada letra a velocidad pareja; el trazo queda caliente
    // (color brasa) y se enfría hasta el color de la tinta.
    const signature = document.querySelector('[data-signature]');
    if (signature && !reducedMotion) {
      const paths = [...signature.querySelectorAll('path')];
      const ember = signature.querySelector('.sig-ember');
      const lengths = paths.map((p) => p.getTotalLength());
      // escondida hasta que aparezca en pantalla
      paths.forEach((p, i) => {
        p.style.strokeDasharray = `${lengths[i]} ${lengths[i]}`;
        p.style.strokeDashoffset = `${lengths[i]}`;
      });
      let cancelled = false;
      const write = async () => {
        let elapsed = 0;
        for (let i = 0; i < paths.length && !cancelled; i++) {
          const p = paths[i];
          const L = lengths[i];
          const delay = Number(p.dataset.delay) - elapsed;
          if (delay > 0) await new Promise((r) => setTimeout(r, delay * 1000));
          const dur = Number(p.dataset.dur);
          p.classList.add('is-hot');
          ember.style.opacity = '1';
          await animate(0, 1, {
            duration: dur,
            ease: [0.3, 0.05, 0.7, 0.95],
            onUpdate: (t) => {
              p.style.strokeDashoffset = `${L * (1 - t)}`;
              const pt = p.getPointAtLength(L * t);
              ember.setAttribute('cx', pt.x.toFixed(1));
              ember.setAttribute('cy', pt.y.toFixed(1));
            },
          });
          ember.style.opacity = '0'; // la mano se levanta
          // el trazo se enfría
          p.classList.add('is-cooling');
          requestAnimationFrame(() => p.classList.remove('is-hot'));
          elapsed = Number(p.dataset.delay) + dur;
        }
      };
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          write();
        },
        { threshold: 0.6 }
      );
      io.observe(signature);
      later(() => {
        cancelled = true;
        io.disconnect();
      });
    }

    // ---------- ver más / ver menos ----------
    document.querySelectorAll('.toggle[aria-controls]').forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      btn.addEventListener('click', async () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? btn.dataset.less || 'Ver menos' : btn.dataset.more || 'Ver más';
        if (reducedMotion) {
          panel.hidden = !open;
          return;
        }
        if (open) {
          panel.hidden = false;
          await animate(panel, { height: [0, panel.scrollHeight], opacity: [0, 1] }, { duration: 0.7, ease });
          panel.style.height = 'auto';
        } else {
          await animate(panel, { height: [panel.offsetHeight, 0], opacity: [1, 0] }, { duration: 0.5, ease });
          panel.hidden = true;
          panel.style.height = '';
          panel.style.opacity = '';
        }
      });
    });

    // ---------- filtros de la bitácora ----------
    const filters = document.querySelector('[data-filters]');
    if (filters) {
      const items = [...document.querySelectorAll('[data-type]')];
      const months = [...document.querySelectorAll('[data-month]')];
      filters.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-filter]');
        if (!btn) return;
        const type = btn.dataset.filter;
        filters.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        items.forEach((it) => (it.hidden = type !== 'todo' && it.dataset.type !== type));
        // ocultar meses que quedaron vacíos
        months.forEach((m) => {
          m.hidden = !items.some((it) => !it.hidden && it.dataset.monthOf === m.dataset.month);
        });
      });
    }
  });
}
