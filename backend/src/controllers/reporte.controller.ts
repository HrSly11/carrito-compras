import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, buildPaginationMeta } from '../utils/response.util.js';
import { z } from 'zod';
import { GestionPDFReport, VentasCategoria, ClienteReporte, ProductoRentabilidad } from '../utils/pdfGestion.js';

const prisma = new PrismaClient();
const pdfGestion = new GestionPDFReport();

const rangoSchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
});

export async function getVentas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { desde, hasta } = rangoSchema.parse(req.query);

    const where: any = {};
    if (desde || hasta) {
      where.fecha_creacion = {};
      if (desde) where.fecha_creacion.gte = new Date(desde);
      if (hasta) where.fecha_creacion.lte = new Date(hasta);
    }

    const ordenes = await prisma.ord_ordenes.findMany({
      where,
      include: { usuario: true },
      orderBy: { fecha_creacion: 'desc' },
    });

    const totalVentas = ordenes.reduce((sum, o) => sum + Number(o.total), 0);
    sendSuccess(res, { ordenes, totalVentas, count: ordenes.length }, 'Ventas retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getOrdenes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { desde, hasta } = rangoSchema.parse(req.query);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (desde || hasta) {
      where.fecha_creacion = {};
      if (desde) where.fecha_creacion.gte = new Date(desde);
      if (hasta) where.fecha_creacion.lte = new Date(hasta);
    }

    const [ordenes, total] = await Promise.all([
      prisma.ord_ordenes.findMany({
        where,
        skip,
        take: limit,
        include: { usuario: true, items: true },
        orderBy: { fecha_creacion: 'desc' },
      }),
      prisma.ord_ordenes.count({ where }),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    sendSuccess(res, ordenes, 'Ordenes retrieved', 200, meta);
  } catch (error) {
    next(error);
  }
}

export async function getInventario(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req parameter kept for Express middleware compatibility
    void req;
    const productos = await prisma.cat_productos.findMany({
      where: { activo: true },
      include: { categoria: true, inv_stock_producto: true },
    });

    const inventario = productos.map((p) => ({
      id: p.id,
      sku: p.sku,
      nombre: p.nombre,
      stock: p.inv_stock_producto?.cantidad ?? p.stock,
      stock_minimo: p.stock_minimo,
      precio: Number(p.precio_venta),
      categoria: p.categoria?.nombre,
    }));

    sendSuccess(res, inventario, 'Inventario retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getStockAlertas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req parameter kept for Express middleware compatibility
    void req;
    const productos = await prisma.cat_productos.findMany({
      where: { activo: true },
      include: { inv_stock_producto: true },
    });

    const alertas = productos
      .filter((p) => {
        const stock = p.inv_stock_producto?.cantidad ?? p.stock;
        return stock === 0 || stock <= p.stock_minimo;
      })
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        stock: p.inv_stock_producto?.cantidad ?? p.stock,
        stock_minimo: p.stock_minimo,
        estado: (p.inv_stock_producto?.cantidad ?? p.stock) === 0 ? 'agotado' : 'bajo_stock',
      }));

    sendSuccess(res, alertas, 'Stock alertas retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getClientes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { desde, hasta } = rangoSchema.parse(req.query);

    const where: any = {};
    if (desde || hasta) {
      where.fecha_registro = {};
      if (desde) where.fecha_registro.gte = new Date(desde);
      if (hasta) where.fecha_registro.lte = new Date(hasta);
    }

    const clientes = await prisma.cli_clientes.findMany({
      where,
      include: { usuario: true },
      orderBy: { fecha_registro: 'desc' },
    });

    sendSuccess(res, clientes, 'Clientes retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getRentabilidad(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req parameter kept for Express middleware compatibility
    void req;
    const productos = await prisma.cat_productos.findMany({
      where: { activo: true },
      include: { categoria: true },
    });

    const rentabilidad = productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      sku: p.sku,
      precio_costo: Number(p.precio_costo),
      precio_venta: Number(p.precio_venta),
      margen: Number(p.precio_venta) - Number(p.precio_costo),
      margen_porcentaje: Number(p.precio_costo) > 0
        ? ((Number(p.precio_venta) - Number(p.precio_costo)) / Number(p.precio_costo)) * 100
        : 0,
      categoria: p.categoria?.nombre,
    }));

    sendSuccess(res, rentabilidad, 'Rentabilidad retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getVentasCategoria(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { desde, hasta } = rangoSchema.parse(req.query);

    const where: any = {};
    if (desde || hasta) {
      where.fecha_creacion = {};
      if (desde) where.fecha_creacion.gte = new Date(desde);
      if (hasta) where.fecha_creacion.lte = new Date(hasta);
    }

    const ordenes = await prisma.ord_ordenes.findMany({
      where,
      include: { items: { include: { producto: { include: { categoria: true } } } } },
    });

    const categoriaMap: Record<string, number> = {};
    for (const orden of ordenes) {
      for (const item of orden.items) {
        const cat = item.producto.categoria?.nombre || 'Sin categoría';
        categoriaMap[cat] = (categoriaMap[cat] || 0) + Number(item.subtotal);
      }
    }

    const ventasCategoria = Object.entries(categoriaMap).map(([categoria, total]) => ({
      categoria,
      total,
    }));

    sendSuccess(res, ventasCategoria, 'Ventas por categoria retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getComportamiento(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req parameter kept for Express middleware compatibility
    void req;
    const clientes = await prisma.cli_clientes.findMany();

    const comportamiento = clientes.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      email: c.email,
      total_gastado: Number(c.total_gastado),
      ordenes_count: 0, // Default value since direct relation doesn't exist
      ultima_compra: c.fecha_ultima_compra,
      fecha_registro: c.fecha_registro,
    }));

    sendSuccess(res, comportamiento, 'Comportamiento retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getPdfReporte(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type } = req.params;
    const { desde, hasta } = rangoSchema.parse(req.query);

    const periodo = {
      inicio: desde ? new Date(desde) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      fin: hasta ? new Date(hasta) : new Date(),
    };

    let pdfBuffer: Buffer;

    switch (type) {
      case 'ordenes': {
        const ordenes = await prisma.ord_ordenes.findMany({
          where: {
            fecha_creacion: {
              gte: periodo.inicio,
              lte: periodo.fin,
            },
          },
          include: { usuario: true },
          orderBy: { fecha_creacion: 'desc' },
        });

        const totalVentas = ordenes.reduce((sum, o) => sum + Number(o.total), 0);
        pdfBuffer = await pdfGestion.generateVentasReport(ordenes, totalVentas, periodo);
        break;
      }
      case 'ventas': {
        const ordenes = await prisma.ord_ordenes.findMany({
          where: {
            fecha_creacion: {
              gte: periodo.inicio,
              lte: periodo.fin,
            },
          },
          include: { usuario: true },
          orderBy: { fecha_creacion: 'desc' },
        });

        const totalVentas = ordenes.reduce((sum, o) => sum + Number(o.total), 0);
        pdfBuffer = await pdfGestion.generateVentasReport(ordenes, totalVentas, periodo);
        break;
      }

      case 'ventas_categoria': {
        const ordenes = await prisma.ord_ordenes.findMany({
          where: {
            fecha_creacion: {
              gte: periodo.inicio,
              lte: periodo.fin,
            },
          },
          include: { items: { include: { producto: { include: { categoria: true } } } } },
        });

        const categoriaMap: Record<string, number> = {};
        const cantidadMap: Record<string, number> = {};
        let totalGeneral = 0;

        for (const orden of ordenes) {
          for (const item of orden.items) {
            const cat = item.producto.categoria?.nombre || 'Sin categoría';
            categoriaMap[cat] = (categoriaMap[cat] || 0) + Number(item.subtotal);
            cantidadMap[cat] = (cantidadMap[cat] || 0) + item.cantidad;
            totalGeneral += Number(item.subtotal);
          }
        }

        const ventas: VentasCategoria[] = Object.entries(categoriaMap).map(([categoria, ventasTotales]) => ({
          categoria,
          ventasTotales,
          cantidadVentas: cantidadMap[categoria] || 0,
          porcentaje: totalGeneral > 0 ? (ventasTotales / totalGeneral) * 100 : 0,
        }));

        ventas.sort((a, b) => b.ventasTotales - a.ventasTotales);
        pdfBuffer = await pdfGestion.generateVentasCategoriaReport(ventas, periodo);
        break;
      }

      case 'rentabilidad': {
        const productos = await prisma.cat_productos.findMany({
          where: { activo: true },
          include: { categoria: true },
        });

        const productoIds = productos.map(p => p.id);
        const orderItems = await prisma.ord_items_orden.findMany({
          where: { id_producto: { in: productoIds } },
          select: { id_producto: true, cantidad: true, subtotal: true },
        });

        const itemsByProduct = orderItems.reduce((acc, item) => {
          acc[item.id_producto] = acc[item.id_producto] || { cantidad: 0, ventasTotales: 0 };
          acc[item.id_producto].cantidad += item.cantidad;
          acc[item.id_producto].ventasTotales += Number(item.subtotal);
          return acc;
        }, {} as Record<number, { cantidad: number; ventasTotales: number }>);

        const productosRentabilidad: ProductoRentabilidad[] = productos.map((p) => {
          const itemData = itemsByProduct[p.id] || { cantidad: 0, ventasTotales: 0 };
          const margenBruto = Number(p.precio_venta) - Number(p.precio_costo);
          const margenPorcentaje = Number(p.precio_costo) > 0
            ? (margenBruto / Number(p.precio_costo)) * 100
            : 0;

          return {
            id: String(p.id),
            nombre: p.nombre,
            sku: p.sku,
            categoria: p.categoria?.nombre || 'Sin categoría',
            ventasTotales: itemData.ventasTotales,
            cantidadVendida: itemData.cantidad,
            precioVenta: Number(p.precio_venta),
            precioCosto: Number(p.precio_costo),
            margenBruto,
            margenPorcentaje,
          };
        });

        productosRentabilidad.sort((a, b) => b.margenPorcentaje - a.margenPorcentaje);
        pdfBuffer = await pdfGestion.generateRentabilidadReport(productosRentabilidad, periodo);
        break;
      }

      case 'clientes': {
        const clientesDb = await prisma.cli_clientes.findMany({
          include: { usuario: true },
        });

        const clientes: ClienteReporte[] = clientesDb.map((c) => {
          const montoTotal = Number(c.total_gastado) || 0;
          let tipo: 'NUEVO' | 'RECURRENTE' | 'INACTIVO' | 'VIP' = 'NUEVO';
          if (c.segmento === 'vip') tipo = 'VIP';
          else if (c.segmento === 'recurrente') tipo = 'RECURRENTE';
          else if (c.segmento === 'inactivo') tipo = 'INACTIVO';

          return {
            id: String(c.id),
            nombre: `${c.nombre} ${c.apellido}`,
            email: c.email,
            totalCompras: 0, // Default value since direct relation doesn't exist
            montoTotal,
            ultimaCompra: c.fecha_ultima_compra || new Date(),
            tipo,
          };
        });

        pdfBuffer = await pdfGestion.generateClientesReport(clientes);
        break;
      }

      case 'comportamiento': {
        const clientesDb = await prisma.cli_clientes.findMany({
          include: { ordenes: true },
        });

        const totalCarritosAbandonados = 0;
        const tasaAbandono = 0;
        const totalCarritosCompletados = clientesDb.reduce((sum, c) => sum + (c.ordenes?.length || 0), 0);
        const tasaConversion = 100;
        const ticketPromedio = totalCarritosCompletados > 0
          ? clientesDb.reduce((sum, c) => sum + (c.ordenes?.reduce((s, o) => s + Number(o.total), 0) || 0), 0) / totalCarritosCompletados
          : 0;

        const data = {
          totalCarritosAbandonados,
          tasaAbandono,
          totalCarritosCompletados,
          tasaConversion,
          ticketPromedio,
          ticketPromedioCarritosAbandonados: 0,
          productosPromedioPorCarrito: 0,
        };

        pdfBuffer = await pdfGestion.generateComportamientoCarritosReport(data);
        break;
      }

      default:
        res.status(400).json({ success: false, message: `Tipo de reporte '${type}' no soportado para PDF` });
        return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_${type}_${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}