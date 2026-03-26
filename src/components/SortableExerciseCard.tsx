import React from 'react';
import { GripVertical, Trash2, Link as LinkIcon, Unlink } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../lib/utils';
import { Exercise, ExerciseType } from '../types';

interface SortableExerciseCardProps {
  exercise: Exercise;
  dayKey: string;
  onUpdate: (updates: Partial<Exercise>) => void;
  onRemove: () => void;
  onToggleSuperset: () => void;
  isLast: boolean;
}

export const SortableExerciseCard: React.FC<SortableExerciseCardProps> = ({ exercise, dayKey, onUpdate, onRemove, onToggleSuperset, isLast }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "relative group bg-white border-2 rounded-2xl p-4 transition-all",
        exercise.supersetWithNext ? "border-teal-brand shadow-md shadow-teal-brand/5 mb-8" : "border-app-border hover:border-app-text/20",
        isDragging ? "shadow-2xl scale-[1.02]" : ""
      )}
    >
      {/* Superset Link Visual */}
      {exercise.supersetWithNext && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-0.5 h-8 bg-teal-brand"></div>
          <div className="bg-teal-brand text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter absolute top-1/2 -translate-y-1/2">
            Superset
          </div>
        </div>
      )}

      <div className="flex items-start gap-2">
        <button 
          {...attributes} 
          {...listeners}
          className="mt-2 text-app-muted hover:text-app-text cursor-grab active:cursor-grabbing shrink-0 p-1"
        >
          <GripVertical size={18} />
        </button>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-12 gap-x-2 gap-y-2">
          <div className="col-span-2 sm:col-span-4 md:col-span-4 space-y-0.5">
            <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">Ejercicio</label>
            <input 
              value={exercise.nombre}
              onChange={(e) => onUpdate({ nombre: e.target.value })}
              className="w-full text-sm font-bold focus:outline-none placeholder:font-normal bg-app-bg/20 rounded px-2 py-0.5"
              placeholder="Nombre del ejercicio"
            />
          </div>

          <div className="col-span-1 md:col-span-1 space-y-0.5">
            <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest text-center block">Kg</label>
            <input 
              type="number"
              value={exercise.peso || ''}
              onChange={(e) => onUpdate({ peso: parseFloat(e.target.value) || 0 })}
              className="w-full text-sm font-semibold focus:outline-none text-center bg-app-bg/30 rounded py-0.5"
              placeholder="0"
            />
          </div>

          <div className="col-span-1 md:col-span-1 space-y-0.5">
            <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest text-center block">Series</label>
            <input 
              type="number"
              value={exercise.series || ''}
              onChange={(e) => onUpdate({ series: parseInt(e.target.value) || 0 })}
              className="w-full text-sm font-semibold focus:outline-none text-center bg-app-bg/30 rounded py-0.5"
              placeholder="0"
            />
          </div>

          <div className="col-span-1 md:col-span-1 space-y-0.5">
            <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest text-center block">Reps</label>
            <input 
              type="number"
              value={exercise.reps || ''}
              onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 0 })}
              className="w-full text-sm font-semibold focus:outline-none text-center bg-app-bg/30 rounded py-0.5"
              placeholder="0"
            />
          </div>

          <div className="col-span-1 md:col-span-1 space-y-0.5">
            <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest text-center block">RIR</label>
            <input 
              type="number"
              step="0.5"
              value={exercise.rir}
              onChange={(e) => onUpdate({ rir: parseFloat(e.target.value) || 0 })}
              className="w-full text-sm font-semibold focus:outline-none text-amber-brand text-center bg-amber-lt/30 rounded py-0.5"
            />
          </div>

          <div className="col-span-1 md:col-span-1 space-y-0.5">
            <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest text-center block">+Kg</label>
            <input 
              type="number"
              step="0.25"
              value={exercise.incremento}
              onChange={(e) => onUpdate({ incremento: parseFloat(e.target.value) || 0 })}
              className="w-full text-sm font-semibold focus:outline-none text-primary text-center bg-primary-lt/30 rounded py-0.5"
            />
          </div>

          <div className="col-span-2 sm:col-span-2 md:col-span-2 space-y-0.5">
            <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest text-center block">Tipo</label>
            <select 
              value={exercise.tipo}
              onChange={(e) => onUpdate({ tipo: e.target.value as ExerciseType })}
              className="w-full text-[10px] font-bold focus:outline-none bg-app-bg/30 rounded text-center h-7"
            >
              <option value="compuesto">🔴 Comp.</option>
              <option value="analitico">🟢 Anal.</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-4 md:col-span-12 space-y-0.5 mt-2">
            <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest">Notas</label>
            <input 
              value={exercise.notas}
              onChange={(e) => onUpdate({ notas: e.target.value })}
              className="w-full text-[10px] focus:outline-none text-app-muted italic"
              placeholder="Opcional..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <button 
            onClick={onRemove}
            className="p-1.5 text-red-200 hover:text-red-500 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
          {!isLast && (
            <button 
              onClick={onToggleSuperset}
              className={cn(
                "p-1.5 transition-colors",
                exercise.supersetWithNext ? "text-teal-brand" : "text-app-muted hover:text-teal-brand"
              )}
              title={exercise.supersetWithNext ? "Quitar Superset" : "Crear Superset con el siguiente"}
            >
              {exercise.supersetWithNext ? <Unlink size={14} /> : <LinkIcon size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
