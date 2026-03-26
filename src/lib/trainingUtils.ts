import { Exercise, Microcycle } from "../types";

export function calculateMicrocycles(ej: Exercise): Microcycle[] {
  const micros: Microcycle[] = [];
  let peso = ej.peso;
  let reps = ej.reps;
  
  for (let sem = 1; sem <= 4; sem++) {
    let p = peso;
    let r = reps;
    
    if (ej.tipo === 'compuesto') {
      // Compuestos: progresión ondulante
      if (sem === 2) { p = Math.round((peso + ej.incremento) * 10) / 10; r = Math.max(reps - 2, 4); }
      if (sem === 3) { p = Math.round((peso + ej.incremento * 1.5) * 10) / 10; r = Math.max(reps - 2, 4); }
      if (sem === 4) { // Descarga obligatoria
        p = Math.round((ej.peso) * 10) / 10;
        r = Math.max(Math.round(ej.reps * 0.6), 5);
      }
    } else {
      // Analíticos: Doble Progresión
      if (sem === 1) { p = peso; r = reps; }
      if (sem === 2) { r = Math.min(reps + 2, 20); if (r >= 20) { p = Math.round((peso + ej.incremento) * 10)/10; r = Math.max(reps - 4, 8); } }
      if (sem === 3) { r = Math.min(reps + 3, 20); if (r >= 18) { p = Math.round((peso + ej.incremento) * 10)/10; r = Math.max(reps - 4, 8); } }
      if (sem === 4) {
        // Descarga solo si necesaria
        p = peso; r = Math.max(Math.round(reps * 0.65), 6);
      }
    }
    micros.push({ peso: p, reps: r, semana: sem });
  }
  return micros;
}

export function formatRIR(rir: number): string {
  if (rir % 1 !== 0) {
    const b = Math.floor(rir);
    return `${b}-${b + 1}`;
  }
  return rir.toString();
}
