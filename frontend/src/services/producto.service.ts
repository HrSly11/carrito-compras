import api from './api';
import { IProducto } from '@/types';

export type { IProducto };

export interface IProductoImage {
  id: number;
  url: string;
  es_principal: boolean;
}

export interface IProductoAtributo {
  id: number;
  nombre: string;
  valor: string;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IPaginatedResponse<T> {
  data: T[];
  meta: IPaginationMeta;
}

export interface GetProductosParams {
  page?: number;
  limit?: number;
  categoria?: string;
  marca?: string;
  precioMin?: number;
  precioMax?: number;
  busqueda?: string;
  destacado?: boolean;
}

class ProductoService {
  async getProductos(params: GetProductosParams = {}): Promise<IPaginatedResponse<IProducto>> {
    const cleanParams: Record<string, string | number | boolean | undefined> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    }
    const response = await api.get<{ success: boolean; message: string; data: IProducto[]; meta: IPaginationMeta }>('/productos', { params: cleanParams });
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  }

  async getProductoById(id: number): Promise<IProducto> {
    const response = await api.get<IProducto>(`/productos/${id}`);
    return response.data;
  }

  async getProductoBySlug(slug: string): Promise<IProducto> {
    const response = await api.get<IProducto>(`/productos/slug/${slug}`);
    return response.data;
  }

  async getProductosDestacados(): Promise<IProducto[]> {
    const response = await api.get<{ success: boolean; message: string; data: IProducto[] }>('/productos/destacados');
    return response.data.data;
  }

  async searchProductos(busqueda: string): Promise<IProducto[]> {
    const response = await api.get<IProducto[]>('/productos/buscar', { params: { q: busqueda } });
    return response.data;
  }

  async createProducto(data: Partial<IProducto>): Promise<IProducto> {
    const response = await api.post<IProducto>('/productos', data);
    return response.data;
  }

  async updateProducto(id: number, data: Partial<IProducto>): Promise<IProducto> {
    const response = await api.put<IProducto>(`/productos/${id}`, data);
    return response.data;
  }

  async deleteProducto(id: number): Promise<void> {
    await api.delete(`/productos/${id}`);
  }
}

export default new ProductoService();