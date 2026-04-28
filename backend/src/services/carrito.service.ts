import { PrismaClient, Decimal } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

/**
 * Interfaz para datos del carrito
 */
export interface CarritoData {
  id_usuario?: number | null;
  sesion_id?: string | null;
}

/**
 * Interfaz para agregar item al carrito
 */
export interface AddItemData {
  idCarrito: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number | Decimal;
  idAtributo?: number;
}

/**
 * Interfaz para actualizar cantidad
 */
export interface UpdateCantidadData {
  idItem: number;
  cantidad: number;
}

/**
 * Interfaz para resultado de applyCupon
 */
export interface CuponResult {
  descuento: Decimal;
  cupon: any;
}

/**
 * Interfaz para totales calculados
 */
export interface TotalsResult {
  subtotal: Decimal;
  igv: Decimal;
  descuento: Decimal;
  total: Decimal;
}

/**
 * Servicio de carrito de compras que maneja todas las operaciones
 * relacionadas con el carrito, sus items y cupones.
 */
export class CarritoService {
  /**
   * Obtiene el carrito activo de un usuario o sesión
   * @param usuarioId - ID del usuario (puede ser null)
   * @param sesionId - ID de sesión (puede ser null)
   * @returns Promise con datos del carrito y sus items
   */
  async getCarrito(usuarioId: number | null, sesionId: string | null): Promise<any> {
    let carrito = await prisma.ord_carritos.findFirst({
      where: {
        estado: 'activo',
        ...(usuarioId ? { id_usuario: usuarioId } : { sesion_id: sesionId }),
      },
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
            atributo: true,
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!carrito && usuarioId) {
      carrito = await prisma.ord_carritos.findFirst({
        where: {
          estado: 'activo',
          id_usuario: null,
          sesion_id: sesionId,
        },
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
              atributo: true,
            },
            orderBy: { created_at: 'asc' },
          },
        },
      });
    }

    if (!carrito) {
      carrito = await prisma.ord_carritos.create({
        data: {
          id_usuario: usuarioId,
          sesion_id: sesionId,
          estado: 'activo',
        },
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
              atributo: true,
            },
          },
        },
      });
    }

    return carrito;
  }

  /**
   * Agrega un item al carrito o actualiza la cantidad si ya existe
   * @param idCarrito - ID del carrito
   * @param idProducto - ID del producto
   * @param cantidad - Cantidad a agregar
   * @param precioUnitario - Precio unitario del producto
   * @param idAtributo - ID del atributo opcional
   * @returns Promise con el item agregado o actualizado
   */
  async addItem(
    idCarrito: number,
    idProducto: number,
    cantidad: number,
    precioUnitario: number | Decimal,
    idAtributo?: number
  ): Promise<any> {
    const producto = await prisma.cat_productos.findUnique({
      where: { id: idProducto },
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    if (!producto.activo) {
      throw new Error('El producto no está disponible');
    }

    const existingItem = await prisma.ord_items_carrito.findFirst({
      where: {
        id_carrito: idCarrito,
        id_producto: idProducto,
        id_atributo: idAtributo || null,
      },
    });

    if (existingItem) {
      const nuevaCantidad = existingItem.cantidad + cantidad;

      return prisma.ord_items_carrito.update({
        where: { id: existingItem.id },
        data: {
          cantidad: nuevaCantidad,
          precio_unitario: precioUnitario as Decimal,
        },
        include: {
          producto: {
            include: {
              imagenes: {
                where: { es_principal: true },
                take: 1,
              },
            },
          },
          atributo: true,
        },
      });
    }

    return prisma.ord_items_carrito.create({
      data: {
        id_carrito: idCarrito,
        id_producto: idProducto,
        cantidad,
        precio_unitario: precioUnitario as Decimal,
        id_atributo: idAtributo,
      },
      include: {
        producto: {
          include: {
            imagenes: {
              where: { es_principal: true },
              take: 1,
            },
          },
        },
        atributo: true,
      },
    });
  }

  /**
   * Actualiza la cantidad de un item en el carrito
   * @param idItem - ID del item
   * @param cantidad - Nueva cantidad
   * @returns Promise con el item actualizado
   */
  async updateItemCantidad(idItem: number, cantidad: number): Promise<any> {
    if (cantidad <= 0) {
      return this.removeItem(idItem);
    }

    const item = await prisma.ord_items_carrito.findUnique({
      where: { id: idItem },
    });

    if (!item) {
      throw new Error('Item no encontrado');
    }

    return prisma.ord_items_carrito.update({
      where: { id: idItem },
      data: { cantidad },
      include: {
        producto: {
          include: {
            imagenes: {
              where: { es_principal: true },
              take: 1,
            },
          },
        },
        atributo: true,
      },
    });
  }

  /**
   * Elimina un item del carrito
   * @param idItem - ID del item a eliminar
   */
  async removeItem(idItem: number): Promise<void> {
    await prisma.ord_items_carrito.delete({
      where: { id: idItem },
    });
  }

  /**
   * Limpia todos los items de un carrito
   * @param idCarrito - ID del carrito
   */
  async clearCarrito(idCarrito: number): Promise<void> {
    await prisma.ord_items_carrito.deleteMany({
      where: { id_carrito: idCarrito },
    });

    await prisma.ord_carritos.update({
      where: { id: idCarrito },
      data: {},
    });
  }

  /**
   * Fusiona el carrito de sesión con el carrito del usuario
   * @param usuarioId - ID del usuario autenticado
   * @param sesionId - ID de la sesión guest
   * @returns Promise con el carrito fusionado
   */
  async mergeCarritos(usuarioId: number, sesionId: string): Promise<any> {
    const [carritoUsuario, carritoSesion] = await Promise.all([
      prisma.ord_carritos.findFirst({
        where: { id_usuario: usuarioId, estado: 'activo' },
        include: { items: true },
      }),
      prisma.ord_carritos.findFirst({
        where: { sesion_id: sesionId, estado: 'activo' },
        include: { items: true },
      }),
    ]);

    if (!carritoSesion || carritoSesion.items.length === 0) {
      return carritoUsuario;
    }

    if (!carritoUsuario) {
      await prisma.ord_carritos.update({
        where: { id: carritoSesion.id },
        data: { id_usuario: usuarioId },
      });

      return this.getCarrito(usuarioId, null);
    }

    for (const item of carritoSesion.items) {
      const existingItem = await prisma.ord_items_carrito.findFirst({
        where: {
          id_carrito: carritoUsuario.id,
          id_producto: item.id_producto,
          id_atributo: item.id_atributo,
        },
      });

      if (existingItem) {
        await prisma.ord_items_carrito.update({
          where: { id: existingItem.id },
          data: { cantidad: existingItem.cantidad + item.cantidad },
        });
      } else {
        await prisma.ord_items_carrito.create({
          data: {
            id_carrito: carritoUsuario.id,
            id_producto: item.id_producto,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            id_atributo: item.id_atributo,
          },
        });
      }
    }

    await prisma.ord_items_carrito.deleteMany({
      where: { id_carrito: carritoSesion.id },
    });

    await prisma.ord_carritos.delete({
      where: { id: carritoSesion.id },
    });

    return this.getCarrito(usuarioId, null);
  }

  /**
   * Obtiene el conteo de items en el carrito
   * @param usuarioId - ID del usuario (puede ser null)
   * @param sesionId - ID de sesión (puede ser null)
   * @returns Promise con el número total de items
   */
  async getCarritoCount(usuarioId: number | null, sesionId: string | null): Promise<number> {
    const carrito = await this.getCarrito(usuarioId, sesionId);

    return carrito.items.reduce((total: number, item: any) => total + item.cantidad, 0);
  }

  /**
   * Aplica un cupón de descuento al carrito
   * @param idCarrito - ID del carrito
   * @param codigo - Código del cupón
   * @returns Promise con el descuento aplicado y datos del cupón
   */
  async applyCupon(idCarrito: number, codigo: string): Promise<CuponResult> {
    const cupon = await prisma.ord_cupones.findUnique({
      where: { codigo },
    });

    if (!cupon) {
      throw new Error('Cupón no encontrado');
    }

    if (!cupon.activo) {
      throw new Error('El cupón no está activo');
    }

    const ahora = new Date();
    if (cupon.fecha_inicio > ahora || cupon.fecha_fin < ahora) {
      throw new Error('El cupón ha expirado o aún no está vigente');
    }

    if (cupon.uso_limite !== null && cupon.uso_actual >= cupon.uso_limite) {
      throw new Error('El cupón ha alcanzado su límite de uso');
    }

    const carrito = await prisma.ord_carritos.findUnique({
      where: { id: idCarrito },
      include: { items: true },
    });

    if (!carrito) {
      throw new Error('Carrito no encontrado');
    }

    const subtotal = carrito.items.reduce(
      (sum, item) => sum + Number(item.precio_unitario) * item.cantidad,
      0
    );

    if (subtotal < Number(cupon.uso_minimo)) {
      throw new Error(`El monto mínimo para usar este cupón es ${cupon.uso_minimo}`);
    }

    let descuento: Decimal;

    if (cupon.tipo === 'porcentaje') {
      descuento = new Decimal(subtotal * Number(cupon.valor) / 100);
    } else {
      descuento = cupon.valor;
    }

    if (descuento > subtotal) {
      descuento = new Decimal(subtotal);
    }

    return {
      descuento,
      cupon,
    };
  }

  /**
   * Elimina el cupón aplicado al carrito
   * @param idCarrito - ID del carrito
   */
  async removeCupon(idCarrito: number): Promise<void> {
    await prisma.ord_carritos.update({
      where: { id: idCarrito },
      data: {},
    });
  }

  /**
   * Calcula los totales del carrito incluyendo subtotal, IGV y descuento
   * @param idCarrito - ID del carrito
   * @returns Promise con los totales calculados
   */
  async calculateTotals(idCarrito: number): Promise<TotalsResult> {
    const carrito = await prisma.ord_carritos.findUnique({
      where: { id: idCarrito },
      include: { items: true },
    });

    if (!carrito) {
      throw new Error('Carrito no encontrado');
    }

    const subtotal = carrito.items.reduce(
      (sum, item) => sum + Number(item.precio_unitario) * item.cantidad,
      0
    );

    const igv = subtotal * config.igvRate;

    const descuento = 0;

    const total = subtotal + igv - descuento;

    return {
      subtotal: new Decimal(subtotal),
      igv: new Decimal(igv),
      descuento: new Decimal(descuento),
      total: new Decimal(total),
    };
  }
}

export default new CarritoService();
