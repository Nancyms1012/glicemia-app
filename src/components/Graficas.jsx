import { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
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
import { Line, Bar } from 'react-chartjs-2';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);


export default function Graficas({ registros }) {
  const [periodo, setPeriodo] = useState(7);

  const datosFiltrados = useMemo(() => {
    const fechaLimite = subDays(new Date(), periodo);
    return registros
      .filter((r) => new Date(r.fecha) >= fechaLimite)
      .sort((a, b) => new Date(a.fecha + 'T' + a.hora) - new Date(b.fecha + 'T' + b.hora));
  }, [registros, periodo]);

  const datosLineaTendencia = useMemo(() => {
    if (datosFiltrados.length === 0) return null;
    const labels = datosFiltrados.map((r) =>
      format(new Date(r.fecha), 'dd/MM', { locale: es }) + ' ' + r.hora
    );
    const valores = datosFiltrados.map((r) => Number(r.valor));
    return {
      labels,
      datasets: [{
        label: 'Glicemia (mg/dL)',
        data: valores,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: valores.map((v) => v < 70 ? '#ef4444' : v <= 180 ? '#10b981' : '#f59e0b'),
        pointBorderColor: valores.map((v) => v < 70 ? '#ef4444' : v <= 180 ? '#10b981' : '#f59e0b'),
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    };
  }, [datosFiltrados]);


  const datosPromediosDiarios = useMemo(() => {
    if (datosFiltrados.length === 0) return null;
    const hoy = startOfDay(new Date());
    const inicio = startOfDay(subDays(hoy, periodo));
    const dias = eachDayOfInterval({ start: inicio, end: hoy });
    const promediosPorDia = dias.map((dia) => {
      const diaStr = format(dia, 'yyyy-MM-dd');
      const registrosDelDia = datosFiltrados.filter((r) => r.fecha === diaStr);
      if (registrosDelDia.length === 0) return null;
      const suma = registrosDelDia.reduce((acc, r) => acc + Number(r.valor), 0);
      return Math.round(suma / registrosDelDia.length);
    });
    return {
      labels: dias.map((d) => format(d, 'dd/MM', { locale: es })),
      datasets: [{
        label: 'Promedio diario',
        data: promediosPorDia,
        backgroundColor: promediosPorDia.map((v) => {
          if (v === null) return '#e2e8f0';
          if (v < 70) return 'rgba(239, 68, 68, 0.7)';
          if (v <= 180) return 'rgba(16, 185, 129, 0.7)';
          return 'rgba(245, 158, 11, 0.7)';
        }),
        borderColor: promediosPorDia.map((v) => {
          if (v === null) return '#cbd5e1';
          if (v < 70) return '#ef4444';
          if (v <= 180) return '#10b981';
          return '#f59e0b';
        }),
        borderWidth: 1,
        borderRadius: 6,
      }],
    };
  }, [datosFiltrados, periodo]);


  const opcionesLinea = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 12 },
        bodyFont: { size: 13, weight: 'bold' },
        padding: 10,
        cornerRadius: 8,
        callbacks: { label: (ctx) => ` ${ctx.raw} mg/dL` },
      },
    },
    scales: {
      y: {
        min: 40,
        max: Math.max(250, ...datosFiltrados.map((r) => Number(r.valor)), 0) + 20,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, maxRotation: 45 },
      },
    },
  };

  const opcionesBarras = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 10,
        cornerRadius: 8,
        callbacks: { label: (ctx) => (ctx.raw ? ` Promedio: ${ctx.raw} mg/dL` : ' Sin datos') },
      },
    },
    scales: {
      y: { min: 40, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    },
  };


  if (registros.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin datos para graficar</h3>
          <p className="text-gray-400">Registra algunas mediciones para ver tus tendencias</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Gráficas</h2>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[{ value: 7, label: '7 días' }, { value: 14, label: '14 días' }, { value: 30, label: '30 días' }, { value: 90, label: '90 días' }].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                periodo === p.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>


      {/* Gráfica de tendencia */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-4">Tendencia de Glicemia</h3>
        {datosLineaTendencia ? (
          <div className="h-64">
            <Line data={datosLineaTendencia} options={opcionesLinea} />
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">No hay datos en este periodo</p>
        )}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Hipoglicemia (&lt;70)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span> En rango (70-180)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span> Hiperglicemia (&gt;180)
          </span>
        </div>
      </div>

      {/* Gráfica de promedios diarios */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-4">Promedios Diarios</h3>
        {datosPromediosDiarios ? (
          <div className="h-56">
            <Bar data={datosPromediosDiarios} options={opcionesBarras} />
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">No hay datos en este periodo</p>
        )}
      </div>
    </div>
  );
}
