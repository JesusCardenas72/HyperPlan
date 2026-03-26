import React from 'react';
import {
  Dumbbell,
  CheckCircle2,
  RotateCcw,
  Frown,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Zap,
  BarChart3,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AppState } from '../types';

interface DashboardProps {
  state: AppState;
  onSwitchTab: (tab: string) => void;
}

export default function Dashboard({ state, onSwitchTab }: DashboardProps) {
  const totalMesos = state.mesociclosGenerados.length;

  let totalSessions = 0;
  let completedSessions = 0;
  let totalFatiga = 0;
  let fatigaCount = 0;
  const fatigaHistory: number[] = [];

  state.mesociclosGenerados.forEach(meso => {
    const num = meso.num;
    for (let sem = 1; sem <= 4; sem++) {
      Object.keys(meso.datos).forEach(diaKey => {
        const diaData = meso.datos[diaKey];
        if (diaData.ejercicios.length === 0) return;

        totalSessions++;
        const tk = state.tracking[num]?.[sem]?.[diaKey];
        if (tk?.completada) {
          completedSessions++;
          const ratedExercises = Object.values(tk.ejercicios).filter(e => e.fatiga > 0);
          if (ratedExercises.length > 0) {
            const avg = ratedExercises.reduce((s, e) => s + e.fatiga, 0) / ratedExercises.length;
            totalFatiga += avg;
            fatigaCount++;
            fatigaHistory.push(avg);
          }
        }
      });
    }
  });

  const avgFatiga = fatigaCount > 0 ? (totalFatiga / fatigaCount).toFixed(1) : '—';
  const showDeloadWarning = state.ciclosSinDescargaExtra >= 3;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <header className="relative">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1.5">
              ¡Hola, Atleta!
              <span className="ml-2 inline-block animate-[wiggle_1s_ease-in-out]">💪</span>
            </h1>
            <p className="text-app-muted text-sm flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Planificador de Sobrecarga Progresiva · {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        {/* decorative accent */}
        <div className="absolute -bottom-3 left-0 h-px w-16 bg-linear-to-r from-primary to-transparent rounded-full"></div>
      </header>

      {/* Deload Warning */}
      {showDeloadWarning && (
        <div className="relative overflow-hidden bg-linear-to-r from-amber-lt to-[#FFF3CC] border border-amber-brand/40 rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_24px_rgba(245,166,35,0.15)]">
          <div className="absolute inset-0 bg-linear-to-br from-amber-brand/5 to-transparent pointer-events-none"></div>
          <div className="w-11 h-11 bg-amber-brand rounded-xl flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(245,166,35,0.35)]">
            <AlertCircle size={22} />
          </div>
          <div>
            <h4 className="font-bold text-amber-brand text-sm">Descarga Obligatoria Próxima</h4>
            <p className="text-xs text-app-text/70 mt-0.5 leading-relaxed">
              Has completado 3 ciclos consecutivos. La semana 10 <strong>DEBE</strong> ser descarga.
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<Dumbbell size={18} />}
          label="Mesociclos"
          value={totalMesos}
          sub="generados"
          accent="#FF5A36"
          lightBg="bg-primary-lt"
          textColor="text-primary"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Sesiones"
          value={completedSessions}
          sub={`de ${totalSessions} totales`}
          accent="#00C9A7"
          lightBg="bg-teal-lt"
          textColor="text-teal-brand"
        />
        <StatCard
          icon={<RotateCcw size={18} />}
          label="Ciclos sin desc."
          value={state.ciclosSinDescargaExtra}
          sub="consecutivos"
          accent="#7C5CBF"
          lightBg="bg-purple-lt"
          textColor="text-purple-brand"
        />
        <StatCard
          icon={<Frown size={18} />}
          label="Fatiga media"
          value={avgFatiga}
          sub="escala 0–5"
          accent="#F5A623"
          lightBg="bg-amber-lt"
          textColor="text-amber-brand"
        />
      </div>

      {/* Progress + Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Progress Card */}
        <div className="glass-card p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-brand/30 to-transparent"></div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-lt flex items-center justify-center">
                <BarChart3 size={16} className="text-blue-brand" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Resumen de Progreso</h3>
                <p className="text-[9px] text-app-muted font-semibold uppercase tracking-wider">Sesiones por mesociclo</p>
              </div>
            </div>
            <button
              onClick={() => onSwitchTab('progresion')}
              className="text-primary text-[10px] font-bold flex items-center gap-1 hover:gap-2 transition-all duration-200 bg-primary-lt px-2.5 py-1 rounded-full"
            >
              Ver todo <ArrowRight size={11} />
            </button>
          </div>

          <div className="space-y-4">
            {state.mesociclosGenerados.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-app-bg/60 border border-dashed border-app-border">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-[10px] text-app-muted">Genera un mesociclo para ver el progreso</p>
              </div>
            ) : (
              state.mesociclosGenerados.slice(-3).reverse().map(meso => {
                const num = meso.num;
                let mesoTotal = 0;
                let mesoDone = 0;
                for (let s = 1; s <= 4; s++) {
                  Object.keys(meso.datos).forEach(dk => {
                    if (meso.datos[dk].ejercicios.length > 0) {
                      mesoTotal++;
                      if (state.tracking[num]?.[s]?.[dk]?.completada) mesoDone++;
                    }
                  });
                }
                const pct = mesoTotal > 0 ? Math.round((mesoDone / mesoTotal) * 100) : 0;
                const barColor = pct === 100
                  ? 'from-teal-brand to-[#00E5C2]'
                  : pct > 50
                    ? 'from-blue-brand to-[#6AABFF]'
                    : 'from-primary to-[#FF7A59]';
                return (
                  <div key={num} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">Mesociclo #{num}</span>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full",
                        pct === 100 ? "bg-teal-lt text-teal-brand" : pct > 50 ? "bg-blue-lt text-blue-brand" : "bg-primary-lt text-primary"
                      )}>
                        {mesoDone}/{mesoTotal} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-app-bg rounded-full overflow-hidden">
                      <div
                        className={cn("h-full bg-linear-to-r rounded-full transition-all duration-1000", barColor)}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Guide Card */}
        <div className="glass-card p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-primary-lt flex items-center justify-center">
              <TrendingUp size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Guía de Progresión</h3>
              <p className="text-[9px] text-app-muted font-semibold uppercase tracking-wider">Reglas clave</p>
            </div>
          </div>
          <ul className="space-y-2">
            <GuideItem
              type="comp"
              title="COMPUESTO (Ondulante)"
              desc="S1-S3 ↑kg/↓reps. S4 = Descarga."
              icon={<Zap size={12} />}
            />
            <GuideItem
              type="anal"
              title="ANALÍTICO (Doble Prog.)"
              desc="↑reps hasta techo → ↑kg y reinicia reps."
              icon={<TrendingUp size={12} />}
            />
            <GuideItem
              type="warn"
              title="RIR"
              desc="Si cae bajo objetivo en serie 1, mantener carga."
              icon={<Info size={12} />}
            />
            <GuideItem
              type="warn2"
              title="Regla 3 ciclos"
              desc="3 ciclos sin descarga → Descarga en sem 10."
              icon={<RotateCcw size={12} />}
            />
          </ul>
        </div>
      </div>

      {/* Fatigue Chart */}
      <div className="glass-card p-4 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-purple-brand/30 to-transparent"></div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-lt flex items-center justify-center">
              <BarChart3 size={16} className="text-purple-brand" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Historial de Fatiga</h3>
              <p className="text-[9px] text-app-muted font-semibold uppercase tracking-wider">Últimas sesiones completadas</p>
            </div>
          </div>
        </div>

        {fatigaHistory.length === 0 ? (
          <div className="text-center py-8 rounded-xl bg-app-bg/60 border border-dashed border-app-border">
            <p className="text-app-muted text-[10px]">Completa sesiones para ver el historial de fatiga</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end gap-1 md:gap-1.5 h-20 md:h-28 px-1">
              {fatigaHistory.slice(-20).map((f, i) => {
                const h = Math.max((f / 5) * 100, 6);
                const grad = f <= 1
                  ? 'from-teal-brand to-[#00E5C2]'
                  : f <= 2
                    ? 'from-[#85C720] to-[#A5E040]'
                    : f <= 3
                      ? 'from-amber-brand to-[#FFB84D]'
                      : f <= 4
                        ? 'from-[#FF7A44] to-[#FF9A6A]'
                        : 'from-red-deload to-[#F16A5C]';
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col justify-end"
                    style={{ height: '100%' }}
                  >
                    <div
                      className={cn("w-full rounded-t-md bg-linear-to-t transition-all duration-500 opacity-85 hover:opacity-100 hover:scale-y-105 origin-bottom cursor-default", grad)}
                      style={{ height: `${h}%` }}
                      title={`Fatiga: ${f.toFixed(1)}/5`}
                    ></div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-app-muted font-bold uppercase tracking-widest border-t border-app-border pt-3">
              <span>← Antiguo</span>
              <div className="flex gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-brand"></span> Baja
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-brand"></span> Media
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-deload"></span> Alta
                </span>
              </div>
              <span>Reciente →</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  lightBg: string;
  textColor: string;
}

function StatCard({ icon, label, value, sub, accent, lightBg, textColor }: StatCardProps) {
  return (
    <div
      className="relative overflow-hidden bg-white rounded-2xl border border-app-border shadow-[0_2px_16px_rgba(28,32,74,0.06)] p-3.5 md:p-5 flex flex-col gap-3 transition-shadow duration-200 hover:shadow-[0_4px_24px_rgba(28,32,74,0.1)]"
      style={{ borderTop: `2.5px solid ${accent}` }}
    >
      <div className={cn("w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0", lightBg, textColor)}>
        {icon}
      </div>
      <div>
        <div className="text-[9px] md:text-[10px] font-bold text-app-muted uppercase tracking-widest mb-0.5">{label}</div>
        <div className={cn("text-2xl md:text-3xl font-extrabold tracking-tight leading-none", textColor)}>{value}</div>
        <div className="text-[9px] md:text-[10px] text-app-muted font-medium mt-1">{sub}</div>
      </div>
    </div>
  );
}

function GuideItem({ type, title, desc, icon }: { type: 'comp' | 'anal' | 'warn' | 'warn2', title: string, desc: string, icon: React.ReactNode }) {
  const config = {
    comp:  { border: 'border-primary',       bg: 'bg-primary-lt',  text: 'text-primary',       iconBg: 'bg-primary',       label: 'Compuesto' },
    anal:  { border: 'border-teal-brand',    bg: 'bg-teal-lt',     text: 'text-teal-brand',    iconBg: 'bg-teal-brand',    label: 'Analítico' },
    warn:  { border: 'border-amber-brand',   bg: 'bg-amber-lt',    text: 'text-amber-brand',   iconBg: 'bg-amber-brand',   label: 'RIR' },
    warn2: { border: 'border-purple-brand',  bg: 'bg-purple-lt',   text: 'text-purple-brand',  iconBg: 'bg-purple-brand',  label: 'Ciclos' },
  }[type];

  return (
    <li className={cn("flex items-start gap-3 p-2.5 rounded-xl border-l-[3px] transition-colors duration-150 hover:brightness-[0.97]", config.border, config.bg)}>
      <div className={cn("w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0 mt-0.5", config.iconBg)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <strong className={cn("block text-[10px] font-bold mb-0.5", config.text)}>{title}:</strong>
        <span className="text-[10px] text-app-text/65 leading-snug">{desc}</span>
      </div>
    </li>
  );
}
