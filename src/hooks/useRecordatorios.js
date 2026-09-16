import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

// Horarios por defecto (mínimo 4)
const HORARIOS_DEFAULT = [
  { hora: '07:00', etiqueta: 'Desayuno' },
  { hora: '12:00', etiqueta: 'Almuerzo' },
  { hora: '19:00', etiqueta: 'Cena' },
  { hora: '22:00', etiqueta: 'Lantus (noche)' },
];

export function useRecordatorios(userId) {
  const [horarios, setHorarios] = useState([]);
  const [activados, setActivados] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Cargar configuración desde Supabase
  const cargar = useCallback(async () => {
    if (!userId) return;
    setCargando(true);
    const { data, error } = await supabase
      .from('recordatorios')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      setHorarios(data.horarios || HORARIOS_DEFAULT);
      setActivados(data.activados ?? false);
    } else {
      // No hay configuración aún, usar defaults
      setHorarios(HORARIOS_DEFAULT);
      setActivados(false);
    }
    setCargando(false);
  }, [userId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardar = async (nuevosHorarios, nuevoActivados) => {
    const payload = {
      user_id: userId,
      horarios: nuevosHorarios,
      activados: nuevoActivados,
      actualizado_en: new Date().toISOString(),
    };

    // upsert: inserta o actualiza según user_id
    const { error } = await supabase
      .from('recordatorios')
      .upsert(payload, { onConflict: 'user_id' });

    if (!error) {
      setHorarios(nuevosHorarios);
      setActivados(nuevoActivados);
      return true;
    }
    return false;
  };

  return {
    horarios,
    activados,
    cargando,
    guardar,
  };
}

export { HORARIOS_DEFAULT };
