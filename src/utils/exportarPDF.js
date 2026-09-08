import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { generarGraficaTendencia, generarGraficaPromedios } from './generarGraficas';
import { dibujarTablaBGLog } from './tablaBGLog';

export async function exportarReportePDF({
  registros,
  estadisticas,
  rangos7,
  rangos15,
  rangos30,
  nombrePaciente = 'Paciente',
  incluirTabla = false,
  incluirComentarios = false,
}) {
  const doc = new jsPDF();
  const anchoPagina = doc.internal.pageSize.getWidth();
  const fechaReporte = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });

  // ===== ENCABEZADO =====
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, anchoPagina, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('SugarTrack', 14, 12);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text('Reporte de Control de Glicemias', 14, 20);

  doc.setFontSize(9);
  doc.text(`Paciente: ${nombrePaciente}`, anchoPagina - 14, 12, { align: 'right' });
  doc.text(fechaReporte, anchoPagina - 14, 18, { align: 'right' });

  // ===== RESUMEN ESTADÍSTICO =====
  let y = 36;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text('Resumen General', 14, y);

  y += 7;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(60, 60, 60);

  // Tarjetas de resumen en fila
  const tarjetas = [
    { label: 'Promedio', valor: `${estadisticas.promedio}`, unidad: 'mg/dL' },
    { label: 'Máximo', valor: `${estadisticas.maximo}`, unidad: 'mg/dL' },
    { label: 'Mínimo', valor: `${estadisticas.minimo}`, unidad: 'mg/dL' },
    { label: 'Mediciones', valor: `${estadisticas.total}`, unidad: 'total' },
    { label: 'En rango', valor: `${estadisticas.porcentajeEnRango}%`, unidad: '(70-180)' },
  ];

  const anchoTarjeta = (anchoPagina - 28 - 4 * 4) / 5;
  tarjetas.forEach((t, i) => {
    const x = 14 + i * (anchoTarjeta + 4);
    doc.setFillColor(245, 247, 255);
    doc.roundedRect(x, y, anchoTarjeta, 20, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(t.label, x + anchoTarjeta / 2, y + 6, { align: 'center' });
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(t.valor, x + anchoTarjeta / 2, y + 13, { align: 'center' });
    doc.setFontSize(6);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(t.unidad, x + anchoTarjeta / 2, y + 17, { align: 'center' });
  });

  // ===== CUADRO RESUMEN POR RANGOS Y PERIODOS =====
  y += 30;
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Distribución por Rangos', 14, y);

  y += 5;
  const filas = [
    { periodo: 'Últimos 7 días', datos: rangos7 },
    { periodo: 'Últimos 15 días', datos: rangos15 },
    { periodo: 'Último mes', datos: rangos30 },
  ];

  // Dibujar tabla manualmente
  const tablaX = 14;
  const tablaW = anchoPagina - 28;
  const colPeriodo = 42;
  const colRango = (tablaW - colPeriodo) / 3;
  const rowH = 12;
  const headerH = 14;

  // Encabezado de la tabla
  doc.setFillColor(99, 102, 241);
  doc.rect(tablaX, y, tablaW, headerH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('Periodo', tablaX + 3, y + 9);

  const encabezadosRango = [
    { txt1: 'Bajo', txt2: '(<70)', color: [239, 68, 68] },
    { txt1: 'Normal', txt2: '(70-180)', color: [16, 185, 129] },
    { txt1: 'Alto', txt2: '(>180)', color: [245, 158, 11] },
  ];
  encabezadosRango.forEach((e, i) => {
    const cx = tablaX + colPeriodo + i * colRango + colRango / 2;
    doc.text(e.txt1, cx, y + 6, { align: 'center' });
    doc.setFontSize(7);
    doc.text(e.txt2, cx, y + 11, { align: 'center' });
    doc.setFontSize(9);
  });

  // Filas de datos
  y += headerH;
  filas.forEach((fila, idx) => {
    const bgColor = idx % 2 === 0 ? [255, 255, 255] : [245, 247, 255];
    doc.setFillColor(...bgColor);
    doc.rect(tablaX, y, tablaW, rowH, 'F');

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(fila.periodo, tablaX + 3, y + 8);

    const celdas = [
      { d: fila.datos.bajo, color: [239, 68, 68] },
      { d: fila.datos.normal, color: [16, 185, 129] },
      { d: fila.datos.alto, color: [245, 158, 11] },
    ];
    celdas.forEach((celda, i) => {
      const cx = tablaX + colPeriodo + i * colRango + colRango / 2;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...celda.color);
      doc.text(`${celda.d.cantidad}`, cx - 8, y + 8, { align: 'center' });
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`${celda.d.porcentaje}%`, cx + 8, y + 8, { align: 'center' });
    });
    y += rowH;
  });

  // Nota del total
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont(undefined, 'italic');
  doc.text(
    `Cantidad de mediciones y porcentaje respecto al total del periodo. Total último mes: ${rangos30.total} mediciones.`,
    tablaX,
    y + 5
  );

  // ===== GRÁFICAS =====
  y += 12;
  const [imgTendencia, imgPromedios] = await Promise.all([
    generarGraficaTendencia(registros),
    generarGraficaPromedios(registros),
  ]);

  const anchoGrafica = anchoPagina - 28;

  if (imgTendencia) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Tendencia de Glicemia', 14, y);
    y += 3;
    const altoImg = anchoGrafica * (280 / 800);
    doc.addImage(imgTendencia, 'PNG', 14, y, anchoGrafica, altoImg);
    y += altoImg + 6;
  }

  if (imgPromedios) {
    // Verificar si cabe en la página, si no, nueva página
    if (y + 55 > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Promedios Diarios', 14, y);
    y += 3;
    const altoImg = anchoGrafica * (240 / 800);
    doc.addImage(imgPromedios, 'PNG', 14, y, anchoGrafica, altoImg);
    y += altoImg;
  }

  // ===== TABLA BG LOG (opcional) =====
  if (incluirTabla) {
    doc.addPage();
    dibujarTablaBGLog(doc, registros, incluirComentarios, 20);
  }

  // ===== PIE DE PÁGINA =====
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont(undefined, 'normal');
    doc.text(
      `SugarTrack - Generado el ${fechaReporte}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
    doc.text(
      `Página ${i} de ${totalPaginas}`,
      anchoPagina - 14,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' }
    );
  }

  doc.save(`reporte-glicemias-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
