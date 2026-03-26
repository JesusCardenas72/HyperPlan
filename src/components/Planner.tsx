import React, { useState } from 'react';
import { 
  Plus, 
  Save, 
  Zap, 
  TrendingUp, 
  Info, 
  GripVertical, 
  Trash2, 
  Link as LinkIcon, 
  Unlink,
  Copy
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../lib/utils';
import { AppState, DayPlan, Exercise, ExerciseType, ExerciseTracking } from '../types';
import { calculateMicrocycles, formatRIR } from '../lib/trainingUtils';
import CopyRoutineModal from './CopyRoutineModal';
import { SortableExerciseCard } from './SortableExerciseCard';
import MoveExercisesModal from './MoveExercisesModal';

interface PlannerProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;
const DAY_LABELS: Record<string, string> = {
  lunes: 'LUN', martes: 'MAR', miercoles: 'MIÉ', jueves: 'JUE', viernes: 'VIE', sabado: 'SÁB', domingo: 'DOM'
};

export default function Planner({ state, updateState }: PlannerProps) {
  const [activeDay, setActiveDay] = useState<string>('lunes');
  const [activeSession, setActiveSession] = useState<'mañana' | 'tarde' | 'única'>('única');
  const [showSuccess, setShowSuccess] = useState(false);
  const [modalData, setModalData] = useState<{ isOpen: boolean, sourceData: DayPlan | null, sourceLabel: string }>({ isOpen: false, sourceData: null, sourceLabel: '' });
  const [moveModal, setMoveModal] = useState<{ isOpen: boolean, sourceSession: 'mañana' | 'tarde' | 'única', targetSession: 'mañana' | 'tarde' | 'única' }>({ 
    isOpen: false, 
    sourceSession: 'única',
    targetSession: 'mañana' 
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      updateState(prev => {
        const day = prev.datosReferencia[activeDay];
        const oldIndex = day.ejercicios.findIndex(e => e.id === active.id);
        const newIndex = day.ejercicios.findIndex(e => e.id === over.id);
        
        const newEjercicios = arrayMove(day.ejercicios, oldIndex, newIndex);
        
        return {
          ...prev,
          datosReferencia: {
            ...prev.datosReferencia,
            [activeDay]: { ...day, ejercicios: newEjercicios }
          }
        };
      });
    }
  };

  const addExercise = (dayKey: string) => {
    updateState(prev => {
      const day = prev.datosReferencia[dayKey];
      const newExercise: Exercise = {
        id: `ej_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        nombre: '',
        peso: 0,
        reps: 0,
        series: 3,
        incremento: 2.5,
        tipo: 'compuesto',
        rir: 2,
        notas: '',
        session: activeSession
      };
      return {
        ...prev,
        datosReferencia: {
          ...prev.datosReferencia,
          [dayKey]: { ...day, ejercicios: [...day.ejercicios, newExercise] }
        }
      };
    });
  };

  const updateExercise = (dayKey: string, exerciseId: string, updates: Partial<Exercise>) => {
    updateState(prev => {
      const day = prev.datosReferencia[dayKey];
      const newEjercicios = day.ejercicios.map(e => 
        e.id === exerciseId ? { ...e, ...updates } : e
      );
      return {
        ...prev,
        datosReferencia: {
          ...prev.datosReferencia,
          [dayKey]: { ...day, ejercicios: newEjercicios }
        }
      };
    });
  };

  const removeExercise = (dayKey: string, exerciseId: string) => {
    updateState(prev => {
      const day = prev.datosReferencia[dayKey];
      return {
        ...prev,
        datosReferencia: {
          ...prev.datosReferencia,
          [dayKey]: { ...day, ejercicios: day.ejercicios.filter(e => e.id !== exerciseId) }
        }
      };
    });
  };

  const toggleSuperset = (dayKey: string, exerciseId: string) => {
    updateState(prev => {
      const day = prev.datosReferencia[dayKey];
      const newEjercicios = day.ejercicios.map(e => 
        e.id === exerciseId ? { ...e, supersetWithNext: !e.supersetWithNext } : e
      );
      return {
        ...prev,
        datosReferencia: {
          ...prev.datosReferencia,
          [dayKey]: { ...day, ejercicios: newEjercicios }
        }
      };
    });
  };

  const generateMesocycle = () => {
    updateState(prev => {
      const num = prev.contadorMesociclos + 1;
      const fechaI = new Date();
      fechaI.setDate(fechaI.getDate() + (num - 1) * 28);
      const fechaF = new Date(fechaI);
      fechaF.setDate(fechaF.getDate() + 27);
      const fechaStr = `${fechaI.toLocaleDateString('es-ES')} — ${fechaF.toLocaleDateString('es-ES')}`;

      // Initialize tracking for this meso
      const newTracking = { ...prev.tracking };
      newTracking[num] = {};
      for (let sem = 1; sem <= 4; sem++) {
        newTracking[num][sem] = {};
        Object.keys(prev.datosReferencia).forEach(diaKey => {
          const d = prev.datosReferencia[diaKey];
          const exerciseTracking: Record<string, ExerciseTracking> = {};
          d.ejercicios.forEach(ej => {
            exerciseTracking[ej.id] = { 
              done: false, 
              fatiga: 0,
              series: [] // Initialize with empty array, will be populated on first interaction
            };
          });
          
          newTracking[num][sem][diaKey] = {
            completada: false,
            fatiga: 0,
            ejercicios: exerciseTracking
          };
        });
      }

      return {
        ...prev,
        contadorMesociclos: num,
        mesociclosGenerados: [
          ...prev.mesociclosGenerados,
          { num, fechaStr, datos: JSON.parse(JSON.stringify(prev.datosReferencia)) }
        ],
        tracking: newTracking
      };
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const cleanDayName = (name: string) => {
    if (!name) return '';
    return name.includes(':') ? name.split(':')[1].trim() : name;
  };

  const copyWorkoutData = (targetDay: string, sourceData: DayPlan) => {
    updateState(prev => {
      const copiedExercises = sourceData.ejercicios.map((ej, i) => ({
        ...ej,
        id: `ej_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`
      }));
      return {
        ...prev,
        datosReferencia: {
          ...prev.datosReferencia,
          [targetDay]: {
            ...prev.datosReferencia[targetDay],
            nombre: cleanDayName(sourceData.nombre),
            foco: sourceData.foco,
            ejercicios: copiedExercises
          }
        }
      };
    });
  };

  const moveExercises = (selectedIds: string[], targetSession: 'mañana' | 'tarde' | 'única') => {
    updateState(prev => {
      const day = prev.datosReferencia[activeDay];
      const newEjercicios = day.ejercicios.map(e => 
        selectedIds.includes(e.id) ? { ...e, session: targetSession } : e
      );
      return {
        ...prev,
        datosReferencia: {
          ...prev.datosReferencia,
          [activeDay]: { ...day, ejercicios: newEjercicios }
        }
      };
    });
    setActiveSession(targetSession);
  };

  const activeDayData = state.datosReferencia[activeDay];
  const currentWeekTemplates = DAYS.filter(d => d !== activeDay && state.datosReferencia[d].ejercicios.length > 0);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Planificación 📋</h1>
        <p className="text-app-muted text-sm">Define tu semana de referencia y genera mesociclos automáticos.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" />
                Semana de Referencia
              </h2>
              <div className="flex gap-2">
                <span className="bg-primary-lt text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Compuesto = Ondulante</span>
                <span className="bg-teal-lt text-teal-brand text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Analítico = Doble Prog.</span>
              </div>
            </div>

            <div className="bg-blue-lt border-l-4 border-blue-brand p-4 rounded-r-xl mb-6">
              <div className="flex gap-3">
                <Info className="text-blue-brand shrink-0" size={18} />
                <p className="text-xs leading-relaxed">
                  <strong>Instrucciones:</strong> Introduce tus datos de referencia. El sistema calculará las progresiones. 
                  Puedes <strong>arrastrar</strong> los ejercicios para ordenarlos y crear <strong>superseries</strong> vinculándolos.
                </p>
              </div>
            </div>

            {/* Day Tabs */}
            <div className="flex overflow-x-auto gap-1.5 md:gap-2 mb-4 md:mb-6 pb-2 hide-scrollbar">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={cn(
                    "px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all border-2 whitespace-nowrap",
                    activeDay === day 
                      ? "bg-app-text text-white border-app-text" 
                      : "bg-white text-app-muted border-app-border hover:border-app-text hover:text-app-text"
                  )}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>

            {/* Day Editor */}
            <div className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-1.5">
                  <label className="text-[9px] md:text-[10px] font-bold text-app-muted uppercase tracking-widest px-1">Nombre del día</label>
                  <input 
                    value={activeDayData.nombre}
                    onChange={(e) => updateState(prev => ({
                      ...prev,
                      datosReferencia: {
                        ...prev.datosReferencia,
                        [activeDay]: { ...activeDayData, nombre: e.target.value }
                      }
                    }))}
                    className="w-full bg-white border-2 border-app-border rounded-lg md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="Ej: Pierna 1"
                  />
                </div>
                <div className="space-y-1 md:space-y-1.5">
                  <label className="text-[9px] md:text-[10px] font-bold text-app-muted uppercase tracking-widest px-1">Foco / Objetivo</label>
                  <input 
                    value={activeDayData.foco}
                    onChange={(e) => updateState(prev => ({
                      ...prev,
                      datosReferencia: {
                        ...prev.datosReferencia,
                        [activeDay]: { ...activeDayData, foco: e.target.value }
                      }
                    }))}
                    className="w-full bg-white border-2 border-app-border rounded-lg md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="Ej: Fuerza – Cuádriceps & Glúteo"
                  />
                </div>
              </div>

              {/* Session Selector */}
              <div className="flex p-1 bg-app-bg/50 rounded-lg md:rounded-xl w-full md:w-fit overflow-x-auto hide-scrollbar">
                <button
                  onClick={() => setActiveSession('única')}
                  className={cn(
                    "flex-1 md:flex-none px-3 py-1.5 md:px-6 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold transition-all whitespace-nowrap",
                    activeSession === 'única' ? "bg-white text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
                  )}
                >
                  ⚡ Sesión Única
                </button>
                <button
                  onClick={() => {
                    if (activeSession === 'única') {
                      const hasUnica = activeDayData.ejercicios.some(e => (e.session || 'única') === 'única');
                      if (hasUnica) {
                        setMoveModal({ isOpen: true, sourceSession: 'única', targetSession: 'mañana' });
                        return;
                      }
                    }
                    setActiveSession('mañana');
                  }}
                  className={cn(
                    "flex-1 md:flex-none px-3 py-1.5 md:px-6 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold transition-all whitespace-nowrap",
                    activeSession === 'mañana' ? "bg-white text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
                  )}
                >
                  🌅 Mañana
                </button>
                <button
                  onClick={() => {
                    if (activeSession === 'única') {
                      const hasUnica = activeDayData.ejercicios.some(e => (e.session || 'única') === 'única');
                      if (hasUnica) {
                        setMoveModal({ isOpen: true, sourceSession: 'única', targetSession: 'tarde' });
                        return;
                      }
                    }
                    setActiveSession('tarde');
                  }}
                  className={cn(
                    "flex-1 md:flex-none px-3 py-1.5 md:px-6 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold transition-all whitespace-nowrap",
                    activeSession === 'tarde' ? "bg-white text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
                  )}
                >
                  🌇 Tarde
                </button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between pt-2 md:pt-4 gap-3 md:gap-0">
                <h2 className="text-2xl md:text-3xl font-black text-app-text uppercase tracking-tighter flex items-center gap-2 md:gap-3">
                  {activeSession === 'única' ? (
                    <>⚡ Sesión Única</>
                  ) : activeSession === 'mañana' ? (
                    <>🌅 Mañana</>
                  ) : (
                    <>🌇 Tarde</>
                  )}
                </h2>

                <div className="flex flex-wrap gap-2">
                  {activeSession === 'única' ? (
                    <>
                      <button 
                        onClick={() => setMoveModal({ isOpen: true, sourceSession: 'mañana', targetSession: 'única' })}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-2 px-2 py-1.5 md:px-4 md:py-2 bg-app-bg border-2 border-app-border rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold text-app-muted hover:border-app-text hover:text-app-text transition-all"
                      >
                        <Plus size={14} /> Traer de Mañana
                      </button>
                      <button 
                        onClick={() => setMoveModal({ isOpen: true, sourceSession: 'tarde', targetSession: 'única' })}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-2 px-2 py-1.5 md:px-4 md:py-2 bg-app-bg border-2 border-app-border rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold text-app-muted hover:border-app-text hover:text-app-text transition-all"
                      >
                        <Plus size={14} /> Traer de Tarde
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setMoveModal({ isOpen: true, sourceSession: 'única', targetSession: activeSession })}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-2 px-2 py-1.5 md:px-4 md:py-2 bg-primary/10 border-2 border-primary/20 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold text-primary hover:bg-primary/20 transition-all"
                    >
                      <Plus size={14} /> Distribuir desde Única
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={activeDayData.ejercicios.filter(e => (e.session || 'única') === activeSession).map(e => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {activeDayData.ejercicios
                        .filter(e => (e.session || 'única') === activeSession)
                        .map((ej, index, filteredArr) => (
                        <SortableExerciseCard 
                          key={ej.id} 
                          exercise={ej} 
                          dayKey={activeDay}
                          onUpdate={(updates: Partial<Exercise>) => updateExercise(activeDay, ej.id, updates)}
                          onRemove={() => removeExercise(activeDay, ej.id)}
                          onToggleSuperset={() => toggleSuperset(activeDay, ej.id)}
                          isLast={index === filteredArr.length - 1}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {activeDayData.ejercicios.filter(e => (e.session || 'mañana') === activeSession).length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-app-border rounded-2xl">
                    <p className="text-app-muted text-sm">No hay ejercicios en la sesión de {activeSession}.</p>
                  </div>
                )}

                <button 
                  onClick={() => addExercise(activeDay)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2 md:py-3 rounded-lg md:rounded-xl border-2 border-dashed border-app-border text-app-muted hover:border-primary hover:text-primary transition-all text-xs md:text-sm font-bold"
                >
                  <Plus size={16} className="md:w-[18px] md:h-[18px]" />
                  Añadir ejercicio a {activeSession}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6 md:mt-8 pt-4 md:pt-6 border-t border-app-border">
              <button 
                onClick={generateMesocycle}
                className="flex flex-1 md:flex-none justify-center items-center gap-2 bg-primary text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-primary/20 hover:bg-[#e04a28] hover:-translate-y-0.5 transition-all"
              >
                <Zap size={16} className="md:w-[18px] md:h-[18px]" />
                Generar Mesociclo
              </button>
              {showSuccess && (
                <div className="flex items-center gap-2 text-teal-brand text-[10px] md:text-sm font-bold animate-in fade-in slide-in-from-left-2">
                  <Save size={16} className="md:w-[18px] md:h-[18px]" />
                  ¡Generado!
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Right Panel: Saved Workouts */}
      <div className="xl:col-span-1">
        <div className="glass-card p-4 md:p-6 sticky top-6">
          <h3 className="font-bold mb-4 md:mb-6 flex items-center gap-2 text-sm md:text-base">
            <Copy size={16} className="text-primary md:w-[18px] md:h-[18px]" />
            Programación
          </h3>

          <div className="space-y-4 md:space-y-6">
            {/* Current Week Templates */}
            <div>
              <h4 className="text-[9px] md:text-[10px] font-bold text-app-muted uppercase tracking-widest mb-2 md:mb-3">De esta semana</h4>
              <div className="space-y-2 md:space-y-3">
                {currentWeekTemplates.length > 0 ? (
                  currentWeekTemplates.map(day => (
                    <div key={day} className="p-2 md:p-3 rounded-lg md:rounded-xl border border-app-border bg-app-bg/50 flex flex-col gap-1.5 md:gap-2 transition-colors hover:border-primary/30">
                      <div>
                        <div className="text-xs md:text-sm font-bold text-app-text">{cleanDayName(state.datosReferencia[day].nombre) || DAY_LABELS[day]}</div>
                        <div className="text-[10px] text-app-muted mt-0.5">{state.datosReferencia[day].ejercicios.length} ejercicios</div>
                        
                        <div className="mt-2 pt-2 border-t border-app-border/50 space-y-1">
                          {state.datosReferencia[day].ejercicios.slice(0, 6).map(ej => (
                            <div key={ej.id} className="flex justify-between text-[9px] text-app-muted">
                              <span className="truncate pr-2">{ej.nombre || 'Sin nombre'}</span>
                              <span className="shrink-0 font-medium">{ej.peso}kg × {ej.reps}</span>
                            </div>
                          ))}
                          {state.datosReferencia[day].ejercicios.length > 6 && (
                            <div className="text-[9px] text-app-muted italic">... y {state.datosReferencia[day].ejercicios.length - 6} más</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setModalData({ isOpen: true, sourceData: state.datosReferencia[day], sourceLabel: DAY_LABELS[day] })}
                        className="w-full py-2 bg-white border border-app-border rounded-lg text-xs font-bold text-app-text hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Copy size={14} /> Copiar
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-app-muted text-xs border-2 border-dashed border-app-border rounded-xl">
                    No hay otras rutinas configuradas.
                  </div>
                )}
              </div>
            </div>

            {/* Past Mesocycles Templates */}
            {state.mesociclosGenerados.length > 0 && (
              <div>
                <h4 className="text-[9px] md:text-[10px] font-bold text-app-muted uppercase tracking-widest mb-2 md:mb-3">De Mesociclos Anteriores</h4>
                <div className="space-y-3 md:space-y-4 max-h-[300px] md:max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {state.mesociclosGenerados.slice().reverse().map(meso => {
                    const daysWithExercises = Object.entries(meso.datos).filter(([_, data]) => data.ejercicios.length > 0);
                    if (daysWithExercises.length === 0) return null;
                    
                    return (
                      <div key={meso.num} className="space-y-1.5 md:space-y-2">
                        <div className="text-[9px] md:text-[10px] font-bold text-primary flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          MESOCICLO #{meso.num}
                        </div>
                        {daysWithExercises.map(([dayKey, data]) => (
                          <div key={`${meso.num}-${dayKey}`} className="p-2 md:p-3 rounded-lg md:rounded-xl border border-app-border bg-white flex flex-col gap-1.5 md:gap-2 shadow-sm">
                            <div>
                              <div className="text-xs md:text-sm font-bold text-app-text">{cleanDayName(data.nombre) || DAY_LABELS[dayKey]}</div>
                              <div className="text-[9px] md:text-[10px] text-app-muted mt-0.5">{data.ejercicios.length} ejercicios</div>
                              
                              <div className="mt-1.5 md:mt-2 pt-1.5 md:pt-2 border-t border-app-border/50 space-y-0.5 md:space-y-1">
                                {data.ejercicios.slice(0, 6).map(ej => (
                                  <div key={ej.id} className="flex justify-between text-[8px] md:text-[9px] text-app-muted">
                                    <span className="truncate pr-2">{ej.nombre || 'Sin nombre'}</span>
                                    <span className="shrink-0 font-medium">{ej.peso}kg × {ej.reps}</span>
                                  </div>
                                ))}
                                {data.ejercicios.length > 6 && (
                                  <div className="text-[8px] md:text-[9px] text-app-muted italic">... y {data.ejercicios.length - 6} más</div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => setModalData({ isOpen: true, sourceData: data, sourceLabel: DAY_LABELS[dayKey] })}
                              className="w-full py-1.5 md:py-2 bg-app-bg border border-app-border rounded-md md:rounded-lg text-[10px] md:text-xs font-bold text-app-text hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Copy size={12} className="md:w-[14px] md:h-[14px]" /> Copiar
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      {/* Mesocycle Display */}
      {state.mesociclosGenerados.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Mesociclos Generados</h2>
            <div className="h-px flex-1 bg-app-border"></div>
          </div>
          
          {state.mesociclosGenerados.slice().reverse().map(meso => (
            <div key={meso.num} className="glass-card overflow-hidden">
              <div className="bg-app-text text-white p-4 flex justify-between items-center">
                <h3 className="font-bold">MESOCICLO #{meso.num}</h3>
                <span className="text-xs opacity-70">{meso.fechaStr}</span>
              </div>
              <div className="divide-y divide-app-border">
                {Object.entries(meso.datos).map(([diaKey, diaData]) => (
                  diaData.ejercicios.length > 0 && (
                    <div key={diaKey} className="p-4 day-print-section">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-sm">{cleanDayName(diaData.nombre)}</span>
                        <span className="text-[10px] text-app-muted font-medium uppercase tracking-wider">{diaData.foco}</span>
                      </div>
                      
                      {['única', 'mañana', 'tarde'].map(session => {
                        const sessionExercises = diaData.ejercicios.filter(e => (e.session || 'única') === session);
                        if (sessionExercises.length === 0) return null;
                        
                        return (
                          <div key={session} className="mb-6 last:mb-0">
                            <div className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                              {session === 'única' ? '⚡ Sesión Única' : session === 'mañana' ? '🌅 Mañana' : '🌇 Tarde'}
                              <div className="h-px flex-1 bg-app-border/50"></div>
                            </div>
                            <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                              <table className="w-full text-[10px] md:text-xs">
                                <thead>
                                  <tr className="text-app-muted border-b border-app-border">
                                    <th className="text-left py-1.5 md:py-2 font-bold uppercase tracking-wider">Ejercicio</th>
                                    <th className="text-center py-1.5 md:py-2 font-bold uppercase tracking-wider">S1</th>
                                    <th className="text-center py-1.5 md:py-2 font-bold uppercase tracking-wider">S2</th>
                                    <th className="text-center py-1.5 md:py-2 font-bold uppercase tracking-wider">S3</th>
                                    <th className="text-center py-1.5 md:py-2 font-bold uppercase tracking-wider">S4 (Desc)</th>
                                    <th className="text-center py-1.5 md:py-2 font-bold uppercase tracking-wider">RIR</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-app-border/50">
                                  {sessionExercises.map((ej) => {
                                    const micros = calculateMicrocycles(ej);
                                    return (
                                      <tr key={ej.id} className={cn(ej.supersetWithNext ? "bg-teal-lt/30" : "")}>
                                        <td className="py-2 md:py-3 pr-2 md:pr-4">
                                          <div className="font-bold text-xs md:text-sm">{ej.nombre}</div>
                                          <div className="text-[9px] md:text-[10px] text-app-muted mt-0.5">
                                            {ej.series} series · {ej.tipo === 'compuesto' ? '🔴 Comp.' : '🟢 Anal.'}
                                            {ej.supersetWithNext && <span className="ml-1 md:ml-2 text-teal-brand font-bold">🔗 Superset</span>}
                                          </div>
                                        </td>
                                        <td className="text-center py-2 md:py-3 font-semibold text-blue-brand">{micros[0].peso}×{micros[0].reps}</td>
                                        <td className="text-center py-2 md:py-3 font-semibold text-purple-brand">{micros[1].peso}×{micros[1].reps}</td>
                                        <td className="text-center py-2 md:py-3 font-bold text-primary">{micros[2].peso}×{micros[2].reps}</td>
                                        <td className="text-center py-2 md:py-3 font-semibold text-teal-brand">{micros[3].peso}×{micros[3].reps}</td>
                                        <td className="text-center py-2 md:py-3 font-medium text-amber-brand">{formatRIR(ej.rir)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CopyRoutineModal 
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ isOpen: false, sourceData: null, sourceLabel: '' })}
        sourceData={modalData.sourceData}
        sourceLabel={modalData.sourceLabel}
        onConfirm={(targetDay) => {
          if (modalData.sourceData) {
            copyWorkoutData(targetDay, modalData.sourceData);
            setModalData({ isOpen: false, sourceData: null, sourceLabel: '' });
          }
        }}
      />

      <MoveExercisesModal 
        isOpen={moveModal.isOpen}
        onClose={() => {
          setMoveModal({ ...moveModal, isOpen: false });
        }}
        exercises={activeDayData.ejercicios.filter(e => (e.session || 'única') === moveModal.sourceSession)}
        sourceSession={moveModal.sourceSession}
        targetSession={moveModal.targetSession}
        onConfirm={(selectedIds) => moveExercises(selectedIds, moveModal.targetSession)}
      />
    </div>
  );
}
