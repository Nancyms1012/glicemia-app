import { useState } from 'react';
import { PlusCircle, Droplets, Syringe } from 'lucide-react';
import { MOMENTOS, INSULINAS } from '../utils/constants';
import { format } from 'date-fns';

export default function RegistroForm({ onAgregar }) {
  const [formData, setFormData] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    hora: format(new Date(), 'HH:mm'),
    valor: '',
    momento: '',
    insulina: '',
    dosisInsulina: '',
    notas: '',
  });
  const [mensaje, setMensaje] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.valor || Number(formData.valor) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Por favor ingresa un valor de glicemia válido' });
      return;
    }

    if (Number(formData.valor) > 600) {
      setMensaje({ tipo: 'error', texto: 'El valor parece demasiado alto. Verifica la medición.' });
      return;
    }

    onAgregar(formData);
    setMensaje({ tipo: 'exito', texto: '¡Registro guardado exitosamente!' });

    setFormData({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      hora: format(new Date(), 'HH:mm'),
      valor: '',
      momento: '',
      insulina: '',
      dosisInsulina: '',
      notas: '',
    });

    setTimeout(() => setMensaje(null), 3000);
  };

  const getValorColor = () => {
    const v = Number(formData.valor);
    if (!v) return 'border-gray-300';
    if (v < 70) return 'border-red-400 bg-red-50';
    if (v <= 180) return 'border-green-400 bg-green-50';
    return 'border-amber-400 bg-amber-50';
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Droplets className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Nuevo Registro</h2>
            <p className="text-sm text-gray-500">Registra tu medición de glicemia</p>
          </div>
        </div>

        {mensaje && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              mensaje.tipo === 'exito'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Valor de glicemia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Glicemia (mg/dL) *
            </label>
            <div className="relative">
              <input
                type="number"
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                placeholder="Ej: 120"
                min="20"
                max="600"
                className={`w-full px-4 py-3 text-2xl font-bold text-center rounded-xl border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${getValorColor()}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                mg/dL
              </span>
            </div>
            {formData.valor && (
              <p
                className={`mt-1 text-xs font-medium ${
                  Number(formData.valor) < 70
                    ? 'text-red-600'
                    : Number(formData.valor) <= 180
                    ? 'text-green-600'
                    : 'text-amber-600'
                }`}
              >
                {Number(formData.valor) < 70
                  ? '⚠️ Hipoglicemia - Valor bajo'
                  : Number(formData.valor) <= 180
                  ? '✓ Valor en rango normal'
                  : '⚠️ Hiperglicemia - Valor alto'}
              </p>
            )}
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input
                type="time"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Momento del día */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Momento de la medición
            </label>
            <select
              name="momento"
              value={formData.momento}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            >
              <option value="">Seleccionar momento...</option>
              {MOMENTOS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Insulina */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Syringe className="w-4 h-4 text-blue-600" />
              <label className="text-sm font-medium text-blue-800">Insulina aplicada</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <select
                  name="insulina"
                  value={formData.insulina}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 text-sm"
                >
                  <option value="">Tipo de insulina...</option>
                  {INSULINAS.map((ins) => (
                    <option key={ins.value} value={ins.value}>
                      {ins.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="relative">
                  <input
                    type="number"
                    name="dosisInsulina"
                    value={formData.dosisInsulina}
                    onChange={handleChange}
                    placeholder="Dosis"
                    min="0"
                    max="100"
                    step="0.5"
                    disabled={!formData.insulina || formData.insulina === 'ninguna'}
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400">
                    U
                  </span>
                </div>
              </div>
            </div>
            {formData.insulina && formData.insulina !== 'ninguna' && (
              <p className="mt-2 text-xs text-blue-600">
                {formData.insulina === 'lispro'
                  ? '💉 Lispro: insulina de acción rápida (actúa en 15-30 min)'
                  : '💉 Lantus: insulina de acción prolongada (actúa 24 hrs)'}
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              placeholder="Ej: Comí pizza, hice ejercicio, me sentí mareada..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none"
            />
          </div>

          {/* Botón submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            Guardar Registro
          </button>
        </form>
      </div>
    </div>
  );
}
