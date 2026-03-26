import React from 'react';
import { AppState } from '../types';
import { calculateMicrocycles, formatRIR } from '../lib/trainingUtils';
import { cn } from '../lib/utils';

interface PrintMesocyclesProps {
  state: AppState;
}

export default function PrintMesocycles({ state }: PrintMesocyclesProps) {
  const cleanDayName = (name: string) => {
    if (!name) return '';
    return name.includes(':') ? name.split(':')[1].trim() : name;
  };

  if (state.mesociclosGenerados.length === 0) return null;

  return (
    <div className="hidden print-only print:p-8 bg-white text-app-text">
      <h1 className="text-2xl font-bold mb-8 border-b-2 border-app-text pb-4">Mesociclos Generados</h1>
      
      <div className="space-y-12">
        {state.mesociclosGenerados.slice().reverse().map(meso => (
          <div key={meso.num} className="mesocycle-print-card">
            <div className="bg-app-text text-white p-4 flex justify-between items-center">
              <h3 className="font-bold">MESOCICLO #{meso.num}</h3>
              <span className="text-xs opacity-70">{meso.fechaStr}</span>
            </div>
            
            <div className="divide-y divide-app-border">
              {Object.entries(meso.datos).map(([diaKey, diaData]) => (
                diaData.ejercicios.length > 0 && (
                  <div key={diaKey} className="p-6 day-print-section">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-base">{cleanDayName(diaData.nombre)}</h4>
                      <span className="text-[10px] text-app-muted font-bold uppercase tracking-widest">{diaData.foco}</span>
                    </div>
                    
                    {['única', 'mañana', 'tarde'].map(session => {
                      const sessionExercises = diaData.ejercicios.filter(e => (e.session || 'única') === session);
                      if (sessionExercises.length === 0) return null;
                      
                      return (
                        <div key={session} className="mb-8 last:mb-0">
                          <div className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                            {session === 'única' ? '⚡ Sesión Única' : session === 'mañana' ? '🌅 Mañana' : '🌇 Tarde'}
                            <div className="h-px flex-1 bg-app-border/50"></div>
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-app-muted border-b border-app-border">
                                <th className="text-left py-2 font-bold uppercase tracking-wider">Ejercicio</th>
                                <th className="text-center py-2 font-bold uppercase tracking-wider">S1</th>
                                <th className="text-center py-2 font-bold uppercase tracking-wider">S2</th>
                                <th className="text-center py-2 font-bold uppercase tracking-wider">S3</th>
                                <th className="text-center py-2 font-bold uppercase tracking-wider">S4 (Desc)</th>
                                <th className="text-center py-2 font-bold uppercase tracking-wider">RIR</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-app-border/50">
                              {sessionExercises.map((ej) => {
                                const micros = calculateMicrocycles(ej);
                                return (
                                  <tr key={ej.id} className={cn(ej.supersetWithNext ? "bg-teal-lt/20" : "")}>
                                    <td className="py-3 pr-4">
                                      <div className="font-bold text-sm">{ej.nombre}</div>
                                      <div className="text-[10px] text-app-muted mt-0.5">
                                        {ej.tipo === 'compuesto' ? '🔴 Compuesto' : '🟢 Analítico'}
                                        {ej.supersetWithNext && <span className="ml-2 text-teal-brand font-bold">🔗 Superset</span>}
                                      </div>
                                    </td>
                                    <td className="text-center py-3 font-semibold text-blue-brand">{micros[0].peso}×{micros[0].reps}</td>
                                    <td className="text-center py-3 font-semibold text-purple-brand">{micros[1].peso}×{micros[1].reps}</td>
                                    <td className="text-center py-3 font-bold text-primary">{micros[2].peso}×{micros[2].reps}</td>
                                    <td className="text-center py-3 font-semibold text-teal-brand">{micros[3].peso}×{micros[3].reps}</td>
                                    <td className="text-center py-3 font-medium text-amber-brand">{formatRIR(ej.rir)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
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
    </div>
  );
}
