import { useState, useMemo } from 'react';
import { ClipboardList, Trash2, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MOMENTOS, INSULINAS, getColorPorValor, getEtiquetaPorValor } from '../utils/constants';

export default function Historial({ registros, onEliminar }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroMomento, setFiltroMomento] = useState('');
  const [filtroRango, setFiltroRango] = useState('');
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);

  const registrosFiltrados = useMemo(() => {
    return registros
      .filter((r) => {
        if (busqueda && !r.notas?.toLowerCase().includes(busqueda.toLowerCase())) return false;
        if (filtroMomento && r.momento !== filtroMomento) return false;
        if (filtroRango === 'bajo' && Number(r.valor) >= 70) return false;
        if (filtroRango === 'normal' && (Number(r.valor) < 70 || Number(r.valor) > 180)) return false;
        if (filtroRango === 'alto' && Number(r.valor) <= 180) return false;
        return true;
      })
      .sort((a, b) => new Date(b.fecha + 'T' + b.hora) - new Date(a.fecha + 'T' + a.hora));
  }, [registros, busqueda, filtroMomento, filtroRango]);

  const handleEliminar = (id) => {
    if (confirmarEliminar === id) {
      onEliminar(id);
      setConfirmarEliminar(null);
    } else {
      setConfirmarEliminar(id);
      setTimeout(() => setConfirmarEliminar(null), 3000);
    }
  };

  const getMomentoLabel = (value) => {
    const momento = MOMENTOS.find((m) => m.value === value);
    return momento ? momento.label : value || '-';
  };

  const getInsulinaLabel = (value) => {
    const insulina = INSULINAS.find((i) => i.value === value);
    return insulina ? insulina.label : value || '';
  };

  if (registros.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay registros aún</h3>
          <p className="text-gray-400">Comienza registrando tu primera medición de glicemia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-xl">
            <ClipboardList className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Historial</h2>
            <p className="text-sm text-gray-500">
              {registrosFiltrados.length} de {registros.length} registros
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en notas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 flex-1">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filtroMomento}
                onChange={(e) => setFiltroMomento(e.target.value)}
                className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="">Todos los momentos</option>
                {MOMENTOS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <select
              value={filtroRango}
              onChange={(e) => setFiltroRango(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">Todos los rangos</option>
              <option value="bajo">Hipoglicemia (&lt;70)</option>
              <option value="normal">En rango (70-180)</option>
              <option value="alto">Hiperglicemia (&gt;180)</option>
            </select>
          </div>
        </div>

        {/* Lista de registros */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {registrosFiltrados.map((registro) => (
            <div
              key={registro.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-2 h-12 rounded-full flex-shrink-0"
                style={{ backgroundColor: getColorPorValor(registro.valor) }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold" style={{ color: getColorPorValor(registro.valor) }}>
                    {registro.valor}
                  </span>
                  <span className="text-xs text-gray-400">mg/dL</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${getColorPorValor(registro.valor)}20`,
                      color: getColorPorValor(registro.valor),
                    }}
                  >
                    {getEtiquetaPorValor(registro.valor)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span>{format(new Date(registro.fecha), "d 'de' MMM", { locale: es })}</span>
                  <span>•</span>
                  <span>{registro.hora}</span>
                  {registro.momento && (
                    <>
                      <span>•</span>
                      <span>{getMomentoLabel(registro.momento)}</span>
                    </>
                  )}
                </div>
                {registro.notas && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{registro.notas}</p>
                )}
                {registro.insulina && registro.insulina !== 'ninguna' && (
                  <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                    💉 {getInsulinaLabel(registro.insulina)}
                    {registro.dosisInsulina && ` - ${registro.dosisInsulina} U`}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleEliminar(registro.id)}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                  confirmarEliminar === registro.id
                    ? 'bg-red-100 text-red-600'
                    : 'text-gray-300 hover:text-red-400 hover:bg-red-50'
                }`}
                title={confirmarEliminar === registro.id ? 'Clic de nuevo para confirmar' : 'Eliminar'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {registrosFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>No se encontraron registros con los filtros seleccionados</p>
          </div>
        )}
      </div>
    </div>
  );
}
