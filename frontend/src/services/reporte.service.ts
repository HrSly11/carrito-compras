import api from './api';

export interface FechaRango {
  desde?: string;
  hasta?: string;
}

class ReporteService {
  async getVentas(rango?: FechaRango): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>('/reportes/ventas', { params: rango });
    return response.data.data;
  }

  async getOrdenes(rango?: FechaRango, page = 1, limit = 50): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>('/reportes/ordenes', { params: { ...rango, page, limit } });
    return response.data.data;
  }

  async getInventario(): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>('/reportes/inventario');
    return response.data.data;
  }

  async getStockAlertas(): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>('/reportes/stock_alertas');
    return response.data.data;
  }

  async getClientes(rango?: FechaRango): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>('/reportes/clientes', { params: rango });
    return response.data.data;
  }

  async getRentabilidad(): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>('/reportes/rentabilidad');
    return response.data.data;
  }

  async getVentasCategoria(rango?: FechaRango): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>('/reportes/ventas_categoria', { params: rango });
    return response.data.data;
  }

  async getComportamiento(): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>('/reportes/comportamiento');
    return response.data.data;
  }
}

export default new ReporteService();
