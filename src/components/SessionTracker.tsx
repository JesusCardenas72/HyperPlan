import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  Info, 
  AlertTriangle,
  Zap,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AppState, SessionTracking, ExerciseTracking } from '../types';
import { calculateMicrocycles, formatRIR } from '../lib/trainingUtils';
import ConfirmModal from './ConfirmModal';
import { RestTimerBar } from './RestTimerBar';

interface SessionTrackerProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  onSwitchTab: (tab: string) => void;
}

const WEEK_LABELS = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4 — DESCARGA ♻️'];

export default function SessionTracker({ state, updateState, onSwitchTab }: SessionTrackerProps) {
  const [activeMesoIdx, setActiveMesoIdx] = useState(state.mesociclosGenerados.length - 1);
  const [activeWeek, setActiveWeek] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, diaKey: string, ejId: string, ejNombre: string }>({
    isOpen: false,
    diaKey: '',
    ejId: '',
    ejNombre: ''
  });

  const cleanDayName = (name: string) => {
    if (!name) return '';
    return name.includes(':') ? name.split(':')[1].trim() : name;
  };

  if (state.mesociclosGenerados.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-app-border">
        <div className="text-6xl mb-6">📭</div>
        <h3 className="text-xl font-bold mb-2">Sin mesociclos generados</h3>
        <p className="text-app-muted max-w-xs mx-auto mb-8">Ve a Planificación, introduce tus datos y genera un mesociclo para empezar el seguimiento.</p>
        <button 
          onClick={() => onSwitchTab('planificacion')}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-[#e04a28] transition-all"
        >
          Ir a Planificación →
        </button>
      </div>
    );
  }

  const activeMeso = state.mesociclosGenerados[activeMesoIdx];
  const mesoNum = activeMeso.num;

  const toggleExercise = (mNum: number, sem: number, diaKey: string, ejId: string) => {
    updateState(prev => {
      const mesoTracking = prev.tracking[mNum];
      if (!mesoTracking) return prev;
      const weekTracking = mesoTracking[sem];
      if (!weekTracking) return prev;
      const dayTracking = weekTracking[diaKey];
      if (!dayTracking) return prev;
      
      const ejTracking = dayTracking.ejercicios[ejId] || { done: false, fatiga: 0, series: [] };

      const newEjTracking = { ...ejTracking, done: !ejTracking.done };
      const newEjercicios = { ...dayTracking.ejercicios, [ejId]: newEjTracking };
      
      const allDone = Object.values(newEjercicios).length > 0 && Object.values(newEjercicios).every((e: any) => e.done);
      
      return {
        ...prev,
        tracking: {
          ...prev.tracking,
          [mNum]: {
            ...mesoTracking,
            [sem]: {
              ...weekTracking,
              [diaKey]: {
                ...dayTracking,
                ejercicios: newEjercicios,
                completada: allDone
              }
            }
          }
        }
      };
    });
  };

  const toggleSession = (mNum: number, sem: number, diaKey: string) => {
    updateState(prev => {
      const mesoTracking = prev.tracking[mNum];
      if (!mesoTracking) return prev;
      const weekTracking = mesoTracking[sem];
      if (!weekTracking) return prev;
      const dayTracking = weekTracking[diaKey];
      if (!dayTracking) return prev;
      
      const isCompleting = !dayTracking.completada;
      const newEjercicios = { ...dayTracking.ejercicios };
      
      Object.keys(newEjercicios).forEach(id => {
        newEjercicios[id] = { ...newEjercicios[id], done: isCompleting };
      });

      return {
        ...prev,
        tracking: {
          ...prev.tracking,
          [mNum]: {
            ...mesoTracking,
            [sem]: {
              ...weekTracking,
              [diaKey]: {
                ...dayTracking,
                completada: isCompleting,
                ejercicios: newEjercicios
              }
            }
          }
        }
      };
    });
  };

  const setFatiga = (mNum: number, sem: number, diaKey: string, ejId: string, level: number) => {
    updateState(prev => {
      const mesoTracking = prev.tracking[mNum];
      if (!mesoTracking) return prev;
      const weekTracking = mesoTracking[sem];
      if (!weekTracking) return prev;
      const dayTracking = weekTracking[diaKey];
      if (!dayTracking) return prev;
      
      const ejTracking = dayTracking.ejercicios[ejId] || { done: false, fatiga: 0, series: [] };

      const newEjTracking = { 
        ...ejTracking, 
        fatiga: ejTracking.fatiga === level ? 0 : level 
      };

      return {
        ...prev,
        tracking: {
          ...prev.tracking,
          [mNum]: {
            ...mesoTracking,
            [sem]: {
              ...weekTracking,
              [diaKey]: {
                ...dayTracking,
                ejercicios: {
                  ...dayTracking.ejercicios,
                  [ejId]: newEjTracking
                }
              }
            }
          }
        }
      };
    });
  };

  const removeExerciseFromTracker = (diaKey: string, ejId: string) => {
    updateState(prev => {
      const newMesos = [...prev.mesociclosGenerados];
      const meso = { ...newMesos[activeMesoIdx] };
      const dayData = { ...meso.datos[diaKey] };
      dayData.ejercicios = dayData.ejercicios.filter(e => e.id !== ejId);
      meso.datos = { ...meso.datos, [diaKey]: dayData };
      newMesos[activeMesoIdx] = meso;

      // Clean up tracking
      const newTracking = { ...prev.tracking };
      const mesoNum = meso.num;
      [1, 2, 3, 4].forEach(sem => {
        if (newTracking[mesoNum]?.[sem]?.[diaKey]?.ejercicios[ejId]) {
          const newDayTracking = { ...newTracking[mesoNum][sem][diaKey] };
          const newEjTracking = { ...newDayTracking.ejercicios };
          delete newEjTracking[ejId];
          newDayTracking.ejercicios = newEjTracking;
          
          // Re-check session completion
          const allDone = Object.values(newEjTracking).length > 0 && Object.values(newEjTracking).every((e: any) => e.done);
          newDayTracking.completada = allDone;
          
          newTracking[mesoNum][sem][diaKey] = newDayTracking;
        }
      });

      return { ...prev, mesociclosGenerados: newMesos, tracking: newTracking };
    });
  };

  const getSessionAvgFatiga = (sem: number, diaKey: string) => {
    const tk = state.tracking[mesoNum]?.[sem]?.[diaKey];
    if (!tk) return 0;
    const rated = Object.values(tk.ejercicios).filter(e => e.fatiga > 0);
    if (rated.length === 0) return 0;
    return rated.reduce((s, e) => s + e.fatiga, 0) / rated.length;
  };

  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [activeSerieIndex, setActiveSerieIndex] = useState<number>(0);
  const [activeSupersetPart, setActiveSupersetPart] = useState<'A' | 'B'>('A');
  const [isResting, setIsResting] = useState<boolean>(false);
  const [manualRestTime, setManualRestTime] = useState<number | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const isExerciseFinished = (ejId: string, diaKey: string) => {
    const tk = state.tracking[mesoNum]?.[activeWeek]?.[diaKey]?.ejercicios[ejId];
    if (!tk || !tk.series) return false;
    const ej = activeMeso.datos[diaKey].ejercicios.find(e => e.id === ejId);
    if (!ej) return false;
    // Check if all series are done
    return Object.values(tk.series).filter(s => s.done).length >= ej.series;
  };

  // Initial active exercise selection
  useEffect(() => {
    if (!activeExerciseId) {
      const firstDay = Object.entries(activeMeso.datos).find(([_, d]) => d.ejercicios.length > 0);
      if (firstDay) {
        const firstEj = firstDay[1].ejercicios[0];
        setActiveExerciseId(firstEj.id);
      }
    }
  }, [activeMesoIdx, activeWeek, activeExerciseId, activeMeso.datos]);

  const toggleDay = (diaKey: string) => {
    setExpandedDays(prev => {
      const isExpanding = !prev[diaKey];
      if (isExpanding) {
        // Find first unfinished exercise in this session
        const session = state.mesociclosGenerados[activeMesoIdx].datos[diaKey];
        const exercises = session.ejercicios;
        const firstUnfinished = exercises.find(ej => !isExerciseFinished(ej.id, diaKey)) || exercises[0];
        if (firstUnfinished) {
          setActiveExerciseId(firstUnfinished.id);
          setActiveSerieIndex(0);
          setActiveSupersetPart('A');
          setIsResting(false);
          setManualRestTime(null);
        }
      }
      return { ...prev, [diaKey]: isExpanding };
    });
  };

  const updateSerieData = (mNum: number, sem: number, diaKey: string, ejId: string, serieIndex: number, field: 'kg' | 'reps' | 'rir', delta: number) => {
    updateState(prev => {
      const mesoTracking = prev.tracking[mNum];
      if (!mesoTracking) return prev;
      const weekTracking = mesoTracking[sem];
      if (!weekTracking) return prev;
      const dayTracking = weekTracking[diaKey];
      if (!dayTracking) return prev;
      
      const ejTracking = dayTracking.ejercicios[ejId] || { done: false, fatiga: 0, series: [] };
      const series = [...(ejTracking.series || [])];
      
      if (!series[serieIndex]) {
        const meso = state.mesociclosGenerados.find(m => m.num === mNum);
        const ej = meso?.datos[diaKey].ejercicios.find(e => e.id === ejId);
        const micros = ej ? calculateMicrocycles(ej) : [];
        const micro = micros[sem - 1] || { peso: 0, reps: 0 };
        series[serieIndex] = { kg: micro.peso, reps: micro.reps, rir: ej?.rir || 0, done: false };
      }
      
      series[serieIndex] = {
        ...series[serieIndex],
        [field]: Math.max(0, Number((series[serieIndex][field] + delta).toFixed(2)))
      };

      const newEjTracking = { ...ejTracking, series };

      return {
        ...prev,
        tracking: {
          ...prev.tracking,
          [mNum]: {
            ...mesoTracking,
            [sem]: {
              ...weekTracking,
              [diaKey]: {
                ...dayTracking,
                ejercicios: {
                  ...dayTracking.ejercicios,
                  [ejId]: newEjTracking
                }
              }
            }
          }
        }
      };
    });
  };

  const getSerieData = (mNum: number, sem: number, diaKey: string, ejId: string, serieIndex: number, defaultKg: number, defaultReps: number, defaultRir: number) => {
    const tk = state.tracking[mNum]?.[sem]?.[diaKey]?.ejercicios[ejId];
    if (tk && tk.series && tk.series[serieIndex]) {
      return tk.series[serieIndex];
    }
    return { kg: defaultKg, reps: defaultReps, rir: defaultRir, done: false };
  };

  const handleSerieSuperada = () => {
    setIsResting(true);
  };

  const markSerieAsDone = (diaKey: string, ejId: string, serieIndex: number) => {
    updateState(prev => {
      const mNum = mesoNum;
      const sem = activeWeek;
      const mesoTracking = prev.tracking[mNum];
      if (!mesoTracking) return prev;
      const weekTracking = mesoTracking[sem];
      if (!weekTracking) return prev;
      const dayTracking = weekTracking[diaKey];
      if (!dayTracking) return prev;
      
      const ejTracking = dayTracking.ejercicios[ejId] || { done: false, fatiga: 0, series: [] };
      const series = [...(ejTracking.series || [])];
      
      const meso = state.mesociclosGenerados.find(m => m.num === mNum);
      const ej = meso?.datos[diaKey].ejercicios.find(e => e.id === ejId);
      
      if (!series[serieIndex]) {
        const micros = ej ? calculateMicrocycles(ej) : [];
        const micro = micros[sem - 1] || { peso: 0, reps: 0 };
        series[serieIndex] = { kg: micro.peso, reps: micro.reps, rir: ej?.rir || 0, done: true };
      } else {
        series[serieIndex] = { ...series[serieIndex], done: true };
      }

      // Check if exercise is fully done
      const isEjDone = ej ? series.filter(s => s?.done).length >= ej.series : false;

      const newEjTracking = { ...ejTracking, series, done: isEjDone };
      const newEjercicios = { ...dayTracking.ejercicios, [ejId]: newEjTracking };

      // Check if all exercises in the session are done
      const sessionExercises = meso?.datos[diaKey].ejercicios || [];
      const allDone = sessionExercises.length > 0 && sessionExercises.every(e => {
        const t = newEjercicios[e.id];
        return t && t.done;
      });

      return {
        ...prev,
        tracking: {
          ...prev.tracking,
          [mNum]: {
            ...mesoTracking,
            [sem]: {
              ...weekTracking,
              [diaKey]: {
                ...dayTracking,
                ejercicios: newEjercicios,
                completada: allDone
              }
            }
          }
        }
      };
    });
  };

  const advanceToNextSerie = (diaKey: string, ej: any, nextEj: any, sessionExercises: any[]) => {
    setIsResting(false);
    setManualRestTime(null);
    
    // Mark current series as done
    const currentEjId = activeSupersetPart === 'A' ? ej.id : (nextEj?.id || ej.id);
    markSerieAsDone(diaKey, currentEjId, activeSerieIndex);

    if (ej.supersetWithNext && nextEj) {
      if (activeSupersetPart === 'A') {
        setActiveSupersetPart('B');
      } else {
        if (activeSerieIndex + 1 < Math.max(ej.series, nextEj.series)) {
          setActiveSupersetPart('A');
          setActiveSerieIndex(prev => prev + 1);
        } else {
          const nextIndex = sessionExercises.indexOf(nextEj) + 1;
          if (nextIndex < sessionExercises.length) {
            setActiveExerciseId(sessionExercises[nextIndex].id);
            setActiveSerieIndex(0);
            setActiveSupersetPart('A');
          }
        }
      }
    } else {
      if (activeSerieIndex + 1 < ej.series) {
        setActiveSerieIndex(prev => prev + 1);
      } else {
        const nextIndex = sessionExercises.indexOf(ej) + 1;
        if (nextIndex < sessionExercises.length) {
          setActiveExerciseId(sessionExercises[nextIndex].id);
          setActiveSerieIndex(0);
          setActiveSupersetPart('A');
        }
      }
    }
  };

  // ... (existing functions)

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Seguimiento de Sesiones ✅</h1>
          <p className="text-app-muted text-sm">Marca cada ejercicio y valora tu fatiga de 0 a 5.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-app-border shadow-sm">
          <button 
            disabled={activeMesoIdx === 0}
            onClick={() => setActiveMesoIdx(i => i - 1)}
            className="p-2 rounded-xl hover:bg-app-bg disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-bold px-2">MESOCICLO #{mesoNum}</span>
          <button 
            disabled={activeMesoIdx === state.mesociclosGenerados.length - 1}
            onClick={() => setActiveMesoIdx(i => i + 1)}
            className="p-2 rounded-xl hover:bg-app-bg disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      {/* Week Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-app-border shadow-sm overflow-x-auto hide-scrollbar">
        {WEEK_LABELS.map((label, i) => {
          const sem = i + 1;
          return (
            <button
              key={sem}
              onClick={() => setActiveWeek(sem)}
              className={cn(
                "flex-1 py-2 px-1 md:py-3 md:px-2 rounded-xl text-[10px] md:text-xs font-bold transition-all flex items-center justify-center gap-1 md:gap-2 min-w-[70px]",
                activeWeek === sem 
                  ? "bg-app-text text-white shadow-md shadow-app-text/20" 
                  : "text-app-muted hover:bg-app-bg hover:text-app-text"
              )}
            >
              <span className="hidden md:inline">{label}</span>
              <span className="md:hidden">{label.replace('Semana', 'Sem.').replace(' — DESCARGA ♻️', ' ♻️')}</span>
            </button>
          );
        })}
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {Object.entries(activeMeso.datos).map(([diaKey, diaData]) => {
          if (diaData.ejercicios.length === 0) return null;
          
          const isDayActive = diaData.ejercicios.some(e => e.id === activeExerciseId);
          const isExpanded = expandedDays[diaKey] ?? isDayActive;

          return (
            <div key={diaKey} className={cn("glass-card transition-all duration-300", !isExpanded && "opacity-70")}>
              {/* Session Header */}
              <div 
                className="p-4 flex items-center justify-between border-b border-app-border/50 cursor-pointer hover:bg-app-bg/50 transition-colors rounded-t-3xl"
                onClick={() => toggleDay(diaKey)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", isDayActive ? "bg-teal-brand animate-pulse" : "bg-app-muted")} />
                  <h3 className="font-bold text-sm uppercase tracking-wider">{cleanDayName(diaData.nombre)}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-app-muted uppercase">{diaData.ejercicios.length} Ejercicios</span>
                  <div className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")}>
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              {isExpanded && ['única', 'mañana', 'tarde'].map(session => {
                const sessionExercises = diaData.ejercicios.filter(e => (e.session || 'única') === session);
                if (sessionExercises.length === 0) return null;

                const activeEj = sessionExercises.find(e => e.id === activeExerciseId) || sessionExercises[0];
                const isSuperset = activeEj.supersetWithNext;
                const nextEj = isSuperset ? sessionExercises[sessionExercises.indexOf(activeEj) + 1] : null;
                
                const currentEj = activeSupersetPart === 'A' ? activeEj : (nextEj || activeEj);
                const waitingEj = activeSupersetPart === 'A' ? (nextEj || null) : activeEj;

                // Calculate rest duration based on rules:
                // 10s between A and B in superset
                // 3min (180s) between sets of same exercise (or same superset block)
                // 5min (300s) between different exercises
                const getRestDuration = () => {
                  if (isSuperset) {
                    if (activeSupersetPart === 'A') return 10;
                    // Part B
                    if (activeSerieIndex + 1 < Math.max(activeEj.series, nextEj?.series || 0)) {
                      return 180; // 3 min
                    }
                    return 300; // 5 min (end of superset)
                  } else {
                    // Normal exercise
                    if (activeSerieIndex + 1 < activeEj.series) {
                      return 180; // 3 min
                    }
                    return 300; // 5 min (end of exercise)
                  }
                };

                const defaultRestDuration = getRestDuration();
                const restDuration = manualRestTime ?? defaultRestDuration;
                const restLabel = restDuration >= 60 
                  ? `${Math.floor(restDuration / 60)}min${restDuration % 60 > 0 ? ` ${restDuration % 60}s` : ''}` 
                  : `${restDuration}s`;

                const currentMicros = calculateMicrocycles(currentEj);
                const currentMicro = currentMicros[activeWeek - 1];
                const currentSerieData = getSerieData(mesoNum, activeWeek, diaKey, currentEj.id, activeSerieIndex, currentMicro.peso, currentMicro.reps, currentEj.rir);

                const waitingSerieIndex = activeSupersetPart === 'A' ? activeSerieIndex : activeSerieIndex + 1;
                const showWaiting = waitingEj && waitingSerieIndex < waitingEj.series;
                let waitingSerieData: any = null;
                if (showWaiting && waitingEj) {
                  const waitingMicros = calculateMicrocycles(waitingEj);
                  const waitingMicro = waitingMicros[activeWeek - 1];
                  waitingSerieData = getSerieData(mesoNum, activeWeek, diaKey, waitingEj.id, waitingSerieIndex, waitingMicro.peso, waitingMicro.reps, waitingEj.rir);
                }

                // Group exercises for this session
                const groupedFinishedSeries: { 
                  type: 'single' | 'superset', 
                  serieIndex: number, 
                  items: { ej: any, data: any }[] 
                }[] = [];

                for (let i = 0; i < sessionExercises.length; i++) {
                  const ej = sessionExercises[i];
                  const isEjSuperset = ej.supersetWithNext;
                  const nextEjInSession = isEjSuperset ? sessionExercises[i + 1] : null;

                  if (isEjSuperset && nextEjInSession) {
                    const maxSeries = Math.max(ej.series, nextEjInSession.series);
                    for (let s = 0; s < maxSeries; s++) {
                      const items = [];
                      const tkA = state.tracking[mesoNum]?.[activeWeek]?.[diaKey]?.ejercicios[ej.id]?.series?.[s];
                      const tkB = state.tracking[mesoNum]?.[activeWeek]?.[diaKey]?.ejercicios[nextEjInSession.id]?.series?.[s];
                      
                      if (tkA?.done) items.push({ ej, data: tkA });
                      if (tkB?.done) items.push({ ej: nextEjInSession, data: tkB });

                      if (items.length > 0) {
                        groupedFinishedSeries.push({ type: 'superset', serieIndex: s, items });
                      }
                    }
                    i++; // Skip nextEj as it's part of the superset
                  } else {
                    const tk = state.tracking[mesoNum]?.[activeWeek]?.[diaKey]?.ejercicios[ej.id];
                    if (tk && tk.series) {
                      tk.series.forEach((s: any, index: number) => {
                        if (s.done) {
                          groupedFinishedSeries.push({ type: 'single', serieIndex: index, items: [{ ej, data: s }] });
                        }
                      });
                    }
                  }
                }

                const allSeriesDone = sessionExercises.every(ej => {
                  const tk = state.tracking[mesoNum]?.[activeWeek]?.[diaKey]?.ejercicios[ej.id];
                  if (!tk || !tk.series) return false;
                  return tk.series.filter((s: any) => s.done).length >= ej.series;
                });
                const upcomingExercises = sessionExercises.filter(e => !isExerciseFinished(e.id, diaKey) && e.id !== activeEj.id && (!isSuperset || e.id !== nextEj?.id));

                return (
                  <div key={session} className="p-4 space-y-6">
                    {/* Tracking UI (Only for active day) - MOVED TO TOP FOR FOCUS */}
                    {isDayActive ? (
                      allSeriesDone ? (
                        <div className="bg-teal-50 p-6 rounded-xl border-2 border-teal-200 text-center shadow-sm">
                          <h4 className="font-bold text-teal-800 text-lg mb-2">¡Sesión Completada! 🎉</h4>
                          <p className="text-teal-600 text-sm mb-4">Has terminado todos los ejercicios de esta sesión.</p>
                          
                          <div className="mt-4 pt-4 border-t border-teal-200 text-left">
                            <p className="text-[10px] font-bold text-teal-800 uppercase mb-2">Resumen de Fatiga:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {sessionExercises.map(ej => {
                                const fatiga = state.tracking[mesoNum]?.[activeWeek]?.[diaKey]?.ejercicios[ej.id]?.fatiga;
                                return (
                                  <div key={ej.id} className="text-[10px] bg-white p-2 rounded-lg border border-teal-100 flex justify-between items-center shadow-sm">
                                    <span className="truncate font-medium text-teal-900">{ej.nombre}</span>
                                    <span className={cn(
                                      "font-bold px-2 py-0.5 rounded-full",
                                      fatiga === undefined ? "bg-gray-100 text-gray-400" :
                                      fatiga >= 4 ? "bg-red-100 text-red-700" :
                                      fatiga >= 2 ? "bg-orange-100 text-orange-700" :
                                      "bg-green-100 text-green-700"
                                    )}>
                                      F: {fatiga !== undefined ? fatiga : '-'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Column: Active & Waiting */}
                        <div className="space-y-4 sticky top-4 z-20 self-start">
                          {/* Purple Zone: Finished Series (Grouped & Moved to Top) */}
                          {groupedFinishedSeries.length > 0 && (
                            <div className="bg-[#f3f0ff] p-3 md:p-4 rounded-xl border-2 border-[#9f7aea] shadow-sm max-h-[300px] overflow-y-auto custom-scrollbar">
                              <h4 className="font-bold text-[#553c9a] mb-2 md:mb-3 uppercase text-[10px] md:text-xs tracking-widest flex items-center gap-1.5 sticky top-0 bg-[#f3f0ff] z-10 py-1">
                                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" /> SERIES TERMINADAS
                              </h4>
                              <div className="space-y-2">
                                {groupedFinishedSeries.map((group, gIdx) => (
                                  <div key={gIdx} className={cn(
                                    "p-2 rounded-lg border flex flex-col gap-2",
                                    group.type === 'superset' ? "bg-[#e9d8fd]/30 border-[#9f7aea]/30" : "bg-white/50 border-[#d6bcfa]/50"
                                  )}>
                                    {group.type === 'superset' && (
                                      <div className="text-[9px] font-bold text-[#553c9a] uppercase tracking-tighter opacity-60">Superset - Set {group.serieIndex + 1}</div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {group.items.map((item, iIdx) => (
                                        <div key={iIdx} className="bg-white p-2 rounded-md border border-[#d6bcfa] relative overflow-hidden flex flex-col justify-between">
                                          {state.tracking[mesoNum]?.[activeWeek]?.[diaKey]?.ejercicios[item.ej.id]?.fatiga !== undefined && group.serieIndex === 0 && (
                                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-1 font-bold">F:{state.tracking[mesoNum]?.[activeWeek]?.[diaKey]?.ejercicios[item.ej.id]?.fatiga}</div>
                                          )}
                                          <div className="font-bold text-[#553c9a] text-[10px] md:text-xs mb-1 truncate leading-tight">
                                            {item.ej.nombre} {group.type === 'single' ? `- S${group.serieIndex + 1}` : ''}
                                          </div>
                                          <div className="flex gap-1 text-[9px] text-[#44337a]">
                                            <div className="bg-[#e9d8fd] px-1 py-0.5 rounded flex-1 text-center font-bold">
                                              {item.data.kg}kg
                                            </div>
                                            <div className="bg-[#e9d8fd] px-1 py-0.5 rounded flex-1 text-center font-bold">
                                              {item.data.reps}r
                                            </div>
                                            <div className="bg-[#e9d8fd] px-1 py-0.5 rounded flex-1 text-center font-bold">
                                              RIR{item.data.rir}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Red Zone: Active Series */}
                          <div className={cn("p-4 md:p-6 rounded-2xl border-2 transition-all duration-500 shadow-2xl transform hover:scale-[1.01]", isResting ? "border-blue-500 bg-blue-50 shadow-blue-500/20" : "border-red-600 bg-red-50 shadow-red-600/30")}>
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                            <h4 className={cn("font-black text-lg md:text-xl tracking-tight leading-tight", isResting ? "text-blue-900" : "text-red-900")}>
                              {currentEj.nombre} <span className="opacity-50 text-sm block md:inline md:ml-2">Serie {activeSerieIndex + 1}</span>
                            </h4>
                            <button 
                              onClick={() => isResting ? advanceToNextSerie(diaKey, activeEj, nextEj, sessionExercises) : handleSerieSuperada()}
                              className={cn("text-white px-4 py-2 rounded-xl text-xs md:text-sm font-black shadow-lg transition-all active:scale-95 w-full sm:w-auto uppercase tracking-wider", isResting ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20" : "bg-teal-brand hover:bg-teal-600 shadow-teal-600/20")}
                            >
                              {isResting ? 'Saltar Descanso ⏭' : 'Serie Superada ✓'}
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            {['Kg', 'Reps', 'RIR'].map((label) => {
                              const field = label.toLowerCase() as 'kg' | 'reps' | 'rir';
                              const val = currentSerieData[field];
                              const step = field === 'kg' ? 2.5 : 1;
                              return (
                                <div key={label} className={cn("text-center p-2 rounded-xl border", isResting ? "bg-blue-100/50 border-blue-200" : "bg-red-100/50 border-red-200")}>
                                  <label className={cn("text-[10px] block font-black uppercase tracking-widest mb-1", isResting ? "text-blue-800" : "text-red-800")}>{label}</label>
                                  <div className="flex flex-col items-center gap-1">
                                    <button onClick={() => updateSerieData(mesoNum, activeWeek, diaKey, currentEj.id, activeSerieIndex, field, step)} className={cn("text-xl font-bold w-full py-1 rounded-lg transition-colors", isResting ? "text-blue-600 hover:bg-blue-200" : "text-red-600 hover:bg-red-200")}>+</button>
                                    <span className={cn("text-3xl md:text-5xl font-black tabular-nums", isResting ? "text-blue-900" : "text-red-900")}>{val}</span>
                                    <button onClick={() => updateSerieData(mesoNum, activeWeek, diaKey, currentEj.id, activeSerieIndex, field, -step)} className={cn("text-xl font-bold w-full py-1 rounded-lg transition-colors", isResting ? "text-blue-600 hover:bg-blue-200" : "text-red-600 hover:bg-red-200")}>-</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Fatigue Rating - Refined UI */}
                          <div className={cn("mb-6 p-4 rounded-xl border-2 border-dashed", isResting ? "bg-blue-100/30 border-blue-200" : "bg-red-100/30 border-red-200")}>
                            <div className="flex justify-between items-center mb-3">
                              <label className={cn("text-[10px] font-black uppercase tracking-widest", isResting ? "text-blue-800" : "text-red-800")}>Valoración de Fatiga</label>
                              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", isResting ? "bg-blue-200 text-blue-800" : "bg-red-200 text-red-800")}>
                                {state.tracking[mesoNum]?.[activeWeek]?.[diaKey]?.ejercicios[currentEj.id]?.fatiga || 0}/5
                              </span>
                            </div>
                            <div className="flex justify-between gap-2">
                              {[0, 1, 2, 3, 4, 5].map(level => {
                                const currentFatiga = state.tracking[mesoNum]?.[activeWeek]?.[diaKey]?.ejercicios[currentEj.id]?.fatiga || 0;
                                return (
                                  <button
                                    key={level}
                                    onClick={() => setFatiga(mesoNum, activeWeek, diaKey, currentEj.id, level)}
                                    className={cn(
                                      "flex-1 aspect-square rounded-xl text-sm md:text-base font-black transition-all border-2 flex items-center justify-center",
                                      currentFatiga === level
                                        ? (isResting ? "bg-blue-600 border-blue-600 text-white scale-110 shadow-lg" : "bg-red-600 border-red-600 text-white scale-110 shadow-lg")
                                        : (isResting ? "bg-white border-blue-200 text-blue-400 hover:border-blue-400 hover:text-blue-600" : "bg-white border-red-200 text-red-400 hover:border-red-400 hover:text-red-600")
                                    )}
                                  >
                                    {level}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className={cn("flex items-center gap-3 mb-2", isResting ? "text-blue-800" : "text-red-800")}>
                            <div className="h-px flex-1 bg-current opacity-20"></div>
                            <div className="text-[10px] font-black uppercase tracking-widest">Descanso: {restLabel}</div>
                            <div className="h-px flex-1 bg-current opacity-20"></div>
                          </div>
                          <RestTimerBar 
                            key={`${currentEj.id}-${activeSerieIndex}-${activeSupersetPart}-${isResting}`} 
                            duration={restDuration} 
                            onDurationChange={setManualRestTime} 
                            fontSize={20} 
                            autoStart={isResting} 
                            onComplete={() => advanceToNextSerie(diaKey, activeEj, nextEj, sessionExercises)}
                          />
                        </div>

                        {/* Orange Zone: Waiting Series */}
                        {showWaiting && waitingEj && waitingSerieData && (
                          <div className="bg-orange-100 p-2 md:p-3 rounded-xl border-2 border-orange-400">
                            <h4 className="font-bold text-orange-900 mb-1 md:mb-2 text-[10px] md:text-sm uppercase">{waitingEj.nombre} - S{waitingSerieIndex + 1} (En espera)</h4>
                            <div className="grid grid-cols-3 gap-1 md:gap-2">
                              {['Kg', 'Reps', 'RIR'].map((label) => {
                                const field = label.toLowerCase() as 'kg' | 'reps' | 'rir';
                                const val = waitingSerieData[field];
                                return (
                                  <div key={label} className="text-center bg-orange-200/50 rounded p-0.5 md:p-1">
                                    <label className="text-[8px] md:text-[9px] block font-bold text-orange-800 uppercase">{label}</label>
                                    <span className="text-sm md:text-xl font-black text-orange-900">{val}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Blue Zone (Remaining Series) */}
                      <div className="bg-blue-100 p-3 md:p-4 rounded-xl border-2 border-blue-500">
                        <h4 className="font-bold text-blue-800 mb-2 md:mb-3 uppercase text-[10px] md:text-sm">Resto de Series</h4>
                        <div className="space-y-1.5 md:space-y-2">
                          {Array.from({ length: Math.max(activeEj.series, nextEj?.series || 0) }).flatMap((_, i) => {
                            const seriesList = [];
                            
                            // Exercise A logic
                            const isAActive = activeSupersetPart === 'A' && i === activeSerieIndex;
                            const isAWaiting = activeSupersetPart === 'B' && i === activeSerieIndex + 1;
                            
                            if (i < activeEj.series && !isAActive && !isAWaiting) {
                              // Show if it's in the future relative to current execution point
                              if (i > activeSerieIndex || (i === activeSerieIndex && activeSupersetPart === 'B')) {
                                seriesList.push({ ej: activeEj, serieIndex: i, part: 'A' });
                              }
                            }

                            // Exercise B logic (Superset)
                            if (isSuperset && nextEj) {
                              const isBActive = activeSupersetPart === 'B' && i === activeSerieIndex;
                              const isBWaiting = activeSupersetPart === 'A' && i === activeSerieIndex;
                              
                              if (i < nextEj.series && !isBActive && !isBWaiting) {
                                if (i >= activeSerieIndex) {
                                  seriesList.push({ ej: nextEj, serieIndex: i, part: 'B' });
                                }
                              }
                            }
                            return seriesList;
                          }).sort((a, b) => a.serieIndex - b.serieIndex || (a.part === 'A' ? -1 : 1)).map((item) => {
                            const micros = calculateMicrocycles(item.ej);
                            const micro = micros[activeWeek - 1];
                            const sData = getSerieData(mesoNum, activeWeek, diaKey, item.ej.id, item.serieIndex, micro.peso, micro.reps, item.ej.rir);
                            
                            return (
                              <div key={`${item.ej.id}-${item.serieIndex}`} className={cn("p-1.5 md:p-2 rounded-lg flex justify-between text-[10px] md:text-xs items-center border", item.part === 'A' ? "bg-white/60 border-blue-200" : "bg-orange-100 border-orange-300")}>
                                <div className="flex flex-col">
                                  <span className="font-bold text-blue-900 truncate max-w-[120px] sm:max-w-[200px]">{item.ej.nombre} - S{item.serieIndex + 1}</span>
                                  <span className="text-blue-700 font-medium">{sData.kg}kg / {sData.reps}r / {sData.rir}RIR</span>
                                </div>
                                <div className="w-12 md:w-16">
                                  <RestTimerBar duration={item.part === 'A' ? 10 : 180} onDurationChange={() => {}} fontSize={8} autoStart={false} />
                                </div>
                              </div>
                            );
                          })}
                          {/* If no remaining series */}
                          {Array.from({ length: Math.max(activeEj.series, nextEj?.series || 0) }).flatMap((_, i) => {
                            const seriesList = [];
                            const isAActive = activeSupersetPart === 'A' && i === activeSerieIndex;
                            const isAWaiting = activeSupersetPart === 'B' && i === activeSerieIndex + 1;
                            if (i < activeEj.series && !isAActive && !isAWaiting) {
                              if (i > activeSerieIndex || (i === activeSerieIndex && activeSupersetPart === 'B')) {
                                seriesList.push({ ej: activeEj, serieIndex: i, part: 'A' });
                              }
                            }
                            if (isSuperset && nextEj) {
                              const isBActive = activeSupersetPart === 'B' && i === activeSerieIndex;
                              const isBWaiting = activeSupersetPart === 'A' && i === activeSerieIndex;
                              if (i < nextEj.series && !isBActive && !isBWaiting) {
                                if (i >= activeSerieIndex) seriesList.push({ ej: nextEj, serieIndex: i, part: 'B' });
                              }
                            }
                            return seriesList;
                          }).length === 0 && (
                            <div className="text-center text-blue-600/50 text-xs italic py-4">No hay más series</div>
                          )}
                        </div>
                      </div>
                      </div>
                      )
                    ) : (
                      /* Compressed view for non-active days */
                      <div className="flex flex-wrap gap-2 p-1">
                        {sessionExercises.map(ej => {
                          const finished = isExerciseFinished(ej.id, diaKey);
                          return (
                            <div 
                              key={ej.id} 
                              className={cn(
                                "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer",
                                finished 
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                                  : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveExerciseId(ej.id);
                                setActiveSerieIndex(0);
                                setActiveSupersetPart('A');
                                setIsResting(false);
                                setManualRestTime(null);
                                setExpandedDays(prev => ({ ...prev, [diaKey]: true }));
                              }}
                            >
                              {ej.nombre}
                            </div>
                          );
                        })}
                      </div>
                    )}




                    {/* Green Zone: Upcoming Exercises (Bottom) */}
                    {isDayActive && upcomingExercises.length > 0 && (
                      <div className="bg-[#e6f4ea] p-3 md:p-4 rounded-xl border-2 border-[#34a853]">
                        <h4 className="font-bold text-[#137333] mb-2 md:mb-3 uppercase text-[10px] md:text-xs tracking-widest">Siguientes Ejercicios</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {upcomingExercises.map(ej => {
                            const micros = calculateMicrocycles(ej);
                            const micro = micros[activeWeek - 1];
                            return (
                              <div 
                                key={ej.id} 
                                className="bg-white/80 p-2 md:p-3 rounded-lg border border-[#a8dab5] cursor-pointer hover:bg-white transition-colors flex flex-col justify-between" 
                                onClick={() => {
                                  setActiveExerciseId(ej.id);
                                  setActiveSerieIndex(0);
                                  setActiveSupersetPart('A');
                                  setIsResting(false);
                                  setManualRestTime(null);
                                }}
                              >
                                <div className="font-bold text-[#137333] text-[10px] md:text-sm mb-1 md:mb-2 truncate leading-tight">{ej.nombre}</div>
                                <div className="flex gap-1 md:gap-2 text-[9px] md:text-xs text-[#0d652d]">
                                  <div className="bg-[#ceead6] px-1 py-0.5 md:px-2 md:py-1 rounded flex-1 text-center">
                                    <span className="font-bold block opacity-70">S</span>
                                    <div className="font-bold">{ej.series}</div>
                                  </div>
                                  <div className="bg-[#ceead6] px-1 py-0.5 md:px-2 md:py-1 rounded flex-1 text-center">
                                    <span className="font-bold block opacity-70">Kg</span>
                                    <div className="font-bold">{micro.peso}</div>
                                  </div>
                                  <div className="bg-[#ceead6] px-1 py-0.5 md:px-2 md:py-1 rounded flex-1 text-center">
                                    <span className="font-bold block opacity-70">Reps</span>
                                    <div className="font-bold">{micro.reps}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getFatigaColorClass(level: number) {
  const colors = ['', 'bg-teal-brand', 'bg-[#85C720]', 'bg-amber-brand', 'bg-[#FF7A44]', 'bg-red-deload'];
  return colors[level];
}

function getFatigaLabel(level: number) {
  const labels = ['Sin fatiga', 'Muy baja', 'Baja', 'Moderada', 'Alta', 'Muy alta'];
  return labels[level] || '—';
}

function getFatigaBadgeClass(avg: number) {
  if (avg <= 1) return "bg-teal-lt text-teal-brand";
  if (avg <= 2) return "bg-[#F0FADF] text-[#85C720]";
  if (avg <= 3) return "bg-amber-lt text-amber-brand";
  if (avg <= 4) return "bg-[#FFF0EC] text-[#FF7A44]";
  return "bg-red-100 text-red-deload";
}
