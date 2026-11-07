import { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { supabase } from '../utils/supabase';

// Botón + ventana para cambiar la contraseña con la sesión ya iniciada.
export default function CambiarPassword({ usuario }) {
  const [abierto, setAbierto] = useState(false);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cerrar = () => {
    setAbierto(false);
    setActual('');
    setNueva('');
    setConfirmar('');
    setMensaje(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    if (nueva.length < 6) {
      setMensaje({ ok: false, texto: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }
    if (nueva !== confirmar) {
      setMensaje({ ok: false, texto: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    setLoading(true);
    // Verificar la contraseña actual re-autenticando antes de cambiarla
    const { error: errAuth } = await supabase.auth.signInWithPassword({
      email: usuario.email,
      password: actual,
    });
    if (errAuth) {
      setLoading(false);
      setMensaje({ ok: false, texto: 'La contraseña actual no es correcta' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: nueva });
    setLoading(false);
    if (error) {
      setMensaje({
        ok: false,
        texto: error.message.includes('different')
          ? 'La nueva contraseña debe ser distinta a la actual'
          : 'No se pudo cambiar la contraseña',
      });
      return;
    }
    setMensaje({ ok: true, texto: '¡Contraseña actualizada!' });
    setActual('');
    setNueva('');
    setConfirmar('');
  };

  const clase =
    'w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm';

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        title="Cambiar contraseña"
        className="flex items-center text-xs p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
      >
        <KeyRound className="w-3.5 h-3.5" />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">Cambiar contraseña</h2>
              <button onClick={cerrar} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="password" value={actual} onChange={(e) => setActual(e.target.value)}
                placeholder="Contraseña actual" required autoComplete="current-password" className={clase} />
              <input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)}
                placeholder="Nueva contraseña (mín. 6)" required minLength={6} autoComplete="new-password" className={clase} />
              <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repite la nueva contraseña" required minLength={6} autoComplete="new-password" className={clase} />
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </form>
            {mensaje && (
              <p className={`text-sm mt-3 ${mensaje.ok ? 'text-emerald-600' : 'text-red-600'}`}>{mensaje.texto}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
