export type ExerciseType = 'compuesto' | 'analitico';
export type ProgressionType = 'ondulante' | 'lineal';

export interface Exercise {
  id: string;
  nombre: string;
  peso: number;
  reps: number;
  series: number;
  incremento: number;
  tipo: ExerciseType;
  rir: number;
  notas: string;
  supersetWithNext?: boolean;
  session?: 'mañana' | 'tarde' | 'única';
}

export interface DayPlan {
  id: string;
  nombre: string;
  foco: string;
  ejercicios: Exercise[];
}

export interface Microcycle {
  peso: number;
  reps: number;
  semana: number;
}

export interface Mesocycle {
  num: number;
  fechaStr: string;
  datos: Record<string, DayPlan>;
}

export interface SerieTracking {
  kg: number;
  reps: number;
  rir: number;
  done: boolean;
}

export interface ExerciseTracking {
  done: boolean;
  fatiga: number;
  series: SerieTracking[];
}

export interface SessionTracking {
  completada: boolean;
  fatiga: number;
  ejercicios: Record<string, ExerciseTracking>;
}

export interface RestTimes {
  betweenSets: number;
  betweenExercises: number;
  supersetAB: number;
  supersetBA: number;
  afterSuperset: number;
}

export interface AppState {
  datosReferencia: Record<string, DayPlan>;
  mesociclosGenerados: Mesocycle[];
  contadorMesociclos: number;
  tracking: Record<number, Record<number, Record<string, SessionTracking>>>;
  ciclosSinDescargaExtra: number;
  restTimes: RestTimes;
}
