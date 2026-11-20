/**
 * Fase lunar aproximada (suficiente para dibujarla bien; error de horas, no de días).
 * Referencia: luna nueva del 6 de enero de 2000, 18:14 UTC. Mes sinódico: 29.530588853 días.
 */
const SYNODIC = 29.530588853;
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export interface MoonPhase {
  /** 0 = nueva, 0.25 = cuarto creciente, 0.5 = llena, 0.75 = cuarto menguante */
  phase: number;
  /** fracción iluminada del disco (0–1) */
  illumination: number;
  waxing: boolean;
}

export function moonPhase(date = new Date()): MoonPhase {
  const days = (date.getTime() - REF_NEW_MOON) / 86_400_000;
  const phase = (((days / SYNODIC) % 1) + 1) % 1;
  return {
    phase,
    illumination: (1 - Math.cos(2 * Math.PI * phase)) / 2,
    waxing: phase < 0.5,
  };
}

/**
 * Camino SVG de la parte iluminada, para un disco de radio r centrado en (0, 0),
 * con la luz del lado derecho (después se espeja según hemisferio y creciente/menguante).
 */
export function litPath(phase: number, r: number): string {
  const k = Math.cos(2 * Math.PI * phase); // 1 nueva … -1 llena
  const rx = Math.abs(k) * r;
  const sweep = k > 0 ? 0 : 1; // creciente fina: el terminador se curva hacia la luz
  return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx} ${r} 0 0 ${sweep} 0 ${-r} Z`;
}
