import { useState, useEffect } from 'react';

const STORAGE_KEY = 'glicemia-registros';

export function useGlicemias() {
  const [registros, setRegistros] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  }, [registros]);

  const agregarRegistro = (registro) => {
    const nuevoRegistro = {
      ...registro,
      id: crypto.randomUUID(),
      creadoEn: new Date().toISOString(),
    };
    setRegistros((prev) => [nuevoRegistro, ...prev]);
    return nuevoRegistro;
  };

  const eliminarRegistro = (id) => {
    setRegistros((prev) => prev.filter((r) => r.id !== id));
  };

  const editarRegistro = (id, datosActualizados) => {
    setRegistros((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...datosActualizados } : r))
    );
  };

  const obtenerEstadisticas = (dias = 30) => {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    const registrosFiltrados = registros.filter(
      (r) => new Date(r.fecha) >= fechaLimite
    );

    if (registrosFiltrados.length === 0) {
      return {
        promedio: 0,
        maximo: 0,
        minimo: 0,
        total: 0,
        enRango: 0,
        porcentajeEnRango: 0,
        hiperglicemias: 0,
        hipoglicemias: 0,
      };
    }

    const valores = registrosFiltrados.map((r) => Number(r.valor));
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    const maximo = Math.max(...valores);
    const minimo = Math.min(...valores);
    const enRango = valores.filter((v) => v >= 70 && v <= 180).length;
    const hiperglicemias = valores.filter((v) => v > 180).length;
    const hipoglicemias = valores.filter((v) => v < 70).length;

    return {
      promedio: Math.round(promedio),
      maximo,
      minimo,
      total: registrosFiltrados.length,
      enRango,
      porcentajeEnRango: Math.round((enRango / valores.length) * 100),
      hiperglicemias,
      hipoglicemias,
    };
  };

  const obtenerDatosGrafica = (dias = 30) => {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    return registros
      .filter((r) => new Date(r.fecha) >= fechaLimite)
      .sort((a, b) => new Date(a.fecha + 'T' + a.hora) - new Date(b.fecha + 'T' + b.hora));
  };

  return {
    registros,
    agregarRegistro,
    eliminarRegistro,
    editarRegistro,
    obtenerEstadisticas,
    obtenerDatosGrafica,
  };
}
