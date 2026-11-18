// Comportamiento común a todas las páginas. Corre una vez; lo que depende
// de la página se rearma en cada `astro:page-load` (navegación con ClientRouter).

import { animate, inView, scroll } from 'motion';
import { createSky } from './sky.js';

const ease = [0.22, 1, 0.36, 1];

export function setupSite() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const sky = createSky(document.getElementById('sky-back'), document.getElementById('sky-front'), {
    reducedMotion,
  });
  window.__skyReady = true;

  let fireTargets = [];
  sky.onFire((fire) => {
    const v = fire.toFixed(3);
    for (const el of fireTargets) el.style.setProperty('--fire', v);
  });

  let cleanups = [];
  const later = (fn) => cleanups.push(fn);

  // ClientRouter reemplaza los atributos de <html>: volvemos a marcar `js`
  document.addEventListener('astro:after-swap', () => root.classList.add('js'));

  document.addEventListener('astro:before-swap', () => {
    cleanups.forEach((fn) => fn());
    cleanups = [];
  });

  document.addEventListener('astro:page-load', () => {
    const isDay = root.dataset.theme === 'day';
    const start = Number(root.dataset.nightStart || 0);
    sky.setPaused(isDay);
    sky.setFire(Number(root.dataset.fire || 1));    fireTargets = [...document.querySelectorAll('[data-fire-target]')];

    // ---------- el scroll es el paso del tiempo ----------
    const dawn = document.querySelector('.dawn');
    later(
      scroll((progress) => {
        const night = start + (1 - start) * progress;
        sky.setNight(night);
        const t = Math.max(0, Math.min(1, (progress - 0.8) / 0.2));
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
      toggle.textContent = open ? 'cerrar' : 'menú';
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

    // ---------- ver más / ver menos ----------
    document.querySelectorAll('.toggle[aria-controls]').forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      btn.addEventListener('click', async () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? 'Ver menos' : 'Ver más';
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
