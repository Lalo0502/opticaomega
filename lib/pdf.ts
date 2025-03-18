import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Receta, Patient } from '@/types/pacientes';

export const generatePrescriptionPDF = async (receta: Receta, patient: Patient) => {
  // Crear documento en A5 landscape
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });

  // Definir estilos adaptados para A5
  const styles = {
    title: { fontSize: 16, fontStyle: 'bold' },
    subtitle: { fontSize: 12, fontStyle: 'bold' },
    sectionTitle: { fontSize: 10, fontStyle: 'bold' },
    normal: { fontSize: 9, fontStyle: 'normal' },
    small: { fontSize: 7, fontStyle: 'normal' }
  };

  const applyStyle = (style: keyof typeof styles) => {
    doc.setFontSize(styles[style].fontSize);
    doc.setFont('helvetica', styles[style].fontStyle);
  };

  // Dimensiones de la página
  const pageWidth = doc.internal.pageSize.width; // ~210mm para A5 landscape
  const pageHeight = doc.internal.pageSize.height; // ~148mm para A5 landscape

  // Márgenes
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  // Encabezado
  applyStyle('title');
  doc.text('ÓPTICA OMEGA', margin + 25, margin + 5);
  applyStyle('normal');
  doc.text('Especialistas en salud visual', margin + 25, margin + 10);
  doc.text('Sonora #2515, Nuevo Laredo, Tamps.  |  Tel: (867) 712-2210', margin + 25, margin + 15);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, margin + 20, pageWidth - margin, margin + 20);

  // Información del paciente
  applyStyle('subtitle');
  doc.text('Información del Paciente', margin, margin + 28);
  applyStyle('normal');
  
  // Datos del paciente con formato de líneas
  const nombreCompleto = `${patient.primer_nombre} ${patient.primer_apellido} ${patient.segundo_apellido || ''}`.trim();
  doc.text(`Nombre: ${nombreCompleto}`, margin, margin + 35);
  doc.text(`Fecha de Nacimiento: ${patient.fecha_nacimiento ? format(new Date(patient.fecha_nacimiento), 'dd/MM/yyyy') : '___________'}`, margin, margin + 40);
  doc.text(`Teléfono: ${patient.telefono}`, margin + 110, margin + 40);
  doc.text(`Dirección: ${patient.direccion || '_______________________________________________'}`, margin, margin + 45);

  // Línea divisoria
  doc.setDrawColor(100, 100, 100);
  doc.line(margin, margin + 50, pageWidth - margin, margin + 50);

  // Prescripción
  applyStyle('subtitle');
  doc.text('Prescripción Óptica', margin, margin + 58);
  
  // Tabla de prescripción
  const startY = margin + 65;
  const colWidth = 25; // Reducir el ancho de las columnas para A5
  const rowHeight = 6; // Reducir el alto de las filas para A5
  
  // Definir columnas y preparar datos
  const columns = ['Ojo', 'Esfera', 'Cilindro', 'Eje', 'ADD', 'DNP', 'Altura'];
  
  // Asumiendo que un detalle podría ser así
  interface DetalleReceta {
    ojo: string;
    esfera?: number | string;
    cilindro?: number | string;
    eje?: number | string;
    adicion?: number | string;
    distancia_pupilar?: number | string;
    altura?: number | string;
  }
  
  // Usar una aserción de tipo para solucionar el problema
  const ojoDerecho = (receta.detalles?.find(d => d.ojo === 'derecho') || {}) as DetalleReceta;
  const ojoIzquierdo = (receta.detalles?.find(d => d.ojo === 'izquierdo') || {}) as DetalleReceta;
  
  const rows = [
    ['OD', 
      String(ojoDerecho.esfera || '-'), 
      String(ojoDerecho.cilindro || '-'), 
      String(ojoDerecho.eje || '-'), 
      String(ojoDerecho.adicion || '-'), 
      String(ojoDerecho.distancia_pupilar || '-'), 
      String(ojoDerecho.altura || '-')
    ],
    ['OI', 
      String(ojoIzquierdo.esfera || '-'), 
      String(ojoIzquierdo.cilindro || '-'), 
      String(ojoIzquierdo.eje || '-'), 
      String(ojoIzquierdo.adicion || '-'), 
      String(ojoIzquierdo.distancia_pupilar || '-'), 
      String(ojoIzquierdo.altura || '-')
    ]
  ];

  // Dibujar encabezado de la tabla
  applyStyle('sectionTitle');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, startY - 4, 7 * colWidth, rowHeight, 'F');
  columns.forEach((col, index) => {
    doc.text(col, margin + (index * colWidth) + 2, startY);
  });

  // Dibujar filas de la tabla
  applyStyle('normal');
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, cellIndex) => {
      doc.text(`${cell}`, margin + (cellIndex * colWidth) + 2, startY + ((rowIndex + 1) * rowHeight));
    });
  });

  // Línea divisoria
  doc.setDrawColor(100, 100, 100);
  doc.line(margin, startY + 18, pageWidth - margin, startY + 18);

  // Notas y recomendaciones
  applyStyle('subtitle');
  doc.text('Notas', margin, startY + 26);
  applyStyle('normal');
  doc.text(receta.notas || 'Ninguna', margin, startY + 32, { maxWidth: contentWidth });

  // Firma
  doc.setDrawColor(50, 50, 50);
  doc.line(pageWidth - 70, startY + 55, pageWidth - margin, startY + 55);
  applyStyle('small');
  doc.text('Firma del Doctor', pageWidth - 45, startY + 60);

  // Pie de página
  doc.text('Óptica Omega - Todos los derechos reservados', pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.text(format(new Date(), "'Generado el' dd 'de' MMMM 'de' yyyy", { locale: es }), pageWidth / 2, pageHeight - 5, { align: 'center' });

  // Generar nombre del archivo y guardar
  const fileName = `receta_${format(new Date(receta.fecha_emision), 'dd-MM-yyyy')}_${patient.primer_apellido}.pdf`;
  doc.save(fileName);
};