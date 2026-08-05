import { useState, useMemo } from 'react';
import { Activity, TrendingDown, TrendingUp, Target, AlertTriangle, Heart } from 'lucide-react';
import { subDays } from 'date-fns';
import { MOMENTOS } from '../utils/constants';

export default function Estadisticas({ registros, obtenerEstadisticas }) {
  const [periodo, setPeriodo] = useState(30);
  const stats = useMemo(() => obtenerEstadisticas(periodo), [registros, periodo]);


  const promediosPorMomento = useMemo(() => {
    const fechaLimite = subDays(new Date(), periodo);
    const filtrados = registros.filter((r) => new Date(r.fecha) >= fechaLimite);
    const porMomento = {};
    filtrados.forEach((r) => {
      if (!r.momento) return;
      if (!porMomento[r.momento]) porMomento[r.momento] = { suma: 0, count: 0 };
      porMomento[r.momento].suma += Number(r.valor);
      porMomento[r.momento].count += 1;
    });
    return Object.entries(porMomento)
      .map(([momento, data]) => ({
        momento,
        label: MOMENTOS.find((m) => m.value === momento)?.label || momento,
        promedio: Math.round(data.suma / data.count),
        mediciones: data.count,
      }))
      .sort((a, b) => {
        const orderA = MOMENTOS.findIndex((m) => m.value === a.momento);
        const orderB = MOMENTOS.findIndex((m) => m.value === b.momento);
        return orderA - orderB;
      });
  }, [registros, periodo]);

  const tendencia = useMemo(() => {
    const fechaLimite = subDays(new Date(), periodo);
    const filtrados = registros
      .filter((r) => new Date(r.fecha) >= fechaLimite)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    if (filtrados.length < 4) return null;
    const mitad = Math.floor(filtrados.length / 2);
    const primeraMitad = filtrados.slice(0, mitad);
    const segundaMitad = filtrados.slice(mitad);
    const promPrimera = primeraMitad.reduce((acc, r) => acc + Number(r.valor), 0) / primeraMitad.length;
    const promSegunda = segundaMitad.reduce((acc, r) => acc + Number(r.valor), 0) / segundaMitad.length;
    const diferencia = Math.round(promSegunda - promPrimera);
    return { diferencia, direccion: diferencia > 5 ? 'subiendo' : diferencia < -5 ? 'bajando' : 'estable' };
  }, [registros, periodo]);


  if (registros.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin estadísticas aún</h3>
          <p className="text-gray-400">Registra mediciones para ver tus estadísticas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <Activity className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Estadísticas</h2>
            <p className="text-sm text-gray-500">Resumen para tu médico</p>
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[{ value: 7, label: '7d' }, { value: 14, label: '14d' }, { value: 30, label: '30d' }, { value: 90, label: '90d' }].map((p) => (
            <button key={p.value} onClick={() => setPeriodo(p.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                periodo === p.value ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Target className="w-5 h-5" />} label="Promedio" value={`${stats.promedio}`} unit="mg/dL" color="indigo" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Máximo" value={`${stats.maximo}`} unit="mg/dL" color="amber" />
        <StatCard icon={<TrendingDown className="w-5 h-5" />} label="Mínimo" value={`${stats.minimo}`} unit="mg/dL" color="red" />
        <StatCard icon={<Heart className="w-5 h-5" />} label="Mediciones" value={`${stats.total}`} unit="total" color="purple" />
      </div>


      {/* Tiempo en rango */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-4">Tiempo en Rango (70-180 mg/dL)</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
              {stats.total > 0 && (
                <>
                  <div className="h-full bg-red-400 transition-all" style={{ width: `${(stats.hipoglicemias / stats.total) * 100}%` }} />
                  <div className="h-full bg-green-400 transition-all" style={{ width: `${stats.porcentajeEnRango}%` }} />
                  <div className="h-full bg-amber-400 transition-all" style={{ width: `${(stats.hiperglicemias / stats.total) * 100}%` }} />
                </>
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                Bajo: {stats.hipoglicemias} ({stats.total > 0 ? Math.round((stats.hipoglicemias / stats.total) * 100) : 0}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                En rango: {stats.enRango} ({stats.porcentajeEnRango}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Alto: {stats.hiperglicemias} ({stats.total > 0 ? Math.round((stats.hiperglicemias / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>
          <div className="text-center">
            <span className="text-3xl font-bold text-green-600">{stats.porcentajeEnRango}%</span>
            <p className="text-xs text-gray-500">en rango</p>
          </div>
        </div>
      </div>


      {/* Tendencia */}
      {tendencia && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Tendencia del Periodo</h3>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${tendencia.direccion === 'subiendo' ? 'bg-amber-100' : tendencia.direccion === 'bajando' ? 'bg-blue-100' : 'bg-green-100'}`}>
              {tendencia.direccion === 'subiendo' ? <TrendingUp className="w-6 h-6 text-amber-600" /> : tendencia.direccion === 'bajando' ? <TrendingDown className="w-6 h-6 text-blue-600" /> : <Target className="w-6 h-6 text-green-600" />}
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {tendencia.direccion === 'subiendo' ? 'Tendencia al alza' : tendencia.direccion === 'bajando' ? 'Tendencia a la baja' : 'Estable'}
              </p>
              <p className="text-sm text-gray-500">
                {tendencia.diferencia > 0 ? '+' : ''}{tendencia.diferencia} mg/dL comparando primera y segunda mitad del periodo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Promedios por momento */}
      {promediosPorMomento.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Promedios por Momento del Día</h3>
          <div className="space-y-2">
            {promediosPorMomento.map((item) => (
              <div key={item.momento} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="text-xs text-gray-400 ml-2">({item.mediciones} mediciones)</span>
                </div>
                <span className={`font-bold text-lg ${item.promedio < 70 ? 'text-red-600' : item.promedio <= 180 ? 'text-green-600' : 'text-amber-600'}`}>
                  {item.promedio} <span className="text-xs font-normal text-gray-400">mg/dL</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Alertas */}
      {(stats.hipoglicemias > 0 || stats.hiperglicemias > stats.total * 0.3) && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">Puntos a comentar con tu médico</h3>
          </div>
          <ul className="space-y-1 text-sm text-amber-700">
            {stats.hipoglicemias > 0 && <li>• Se registraron {stats.hipoglicemias} episodios de hipoglicemia (&lt;70 mg/dL)</li>}
            {stats.hiperglicemias > stats.total * 0.3 && <li>• Más del 30% de las mediciones fueron hiperglicemias (&gt;180 mg/dL)</li>}
            {stats.porcentajeEnRango < 70 && <li>• El tiempo en rango es menor al 70% recomendado</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, unit, color }) {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className={`inline-flex p-1.5 rounded-lg ${colorClasses[color]} mb-2`}>{icon}</div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-800">
        {value} <span className="text-xs font-normal text-gray-400">{unit}</span>
      </p>
    </div>
  );
}
