import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseFechaLocal } from './constants';

// Franjas horarias (columnas), cada una cubre 3 horas
const FRANJAS = [
  { label: '12 am', inicio: 0 },
  { label: '3 am', inicio: 3 },
  { label: '6 am', inicio: 6 },
  { label: '9 am', inicio: 9 },
  { label: '12 pm', inicio: 12 },
  { label: '3 pm', inicio: 15 },
  { label: '6 pm', inicio: 18 },
  { label: '9 pm', inicio: 21 },
];

function colorPorValor(v) {
  if (v < 70) return [239, 68, 68]; // rojo
  if (v <= 180) return [16, 185, 129]; // verde
  return [245, 158, 11]; // amarillo
}

// Determina la franja (0-7) según la hora "HH:mm"
function franjaDeHora(hora) {
  const h = Number(hora.split(':')[0]);
  return Math.min(7, Math.floor(h / 3));
}

// Dibuja la tabla estilo BG Log. Devuelve la posición Y final.
// incluirComentarios: si true, agrega las notas de cada día debajo de la fila.
export function dibujarTablaBGLog(doc, registros, incluirComentarios, startY) {
  const anchoPagina = doc.internal.pageSize.getWidth();
  const altoPagina = doc.internal.pageSize.getHeight();
  const margen = 14;
  const tablaW = anchoPagina - margen * 2;
  const colDia = 34;
  const colFranja = (tablaW - colDia) / 8;

  // Solo registros con valor de glicemia
  const conValor = registros.filter((r) => r.valor != null && r.valor !== '');
  if (conValor.length === 0) return startY;

  // Agrupar por fecha
  const porDia = {};
  conValor.forEach((r) => {
    if (!porDia[r.fecha]) porDia[r.fecha] = [];
    porDia[r.fecha].push(r);
  });

  // Ordenar días de más reciente a más antiguo
  const dias = Object.keys(porDia).sort().reverse();

  let y = startY;

  // Título de la sección
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Registro Detallado (BG Log)', margen, y);
  y += 5;

  const rowH = incluirComentarios ? 14 : 11;
  const headerH = 8;

  const dibujarEncabezado = () => {
    doc.setFillColor(230, 233, 250);
    doc.rect(margen, y, tablaW, headerH, 'F');
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(60, 60, 60);
    FRANJAS.forEach((f, i) => {
      const x = margen + colDia + i * colFranja;
      doc.text(f.label, x + 2, y + 5.5);
    });
    y += headerH;
  };

  dibujarEncabezado();

  doc.setFontSize(7);

  dias.forEach((dia, idx) => {
    // Salto de página si no cabe
    if (y + rowH > altoPagina - 20) {
      doc.addPage();
      y = 20;
      dibujarEncabezado();
      doc.setFontSize(7);
    }

    // Fondo alternado
    if (idx % 2 === 1) {
      doc.setFillColor(248, 249, 252);
      doc.rect(margen, y, tablaW, rowH, 'F');
    }

    // Líneas de la cuadrícula (verticales)
    doc.setDrawColor(225, 228, 235);
    doc.setLineWidth(0.1);
    for (let i = 0; i <= 8; i++) {
      const x = margen + colDia + i * colFranja;
      doc.line(x, y, x, y + rowH);
    }
    // Línea horizontal inferior
    doc.line(margen, y + rowH, margen + tablaW, y + rowH);

    // Etiqueta del día
    doc.setFont(undefined, 'bold');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(7.5);
    const fechaLabel = format(parseFechaLocal(dia), "EEE, d MMM", { locale: es });
    doc.text(fechaLabel, margen + 2, y + rowH / 2 + 1);

    // Valores en cada franja
    const registrosDia = porDia[dia];
    // Puede haber varios valores en la misma franja; los apilamos horizontalmente
    const porFranja = {};
    registrosDia.forEach((r) => {
      const f = franjaDeHora(r.hora);
      if (!porFranja[f]) porFranja[f] = [];
      porFranja[f].push(r);
    });

    Object.entries(porFranja).forEach(([franjaIdx, regs]) => {
      const fx = margen + colDia + Number(franjaIdx) * colFranja;
      regs.forEach((r, j) => {
        const v = Number(r.valor);
        const color = colorPorValor(v);
        // Punto de color
        const puntoX = fx + 3 + j * 12;
        const puntoY = y + rowH / 2;
        if (puntoX < fx + colFranja - 4) {
          doc.setFillColor(...color);
          doc.circle(puntoX, puntoY - 2, 1.1, 'F');
          // Valor
          doc.setFont(undefined, 'normal');
          doc.setTextColor(...color);
          doc.setFontSize(7);
          doc.text(`${v}`, puntoX + 2, puntoY - 0.5);
        }
      });
    });

    // Comentarios del día (notas)
    if (incluirComentarios) {
      const notas = registrosDia
        .filter((r) => r.notas && r.notas.trim())
        .map((r) => `${r.hora}: ${r.notas}`)
        .join('  •  ');
      if (notas) {
        doc.setFont(undefined, 'italic');
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(6);
        const notasCortadas = notas.length > 160 ? notas.slice(0, 157) + '...' : notas;
        doc.text(notasCortadas, margen + colDia + 2, y + rowH - 2.5);
      }
    }

    y += rowH;
  });

  // Cuadro resumen final (como Tidepool)
  y += 6;
  if (y + 20 > altoPagina - 20) {
    doc.addPage();
    y = 20;
  }

  const totalLecturas = conValor.length;
  const diasReporte = dias.length;
  const promDia = diasReporte > 0 ? Math.round(totalLecturas / diasReporte) : 0;
  const promBG = totalLecturas > 0
    ? Math.round(conValor.reduce((a, r) => a + Number(r.valor), 0) / totalLecturas)
    : 0;

  const resumen = [
    { label: 'Días en reporte', valor: diasReporte },
    { label: 'Total de lecturas', valor: totalLecturas },
    { label: 'Prom. lecturas/día', valor: promDia },
    { label: 'Prom. glicemia (mg/dL)', valor: promBG },
  ];

  const colResumen = tablaW / 4;
  // Encabezado
  doc.setFillColor(230, 233, 250);
  doc.rect(margen, y, tablaW, 8, 'F');
  doc.setFont(undefined, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  resumen.forEach((r, i) => {
    doc.text(r.label, margen + i * colResumen + colResumen / 2, y + 5.5, { align: 'center' });
  });
  y += 8;
  // Valores
  doc.setDrawColor(225, 228, 235);
  doc.rect(margen, y, tablaW, 9);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229);
  resumen.forEach((r, i) => {
    doc.text(`${r.valor}`, margen + i * colResumen + colResumen / 2, y + 6, { align: 'center' });
  });
  y += 9;

  return y;
}
