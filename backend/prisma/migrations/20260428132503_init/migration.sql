-- CreateTable
CREATE TABLE "cat_categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "slug" VARCHAR(100) NOT NULL,
    "imagen" VARCHAR(500),
    "id_categoria_padre" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,

    CONSTRAINT "cat_categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_subcategorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "slug" VARCHAR(100) NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cat_subcategorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_marcas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "logo" VARCHAR(500),
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cat_marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_unidades_medida" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "abreviatura" VARCHAR(10) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cat_unidades_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_etiquetas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "color" VARCHAR(20),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_etiquetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_productos" (
    "id" SERIAL NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "descripcion_corta" VARCHAR(500),
    "descripcion_larga" TEXT,
    "id_categoria" INTEGER NOT NULL,
    "id_subcategoria" INTEGER,
    "id_marca" INTEGER,
    "id_unidad_medida" INTEGER NOT NULL DEFAULT 1,
    "precio_costo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "precio_venta" DECIMAL(12,2) NOT NULL,
    "precio_oferta" DECIMAL(12,2),
    "fecha_inicio_oferta" TIMESTAMP(3),
    "fecha_fin_oferta" TIMESTAMP(3),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "peso" DECIMAL(8,2),
    "ancho" DECIMAL(8,2),
    "alto" DECIMAL(8,2),
    "profundo" DECIMAL(8,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,

    CONSTRAINT "cat_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_imagenes_producto" (
    "id" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "texto_alt" VARCHAR(200),
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_imagenes_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_atributos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,

    CONSTRAINT "cat_atributos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_valores_atributo" (
    "id" SERIAL NOT NULL,
    "id_atributo" INTEGER NOT NULL,
    "valor" VARCHAR(100) NOT NULL,
    "codigo" VARCHAR(50),
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cat_valores_atributo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_producto_atributo" (
    "id" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "id_atributo" INTEGER NOT NULL,
    "id_valor" INTEGER,

    CONSTRAINT "cat_producto_atributo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_producto_etiqueta" (
    "id" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "id_etiqueta" INTEGER NOT NULL,

    CONSTRAINT "cat_producto_etiqueta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_carritos" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER,
    "sesion_id" VARCHAR(100),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ord_carritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_items_carrito" (
    "id" SERIAL NOT NULL,
    "id_carrito" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "id_atributo" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ord_items_carrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_cupones" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "uso_minimo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "uso_limite" INTEGER,
    "uso_actual" INTEGER NOT NULL DEFAULT 0,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_cupones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_ordenes" (
    "id" SERIAL NOT NULL,
    "numero_orden" VARCHAR(30) NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_cupon" INTEGER,
    "id_direccion_envio" INTEGER,
    "id_metodo_envio" INTEGER,
    "id_metodo_pago" INTEGER,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "igv" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "estado_actual" VARCHAR(30) NOT NULL DEFAULT 'pendiente_pago',
    "notas" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ord_ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_items_orden" (
    "id" SERIAL NOT NULL,
    "id_orden" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ord_items_orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_direcciones_envio" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER,
    "id_cliente" INTEGER,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "direccion" VARCHAR(300) NOT NULL,
    "ciudad" VARCHAR(100) NOT NULL,
    "departamento" VARCHAR(100),
    "codigo_postal" VARCHAR(20),
    "telefono" VARCHAR(20),
    "es_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_direcciones_envio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_metodos_envio" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(12,2) NOT NULL,
    "tiempo_entrega" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ord_metodos_envio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_metodos_pago" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "tipo" VARCHAR(30) NOT NULL,
    "requiere_verificacion" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ord_metodos_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_pagos" (
    "id" SERIAL NOT NULL,
    "id_orden" INTEGER NOT NULL,
    "id_metodo_pago" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "estado" VARCHAR(30) NOT NULL,
    "referencia" VARCHAR(100),
    "fecha_pago" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_transacciones_pago" (
    "id" SERIAL NOT NULL,
    "id_pago" INTEGER NOT NULL,
    "id_orden" INTEGER NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "estado" VARCHAR(30) NOT NULL,
    "datos_respuesta" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_transacciones_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_estados_orden" (
    "id" SERIAL NOT NULL,
    "estado" VARCHAR(30) NOT NULL,
    "descripcion" VARCHAR(100) NOT NULL,
    "color" VARCHAR(20),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "permite_cancelacion" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ord_estados_orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_historial_estados" (
    "id" SERIAL NOT NULL,
    "id_orden" INTEGER NOT NULL,
    "id_estado" INTEGER NOT NULL,
    "id_usuario" INTEGER,
    "comentario" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_historial_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_stock_producto" (
    "id" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "reservado" INTEGER NOT NULL DEFAULT 0,
    "disponible" INTEGER NOT NULL DEFAULT 0,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inv_stock_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_movimientos_inventario" (
    "id" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "id_stock" INTEGER NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" VARCHAR(100),
    "id_orden" INTEGER,
    "id_ajuste" INTEGER,
    "seg_usuariosId" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_ajustes" (
    "id" SERIAL NOT NULL,
    "motivo" VARCHAR(200) NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_aprobado_por" INTEGER,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "seg_usuariosId" INTEGER,

    CONSTRAINT "inv_ajustes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_detalle_ajuste" (
    "id" SERIAL NOT NULL,
    "id_ajuste" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad_anterior" INTEGER NOT NULL,
    "cantidad_nueva" INTEGER NOT NULL,
    "diferencia" INTEGER NOT NULL,
    "id_unidad_medida" INTEGER,

    CONSTRAINT "inv_detalle_ajuste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_proveedores" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "ruc" VARCHAR(20),
    "contacto" VARCHAR(100),
    "telefono" VARCHAR(20),
    "email" VARCHAR(100),
    "direccion" VARCHAR(300),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_ordenes_compra" (
    "id" SERIAL NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "id_proveedor" INTEGER NOT NULL,
    "fecha_esperada" TIMESTAMP(3),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "igv" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inv_ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_detalle_orden_compra" (
    "id" SERIAL NOT NULL,
    "id_orden_compra" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "inv_detalle_orden_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_recepciones" (
    "id" SERIAL NOT NULL,
    "id_orden_compra" INTEGER NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "fecha_recepcion" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inv_recepciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_clientes" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "telefono" VARCHAR(20),
    "fecha_nacimiento" TIMESTAMP(3),
    "genero" VARCHAR(20),
    "tipo_documento" VARCHAR(20),
    "numero_documento" VARCHAR(20),
    "segmento" VARCHAR(30),
    "total_gastado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ultima_compra" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cli_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_direcciones" (
    "id" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100),
    "direccion" VARCHAR(300) NOT NULL,
    "ciudad" VARCHAR(100) NOT NULL,
    "departamento" VARCHAR(100),
    "codigo_postal" VARCHAR(20),
    "telefono" VARCHAR(20),
    "es_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_direcciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_lista_deseos" (
    "id" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "es_publica" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_lista_deseos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_items_lista_deseos" (
    "id" SERIAL NOT NULL,
    "id_lista" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_items_lista_deseos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_resenas_producto" (
    "id" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "titulo" VARCHAR(200),
    "comentario" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_resenas_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_historial_navegacion" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER,
    "sesion_id" VARCHAR(100),
    "id_producto" INTEGER,
    "url" VARCHAR(500) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_historial_navegacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_usuarios" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(20),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "email_verificado" BOOLEAN NOT NULL DEFAULT false,
    "token_recovery" VARCHAR(255),
    "fecha_token_recovery" TIMESTAMP(3),
    "last_login" TIMESTAMP(3),
    "intentos_login" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seg_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(200),
    "nivel" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seg_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_permisos" (
    "id" SERIAL NOT NULL,
    "modulo" VARCHAR(50) NOT NULL,
    "accion" VARCHAR(30) NOT NULL,
    "descripcion" VARCHAR(200),

    CONSTRAINT "seg_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_rol_permiso" (
    "id" SERIAL NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "id_permiso" INTEGER NOT NULL,

    CONSTRAINT "seg_rol_permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_usuario_rol" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seg_usuario_rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_refresh_tokens" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token" VARCHAR(2000) NOT NULL,
    "expira" TIMESTAMP(3) NOT NULL,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "seg_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monedas" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(5) NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "simbolo" VARCHAR(5) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "monedas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_cambio" (
    "id" SERIAL NOT NULL,
    "id_moneda_origen" INTEGER NOT NULL,
    "id_moneda_destino" INTEGER NOT NULL,
    "tasa" DECIMAL(12,6) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipo_cambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "id" SERIAL NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" VARCHAR(200),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_registro" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER,
    "accion" VARCHAR(50) NOT NULL,
    "modulo" VARCHAR(50) NOT NULL,
    "tabla" VARCHAR(100),
    "registro_id" INTEGER,
    "datos_anteriores" TEXT,
    "datos_nuevos" TEXT,
    "ip" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_registro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cat_categorias_slug_key" ON "cat_categorias"("slug");

-- CreateIndex
CREATE INDEX "cat_categorias_slug_idx" ON "cat_categorias"("slug");

-- CreateIndex
CREATE INDEX "cat_categorias_activo_idx" ON "cat_categorias"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "cat_subcategorias_slug_key" ON "cat_subcategorias"("slug");

-- CreateIndex
CREATE INDEX "cat_subcategorias_slug_idx" ON "cat_subcategorias"("slug");

-- CreateIndex
CREATE INDEX "cat_subcategorias_id_categoria_idx" ON "cat_subcategorias"("id_categoria");

-- CreateIndex
CREATE UNIQUE INDEX "cat_marcas_slug_key" ON "cat_marcas"("slug");

-- CreateIndex
CREATE INDEX "cat_marcas_slug_idx" ON "cat_marcas"("slug");

-- CreateIndex
CREATE INDEX "cat_marcas_activo_idx" ON "cat_marcas"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "cat_etiquetas_slug_key" ON "cat_etiquetas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cat_productos_sku_key" ON "cat_productos"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "cat_productos_slug_key" ON "cat_productos"("slug");

-- CreateIndex
CREATE INDEX "cat_productos_sku_idx" ON "cat_productos"("sku");

-- CreateIndex
CREATE INDEX "cat_productos_slug_idx" ON "cat_productos"("slug");

-- CreateIndex
CREATE INDEX "cat_productos_id_categoria_idx" ON "cat_productos"("id_categoria");

-- CreateIndex
CREATE INDEX "cat_productos_id_marca_idx" ON "cat_productos"("id_marca");

-- CreateIndex
CREATE INDEX "cat_productos_activo_idx" ON "cat_productos"("activo");

-- CreateIndex
CREATE INDEX "cat_productos_precio_venta_idx" ON "cat_productos"("precio_venta");

-- CreateIndex
CREATE INDEX "cat_imagenes_producto_id_producto_idx" ON "cat_imagenes_producto"("id_producto");

-- CreateIndex
CREATE INDEX "cat_valores_atributo_id_atributo_idx" ON "cat_valores_atributo"("id_atributo");

-- CreateIndex
CREATE INDEX "cat_producto_atributo_id_producto_idx" ON "cat_producto_atributo"("id_producto");

-- CreateIndex
CREATE UNIQUE INDEX "cat_producto_atributo_id_producto_id_atributo_key" ON "cat_producto_atributo"("id_producto", "id_atributo");

-- CreateIndex
CREATE UNIQUE INDEX "cat_producto_etiqueta_id_producto_id_etiqueta_key" ON "cat_producto_etiqueta"("id_producto", "id_etiqueta");

-- CreateIndex
CREATE INDEX "ord_carritos_id_usuario_idx" ON "ord_carritos"("id_usuario");

-- CreateIndex
CREATE INDEX "ord_carritos_sesion_id_idx" ON "ord_carritos"("sesion_id");

-- CreateIndex
CREATE INDEX "ord_items_carrito_id_carrito_idx" ON "ord_items_carrito"("id_carrito");

-- CreateIndex
CREATE INDEX "ord_items_carrito_id_producto_idx" ON "ord_items_carrito"("id_producto");

-- CreateIndex
CREATE UNIQUE INDEX "ord_cupones_codigo_key" ON "ord_cupones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ord_ordenes_numero_orden_key" ON "ord_ordenes"("numero_orden");

-- CreateIndex
CREATE INDEX "ord_ordenes_numero_orden_idx" ON "ord_ordenes"("numero_orden");

-- CreateIndex
CREATE INDEX "ord_ordenes_id_usuario_idx" ON "ord_ordenes"("id_usuario");

-- CreateIndex
CREATE INDEX "ord_ordenes_estado_actual_idx" ON "ord_ordenes"("estado_actual");

-- CreateIndex
CREATE INDEX "ord_ordenes_fecha_creacion_idx" ON "ord_ordenes"("fecha_creacion");

-- CreateIndex
CREATE INDEX "ord_items_orden_id_orden_idx" ON "ord_items_orden"("id_orden");

-- CreateIndex
CREATE INDEX "ord_items_orden_id_producto_idx" ON "ord_items_orden"("id_producto");

-- CreateIndex
CREATE INDEX "ord_direcciones_envio_id_usuario_idx" ON "ord_direcciones_envio"("id_usuario");

-- CreateIndex
CREATE INDEX "ord_pagos_id_orden_idx" ON "ord_pagos"("id_orden");

-- CreateIndex
CREATE INDEX "ord_transacciones_pago_id_pago_idx" ON "ord_transacciones_pago"("id_pago");

-- CreateIndex
CREATE UNIQUE INDEX "ord_estados_orden_estado_key" ON "ord_estados_orden"("estado");

-- CreateIndex
CREATE INDEX "ord_historial_estados_id_orden_idx" ON "ord_historial_estados"("id_orden");

-- CreateIndex
CREATE UNIQUE INDEX "inv_stock_producto_id_producto_key" ON "inv_stock_producto"("id_producto");

-- CreateIndex
CREATE INDEX "inv_stock_producto_disponible_idx" ON "inv_stock_producto"("disponible");

-- CreateIndex
CREATE INDEX "inv_movimientos_inventario_id_producto_idx" ON "inv_movimientos_inventario"("id_producto");

-- CreateIndex
CREATE INDEX "inv_movimientos_inventario_tipo_idx" ON "inv_movimientos_inventario"("tipo");

-- CreateIndex
CREATE INDEX "inv_movimientos_inventario_created_at_idx" ON "inv_movimientos_inventario"("created_at");

-- CreateIndex
CREATE INDEX "inv_detalle_ajuste_id_ajuste_idx" ON "inv_detalle_ajuste"("id_ajuste");

-- CreateIndex
CREATE UNIQUE INDEX "inv_ordenes_compra_numero_key" ON "inv_ordenes_compra"("numero");

-- CreateIndex
CREATE INDEX "inv_ordenes_compra_numero_idx" ON "inv_ordenes_compra"("numero");

-- CreateIndex
CREATE INDEX "inv_ordenes_compra_estado_idx" ON "inv_ordenes_compra"("estado");

-- CreateIndex
CREATE INDEX "inv_detalle_orden_compra_id_orden_compra_idx" ON "inv_detalle_orden_compra"("id_orden_compra");

-- CreateIndex
CREATE UNIQUE INDEX "inv_recepciones_numero_key" ON "inv_recepciones"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "cli_clientes_id_usuario_key" ON "cli_clientes"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "cli_clientes_email_key" ON "cli_clientes"("email");

-- CreateIndex
CREATE INDEX "cli_clientes_email_idx" ON "cli_clientes"("email");

-- CreateIndex
CREATE INDEX "cli_clientes_segmento_idx" ON "cli_clientes"("segmento");

-- CreateIndex
CREATE INDEX "cli_direcciones_id_cliente_idx" ON "cli_direcciones"("id_cliente");

-- CreateIndex
CREATE INDEX "cli_lista_deseos_id_cliente_idx" ON "cli_lista_deseos"("id_cliente");

-- CreateIndex
CREATE UNIQUE INDEX "cli_items_lista_deseos_id_lista_id_producto_key" ON "cli_items_lista_deseos"("id_lista", "id_producto");

-- CreateIndex
CREATE INDEX "cli_resenas_producto_id_producto_idx" ON "cli_resenas_producto"("id_producto");

-- CreateIndex
CREATE INDEX "cli_resenas_producto_calificacion_idx" ON "cli_resenas_producto"("calificacion");

-- CreateIndex
CREATE INDEX "cli_historial_navegacion_id_usuario_idx" ON "cli_historial_navegacion"("id_usuario");

-- CreateIndex
CREATE INDEX "cli_historial_navegacion_sesion_id_idx" ON "cli_historial_navegacion"("sesion_id");

-- CreateIndex
CREATE UNIQUE INDEX "seg_usuarios_email_key" ON "seg_usuarios"("email");

-- CreateIndex
CREATE INDEX "seg_usuarios_email_idx" ON "seg_usuarios"("email");

-- CreateIndex
CREATE INDEX "seg_usuarios_estado_idx" ON "seg_usuarios"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "seg_roles_nombre_key" ON "seg_roles"("nombre");

-- CreateIndex
CREATE INDEX "seg_roles_nombre_idx" ON "seg_roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "seg_permisos_modulo_accion_key" ON "seg_permisos"("modulo", "accion");

-- CreateIndex
CREATE UNIQUE INDEX "seg_rol_permiso_id_rol_id_permiso_key" ON "seg_rol_permiso"("id_rol", "id_permiso");

-- CreateIndex
CREATE UNIQUE INDEX "seg_usuario_rol_id_usuario_id_rol_key" ON "seg_usuario_rol"("id_usuario", "id_rol");

-- CreateIndex
CREATE UNIQUE INDEX "seg_refresh_tokens_token_key" ON "seg_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "seg_refresh_tokens_token_idx" ON "seg_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "seg_refresh_tokens_id_usuario_idx" ON "seg_refresh_tokens"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "monedas_codigo_key" ON "monedas"("codigo");

-- CreateIndex
CREATE INDEX "tipo_cambio_fecha_idx" ON "tipo_cambio"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_sistema_clave_key" ON "configuracion_sistema"("clave");

-- CreateIndex
CREATE INDEX "configuracion_sistema_clave_idx" ON "configuracion_sistema"("clave");

-- CreateIndex
CREATE INDEX "auditoria_registro_id_usuario_idx" ON "auditoria_registro"("id_usuario");

-- CreateIndex
CREATE INDEX "auditoria_registro_modulo_idx" ON "auditoria_registro"("modulo");

-- CreateIndex
CREATE INDEX "auditoria_registro_tabla_idx" ON "auditoria_registro"("tabla");

-- CreateIndex
CREATE INDEX "auditoria_registro_created_at_idx" ON "auditoria_registro"("created_at");

-- AddForeignKey
ALTER TABLE "cat_categorias" ADD CONSTRAINT "cat_categorias_id_categoria_padre_fkey" FOREIGN KEY ("id_categoria_padre") REFERENCES "cat_categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_subcategorias" ADD CONSTRAINT "cat_subcategorias_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "cat_categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "cat_categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_id_subcategoria_fkey" FOREIGN KEY ("id_subcategoria") REFERENCES "cat_subcategorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_id_marca_fkey" FOREIGN KEY ("id_marca") REFERENCES "cat_marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_id_unidad_medida_fkey" FOREIGN KEY ("id_unidad_medida") REFERENCES "cat_unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_imagenes_producto" ADD CONSTRAINT "cat_imagenes_producto_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_valores_atributo" ADD CONSTRAINT "cat_valores_atributo_id_atributo_fkey" FOREIGN KEY ("id_atributo") REFERENCES "cat_atributos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_atributo" ADD CONSTRAINT "cat_producto_atributo_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_atributo" ADD CONSTRAINT "cat_producto_atributo_id_atributo_fkey" FOREIGN KEY ("id_atributo") REFERENCES "cat_atributos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_atributo" ADD CONSTRAINT "cat_producto_atributo_id_valor_fkey" FOREIGN KEY ("id_valor") REFERENCES "cat_valores_atributo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_etiqueta" ADD CONSTRAINT "cat_producto_etiqueta_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "cat_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_etiqueta" ADD CONSTRAINT "cat_producto_etiqueta_id_etiqueta_fkey" FOREIGN KEY ("id_etiqueta") REFERENCES "cat_etiquetas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_carritos" ADD CONSTRAINT "ord_carritos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_carrito" ADD CONSTRAINT "ord_items_carrito_id_carrito_fkey" FOREIGN KEY ("id_carrito") REFERENCES "ord_carritos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_carrito" ADD CONSTRAINT "ord_items_carrito_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_carrito" ADD CONSTRAINT "ord_items_carrito_id_atributo_fkey" FOREIGN KEY ("id_atributo") REFERENCES "cat_atributos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "seg_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_id_cupon_fkey" FOREIGN KEY ("id_cupon") REFERENCES "ord_cupones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_id_direccion_envio_fkey" FOREIGN KEY ("id_direccion_envio") REFERENCES "ord_direcciones_envio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_id_metodo_envio_fkey" FOREIGN KEY ("id_metodo_envio") REFERENCES "ord_metodos_envio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_id_metodo_pago_fkey" FOREIGN KEY ("id_metodo_pago") REFERENCES "ord_metodos_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_orden" ADD CONSTRAINT "ord_items_orden_id_orden_fkey" FOREIGN KEY ("id_orden") REFERENCES "ord_ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_orden" ADD CONSTRAINT "ord_items_orden_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_direcciones_envio" ADD CONSTRAINT "ord_direcciones_envio_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cli_clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_pagos" ADD CONSTRAINT "ord_pagos_id_orden_fkey" FOREIGN KEY ("id_orden") REFERENCES "ord_ordenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_pagos" ADD CONSTRAINT "ord_pagos_id_metodo_pago_fkey" FOREIGN KEY ("id_metodo_pago") REFERENCES "ord_metodos_pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_transacciones_pago" ADD CONSTRAINT "ord_transacciones_pago_id_pago_fkey" FOREIGN KEY ("id_pago") REFERENCES "ord_pagos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_transacciones_pago" ADD CONSTRAINT "ord_transacciones_pago_id_orden_fkey" FOREIGN KEY ("id_orden") REFERENCES "ord_ordenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_historial_estados" ADD CONSTRAINT "ord_historial_estados_id_orden_fkey" FOREIGN KEY ("id_orden") REFERENCES "ord_ordenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_historial_estados" ADD CONSTRAINT "ord_historial_estados_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "ord_estados_orden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_historial_estados" ADD CONSTRAINT "ord_historial_estados_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_stock_producto" ADD CONSTRAINT "inv_stock_producto_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_movimientos_inventario" ADD CONSTRAINT "inv_movimientos_inventario_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_movimientos_inventario" ADD CONSTRAINT "inv_movimientos_inventario_id_stock_fkey" FOREIGN KEY ("id_stock") REFERENCES "inv_stock_producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_movimientos_inventario" ADD CONSTRAINT "inv_movimientos_inventario_seg_usuariosId_fkey" FOREIGN KEY ("seg_usuariosId") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_ajustes" ADD CONSTRAINT "inv_ajustes_seg_usuariosId_fkey" FOREIGN KEY ("seg_usuariosId") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_detalle_ajuste" ADD CONSTRAINT "inv_detalle_ajuste_id_ajuste_fkey" FOREIGN KEY ("id_ajuste") REFERENCES "inv_ajustes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_detalle_ajuste" ADD CONSTRAINT "inv_detalle_ajuste_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_ordenes_compra" ADD CONSTRAINT "inv_ordenes_compra_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "inv_proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_detalle_orden_compra" ADD CONSTRAINT "inv_detalle_orden_compra_id_orden_compra_fkey" FOREIGN KEY ("id_orden_compra") REFERENCES "inv_ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_detalle_orden_compra" ADD CONSTRAINT "inv_detalle_orden_compra_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_recepciones" ADD CONSTRAINT "inv_recepciones_id_orden_compra_fkey" FOREIGN KEY ("id_orden_compra") REFERENCES "inv_ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_clientes" ADD CONSTRAINT "cli_clientes_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_direcciones" ADD CONSTRAINT "cli_direcciones_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cli_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_lista_deseos" ADD CONSTRAINT "cli_lista_deseos_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cli_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_items_lista_deseos" ADD CONSTRAINT "cli_items_lista_deseos_id_lista_fkey" FOREIGN KEY ("id_lista") REFERENCES "cli_lista_deseos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_items_lista_deseos" ADD CONSTRAINT "cli_items_lista_deseos_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_resenas_producto" ADD CONSTRAINT "cli_resenas_producto_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cli_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_resenas_producto" ADD CONSTRAINT "cli_resenas_producto_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_rol_permiso" ADD CONSTRAINT "seg_rol_permiso_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "seg_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_rol_permiso" ADD CONSTRAINT "seg_rol_permiso_id_permiso_fkey" FOREIGN KEY ("id_permiso") REFERENCES "seg_permisos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_usuario_rol" ADD CONSTRAINT "seg_usuario_rol_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "seg_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_usuario_rol" ADD CONSTRAINT "seg_usuario_rol_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "seg_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_refresh_tokens" ADD CONSTRAINT "seg_refresh_tokens_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "seg_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_registro" ADD CONSTRAINT "auditoria_registro_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
