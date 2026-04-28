import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

/**
 * Interfaz para filtros de productos
 */
export interface ProductoFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  categoria?: string;
  marca?: string;
  precioMin?: number;
  precioMax?: number;
  busqueda?: string;
  destacado?: boolean;
  activo?: boolean;
}

/**
 * Interfaz para datos de producto
 */
export interface ProductoData {
  sku?: string;
  nombre: string;
  slug?: string;
  descripcion_corta?: string;
  descripcion_larga?: string;
  id_categoria: number;
  id_subcategoria?: number;
  id_marca?: number;
  id_unidad_medida?: number;
  precio_costo?: number;
  precio_venta: number;
  precio_oferta?: number;
  fecha_inicio_oferta?: Date;
  fecha_fin_oferta?: Date;
  stock?: number;
  stock_minimo?: number;
  peso?: number;
  ancho?: number;
  alto?: number;
  profundo?: number;
  activo?: boolean;
  destacado?: boolean;
  created_by?: number;
  imagenes?: { url: string; texto_alt?: string; es_principal?: boolean; orden?: number }[];
  atributos?: { id_atributo: number; id_valor?: number }[];
  etiquetas_producto?: { id_etiqueta: number }[];
}

/**
 * Servicio de productos que maneja todas las operaciones CRUD
 * y consultas específicas para el catálogo de productos.
 */
export class ProductoService {
  /**
   * Obtiene todos los productos con paginación y filtros
   * @param filters - Filtros de consulta
   * @returns Promise con productos, total, page y limit
   */
  async getAllProductos(filters: ProductoFilters): Promise<{
    productos: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page || config.pagination.defaultPage;
    const limit = filters.limit || config.pagination.defaultLimit;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.categoria) {
      const categoria = await prisma.cat_categorias.findUnique({
        where: { slug: filters.categoria },
      });
      if (categoria) {
        where.id_categoria = categoria.id;
      }
    }

    if (filters.marca) {
      const marca = await prisma.cat_marcas.findUnique({
        where: { slug: filters.marca },
      });
      if (marca) {
        where.id_marca = marca.id;
      }
    }

    if (filters.destacado !== undefined) {
      where.destacado = filters.destacado;
    }

    if (filters.activo !== undefined) {
      where.activo = filters.activo;
    } else {
      where.activo = true;
    }

    if (filters.precioMin !== undefined || filters.precioMax !== undefined) {
      where.precio_venta = {};
      if (filters.precioMin !== undefined) {
        where.precio_venta.gte = filters.precioMin;
      }
      if (filters.precioMax !== undefined) {
        where.precio_venta.lte = filters.precioMax;
      }
    }

    if (filters.busqueda) {
      where.OR = [
        { nombre: { contains: filters.busqueda, mode: 'insensitive' } },
        { descripcion_corta: { contains: filters.busqueda, mode: 'insensitive' } },
        { descripcion_larga: { contains: filters.busqueda, mode: 'insensitive' } },
        { sku: { contains: filters.busqueda, mode: 'insensitive' } },
      ];
    }

    const [productos, total] = await Promise.all([
      prisma.cat_productos.findMany({
        where,
        skip,
        take: limit,
        include: {
          categoria: true,
          marca: true,
          subcategoria: true,
          imagenes: {
            orderBy: [{ es_principal: 'desc' }, { orden: 'asc' }],
          },
          etiquetas_producto: {
            include: {
              etiqueta: true,
            },
          },
        },
        orderBy: [{ destacado: 'desc' }, { created_at: 'desc' }],
      }),
      prisma.cat_productos.count({ where }),
    ]);

    return {
      productos,
      total,
      page,
      limit,
    };
  }

  /**
   * Obtiene un producto por su ID
   * @param id - ID del producto
   * @returns Promise con los datos del producto
   */
  async getProductoById(id: number): Promise<any> {
    const producto = await prisma.cat_productos.findUnique({
      where: { id },
      include: {
        categoria: true,
        marca: true,
        subcategoria: true,
        unidad_medida: true,
        imagenes: {
          orderBy: [{ es_principal: 'desc' }, { orden: 'asc' }],
        },
        atributos: {
          include: {
            atributo: true,
            valor: true,
          },
        },
        etiquetas_producto: {
          include: {
            etiqueta: true,
          },
        },
        reseñas: {
          where: { activo: true },
          include: {
            cliente: {
              include: {
                usuario: {
                  select: {
                    nombre: true,
                    apellido: true,
                  },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    return producto;
  }

  /**
   * Obtiene un producto por su slug
   * @param slug - Slug del producto
   * @returns Promise con los datos del producto
   */
  async getProductoBySlug(slug: string): Promise<any> {
    const producto = await prisma.cat_productos.findUnique({
      where: { slug },
      include: {
        categoria: true,
        marca: true,
        subcategoria: true,
        unidad_medida: true,
        imagenes: {
          orderBy: [{ es_principal: 'desc' }, { orden: 'asc' }],
        },
        atributos: {
          include: {
            atributo: true,
            valor: true,
          },
        },
        etiquetas_producto: {
          include: {
            etiqueta: true,
          },
        },
        reseñas: {
          where: { activo: true },
          include: {
            cliente: {
              include: {
                usuario: {
                  select: {
                    nombre: true,
                    apellido: true,
                  },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    return producto;
  }

  /**
   * Crea un nuevo producto
   * @param data - Datos del producto
   * @returns Promise con el producto creado
   */
  async createProducto(data: ProductoData): Promise<any> {
    const { imagenes, atributos, etiquetas_producto, ...productoData } = data;

    const producto = await prisma.cat_productos.create({
      data: {
        ...productoData,
        sku: data.sku || `SKU-${Date.now()}`,
        slug: data.slug || this.generateSlug(data.nombre),
        imagenes: imagenes
          ? {
              create: imagenes,
            }
          : undefined,
        atributos: atributos
          ? {
              create: atributos,
            }
          : undefined,
        etiquetas_producto: etiquetas_producto
          ? {
              create: etiquetas_producto,
            }
          : undefined,
      },
      include: {
        categoria: true,
        marca: true,
        subcategoria: true,
        imagenes: true,
        atributos: {
          include: {
            atributo: true,
            valor: true,
          },
        },
        etiquetas_producto: {
          include: {
            etiqueta: true,
          },
        },
      },
    });

    if (data.stock !== undefined && data.stock > 0) {
      await prisma.inv_stock_producto.upsert({
        where: { id_producto: producto.id },
        update: {
          cantidad: data.stock,
          disponible: data.stock,
        },
        create: {
          id_producto: producto.id,
          cantidad: data.stock,
          reservado: 0,
          disponible: data.stock,
        },
      });
    }

    return producto;
  }

  /**
   * Actualiza un producto existente
   * @param id - ID del producto
   * @param data - Datos a actualizar
   * @returns Promise con el producto actualizado
   */
  async updateProducto(id: number, data: Partial<ProductoData>): Promise<any> {
    const existingProducto = await prisma.cat_productos.findUnique({
      where: { id },
    });

    if (!existingProducto) {
      throw new Error('Producto no encontrado');
    }

    const { imagenes, atributos, etiquetas_producto, ...productoData } = data;

    if (productoData.nombre && !productoData.slug) {
      productoData.slug = this.generateSlug(productoData.nombre);
    }

    if (imagenes) {
      await prisma.cat_imagenes_producto.deleteMany({
        where: { id_producto: id },
      });
    }

    if (atributos) {
      await prisma.cat_producto_atributo.deleteMany({
        where: { id_producto: id },
      });
    }

    if (etiquetas_producto) {
      await prisma.cat_producto_etiqueta.deleteMany({
        where: { id_producto: id },
      });
    }

    const producto = await prisma.cat_productos.update({
      where: { id },
      data: {
        ...productoData,
        imagenes: imagenes
          ? {
              create: imagenes,
            }
          : undefined,
        atributos: atributos
          ? {
              create: atributos,
            }
          : undefined,
        etiquetas_producto: etiquetas_producto
          ? {
              create: etiquetas_producto,
            }
          : undefined,
      },
      include: {
        categoria: true,
        marca: true,
        subcategoria: true,
        imagenes: {
          orderBy: [{ es_principal: 'desc' }, { orden: 'asc' }],
        },
        atributos: {
          include: {
            atributo: true,
            valor: true,
          },
        },
        etiquetas_producto: {
          include: {
            etiqueta: true,
          },
        },
      },
    });

    return producto;
  }

  /**
   * Elimina un producto (soft delete cambiando activo a false)
   * @param id - ID del producto
   */
  async deleteProducto(id: number): Promise<void> {
    const producto = await prisma.cat_productos.findUnique({
      where: { id },
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    await prisma.cat_productos.update({
      where: { id },
      data: { activo: false },
    });
  }

  /**
   * Obtiene productos destacados
   * @param limit - Límite de productos a retornar
   * @returns Promise con array de productos destacados
   */
  async getProductosDestacados(limit: number = 10): Promise<any[]> {
    return prisma.cat_productos.findMany({
      where: {
        destacado: true,
        activo: true,
      },
      take: limit,
      include: {
        categoria: true,
        marca: true,
        imagenes: {
          where: { es_principal: true },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Obtiene productos relacionados de la misma categoría
   * @param productoId - ID del producto base
   * @param limit - Límite de productos a retornar
   * @returns Promise con array de productos relacionados
   */
  async getProductosRelacionados(productoId: number, limit: number = 5): Promise<any[]> {
    const producto = await prisma.cat_productos.findUnique({
      where: { id: productoId },
      select: { id_categoria: true },
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    return prisma.cat_productos.findMany({
      where: {
        id_categoria: producto.id_categoria,
        id: { not: productoId },
        activo: true,
      },
      take: limit,
      include: {
        categoria: true,
        marca: true,
        imagenes: {
          where: { es_principal: true },
          take: 1,
        },
      },
      orderBy: { precio_venta: 'asc' },
    });
  }

  /**
   * Busca productos por texto
   * @param busqueda - Texto a buscar
   * @param limit - Límite de productos a retornar
   * @returns Promise con array de productos que coinciden
   */
  async searchProductos(busqueda: string, limit: number = 20): Promise<any[]> {
    return prisma.cat_productos.findMany({
      where: {
        OR: [
          { nombre: { contains: busqueda, mode: 'insensitive' } },
          { descripcion_corta: { contains: busqueda, mode: 'insensitive' } },
          { descripcion_larga: { contains: busqueda, mode: 'insensitive' } },
          { sku: { contains: busqueda, mode: 'insensitive' } },
        ],
        activo: true,
      },
      take: limit,
      include: {
        categoria: true,
        marca: true,
        imagenes: {
          where: { es_principal: true },
          take: 1,
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * Obtiene el stock actual de un producto
   * @param productoId - ID del producto
   * @returns Promise con datos del stock
   */
  async getStock(productoId: number): Promise<number> {
    const stock = await prisma.inv_stock_producto.findUnique({
      where: { id_producto: productoId },
    });

    if (!stock) {
      const producto = await prisma.cat_productos.findUnique({
        where: { id: productoId },
        select: { stock: true },
      });

      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      return producto.stock;
    }

    return stock.disponible;
  }

  /**
   * Genera un slug único a partir del nombre
   * @param nombre - Nombre del producto
   * @returns Slug generado
   */
  private generateSlug(nombre: string): string {
    let slug = nombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return `${slug}-${Date.now()}`;
  }

  async getAllCategorias(): Promise<any[]> {
    const categorias = await prisma.cat_categorias.findMany({
      where: { activo: true, id_categoria_padre: null },
      orderBy: { nombre: 'asc' },
    });
    return categorias;
  }

  async getAllMarcas(): Promise<any[]> {
    const marcas = await prisma.cat_marcas.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
    return marcas;
  }
}

export default new ProductoService();
