import { useState, useMemo } from 'react';
import { ClipboardList, Trash2, Search, Filter, Pencil, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MOMENTOS, INSULINAS, getColorPorValor, getEtiquetaPorValor } from '../utils/constants';

export default function Historial({ registros, onEliminar, onEditar }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroMomento, setFiltroMomento] = useState('');
  const [filtroRango, setFiltroRango] = useState('');
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [editando, setEditando] = useState(null);
  const [formEditar, setFormEditar] = useState({});

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

  const handleEditar = (registro) => {
    setEditando(registro.id);
    setFormEditar({
      fecha: registro.fecha,
      hora: registro.hora,
      valor: String(registro.valor),
      momento: registro.momento || '',
      insulina: registro.insulina || '',
      dosisInsulina: registro.dosisInsulina ? String(registro.dosisInsulina) : '',
      notas: registro.notas || '',
    });
  };

  const handleGuardarEdicion = async () => {
    if (!formEditar.valor || Number(formEditar.valor) <= 0) return;
    const exito = await onEditar(editando, formEditar);
    if (exito !== false) {
      setEditando(null);
      setFormEditar({});
    }
  };

  const handleCancelarEdicion = () => {
    setEditando(null);
    setFormEditar({});
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
            <div key={registro.id}>
              {editando === registro.id ? (
                /* Formulario de edición */
                <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-indigo-700">Editando registro</span>
                    <div className="flex gap-1">
                      <button
                        onClick={handleGuardarEdicion}
                        className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                        title="Guardar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelarEdicion}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Glicemia *</label>
                      <input
                        type="number"
                        value={formEditar.valor}
                        onChange={(e) => setFormEditar({ ...formEditar, valor: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-sm font-bold text-center"
                        min="20"
                        max="600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Fecha</label>
                      <input
                        type="date"
                        value={formEditar.fecha}
                        onChange={(e) => setFormEditar({ ...formEditar, fecha: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Hora</label>
                      <input
                        type="time"
                        value={formEditar.hora}
                        onChange={(e) => setFormEditar({ ...formEditar, hora: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Momento</label>
                      <select
                        value={formEditar.momento}
                        onChange={(e) => setFormEditar({ ...formEditar, momento: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-sm"
                      >
                        <option value="">Sin momento</option>
                        {MOMENTOS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Insulina</label>
                      <select
                        value={formEditar.insulina}
                        onChange={(e) => setFormEditar({ ...formEditar, insulina: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-sm"
                      >
                        <option value="">Sin insulina</option>
                        {INSULINAS.map((ins) => (
                          <option key={ins.value} value={ins.value}>{ins.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formEditar.insulina && formEditar.insulina !== 'ninguna' && (
                    <div>
                      <label className="text-xs text-gray-600">Dosis (U)</label>
                      <input
                        type="number"
                        value={formEditar.dosisInsulina}
                        onChange={(e) => setFormEditar({ ...formEditar, dosisInsulina: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-sm"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="Dosis"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-gray-600">Notas</label>
                    <input
                      type="text"
                      value={formEditar.notas}
                      onChange={(e) => setFormEditar({ ...formEditar, notas: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-sm"
                      placeholder="Notas..."
                    />
                  </div>
                </div>
              ) : (
                /* Vista normal del registro */
                <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
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
                        {registro.insulina !== 'ambas' && registro.dosisInsulina && ` - ${registro.dosisInsulina} U`}
                      </p>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEditar(registro)}
                      className="p-2 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminar(registro.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        confirmarEliminar === registro.id
                          ? 'bg-red-100 text-red-600'
                          : 'text-gray-300 hover:text-red-400 hover:bg-red-50'
                      }`}
                      title={confirmarEliminar === registro.id ? 'Clic de nuevo para confirmar' : 'Eliminar'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
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
