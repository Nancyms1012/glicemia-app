import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { format } from 'date-fns';

// Minutos de gracia después de la hora antes de alertar
const MINUTOS_GRACIA = 15;
// Cada cuánto revisa (ms)
const INTERVALO_CHEQUEO = 60 * 1000; // 1 minuto

export default function AlertaRecordatorio({ horarios, activados, registros, onIrARegistrar }) {
  const [alertasActivas, setAlertasActivas] = useState([]);
  const descartadasRef = useRef(new Set());
  const notificadasRef = useRef(new Set());

  useEffect(() => {
    if (!activados || !horarios || horarios.length === 0) {
      setAlertasActivas([]);
      return;
    }

    const revisar = () => {
      const ahora = new Date();
      const hoy = format(ahora, 'yyyy-MM-dd');
      const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

      // Registros de hoy con su minuto del día
      const registrosHoy = registros
        .filter((r) => r.fecha === hoy)
        .map((r) => {
          const [h, m] = r.hora.split(':').map(Number);
          return h * 60 + m;
        });

      const nuevasAlertas = [];

      horarios.forEach((horario) => {
        const [h, m] = horario.hora.split(':').map(Number);
        const minutoHorario = h * 60 + m;
        const claveHoy = `${hoy}_${horario.hora}`;

        // ¿Ya pasaron los 15 min de gracia?
        const pasoGracia = minutosAhora >= minutoHorario + MINUTOS_GRACIA;
        // ¿No es demasiado tarde? (dejamos ventana de 3 horas para alertar)
        const dentroVentana = minutosAhora <= minutoHorario + MINUTOS_GRACIA + 180;

        // ¿Hay algún registro cerca de esa hora? (±90 min del horario)
        const hayRegistroCercano = registrosHoy.some(
          (rm) => Math.abs(rm - minutoHorario) <= 90
        );

        if (pasoGracia && dentroVentana && !hayRegistroCercano) {
          if (!descartadasRef.current.has(claveHoy)) {
            nuevasAlertas.push({
              clave: claveHoy,
              hora: horario.hora,
              etiqueta: horario.etiqueta,
            });

            // Notificación del navegador (solo una vez por horario/día)
            if (
              !notificadasRef.current.has(claveHoy) &&
              typeof Notification !== 'undefined' &&
              Notification.permission === 'granted'
            ) {
              new Notification('SugarTrack - Recordatorio', {
                body: `Es hora de registrar: ${horario.etiqueta} (${horario.hora}). Han pasado ${MINUTOS_GRACIA} minutos.`,
                icon: '/favicon.svg',
                tag: claveHoy,
              });
              notificadasRef.current.add(claveHoy);
            }
          }
        }
      });

      setAlertasActivas(nuevasAlertas);
    };

    revisar();
    const intervalo = setInterval(revisar, INTERVALO_CHEQUEO);
    return () => clearInterval(intervalo);
  }, [horarios, activados, registros]);

  const descartar = (clave) => {
    descartadasRef.current.add(clave);
    setAlertasActivas((prev) => prev.filter((a) => a.clave !== clave));
  };

  if (alertasActivas.length === 0) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 space-y-2">
      {alertasActivas.map((alerta) => (
        <div
          key={alerta.clave}
          className="bg-amber-500 text-white rounded-2xl shadow-lg p-4 flex items-start gap-3 animate-[slideDown_0.3s_ease-out]"
        >
          <div className="p-1.5 bg-white/20 rounded-lg flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">¡Recordatorio pendiente!</p>
            <p className="text-sm text-amber-50">
              <Clock className="w-3 h-3 inline mr-1" />
              {alerta.etiqueta} ({alerta.hora}) — no has registrado
            </p>
            <button
              onClick={() => {
                onIrARegistrar();
                descartar(alerta.clave);
              }}
              className="mt-2 text-xs font-semibold bg-white text-amber-600 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
            >
              Registrar ahora
            </button>
          </div>
          <button
            onClick={() => descartar(alerta.clave)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            title="Descartar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
