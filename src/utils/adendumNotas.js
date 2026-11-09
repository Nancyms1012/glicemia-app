import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseFechaLocal, MOMENTOS, INSULINAS } from './constants';

const PATRON_DOSIS = /\s*\|?\s*Lispro:\s*([\d.,]+)\s*U,\s*Lantus:\s*([\d.,]+)\s*U\s*$/i;

// jsPDF (fuentes estándar) no dibuja emojis ni símbolos fuera de Latin-1: se eliminan para no ensuciar el PDF.
const limpiarTexto = (t) =>
  (t || '')
    .replace(/[^\u0020-\u007E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\n]/gu, '')
    .replace(/[ \t]+/g, ' ')
    .trim();

// Separa la nota "real" de la dosis que la app agrega automáticamente cuando la insulina es "Ambas".
function separarNota(r) {
  let nota = r.notas || '';
  let dosisAmbas = null;
  const m = nota.match(PATRON_DOSIS);
  if (m) {
    dosisAmbas = `Lispro ${m[1]} U + Lantus ${m[2]} U`;
    nota = nota.replace(PATRON_DOSIS, '');
  }
  return { nota: limpiarTexto(nota), dosisAmbas };
}

function textoInsulina(r, dosisAmbas) {
  if (!r.insulina || r.insulina === 'ninguna') return '';
  if (r.insulina === 'ambas') return dosisAmbas || 'Ambas';
  const etiqueta = (INSULINAS.find((i) => i.value === r.insulina)?.label || r.insulina).replace(/\s*\(.*\)/, '');
  return r.dosisInsulina ? `${etiqueta} ${r.dosisInsulina} U` : etiqueta;
}

// Cuenta cuántos registros tienen una nota real (sin contar la dosis automática de "Ambas").
export function contarNotas(registros) {
  return registros.filter((r) => separarNota(r).nota).length;
}

// Agrega al PDF una sección "Adendum" con TODAS las notas completas, en orden cronológico.
export function dibujarAdendumNotas(doc, registros, periodoTexto = '') {
  const conNota = registros
    .map((r) => ({ r, ...separarNota(r) }))
    .filter((x) => x.nota)
    .sort((a, b) => (a.r.fecha + a.r.hora).localeCompare(b.r.fecha + b.r.hora));

  if (conNota.length === 0) return false;

  const anchoPagina = doc.internal.pageSize.getWidth();
  doc.addPage();

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Adendum: Notas y comentarios', 14, 20);

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(
    `${conNota.length} ${conNota.length === 1 ? 'nota' : 'notas'}${periodoTexto ? ' · ' + periodoTexto : ''} · orden cronológico`,
    14,
    26
  );

  const momentoLabel = (v) => MOMENTOS.find((m) => m.value === v)?.label || v || '';

  const filas = conNota.map(({ r, nota, dosisAmbas }) => [
    format(parseFechaLocal(r.fecha), 'dd/MM/yyyy', { locale: es }),
    (r.hora || '').slice(0, 5),
    r.valor != null && r.valor !== '' ? String(r.valor) : '—',
    momentoLabel(r.momento),
    textoInsulina(r, dosisAmbas),
    nota,
  ]);

  autoTable(doc, {
    startY: 31,
    margin: { left: 14, right: 14, bottom: 16 },
    head: [['Fecha', 'Hora', 'mg/dL', 'Momento', 'Insulina', 'Nota']],
    body: filas,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2, valign: 'top', overflow: 'linebreak' },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 12 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 30 },
      4: { cellWidth: 28 },
      5: { cellWidth: anchoPagina - 28 - 104 },
    },
    // Colorear el valor de glicemia según el rango
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const v = Number(data.cell.raw);
        if (!Number.isNaN(v)) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = v < 70 ? [239, 68, 68] : v <= 180 ? [16, 185, 129] : [217, 119, 6];
        }
      }
    },
    rowPageBreak: 'avoid',
  });

  return true;
}
