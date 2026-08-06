import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export function useGlicemias(userId) {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Cargar registros desde Supabase
  const cargarRegistros = useCallback(async () => {
    if (!userId) return;
    setCargando(true);
    const { data, error } = await supabase
      .from('registros')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });

    if (!error && data) {
      // Mapear campos de la DB al formato de la app
      setRegistros(
        data.map((r) => ({
          id: r.id,
          fecha: r.fecha,
          hora: r.hora,
          valor: r.valor,
          momento: r.momento,
          insulina: r.insulina,
          dosisInsulina: r.dosis_insulina,
          notas: r.notas,
          creadoEn: r.creado_en,
        }))
      );
    }
    setCargando(false);
  }, [userId]);

  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros]);

  const agregarRegistro = async (registro) => {
    // Para "ambas", combinar las dosis en el campo dosisInsulina como texto
    let dosisFinal = null;
    if (registro.insulina === 'ambas') {
      const lispro = registro.dosisLispro || 0;
      const lantus = registro.dosisLantus || 0;
      dosisFinal = null; // usaremos notas internas
    } else {
      dosisFinal = registro.dosisInsulina ? Number(registro.dosisInsulina) : null;
    }

    const nuevoRegistro = {
      user_id: userId,
      fecha: registro.fecha,
      hora: registro.hora,
      valor: Number(registro.valor),
      momento: registro.momento || null,
      insulina: registro.insulina || null,
      dosis_insulina: registro.insulina === 'ambas'
        ? Number(registro.dosisLispro || 0) + Number(registro.dosisLantus || 0)
        : (registro.dosisInsulina ? Number(registro.dosisInsulina) : null),
      notas: registro.insulina === 'ambas'
        ? `${registro.notas ? registro.notas + ' | ' : ''}Lispro: ${registro.dosisLispro || 0}U, Lantus: ${registro.dosisLantus || 0}U`
        : (registro.notas || null),
    };

    const { data, error } = await supabase
      .from('registros')
      .insert([nuevoRegistro])
      .select()
      .single();

    if (!error && data) {
      const registroApp = {
        id: data.id,
        fecha: data.fecha,
        hora: data.hora,
        valor: data.valor,
        momento: data.momento,
        insulina: data.insulina,
        dosisInsulina: data.dosis_insulina,
        notas: data.notas,
        creadoEn: data.creado_en,
      };
      setRegistros((prev) => [registroApp, ...prev]);
      return registroApp;
    }
    return null;
  };

  const eliminarRegistro = async (id) => {
    const { error } = await supabase
      .from('registros')
      .delete()
      .eq('id', id);

    if (!error) {
      setRegistros((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const editarRegistro = async (id, datosActualizados) => {
    const updateData = {
      fecha: datosActualizados.fecha,
      hora: datosActualizados.hora,
      valor: Number(datosActualizados.valor),
      momento: datosActualizados.momento || null,
      insulina: datosActualizados.insulina || null,
      dosis_insulina: datosActualizados.dosisInsulina
        ? Number(datosActualizados.dosisInsulina)
        : null,
      notas: datosActualizados.notas || null,
    };

    const { error } = await supabase
      .from('registros')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      setRegistros((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, ...datosActualizados, valor: Number(datosActualizados.valor) } : r
        )
      );
      return true;
    }
    return false;
  };

  const borrarTodos = async () => {
    const { error } = await supabase
      .from('registros')
      .delete()
      .eq('user_id', userId);

    if (!error) {
      setRegistros([]);
    }
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
      .sort(
        (a, b) =>
          new Date(a.fecha + 'T' + a.hora) - new Date(b.fecha + 'T' + b.hora)
      );
  };

  return {
    registros,
    cargando,
    agregarRegistro,
    eliminarRegistro,
    editarRegistro,
    borrarTodos,
    obtenerEstadisticas,
    obtenerDatosGrafica,
  };
}
