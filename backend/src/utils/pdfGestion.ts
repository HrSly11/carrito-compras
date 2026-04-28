import puppeteer from 'puppeteer';
import { logger } from './logger';

export interface GestionReportData {
  titulo: string;
  periodo: {
    inicio: Date;
    fin: Date;
  };
  resumenEjecutivo?: string;
  datos: Record<string, unknown>;
  comparativas?: Record<string, unknown>;
  tendencias?: Record<string, unknown>;
}

export interface ProductoRentabilidad {
  id: string;
  nombre: string;
  sku: string;
  categoria: string;
  ventasTotales: number;
  cantidadVendida: number;
  precioVenta: number;
  precioCosto: number;
  margenBruto: number;
  margenPorcentaje: number;
}

export interface VentasCategoria {
  categoria: string;
  ventasTotales: number;
  cantidadVentas: number;
  porcentaje: number;
  comparativaMesAnterior?: number;
}

export interface CarritoComportamiento {
  totalCarritosAbandonados: number;
  tasaAbandono: number;
  totalCarritosCompletados: number;
  tasaConversion: number;
  ticketPromedio: number;
  ticketPromedioCarritosAbandonados: number;
  productosPromedioPorCarrito: number;
}

export interface ClienteReporte {
  id: string;
  nombre: string;
  email: string;
  totalCompras: number;
  montoTotal: number;
  ultimaCompra: Date;
  tipo: 'NUEVO' | 'RECURRENTE' | 'INACTIVO' | 'VIP';
}

export interface RotacionInventario {
  categoria: string;
  productosTotales: number;
  rotacionMedia: number;
  diasPromedioStock: number;
  valorTotal: number;
}

export interface IngresoCosto {
  mes: string;
  anno: number;
  ingresosTotales: number;
  costosTotales: number;
  gananciaBruta: number;
  margenGanancia: number;
}

export class GestionPDFReport {

  generateHTMLReport(data: GestionReportData, template: string = 'default'): string {
    const styles = this.getCSSStyles();
    const chartScripts = this.getChartScripts();

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.titulo}</title>
  <style>${styles}</style>
  ${chartScripts}
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>Mi Empresa S.A.C.</h1>
      <p>Reporte de Gestión</p>
    </div>
    <div class="report-meta">
      <h2>${data.titulo}</h2>
      <p>Período: ${this.formatDate(data.periodo.inicio)} - ${this.formatDate(data.periodo.fin)}</p>
      <p class="date">Generado: ${new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}</p>
    </div>
  </div>

  ${data.resumenEjecutivo ? `
  <div class="executive-summary">
    <h3>Resumen Ejecutivo</h3>
    <p>${data.resumenEjecutivo}</p>
  </div>
  ` : ''}

  <div class="content">
    ${this.generateContentByTemplate(template, data)}
  </div>

  <div class="footer">
    <p>Documento generado automáticamente - Mi Empresa S.A.C.</p>
    <p>Para consultas: info@miempresa.com | RUC: 12345678901</p>
  </div>
</body>
</html>`;
  }

  private getCSSStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        font-size: 11px;
        line-height: 1.6;
        color: #2d3748;
        background: #ffffff;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 30px 40px;
        background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
        color: #ffffff;
        margin-bottom: 30px;
      }
      .company-info h1 {
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 5px;
      }
      .company-info p {
        font-size: 12px;
        opacity: 0.9;
      }
      .report-meta {
        text-align: right;
      }
      .report-meta h2 {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      .report-meta p {
        font-size: 11px;
        opacity: 0.9;
      }
      .report-meta .date {
        margin-top: 5px;
        font-style: italic;
      }
      .executive-summary {
        background: #f7fafc;
        border-left: 4px solid #3182ce;
        padding: 20px;
        margin: 0 40px 30px 40px;
        border-radius: 4px;
      }
      .executive-summary h3 {
        font-size: 14px;
        color: #1a365d;
        margin-bottom: 10px;
      }
      .executive-summary p {
        font-size: 12px;
        color: #4a5568;
      }
      .content {
        padding: 0 40px 40px 40px;
      }
      .section {
        margin-bottom: 35px;
      }
      .section-title {
        font-size: 16px;
        color: #1a365d;
        border-bottom: 2px solid #3182ce;
        padding-bottom: 8px;
        margin-bottom: 20px;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 25px;
      }
      .kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .kpi-card .label {
        font-size: 10px;
        text-transform: uppercase;
        color: #718096;
        margin-bottom: 5px;
      }
      .kpi-card .value {
        font-size: 22px;
        font-weight: 700;
        color: #1a365d;
      }
      .kpi-card .variation {
        font-size: 10px;
        margin-top: 5px;
      }
      .variation.positive { color: #38a169; }
      .variation.negative { color: #e53e3e; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      th {
        background: #2d3748;
        color: #ffffff;
        padding: 10px 12px;
        text-align: left;
        font-weight: 600;
        font-size: 10px;
        text-transform: uppercase;
      }
      td {
        padding: 10px 12px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 10px;
      }
      tr:nth-child(even) {
        background: #f7fafc;
      }
      tr:hover {
        background: #edf2f7;
      }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 9px;
        font-weight: 600;
      }
      .badge-nuevo { background: #bee3f8; color: #2b6cb0; }
      .badge-recurrente { background: #c6f6d5; color: #276749; }
      .badge-inactivo { background: #feebc8; color: #c05621; }
      .badge-vip { background: #fbb6ce; color: #b83280; }
      .chart-container {
        margin: 20px 0;
        padding: 15px;
        background: #f7fafc;
        border-radius: 8px;
      }
      .chart-placeholder {
        height: 250px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        border: 1px dashed #cbd5e0;
        border-radius: 4px;
        color: #718096;
      }
      .two-column {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      .footer {
        background: #2d3748;
        color: #ffffff;
        padding: 20px 40px;
        text-align: center;
        font-size: 10px;
        margin-top: 40px;
      }
      .footer p:first-child {
        font-weight: 600;
        margin-bottom: 5px;
      }
      @media print {
        body { font-size: 10px; }
        .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      }
    `;
  }

  private getChartScripts(): string {
    return `
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/recharts@2.10.0/umd/Recharts.js"></script>
    `;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
  }

  private formatMoneda(valor: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(valor);
  }

  private generateContentByTemplate(template: string, data: GestionReportData): string {
    switch (template) {
      case 'rentabilidad':
        return this.generateRentabilidadContent(data.datos as { productos: ProductoRentabilidad[] });
      case 'ventas-categoria':
        return this.generateVentasCategoriaContent(data.datos as { ventas: VentasCategoria[] });
      case 'carritos':
        return this.generateCarritosContent(data.datos as unknown as CarritoComportamiento);
      case 'clientes':
        return this.generateClientesContent(data.datos as { clientes: ClienteReporte[] });
      case 'rotacion':
        return this.generateRotacionContent(data.datos as { datos: RotacionInventario[] });
      case 'ingresos-costos':
        return this.generateIngresosCostosContent(data.datos as { datos: IngresoCosto[] });
      default:
        return this.generateDefaultContent(data);
    }
  }

  private generateRentabilidadContent(data: { productos: ProductoRentabilidad[] }): string {
    const productos = data.productos || [];

    return `
      <div class="section">
        <h3 class="section-title">Análisis de Rentabilidad por Producto</h3>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Categoría</th>
              <th class="text-right">Cant. Vendida</th>
              <th class="text-right">Precio Venta</th>
              <th class="text-right">Precio Costo</th>
              <th class="text-right">Margen Bruto</th>
              <th class="text-right">Margen %</th>
            </tr>
          </thead>
          <tbody>
            ${productos.map(p => `
              <tr>
                <td>${p.nombre}</td>
                <td>${p.sku}</td>
                <td>${p.categoria}</td>
                <td class="text-right">${p.cantidadVendida}</td>
                <td class="text-right">${this.formatMoneda(p.precioVenta)}</td>
                <td class="text-right">${this.formatMoneda(p.precioCosto)}</td>
                <td class="text-right">${this.formatMoneda(p.margenBruto)}</td>
                <td class="text-right" style="color: ${p.margenPorcentaje > 30 ? '#38a169' : p.margenPorcentaje > 15 ? '#d69e2e' : '#e53e3e'}">${p.margenPorcentaje.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateVentasCategoriaContent(data: { ventas: VentasCategoria[] }): string {
    const ventas = data.ventas || [];

    return `
      <div class="section">
        <h3 class="section-title">Ventas por Categoría</h3>
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th class="text-right">Ventas Totales</th>
              <th class="text-right">Cantidad</th>
              <th class="text-right">% Ventas</th>
              <th class="text-right">vs Mes Anterior</th>
            </tr>
          </thead>
          <tbody>
            ${ventas.map(v => `
              <tr>
                <td>${v.categoria}</td>
                <td class="text-right">${this.formatMoneda(v.ventasTotales)}</td>
                <td class="text-right">${v.cantidadVentas}</td>
                <td class="text-right">${v.porcentaje.toFixed(1)}%</td>
                <td class="text-right" style="color: ${(v.comparativaMesAnterior || 0) >= 0 ? '#38a169' : '#e53e3e'}">
                  ${v.comparativaMesAnterior !== undefined ? `${v.comparativaMesAnterior >= 0 ? '+' : ''}${v.comparativaMesAnterior.toFixed(1)}%` : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateCarritosContent(data: CarritoComportamiento): string {
    return `
      <div class="section">
        <h3 class="section-title">Comportamiento de Carritos</h3>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="label">Carritos Abandondos</div>
            <div class="value">${data.totalCarritosAbandonados}</div>
            <div class="variation">Tasa: ${data.tasaAbandono.toFixed(1)}%</div>
          </div>
          <div class="kpi-card">
            <div class="label">Carritos Completados</div>
            <div class="value">${data.totalCarritosCompletados}</div>
            <div class="variation">Tasa: ${data.tasaConversion.toFixed(1)}%</div>
          </div>
          <div class="kpi-card">
            <div class="label">Ticket Promedio</div>
            <div class="value">${this.formatMoneda(data.ticketPromedio)}</div>
          </div>
          <div class="kpi-card">
            <div class="label">Ticket Prom. Abandono</div>
            <div class="value">${this.formatMoneda(data.ticketPromedioCarritosAbandonados)}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Métrica</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Productos promedio por carrito</td>
              <td class="text-right">${data.productosPromedioPorCarrito.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  private generateClientesContent(data: { clientes: ClienteReporte[] }): string {
    const clientes = data.clientes || [];
    const tipos = { 'NUEVO': 0, 'RECURRENTE': 0, 'INACTIVO': 0, 'VIP': 0 };

    clientes.forEach(c => {
      if (tipos[c.tipo] !== undefined) tipos[c.tipo]++;
    });

    return `
      <div class="section">
        <h3 class="section-title">Análisis de Clientes</h3>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="label">Nuevos Clientes</div>
            <div class="value">${tipos['NUEVO']}</div>
          </div>
          <div class="kpi-card">
            <div class="label">Clientes Recurrentes</div>
            <div class="value">${tipos['RECURRENTE']}</div>
          </div>
          <div class="kpi-card">
            <div class="label">Clientes Inactivos</div>
            <div class="value">${tipos['INACTIVO']}</div>
          </div>
          <div class="kpi-card">
            <div class="label">Clientes VIP</div>
            <div class="value">${tipos['VIP']}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th class="text-center">Tipo</th>
              <th class="text-right">Total Compras</th>
              <th class="text-right">Monto Total</th>
              <th class="text-right">Última Compra</th>
            </tr>
          </thead>
          <tbody>
            ${clientes.map(c => `
              <tr>
                <td>${c.nombre}</td>
                <td>${c.email}</td>
                <td class="text-center"><span class="badge badge-${c.tipo.toLowerCase()}">${c.tipo}</span></td>
                <td class="text-right">${c.totalCompras}</td>
                <td class="text-right">${this.formatMoneda(c.montoTotal)}</td>
                <td class="text-right">${this.formatDate(c.ultimaCompra)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateRotacionContent(data: { datos: RotacionInventario[] }): string {
    const datos = data.datos || [];

    return `
      <div class="section">
        <h3 class="section-title">Rotación de Inventario por Categoría</h3>
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th class="text-right">N° Productos</th>
              <th class="text-right">Rotación Media</th>
              <th class="text-right">Días Prom. Stock</th>
              <th class="text-right">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            ${datos.map(d => `
              <tr>
                <td>${d.categoria}</td>
                <td class="text-right">${d.productosTotales}</td>
                <td class="text-right">${d.rotacionMedia.toFixed(2)}x</td>
                <td class="text-right">${d.diasPromedioStock} días</td>
                <td class="text-right">${this.formatMoneda(d.valorTotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateIngresosCostosContent(data: { datos: IngresoCosto[] }): string {
    const datos = data.datos || [];

    return `
      <div class="section">
        <h3 class="section-title">Ingresos vs Costos Comparativo</h3>
        <table>
          <thead>
            <tr>
              <th>Mes</th>
              <th class="text-right">Ingresos</th>
              <th class="text-right">Costos</th>
              <th class="text-right">Ganancia Bruta</th>
              <th class="text-right">Margen %</th>
            </tr>
          </thead>
          <tbody>
            ${datos.map(d => `
              <tr>
                <td>${d.mes} ${d.anno}</td>
                <td class="text-right">${this.formatMoneda(d.ingresosTotales)}</td>
                <td class="text-right">${this.formatMoneda(d.costosTotales)}</td>
                <td class="text-right" style="color: ${d.gananciaBruta >= 0 ? '#38a169' : '#e53e3e'}">${this.formatMoneda(d.gananciaBruta)}</td>
                <td class="text-right" style="color: ${d.margenGanancia >= 20 ? '#38a169' : d.margenGanancia >= 10 ? '#d69e2e' : '#e53e3e'}">${d.margenGanancia.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateDefaultContent(data: GestionReportData): string {
    const datosStr = JSON.stringify(data.datos, null, 2);
    return `
      <div class="section">
        <h3 class="section-title">Datos del Reporte</h3>
        <pre style="background: #f7fafc; padding: 15px; border-radius: 4px; overflow-x: auto;">${datosStr}</pre>
      </div>
    `;
  }

  async generateRentabilidadReport(productos: ProductoRentabilidad[], periodo: { inicio: Date; fin: Date }): Promise<Buffer> {
    try {
      const totalVentas = productos.reduce((sum, p) => sum + p.ventasTotales, 0);
      const margenPromedio = productos.length > 0
        ? productos.reduce((sum, p) => sum + p.margenPorcentaje, 0) / productos.length
        : 0;

      const data: GestionReportData = {
        titulo: 'Reporte de Rentabilidad por Producto',
        periodo,
        resumenEjecutivo: `Se analizaron ${productos.length} productos. Ventas totales: ${this.formatMoneda(totalVentas)}. Margen bruto promedio: ${margenPromedio.toFixed(1)}%.`,
        datos: { productos },
      };

      const html = this.generateHTMLReport(data, 'rentabilidad');
      return await this.generateFromHTML(html);

    } catch (error) {
      logger.error('Error generando reporte de rentabilidad', { error });
      throw error;
    }
  }

  async generateVentasReport(ordenes: any[], totalVentas: number, periodo: { inicio: Date; fin: Date }): Promise<Buffer> {
    try {
      const html = this.generateVentasReportHTML(ordenes, totalVentas, periodo);
      return await this.generateFromHTML(html);

    } catch (error) {
      logger.error('Error generando reporte de ventas', { error });
      throw error;
    }
  }

  private generateVentasReportHTML(ordenes: any[], totalVentas: number, periodo: { inicio: Date; fin: Date }): string {
    const styles = this.getCSSStyles();

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Ventas</title>
  <style>${styles}</style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>Mi Empresa S.A.C.</h1>
      <p>Reporte de Gestión</p>
    </div>
    <div class="report-meta">
      <h2>Reporte de Ventas</h2>
      <p>Período: ${this.formatDate(periodo.inicio)} - ${this.formatDate(periodo.fin)}</p>
      <p class="date">Generado: ${new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}</p>
    </div>
  </div>

  <div class="executive-summary">
    <h3>Resumen Ejecutivo</h3>
    <p>Se analizaron ${ordenes.length} órdenes. Ventas totales: ${this.formatMoneda(totalVentas)}.</p>
  </div>

  <div class="content">
    <div class="section">
      <h3 class="section-title">Detalle de Ventas</h3>
      <table>
        <thead>
          <tr>
            <th>N° Orden</th>
            <th>Cliente</th>
            <th class="text-right">Total</th>
            <th class="text-center">Estado</th>
            <th class="text-right">Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${ordenes.map(orden => `
            <tr>
              <td>${orden.numero_orden || orden.numero || '-'}</td>
              <td>${orden.usuario?.email || '-'}</td>
              <td class="text-right">${this.formatMoneda(Number(orden.total))}</td>
              <td class="text-center">${orden.estado_actual || orden.estado || '-'}</td>
              <td class="text-right">${this.formatDate(orden.fecha_creacion)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer">
    <p>Documento generado automáticamente - Mi Empresa S.A.C.</p>
    <p>Para consultas: info@miempresa.com | RUC: 12345678901</p>
  </div>
</body>
</html>`;
  }

  async generateVentasCategoriaReport(ventas: VentasCategoria[], periodo: { inicio: Date; fin: Date }): Promise<Buffer> {
    try {
      const totalVentas = ventas.reduce((sum, v) => sum + v.ventasTotales, 0);
      const categoriasCrecimiento = ventas.filter(v => (v.comparativaMesAnterior || 0) > 0).length;

      const data: GestionReportData = {
        titulo: 'Reporte de Ventas por Categoría',
        periodo,
        resumenEjecutivo: `Se analizaron ${ventas.length} categorías. Ventas totales: ${this.formatMoneda(totalVentas)}. ${categoriasCrecimiento} categorías con crecimiento positivo.`,
        datos: { ventas },
      };

      const html = this.generateHTMLReport(data, 'ventas-categoria');
      return await this.generateFromHTML(html);

    } catch (error) {
      logger.error('Error generando reporte de ventas por categoría', { error });
      throw error;
    }
  }

  async generateComportamientoCarritosReport(datos: CarritoComportamiento): Promise<Buffer> {
    try {
      const data: GestionReportData = {
        titulo: 'Reporte de Comportamiento de Carritos',
        periodo: { inicio: new Date(), fin: new Date() },
        resumenEjecutivo: `Tasa de conversión: ${datos.tasaConversion.toFixed(1)}%. Ticket promedio: ${this.formatMoneda(datos.ticketPromedio)}. Carritos abandonados: ${datos.totalCarritosAbandonados}.`,
        datos: datos as unknown as Record<string, unknown>,
      };

      const html = this.generateHTMLReport(data, 'carritos');
      return await this.generateFromHTML(html);

    } catch (error) {
      logger.error('Error generando reporte de comportamiento de carritos', { error });
      throw error;
    }
  }

  async generateClientesReport(clientes: ClienteReporte[]): Promise<Buffer> {
    try {
      const VIPs = clientes.filter(c => c.tipo === 'VIP').length;
      const totalIngresos = clientes.reduce((sum, c) => sum + c.montoTotal, 0);

      const data: GestionReportData = {
        titulo: 'Reporte de Clientes',
        periodo: { inicio: new Date(), fin: new Date() },
        resumenEjecutivo: `Total de clientes: ${clientes.length}. Clientes VIP: ${VIPs}. Ingresos totales generados: ${this.formatMoneda(totalIngresos)}.`,
        datos: { clientes },
      };

      const html = this.generateHTMLReport(data, 'clientes');
      return await this.generateFromHTML(html);

    } catch (error) {
      logger.error('Error generando reporte de clientes', { error });
      throw error;
    }
  }

  async generateRotacionInventarioReport(datos: RotacionInventario): Promise<Buffer> {
    try {
      const categorias = datos.categoria ? [{ ...datos, categoria: datos.categoria }] : [];

      const data: GestionReportData = {
        titulo: 'Reporte de Rotación de Inventario',
        periodo: { inicio: new Date(), fin: new Date() },
        resumenEjecutivo: `Rotación media: ${datos.rotacionMedia.toFixed(2)}x. Días promedio en stock: ${datos.diasPromedioStock}. Valor total: ${this.formatMoneda(datos.valorTotal)}.`,
        datos: { datos: categorias },
      };

      const html = this.generateHTMLReport(data, 'rotacion');
      return await this.generateFromHTML(html);

    } catch (error) {
      logger.error('Error generando reporte de rotación de inventario', { error });
      throw error;
    }
  }

  async generateIngresosCostosReport(datos: IngresoCosto[]): Promise<Buffer> {
    try {
      const totalIngresos = datos.reduce((sum, d) => sum + d.ingresosTotales, 0);
      const totalCostos = datos.reduce((sum, d) => sum + d.costosTotales, 0);
      const gananciaTotal = totalIngresos - totalCostos;
      const margenPromedio = totalIngresos > 0 ? (gananciaTotal / totalIngresos) * 100 : 0;

      const data: GestionReportData = {
        titulo: 'Reporte de Ingresos vs Costos',
        periodo: { inicio: new Date(), fin: new Date() },
        resumenEjecutivo: `Ingresos totales: ${this.formatMoneda(totalIngresos)}. Costos totales: ${this.formatMoneda(totalCostos)}. Ganancia bruta: ${this.formatMoneda(gananciaTotal)} (${margenPromedio.toFixed(1)}% margen).`,
        datos: { datos },
      };

      const html = this.generateHTMLReport(data, 'ingresos-costos');
      return await this.generateFromHTML(html);

    } catch (error) {
      logger.error('Error generando reporte de ingresos vs costos', { error });
      throw error;
    }
  }

  async generateFromHTML(html: string): Promise<Buffer> {
    let browser = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 8px; width: 100%; text-align: center; color: #718096;">
            Mi Empresa S.A.C. - Reporte de Gestión
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 8px; width: 100%; text-align: center; color: #718096;">
            Página <span class="pageNumber"></span> de <span class="totalPages"></span>
          </div>
        `
      });

      logger.info('PDF generado exitosamente con Puppeteer');

      return Buffer.from(pdfBuffer);

    } catch (error) {
      logger.error('Error generando PDF con Puppeteer', { error });
      throw error;

    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

export default GestionPDFReport;
