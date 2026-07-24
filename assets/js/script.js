// Typing effect for hero role
const roles = ['Backend Developer', 'Analista Funcional', 'Analista de Datos', 'Soporte IT'];
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

// Terminal typing effect
const terminalLines = ['$ whoami', 'bautista_dev', '$ status', 'ready ✓'];
const terminalText = terminalLines.join('\n');
const terminalEl = document.getElementById('terminal-typed');

if (terminalEl) {
  let terminalIndex = 0;

  function terminalTypeLoop() {
    if (terminalIndex <= terminalText.length) {
      terminalEl.textContent = terminalText.slice(0, terminalIndex);
      terminalIndex++;
      setTimeout(terminalTypeLoop, 55);
    } else {
      setTimeout(() => {
        terminalEl.textContent = '';
        terminalIndex = 0;
        setTimeout(terminalTypeLoop, 500);
      }, 2600);
    }
  }

  terminalTypeLoop();
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
