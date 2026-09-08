import { useState, useMemo } from 'react';
import { FileText, FileDown, User, Target, TrendingUp, TrendingDown, Heart } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseFechaLocal } from '../utils/constants';
import { exportarReportePDF } from '../utils/exportarPDF';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

export default function OnePager({ registros, obtenerEstadisticas, obtenerRangosPorPeriodo }) {
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [exportando, setExportando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const stats = useMemo(() => obtenerEstadisticas(30), [registros]);
  const rangos7 = useMemo(() => obtenerRangosPorPeriodo(7), [registros]);
  const rangos15 = useMemo(() => obtenerRangosPorPeriodo(15), [registros]);
  const rangos30 = useMemo(() => obtenerRangosPorPeriodo(30), [registros]);

  // Datos para gráfica de tendencia (último mes)
  const datosTendencia = useMemo(() => {
    const fechaLimite = new Date();
    fechaLimite.setHours(0, 0, 0, 0);
    fechaLimite.setDate(fechaLimite.getDate() - 29);

    const conValor = registros
      .filter((r) => {
        if (r.valor == null || r.valor === '') return false;
        const [a, m, d] = r.fecha.split('-').map(Number);
        return new Date(a, m - 1, d) >= fechaLimite;
      })
      .sort((a, b) => new Date(a.fecha + 'T' + a.hora) - new Date(b.fecha + 'T' + b.hora));

    if (conValor.length === 0) return null;
    const valores = conValor.map((r) => Number(r.valor));
    return {
      labels: conValor.map((r) => format(parseFechaLocal(r.fecha), 'dd/MM', { locale: es }) + ' ' + r.hora),
      datasets: [{
        data: valores,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: valores.map((v) => v < 70 ? '#ef4444' : v <= 180 ? '#10b981' : '#f59e0b'),
        pointBorderColor: valores.map((v) => v < 70 ? '#ef4444' : v <= 180 ? '#10b981' : '#f59e0b'),
        pointRadius: 4,
      }],
    };
  }, [registros]);

  // Datos para gráfica de promedios diarios (último mes)
  const datosPromedios = useMemo(() => {
    const fechaLimite = new Date();
    fechaLimite.setHours(0, 0, 0, 0);
    fechaLimite.setDate(fechaLimite.getDate() - 29);

    const conValor = registros.filter((r) => {
      if (r.valor == null || r.valor === '') return false;
      const [a, m, d] = r.fecha.split('-').map(Number);
      return new Date(a, m - 1, d) >= fechaLimite;
    });
    if (conValor.length === 0) return null;

    const porDia = {};
    conValor.forEach((r) => {
      if (!porDia[r.fecha]) porDia[r.fecha] = [];
      porDia[r.fecha].push(Number(r.valor));
    });
    const dias = Object.keys(porDia).sort();
    const promedios = dias.map((d) => {
      const v = porDia[d];
      return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
    });
    return {
      labels: dias.map((d) => format(parseFechaLocal(d), 'dd/MM', { locale: es })),
      datasets: [{
        data: promedios,
        backgroundColor: promedios.map((v) => v < 70 ? 'rgba(239,68,68,0.7)' : v <= 180 ? 'rgba(16,185,129,0.7)' : 'rgba(245,158,11,0.7)'),
        borderColor: promedios.map((v) => v < 70 ? '#ef4444' : v <= 180 ? '#10b981' : '#f59e0b'),
        borderWidth: 1,
        borderRadius: 4,
      }],
    };
  }, [registros]);

  const opcionesGrafica = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { min: 40, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } },
    },
  };

  const handleExportar = async () => {
    if (registros.length === 0) return;
    setExportando(true);
    try {
      const fechaLimite = new Date();
      fechaLimite.setHours(0, 0, 0, 0);
      fechaLimite.setDate(fechaLimite.getDate() - 29);
      const registrosFiltrados = registros.filter((r) => {
        const [a, m, d] = r.fecha.split('-').map(Number);
        return new Date(a, m - 1, d) >= fechaLimite;
      });
      await exportarReportePDF({
        registros: registrosFiltrados,
        estadisticas: stats,
        rangos7,
        rangos15,
        rangos30,
        nombrePaciente: nombrePaciente || 'Paciente',
      });
      setMensaje({ tipo: 'exito', texto: '¡PDF generado exitosamente!' });
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: 'Error al generar el PDF.' });
    } finally {
      setExportando(false);
      setTimeout(() => setMensaje(null), 4000);
    }
  };

  if (registros.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin datos para el reporte</h3>
          <p className="text-gray-400">Registra mediciones para ver el One Pager</p>
        </div>
      </div>
    );
  }

  const filas = [
    { periodo: 'Últimos 7 días', datos: rangos7 },
    { periodo: 'Últimos 15 días', datos: rangos15 },
    { periodo: 'Último mes', datos: rangos30 },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header con nombre y exportar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-100 rounded-xl">
            <FileText className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">One Pager</h2>
            <p className="text-sm text-gray-500">Resumen para tu médico</p>
          </div>
        </div>

        {mensaje && (
          <div className={`mb-3 p-3 rounded-lg text-sm font-medium ${
            mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>{mensaje.texto}</div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={nombrePaciente}
              onChange={(e) => setNombrePaciente(e.target.value)}
              placeholder="Nombre del paciente"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
            />
          </div>
          <button
            onClick={handleExportar}
            disabled={exportando}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            <FileDown className="w-4 h-4" />
            {exportando ? 'Generando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* Resumen general */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Resumen General (último mes)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <TarjetaResumen icon={<Target className="w-4 h-4" />} label="Promedio" valor={stats.promedio} unidad="mg/dL" color="indigo" />
          <TarjetaResumen icon={<TrendingUp className="w-4 h-4" />} label="Máximo" valor={stats.maximo} unidad="mg/dL" color="amber" />
          <TarjetaResumen icon={<TrendingDown className="w-4 h-4" />} label="Mínimo" valor={stats.minimo} unidad="mg/dL" color="red" />
          <TarjetaResumen icon={<Heart className="w-4 h-4" />} label="Mediciones" valor={stats.total} unidad="total" color="purple" />
          <TarjetaResumen icon={<Target className="w-4 h-4" />} label="En rango" valor={`${stats.porcentajeEnRango}%`} unidad="70-180" color="green" />
        </div>
      </div>

      {/* Cuadro de distribución por rangos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Distribución por Rangos</h3>
        <div className="overflow-hidden rounded-lg border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-indigo-600 text-white">
                <th className="text-left px-3 py-2 font-semibold">Periodo</th>
                <th className="px-2 py-2 font-semibold text-center">
                  Bajo<br /><span className="text-[10px] font-normal opacity-80">&lt;70</span>
                </th>
                <th className="px-2 py-2 font-semibold text-center">
                  Normal<br /><span className="text-[10px] font-normal opacity-80">70-180</span>
                </th>
                <th className="px-2 py-2 font-semibold text-center">
                  Alto<br /><span className="text-[10px] font-normal opacity-80">&gt;180</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, idx) => (
                <tr key={fila.periodo} className={idx % 2 === 0 ? 'bg-white' : 'bg-indigo-50/50'}>
                  <td className="px-3 py-2.5 font-medium text-gray-700">{fila.periodo}</td>
                  <CeldaRango datos={fila.datos.bajo} color="text-red-600" />
                  <CeldaRango datos={fila.datos.normal} color="text-green-600" />
                  <CeldaRango datos={fila.datos.alto} color="text-amber-600" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2 italic">
          Cantidad de mediciones y % respecto al total del periodo. Total último mes: {rangos30.total} mediciones.
        </p>
      </div>

      {/* Gráfica de tendencia */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Tendencia de Glicemia</h3>
        {datosTendencia ? (
          <div className="h-56"><Line data={datosTendencia} options={opcionesGrafica} /></div>
        ) : (
          <p className="text-center text-gray-400 py-8">No hay datos en el último mes</p>
        )}
        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Bajo</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> En rango</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Alto</span>
        </div>
      </div>

      {/* Gráfica de promedios diarios */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Promedios Diarios</h3>
        {datosPromedios ? (
          <div className="h-48"><Bar data={datosPromedios} options={opcionesGrafica} /></div>
        ) : (
          <p className="text-center text-gray-400 py-8">No hay datos en el último mes</p>
        )}
      </div>
    </div>
  );
}

function TarjetaResumen({ icon, label, valor, unidad, color }) {
  const colores = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
  };
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className={`inline-flex p-1.5 rounded-lg ${colores[color]} mb-1`}>{icon}</div>
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-800 leading-tight">{valor}</p>
      <p className="text-[9px] text-gray-400">{unidad}</p>
    </div>
  );
}

function CeldaRango({ datos, color }) {
  return (
    <td className="px-2 py-2.5 text-center">
      <span className={`font-bold text-base ${color}`}>{datos.cantidad}</span>
      <span className="text-xs text-gray-400 ml-1">({datos.porcentaje}%)</span>
    </td>
  );
}
