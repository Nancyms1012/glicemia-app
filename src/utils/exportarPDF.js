import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function exportarReportePDF(registros, estadisticas, nombrePaciente = 'Paciente') {
  const doc = new jsPDF();
  const fechaReporte = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });

  // Encabezado
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241);
  doc.text('Reporte de Glicemias - SugarTrack', 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Paciente: ${nombrePaciente}`, 14, 32);
  doc.text(`Fecha del reporte: ${fechaReporte}`, 14, 40);

  // Estadísticas generales
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text('Resumen Estadístico', 14, 55);

  doc.setFontSize(11);
  doc.setTextColor(60);
  const statsY = 63;
  doc.text(`Promedio: ${estadisticas.promedio} mg/dL`, 14, statsY);
  doc.text(`Valor máximo: ${estadisticas.maximo} mg/dL`, 14, statsY + 7);
  doc.text(`Valor mínimo: ${estadisticas.minimo} mg/dL`, 14, statsY + 14);
  doc.text(`Total de mediciones: ${estadisticas.total}`, 14, statsY + 21);
  doc.text(`Tiempo en rango (70-180): ${estadisticas.porcentajeEnRango}%`, 14, statsY + 28);
  doc.text(`Hiperglicemias (>180): ${estadisticas.hiperglicemias}`, 110, statsY);
  doc.text(`Hipoglicemias (<70): ${estadisticas.hipoglicemias}`, 110, statsY + 7);

  // Resumen de insulina
  const registrosConInsulina = registros.filter((r) => r.insulina && r.insulina !== 'ninguna');
  const lispro = registrosConInsulina.filter((r) => r.insulina === 'lispro');
  const lantus = registrosConInsulina.filter((r) => r.insulina === 'lantus');

  doc.text(`Insulina Lispro: ${lispro.length} aplicaciones`, 110, statsY + 14);
  doc.text(`Insulina Lantus: ${lantus.length} aplicaciones`, 110, statsY + 21);

  if (lispro.length > 0) {
    const dosisLispro = lispro.filter((r) => r.dosisInsulina).map((r) => Number(r.dosisInsulina));
    if (dosisLispro.length > 0) {
      const promLispro = (dosisLispro.reduce((a, b) => a + b, 0) / dosisLispro.length).toFixed(1);
      doc.text(`  Dosis promedio Lispro: ${promLispro} U`, 110, statsY + 28);
    }
  }

  // Tabla de registros
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text('Detalle de Mediciones', 14, statsY + 42);

  const datosTabla = registros
    .sort((a, b) => new Date(b.fecha + 'T' + b.hora) - new Date(a.fecha + 'T' + a.hora))
    .slice(0, 100)
    .map((r) => [
      format(new Date(r.fecha), 'dd/MM/yyyy'),
      r.hora,
      r.momento || '-',
      `${r.valor} mg/dL`,
      r.insulina && r.insulina !== 'ninguna'
        ? `${r.insulina === 'lispro' ? 'Lispro' : 'Lantus'}${r.dosisInsulina ? ' ' + r.dosisInsulina + 'U' : ''}`
        : '-',
      r.notas || '-',
    ]);

  autoTable(doc, {
    startY: statsY + 48,
    head: [['Fecha', 'Hora', 'Momento', 'Valor', 'Insulina', 'Notas']],
    body: datosTabla,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 16 },
      2: { cellWidth: 28 },
      3: { cellWidth: 22 },
      4: { cellWidth: 24 },
      5: { cellWidth: 'auto' },
    },
  });

  // Pie de página
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${totalPaginas} - Generado por SugarTrack`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`reporte-glicemias-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
