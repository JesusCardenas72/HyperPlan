import React from 'react';
import { X, Copy, Info } from 'lucide-react';
import { DayPlan, Exercise } from '../types';

interface CopyRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetDay: string) => void;
  sourceData: DayPlan;
  sourceLabel: string;
}

export default function CopyRoutineModal({ isOpen, onClose, onConfirm, sourceData, sourceLabel }: CopyRoutineModalProps) {
  if (!isOpen) return null;

  const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const dayLabels: Record<string, string> = {
    lunes: 'LUN', martes: 'MAR', miercoles: 'MIÉ', jueves: 'JUE', viernes: 'VIE', sabado: 'SÁB', domingo: 'DOM'
  };

  const cleanDayName = (name: string) => {
    if (!name) return '';
    return name.includes(':') ? name.split(':')[1].trim() : name;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Copiar Rutina: {cleanDayName(sourceData.nombre) || sourceLabel}</h3>
          <button onClick={onClose} className="text-app-muted hover:text-app-text">
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-bold text-app-muted uppercase tracking-widest mb-2">Resumen de ejercicios</h4>
          <div className="text-sm text-app-text mb-4">
            {sourceData.ejercicios.length} ejercicios guardados.
          </div>
          
          <h4 className="text-xs font-bold text-app-muted uppercase tracking-widest mb-2">Variables</h4>
          <div className="text-sm text-app-text mb-4">
            Foco: {sourceData.foco || 'No definido'}
          </div>
        </div>

        <h4 className="text-xs font-bold text-app-muted uppercase tracking-widest mb-3">Selecciona el día de destino:</h4>
        <div className="grid grid-cols-4 gap-2">
          {days.map(day => (
            <button
              key={day}
              onClick={() => {
                onConfirm(day);
                onClose();
              }}
              className="py-2 rounded-lg border border-app-border text-xs font-bold hover:border-primary hover:text-primary transition-all"
            >
              {dayLabels[day]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
