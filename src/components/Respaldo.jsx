import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { respaldoJSON, respaldoCSV } from '../utils/respaldo';

export default function Respaldo({ usuario }) {
  const [abierto, setAbierto] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const ejecutar = async (fn, etiqueta) => {
    setTrabajando(true);
    setMensaje(null);
    try {
      const n = await fn(usuario);
      setMensaje({ ok: true, texto: `${etiqueta} descargado: ${n} registros.` });
    } catch (e) {
      setMensaje({ ok: false, texto: `No se pudo crear el respaldo: ${e.message || e}` });
    }
    setTrabajando(false);
  };

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium transition-colors"
      >
        <Download className="w-3 h-3" />
        Respaldo
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">Respaldo de registros</h2>
              <button onClick={() => setAbierto(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Descarga una copia de todos tus registros ({usuario.email}) en tu dispositivo.
            </p>
            <div className="space-y-2">
              <button
                disabled={trabajando}
                onClick={() => ejecutar(respaldoJSON, 'Respaldo completo (JSON)')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {trabajando ? 'Preparando...' : 'Descargar respaldo completo (.json)'}
              </button>
              <button
                disabled={trabajando}
                onClick={() => ejecutar(respaldoCSV, 'Archivo Excel (CSV)')}
                className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                Descargar para Excel (.csv)
              </button>
            </div>
            {mensaje && (
              <p className={`text-sm mt-3 ${mensaje.ok ? 'text-emerald-600' : 'text-red-600'}`}>{mensaje.texto}</p>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Guarda el archivo en un lugar seguro (correo, Drive o computadora).
            </p>
          </div>
        </div>
      )}
    </>
  );
}
