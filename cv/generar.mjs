// Genera los CV en PDF (public/cv/) a partir de cv-es.html y cv-en.html, con Edge o Chrome
// en modo headless. El PDF tiene texto real (lo leen bien los ATS) y los links funcionan.
//
//   node cv/generar.mjs
//
// Para cambiar algo del CV: editar el HTML y volver a correr este script.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'public', 'cv');
mkdirSync(outDir, { recursive: true });

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browser = candidates.find((p) => existsSync(p));
if (!browser) throw new Error('No encontré Edge ni Chrome. Definí CHROME_PATH con la ruta al navegador.');

const jobs = [
  ['cv-es.html', 'CV_BautistaMarinelli_ES.pdf'],
  ['cv-en.html', 'CV_BautistaMarinelli_EN.pdf'],
];

// perfil temporal propio: si el navegador ya está abierto, no se mezcla con esa ventana
const profile = mkdtempSync(path.join(tmpdir(), 'cv-pdf-'));

for (const [src, out] of jobs) {
  const target = path.join(outDir, out);
  rmSync(target, { force: true });
  execFileSync(browser, [
    '--headless=new',
    `--user-data-dir=${profile}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-pdf-header-footer',
    `--print-to-pdf=${target}`,
    pathToFileURL(path.join(here, src)).href,
  ]);
  // en Windows msedge.exe vuelve enseguida y el PDF lo escribe un proceso hijo: esperarlo
  const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  let last = -1;
  for (let i = 0; i < 60; i++) {
    const size = existsSync(target) ? statSync(target).size : -1;
    if (size > 0 && size === last) break; // ya terminó de escribirse
    last = size;
    sleep(500);
  }
  if (!existsSync(target)) throw new Error(`No se generó ${out}`);
  console.log('ok', path.relative(process.cwd(), target), statSync(target).size, 'bytes');
}
rmSync(profile, { recursive: true, force: true });
