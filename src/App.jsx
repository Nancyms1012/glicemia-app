import { useState } from 'react';
import { Droplets, ClipboardList, TrendingUp, Activity, FileText, Trash2 } from 'lucide-react';
import RegistroForm from './components/RegistroForm';
import Historial from './components/Historial';
import Graficas from './components/Graficas';
import Estadisticas from './components/Estadisticas';
import ExportarPDF from './components/ExportarPDF';
import { useGlicemias } from './hooks/useGlicemias';

const TABS = [
  { id: 'registro', label: 'Registrar', icon: Droplets },
  { id: 'historial', label: 'Historial', icon: ClipboardList },
  { id: 'graficas', label: 'Gráficas', icon: TrendingUp },
  { id: 'estadisticas', label: 'Estadísticas', icon: Activity },
  { id: 'exportar', label: 'Exportar', icon: FileText },
];

export default function App() {
  const [tabActiva, setTabActiva] = useState('registro');
  const { registros, agregarRegistro, eliminarRegistro, borrarTodos, obtenerEstadisticas, obtenerDatosGrafica } =
    useGlicemias();
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);

  const handleBorrarTodos = () => {
    if (confirmarBorrar) {
      borrarTodos();
      setConfirmarBorrar(false);
    } else {
      setConfirmarBorrar(true);
      setTimeout(() => setConfirmarBorrar(false), 3000);
    }
  };

  const renderContenido = () => {
    switch (tabActiva) {
      case 'registro': return <RegistroForm onAgregar={agregarRegistro} />;
      case 'historial': return <Historial registros={registros} onEliminar={eliminarRegistro} />;
      case 'graficas': return <Graficas registros={registros} obtenerDatosGrafica={obtenerDatosGrafica} />;
      case 'estadisticas': return <Estadisticas registros={registros} obtenerEstadisticas={obtenerEstadisticas} />;
      case 'exportar': return <ExportarPDF registros={registros} obtenerEstadisticas={obtenerEstadisticas} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">GlicemiaApp</h1>
              <p className="text-xs text-gray-500">Control de glucosa en sangre</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {registros.length > 0 && (
                <>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                    {registros.length} registros
                  </span>
                  <button
                    onClick={handleBorrarTodos}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                      confirmarBorrar
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                    {confirmarBorrar ? '¿Segura?' : 'Borrar todo'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {renderContenido()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-40">
        <div className="max-w-3xl mx-auto px-2">
          <div className="flex items-center justify-around">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tabActiva === tab.id;
              return (
                <button key={tab.id} onClick={() => setTabActiva(tab.id)}
                  className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-600' : ''}`}>{tab.label}</span>
                  {isActive && <span className="w-1 h-1 rounded-full bg-indigo-600 mt-0.5"></span>}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
