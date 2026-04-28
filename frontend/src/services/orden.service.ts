import api from './api';

export interface DireccionEnvio {
  id: number;
  direccion: string;
  ciudad: string;
  departamento: string;
  codigo_postal: string;
  telefono: string;
}

export interface MetodoEnvio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tiempo_entrega: string;
}

export interface MetodoPago {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface OrdenItem {
  id: number;
  cantidad: number;
  precio_unitario: number;
  producto: {
    id: number;
    nombre: string;
    slug: string;
    imagenes?: { url: string; es_principal: boolean }[];
  };
  atributo?: {
    id: number;
    nombre: string;
    valor: string;
  };
}

export interface Orden {
  id: number;
  numero: string;
  estado: string;
  id_usuario: number;
  usuario?: {
    id: number;
    nombre: string;
    email: string;
  };
  direccion_envio?: DireccionEnvio;
  metodo_envio?: MetodoEnvio;
  metodo_pago?: MetodoPago;
  items: OrdenItem[];
  subtotal: number;
  igv: number;
  descuento: number;
  costo_envio: number;
  total: number;
  notas?: string;
  createdAt: string;
  updatedAt: string;
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

export interface DireccionEnvioData {
  nombre: string;
  apellido: string;
  direccion: string;
  ciudad: string;
  departamento?: string;
  codigoPostal: string;
  telefono: string;
}

export interface CreateOrdenData {
  idCarrito: number;
  direccionEnvio: DireccionEnvioData;
  idMetodoEnvio: number;
  idMetodoPago: number;
  notas?: string;
}

export interface OrdenItemDirect {
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  nombre: string;
}

export interface CreateOrdenDirectData {
  items: OrdenItemDirect[];
  direccionEnvio: DireccionEnvioData;
  idMetodoEnvio: number;
  idMetodoPago: number;
  notas?: string;
}

export interface GetMisOrdenesParams {
  page?: number;
  limit?: number;
  estado?: string;
}

export interface GetAllOrdenesParams {
  page?: number;
  limit?: number;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface EstadoOrden {
  id: number;
  nombre: string;
  descripcion: string;
  color: string;
}

class OrdenService {
  async createOrden(data: CreateOrdenData): Promise<Orden> {
    const response = await api.post<{ success: boolean; data: Orden }>('/ordenes', data);
    return response.data.data;
  }

  async createOrdenDirect(data: CreateOrdenDirectData): Promise<Orden> {
    const response = await api.post<{ success: boolean; data: Orden }>('/ordenes/directo', data);
    return response.data.data;
  }

  async getMisOrdenes(params: GetMisOrdenesParams = {}): Promise<IPaginatedResponse<Orden>> {
    const response = await api.get<{ success: boolean; data: any[]; message?: string; meta: IPaginationMeta }>('/ordenes/mis-ordenes', { params });
    const ordenes = response.data.data.map((o: any) => ({
      id: o.id,
      numero: o.numero_orden,
      estado: o.estado_actual,
      id_usuario: o.id_usuario,
      subtotal: typeof o.subtotal === 'string' ? parseFloat(o.subtotal) : o.subtotal,
      igv: typeof o.igv === 'string' ? parseFloat(o.igv) : o.igv,
      descuento: typeof o.descuento === 'string' ? parseFloat(o.descuento) : o.descuento,
      total: typeof o.total === 'string' ? parseFloat(o.total) : o.total,
      createdAt: o.fecha_creacion,
      updatedAt: o.fecha_actualizacion,
      items: (o.items || []).map((item: any) => ({
        id: item.id,
        cantidad: item.cantidad,
        precio_unitario: typeof item.precio_unitario === 'string' ? parseFloat(item.precio_unitario) : item.precio_unitario,
        producto: {
          id: item.producto?.id,
          nombre: item.producto?.nombre,
          slug: item.producto?.slug,
          imagenes: item.producto?.imagenes || [],
        },
      })),
      metodo_envio: o.metodo_envio,
    }));
    return { data: ordenes, meta: response.data.meta };
  }

  async getOrdenById(id: number): Promise<Orden> {
    const response = await api.get<{ success: boolean; data: Orden }>(`/ordenes/${id}`);
    return response.data.data;
  }

  async getOrdenByNumero(numero: string): Promise<Orden> {
    const response = await api.get<{ success: boolean; data: any }>(`/ordenes/numero/${numero}`);
    const o = response.data.data;
    return {
      ...o,
      numero: o.numero_orden,
      estado: o.estado_actual,
      subtotal: typeof o.subtotal === 'string' ? parseFloat(o.subtotal) : o.subtotal,
      igv: typeof o.igv === 'string' ? parseFloat(o.igv) : o.igv,
      descuento: typeof o.descuento === 'string' ? parseFloat(o.descuento) : o.descuento,
      total: typeof o.total === 'string' ? parseFloat(o.total) : o.total,
      createdAt: o.fecha_creacion,
      updatedAt: o.fecha_actualizacion,
      items: (o.items || []).map((item: any) => ({
        id: item.id,
        cantidad: item.cantidad,
        precio_unitario: typeof item.precio_unitario === 'string' ? parseFloat(item.precio_unitario) : item.precio_unitario,
        producto: {
          id: item.producto?.id,
          nombre: item.producto?.nombre,
          slug: item.producto?.slug,
          imagenes: item.producto?.imagenes || [],
        },
      })),
      metodo_envio: o.metodo_envio,
      metodo_pago: o.metodo_pago,
      direccion_envio: o.direccion_envio,
    };
  }

  async getAllOrdenes(params?: GetAllOrdenesParams): Promise<IPaginatedResponse<Orden>> {
    const response = await api.get<{ success: boolean; data: any[]; message?: string; meta: IPaginationMeta }>('/ordenes', { params });
    const ordenes = (response.data.data || []).map((o: any) => ({
      ...o,
      numero: o.numero_orden,
      estado: o.estado_actual,
      subtotal: typeof o.subtotal === 'string' ? parseFloat(o.subtotal) : o.subtotal,
      igv: typeof o.igv === 'string' ? parseFloat(o.igv) : o.igv,
      descuento: typeof o.descuento === 'string' ? parseFloat(o.descuento) : o.descuento,
      total: typeof o.total === 'string' ? parseFloat(o.total) : o.total,
      createdAt: o.fecha_creacion,
      updatedAt: o.fecha_actualizacion,
      usuario: o.usuario,
    }));
    return { data: ordenes, meta: response.data.meta };
  }

  async updateEstadoOrden(id: number, estado: string): Promise<Orden> {
    const response = await api.patch<{ success: boolean; data: Orden }>(`/ordenes/${id}/estado`, { estado });
    return response.data.data;
  }

  async cancelarOrden(id: number, motivo?: string): Promise<Orden> {
    const response = await api.post<{ success: boolean; data: Orden }>(`/ordenes/${id}/cancelar`, { motivo });
    return response.data.data;
  }

  async getEstadosOrden(): Promise<EstadoOrden[]> {
    const response = await api.get<{ success: boolean; data: EstadoOrden[] }>('/ordenes/estados');
    return response.data.data;
  }
}

export default new OrdenService();