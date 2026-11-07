import { supabase } from './supabase';

const TAMANO_PAGINA = 1000;

// Descarga TODAS las filas del usuario paginando (Supabase corta en 1000 por consulta).
async function traerTodo(tabla, userId, ordenar) {
  const filas = [];
  let desde = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let q = supabase
      .from(tabla)
      .select('*')
      .eq('user_id', userId)
      .range(desde, desde + TAMANO_PAGINA - 1);
    ordenar.forEach((col) => {
      q = q.order(col, { ascending: true });
    });
    const { data, error } = await q;
    if (error) throw error;
    filas.push(...data);
    if (data.length < TAMANO_PAGINA) break;
    desde += TAMANO_PAGINA;
  }
  return filas;
}

function descargar(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const hoy = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const celdaCSV = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return /[;"\n\r]/.test(s) ? `"${s}"` : s;
};

// JSON completo: todas las columnas tal cual están en la base (sirve para restaurar).
export async function respaldoJSON(usuario) {
  const registros = await traerTodo('registros', usuario.id, ['fecha', 'hora']);
  let recordatorios = [];
  try {
    recordatorios = await traerTodo('recordatorios', usuario.id, []);
  } catch {
    // la tabla puede no existir todavía; el respaldo de registros sigue siendo válido
  }
  const contenido = JSON.stringify(
    {
      app: 'SugarTrack',
      version: 1,
      exportado: new Date().toISOString(),
      usuario: usuario.email,
      total_registros: registros.length,
      registros,
      recordatorios,
    },
    null,
    2
  );
  descargar(`sugartrack-respaldo-${hoy()}.json`, contenido, 'application/json');
  return registros.length;
}

// CSV para Excel (separador ; y BOM UTF-8 para que se vean bien las tildes).
export async function respaldoCSV(usuario) {
  const registros = await traerTodo('registros', usuario.id, ['fecha', 'hora']);
  const cols = ['fecha', 'hora', 'valor', 'momento', 'insulina', 'dosis_insulina', 'notas', 'creado_en', 'id'];
  const lineas = [cols.join(';')];
  registros.forEach((r) => lineas.push(cols.map((c) => celdaCSV(r[c])).join(';')));
  descargar(`sugartrack-registros-${hoy()}.csv`, '\uFEFF' + lineas.join('\r\n'), 'text/csv;charset=utf-8');
  return registros.length;
}
