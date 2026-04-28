-- =====================================================
-- SCRIPT SQL: carrito_compras
-- Base de datos para sistema de carrito de compras
-- =====================================================

-- Crear base de datos
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'carrito_compras')
BEGIN
    CREATE DATABASE carrito_compras;
END
GO

USE carrito_compras;
GO

-- =====================================================
-- TABLAS DE CATÁLOGO: CATEGORÍAS Y MARCAS
-- =====================================================

-- Categorías de productos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cat_categorias')
BEGIN
    CREATE TABLE cat_categorias (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        nombre                 VARCHAR(100)   NOT NULL,
        descripcion            TEXT           NULL,
        slug                   VARCHAR(100)   NOT NULL UNIQUE,
        imagen                 VARCHAR(500)   NULL,
        id_categoria_padre     INT            NULL,
        activo                 BIT            NOT NULL DEFAULT 1,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        updated_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        created_by             INT            NULL,
        CONSTRAINT FK_cat_categorias_padre FOREIGN KEY (id_categoria_padre) REFERENCES cat_categorias(id)
    );

    CREATE INDEX IX_cat_categorias_slug ON cat_categorias(slug);
    CREATE INDEX IX_cat_categorias_activo ON cat_categorias(activo);

    EXEC sp_addextendedproperty 'MS_Description', 'Categorías de productos del catálogo', 'SCHEMA', 'dbo', 'TABLE', 'cat_categorias';
END
GO

-- Marcas de productos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cat_marcas')
BEGIN
    CREATE TABLE cat_marcas (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        nombre                 VARCHAR(100)   NOT NULL,
        slug                   VARCHAR(100)   NOT NULL UNIQUE,
        logo                   VARCHAR(500)   NULL,
        descripcion            TEXT           NULL,
        activo                 BIT            NOT NULL DEFAULT 1,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        updated_at             DATETIME       NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_cat_marcas_slug ON cat_marcas(slug);
    CREATE INDEX IX_cat_marcas_activo ON cat_marcas(activo);

    EXEC sp_addextendedproperty 'MS_Description', 'Marcas de productos', 'SCHEMA', 'dbo', 'TABLE', 'cat_marcas';
END
GO

-- Subcategorías
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cat_subcategorias')
BEGIN
    CREATE TABLE cat_subcategorias (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        nombre                 VARCHAR(100)   NOT NULL,
        descripcion            TEXT           NULL,
        slug                   VARCHAR(100)   NOT NULL UNIQUE,
        id_categoria           INT            NOT NULL,
        activo                 BIT            NOT NULL DEFAULT 1,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        updated_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_cat_subcategorias_categoria FOREIGN KEY (id_categoria) REFERENCES cat_categorias(id)
    );

    CREATE INDEX IX_cat_subcategorias_slug ON cat_subcategorias(slug);
    CREATE INDEX IX_cat_subcategorias_id_categoria ON cat_subcategorias(id_categoria);

    EXEC sp_addextendedproperty 'MS_Description', 'Subcategorías de productos', 'SCHEMA', 'dbo', 'TABLE', 'cat_subcategorias';
END
GO

-- Unidades de medida
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cat_unidades_medida')
BEGIN
    CREATE TABLE cat_unidades_medida (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        nombre                 VARCHAR(50)    NOT NULL,
        abreviatura            VARCHAR(10)    NOT NULL,
        tipo                   VARCHAR(20)    NOT NULL,
        activo                 BIT            NOT NULL DEFAULT 1
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Unidades de medida para productos', 'SCHEMA', 'dbo', 'TABLE', 'cat_unidades_medida';
END
GO

-- Etiquetas de productos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cat_etiquetas')
BEGIN
    CREATE TABLE cat_etiquetas (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        nombre                 VARCHAR(50)    NOT NULL,
        slug                   VARCHAR(50)    NOT NULL UNIQUE,
        color                  VARCHAR(20)    NULL,
        activo                 BIT            NOT NULL DEFAULT 1,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE()
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Etiquetas para clasificar productos', 'SCHEMA', 'dbo', 'TABLE', 'cat_etiquetas';
END
GO

-- =====================================================
-- TABLAS DE CATÁLOGO: PRODUCTOS
-- =====================================================

-- Productos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cat_productos')
BEGIN
    CREATE TABLE cat_productos (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        sku                    VARCHAR(50)    NOT NULL UNIQUE,
        nombre                 VARCHAR(200)   NOT NULL,
        slug                   VARCHAR(200)   NOT NULL UNIQUE,
        descripcion_corta      VARCHAR(500)   NULL,
        descripcion_larga      TEXT           NULL,
        id_categoria           INT            NOT NULL,
        id_subcategoria        INT            NULL,
        id_marca               INT            NULL,
        id_unidad_medida       INT            NOT NULL DEFAULT 1,
        precio_costo           DECIMAL(12,2)  NOT NULL DEFAULT 0,
        precio_venta           DECIMAL(12,2)  NOT NULL,
        precio_oferta          DECIMAL(12,2)  NULL,
        fecha_inicio_oferta    DATETIME       NULL,
        fecha_fin_oferta       DATETIME       NULL,
        stock                   INT            NOT NULL DEFAULT 0,
        stock_minimo            INT            NOT NULL DEFAULT 0,
        peso                   DECIMAL(8,2)   NULL,
        ancho                  DECIMAL(8,2)   NULL,
        alto                   DECIMAL(8,2)   NULL,
        profundo               DECIMAL(8,2)   NULL,
        activo                 BIT            NOT NULL DEFAULT 1,
        destacado              BIT            NOT NULL DEFAULT 0,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        updated_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        created_by             INT            NULL,
        CONSTRAINT FK_cat_productos_categoria FOREIGN KEY (id_categoria) REFERENCES cat_categorias(id),
        CONSTRAINT FK_cat_productos_subcategoria FOREIGN KEY (id_subcategoria) REFERENCES cat_subcategorias(id),
        CONSTRAINT FK_cat_productos_marca FOREIGN KEY (id_marca) REFERENCES cat_marcas(id),
        CONSTRAINT FK_cat_productos_unidad_medida FOREIGN KEY (id_unidad_medida) REFERENCES cat_unidades_medida(id),
        CONSTRAINT CK_cat_productos_stock CHECK (stock >= 0),
        CONSTRAINT CK_cat_productos_precio_venta CHECK (precio_venta >= 0),
        CONSTRAINT CK_cat_productos_precio_costo CHECK (precio_costo >= 0)
    );

    CREATE INDEX IX_cat_productos_sku ON cat_productos(sku);
    CREATE INDEX IX_cat_productos_slug ON cat_productos(slug);
    CREATE INDEX IX_cat_productos_id_categoria ON cat_productos(id_categoria);
    CREATE INDEX IX_cat_productos_id_marca ON cat_productos(id_marca);
    CREATE INDEX IX_cat_productos_activo ON cat_productos(activo);
    CREATE INDEX IX_cat_productos_precio_venta ON cat_productos(precio_venta);

    EXEC sp_addextendedproperty 'MS_Description', 'Productos del catálogo', 'SCHEMA', 'dbo', 'TABLE', 'cat_productos';
END
GO

-- Imágenes de productos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cat_imagenes_producto')
BEGIN
    CREATE TABLE cat_imagenes_producto (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_producto            INT            NOT NULL,
        url                    VARCHAR(500)   NOT NULL,
        texto_alt              VARCHAR(200)   NULL,
        es_principal           BIT            NOT NULL DEFAULT 0,
        orden                  INT            NOT NULL DEFAULT 0,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_cat_imagenes_producto_producto FOREIGN KEY (id_producto) REFERENCES cat_productos(id) ON DELETE CASCADE
    );

    CREATE INDEX IX_cat_imagenes_producto_id_producto ON cat_imagenes_producto(id_producto);

    EXEC sp_addextendedproperty 'MS_Description', 'Imágenes asociadas a productos', 'SCHEMA', 'dbo', 'TABLE', 'cat_imagenes_producto';
END
GO

-- Atributos de productos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cat_atributos')
BEGIN
    CREATE TABLE cat_atributos (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        nombre                 VARCHAR(50)    NOT NULL,
        tipo                   VARCHAR(20)    NOT NULL
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Atributos configurables para productos (color, tamaño, etc)', 'SCHEMA', 'dbo', 'TABLE', 'cat_atributos';
END
GO

-- Valores de atributos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cat_valores_atributo')
BEGIN
    CREATE TABLE cat_valores_atributo (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_atributo            INT            NOT NULL,
        valor                  VARCHAR(100)   NOT NULL,
        codigo                 VARCHAR(50)    NULL,
        orden                  INT            NOT NULL DEFAULT 0,
        CONSTRAINT FK_cat_valores_atributo_atributo FOREIGN KEY (id_atributo) REFERENCES cat_atributos(id) ON DELETE CASCADE
    );

    CREATE INDEX IX_cat_valores_atributo_id_atributo ON cat_valores_atributo(id_atributo);

    EXEC sp_addextendedproperty 'MS_Description', 'Valores posibles para cada atributo', 'SCHEMA', 'dbo', 'TABLE', 'cat_valores_atributo';
END
GO

-- Relación producto-atributo
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cat_producto_atributo')
BEGIN
    CREATE TABLE cat_producto_atributo (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_producto            INT            NOT NULL,
        id_atributo            INT            NOT NULL,
        id_valor               INT            NULL,
        CONSTRAINT FK_cat_producto_atributo_producto FOREIGN KEY (id_producto) REFERENCES cat_productos(id) ON DELETE CASCADE,
        CONSTRAINT FK_cat_producto_atributo_atributo FOREIGN KEY (id_atributo) REFERENCES cat_atributos(id),
        CONSTRAINT FK_cat_producto_atributo_valor FOREIGN KEY (id_valor) REFERENCES cat_valores_atributo(id),
        CONSTRAINT UQ_cat_producto_atributo_producto_atributo UNIQUE (id_producto, id_atributo)
    );

    CREATE INDEX IX_cat_producto_atributo_id_producto ON cat_producto_atributo(id_producto);

    EXEC sp_addextendedproperty 'MS_Description', 'Relación entre productos y sus atributos', 'SCHEMA', 'dbo', 'TABLE', 'cat_producto_atributo';
END
GO

-- Relación producto-etiqueta
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cat_producto_etiqueta')
BEGIN
    CREATE TABLE cat_producto_etiqueta (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_producto            INT            NOT NULL,
        id_etiqueta            INT            NOT NULL,
        CONSTRAINT FK_cat_producto_etiqueta_producto FOREIGN KEY (id_producto) REFERENCES cat_productos(id) ON DELETE CASCADE,
        CONSTRAINT FK_cat_producto_etiqueta_etiqueta FOREIGN KEY (id_etiqueta) REFERENCES cat_etiquetas(id),
        CONSTRAINT UQ_cat_producto_etiqueta_producto_etiqueta UNIQUE (id_producto, id_etiqueta)
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Relación entre productos y etiquetas', 'SCHEMA', 'dbo', 'TABLE', 'cat_producto_etiqueta';
END
GO

-- =====================================================
-- TABLAS DE SEGURIDAD
-- =====================================================

-- Roles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'seg_roles')
BEGIN
    CREATE TABLE seg_roles (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        nombre                 VARCHAR(50)    NOT NULL UNIQUE,
        descripcion            VARCHAR(200)   NULL,
        nivel                  INT            NOT NULL DEFAULT 0,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_seg_roles_nombre ON seg_roles(nombre);

    EXEC sp_addextendedproperty 'MS_Description', 'Roles del sistema', 'SCHEMA', 'dbo', 'TABLE', 'seg_roles';
END
GO

-- Permisos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'seg_permisos')
BEGIN
    CREATE TABLE seg_permisos (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        modulo                 VARCHAR(50)    NOT NULL,
        accion                 VARCHAR(30)    NOT NULL,
        descripcion            VARCHAR(200)   NULL,
        CONSTRAINT UQ_seg_permisos_modulo_accion UNIQUE (modulo, accion)
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Permisos del sistema (módulo + acción)', 'SCHEMA', 'dbo', 'TABLE', 'seg_permisos';
END
GO

-- Usuarios
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'seg_usuarios')
BEGIN
    CREATE TABLE seg_usuarios (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        email                  VARCHAR(200)   NOT NULL UNIQUE,
        password_hash          VARCHAR(255)   NOT NULL,
        nombre                 VARCHAR(100)   NOT NULL,
        apellido               VARCHAR(100)   NOT NULL,
        telefono               VARCHAR(20)    NULL,
        estado                 VARCHAR(20)    NOT NULL DEFAULT 'activo',
        email_verificado        BIT            NOT NULL DEFAULT 0,
        token_recovery         VARCHAR(255)   NULL,
        fecha_token_recovery   DATETIME       NULL,
        last_login             DATETIME       NULL,
        intentos_login         INT            NOT NULL DEFAULT 0,
        bloqueado_hasta        DATETIME       NULL,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        updated_at             DATETIME       NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_seg_usuarios_email ON seg_usuarios(email);
    CREATE INDEX IX_seg_usuarios_estado ON seg_usuarios(estado);

    EXEC sp_addextendedproperty 'MS_Description', 'Usuarios del sistema', 'SCHEMA', 'dbo', 'TABLE', 'seg_usuarios';
END
GO

-- Relación usuario-rol
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'seg_usuario_rol')
BEGIN
    CREATE TABLE seg_usuario_rol (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_usuario             INT            NOT NULL,
        id_rol                 INT            NOT NULL,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_seg_usuario_rol_usuario FOREIGN KEY (id_usuario) REFERENCES seg_usuarios(id),
        CONSTRAINT FK_seg_usuario_rol_rol FOREIGN KEY (id_rol) REFERENCES seg_roles(id),
        CONSTRAINT UQ_seg_usuario_rol_usuario_rol UNIQUE (id_usuario, id_rol)
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Relación entre usuarios y roles', 'SCHEMA', 'dbo', 'TABLE', 'seg_usuario_rol';
END
GO

-- Relación rol-permiso
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'seg_rol_permiso')
BEGIN
    CREATE TABLE seg_rol_permiso (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_rol                 INT            NOT NULL,
        id_permiso             INT            NOT NULL,
        CONSTRAINT FK_seg_rol_permiso_rol FOREIGN KEY (id_rol) REFERENCES seg_roles(id),
        CONSTRAINT FK_seg_rol_permiso_permiso FOREIGN KEY (id_permiso) REFERENCES seg_permisos(id),
        CONSTRAINT UQ_seg_rol_permiso_rol_permiso UNIQUE (id_rol, id_permiso)
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Relación entre roles y permisos', 'SCHEMA', 'dbo', 'TABLE', 'seg_rol_permiso';
END
GO

-- Refresh tokens
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'seg_refresh_tokens')
BEGIN
    CREATE TABLE seg_refresh_tokens (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_usuario             INT            NOT NULL,
        token                  VARCHAR(500)   NOT NULL UNIQUE,
        expira                 DATETIME       NOT NULL,
        creado                 DATETIME       NOT NULL DEFAULT GETDATE(),
        revoked                BIT            NOT NULL DEFAULT 0,
        CONSTRAINT FK_seg_refresh_tokens_usuario FOREIGN KEY (id_usuario) REFERENCES seg_usuarios(id)
    );

    CREATE INDEX IX_seg_refresh_tokens_token ON seg_refresh_tokens(token);
    CREATE INDEX IX_seg_refresh_tokens_id_usuario ON seg_refresh_tokens(id_usuario);

    EXEC sp_addextendedproperty 'MS_Description', 'Tokens de actualización de sesión', 'SCHEMA', 'dbo', 'TABLE', 'seg_refresh_tokens';
END
GO

-- =====================================================
-- TABLAS DE MONEDAS Y CONFIGURACIÓN
-- =====================================================

-- Monedas
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'monedas')
BEGIN
    CREATE TABLE monedas (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        codigo                 VARCHAR(5)     NOT NULL UNIQUE,
        nombre                 VARCHAR(50)    NOT NULL,
        simbolo                VARCHAR(5)     NOT NULL,
        activo                 BIT            NOT NULL DEFAULT 1
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Monedas disponibles para transacciones', 'SCHEMA', 'dbo', 'TABLE', 'monedas';
END
GO

-- Tipos de cambio
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tipo_cambio')
BEGIN
    CREATE TABLE tipo_cambio (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_moneda_origen       INT            NOT NULL,
        id_moneda_destino      INT            NOT NULL,
        tasa                   DECIMAL(12,6)  NOT NULL,
        fecha                  DATETIME       NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_tipo_cambio_fecha ON tipo_cambio(fecha);

    EXEC sp_addextendedproperty 'MS_Description', 'Tipos de cambio entre monedas', 'SCHEMA', 'dbo', 'TABLE', 'tipo_cambio';
END
GO

-- Configuración del sistema
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'configuracion_sistema')
BEGIN
    CREATE TABLE configuracion_sistema (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        clave                  VARCHAR(100)   NOT NULL UNIQUE,
        valor                  TEXT           NOT NULL,
        descripcion            VARCHAR(200)   NULL,
        updated_at             DATETIME       NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_configuracion_sistema_clave ON configuracion_sistema(clave);

    EXEC sp_addextendedproperty 'MS_Description', 'Configuración general del sistema', 'SCHEMA', 'dbo', 'TABLE', 'configuracion_sistema';
END
GO

-- =====================================================
-- TABLAS DE ÓRDENES Y CARRITO
-- =====================================================

-- Carritos de compra
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ord_carritos')
BEGIN
    CREATE TABLE ord_carritos (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_usuario             INT            NULL,
        sesion_id              VARCHAR(100)   NULL,
        estado                 VARCHAR(20)    NOT NULL DEFAULT 'activo',
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        updated_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_ord_carritos_usuario FOREIGN KEY (id_usuario) REFERENCES seg_usuarios(id)
    );

    CREATE INDEX IX_ord_carritos_id_usuario ON ord_carritos(id_usuario);
    CREATE INDEX IX_ord_carritos_sesion_id ON ord_carritos(sesion_id);

    EXEC sp_addextendedproperty 'MS_Description', 'Carritos de compra', 'SCHEMA', 'dbo', 'TABLE', 'ord_carritos';
END
GO

-- Items del carrito
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ord_items_carrito')
BEGIN
    CREATE TABLE ord_items_carrito (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_carrito             INT            NOT NULL,
        id_producto            INT            NOT NULL,
        cantidad               INT            NOT NULL,
        precio_unitario        DECIMAL(12,2)  NOT NULL,
        id_atributo            INT            NULL,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        updated_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_ord_items_carrito_carrito FOREIGN KEY (id_carrito) REFERENCES ord_carritos(id) ON DELETE CASCADE,
        CONSTRAINT FK_ord_items_carrito_producto FOREIGN KEY (id_producto) REFERENCES cat_productos(id),
        CONSTRAINT FK_ord_items_carrito_atributo FOREIGN KEY (id_atributo) REFERENCES cat_atributos(id),
        CONSTRAINT CK_ord_items_carrito_cantidad CHECK (cantidad > 0),
        CONSTRAINT CK_ord_items_carrito_precio_unitario CHECK (precio_unitario >= 0)
    );

    CREATE INDEX IX_ord_items_carrito_id_carrito ON ord_items_carrito(id_carrito);
    CREATE INDEX IX_ord_items_carrito_id_producto ON ord_items_carrito(id_producto);

    EXEC sp_addextendedproperty 'MS_Description', 'Items dentro de carritos de compra', 'SCHEMA', 'dbo', 'TABLE', 'ord_items_carrito';
END
GO

-- Cupones de descuento
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ord_cupones')
BEGIN
    CREATE TABLE ord_cupones (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        codigo                 VARCHAR(50)    NOT NULL UNIQUE,
        nombre                 VARCHAR(100)   NOT NULL,
        tipo                   VARCHAR(20)    NOT NULL,
        valor                  DECIMAL(12,2)  NOT NULL,
        uso_minimo             DECIMAL(12,2)  NOT NULL DEFAULT 0,
        uso_limite             INT            NULL,
        uso_actual             INT            NOT NULL DEFAULT 0,
        fecha_inicio           DATETIME       NOT NULL,
        fecha_fin              DATETIME       NOT NULL,
        activo                 BIT            NOT NULL DEFAULT 1,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE()
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Cupones de descuento', 'SCHEMA', 'dbo', 'TABLE', 'ord_cupones';
END
GO

-- Estados de orden
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ord_estados_orden')
BEGIN
    CREATE TABLE ord_estados_orden (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        estado                 VARCHAR(30)    NOT NULL UNIQUE,
        descripcion            VARCHAR(100)   NOT NULL,
        color                  VARCHAR(20)    NULL,
        orden                  INT            NOT NULL DEFAULT 0,
        permite_cancelacion    BIT            NOT NULL DEFAULT 1
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Estados posibles de una orden', 'SCHEMA', 'dbo', 'TABLE', 'ord_estados_orden';
END
GO

-- Métodos de envío
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ord_metodos_envio')
BEGIN
    CREATE TABLE ord_metodos_envio (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        nombre                 VARCHAR(100)   NOT NULL,
        descripcion            TEXT           NULL,
        precio                  DECIMAL(12,2)  NOT NULL,
        tiempo_entrega         VARCHAR(50)    NULL,
        activo                 BIT            NOT NULL DEFAULT 1
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Métodos de envío disponibles', 'SCHEMA', 'dbo', 'TABLE', 'ord_metodos_envio';
END
GO

-- Métodos de pago
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ord_metodos_pago')
BEGIN
    CREATE TABLE ord_metodos_pago (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        nombre                 VARCHAR(100)   NOT NULL,
        descripcion            TEXT           NULL,
        tipo                   VARCHAR(30)    NOT NULL,
        requiere_verificacion  BIT            NOT NULL DEFAULT 0,
        activo                 BIT            NOT NULL DEFAULT 1
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Métodos de pago disponibles', 'SCHEMA', 'dbo', 'TABLE', 'ord_metodos_pago';
END
GO

-- Direcciones de envío
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ord_direcciones_envio')
BEGIN
    CREATE TABLE ord_direcciones_envio (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_usuario             INT            NULL,
        id_cliente             INT            NULL,
        nombre                 VARCHAR(100)   NOT NULL,
        apellido               VARCHAR(100)   NOT NULL,
        direccion              VARCHAR(300)   NOT NULL,
        ciudad                 VARCHAR(100)   NOT NULL,
        departamento           VARCHAR(100)   NULL,
        codigo_postal          VARCHAR(20)    NULL,
        telefono               VARCHAR(20)    NULL,
        es_default             BIT            NOT NULL DEFAULT 0,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_ord_direcciones_envio_id_usuario ON ord_direcciones_envio(id_usuario);

    EXEC sp_addextendedproperty 'MS_Description', 'Direcciones de envío para órdenes', 'SCHEMA', 'dbo', 'TABLE', 'ord_direcciones_envio';
END
GO

-- Órdenes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ord_ordenes')
BEGIN
    CREATE TABLE ord_ordenes (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        numero_orden           VARCHAR(30)    NOT NULL UNIQUE,
        id_usuario             INT            NOT NULL,
        id_cupon               INT            NULL,
        id_direccion_envio     INT            NULL,
        id_metodo_envio        INT            NULL,
        id_metodo_pago         INT            NULL,
        subtotal               DECIMAL(12,2)  NOT NULL,
        igv                    DECIMAL(12,2)  NOT NULL,
        descuento              DECIMAL(12,2)  NOT NULL DEFAULT 0,
        total                  DECIMAL(12,2)  NOT NULL,
        estado_actual          VARCHAR(30)    NOT NULL DEFAULT 'pendiente_pago',
        notas                  TEXT           NULL,
        fecha_creacion         DATETIME       NOT NULL DEFAULT GETDATE(),
        fecha_actualizacion    DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_ord_ordenes_usuario FOREIGN KEY (id_usuario) REFERENCES seg_usuarios(id),
        CONSTRAINT FK_ord_ordenes_cupon FOREIGN KEY (id_cupon) REFERENCES ord_cupones(id),
        CONSTRAINT FK_ord_ordenes_direccion_envio FOREIGN KEY (id_direccion_envio) REFERENCES ord_direcciones_envio(id),
        CONSTRAINT FK_ord_ordenes_metodo_envio FOREIGN KEY (id_metodo_envio) REFERENCES ord_metodos_envio(id),
        CONSTRAINT FK_ord_ordenes_metodo_pago FOREIGN KEY (id_metodo_pago) REFERENCES ord_metodos_pago(id),
        CONSTRAINT CK_ord_ordenes_subtotal CHECK (subtotal >= 0),
        CONSTRAINT CK_ord_ordenes_igv CHECK (igv >= 0),
        CONSTRAINT CK_ord_ordenes_descuento CHECK (descuento >= 0),
        CONSTRAINT CK_ord_ordenes_total CHECK (total >= 0)
    );

    CREATE INDEX IX_ord_ordenes_numero_orden ON ord_ordenes(numero_orden);
    CREATE INDEX IX_ord_ordenes_id_usuario ON ord_ordenes(id_usuario);
    CREATE INDEX IX_ord_ordenes_estado_actual ON ord_ordenes(estado_actual);
    CREATE INDEX IX_ord_ordenes_fecha_creacion ON ord_ordenes(fecha_creacion);

    EXEC sp_addextendedproperty 'MS_Description', 'Órdenes de compra', 'SCHEMA', 'dbo', 'TABLE', 'ord_ordenes';
END
GO

-- Items de orden
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ord_items_orden')
BEGIN
    CREATE TABLE ord_items_orden (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_orden               INT            NOT NULL,
        id_producto            INT            NOT NULL,
        cantidad               INT            NOT NULL,
        precio_unitario        DECIMAL(12,2)  NOT NULL,
        subtotal               DECIMAL(12,2)  NOT NULL,
        CONSTRAINT FK_ord_items_orden_orden FOREIGN KEY (id_orden) REFERENCES ord_ordenes(id) ON DELETE CASCADE,
        CONSTRAINT FK_ord_items_orden_producto FOREIGN KEY (id_producto) REFERENCES cat_productos(id),
        CONSTRAINT CK_ord_items_orden_cantidad CHECK (cantidad > 0),
        CONSTRAINT CK_ord_items_orden_precio_unitario CHECK (precio_unitario >= 0),
        CONSTRAINT CK_ord_items_orden_subtotal CHECK (subtotal >= 0)
    );

    CREATE INDEX IX_ord_items_orden_id_orden ON ord_items_orden(id_orden);
    CREATE INDEX IX_ord_items_orden_id_producto ON ord_items_orden(id_producto);

    EXEC sp_addextendedproperty 'MS_Description', 'Items que componen una orden', 'SCHEMA', 'dbo', 'TABLE', 'ord_items_orden';
END
GO

-- Pagos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ord_pagos')
BEGIN
    CREATE TABLE ord_pagos (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_orden               INT            NOT NULL,
        id_metodo_pago         INT            NOT NULL,
        monto                  DECIMAL(12,2)  NOT NULL,
        estado                 VARCHAR(30)    NOT NULL,
        referencia             VARCHAR(100)   NULL,
        fecha_pago             DATETIME       NULL,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_ord_pagos_orden FOREIGN KEY (id_orden) REFERENCES ord_ordenes(id),
        CONSTRAINT FK_ord_pagos_metodo_pago FOREIGN KEY (id_metodo_pago) REFERENCES ord_metodos_pago(id),
        CONSTRAINT CK_ord_pagos_monto CHECK (monto >= 0)
    );

    CREATE INDEX IX_ord_pagos_id_orden ON ord_pagos(id_orden);

    EXEC sp_addextendedproperty 'MS_Description', 'Pagos realizados por órdenes', 'SCHEMA', 'dbo', 'TABLE', 'ord_pagos';
END
GO

-- Transacciones de pago
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ord_transacciones_pago')
BEGIN
    CREATE TABLE ord_transacciones_pago (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_pago                INT            NOT NULL,
        id_orden               INT            NOT NULL,
        tipo                   VARCHAR(30)    NOT NULL,
        monto                  DECIMAL(12,2)  NOT NULL,
        estado                 VARCHAR(30)    NOT NULL,
        datos_respuesta        TEXT           NULL,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_ord_transacciones_pago_pago FOREIGN KEY (id_pago) REFERENCES ord_pagos(id),
        CONSTRAINT FK_ord_transacciones_pago_orden FOREIGN KEY (id_orden) REFERENCES ord_ordenes(id),
        CONSTRAINT CK_ord_transacciones_pago_monto CHECK (monto >= 0)
    );

    CREATE INDEX IX_ord_transacciones_pago_id_pago ON ord_transacciones_pago(id_pago);

    EXEC sp_addextendedproperty 'MS_Description', 'Transacciones individuales de pago', 'SCHEMA', 'dbo', 'TABLE', 'ord_transacciones_pago';
END
GO

-- Historial de estados de orden
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ord_historial_estados')
BEGIN
    CREATE TABLE ord_historial_estados (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_orden               INT            NOT NULL,
        id_estado              INT            NOT NULL,
        id_usuario             INT            NULL,
        comentario             TEXT           NULL,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_ord_historial_estados_orden FOREIGN KEY (id_orden) REFERENCES ord_ordenes(id),
        CONSTRAINT FK_ord_historial_estados_estado FOREIGN KEY (id_estado) REFERENCES ord_estados_orden(id),
        CONSTRAINT FK_ord_historial_estados_usuario FOREIGN KEY (id_usuario) REFERENCES seg_usuarios(id)
    );

    CREATE INDEX IX_ord_historial_estados_id_orden ON ord_historial_estados(id_orden);

    EXEC sp_addextendedproperty 'MS_Description', 'Historial de cambios de estado de órdenes', 'SCHEMA', 'dbo', 'TABLE', 'ord_historial_estados';
END
GO

-- =====================================================
-- TABLAS DE INVENTARIO
-- =====================================================

-- Stock de productos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'inv_stock_producto')
BEGIN
    CREATE TABLE inv_stock_producto (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_producto            INT            NOT NULL UNIQUE,
        cantidad               INT            NOT NULL DEFAULT 0,
        reservado               INT            NOT NULL DEFAULT 0,
        disponible             INT            NOT NULL DEFAULT 0,
        fecha_actualizacion    DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_inv_stock_producto_producto FOREIGN KEY (id_producto) REFERENCES cat_productos(id),
        CONSTRAINT CK_inv_stock_producto_cantidad CHECK (cantidad >= 0),
        CONSTRAINT CK_inv_stock_producto_reservado CHECK (reservado >= 0),
        CONSTRAINT CK_inv_stock_producto_disponible CHECK (disponible >= 0)
    );

    CREATE INDEX IX_inv_stock_producto_disponible ON inv_stock_producto(disponible);

    EXEC sp_addextendedproperty 'MS_Description', 'Stock actual de productos', 'SCHEMA', 'dbo', 'TABLE', 'inv_stock_producto';
END
GO

-- Movimientos de inventario
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'inv_movimientos_inventario')
BEGIN
    CREATE TABLE inv_movimientos_inventario (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_producto            INT            NOT NULL,
        id_stock               INT            NOT NULL,
        tipo                   VARCHAR(20)    NOT NULL,
        cantidad               INT            NOT NULL,
        motivo                 VARCHAR(100)   NULL,
        id_orden               INT            NULL,
        id_ajuste              INT            NULL,
        id_usuario             INT            NOT NULL,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_inv_movimientos_inventario_producto FOREIGN KEY (id_producto) REFERENCES cat_productos(id),
        CONSTRAINT FK_inv_movimientos_inventario_stock FOREIGN KEY (id_stock) REFERENCES inv_stock_producto(id)
    );

    CREATE INDEX IX_inv_movimientos_inventario_id_producto ON inv_movimientos_inventario(id_producto);
    CREATE INDEX IX_inv_movimientos_inventario_tipo ON inv_movimientos_inventario(tipo);
    CREATE INDEX IX_inv_movimientos_inventario_created_at ON inv_movimientos_inventario(created_at);

    EXEC sp_addextendedproperty 'MS_Description', 'Movimientos de inventario (entradas y salidas)', 'SCHEMA', 'dbo', 'TABLE', 'inv_movimientos_inventario';
END
GO

-- Ajustes de inventario
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'inv_ajustes')
BEGIN
    CREATE TABLE inv_ajustes (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        motivo                 VARCHAR(200)   NOT NULL,
        id_usuario             INT            NOT NULL,
        id_aprobado_por        INT            NULL,
        estado                 VARCHAR(20)    NOT NULL DEFAULT 'pendiente',
        observaciones          TEXT           NULL,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        updated_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_inv_ajustes_usuario FOREIGN KEY (id_usuario) REFERENCES seg_usuarios(id)
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Ajustes de inventario', 'SCHEMA', 'dbo', 'TABLE', 'inv_ajustes';
END
GO

-- Detalle de ajustes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'inv_detalle_ajuste')
BEGIN
    CREATE TABLE inv_detalle_ajuste (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_ajuste              INT            NOT NULL,
        id_producto            INT            NOT NULL,
        cantidad_anterior      INT            NOT NULL,
        cantidad_nueva         INT            NOT NULL,
        diferencia             INT            NOT NULL,
        id_unidad_medida       INT            NULL,
        CONSTRAINT FK_inv_detalle_ajuste_ajuste FOREIGN KEY (id_ajuste) REFERENCES inv_ajustes(id) ON DELETE CASCADE,
        CONSTRAINT FK_inv_detalle_ajuste_producto FOREIGN KEY (id_producto) REFERENCES cat_productos(id),
        CONSTRAINT FK_inv_detalle_ajuste_unidad_medida FOREIGN KEY (id_unidad_medida) REFERENCES cat_unidades_medida(id)
    );

    CREATE INDEX IX_inv_detalle_ajuste_id_ajuste ON inv_detalle_ajuste(id_ajuste);

    EXEC sp_addextendedproperty 'MS_Description', 'Detalle de productos en ajustes de inventario', 'SCHEMA', 'dbo', 'TABLE', 'inv_detalle_ajuste';
END
GO

-- Proveedores
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'inv_proveedores')
BEGIN
    CREATE TABLE inv_proveedores (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        nombre                 VARCHAR(200)   NOT NULL,
        ruc                    VARCHAR(20)    NULL,
        contacto               VARCHAR(100)   NULL,
        telefono               VARCHAR(20)   NULL,
        email                  VARCHAR(100)   NULL,
        direccion              VARCHAR(300)   NULL,
        activo                 BIT            NOT NULL DEFAULT 1,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE()
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Proveedores de productos', 'SCHEMA', 'dbo', 'TABLE', 'inv_proveedores';
END
GO

-- Órdenes de compra
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'inv_ordenes_compra')
BEGIN
    CREATE TABLE inv_ordenes_compra (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        numero                 VARCHAR(30)    NOT NULL UNIQUE,
        id_proveedor           INT            NOT NULL,
        fecha_esperada         DATETIME       NULL,
        estado                 VARCHAR(20)    NOT NULL DEFAULT 'pendiente',
        subtotal               DECIMAL(12,2)  NOT NULL,
        igv                    DECIMAL(12,2)  NOT NULL,
        total                  DECIMAL(12,2)  NOT NULL,
        observaciones          TEXT           NULL,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        updated_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_inv_ordenes_compra_proveedor FOREIGN KEY (id_proveedor) REFERENCES inv_proveedores(id),
        CONSTRAINT CK_inv_ordenes_compra_subtotal CHECK (subtotal >= 0),
        CONSTRAINT CK_inv_ordenes_compra_igv CHECK (igv >= 0),
        CONSTRAINT CK_inv_ordenes_compra_total CHECK (total >= 0)
    );

    CREATE INDEX IX_inv_ordenes_compra_numero ON inv_ordenes_compra(numero);
    CREATE INDEX IX_inv_ordenes_compra_estado ON inv_ordenes_compra(estado);

    EXEC sp_addextendedproperty 'MS_Description', 'Órdenes de compra a proveedores', 'SCHEMA', 'dbo', 'TABLE', 'inv_ordenes_compra';
END
GO

-- Detalle de orden de compra
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'inv_detalle_orden_compra')
BEGIN
    CREATE TABLE inv_detalle_orden_compra (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_orden_compra        INT            NOT NULL,
        id_producto            INT            NOT NULL,
        cantidad               INT            NOT NULL,
        precio_unitario        DECIMAL(12,2)  NOT NULL,
        subtotal               DECIMAL(12,2)  NOT NULL,
        CONSTRAINT FK_inv_detalle_orden_compra_orden_compra FOREIGN KEY (id_orden_compra) REFERENCES inv_ordenes_compra(id) ON DELETE CASCADE,
        CONSTRAINT FK_inv_detalle_orden_compra_producto FOREIGN KEY (id_producto) REFERENCES cat_productos(id),
        CONSTRAINT CK_inv_detalle_orden_compra_cantidad CHECK (cantidad > 0),
        CONSTRAINT CK_inv_detalle_orden_compra_precio_unitario CHECK (precio_unitario >= 0),
        CONSTRAINT CK_inv_detalle_orden_compra_subtotal CHECK (subtotal >= 0)
    );

    CREATE INDEX IX_inv_detalle_orden_compra_id_orden_compra ON inv_detalle_orden_compra(id_orden_compra);

    EXEC sp_addextendedproperty 'MS_Description', 'Detalle de productos en órdenes de compra', 'SCHEMA', 'dbo', 'TABLE', 'inv_detalle_orden_compra';
END
GO

-- Recepciones
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'inv_recepciones')
BEGIN
    CREATE TABLE inv_recepciones (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_orden_compra        INT            NOT NULL,
        numero                 VARCHAR(30)    NOT NULL UNIQUE,
        fecha_recepcion        DATETIME       NOT NULL,
        observaciones          TEXT           NULL,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_inv_recepciones_orden_compra FOREIGN KEY (id_orden_compra) REFERENCES inv_ordenes_compra(id)
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Recepciones de órdenes de compra', 'SCHEMA', 'dbo', 'TABLE', 'inv_recepciones';
END
GO

-- =====================================================
-- TABLAS DE CLIENTES
-- =====================================================

-- Clientes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cli_clientes')
BEGIN
    CREATE TABLE cli_clientes (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_usuario             INT            NULL UNIQUE,
        nombre                 VARCHAR(100)   NOT NULL,
        apellido               VARCHAR(100)   NOT NULL,
        email                  VARCHAR(200)   NOT NULL UNIQUE,
        telefono               VARCHAR(20)    NULL,
        fecha_nacimiento       DATETIME       NULL,
        genero                 VARCHAR(20)    NULL,
        tipo_documento         VARCHAR(20)    NULL,
        numero_documento       VARCHAR(20)    NULL,
        segmento                VARCHAR(30)    NULL,
        total_gastado          DECIMAL(12,2)  NOT NULL DEFAULT 0,
        fecha_registro         DATETIME       NOT NULL DEFAULT GETDATE(),
        fecha_ultima_compra    DATETIME       NULL,
        activo                 BIT            NOT NULL DEFAULT 1,
        CONSTRAINT FK_cli_clientes_usuario FOREIGN KEY (id_usuario) REFERENCES seg_usuarios(id),
        CONSTRAINT CK_cli_clientes_total_gastado CHECK (total_gastado >= 0)
    );

    CREATE INDEX IX_cli_clientes_email ON cli_clientes(email);
    CREATE INDEX IX_cli_clientes_segmento ON cli_clientes(segmento);

    EXEC sp_addextendedproperty 'MS_Description', 'Clientes registrados', 'SCHEMA', 'dbo', 'TABLE', 'cli_clientes';
END
GO

-- Direcciones de clientes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cli_direcciones')
BEGIN
    CREATE TABLE cli_direcciones (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_cliente             INT            NOT NULL,
        nombre                 VARCHAR(100)   NOT NULL,
        apellidos              VARCHAR(100)   NULL,
        direccion              VARCHAR(300)   NOT NULL,
        ciudad                 VARCHAR(100)   NOT NULL,
        departamento           VARCHAR(100)   NULL,
        codigo_postal          VARCHAR(20)    NULL,
        telefono               VARCHAR(20)    NULL,
        es_default             BIT            NOT NULL DEFAULT 0,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_cli_direcciones_cliente FOREIGN KEY (id_cliente) REFERENCES cli_clientes(id)
    );

    CREATE INDEX IX_cli_direcciones_id_cliente ON cli_direcciones(id_cliente);

    EXEC sp_addextendedproperty 'MS_Description', 'Direcciones de clientes', 'SCHEMA', 'dbo', 'TABLE', 'cli_direcciones';
END
GO

-- Listas de deseos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cli_lista_deseos')
BEGIN
    CREATE TABLE cli_lista_deseos (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_cliente             INT            NOT NULL,
        nombre                 VARCHAR(100)   NOT NULL,
        es_publica             BIT            NOT NULL DEFAULT 0,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_cli_lista_deseos_cliente FOREIGN KEY (id_cliente) REFERENCES cli_clientes(id)
    );

    CREATE INDEX IX_cli_lista_deseos_id_cliente ON cli_lista_deseos(id_cliente);

    EXEC sp_addextendedproperty 'MS_Description', 'Listas de deseos de clientes', 'SCHEMA', 'dbo', 'TABLE', 'cli_lista_deseos';
END
GO

-- Items de lista de deseos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cli_items_lista_deseos')
BEGIN
    CREATE TABLE cli_items_lista_deseos (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_lista               INT            NOT NULL,
        id_producto            INT            NOT NULL,
        added_at               DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_cli_items_lista_deseos_lista FOREIGN KEY (id_lista) REFERENCES cli_lista_deseos(id) ON DELETE CASCADE,
        CONSTRAINT FK_cli_items_lista_deseos_producto FOREIGN KEY (id_producto) REFERENCES cat_productos(id),
        CONSTRAINT UQ_cli_items_lista_deseos_lista_producto UNIQUE (id_lista, id_producto)
    );

    EXEC sp_addextendedproperty 'MS_Description', 'Productos en listas de deseos', 'SCHEMA', 'dbo', 'TABLE', 'cli_items_lista_deseos';
END
GO

-- Reseñas de productos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cli_resenas_producto')
BEGIN
    CREATE TABLE cli_resenas_producto (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_cliente             INT            NOT NULL,
        id_producto            INT            NOT NULL,
        calificacion           INT            NOT NULL,
        titulo                 VARCHAR(200)   NULL,
        comentario             TEXT           NULL,
        activo                 BIT            NOT NULL DEFAULT 1,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_cli_resenas_producto_cliente FOREIGN KEY (id_cliente) REFERENCES cli_clientes(id),
        CONSTRAINT FK_cli_resenas_producto_producto FOREIGN KEY (id_producto) REFERENCES cat_productos(id),
        CONSTRAINT CK_cli_resenas_producto_calificacion CHECK (calificacion >= 1 AND calificacion <= 5)
    );

    CREATE INDEX IX_cli_resenas_producto_id_producto ON cli_resenas_producto(id_producto);
    CREATE INDEX IX_cli_resenas_producto_calificacion ON cli_resenas_producto(calificacion);

    EXEC sp_addextendedproperty 'MS_Description', 'Reseñas y calificaciones de productos por clientes', 'SCHEMA', 'dbo', 'TABLE', 'cli_resenas_producto';
END
GO

-- Historial de navegación
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cli_historial_navegacion')
BEGIN
    CREATE TABLE cli_historial_navegacion (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_usuario             INT            NULL,
        sesion_id              VARCHAR(100)   NULL,
        id_producto            INT            NULL,
        url                    VARCHAR(500)   NOT NULL,
        fecha                  DATETIME       NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_cli_historial_navegacion_id_usuario ON cli_historial_navegacion(id_usuario);
    CREATE INDEX IX_cli_historial_navegacion_sesion_id ON cli_historial_navegacion(sesion_id);

    EXEC sp_addextendedproperty 'MS_Description', 'Historial de navegación de usuarios', 'SCHEMA', 'dbo', 'TABLE', 'cli_historial_navegacion';
END
GO

-- =====================================================
-- TABLA DE AUDITORÍA
-- =====================================================

-- Registro de auditoría
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'auditoria_registro')
BEGIN
    CREATE TABLE auditoria_registro (
        id                     INT            IDENTITY(1,1) PRIMARY KEY,
        id_usuario             INT            NULL,
        accion                 VARCHAR(50)    NOT NULL,
        modulo                 VARCHAR(50)    NOT NULL,
        tabla                  VARCHAR(100)   NULL,
        registro_id            INT            NULL,
        datos_anteriores       TEXT           NULL,
        datos_nuevos           TEXT           NULL,
        ip                     VARCHAR(45)    NULL,
        user_agent             VARCHAR(500)   NULL,
        created_at             DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_auditoria_registro_usuario FOREIGN KEY (id_usuario) REFERENCES seg_usuarios(id)
    );

    CREATE INDEX IX_auditoria_registro_id_usuario ON auditoria_registro(id_usuario);
    CREATE INDEX IX_auditoria_registro_modulo ON auditoria_registro(modulo);
    CREATE INDEX IX_auditoria_registro_tabla ON auditoria_registro(tabla);
    CREATE INDEX IX_auditoria_registro_created_at ON auditoria_registro(created_at);

    EXEC sp_addextendedproperty 'MS_Description', 'Registro de auditoría del sistema', 'SCHEMA', 'dbo', 'TABLE', 'auditoria_registro';
END
GO

-- =====================================================
-- DATOS DE SEED: ROLES
-- =====================================================

SET IDENTITY_INSERT seg_roles ON;

IF NOT EXISTS (SELECT * FROM seg_roles WHERE nombre = 'Cliente')
BEGIN
    INSERT INTO seg_roles (id, nombre, descripcion, nivel) VALUES
    (1, 'Cliente', 'Usuario final que realiza compras', 1),
    (2, 'Administrador', 'Acceso total al sistema', 10),
    (3, 'GerenteVentas', 'Gestiona ventas y órdenes', 7),
    (4, 'GerenteInventario', 'Gestiona inventario y proveedores', 7),
    (5, 'Vendedor', 'Atiende clientes y procesa órdenes', 5),
    (6, 'Invitado', 'Usuario sin registro', 0);
END

SET IDENTITY_INSERT seg_roles OFF;
GO

-- =====================================================
-- DATOS DE SEED: PERMISOS
-- =====================================================

SET IDENTITY_INSERT seg_permisos ON;

IF NOT EXISTS (SELECT * FROM seg_permisos WHERE modulo = 'productos' AND accion = 'ver')
BEGIN
    INSERT INTO seg_permisos (id, modulo, accion, descripcion) VALUES
    (1, 'productos', 'ver', 'Ver productos'),
    (2, 'productos', 'crear', 'Crear productos'),
    (3, 'productos', 'editar', 'Editar productos'),
    (4, 'productos', 'eliminar', 'Eliminar productos'),
    (5, 'categorias', 'ver', 'Ver categorías'),
    (6, 'categorias', 'crear', 'Crear categorías'),
    (7, 'categorias', 'editar', 'Editar categorías'),
    (8, 'categorias', 'eliminar', 'Eliminar categorías'),
    (9, 'ordenes', 'ver', 'Ver órdenes'),
    (10, 'ordenes', 'crear', 'Crear órdenes'),
    (11, 'ordenes', 'editar', 'Editar órdenes'),
    (12, 'ordenes', 'cancelar', 'Cancelar órdenes'),
    (13, 'inventario', 'ver', 'Ver inventario'),
    (14, 'inventario', 'ajustar', 'Ajustar inventario'),
    (15, 'inventario', 'ordenar', 'Crear órdenes de compra'),
    (16, 'clientes', 'ver', 'Ver clientes'),
    (17, 'clientes', 'crear', 'Crear clientes'),
    (18, 'clientes', 'editar', 'Editar clientes'),
    (19, 'usuarios', 'ver', 'Ver usuarios'),
    (20, 'usuarios', 'crear', 'Crear usuarios'),
    (21, 'usuarios', 'editar', 'Editar usuarios'),
    (22, 'reportes', 'ver', 'Ver reportes'),
    (23, 'configuracion', 'ver', 'Ver configuración'),
    (24, 'configuracion', 'editar', 'Editar configuración');
END

SET IDENTITY_INSERT seg_permisos OFF;
GO

-- =====================================================
-- DATOS DE SEED: UNIDADES DE MEDIDA
-- =====================================================

SET IDENTITY_INSERT cat_unidades_medida ON;

IF NOT EXISTS (SELECT * FROM cat_unidades_medida WHERE abreviatura = 'UND')
BEGIN
    INSERT INTO cat_unidades_medida (id, nombre, abreviatura, tipo, activo) VALUES
    (1, 'Unidad', 'UND', 'unidad', 1),
    (2, 'Kilogramo', 'KG', 'peso', 1);
END

SET IDENTITY_INSERT cat_unidades_medida OFF;
GO

-- =====================================================
-- DATOS DE SEED: MONEDAS
-- =====================================================

SET IDENTITY_INSERT monedas ON;

IF NOT EXISTS (SELECT * FROM monedas WHERE codigo = 'PEN')
BEGIN
    INSERT INTO monedas (id, codigo, nombre, simbolo, activo) VALUES
    (1, 'PEN', 'Sol Peruano', 'S/', 1),
    (2, 'USD', 'Dólar Estadounidense', '$', 1);
END

SET IDENTITY_INSERT monedas OFF;
GO

-- =====================================================
-- DATOS DE SEED: CATEGORÍAS
-- =====================================================

SET IDENTITY_INSERT cat_categorias ON;

IF NOT EXISTS (SELECT * FROM cat_categorias WHERE slug = 'electronica')
BEGIN
    INSERT INTO cat_categorias (id, nombre, descripcion, slug, activo) VALUES
    (1, 'Electrónica', 'Dispositivos electrónicos y tecnológicos', 'electronica', 1),
    (2, 'Ropa', 'Vestimenta y accesorios de moda', 'ropa', 1),
    (3, 'Hogar', 'Artículos para el hogar y decoración', 'hogar', 1),
    (4, 'Deportes', 'Equipamiento y ropa deportiva', 'deportes', 1),
    (5, 'Juguetes', 'Juguetes y juegos para niños', 'juguetes', 1);
END

SET IDENTITY_INSERT cat_categorias OFF;
GO

-- =====================================================
-- DATOS DE SEED: MARCAS
-- =====================================================

SET IDENTITY_INSERT cat_marcas ON;

IF NOT EXISTS (SELECT * FROM cat_marcas WHERE slug = 'samsung')
BEGIN
    INSERT INTO cat_marcas (id, nombre, slug, descripcion, activo) VALUES
    (1, 'Samsung', 'samsung', 'Tecnología Samsung', 1),
    (2, 'Nike', 'nike', 'Deportes y ropa Nike', 1),
    (3, 'Philips', 'philips', 'Electrodomésticos Philips', 1);
END

SET IDENTITY_INSERT cat_marcas OFF;
GO

-- =====================================================
-- DATOS DE SEED: SUBCATEGORÍAS
-- =====================================================

SET IDENTITY_INSERT cat_subcategorias ON;

IF NOT EXISTS (SELECT * FROM cat_subcategorias WHERE slug = 'smartphones')
BEGIN
    INSERT INTO cat_subcategorias (id, nombre, descripcion, slug, id_categoria, activo) VALUES
    (1, 'Smartphones', 'Teléfonos inteligentes', 'smartphones', 1, 1),
    (2, 'Televisores', 'Televisores y pantallas', 'televisores', 1, 1),
    (3, 'Camisetas', 'Camisetas de moda', 'camisetas', 2, 1),
    (4, 'Zapatillas', 'Zapatillas deportivas', 'zapatillas', 4, 1),
    (5, 'Muebles', 'Muebles para el hogar', 'muebles', 3, 1);
END

SET IDENTITY_INSERT cat_subcategorias OFF;
GO

-- =====================================================
-- DATOS DE SEED: ETIQUETAS
-- =====================================================

SET IDENTITY_INSERT cat_etiquetas ON;

IF NOT EXISTS (SELECT * FROM cat_etiquetas WHERE slug = 'nuevo')
BEGIN
    INSERT INTO cat_etiquetas (id, nombre, slug, color, activo) VALUES
    (1, 'Nuevo', 'nuevo', '#00FF00', 1),
    (2, 'Oferta', 'oferta', '#FF0000', 1),
    (3, 'Popular', 'popular', '#FFA500', 1),
    (4, 'Destacado', 'destacado', '#0000FF', 1);
END

SET IDENTITY_INSERT cat_etiquetas OFF;
GO

-- =====================================================
-- DATOS DE SEED: PRODUCTOS
-- =====================================================

SET IDENTITY_INSERT cat_productos ON;

IF NOT EXISTS (SELECT * FROM cat_productos WHERE sku = 'SAM-S24-001')
BEGIN
    INSERT INTO cat_productos (id, sku, nombre, slug, descripcion_corta, descripcion_larga, id_categoria, id_subcategoria, id_marca, id_unidad_medida, precio_costo, precio_venta, precio_oferta, stock, stock_minimo, peso, ancho, alto, profundo, activo, destacado) VALUES
    (1, 'SAM-S24-001', 'Samsung Galaxy S24', 'samsung-galaxy-s24', ' smartphone Samsung Galaxy S24', 'Samsung Galaxy S24 con pantalla AMOLED 6.1", 8GB RAM, 256GB almacenamiento, cámara 50MP', 1, 1, 1, 1, 2500.00, 2999.00, NULL, NULL, 50, 0.17, 7.0, 14.7, 0.7, 1, 1),
    (2, 'SAM-TV-001', 'Samsung Smart TV 55"', 'samsung-smart-tv-55', 'Smart TV Samsung 55 pulgadas 4K', 'Samsung Smart TV 55" con resolución 4K UHD, sistema operativo Tizen, HDR10+', 1, 2, 1, 1, 1800.00, 2199.00, NULL, NULL, 30, 15.5, 123.0, 70.8, 5.9, 1, 1),
    (3, 'NIK-AIR-001', 'Nike Air Max 90', 'nike-air-max-90', 'Zapatillas Nike Air Max 90', 'Zapatillas Nike Air Max 90 con tecnología Air Max, suela transparente', 2, 4, 2, 1, 180.00, 259.00, 219.00, 100, 10, 0.3, 30.0, 12.0, 10.0, 1, 1),
    (4, 'NIK-JER-001', 'Nike Dri-FIT', 'nike-dri-fit', 'Camiseta Nike Dri-FIT', 'Camiseta deportiva Nike Dri-FIT con tecnología de absorción de sudor', 2, 3, 2, 1, 45.00, 79.00, NULL, 200, 20, 0.15, 40.0, 60.0, 1.0, 1, 0),
    (5, 'PHI-AIR-001', 'Philips Airfryer XXL', 'philips-airfryer-xxl', 'Freidora de aire Philips XXL', 'Freidora de aire Philips Airfryer XXL 6.2L, 7.3L', 3, NULL, 3, 1, 450.00, 599.00, 549.00, 45, 5, 5.3, 30.0, 30.0, 30.0, 1, 1),
    (6, 'SAM-BUD-001', 'Samsung Galaxy Buds2 Pro', 'samsung-galaxy-buds2-pro', 'Auriculares Samsung Buds2 Pro', 'Auriculares inalámbricos Samsung Galaxy Buds2 Pro con ANC', 1, NULL, 1, 1, 180.00, 249.00, NULL, 80, 10, 0.005, 5.0, 5.0, 2.8, 1, 0),
    (7, 'NIK-RUN-001', 'Nike Pegasus 40', 'nike-pegasus-40', 'Zapatillas Nike Pegasus 40', 'Zapatillas para correr Nike Pegasus 40', 4, 4, 2, 1, 120.00, 169.00, NULL, 150, 15, 0.28, 28.0, 10.0, 8.0, 1, 1),
    (8, 'PHI-CAF-001', 'Philips Series 2200', 'philips-series-2200', 'Cafetera Philips Series 2200', 'Cafetera automática Philips Series 2200 con molinillo', 3, NULL, 3, 1, 350.00, 499.00, NULL, 25, 3, 7.5, 25.0, 30.0, 35.0, 1, 0),
    (9, 'SAM-TAB-001', 'Samsung Galaxy Tab S9', 'samsung-galaxy-tab-s9', 'Tablet Samsung Galaxy Tab S9', 'Tablet Samsung Galaxy Tab S9 11" 8GB RAM 128GB', 1, NULL, 1, 1, 2200.00, 2799.00, NULL, 40, 5, 0.5, 16.5, 25.4, 0.6, 1, 1),
    (10, 'JUG-LEG-001', 'LEGO City', 'lego-city', 'LEGO City Paquete de Construcción', 'LEGO City paquete de construcción con 500 piezas', 5, NULL, NULL, 1, 80.00, 129.00, 109.00, 60, 10, 1.2, 40.0, 30.0, 10.0, 1, 0),
    (11, 'HOG-TOL-001', 'Tols Desktop Organizer', 'tols-desktop-organizer', 'Organizador de escritorio Tols', 'Organizador de escritorio de madera', 3, 5, NULL, 2, 30.00, 59.00, NULL, 100, 15, 1.5, 40.0, 15.0, 20.0, 1, 0),
    (12, 'SAM-WATCH-001', 'Samsung Galaxy Watch6', 'samsung-galaxy-watch6', 'Reloj Samsung Galaxy Watch6', 'Reloj inteligente Samsung Galaxy Watch6 44mm', 1, NULL, 1, 1, 320.00, 429.00, NULL, 55, 8, 0.03, 4.4, 4.4, 1.0, 1, 1),
    (13, 'NIK-BOL-001', 'Nike Brasilia', 'nike-brasilia', 'Bolso Nike Brasilia', 'Bolso de entrenamiento Nike Brasilia Mediano', 4, NULL, 2, 1, 35.00, 59.00, 49.00, 90, 10, 0.4, 55.0, 30.0, 25.0, 1, 0),
    (14, 'PHI-TOST-001', 'Philips Daily HD2393', 'philips-daily-hd2393', 'Tostadora Philips Daily', 'Tostadora Philips Daily con 8 niveles de tostado', 3, NULL, 3, 1, 45.00, 79.00, NULL, 70, 10, 2.3, 30.0, 18.0, 20.0, 1, 0),
    (15, 'JUG-BAR-001', 'Barbie Dreamhouse', 'barbie-dreamhouse', 'Muñeca Barbie Dreamhouse', 'Casa de muñecas Barbie Dreamhouse con 3 pisos', 5, NULL, NULL, 1, 120.00, 199.00, NULL, 35, 5, 3.5, 60.0, 100.0, 30.0, 1, 1),
    (16, 'SAM-S24PRO-001', 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24 Ultra 512GB, 12GB RAM', 1, 1, 1, 1, 4200.00, 4999.00, 4699.00, 25, 3, 0.23, 7.9, 16.2, 0.8, 1, 1),
    (17, 'HOG-ALMO-001', 'Almohada Memory Foam', 'almohada-memory-foam', 'Almohada de Memory Foam', 'Almohada ortopédica de Memory Foam 60x40cm', 3, NULL, NULL, 1, 25.00, 49.00, NULL, 120, 20, 1.0, 60.0, 40.0, 15.0, 1, 0),
    (18, 'NIK-SHORT-001', 'Nike Dri-FIT Short', 'nike-dri-fit-short', 'Short Nike Dri-FIT', 'Short deportivo Nike Dri-FIT para hombre', 4, NULL, 2, 1, 35.00, 59.00, NULL, 180, 20, 0.12, 35.0, 45.0, 2.0, 1, 0),
    (19, 'PHI-VAP-001', 'Philips Steam Iron', 'philips-steam-iron', 'Plancha Philips Steam', 'Plancha a vapor Philips PerfectCare', 3, NULL, 3, 1, 55.00, 89.00, NULL, 65, 8, 1.5, 30.0, 15.0, 12.0, 1, 0),
    (20, 'JUG-HOTP-001', 'Hot Wheels Pack', 'hot-wheels-pack', 'Pack de 5 autos Hot Wheels', 'Pack de 5 autos Hot Wheels colecionables', 5, NULL, NULL, 1, 15.00, 29.00, 25.00, 200, 30, 0.3, 25.0, 10.0, 5.0, 1, 1);
END

SET IDENTITY_INSERT cat_productos OFF;
GO

-- =====================================================
-- DATOS DE SEED: IMÁGENES DE PRODUCTOS
-- =====================================================

SET IDENTITY_INSERT cat_imagenes_producto ON;

IF NOT EXISTS (SELECT * FROM cat_imagenes_producto WHERE id_producto = 1 AND es_principal = 1)
BEGIN
    INSERT INTO cat_imagenes_producto (id, id_producto, url, texto_alt, es_principal, orden) VALUES
    (1, 1, '/images/products/s24-1.jpg', 'Samsung Galaxy S24 negro', 1, 1),
    (2, 1, '/images/products/s24-2.jpg', 'Samsung Galaxy S24 ángulo', 0, 2),
    (3, 2, '/images/products/tv55-1.jpg', 'Samsung Smart TV 55 pulgadas', 1, 1),
    (4, 3, '/images/products/airmax90-1.jpg', 'Nike Air Max 90 blancas', 1, 1),
    (5, 4, '/images/products/drifit-1.jpg', 'Camiseta Nike Dri-FIT azul', 1, 1),
    (6, 5, '/images/products/airfryer-1.jpg', 'Philips Airfryer XXL', 1, 1),
    (7, 6, '/images/products/buds2pro-1.jpg', 'Samsung Galaxy Buds2 Pro', 1, 1),
    (8, 7, '/images/products/pegasus40-1.jpg', 'Nike Pegasus 40', 1, 1),
    (9, 8, '/images/products/cafetera-1.jpg', 'Philips Series 2200', 1, 1),
    (10, 9, '/images/products/tab-s9-1.jpg', 'Samsung Galaxy Tab S9', 1, 1);
END

SET IDENTITY_INSERT cat_imagenes_producto OFF;
GO

-- =====================================================
-- DATOS DE SEED: ATRIBUTOS Y VALORES
-- =====================================================

SET IDENTITY_INSERT cat_atributos ON;

IF NOT EXISTS (SELECT * FROM cat_atributos WHERE nombre = 'Color')
BEGIN
    INSERT INTO cat_atributos (id, nombre, tipo) VALUES
    (1, 'Color', 'color'),
    (2, 'Talla', 'talla'),
    (3, 'Almacenamiento', 'opcion');
END

SET IDENTITY_INSERT cat_atributos OFF;
GO

SET IDENTITY_INSERT cat_valores_atributo ON;

IF NOT EXISTS (SELECT * FROM cat_valores_atributo WHERE valor = 'Negro')
BEGIN
    INSERT INTO cat_valores_atributo (id, id_atributo, valor, codigo, orden) VALUES
    (1, 1, 'Negro', 'BLK', 1),
    (2, 1, 'Blanco', 'WHT', 2),
    (3, 1, 'Azul', 'BLU', 3),
    (4, 2, 'S', 'S', 1),
    (5, 2, 'M', 'M', 2),
    (6, 2, 'L', 'L', 3),
    (7, 2, 'XL', 'XL', 4),
    (8, 3, '128GB', '128', 1),
    (9, 3, '256GB', '256', 2),
    (10, 3, '512GB', '512', 3);
END

SET IDENTITY_INSERT cat_valores_atributo OFF;
GO

-- =====================================================
-- DATOS DE SEED: MÉTODOS DE ENVÍO
-- =====================================================

SET IDENTITY_INSERT ord_metodos_envio ON;

IF NOT EXISTS (SELECT * FROM ord_metodos_envio WHERE nombre = 'Estándar')
BEGIN
    INSERT INTO ord_metodos_envio (id, nombre, descripcion, precio, tiempo_entrega, activo) VALUES
    (1, 'Estándar', 'Entrega en 3-5 días hábiles', 15.00, '3-5 días', 1),
    (2, 'Express', 'Entrega en 1-2 días hábiles', 25.00, '1-2 días', 1),
    (3, 'Retiro en tienda', 'Retiro en punto de venta', 0.00, '24 horas', 1);
END

SET IDENTITY_INSERT ord_metodos_envio OFF;
GO

-- =====================================================
-- DATOS DE SEED: MÉTODOS DE PAGO
-- =====================================================

SET IDENTITY_INSERT ord_metodos_pago ON;

IF NOT EXISTS (SELECT * FROM ord_metodos_pago WHERE nombre = 'Tarjeta de Crédito')
BEGIN
    INSERT INTO ord_metodos_pago (id, nombre, descripcion, tipo, requiere_verificacion, activo) VALUES
    (1, 'Tarjeta de Crédito', 'Pago con tarjeta de crédito Visa, Mastercard, Amex', 'tarjeta', 1, 1),
    (2, 'Yape', 'Pago mediante Yape', 'yape', 0, 1),
    (3, 'Transferencia Bancaria', 'Transferencia a cuenta bancaria', 'transferencia', 1, 1);
END

SET IDENTITY_INSERT ord_metodos_pago OFF;
GO

-- =====================================================
-- DATOS DE SEED: ESTADOS DE ORDEN
-- =====================================================

SET IDENTITY_INSERT ord_estados_orden ON;

IF NOT EXISTS (SELECT * FROM ord_estados_orden WHERE estado = 'pendiente_pago')
BEGIN
    INSERT INTO ord_estados_orden (id, estado, descripcion, color, orden, permite_cancelacion) VALUES
    (1, 'pendiente_pago', 'Pendiente de Pago', '#FFA500', 1, 1),
    (2, 'pagada', 'Pagada', '#00FF00', 2, 1),
    (3, 'en_proceso', 'En Proceso', '#0000FF', 3, 1),
    (4, 'enviada', 'Enviada', '#00FFFF', 4, 0),
    (5, 'entregada', 'Entregada', '#008000', 5, 0);
END

SET IDENTITY_INSERT ord_estados_orden OFF;
GO

-- =====================================================
-- DATOS DE SEED: STOCK DE PRODUCTOS
-- =====================================================

SET IDENTITY_INSERT inv_stock_producto ON;

IF NOT EXISTS (SELECT * FROM inv_stock_producto WHERE id_producto = 1)
BEGIN
    INSERT INTO inv_stock_producto (id, id_producto, cantidad, reservado, disponible) VALUES
    (1, 1, 50, 0, 50),
    (2, 2, 30, 0, 30),
    (3, 3, 100, 5, 95),
    (4, 4, 200, 0, 200),
    (5, 5, 45, 2, 43),
    (6, 6, 80, 0, 80),
    (7, 7, 150, 10, 140),
    (8, 8, 25, 0, 25),
    (9, 9, 40, 3, 37),
    (10, 10, 60, 0, 60),
    (11, 11, 100, 0, 100),
    (12, 12, 55, 5, 50),
    (13, 13, 90, 0, 90),
    (14, 14, 70, 0, 70),
    (15, 15, 35, 2, 33),
    (16, 16, 25, 3, 22),
    (17, 17, 120, 0, 120),
    (18, 18, 180, 0, 180),
    (19, 19, 65, 0, 65),
    (20, 20, 200, 10, 190);
END

SET IDENTITY_INSERT inv_stock_producto OFF;
GO

-- =====================================================
-- DATOS DE SEED: CONFIGURACIÓN DEL SISTEMA
-- =====================================================

IF NOT EXISTS (SELECT * FROM configuracion_sistema WHERE clave = 'nombre_tienda')
BEGIN
    INSERT INTO configuracion_sistema (clave, valor, descripcion) VALUES
    ('nombre_tienda', 'Mi Tienda Online', 'Nombre de la tienda'),
    ('igv_porcentaje', '18', 'Porcentaje de IGV'),
    ('moneda_default', 'PEN', 'Moneda predeterminada'),
    ('tiempo_sesion_minutos', '60', 'Tiempo de sesión en minutos'),
    ('intentos_login_bloqueo', '5', 'Intentos de login antes de bloqueo');
END
GO

PRINT 'Script de base de datos completado exitosamente.';
GO
