import api from './api';

export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  segmento: 'nuevo' | 'recurrente' | 'inactivo' | 'vip';
  totalGastado: number;
  ordenesCount: number;
  ultimaCompra?: string;
  createdAt: string;
}

export interface DetalleCliente extends Cliente {
  ordenes: {
    id: number;
    numero: string;
    total: number;
    estado: string;
    createdAt: string;
  }[];
  direcciones: {
    id: number;
    nombre: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    telefono: string;
  }[];
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

export interface GetClientesParams {
  page?: number;
  limit?: number;
  segmento?: string;
  busqueda?: string;
}

class ClienteService {
  async getClientes(params: GetClientesParams = {}): Promise<IPaginatedResponse<Cliente>> {
    const response = await api.get<{ success: boolean; data: Cliente[]; message?: string; meta: IPaginationMeta }>('/clientes', { params });
    return {
      data: response.data.data || [],
      meta: response.data.meta || { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    };
  }

  async getClienteById(id: number): Promise<DetalleCliente> {
    const response = await api.get<{ success: boolean; data: DetalleCliente }>(`/clientes/${id}`);
    return response.data.data;
  }

  async searchClientes(busqueda: string): Promise<Cliente[]> {
    const response = await api.get<{ success: boolean; data: Cliente[] }>('/clientes/buscar', { params: { q: busqueda } });
    return response.data.data;
  }

  async getSegmentos(): Promise<{ segmento: string; cantidad: number }[]> {
    const response = await api.get<{ success: boolean; data: { segmento: string; cantidad: number }[] }>('/clientes/segmentos');
    return response.data.data;
  }
}

export default new ClienteService();
