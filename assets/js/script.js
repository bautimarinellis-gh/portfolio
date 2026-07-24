// Typing effect for hero role
const roles = ['Backend Developer', 'Analista Funcional', 'QA / Testing'];
const typedEl = document.getElementById('typed-role');

let roleIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
  const current = roles[roleIndex];

  if (!deleting) {
    charIndex++;
    typedEl.textContent = current.slice(0, charIndex);
    if (charIndex === current.length) {
      deleting = true;
      setTimeout(typeLoop, 1400);
      return;
    }
  } else {
    charIndex--;
    typedEl.textContent = current.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
    }
  }

  setTimeout(typeLoop, deleting ? 45 : 90);
}

typeLoop();

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.getElementById('nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const willOpen = navToggle.getAttribute('aria-expanded') !== 'true';
    navToggle.setAttribute('aria-expanded', String(willOpen));
    navLinks.classList.toggle('is-open', willOpen);
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('is-open');
    });
  });
}

// Nav active-link on scroll
const navLinkEls = document.querySelectorAll('.nav-links a');
const sections = Array.from(navLinkEls)
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function updateActiveNavLink() {
  const offset = 120;
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  let current = atBottom ? sections[sections.length - 1] : null;

  if (!atBottom) {
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top - offset <= 0) {
        current = section;
      }
    });
  }

  navLinkEls.forEach((link) => {
    link.classList.toggle('is-active', !!current && link.getAttribute('href') === `#${current.id}`);
  });
}

let navScrollTicking = false;

window.addEventListener('scroll', () => {
  if (navScrollTicking) return;
  navScrollTicking = true;
  requestAnimationFrame(() => {
    updateActiveNavLink();
    navScrollTicking = false;
  });
}, { passive: true });

window.addEventListener('resize', updateActiveNavLink);
updateActiveNavLink();

// Back to top: land at the true document top, not just below the sticky header
const backToTop = document.querySelector('.footer-links a[href="#inicio"]');

if (backToTop) {
  backToTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Project card "Ver más / Ver menos" toggle
document.querySelectorAll('.project-toggle').forEach((btn) => {
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  if (!panel) return;

  btn.addEventListener('click', () => {
    const willOpen = btn.getAttribute('aria-expanded') !== 'true';

    panel.classList.toggle('is-open', willOpen);
    panel.style.maxHeight = willOpen ? panel.scrollHeight + 'px' : '0px';
    btn.setAttribute('aria-expanded', String(willOpen));
    btn.textContent = willOpen ? 'Ver menos' : 'Ver más';
  });
});

window.addEventListener('resize', () => {
  document.querySelectorAll('.project-collapse.is-open').forEach((panel) => {
    panel.style.maxHeight = panel.scrollHeight + 'px';
  });
});

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach((el) => observer.observe(el));
