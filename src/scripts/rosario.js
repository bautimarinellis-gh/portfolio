// El cielo y el clima reales de Rosario: cuentas astronómicas aproximadas (de sobra para
// dibujar) y el clima actual de Open-Meteo (gratis, sin clave).

export const ROSARIO = { lat: -32.95, lon: -60.65, tz: 'America/Argentina/Buenos_Aires' };

const DAY = 86_400_000;
const J2000 = Date.UTC(2000, 0, 1, 12);
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** Hora local de Rosario como número (ej. 23.5 = 23:30). */
export function rosarioHour(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: ROSARIO.tz,
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === 'hour').value) % 24;
  const m = Number(parts.find((p) => p.type === 'minute').value);
  return h + m / 60;
}

/** Hora sideral local (horas). */
export function localSiderealTime(date = new Date(), lon = ROSARIO.lon) {
  const d = (date.getTime() - J2000) / DAY;
  const gmst = 18.697374558 + 24.06570982441908 * d;
  return (((gmst + lon / 15) % 24) + 24) % 24;
}

/** Ángulo horario de la Cruz del Sur (AR ≈ 12 h 27 min), entre -12 y 12 h. */
export function cruxHourAngle(date = new Date()) {
  let ha = localSiderealTime(date) - 12.45;
  if (ha > 12) ha -= 24;
  if (ha < -12) ha += 24;
  return ha;
}

/**
 * Salida del sol de hoy en Rosario, como Date (algoritmo de la ecuación del amanecer,
 * error de un par de minutos).
 */
export function sunriseToday(date = new Date(), { lat, lon } = ROSARIO) {
  const n = Math.floor((date.getTime() - J2000) / DAY + 0.0008);
  const jStar = n - lon / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(rad(M)) + 0.02 * Math.sin(rad(2 * M)) + 0.0003 * Math.sin(rad(3 * M));
  const lambda = (M + C + 180 + 102.9372) % 360;
  const jTransit = jStar + 0.0053 * Math.sin(rad(M)) - 0.0069 * Math.sin(rad(2 * lambda));
  const decl = Math.asin(Math.sin(rad(lambda)) * Math.sin(rad(23.44)));
  const cosW = (Math.sin(rad(-0.833)) - Math.sin(rad(lat)) * Math.sin(decl)) / (Math.cos(rad(lat)) * Math.cos(decl));
  const w0 = deg(Math.acos(Math.max(-1, Math.min(1, cosW))));
  const jRise = jTransit - w0 / 360;
  return new Date(J2000 + jRise * DAY);
}

/** ¿Está amaneciendo en Rosario ahora? (de 40 min antes a 20 min después de la salida del sol) */
export function isDawnNow(date = new Date()) {
  const rise = sunriseToday(date).getTime();
  const t = date.getTime();
  return t > rise - 40 * 60_000 && t < rise + 20 * 60_000;
}

/**
 * Cuánto fuego hay según la hora real: fuerte a la noche temprano, brasas de madrugada.
 * De día la página igual es de noche (es la ficción), con un fuego tranquilo.
 */
export function fireForHour(hour = rosarioHour()) {
  if (hour >= 19 || hour < 0.5) return 1;
  if (hour < 3) return 0.72;
  if (hour < 6.5) return 0.42;
  return 0.85;
}

/** Clima actual de Rosario (cacheado 20 min en la sesión). Nunca tira error: si falla, null. */
export async function rosarioWeather() {
  const KEY = 'rosario-weather';
  try {
    const cached = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (cached && Date.now() - cached.at < 20 * 60_000) return cached.data;
  } catch {}
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${ROSARIO.lat}&longitude=${ROSARIO.lon}` +
      '&current=cloud_cover,precipitation,rain,weather_code&timezone=auto';
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const data = {
      cloud: Number(json.current?.cloud_cover ?? 0),
      rain: Number(json.current?.rain ?? json.current?.precipitation ?? 0),
    };
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data }));
    } catch {}
    return data;
  } catch {
    return null;
  }
}
