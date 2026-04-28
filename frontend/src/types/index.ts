export interface IProducto {
  id: number
  sku: string
  nombre: string
  slug: string
  descripcion?: string
  descripcion_corta?: string
  descripcion_larga?: string
  precio_venta: number
  precio_venta_original?: number
  precio_oferta?: number
  precio_anterior?: number
  stock: number
  imagenes: IProductoImage[]
  categoria: IProductoCategoria
  marca?: IProductoMarca
  atributos?: IProductoAtributo[]
  activo: boolean
  destacado: boolean
  createdAt?: string
  updatedAt?: string
}

export interface IProductoImage {
  id: number
  url: string
  es_principal: boolean
}

export interface IProductoCategoria {
  id: number
  nombre: string
  slug: string
}

export interface IProductoMarca {
  id: number
  nombre: string
  slug: string
}

export interface IProductoAtributo {
  id: number
  nombre: string
  valor: string
}

export interface ICarritoItem {
  id?: number
  id_producto: number
  cantidad: number
  precio_unitario: number
  producto?: IProducto
}

export interface IOrdenItem {
  id: number
  id_producto: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  producto?: IProducto
}

export interface IDireccionEnvio {
  id?: number
  nombre: string
  apellido: string
  telefono: string
  direccion: string
  ciudad: string
  departamento?: string
  codigo_postal?: string
  referencias?: string
}

export interface IMetodoEnvio {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  tiempo_entrega?: string
}

export interface IMetodoPago {
  id: number
  nombre: string
  descripcion?: string
  tipo: string
}

export interface IOrden {
  id: number
  numero_orden: string
  total: number
  estado_actual: string
  fecha_creacion: string
  items: IOrdenItem[]
  direccion_envio?: IDireccionEnvio
  metodo_envio?: IMetodoEnvio
  metodo_pago?: IMetodoPago
}

export interface IApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

export interface IPaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface User {
  id: number
  email: string
  nombre: string
  apellido: string
  telefono?: string
  roles: string[]
}