import api from './api';

export interface InventarioProducto {
  id: number;
  productoId: number;
  nombreProducto: string;
  sku: string;
  stockActual: number;
  stockReservado: number;
  stockDisponible: number;
  umbralBajoStock: number;
  estado: 'disponible' | 'bajo_stock' | 'agotado' | 'reservado';
}

export interface MovimientoInventario {
  id: number;
  productoId: number;
  productoNombre: string;
  tipo: 'entrada' | 'salida' | 'ajuste' | 'reserva' | 'desreserva';
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo?: string;
  usuarioNombre: string;
  createdAt: string;
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

export interface GetInventarioParams {
  page?: number;
  limit?: number;
  estado?: string;
  productoId?: number;
}

export interface GetMovimientosParams {
  page?: number;
  limit?: number;
  productoId?: number;
  tipo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface AjusteInventario {
  productoId: number;
  cantidad: number;
  tipo: 'suma' | 'resta';
  motivo: string;
}

class InventarioService {
  async getInventario(params: GetInventarioParams = {}): Promise<IPaginatedResponse<InventarioProducto>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params.page || 1));
    queryParams.append('limit', String(params.limit || 10));
    if (params.estado === 'low') queryParams.append('conStockBajo', 'true');

    const response = await api.get<{ success: boolean; data: any }>(`/inventario/stock?${queryParams.toString()}`);
    return response.data.data || { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
  }

  async getProductoInventario(productoId: number): Promise<InventarioProducto> {
    const response = await api.get<{ success: boolean; data: InventarioProducto }>(`/inventario/stock/producto/${productoId}`);
    return response.data.data;
  }

  async getMovimientos(params: GetMovimientosParams = {}): Promise<IPaginatedResponse<MovimientoInventario>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params.page || 1));
    queryParams.append('limit', String(params.limit || 10));
    if (params.tipo && params.tipo.trim()) queryParams.append('tipo', params.tipo);
    if (params.fechaDesde) queryParams.append('fechaDesde', params.fechaDesde);
    if (params.fechaHasta) queryParams.append('fechaHasta', params.fechaHasta);

    const response = await api.get<{ success: boolean; data: any }>(`/inventario/movimientos?${queryParams.toString()}`);
    return response.data.data || { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
  }

  async getProductosBajoStock(): Promise<InventarioProducto[]> {
    const response = await api.get<{ success: boolean; data: any }>('/inventario/alertas');
    return response.data.data || [];
  }

  async getInventarioStats(): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>('/inventario/stats');
    return response.data.data;
  }

  async getAll(params: { page?: number; limit?: number; filter?: string } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.filter === 'low') queryParams.append('conStockBajo', 'true');
    if (params.filter === 'out') queryParams.append('stockCero', 'true');

    const response = await api.get<{ success: boolean; data: any }>(`/inventario/stock?${queryParams.toString()}`);
    return response.data.data;
  }

  async ajustarInventario(data: AjusteInventario): Promise<InventarioProducto> {
    const response = await api.post<{ success: boolean; data: InventarioProducto }>('/inventario/ajustes', data);
    return response.data.data;
  }
}

export default new InventarioService();
