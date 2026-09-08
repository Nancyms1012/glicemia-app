import {
  Chart,
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
import { parseFechaLocal } from './constants';

Chart.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

// Crea un canvas temporal fuera de pantalla, dibuja la gráfica y devuelve la imagen base64
function renderChart(config, width = 800, height = 300) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.left = '-9999px';
    document.body.appendChild(canvas);

    const chart = new Chart(canvas.getContext('2d'), {
      ...config,
      options: {
        ...config.options,
        responsive: false,
        animation: false,
        devicePixelRatio: 2,
      },
    });

    // Esperar a que se renderice y capturar
    setTimeout(() => {
      const imagen = canvas.toDataURL('image/png', 1.0);
      chart.destroy();
      document.body.removeChild(canvas);
      resolve(imagen);
    }, 200);
  });
}

// Genera la gráfica de tendencia de líneas
export async function generarGraficaTendencia(registros) {
  const conValor = registros
    .filter((r) => r.valor != null && r.valor !== '')
    .sort((a, b) => new Date(a.fecha + 'T' + a.hora) - new Date(b.fecha + 'T' + b.hora));

  if (conValor.length === 0) return null;

  const labels = conValor.map(
    (r) => format(parseFechaLocal(r.fecha), 'dd/MM', { locale: es }) + ' ' + r.hora
  );
  const valores = conValor.map((r) => Number(r.valor));

  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Glicemia (mg/dL)',
          data: valores,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: valores.map((v) =>
            v < 70 ? '#ef4444' : v <= 180 ? '#10b981' : '#f59e0b'
          ),
          pointBorderColor: valores.map((v) =>
            v < 70 ? '#ef4444' : v <= 180 ? '#10b981' : '#f59e0b'
          ),
          pointRadius: 3,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 40,
          max: Math.max(250, ...valores) + 20,
          grid: { color: '#e5e7eb' },
        },
        x: {
          grid: { display: false },
          ticks: { maxRotation: 45, font: { size: 9 } },
        },
      },
    },
  };

  return renderChart(config, 800, 280);
}

// Genera la gráfica de barras de promedios diarios
export async function generarGraficaPromedios(registros, dias = 30) {
  const conValor = registros.filter((r) => r.valor != null && r.valor !== '');
  if (conValor.length === 0) return null;

  // Agrupar por día
  const porDia = {};
  conValor.forEach((r) => {
    if (!porDia[r.fecha]) porDia[r.fecha] = [];
    porDia[r.fecha].push(Number(r.valor));
  });

  const dias_ordenados = Object.keys(porDia).sort();
  const labels = dias_ordenados.map((d) => format(parseFechaLocal(d), 'dd/MM', { locale: es }));
  const promedios = dias_ordenados.map((d) => {
    const vals = porDia[d];
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  });

  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Promedio diario',
          data: promedios,
          backgroundColor: promedios.map((v) =>
            v < 70 ? 'rgba(239, 68, 68, 0.7)' : v <= 180 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(245, 158, 11, 0.7)'
          ),
          borderColor: promedios.map((v) =>
            v < 70 ? '#ef4444' : v <= 180 ? '#10b981' : '#f59e0b'
          ),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 40, grid: { color: '#e5e7eb' } },
        x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      },
    },
  };

  return renderChart(config, 800, 240);
}
