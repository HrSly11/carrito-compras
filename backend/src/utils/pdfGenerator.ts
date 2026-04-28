import PDFDocument from 'pdfkit';
import { logger } from './logger';
import config from '../config';

export interface OrdenReporte {
  id: string;
  numeroOrden: string;
  cliente: string;
  email: string;
  fecha: Date;
  estado: 'PENDIENTE' | 'PROCESANDO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  productos: ProductoOrdenReporte[];
  subtotal: number;
  igv: number;
  total: number;
  metodoPago: string;
  direccionEnvio: string;
}

export interface ProductoOrdenReporte {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface FiltrosOrdenes {
  estado?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  cliente?: string;
}

export interface StockProductoReporte {
  id: string;
  nombre: string;
  sku: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  precioVenta: number;
  precioCosto: number;
  valorizado: number;
}

export interface MovimientoInventarioReporte {
  id: string;
  fecha: Date;
  tipo: 'ENTRADA' | 'SALIDA';
  producto: string;
  sku: string;
  cantidad: number;
  motivo: string;
  referencia: string;
}

export interface PagoReporte {
  id: string;
  numeroPago: string;
  orden: string;
  numeroOrden: string;
  cliente: string;
  monto: number;
  metodoPago: string;
  fecha: Date;
  estado: 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO' | 'REEMBOLSADO';
}

export interface DevolucionReporte {
  id: string;
  numeroDevolucion: string;
  orden: string;
  numeroOrden: string;
  cliente: string;
  productos: string;
  motivo: string;
  monto: number;
  fecha: Date;
  estado: 'SOLICITADA' | 'APROBADA' | 'RECHAZADA' | 'REEMBOLSADA';
}

export class PDFReportGenerator {
  private empresa: string;
  private logoPath: string;

  constructor(empresa: string = 'Mi Empresa S.A.C.', logoPath?: string) {
    this.empresa = empresa;
    this.logoPath = logoPath || '';
  }

  generateHeader(doc: PDFKit.PDFDocument, title: string, empresa?: string): void {
    const pageWidth = doc.page.width;
    const margin = 50;

    doc.rect(0, 0, pageWidth, 80)
       .fill('#1a365d');

    doc.fillColor('#ffffff')
       .fontSize(18)
         .text(empresa || this.empresa, margin, 25, { lineBreak: false })
       .fontSize(10)
         .text(`Reporte: ${title}`, margin, 50)
       .text(`Fecha: ${new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}`, pageWidth - 200, 25);

    doc.fillColor('#000000')
       .moveDown(3);
  }

  private addPageNumbers(doc: PDFKit.PDFDocument): void {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(9)
         .fillColor('#666666')
         .text(
           `Página ${i + 1} de ${pages.count}`,
           50,
           doc.page.height - 40,
           { align: 'center', width: doc.page.width - 100 }
         );
    }
  }

  private addTableHeader(doc: PDFKit.PDFDocument, headers: string[], colWidths: number[]): void {
    const startX = 50;
    let y = doc.y;

    doc.rect(startX, y - 5, doc.page.width - 100, 25)
       .fill('#2d3748');

    doc.fillColor('#ffffff')
       .fontSize(10);

    let x = startX + 5;
    headers.forEach((header, i) => {
      doc.text(header, x, y, { width: colWidths[i] - 10 });
      x += colWidths[i];
    });

    doc.fillColor('#000000');
    doc.y = y + 25;
  }

  private formatMoneda(valor: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(valor);
  }

  private formatFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
  }

  generateOrdenesReport(ordenes: OrdenReporte[], filtros: FiltrosOrdenes): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    try {
      this.generateHeader(doc, 'Listado de Órdenes');

      if (filtros.estado || filtros.fechaDesde || filtros.fechaHasta || filtros.cliente) {
        doc.fontSize(10).fillColor('#4a5568');
        const filterText: string[] = [];
        if (filtros.estado) filterText.push(`Estado: ${filtros.estado}`);
        if (filtros.fechaDesde) filterText.push(`Desde: ${this.formatFecha(filtros.fechaDesde)}`);
        if (filtros.fechaHasta) filterText.push(`Hasta: ${this.formatFecha(filtros.fechaHasta)}`);
        if (filtros.cliente) filterText.push(`Cliente: ${filtros.cliente}`);
        doc.text(`Filtros aplicados: ${filterText.join(' | ')}`, 50, 100);
        doc.moveDown(2);
        doc.fillColor('#000000');
      }

      const colWidths = [70, 90, 70, 80, 80, 80];
      const headers = ['N° Orden', 'Cliente', 'Fecha', 'Estado', 'Subtotal', 'Total'];

      this.addTableHeader(doc, headers, colWidths);

      ordenes.forEach((orden) => {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          this.addTableHeader(doc, headers, colWidths);
        }

        const x = 55;
        let y = doc.y;

        doc.fontSize(9);
        doc.text(orden.numeroOrden, x, y, { width: 65 });
        doc.text(orden.cliente.substring(0, 15), x + 70, y, { width: 85 });
        doc.text(this.formatFecha(orden.fecha), x + 155, y, { width: 65 });
        doc.text(orden.estado, x + 220, y, { width: 75 });

        const estadoColor = this.getEstadoColor(orden.estado);
        doc.fillColor(estadoColor)
           .text(orden.estado, x + 220, y, { width: 75 })
           .fillColor('#000000');

        doc.text(this.formatMoneda(orden.subtotal), x + 295, y, { width: 75 });
        doc.text(this.formatMoneda(orden.total), x + 375, y, { width: 75 });

        doc.y = y + 20;
      });

      doc.moveDown(2);
      const totalGeneral = ordenes.reduce((sum, o) => sum + o.total, 0);
      doc.fontSize(11)
         .fillColor('#1a365d')
         .text(`Total general: ${this.formatMoneda(totalGeneral)}`, { align: 'right' });

      this.addPageNumbers(doc);
      logger.info(`Reporte de órdenes generado: ${ordenes.length} órdenes`);

    } catch (error) {
      logger.error('Error generando reporte de órdenes', { error });
      throw error;
    }

    return doc;
  }

  generateInventarioReport(stock: StockProductoReporte[], categoria: string): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    try {
      this.generateHeader(doc, `Inventario - ${categoria || 'Todas las categorías'}`);

      doc.moveDown(2);

      const colWidths = [120, 60, 70, 70, 80, 70];
      const headers = ['Producto', 'SKU', 'Stock', 'Stock Mín.', 'Precio Venta', 'Valorizado'];

      this.addTableHeader(doc, headers, colWidths);

      stock.forEach((item) => {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          this.addTableHeader(doc, headers, colWidths);
        }

        const x = 55;
        let y = doc.y;

        doc.fontSize(9);
        doc.text(item.nombre.substring(0, 20), x, y, { width: 115 });
        doc.text(item.sku, x + 120, y, { width: 60 });

        if (item.stockActual <= item.stockMinimo) {
          doc.fillColor('#e53e3e')
             .text(`${item.stockActual}`, x + 180, y, { width: 65 })
             .fillColor('#000000');
        } else {
          doc.text(`${item.stockActual}`, x + 180, y, { width: 65 });
        }

        doc.text(`${item.stockMinimo}`, x + 245, y, { width: 65 });
        doc.text(this.formatMoneda(item.precioVenta), x + 310, y, { width: 75 });
        doc.text(this.formatMoneda(item.valorizado), x + 385, y, { width: 65 });

        doc.y = y + 20;
      });

      doc.moveDown(2);
      const valorTotal = stock.reduce((sum, item) => sum + item.valorizado, 0);
      const stockTotal = stock.reduce((sum, item) => sum + item.stockActual, 0);

      doc.fontSize(11)
         .fillColor('#1a365d')
         .text(`Valor total del inventario: ${this.formatMoneda(valorTotal)}`, { align: 'right' })
         .text(`Total de unidades: ${stockTotal}`, { align: 'right' });

      this.addPageNumbers(doc);
      logger.info(`Reporte de inventario generado: ${stock.length} productos`);

    } catch (error) {
      logger.error('Error generando reporte de inventario', { error });
      throw error;
    }

    return doc;
  }

  generateMovimientosReport(
    movimientos: MovimientoInventarioReporte[],
    fechaDesde: Date,
    fechaHasta: Date
  ): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    try {
      this.generateHeader(doc, 'Movimientos de Inventario');

      doc.fontSize(10).fillColor('#4a5568');
      doc.text(`Período: ${this.formatFecha(fechaDesde)} - ${this.formatFecha(fechaHasta)}`, 50, 100);
      doc.moveDown(2);
      doc.fillColor('#000000');

      const colWidths = [70, 50, 110, 55, 55, 80];
      const headers = ['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Motivo', 'Referencia'];

      this.addTableHeader(doc, headers, colWidths);

      movimientos.forEach((mov) => {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          this.addTableHeader(doc, headers, colWidths);
        }

        const x = 55;
        let y = doc.y;

        doc.fontSize(9);
        doc.text(this.formatFecha(mov.fecha), x, y, { width: 65 });

        if (mov.tipo === 'ENTRADA') {
          doc.fillColor('#38a169')
             .text('ENTRADA', x + 70, y, { width: 45 })
             .fillColor('#000000');
        } else {
          doc.fillColor('#e53e3e')
             .text('SALIDA', x + 70, y, { width: 45 })
             .fillColor('#000000');
        }

        doc.text(mov.producto.substring(0, 18), x + 115, y, { width: 105 });
        doc.text(`${mov.cantidad}`, x + 220, y, { width: 50 });
        doc.text(mov.motivo.substring(0, 10), x + 270, y, { width: 50 });
        doc.text(mov.referencia.substring(0, 12), x + 320, y, { width: 75 });

        doc.y = y + 20;
      });

      doc.moveDown(2);

      const entradas = movimientos.filter(m => m.tipo === 'ENTRADA').reduce((sum, m) => sum + m.cantidad, 0);
      const salidas = movimientos.filter(m => m.tipo === 'SALIDA').reduce((sum, m) => sum + m.cantidad, 0);

      doc.fontSize(11)
         .fillColor('#1a365d')
         .text(`Total entradas: ${entradas} unidades`, { align: 'right' })
         .text(`Total salidas: ${salidas} unidades`, { align: 'right' })
         .text(`Neto: ${entradas - salidas} unidades`, { align: 'right' });

      this.addPageNumbers(doc);
      logger.info(`Reporte de movimientos generado: ${movimientos.length} movimientos`);

    } catch (error) {
      logger.error('Error generando reporte de movimientos', { error });
      throw error;
    }

    return doc;
  }

  generateStockBajoReport(productos: StockProductoReporte[]): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    try {
      this.generateHeader(doc, 'Productos con Stock Bajo o Agotado');

      doc.moveDown(2);

      const colWidths = [140, 60, 70, 80, 80];
      const headers = ['Producto', 'SKU', 'Stock Act.', 'Stock Mín.', 'Precio'];

      this.addTableHeader(doc, headers, colWidths);

      productos.forEach((item) => {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          this.addTableHeader(doc, headers, colWidths);
        }

        const x = 55;
        let y = doc.y;

        doc.fontSize(9);
        doc.text(item.nombre.substring(0, 25), x, y, { width: 135 });

        doc.fillColor('#e53e3e')
           .text(item.sku, x + 140, y, { width: 55 })
           .text(`${item.stockActual}`, x + 195, y, { width: 65 })
           .text(`${item.stockMinimo}`, x + 260, y, { width: 75 })
           .fillColor('#000000');

        doc.text(this.formatMoneda(item.precioVenta), x + 335, y, { width: 75 });

        doc.y = y + 20;
      });

      doc.moveDown(2);

      const agotados = productos.filter(p => p.stockActual === 0).length;
      const bajoStock = productos.filter(p => p.stockActual > 0 && p.stockActual <= p.stockMinimo).length;

      doc.fontSize(11)
         .fillColor('#e53e3e')
         .text(`Productos agotados: ${agotados}`, { align: 'right' })
         .text(`Productos con stock bajo: ${bajoStock}`, { align: 'right' });

      this.addPageNumbers(doc);
      logger.info(`Reporte de stock bajo generado: ${productos.length} productos`);

    } catch (error) {
      logger.error('Error generando reporte de stock bajo', { error });
      throw error;
    }

    return doc;
  }

  generatePagosReport(pagos: PagoReporte[], periodo: { desde: Date; hasta: Date }): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    try {
      this.generateHeader(doc, 'Detalle de Pagos Recibidos');

      doc.fontSize(10).fillColor('#4a5568');
      doc.text(`Período: ${this.formatFecha(periodo.desde)} - ${this.formatFecha(periodo.hasta)}`, 50, 100);
      doc.moveDown(2);
      doc.fillColor('#000000');

      const colWidths = [70, 80, 80, 65, 85, 70];
      const headers = ['N° Pago', 'Orden', 'Cliente', 'Monto', 'Método', 'Estado'];

      this.addTableHeader(doc, headers, colWidths);

      pagos.forEach((pago) => {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          this.addTableHeader(doc, headers, colWidths);
        }

        const x = 55;
        let y = doc.y;

        doc.fontSize(9);
        doc.text(pago.numeroPago, x, y, { width: 65 });
        doc.text(pago.numeroOrden, x + 70, y, { width: 75 });
        doc.text(pago.cliente.substring(0, 12), x + 145, y, { width: 75 });

        doc.fillColor('#38a169')
           .text(this.formatMoneda(pago.monto), x + 220, y, { width: 80 })
           .fillColor('#000000');

        doc.text(pago.metodoPago, x + 300, y, { width: 80 });

        const estadoColor = this.getPagoEstadoColor(pago.estado);
        doc.fillColor(estadoColor)
           .text(pago.estado, x + 380, y, { width: 65 })
           .fillColor('#000000');

        doc.y = y + 20;
      });

      doc.moveDown(2);
      const totalRecaudado = pagos
        .filter(p => p.estado === 'COMPLETADO')
        .reduce((sum, p) => sum + p.monto, 0);

      doc.fontSize(11)
         .fillColor('#1a365d')
         .text(`Total recaudado: ${this.formatMoneda(totalRecaudado)}`, { align: 'right' });

      this.addPageNumbers(doc);
      logger.info(`Reporte de pagos generado: ${pagos.length} pagos`);

    } catch (error) {
      logger.error('Error generando reporte de pagos', { error });
      throw error;
    }

    return doc;
  }

  generateDevolucionesReport(devoluciones: DevolucionReporte[]): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    try {
      this.generateHeader(doc, 'Listado de Devoluciones');

      doc.moveDown(2);

      const colWidths = [70, 70, 80, 80, 80, 50];
      const headers = ['N° Dev.', 'Orden', 'Cliente', 'Motivo', 'Monto', 'Estado'];

      this.addTableHeader(doc, headers, colWidths);

      devoluciones.forEach((dev) => {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          this.addTableHeader(doc, headers, colWidths);
        }

        const x = 55;
        let y = doc.y;

        doc.fontSize(9);
        doc.text(dev.numeroDevolucion, x, y, { width: 65 });
        doc.text(dev.numeroOrden, x + 70, y, { width: 65 });
        doc.text(dev.cliente.substring(0, 12), x + 135, y, { width: 75 });
        doc.text(dev.motivo.substring(0, 12), x + 210, y, { width: 75 });

        doc.fillColor('#e53e3e')
           .text(this.formatMoneda(dev.monto), x + 285, y, { width: 75 })
           .fillColor('#000000');

        const estadoColor = this.getDevolucionEstadoColor(dev.estado);
        doc.fillColor(estadoColor)
           .text(dev.estado, x + 360, y, { width: 75 })
           .fillColor('#000000');

        doc.y = y + 20;
      });

      doc.moveDown(2);
      const totalReembolsos = devoluciones
        .filter(d => d.estado === 'REEMBOLSADA')
        .reduce((sum, d) => sum + d.monto, 0);

      doc.fontSize(11)
         .fillColor('#1a365d')
         .text(`Total reembolsado: ${this.formatMoneda(totalReembolsos)}`, { align: 'right' });

      this.addPageNumbers(doc);
      logger.info(`Reporte de devoluciones generado: ${devoluciones.length} devoluciones`);

    } catch (error) {
      logger.error('Error generando reporte de devoluciones', { error });
      throw error;
    }

    return doc;
  }

  generateFactura(orden: OrdenReporte): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    try {
      const pageWidth = doc.page.width;

      doc.rect(0, 0, pageWidth, 120)
         .fill('#1a365d');

      doc.fillColor('#ffffff')
         .fontSize(22)
         .text('FACTURA', 50, 20, { align: 'center' })
         .fontSize(12)
         .text(`${orden.numeroOrden}`, 50, 45, { align: 'center' });

      doc.fontSize(10)
         .text(`${this.empresa}`, 50, 75)
         .text(`RUC: 12345678901`, 50, 90);

      const fechaFormatted = this.formatFecha(orden.fecha);
      doc.text(`Fecha: ${fechaFormatted}`, pageWidth - 180, 20)
         .text(`Cliente: ${orden.cliente}`, pageWidth - 180, 35)
         .text(`Email: ${orden.email}`, pageWidth - 180, 50)
         .text(`Dirección: ${orden.direccionEnvio}`, pageWidth - 180, 65);

      doc.fillColor('#000000').moveDown(5);

      doc.fontSize(12)
         .fillColor('#1a365d')
         .text('Detalle de la Orden', 50, 140);

      const colWidths = [200, 70, 70, 80];
      const headers = ['Producto', 'Cantidad', 'P. Unitario', 'Subtotal'];

      doc.rect(50, doc.y + 5, doc.page.width - 100, 25).fill('#2d3748');

      doc.fillColor('#ffffff').fontSize(10);
      let x = 55;
      headers.forEach((header, i) => {
        doc.text(header, x, doc.y + 10, { width: colWidths[i] - 10 });
        x += colWidths[i];
      });

      doc.fillColor('#000000');
      doc.y += 30;

      orden.productos.forEach((prod) => {
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
        }

        x = 55;
        doc.fontSize(10)
           .text(prod.nombre.substring(0, 30), x, doc.y, { width: 195 })
           .text(`${prod.cantidad}`, x + 200, doc.y, { width: 65 })
           .text(this.formatMoneda(prod.precioUnitario), x + 270, doc.y, { width: 65 })
           .text(this.formatMoneda(prod.subtotal), x + 340, doc.y, { width: 75 });

        doc.y += 20;
      });

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(pageWidth - 50, doc.y).stroke('#cccccc');

      doc.fontSize(11)
         .text(`Subtotal: ${this.formatMoneda(orden.subtotal)}`, { align: 'right' })
         .text(`IGV (18%): ${this.formatMoneda(orden.igv)}`, { align: 'right' });

      doc.fontSize(14)
         .fillColor('#1a365d')
         .text(`TOTAL: ${this.formatMoneda(orden.total)}`, { align: 'right' });

      doc.fillColor('#000000').moveDown(2);

      doc.fontSize(9)
         .text(`Método de pago: ${orden.metodoPago}`, 50, doc.page.height - 60)
         .text('Gracias por su compra', { align: 'center' });

      this.addPageNumbers(doc);
      logger.info(`Factura generada para orden: ${orden.numeroOrden}`);

    } catch (error) {
      logger.error('Error generando factura', { ordenId: orden.id, error });
      throw error;
    }

    return doc;
  }

  generateComprobante(orden: OrdenReporte): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    try {
      const pageWidth = doc.page.width;

      doc.rect(0, 0, pageWidth, 100)
         .fill('#2d3748');

      doc.fillColor('#ffffff')
         .fontSize(18)
         .text('COMPROBANTE DE COMPRA', 50, 20, { align: 'center' })
         .fontSize(11)
         .text(`${orden.numeroOrden}`, 50, 45, { align: 'center' });

      doc.fontSize(10)
         .text(`${this.empresa}`, 50, 70);

      doc.fillColor('#000000').moveDown(4);

      doc.fontSize(11)
         .text(`Cliente: ${orden.cliente}`)
         .text(`Fecha: ${this.formatFecha(orden.fecha)}`)
         .text(`Método de pago: ${orden.metodoPago}`);

      doc.moveDown(2);

      orden.productos.forEach((prod) => {
        doc.fontSize(10)
           .text(`${prod.cantidad}x ${prod.nombre} - ${this.formatMoneda(prod.subtotal)}`);
      });

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(pageWidth - 50, doc.y).stroke();

      doc.fontSize(12)
         .fillColor('#2d3748')
         .text(`Total pagado: ${this.formatMoneda(orden.total)}`, { align: 'right' });

      doc.fillColor('#000000').moveDown(2);
      doc.fontSize(9).text('Este comprobante no es un documento fiscal', { align: 'center' });

      this.addPageNumbers(doc);
      logger.info(`Comprobante generado para orden: ${orden.numeroOrden}`);

    } catch (error) {
      logger.error('Error generando comprobante', { ordenId: orden.id, error });
      throw error;
    }

    return doc;
  }

  private getEstadoColor(estado: string): string {
    const colores: Record<string, string> = {
      'PENDIENTE': '#d69e2e',
      'PROCESANDO': '#3182ce',
      'ENVIADO': '#805ad5',
      'ENTREGADO': '#38a169',
      'CANCELADO': '#e53e3e'
    };
    return colores[estado] || '#718096';
  }

  private getPagoEstadoColor(estado: string): string {
    const colores: Record<string, string> = {
      'PENDIENTE': '#d69e2e',
      'COMPLETADO': '#38a169',
      'FALLIDO': '#e53e3e',
      'REEMBOLSADO': '#805ad5'
    };
    return colores[estado] || '#718096';
  }

  private getDevolucionEstadoColor(estado: string): string {
    const colores: Record<string, string> = {
      'SOLICITADA': '#d69e2e',
      'APROBADA': '#3182ce',
      'RECHAZADA': '#e53e3e',
      'REEMBOLSADA': '#38a169'
    };
    return colores[estado] || '#718096';
  }
}

export default PDFReportGenerator;
