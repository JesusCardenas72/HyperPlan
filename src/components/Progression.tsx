import React from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Activity, 
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Info,
  HelpCircle,
  Zap,
  Dumbbell,
  Target,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AppState } from '../types';
import { calculateMicrocycles } from '../lib/trainingUtils';

interface ProgressionProps {
  state: AppState;
  onSwitchTab: (tab: string) => void;
}

export default function Progression({ state, onSwitchTab }: ProgressionProps) {
  if (state.mesociclosGenerados.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-app-border">
        <div className="text-6xl mb-6">🚀</div>
        <h3 className="text-xl font-bold mb-2">Aún no hay datos de progresión</h3>
        <p className="text-app-muted max-w-xs mx-auto mb-8">Genera mesociclos y completa sesiones para ver tu progresión aquí.</p>
        <button 
          onClick={() => onSwitchTab('planificacion')}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-[#e04a28] transition-all"
        >
          Empezar →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Progresión 📈</h1>
        <p className="text-app-muted text-sm">Resumen de tu avance y control de ciclos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state.mesociclosGenerados.map(meso => {
          const num = meso.num;
          let totalSessions = 0;
          let completedSessions = 0;
          let totalExercises = 0;
          let completedExercises = 0;
          let sumFatiga = 0;
          let fatigaCount = 0;

          for (let sem = 1; sem <= 4; sem++) {
            Object.keys(meso.datos).forEach(diaKey => {
              const diaData = meso.datos[diaKey];
              if (diaData.ejercicios.length === 0) return;
              
              totalSessions++;
              const tk = state.tracking[num]?.[sem]?.[diaKey];
              if (tk?.completada) completedSessions++;
              
              diaData.ejercicios.forEach(ej => {
                totalExercises++;
                if (tk?.ejercicios[ej.id]?.done) completedExercises++;
                if (tk?.ejercicios[ej.id]?.fatiga > 0) {
                  sumFatiga += tk.ejercicios[ej.id].fatiga;
                  fatigaCount++;
                }
              });
            });
          }

          const pct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
          const avgF = fatigaCount > 0 ? (sumFatiga / fatigaCount).toFixed(1) : '—';

          return (
            <div key={num} className="glass-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Mesociclo #{num}</h3>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  pct === 100 ? "bg-teal-lt text-teal-brand" : "bg-blue-lt text-blue-brand"
                )}>
                  {pct}% completado
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-app-muted">Sesiones</span>
                  <span>{completedSessions}/{totalSessions}</span>
                </div>
                <div className="h-2.5 bg-app-bg rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      pct === 100 ? "bg-teal-brand" : "bg-blue-brand"
                    )}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="bg-app-bg/50 rounded-xl md:rounded-2xl p-2 md:p-4 text-center border border-app-border/30">
                  <div className="text-lg md:text-xl font-extrabold">{completedSessions}</div>
                  <div className="text-[8px] md:text-[9px] font-bold text-app-muted uppercase tracking-widest mt-0.5 md:mt-1">Sesiones ✓</div>
                </div>
                <div className="bg-app-bg/50 rounded-xl md:rounded-2xl p-2 md:p-4 text-center border border-app-border/30">
                  <div className="text-lg md:text-xl font-extrabold">{completedExercises}/{totalExercises}</div>
                  <div className="text-[8px] md:text-[9px] font-bold text-app-muted uppercase tracking-widest mt-0.5 md:mt-1">Ejercicios</div>
                </div>
                <div className="bg-app-bg/50 rounded-xl md:rounded-2xl p-2 md:p-4 text-center border border-app-border/30">
                  <div className="text-lg md:text-xl font-extrabold">{avgF}</div>
                  <div className="text-[8px] md:text-[9px] font-bold text-app-muted uppercase tracking-widest mt-0.5 md:mt-1">Fatiga Ø</div>
                </div>
              </div>

              {completedSessions > 0 && (
                <div className="space-y-3 pt-4 border-t border-app-border/50">
                  <h4 className="text-[10px] font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} className="text-primary" />
                    Progresión por ejercicio
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(meso.datos).map(([diaKey, diaData]) => (
                      diaData.ejercicios.map(ej => {
                        const micros = calculateMicrocycles(ej);
                        return (
                          <div key={ej.id} className="flex items-center justify-between py-2 border-b border-app-border/30 last:border-0">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold">{ej.nombre}</span>
                              <span className="text-[10px] text-app-muted">{ej.tipo === 'compuesto' ? '🔴 Compuesto' : '🟢 Analítico'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-app-muted">{ej.peso}kg</span>
                              <ArrowUpRight size={14} className="text-primary" />
                              <span className="font-bold text-primary">{micros[2].peso}kg</span>
                              <span className="text-[10px] text-app-muted">× {micros[2].reps}r</span>
                            </div>
                          </div>
                        );
                      })
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Stats Summary */}
      <div className="glass-card p-4 md:p-8 bg-app-text text-white">
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
            <BarChart3 size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold">Resumen Global</h3>
            <p className="text-[10px] md:text-xs text-white/60">Consolidado de todos los mesociclos</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <GlobalStat label="Mesociclos" value={state.mesociclosGenerados.length} />
          <GlobalStat 
            label="Sesiones" 
            value={Object.values(state.tracking).reduce((acc, meso) => {
              return acc + Object.values(meso).reduce((acc2, sem) => {
                return acc2 + Object.values(sem).filter(s => s.completada).length;
              }, 0);
            }, 0)} 
          />
          <GlobalStat 
            label="Ejercicios" 
            value={Object.values(state.tracking).reduce((acc, meso) => {
              return acc + Object.values(meso).reduce((acc2, sem) => {
                return acc2 + Object.values(sem).reduce((acc3, s) => {
                  return acc3 + Object.values(s.ejercicios).filter(e => e.done).length;
                }, 0);
              }, 0);
            }, 0)} 
          />
          <GlobalStat label="Ciclos sin desc." value={state.ciclosSinDescargaExtra} />
        </div>
      </div>

      {/* PROGRESSION GUIDE SECTION */}
      <div className="space-y-6 pt-8 border-t border-app-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-lt text-primary rounded-xl">
            <BookOpen size={20} />
          </div>
          <h2 className="text-2xl font-bold">Guía de Sobrecarga Progresiva 📚</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progression Models */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
              <Target size={16} className="text-primary" />
              Modelos de Progresión
            </h3>
            
            <div className="space-y-3">
              <StrategyCard 
                title="Aumento Lineal de Carga"
                level="Principiantes"
                exercises="Compuestos"
                description="Consiste en aumentar la carga mientras se mantiene el mismo número de repeticiones y series en todas las sesiones."
                example="Semana 1: 3x8x100kg → Semana 2: 3x8x102.5kg"
                icon={<ArrowUpRight size={18} />}
              />
              <StrategyCard 
                title="Periodización Lineal (Ondulante)"
                level="Intermedios / Aislamiento Principiantes"
                exercises="Compuestos / Aislamiento"
                description="Reducir repeticiones en cada sesión mientras se aumenta la carga, manteniendo las series constantes."
                example="Sem. 1: 3x8x100kg → Sem. 2: 3x7x102.5kg → Sem. 3: 3x6x105kg"
                icon={<RefreshCw size={18} />}
              />
              <StrategyCard 
                title="Doble Progresión"
                level="Intermedios / Avanzados"
                exercises="Aislamiento"
                description="Aumentar repeticiones con la misma carga hasta alcanzar el tope del rango en todas las series, luego subir carga y reiniciar."
                example="25kg x 12,12,12 → 25kg x 15,15,15 → 27.5kg x 12,12,12"
                icon={<Activity size={18} />}
              />
              <StrategyCard 
                title="Periodización en Bloques"
                level="Avanzados"
                exercises="Compuestos"
                description="Enfoque secuencial: Acumulación (volumen alto, RPE moderado) → Intensificación (volumen bajo, RPE alto) → Taper/Marcas."
                example="Semanas 1-6: Acumulación (15-20 series) → Semanas 7-10: Intensificación (14 series, RPE 8-10)"
                icon={<BarChart3 size={18} />}
              />
            </div>
          </div>

          {/* Deload Evaluation */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-app-muted uppercase tracking-widest flex items-center gap-2">
              <HelpCircle size={16} className="text-blue-brand" />
              Evaluación de Final de Bloque (Descarga)
            </h3>
            
            <div className="glass-card p-6 bg-blue-lt/30 border-blue-brand/20">
              <p className="text-xs text-app-muted mb-6 leading-relaxed">
                Al terminar cada mesociclo, evalúa si necesitas una descarga (semana 4) o si puedes continuar con el siguiente bloque.
              </p>
              
              <div className="space-y-4">
                <QuestionItem text="¿Ha disminuido tu motivación por entrenar?" />
                <QuestionItem text="¿Ha empeorado la calidad de tu sueño?" />
                <QuestionItem text="¿Tus cargas o repeticiones van a menos?" />
                <QuestionItem text="¿Sientes mayores niveles de estrés?" />
                <QuestionItem text="¿Sientes más molestias o dolores de lo normal?" />
              </div>

              <div className="mt-8 p-4 bg-white rounded-2xl border border-blue-brand/10 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-brand text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">0-1</div>
                  <p className="text-[11px] font-medium"><strong>"Sí" a 0-1 preguntas:</strong> Pasa directamente al siguiente mesociclo.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-brand text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2+</div>
                  <p className="text-[11px] font-medium"><strong>"Sí" a 2+ preguntas:</strong> Haz una semana de descarga (volumen reducido).</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-deload text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">!</div>
                  <p className="text-[11px] font-medium"><strong>"Sí" solo a molestias:</strong> Semana con cargas ligeras y altas repeticiones.</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-lt border-l-4 border-amber-brand p-4 rounded-r-xl">
              <div className="flex gap-3">
                <Info className="text-amber-brand shrink-0" size={18} />
                <p className="text-[11px] leading-relaxed italic">
                  "Asegúrate de hacer siempre una descarga tras completar tres mesociclos consecutivos si no has incluido ninguna entre ellos."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlobalStat({ label, value }: { label: string, value: number | string }) {
  return (
    <div className="space-y-0.5 md:space-y-1">
      <div className="text-[9px] md:text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</div>
      <div className="text-2xl md:text-4xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

function StrategyCard({ title, level, exercises, description, example, icon }: { title: string, level: string, exercises: string, description: string, example: string, icon: React.ReactNode }) {
  return (
    <div className="glass-card p-5 border-app-border/50 hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="p-2 bg-app-bg rounded-xl text-app-muted group-hover:text-primary transition-colors">
          {icon}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] font-bold px-2 py-0.5 bg-teal-lt text-teal-brand rounded-full uppercase tracking-tighter">{level}</span>
          <span className="text-[9px] font-bold px-2 py-0.5 bg-app-bg text-app-muted rounded-full uppercase tracking-tighter">{exercises}</span>
        </div>
      </div>
      <h4 className="font-bold text-sm mb-2">{title}</h4>
      <p className="text-xs text-app-muted leading-relaxed mb-4">{description}</p>
      <div className="bg-app-bg/50 p-3 rounded-xl border border-app-border/30">
        <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest block mb-1">Ejemplo:</span>
        <code className="text-[11px] font-mono text-primary">{example}</code>
      </div>
    </div>
  );
}

function QuestionItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-app-border/30">
      <div className="w-2 h-2 rounded-full bg-blue-brand/30"></div>
      <span className="text-xs font-medium text-app-text">{text}</span>
    </div>
  );
}
