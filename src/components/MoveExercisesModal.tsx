import React, { useState } from 'react';
import { X, Check, GripVertical, Trash2, Link as LinkIcon, Unlink, Zap, Sun, Sunset, ArrowRight } from 'lucide-react';
import { Exercise } from '../types';
import { cn } from '../lib/utils';

const SessionBadge = ({ type }: { type: 'mañana' | 'tarde' | 'única' }) => {
  if (type === 'única') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center text-amber-500 shadow-sm border border-amber-200/50">
          <Zap size={24} fill="currentColor" className="drop-shadow-sm" />
        </div>
        <span className="text-2xl font-black text-[#1a2b4b] uppercase tracking-tighter">Sesión Única</span>
      </div>
    );
  }
  if (type === 'mañana') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white shadow-sm border border-red-200/50">
          <Sun size={24} fill="currentColor" className="drop-shadow-sm" />
        </div>
        <span className="text-2xl font-black text-[#1a2b4b] uppercase tracking-tighter">Mañana</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white shadow-sm border border-indigo-200/50">
        <Sunset size={24} fill="currentColor" className="drop-shadow-sm" />
      </div>
      <span className="text-2xl font-black text-[#1a2b4b] uppercase tracking-tighter">Tarde</span>
    </div>
  );
};

interface MoveExercisesModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[];
  sourceSession: 'mañana' | 'tarde' | 'única';
  targetSession: 'mañana' | 'tarde' | 'única';
  onConfirm: (selectedIds: string[]) => void;
}

export default function MoveExercisesModal({ isOpen, onClose, exercises, sourceSession, targetSession, onConfirm }: MoveExercisesModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const getSessionLabel = (s: string) => {
    if (s === 'mañana') return 'Mañana';
    if (s === 'tarde') return 'Tarde';
    return 'Sesión Única';
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-app-border flex items-center justify-between bg-app-bg/20">
          <div className="space-y-4">
            <h3 className="text-3xl font-black text-app-text uppercase tracking-tighter">Distribuir Ejercicios</h3>
            <div className="flex items-center gap-6 bg-white/50 p-4 rounded-2xl border border-app-border/50 w-fit">
              <SessionBadge type={sourceSession} />
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-app-text text-white shadow-lg">
                <ArrowRight size={24} strokeWidth={3} />
              </div>
              <SessionBadge type={targetSession} />
            </div>
            <p className="text-sm text-app-muted pl-1">
              Selecciona los ejercicios que deseas mover a la nueva sesión.
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-app-bg rounded-full transition-colors self-start">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {exercises.length === 0 ? (
            <div className="text-center py-12 text-app-muted italic">No hay ejercicios en la Sesión Única.</div>
          ) : (
            exercises.map((ej) => (
              <div 
                key={ej.id}
                onClick={() => toggleSelection(ej.id)}
                className={cn(
                  "relative group bg-white border-2 rounded-2xl p-3 transition-all cursor-pointer flex items-center gap-4",
                  selectedIds.has(ej.id) ? "border-primary bg-primary/5" : "border-app-border hover:border-app-text/20"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                  selectedIds.has(ej.id) ? "bg-primary border-primary text-white" : "border-app-border"
                )}>
                  {selectedIds.has(ej.id) && <Check size={14} strokeWidth={3} />}
                </div>

                <div className="flex-1 flex items-center gap-2 overflow-hidden">
                  <div className="text-app-muted shrink-0">
                    <GripVertical size={18} />
                  </div>

                  <div className="flex-1 grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block mb-1">Ejercicio</label>
                      <div className="text-sm font-bold truncate bg-app-bg/20 rounded px-2 py-1">{ej.nombre || 'Sin nombre'}</div>
                    </div>
                    <div className="col-span-1">
                      <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest text-center block mb-1">Kg</label>
                      <div className="text-sm font-semibold text-center bg-app-bg/30 rounded py-1">{ej.peso}</div>
                    </div>
                    <div className="col-span-1">
                      <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest text-center block mb-1">Reps</label>
                      <div className="text-sm font-semibold text-center bg-app-bg/30 rounded py-1">{ej.reps}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest text-center block mb-1">+Kg/sem</label>
                      <div className="text-sm font-semibold text-primary text-center bg-primary-lt/30 rounded py-1">{ej.incremento}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest text-center block mb-1">Tipo</label>
                      <div className="text-[10px] font-bold text-center bg-app-bg/30 rounded py-1 uppercase">
                        {ej.tipo === 'compuesto' ? '🔴 Comp.' : '🟢 Anal.'}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest text-center block mb-1">RIR</label>
                      <div className="text-sm font-semibold text-amber-brand text-center bg-amber-lt/30 rounded py-1">{ej.rir}</div>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1">
                      <div className="p-1 text-app-muted opacity-30"><Trash2 size={14} /></div>
                      <div className="p-1 text-app-muted opacity-30">
                        {ej.supersetWithNext ? <Unlink size={14} /> : <LinkIcon size={14} />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-app-border bg-app-bg/10 flex justify-between items-center">
          <div className="text-sm font-medium text-app-muted">
            {selectedIds.size} ejercicios seleccionados
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-app-muted hover:text-app-text transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="bg-primary text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-[#e04a28] transition-all disabled:opacity-50 disabled:shadow-none"
            >
              Mover a {targetSession === 'mañana' ? 'Mañana' : 'Tarde'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
