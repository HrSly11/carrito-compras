import api from './api';

export interface CarritoItemProducto {
  id: number;
  nombre: string;
  slug: string;
  precio: number;
  imagenes?: { url: string; es_principal: boolean }[];
}

export interface CarritoItemAtributo {
  id: number;
  nombre: string;
  valor: string;
}

export interface CarritoItem {
  id: number;
  cantidad: number;
  precio_unitario: number;
  producto: CarritoItemProducto;
  atributo?: CarritoItemAtributo;
}

export interface Carrito {
  id: number;
  id_usuario?: number;
  sesion_id?: string;
  estado: string;
  items: CarritoItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CarritoTotales {
  subtotal: number;
  igv: number;
  descuento: number;
  total: number;
}

export interface CuponDescuento {
  id: number;
  codigo: string;
  tipo: 'porcentaje' | 'monto';
  valor: number;
  descuento: number;
}

export interface CarritoResponse {
  carrito: Carrito;
  items: CarritoItem[];
  totales: CarritoTotales;
}

export interface CuponResponse {
  descuento: number;
  cupon: CuponDescuento;
}

class CarritoService {
  async getCarrito(): Promise<CarritoResponse> {
    const response = await api.get<CarritoResponse>('/carrito');
    return response.data;
  }

  async addItem(idProducto: number, cantidad: number, idAtributo?: number): Promise<any> {
    const response = await api.post('/carrito/items', {
      idProducto,
      cantidad,
      idAtributo,
    });
    return response.data;
  }

  async updateItem(idItem: number, cantidad: number): Promise<any> {
    const response = await api.patch(`/carrito/items/${idItem}`, { cantidad });
    return response.data;
  }

  async removeItem(idItem: number): Promise<void> {
    await api.delete(`/carrito/items/${idItem}`);
  }

  async clearCarrito(): Promise<void> {
    await api.delete('/carrito');
  }

  async applyCupon(codigo: string): Promise<CuponResponse> {
    const response = await api.post<CuponResponse>('/carrito/cupon', { codigo });
    return response.data;
  }

  async removeCupon(): Promise<void> {
    await api.delete('/carrito/cupon');
  }
}

export default new CarritoService();