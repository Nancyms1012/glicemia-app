import { useState, useEffect } from 'react';
import { Bell, BellOff, Plus, Trash2, Clock, Save, Check } from 'lucide-react';

export default function Recordatorios({ horarios, activados, guardar, cargando }) {
  const [listaHorarios, setListaHorarios] = useState([]);
  const [estaActivado, setEstaActivado] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [permisoNotif, setPermisoNotif] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    setListaHorarios(horarios);
    setEstaActivado(activados);
  }, [horarios, activados]);

  const handleCambiarHora = (idx, valor) => {
    const nueva = [...listaHorarios];
    nueva[idx] = { ...nueva[idx], hora: valor };
    setListaHorarios(nueva);
  };

  const handleCambiarEtiqueta = (idx, valor) => {
    const nueva = [...listaHorarios];
    nueva[idx] = { ...nueva[idx], etiqueta: valor };
    setListaHorarios(nueva);
  };

  const handleAgregar = () => {
    setListaHorarios([...listaHorarios, { hora: '08:00', etiqueta: 'Nuevo horario' }]);
  };

  const handleEliminar = (idx) => {
    if (listaHorarios.length <= 4) {
      setMensaje({ tipo: 'error', texto: 'Debes tener al menos 4 horarios configurados' });
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    setListaHorarios(listaHorarios.filter((_, i) => i !== idx));
  };

  const solicitarPermiso = async () => {
    if (typeof Notification === 'undefined') {
      setMensaje({ tipo: 'error', texto: 'Tu navegador no soporta notificaciones' });
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    const permiso = await Notification.requestPermission();
    setPermisoNotif(permiso);
    if (permiso === 'granted') {
      // Notificación de prueba
      new Notification('SugarTrack', {
        body: '¡Notificaciones activadas! Te avisaremos a las horas configuradas.',
        icon: '/favicon.svg',
      });
    }
  };

  const handleGuardar = async () => {
    // Validar horarios
    const ordenados = [...listaHorarios].sort((a, b) => a.hora.localeCompare(b.hora));
    const exito = await guardar(ordenados, estaActivado);
    if (exito) {
      setListaHorarios(ordenados);
      setMensaje({ tipo: 'exito', texto: '¡Recordatorios guardados exitosamente!' });
    } else {
      setMensaje({ tipo: 'error', texto: 'Error al guardar. Intenta de nuevo.' });
    }
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleToggleActivar = async () => {
    const nuevo = !estaActivado;
    setEstaActivado(nuevo);
    // Si se activa y no hay permiso, pedirlo
    if (nuevo && permisoNotif !== 'granted') {
      await solicitarPermiso();
    }
  };

  if (cargando) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-gray-400 animate-pulse">Cargando recordatorios...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Bell className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Recordatorios</h2>
            <p className="text-sm text-gray-500">Horarios de inyección de insulina</p>
          </div>
        </div>

        {mensaje && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>{mensaje.texto}</div>
        )}

        {/* Toggle activar */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
          <div className="flex items-center gap-3">
            {estaActivado ? (
              <Bell className="w-5 h-5 text-amber-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium text-gray-700 text-sm">Alertas activadas</p>
              <p className="text-xs text-gray-400">
                Avisa 15 min después si no registras
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleActivar}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              estaActivado ? 'bg-amber-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                estaActivado ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {/* Aviso de permiso de notificaciones */}
        {estaActivado && permisoNotif !== 'granted' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              Para recibir avisos aunque la app esté cerrada, activa las notificaciones del navegador.
            </p>
            <button
              onClick={solicitarPermiso}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
            >
              Activar notificaciones
            </button>
          </div>
        )}
        {estaActivado && permisoNotif === 'granted' && (
          <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-700">Notificaciones del navegador activadas</p>
          </div>
        )}

        {/* Lista de horarios */}
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">
            Horarios de inyección (mínimo 4):
          </p>
          {listaHorarios.map((h, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="relative">
                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="time"
                  value={h.hora}
                  onChange={(e) => handleCambiarHora(idx, e.target.value)}
                  className="pl-8 pr-2 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <input
                type="text"
                value={h.etiqueta}
                onChange={(e) => handleCambiarEtiqueta(idx, e.target.value)}
                placeholder="Etiqueta (ej: Desayuno)"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                onClick={() => handleEliminar(idx)}
                className="p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleAgregar}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-amber-300 hover:text-amber-600 rounded-xl transition-colors text-sm mb-4"
        >
          <Plus className="w-4 h-4" />
          Agregar horario
        </button>

        <button
          onClick={handleGuardar}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Save className="w-5 h-5" />
          Guardar Recordatorios
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-sm text-blue-700">
          <strong>¿Cómo funciona?</strong> Si pasan 15 minutos de la hora configurada
          y no has registrado una glicemia o dosis de insulina, la app te mostrará una
          alerta. Si activas las notificaciones del navegador, el aviso llegará aunque
          la app esté en segundo plano.
        </p>
      </div>
    </div>
  );
}
