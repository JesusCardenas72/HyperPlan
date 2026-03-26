import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  CheckCircle2, 
  TrendingUp, 
  FileText, 
  Trash2,
  AlertTriangle,
  Dumbbell,
  Download,
  Upload,
  Save,
  Check,
  Menu,
  X
} from 'lucide-react';
import { cn } from './lib/utils';
import { AppState, Mesocycle, DayPlan, Exercise } from './types';
import Dashboard from './components/Dashboard';
import Planner from './components/Planner';
import SessionTracker from './components/SessionTracker';
import Progression from './components/Progression';
import PrintMesocycles from './components/PrintMesocycles';
import ConfirmModal from './components/ConfirmModal';
import { InteractiveMenu, InteractiveMenuItem } from './components/ui/modern-mobile-menu';

const INITIAL_STATE: AppState = {
  datosReferencia: {
    lunes: { id: 'lunes', nombre: 'Pierna 1', foco: 'Fuerza – Cuádriceps & Glúteo', ejercicios: [] },
    martes: { id: 'martes', nombre: 'Torso 1', foco: 'Empujes / Tirones', ejercicios: [] },
    miercoles: { id: 'miercoles', nombre: 'Descanso', foco: 'Recuperación activa', ejercicios: [] },
    jueves: { id: 'jueves', nombre: 'Pierna 2', foco: 'Volumen – Glúteo & Posterior', ejercicios: [] },
    viernes: { id: 'viernes', nombre: 'Torso 2', foco: 'Hipertrofia – Pecho & Espalda', ejercicios: [] },
    sabado: { id: 'sabado', nombre: 'Opcional', foco: 'Cardio / Descanso', ejercicios: [] },
    domingo: { id: 'domingo', nombre: 'Descanso', foco: 'Recuperación', ejercicios: [] },
  },
  mesociclosGenerados: [],
  contadorMesociclos: 0,
  tracking: {},
  ciclosSinDescargaExtra: 0,
  restTimes: {
    betweenSets: 180,
    betweenExercises: 300,
    supersetAB: 10,
    supersetBA: 180,
    afterSuperset: 300,
  },
};

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('hyperplan_state_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing state', e);
      }
    }
    return INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showManualSaveSuccess, setShowManualSaveSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('hyperplan_state_v2', JSON.stringify(state));
  }, [state]);

  const updateState = (updater: (prev: AppState) => AppState) => {
    setState(prev => updater(prev));
  };

  const manualSave = () => {
    localStorage.setItem('hyperplan_state_v2', JSON.stringify(state));
    setShowManualSaveSuccess(true);
    setTimeout(() => setShowManualSaveSuccess(false), 2000);
  };

  const exportToJson = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `hyperplan_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content === 'string') {
          const importedState = JSON.parse(content);
          // Basic validation
          if (importedState.datosReferencia && importedState.tracking) {
            setState(importedState);
            alert('Datos recuperados con éxito.');
          } else {
            alert('El archivo JSON no parece ser un respaldo válido de HyperPlan.');
          }
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
        console.error(err);
      }
    };
    fileReader.readAsText(files[0]);
    // Reset input
    event.target.value = '';
  };

  const clearAll = () => {
    setState(INITIAL_STATE);
    localStorage.removeItem('hyperplan_state_v2');
    setActiveTab('dashboard');
    setShowClearConfirm(false);
  };

  const getPendingSessionsCount = () => {
    let count = 0;
    Object.values(state.tracking).forEach((meso: any) => {
      Object.values(meso).forEach((sem: any) => {
        Object.values(sem).forEach((session: any) => {
          if (!session.completada) count++;
        });
      });
    });
    return count;
  };

  const tabs = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'planificacion', icon: <ClipboardList size={20} />, label: 'Plan' },
    { id: 'sesiones', icon: <CheckCircle2 size={20} />, label: 'Sesiones', badge: getPendingSessionsCount() },
    { id: 'progresion', icon: <TrendingUp size={20} />, label: 'Progreso' }
  ];

  const mobileMenuItems: InteractiveMenuItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Plan',      icon: ClipboardList },
    { label: 'Sesiones',  icon: CheckCircle2 },
    { label: 'Progreso',  icon: TrendingUp },
  ];

  const mobileTabIds = ['dashboard', 'planificacion', 'sesiones', 'progresion'];
  const mobileActiveIndex = mobileTabIds.indexOf(activeTab);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-app-bg text-app-text font-sans">
      
      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-app-border sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-linear-to-br from-primary to-[#FF8C00] rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
            <Dumbbell className="text-white w-5 h-5" />
          </div>
          <div className="text-lg font-extrabold tracking-tight">
            HyperPlan<span className="text-primary">.</span>
          </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-app-muted hover:text-app-text">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] bg-white z-20 overflow-y-auto pb-20">
          <div className="p-4">
            <div className="text-[10px] font-bold text-app-muted uppercase tracking-widest px-3 mb-2">Herramientas</div>
            <nav className="space-y-1">
              <button 
                onClick={() => { manualSave(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-app-muted hover:bg-app-bg hover:text-app-text relative"
              >
                {showManualSaveSuccess ? <Check size={18} className="text-teal-brand" /> : <Save size={18} />}
                {showManualSaveSuccess ? <span className="text-teal-brand">¡Guardado!</span> : 'Guardar ahora'}
              </button>
              <button 
                onClick={() => { exportToJson(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-app-muted hover:bg-app-bg hover:text-app-text"
              >
                <Download size={18} />
                Descargar JSON
              </button>
              <label className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-app-muted hover:bg-app-bg hover:text-app-text cursor-pointer">
                <Upload size={18} />
                Recuperar JSON
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={(e) => { importFromJson(e); setIsMobileMenuOpen(false); }} 
                  className="hidden" 
                />
              </label>
              <button 
                onClick={() => { window.print(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-app-muted hover:bg-app-bg hover:text-app-text"
              >
                <FileText size={18} />
                Exportar PDF
              </button>
              <button 
                onClick={() => { setShowClearConfirm(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-app-muted hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={18} />
                Limpiar todo
              </button>
            </nav>
          </div>
          <div className="p-4 mt-auto">
            <div className="p-4 bg-primary-lt rounded-xl border border-primary/10">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-primary shrink-0 mt-0.5" size={14} />
                <div className="text-[11px] leading-relaxed">
                  <strong className="text-primary block mb-0.5">Regla 3 ciclos:</strong>
                  Sin descarga extra en 3 ciclos → descarga obligatoria semana 10.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-[240px] bg-white border-r border-app-border flex-col sticky top-0 h-screen overflow-y-auto shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-primary to-[#FF8C00] rounded-xl flex items-center justify-center text-xl shadow-lg shadow-primary/20">
            <Dumbbell className="text-white w-6 h-6" />
          </div>
          <div className="text-lg font-extrabold tracking-tight">
            HyperPlan<span className="text-primary">.</span>
          </div>
        </div>

        <div className="px-4 py-2">
          <div className="text-[10px] font-bold text-app-muted uppercase tracking-widest px-3 mb-2">Menú</div>
          <nav className="space-y-1">
            {tabs.map(tab => (
              <NavItem 
                key={tab.id}
                active={activeTab === tab.id} 
                onClick={() => setActiveTab(tab.id)}
                icon={tab.icon}
                label={tab.label}
                badge={tab.badge}
              />
            ))}
          </nav>
        </div>

        <div className="px-4 py-2 mt-4">
          <div className="text-[10px] font-bold text-app-muted uppercase tracking-widest px-3 mb-2">Herramientas</div>
          <nav className="space-y-1">
            <button 
              onClick={manualSave}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-app-muted hover:bg-app-bg hover:text-app-text relative"
            >
              {showManualSaveSuccess ? <Check size={18} className="text-teal-brand" /> : <Save size={18} />}
              {showManualSaveSuccess ? <span className="text-teal-brand">¡Guardado!</span> : 'Guardar ahora'}
            </button>
            <button 
              onClick={exportToJson}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-app-muted hover:bg-app-bg hover:text-app-text"
            >
              <Download size={18} />
              Descargar JSON
            </button>
            <label className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-app-muted hover:bg-app-bg hover:text-app-text cursor-pointer">
              <Upload size={18} />
              Recuperar JSON
              <input 
                type="file" 
                accept=".json" 
                onChange={importFromJson} 
                className="hidden" 
              />
            </label>
            <button 
              onClick={() => window.print()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-app-muted hover:bg-app-bg hover:text-app-text"
            >
              <FileText size={18} />
              Exportar PDF
            </button>
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-app-muted hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={18} />
              Limpiar todo
            </button>
          </nav>
        </div>

        <div className="mt-auto p-4 m-4 bg-primary-lt rounded-xl border border-primary/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-primary shrink-0 mt-0.5" size={14} />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-primary block mb-0.5">Regla 3 ciclos:</strong>
              Sin descarga extra en 3 ciclos → descarga obligatoria semana 10.
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-3 md:p-8 overflow-y-auto no-print pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard state={state} onSwitchTab={setActiveTab} />}
          {activeTab === 'planificacion' && <Planner state={state} updateState={updateState} />}
          {activeTab === 'sesiones' && <SessionTracker state={state} updateState={updateState} onSwitchTab={setActiveTab} />}
          {activeTab === 'progresion' && <Progression state={state} onSwitchTab={setActiveTab} />}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-app-border z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <InteractiveMenu
          items={mobileMenuItems}
          accentColor="var(--color-primary)"
          activeIndex={mobileActiveIndex >= 0 ? mobileActiveIndex : 0}
          onItemChange={(index) => {
            setActiveTab(mobileTabIds[index]);
            setIsMobileMenuOpen(false);
          }}
        />
      </div>

      {/* PRINT ONLY VIEW */}
      <PrintMesocycles state={state} />

      <ConfirmModal 
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={clearAll}
        title="¿Eliminar todos los datos?"
        message="Esta acción borrará toda tu planificación, mesociclos generados y seguimiento. No se puede deshacer."
        confirmText="Sí, borrar todo"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}

function NavItem({ active, onClick, icon, label, badge }: { key?: string | number, active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
        active ? "bg-app-text text-white shadow-md shadow-app-text/20" : "text-app-muted hover:bg-app-bg hover:text-app-text"
      )}
    >
      <span className={cn("shrink-0", active ? "text-white" : "text-app-muted group-hover:text-app-text")}>
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}
