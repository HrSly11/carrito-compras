import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

/**
 * Interfaz para filtros de stock
 */
export interface StockFilters {
  page?: number;
  limit?: number;
  categoria?: number;
  marca?: number;
  stockBajo?: boolean;
}

/**
 * Interfaz para filtros de movimientos
 */
export interface MovimientoFilters {
  page?: number;
  limit?: number;
  tipo?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  idProducto?: number;
}

/**
 * Interfaz para detalle de ajuste
 */
export interface DetalleAjuste {
  id_producto: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  diferencia: number;
  id_unidad_medida?: number;
}

/**
 * Interfaz para resultado de stock actual
 */
export interface StockActual {
  id_producto: number;
  cantidad: number;
  reservado: number;
  disponible: number;
  producto?: any;
}

/**
 * Interfaz para movimiento de inventario
 */
export interface MovimientoInventario {
  id: number;
  id_producto: number;
  id_stock: number;
  tipo: string;
  cantidad: number;
  motivo: string | null;
  id_orden: number | null;
  id_ajuste: number | null;
  id_usuario: number;
  created_at: Date;
  producto?: any;
  usuario?: any;
}

/**
 * Servicio de inventario que maneja todas las operaciones relacionadas
 * con el control de stock, movimientos y ajustes de inventario.
 */
export class InventarioService {
  /**
   * Obtiene el stock actual de un producto
   * @param idProducto - ID del producto
   * @returns Promise con datos del stock actual
   */
  async getStockActual(idProducto: number): Promise<StockActual> {
    let stock = await prisma.inv_stock_producto.findUnique({
      where: { id_producto: idProducto },
      include: {
        producto: {
          include: {
            categoria: true,
            marca: true,
          },
        },
      },
    });

    if (!stock) {
      const producto = await prisma.cat_productos.findUnique({
        where: { id: idProducto },
        include: {
          categoria: true,
          marca: true,
        },
      });

      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      stock = await prisma.inv_stock_producto.create({
        data: {
          id_producto: idProducto,
          cantidad: producto.stock,
          reservado: 0,
          disponible: producto.stock,
        },
        include: {
          producto: {
            include: {
              categoria: true,
              marca: true,
            },
          },
        },
      });
    }

    return stock;
  }

  /**
   * Obtiene todo el stock con paginación y filtros
   * @param filtros - Filtros de consulta
   * @returns Promise con stock, total, page y limit
   */
  async getAllStock(filtros: StockFilters): Promise<{
    stock: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filtros.page || config.pagination.defaultPage;
    const limit = filtros.limit || config.pagination.defaultLimit;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filtros.stockBajo) {
      where.disponible = { gt: 0 };
    }

    let productoWhere: any = {};
    if (filtros.categoria) {
      productoWhere.id_categoria = filtros.categoria;
    }
    if (filtros.marca) {
      productoWhere.id_marca = filtros.marca;
    }

    if (Object.keys(productoWhere).length > 0) {
      where.producto = productoWhere;
    }

    const [stock, total] = await Promise.all([
      prisma.inv_stock_producto.findMany({
        where,
        skip,
        take: limit,
        include: {
          producto: {
            include: {
              categoria: true,
              marca: true,
            },
          },
        },
        orderBy: { producto: { nombre: 'asc' } },
      }),
      prisma.inv_stock_producto.count({ where }),
    ]);

    return {
      stock,
      total,
      page,
      limit,
    };
  }

  /**
   * Actualiza el stock de un producto
   * @param idProducto - ID del producto
   * @param cantidad - Cantidad a agregar o restar
   * @param tipo - Tipo de movimiento (entrada, salida, ajuste)
   * @param motivo - Motivo del movimiento
   * @param idUsuario - ID del usuario que realiza el cambio
   * @param idOrden - ID de orden opcional
   * @returns Promise con el stock actualizado
   */
  async updateStock(
    idProducto: number,
    cantidad: number,
    tipo: string,
    motivo: string,
    idUsuario: number,
    idOrden?: number
  ): Promise<any> {
    return prisma.$transaction(async (tx) => {
      let stock = await tx.inv_stock_producto.findUnique({
        where: { id_producto: idProducto },
      });

      if (!stock) {
        const producto = await tx.cat_productos.findUnique({
          where: { id: idProducto },
        });

        if (!producto) {
          throw new Error('Producto no encontrado');
        }

        stock = await tx.inv_stock_producto.create({
          data: {
            id_producto: idProducto,
            cantidad: producto.stock,
            reservado: 0,
            disponible: producto.stock,
          },
        });
      }

      let nuevaCantidad = stock.cantidad;
      let nuevoReservado = stock.reservado;
      let nuevoDisponible = stock.disponible;

      switch (tipo) {
        case 'entrada':
          nuevaCantidad = stock.cantidad + cantidad;
          nuevoDisponible = stock.disponible + cantidad;
          break;
        case 'salida':
          nuevaCantidad = stock.cantidad - cantidad;
          nuevoDisponible = stock.disponible - cantidad;
          break;
        case 'reserva':
          nuevoReservado = stock.reservado + cantidad;
          nuevoDisponible = stock.disponible - cantidad;
          break;
        case 'liberacion':
          nuevoReservado = stock.reservado - cantidad;
          nuevoDisponible = stock.disponible + cantidad;
          break;
        case 'ajuste':
          nuevaCantidad = cantidad;
          nuevoDisponible = cantidad - stock.reservado;
          break;
        default:
          throw new Error(`Tipo de movimiento no válido: ${tipo}`);
      }

      if (nuevoDisponible < 0) {
        throw new Error('Stock disponible no puede ser negativo');
      }

      const stockActualizado = await tx.inv_stock_producto.update({
        where: { id_producto: idProducto },
        data: {
          cantidad: nuevaCantidad,
          reservado: nuevoReservado,
          disponible: nuevoDisponible,
        },
        include: {
          producto: true,
        },
      });

      await tx.inv_movimientos_inventario.create({
        data: {
          id_producto: idProducto,
          id_stock: stock.id,
          tipo,
          cantidad,
          motivo,
          id_orden: idOrden,
          seg_usuariosId: idUsuario,
        },
      });

      await tx.cat_productos.update({
        where: { id: idProducto },
        data: { stock: nuevaCantidad },
      });

      return stockActualizado;
    });
  }

  /**
   * Reserva stock para una orden
   * @param idProducto - ID del producto
   * @param cantidad - Cantidad a reservar
   */
  async reserveStock(idProducto: number, cantidad: number): Promise<void> {
    await this.updateStock(idProducto, cantidad, 'reserva', 'Reserva para orden', 0);
  }

  /**
   * Libera stock reservado
   * @param idProducto - ID del producto
   * @param cantidad - Cantidad a liberar
   */
  async releaseStock(idProducto: number, cantidad: number): Promise<void> {
    await this.updateStock(idProducto, cantidad, 'liberacion', 'Liberación de reserva', 0);
  }

  /**
   * Confirma el consumo de stock reservado
   * @param idProducto - ID del producto
   * @param cantidad - Cantidad a confirmar
   */
  async confirmStock(idProducto: number, cantidad: number): Promise<void> {
    await this.updateStock(idProducto, cantidad, 'salida', 'Confirmación de orden', 0);
  }

  /**
   * Obtiene los movimientos de inventario de un producto
   * @param idProducto - ID del producto
   * @param fechaDesde - Fecha inicial opcional
   * @param fechaHasta - Fecha final opcional
   * @returns Promise con array de movimientos
   */
  async getMovimientos(
    idProducto: number,
    fechaDesde?: Date,
    fechaHasta?: Date
  ): Promise<MovimientoInventario[]> {
    const where: any = { id_producto: idProducto };

    if (fechaDesde || fechaHasta) {
      where.created_at = {};
      if (fechaDesde) {
        where.created_at.gte = fechaDesde;
      }
      if (fechaHasta) {
        where.created_at.lte = fechaHasta;
      }
    }

    return prisma.inv_movimientos_inventario.findMany({
      where,
      include: {
        producto: true,
      },
      orderBy: { created_at: 'desc' },
    }) as any;
  }

  /**
   * Obtiene movimientos de inventario con filtros
   * @param filtros - Filtros de consulta
   * @returns Promise con movimientos, total, page y limit
   */
  async getMovimientosInventario(filtros: MovimientoFilters): Promise<{
    movimientos: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filtros.page || config.pagination.defaultPage;
    const limit = filtros.limit || config.pagination.defaultLimit;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }

    if (filtros.idProducto) {
      where.id_producto = filtros.idProducto;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.created_at = {};
      if (filtros.fechaDesde) {
        where.created_at.gte = filtros.fechaDesde;
      }
      if (filtros.fechaHasta) {
        where.created_at.lte = filtros.fechaHasta;
      }
    }

    const [movimientos, total] = await Promise.all([
      prisma.inv_movimientos_inventario.findMany({
        where,
        skip,
        take: limit,
        include: {
          producto: {
            select: {
              id: true,
              sku: true,
              nombre: true,
            },
          },
          seg_usuarios: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.inv_movimientos_inventario.count({ where }),
    ]);

    return {
      movimientos,
      total,
      page,
      limit,
    };
  }

  /**
   * Crea un ajuste de inventario
   * @param motivo - Motivo del ajuste
   * @param detalles - Array de detalles del ajuste
   * @param idUsuario - ID del usuario que crea el ajuste
   * @returns Promise con el ajuste creado
   */
  async createAjuste(motivo: string, detalles: DetalleAjuste[], idUsuario: number): Promise<any> {
    return prisma.$transaction(async (tx) => {
      const ajuste = await tx.inv_ajustes.create({
        data: {
          motivo,
          id_usuario: idUsuario,
          estado: 'pendiente',
          detalles: {
            create: detalles.map((d) => ({
              id_producto: d.id_producto,
              cantidad_anterior: d.cantidad_anterior,
              cantidad_nueva: d.cantidad_nueva,
              diferencia: d.diferencia,
              id_unidad_medida: d.id_unidad_medida,
            })),
          },
        },
        include: {
          detalles: {
            include: {
              producto: true,
                          },
          },
        },
      });

      for (const detalle of detalles) {
        await tx.inv_movimientos_inventario.create({
          data: {
            id_producto: detalle.id_producto,
            id_stock: 0,
            tipo: 'ajuste_pendiente',
            cantidad: detalle.diferencia,
            motivo: `Ajuste #${ajuste.id}: ${motivo}`,
            id_ajuste: ajuste.id,
            seg_usuariosId: idUsuario,
          },
        });
      }

      return ajuste;
    });
  }

  /**
   * Aprueba un ajuste de inventario
   * @param idAjuste - ID del ajuste
   * @param idAprobador - ID del usuario que aprueba
   * @returns Promise con el ajuste aprobado
   */
  async approveAjuste(idAjuste: number, idAprobador: number): Promise<any> {
    return prisma.$transaction(async (tx) => {
      const ajuste = await tx.inv_ajustes.findUnique({
        where: { id: idAjuste },
        include: {
          detalles: {
            include: {
              producto: true,
            },
          },
        },
      });

      if (!ajuste) {
        throw new Error('Ajuste no encontrado');
      }

      if (ajuste.estado !== 'pendiente') {
        throw new Error('El ajuste ya ha sido procesado');
      }

      for (const detalle of ajuste.detalles) {
        let stock = await tx.inv_stock_producto.findUnique({
          where: { id_producto: detalle.id_producto },
        });

        if (!stock) {
          stock = await tx.inv_stock_producto.create({
            data: {
              id_producto: detalle.id_producto,
              cantidad: 0,
              reservado: 0,
              disponible: 0,
            },
          });
        }

        await tx.inv_movimientos_inventario.updateMany({
          where: {
            id_ajuste: idAjuste,
            id_producto: detalle.id_producto,
          },
          data: {
            id_stock: stock.id,
            tipo: 'ajuste',
          },
        });

        const nuevaCantidad = detalle.cantidad_nueva;
        const nuevoDisponible = nuevaCantidad - stock.reservado;

        await tx.inv_stock_producto.update({
          where: { id_producto: detalle.id_producto },
          data: {
            cantidad: nuevaCantidad,
            disponible: nuevoDisponible >= 0 ? nuevoDisponible : 0,
          },
        });

        await tx.cat_productos.update({
          where: { id: detalle.id_producto },
          data: { stock: nuevaCantidad },
        });
      }

      return tx.inv_ajustes.update({
        where: { id: idAjuste },
        data: {
          estado: 'aprobado',
          id_aprobado_por: idAprobador,
        },
        include: {
          detalles: {
            include: {
              producto: true,
                          },
          },
        },
      });
    });
  }

  /**
   * Obtiene los ajustes pendientes
   * @returns Promise con array de ajustes pendientes
   */
  async getAjustesPendientes(): Promise<any[]> {
    return prisma.inv_ajustes.findMany({
      where: { estado: 'pendiente' },
      include: {
        detalles: {
          include: {
            producto: {
              select: {
                id: true,
                sku: true,
                nombre: true,
              },
            },
                      },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Obtiene productos con stock bajo el mínimo
   * @returns Promise con array de productos con alerta
   */
  async getAlertaStockBajo(): Promise<any[]> {
    const productos = await prisma.cat_productos.findMany({
      where: {
        activo: true,
        stock_minimo: { gt: 0 },
      },
      include: {
        categoria: true,
        marca: true,
      },
    });

    const alerts: any[] = [];

    for (const producto of productos) {
      const stock = await prisma.inv_stock_producto.findUnique({
        where: { id_producto: producto.id },
      });

      const stockActual = stock?.disponible ?? producto.stock;

      if (stockActual <= producto.stock_minimo) {
        alerts.push({
          producto,
          stock_actual: stockActual,
          stock_minimo: producto.stock_minimo,
          diferencia: stockActual - producto.stock_minimo,
        });
      }
    }

    return alerts.sort((a, b) => a.diferencia - b.diferencia);
  }

  /**
   * Obtiene estadísticas generales del inventario para dashboard
   * @returns Promise con estadísticas del inventario
   */
  async getEstadisticas(): Promise<{
    totalProductos: number;
    productosAgotados: number;
    productosStockBajo: number;
    valorTotalInventario: number;
    stockActual: any[];
    productosCriticos: any[];
    stockByCategory: any[];
  }> {
    const productos = await prisma.cat_productos.findMany({
      where: { activo: true },
      include: {
        categoria: true,
        marca: true,
        inv_stock_producto: true,
      },
    });

    let totalAgotados = 0;
    let totalStockBajo = 0;
    let valorTotal = 0;
    const productosCriticos: any[] = [];
    const stockByCategory: Record<string, any> = {};
    const stockActual: any[] = [];

    for (const producto of productos) {
      const stockData = producto.inv_stock_producto;
      const cantidad = stockData?.cantidad ?? producto.stock;

      const precioCosto = Number(producto.precio_costo) || 0;
      const precioVenta = Number(producto.precio_venta) || 0;

      valorTotal += cantidad * precioCosto;

      stockActual.push({
        id: producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        stock: cantidad,
        stock_minimo: producto.stock_minimo,
        precio: precioVenta,
        categoria: producto.categoria?.nombre || 'Sin categoría',
      });

      if (cantidad === 0) {
        totalAgotados++;
        productosCriticos.push({
          id: producto.id,
          nombre: producto.nombre,
          stock: 0,
          sku: producto.sku,
          estado: 'agotado',
        });
      } else if (producto.stock_minimo > 0 && cantidad <= producto.stock_minimo) {
        totalStockBajo++;
        if (productosCriticos.length < 20) {
          productosCriticos.push({
            id: producto.id,
            nombre: producto.nombre,
            stock: cantidad,
            sku: producto.sku,
            estado: 'stock_bajo',
          });
        }
      }

      const catNombre = producto.categoria?.nombre || 'Sin categoría';
      if (!stockByCategory[catNombre]) {
        stockByCategory[catNombre] = { total: 0, porcentaje: 0 };
      }
      stockByCategory[catNombre].total++;
    }

    const categoriaStats = Object.entries(stockByCategory).map(([categoria, data]) => ({
      categoria,
      total: (data as any).total,
      porcentaje: Math.round(((data as any).total / productos.length) * 100),
    }));

    return {
      totalProductos: productos.length,
      productosAgotados: totalAgotados,
      productosStockBajo: totalStockBajo,
      valorTotalInventario: Math.round(valorTotal * 100) / 100,
      stockActual: stockActual.slice(0, 50),
      productosCriticos: productosCriticos.slice(0, 20),
      stockByCategory: categoriaStats,
    };
  }

  /**
   * Obtiene el valorizado del stock por categoría
   * @returns Promise con array de categorías valorizadas
   */
  async getValorizadoPorCategoria(): Promise<any[]> {
    const categorias = await prisma.cat_categorias.findMany({
      where: { activo: true },
      include: {
        productos: {
          where: { activo: true },
          include: {
            inv_stock_producto: true,
          },
        },
      },
    });

    return categorias.map((categoria) => {
      let totalCantidad = 0;
      let totalValor = 0;

      for (const producto of categoria.productos) {
        const stockData = producto.inv_stock_producto;
        const cantidad = stockData?.disponible ?? producto.stock;
        const precioCosto = Number(producto.precio_costo);

        totalCantidad += cantidad;
        totalValor += cantidad * precioCosto;
      }

      return {
        categoria: {
          id: categoria.id,
          nombre: categoria.nombre,
          slug: categoria.slug,
        },
        total_cantidad: totalCantidad,
        total_valor: Math.round(totalValor * 100) / 100,
        productos_count: categoria.productos.length,
      };
    }).filter((c) => c.total_cantidad > 0)
      .sort((a, b) => b.total_valor - a.total_valor);
  }
}

export default new InventarioService();
