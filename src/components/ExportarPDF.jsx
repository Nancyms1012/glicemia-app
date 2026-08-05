import { useState } from 'react';
import { FileDown, FileText, User } from 'lucide-react';
import { exportarReportePDF } from '../utils/exportarPDF';

export default function ExportarPDF({ registros, obtenerEstadisticas }) {
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [diasReporte, setDiasReporte] = useState(30);
  const [exportando, setExportando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const handleExportar = () => {
    if (registros.length === 0) {
      setMensaje({ tipo: 'error', texto: 'No hay registros para exportar' });
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    setExportando(true);
    try {
      const stats = obtenerEstadisticas(diasReporte);
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasReporte);
      const registrosFiltrados = registros.filter((r) => new Date(r.fecha) >= fechaLimite);
      exportarReportePDF(registrosFiltrados, stats, nombrePaciente || 'Paciente');
      setMensaje({ tipo: 'exito', texto: '¡Reporte PDF generado exitosamente!' });
    } catch (error) {
      console.error('Error al exportar:', error);
      setMensaje({ tipo: 'error', texto: 'Error al generar el PDF. Intenta de nuevo.' });
    } finally {
      setExportando(false);
      setTimeout(() => setMensaje(null), 4000);
    }
  };


  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-rose-100 rounded-xl">
            <FileText className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Exportar Reporte</h2>
            <p className="text-sm text-gray-500">Genera un PDF para tu médico</p>
          </div>
        </div>

        {mensaje && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>{mensaje.texto}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />Nombre del paciente
            </label>
            <input type="text" value={nombrePaciente} onChange={(e) => setNombrePaciente(e.target.value)}
              placeholder="Nombre para el reporte"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodo del reporte</label>
            <select value={diasReporte} onChange={(e) => setDiasReporte(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400">
              <option value={7}>Últimos 7 días</option>
              <option value={14}>Últimos 14 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={60}>Últimos 60 días</option>
              <option value={90}>Últimos 90 días</option>
              <option value={180}>Últimos 6 meses</option>
              <option value={365}>Último año</option>
            </select>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">El reporte incluirá:</h4>
            <ul className="text-sm text-gray-500 space-y-1">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Datos del paciente y fecha</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Resumen estadístico (promedio, máx, mín, tiempo en rango)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Resumen de insulina aplicada (Lispro/Lantus y dosis)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Tabla detallada de todas las mediciones</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Notas relevantes de cada registro</li>
            </ul>
          </div>

          <button onClick={handleExportar} disabled={exportando || registros.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-sm">
            <FileDown className="w-5 h-5" />
            {exportando ? 'Generando PDF...' : 'Descargar Reporte PDF'}
          </button>

          {registros.length === 0 && (
            <p className="text-center text-sm text-gray-400">Necesitas al menos un registro para generar el reporte</p>
          )}
        </div>
      </div>
    </div>
  );
}
