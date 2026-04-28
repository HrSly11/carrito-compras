import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { InventarioService } from './inventario.service';

const prisma = new PrismaClient();

/**
 * Interfaz para filtros de órdenes
 */
export interface OrdenFilters {
  page?: number;
  limit?: number;
  estado?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  usuarioId?: number;
  busqueda?: string;
}

/**
 * Interfaz para datos de envío
 */
export interface DatosEnvio {
  nombre: string;
  apellido: string;
  direccion: string;
  ciudad: string;
  departamento?: string;
  codigo_postal?: string;
  telefono?: string;
}

/**
 * Interfaz para totales de orden
 */
export interface OrdenTotales {
  subtotal: number;
  igv: number;
  descuento: number;
  total: number;
}

/**
 * Servicio de órdenes que maneja todas las operaciones relacionadas
 * con la creación, consulta y gestión de órdenes de compra.
 */
export class OrdenService {
  private inventarioService: InventarioService;

  constructor() {
    this.inventarioService = new InventarioService();
  }

  /**
   * Crea una orden de compra a partir del carrito
   * @param idCarrito - ID del carrito
   * @param datosEnvio - Datos de envío
   * @param idMetodoEnvio - ID del método de envío
   * @param idMetodoPago - ID del método de pago
   * @returns Promise con la orden creada
   */
  async createOrdenFromCarrito(
    idCarrito: number,
    datosEnvio: DatosEnvio,
    idMetodoEnvio: number,
    idMetodoPago: number
  ): Promise<any> {
    // datosEnvio parameter kept for compatibility, though not used in current implementation
    void datosEnvio;
    const carrito = await prisma.ord_carritos.findUnique({
      where: { id: idCarrito },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
        usuario: true,
      },
    });

    if (!carrito) {
      throw new Error('Carrito no encontrado');
    }

    if (carrito.items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    if (!carrito.id_usuario) {
      throw new Error('El carrito no tiene usuario asociado');
    }

    const numeroOrden = this.generateNumeroOrden();

    const precioEnvio = await prisma.ord_metodos_envio.findUnique({
      where: { id: idMetodoEnvio },
    });

    const envioPrice = precioEnvio ? Number(precioEnvio.precio) : 0;

    const { subtotal, igv, descuento, total } = this.calculateTotalesOrden(
      carrito.items.map((item) => ({
        cantidad: item.cantidad,
        precio_unitario: Number(item.precio_unitario),
      })),
      config.igvRate
    );

    const totalFinal = total + envioPrice;

    return prisma.$transaction(async (tx) => {
      const orden = await tx.ord_ordenes.create({
        data: {
          numero_orden: numeroOrden,
          id_usuario: carrito.id_usuario || 0,
          id_metodo_envio: idMetodoEnvio,
          id_metodo_pago: idMetodoPago,
          subtotal: subtotal,
          igv: igv,
          descuento: descuento,
          total: totalFinal,
          estado_actual: 'pagada',
          items: {
            create: carrito.items.map((item) => ({
              id_producto: item.id_producto,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              subtotal: Number(item.precio_unitario) * item.cantidad,
            })),
          },
        },
        include: {
          usuario: true,
          items: {
            include: {
              producto: true,
            },
          },
          direccion_envio: true,
          metodo_envio: true,
          metodo_pago: true,
        },
      });

      await tx.ord_carritos.update({
        where: { id: idCarrito },
        data: { estado: 'completado' },
      });

      const estadoInicial = await tx.ord_estados_orden.findUnique({
        where: { estado: 'pagada' },
      });

      if (estadoInicial) {
        await tx.ord_historial_estados.create({
          data: {
            id_orden: orden.id,
            id_estado: estadoInicial.id,
            id_usuario: carrito.id_usuario,
            comentario: 'Pago simulado - Orden pagada',
          },
        });
      }

      return orden;
    });
  }

  /**
   * Crea una orden directamente con items proporcionados (sin necesidad de idCarrito)
   * @param idUsuario - ID del usuario autenticado
   * @param items - Array de items con idProducto, cantidad, precioUnitario, nombre
   * @param datosEnvio - Datos de envío
   * @param idMetodoEnvio - ID del método de envío
   * @param idMetodoPago - ID del método de pago
   * @returns Promise con la orden creada
   */
  async createOrdenDirect(
    idUsuario: number,
    items: { idProducto: number; cantidad: number; precioUnitario: number; nombre: string }[],
    datosEnvio: DatosEnvio,
    idMetodoEnvio: number,
    idMetodoPago: number
  ): Promise<any> {
    if (!items || items.length === 0) {
      throw new Error('No hay items en el pedido');
    }

    const numeroOrden = this.generateNumeroOrden();

    const precioEnvio = await prisma.ord_metodos_envio.findUnique({
      where: { id: idMetodoEnvio },
    });

    const envioPrice = precioEnvio ? Number(precioEnvio.precio) : 0;

    const { subtotal, igv, descuento, total } = this.calculateTotalesOrden(
      items.map((item) => ({
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
      })),
      config.igvRate
    );

    const totalFinal = total + envioPrice;

    return prisma.$transaction(async (tx) => {
      const direccionEnvio = await tx.ord_direcciones_envio.create({
        data: {
          id_usuario: idUsuario,
          nombre: datosEnvio.nombre,
          apellido: datosEnvio.apellido,
          direccion: datosEnvio.direccion,
          ciudad: datosEnvio.ciudad,
          departamento: datosEnvio.departamento,
          codigo_postal: datosEnvio.codigo_postal,
          telefono: datosEnvio.telefono,
        },
      });

      const orden = await tx.ord_ordenes.create({
        data: {
          numero_orden: numeroOrden,
          id_usuario: idUsuario,
          id_direccion_envio: direccionEnvio.id,
          id_metodo_envio: idMetodoEnvio,
          id_metodo_pago: idMetodoPago,
          subtotal: subtotal,
          igv: igv,
          descuento: descuento,
          total: totalFinal,
          estado_actual: 'pagada',
          items: {
            create: items.map((item) => ({
              id_producto: item.idProducto,
              cantidad: item.cantidad,
              precio_unitario: item.precioUnitario,
              subtotal: Number(item.precioUnitario) * item.cantidad,
            })),
          },
        },
        select: {
          id: true,
          numero_orden: true,
          subtotal: true,
          igv: true,
          descuento: true,
          total: true,
          estado_actual: true,
          notas: true,
          fecha_creacion: true,
          items: {
            select: {
              id: true,
              cantidad: true,
              precio_unitario: true,
              subtotal: true,
              producto: {
                select: {
                  id: true,
                  nombre: true,
                  precio_venta: true,
                },
              },
            },
          },
          direccion_envio: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              direccion: true,
              ciudad: true,
              departamento: true,
              codigo_postal: true,
              telefono: true,
            },
          },
          metodo_envio: {
            select: {
              id: true,
              nombre: true,
              precio: true,
            },
          },
          metodo_pago: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      const estadoInicial = await tx.ord_estados_orden.findUnique({
        where: { estado: 'pagada' },
      });

      if (estadoInicial) {
        await tx.ord_historial_estados.create({
          data: {
            id_orden: orden.id,
            id_estado: estadoInicial.id,
            id_usuario: idUsuario,
            comentario: 'Pago simulado - Orden pagada',
          },
        });
      }

      return orden;
    });
  }

  /**
   * Obtiene una orden por su ID
   * @param id - ID de la orden
   * @returns Promise con los datos de la orden
   */
  async getOrdenById(id: number): Promise<any> {
    const orden = await prisma.ord_ordenes.findUnique({
      where: { id },
      include: {
        usuario: {
          include: {
            cliente: true,
          },
        },
        items: {
          include: {
            producto: {
              include: {
                imagenes: {
                  where: { es_principal: true },
                  take: 1,
                },
              },
            },
          },
        },
        direccion_envio: true,
        metodo_envio: true,
        metodo_pago: true,
        cupon: true,
        historial_estados: {
          include: {
            estado: true,
            usuario: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        pagos: {
          include: {
            metodo_pago: true,
            transacciones: true,
          },
        },
      },
    });

    if (!orden) {
      throw new Error('Orden no encontrada');
    }

    return orden;
  }

  /**
   * Obtiene una orden por su número
   * @param numero - Número de orden
   * @returns Promise con los datos de la orden
   */
  async getOrdenByNumero(numero: string): Promise<any> {
    const orden = await prisma.ord_ordenes.findUnique({
      where: { numero_orden: numero },
      include: {
        usuario: {
          include: {
            cliente: true,
          },
        },
        items: {
          include: {
            producto: {
              include: {
                imagenes: {
                  where: { es_principal: true },
                  take: 1,
                },
              },
            },
          },
        },
        direccion_envio: true,
        metodo_envio: true,
        metodo_pago: true,
        cupon: true,
        historial_estados: {
          include: {
            estado: true,
            usuario: true,
          },
          orderBy: { created_at: 'desc' },
        },
        pagos: {
          include: {
            metodo_pago: true,
          },
        },
      },
    });

    if (!orden) {
      throw new Error('Orden no encontrada');
    }

    return orden;
  }

  /**
   * Obtiene las órdenes de un usuario específico
   * @param usuarioId - ID del usuario
   * @param filtros - Filtros de consulta
   * @returns Promise con órdenes, total, page y limit
   */
  async getOrdenesByUsuario(usuarioId: number, filtros: OrdenFilters): Promise<{
    ordenes: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filtros.page || config.pagination.defaultPage;
    const limit = filtros.limit || config.pagination.defaultLimit;
    const skip = (page - 1) * limit;

    const where: any = { id_usuario: usuarioId };

    if (filtros.estado) {
      where.estado_actual = filtros.estado;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.fecha_creacion = {};
      if (filtros.fechaDesde) {
        where.fecha_creacion.gte = filtros.fechaDesde;
      }
      if (filtros.fechaHasta) {
        where.fecha_creacion.lte = filtros.fechaHasta;
      }
    }

    if (filtros.busqueda) {
      where.numero_orden = { contains: filtros.busqueda, mode: 'insensitive' };
    }

    const [ordenes, total] = await Promise.all([
      prisma.ord_ordenes.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            include: {
              producto: {
                include: {
                  imagenes: {
                    where: { es_principal: true },
                    take: 1,
                  },
                },
              },
            },
          },
          metodo_envio: true,
        },
        orderBy: { fecha_creacion: 'desc' },
      }),
      prisma.ord_ordenes.count({ where }),
    ]);

    return {
      ordenes,
      total,
      page,
      limit,
    };
  }

  /**
   * Obtiene todas las órdenes con filtros (para admin)
   * @param filtros - Filtros de consulta
   * @returns Promise con órdenes, total, page y limit
   */
  async getAllOrdenes(filtros: OrdenFilters): Promise<{
    ordenes: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filtros.page || config.pagination.defaultPage;
    const limit = filtros.limit || config.pagination.defaultLimit;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filtros.usuarioId) {
      where.id_usuario = filtros.usuarioId;
    }

    if (filtros.estado) {
      where.estado_actual = filtros.estado;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.fecha_creacion = {};
      if (filtros.fechaDesde) {
        where.fecha_creacion.gte = filtros.fechaDesde;
      }
      if (filtros.fechaHasta) {
        where.fecha_creacion.lte = filtros.fechaHasta;
      }
    }

    if (filtros.busqueda) {
      where.OR = [
        { numero_orden: { contains: filtros.busqueda, mode: 'insensitive' } },
        { usuario: { email: { contains: filtros.busqueda, mode: 'insensitive' } } },
        { usuario: { nombre: { contains: filtros.busqueda, mode: 'insensitive' } } },
        { usuario: { apellido: { contains: filtros.busqueda, mode: 'insensitive' } } },
      ];
    }

    const [ordenes, total] = await Promise.all([
      prisma.ord_ordenes.findMany({
        where,
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              id: true,
              email: true,
              nombre: true,
              apellido: true,
            },
          },
          items: true,
          metodo_envio: true,
        },
        orderBy: { fecha_creacion: 'desc' },
      }),
      prisma.ord_ordenes.count({ where }),
    ]);

    return {
      ordenes,
      total,
      page,
      limit,
    };
  }

  /**
   * Actualiza el estado de una orden
   * @param id - ID de la orden
   * @param nuevoEstado - Nuevo estado
   * @param idUsuario - ID del usuario que realiza el cambio
   * @param comentario - Comentario opcional
   * @returns Promise con la orden actualizada
   */
  async updateEstadoOrden(
    id: number,
    nuevoEstado: string,
    idUsuario: number,
    comentario?: string
  ): Promise<any> {
    const orden = await prisma.ord_ordenes.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!orden) {
      throw new Error('Orden no encontrada');
    }

    const estado = await prisma.ord_estados_orden.findUnique({
      where: { estado: nuevoEstado },
    });

    if (!estado) {
      throw new Error('Estado no válido');
    }

    const ordenActualizada = await prisma.$transaction(async (tx) => {
      const updatedOrden = await tx.ord_ordenes.update({
        where: { id },
        data: { estado_actual: nuevoEstado },
        include: {
          usuario: true,
          items: {
            include: {
              producto: true,
            },
          },
          historial_estados: {
            include: {
              estado: true,
            },
          },
        },
      });

      await tx.ord_historial_estados.create({
        data: {
          id_orden: id,
          id_estado: estado.id,
          id_usuario: idUsuario,
          comentario,
        },
      });

      if (nuevoEstado === 'confirmado') {
        for (const item of orden.items) {
          await this.inventarioService.reserveStock(
            item.id_producto,
            item.cantidad
          );
        }
      }

      if (nuevoEstado === 'completado') {
        for (const item of orden.items) {
          await this.inventarioService.confirmStock(
            item.id_producto,
            item.cantidad
          );
        }
      }

      if (nuevoEstado === 'cancelado') {
        for (const item of orden.items) {
          await this.inventarioService.releaseStock(
            item.id_producto,
            item.cantidad
          );
        }
      }

      return updatedOrden;
    });

    return ordenActualizada;
  }

  /**
   * Cancela una orden
   * @param id - ID de la orden
   * @param idUsuario - ID del usuario que cancela
   * @param motivo - Motivo de cancelación
   * @returns Promise con la orden cancelada
   */
  async cancelarOrden(id: number, idUsuario: number, motivo?: string): Promise<any> {
    const orden = await prisma.ord_ordenes.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!orden) {
      throw new Error('Orden no encontrada');
    }

    const estado = await prisma.ord_estados_orden.findUnique({
      where: { estado: 'cancelado' },
    });

    if (!estado) {
      throw new Error('Estado cancelado no encontrado');
    }

    const estadoOrden = await prisma.ord_estados_orden.findFirst({
      where: { estado: orden.estado_actual },
    });

    if (estadoOrden && !estadoOrden.permite_cancelacion) {
      throw new Error('Esta orden no puede ser cancelada');
    }

    return prisma.$transaction(async (tx) => {
      const ordenCancelada = await tx.ord_ordenes.update({
        where: { id },
        data: { estado_actual: 'cancelado' },
        include: {
          items: true,
          historial_estados: {
            include: {
              estado: true,
            },
          },
        },
      });

      await tx.ord_historial_estados.create({
        data: {
          id_orden: id,
          id_estado: estado.id,
          id_usuario: idUsuario,
          comentario: motivo || 'Orden cancelada por el usuario',
        },
      });

      for (const item of orden.items) {
        await this.inventarioService.releaseStock(item.id_producto, item.cantidad);
      }

      return ordenCancelada;
    });
  }

  /**
   * Agrega un registro al historial de estados
   * @param idOrden - ID de la orden
   * @param idEstado - ID del estado
   * @param idUsuario - ID del usuario
   * @param comentario - Comentario opcional
   * @returns Promise con el historial creado
   */
  async addHistorialEstado(
    idOrden: number,
    idEstado: number,
    idUsuario: number,
    comentario?: string
  ): Promise<any> {
    return prisma.ord_historial_estados.create({
      data: {
        id_orden: idOrden,
        id_estado: idEstado,
        id_usuario: idUsuario,
        comentario,
      },
      include: {
        orden: true,
        estado: true,
        usuario: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });
  }

  /**
   * Obtiene todos los estados de orden disponibles
   * @returns Promise con array de estados
   */
  async getEstadosOrden(): Promise<any[]> {
    return prisma.ord_estados_orden.findMany({
      orderBy: { orden: 'asc' },
    });
  }

  /**
   * Calcula los totales de una orden
   * @param items - Array de items con cantidad y precio_unitario
   * @param igvRate - Tasa de IGV (por defecto 0.18)
   * @param descuento - Descuento opcional
   * @returns Objeto con subtotal, igv, descuento y total
   */
  calculateTotalesOrden(
    items: { cantidad: number; precio_unitario: number }[],
    igvRate: number = config.igvRate,
    descuento?: number
  ): OrdenTotales {
    const subtotal = items.reduce(
      (sum, item) => sum + item.cantidad * item.precio_unitario,
      0
    );

    const igv = subtotal * igvRate;

    const descuentoTotal = descuento || 0;

    const total = subtotal + igv - descuentoTotal;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      igv: Math.round(igv * 100) / 100,
      descuento: Math.round(descuentoTotal * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Genera un número de orden único
   * @returns Número de orden generado
   */
  private generateNumeroOrden(): string {
    const fecha = new Date();
    const year = fecha.getFullYear().toString().slice(-2);
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const day = fecha.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();

    return `ORD-${year}${month}${day}-${random}`;
  }
}

export default new OrdenService();
