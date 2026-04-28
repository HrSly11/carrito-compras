import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const MODULOS = ['auth', 'productos', 'ordenes', 'inventario', 'clientes'];
const ACCIONES = ['leer', 'crear', 'editar', 'eliminar'];

async function main() {
  console.log('🚀 Starting seed...');

  // ==================== ROLES ====================
  console.log('\n📦 Creating roles...');
  const rolesData = [
    { nombre: 'Cliente', descripcion: 'Usuario cliente del sistema', nivel: 1 },
    { nombre: 'Administrador', descripcion: 'Administrador del sistema', nivel: 10 },
    { nombre: 'GerenteVentas', descripcion: 'Gerente de ventas', nivel: 7 },
    { nombre: 'GerenteInventario', descripcion: 'Gerente de inventario', nivel: 7 },
    { nombre: 'Vendedor', descripcion: 'Vendedor del sistema', nivel: 3 },
    { nombre: 'Invitado', descripcion: 'Usuario invitado', nivel: 0 },
  ];

  const roles: Record<string, number> = {};
  for (const rol of rolesData) {
    try {
      const created = await prisma.seg_roles.create({ data: rol });
      roles[created.nombre] = created.id;
      console.log(`   ✓ Role: ${created.nombre}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        const existing = await prisma.seg_roles.findUnique({ where: { nombre: rol.nombre } });
        roles[existing!.nombre] = existing!.id;
        console.log(`   ↩ Role already exists: ${rol.nombre}`);
      } else throw e;
    }
  }

  // ==================== PERMISOS ====================
  console.log('\n📦 Creating permissions...');
  const permisosData: { modulo: string; accion: string; descripcion: string }[] = [];
  for (const modulo of MODULOS) {
    for (const accion of ACCIONES) {
      permisosData.push({
        modulo,
        accion,
        descripcion: `Permiso para ${accion} en ${modulo}`,
      });
    }
  }

  const permisos: Record<string, number> = {};
  for (const perm of permisosData) {
    try {
      const created = await prisma.seg_permisos.create({ data: perm });
      permisos[`${created.modulo}_${created.accion}`] = created.id;
      console.log(`   ✓ Permission: ${created.modulo}_${created.accion}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        const existing = await prisma.seg_permisos.findUnique({
          where: { modulo_accion: { modulo: perm.modulo, accion: perm.accion } },
        });
        permisos[`${existing!.modulo}_${existing!.accion}`] = existing!.id;
        console.log(`   ↩ Permission already exists: ${perm.modulo}_${perm.accion}`);
      } else throw e;
    }
  }

  // ==================== ROLE-PERMISSION ASSOCIATIONS ====================
  console.log('\n📦 Creating role-permission associations...');

  const adminPermisos = MODULOS.flatMap(m => ACCIONES.map(a => permisos[`${m}_${a}`]));
  const gerenteVentasPermisos = [
    permisos['clientes_leer'], permisos['clientes_crear'], permisos['clientes_editar'],
    permisos['ordenes_leer'], permisos['ordenes_crear'], permisos['ordenes_editar'],
    permisos['productos_leer'],
  ];
  const gerenteInventarioPermisos = [
    permisos['inventario_leer'], permisos['inventario_crear'], permisos['inventario_editar'], permisos['inventario_eliminar'],
    permisos['productos_leer'], permisos['productos_crear'], permisos['productos_editar'], permisos['productos_eliminar'],
  ];
  const vendedorPermisos = [
    permisos['productos_leer'],
    permisos['ordenes_leer'], permisos['ordenes_editar'],
    permisos['clientes_leer'],
  ];
  const clientePermisos = [
    permisos['productos_leer'],
    permisos['ordenes_leer'], permisos['ordenes_crear'],
    permisos['clientes_leer'], permisos['clientes_editar'],
  ];

  const rolePermissions: Record<string, number[]> = {
    Administrador: adminPermisos,
    GerenteVentas: gerenteVentasPermisos,
    GerenteInventario: gerenteInventarioPermisos,
    Vendedor: vendedorPermisos,
    Cliente: clientePermisos,
    Invitado: [permisos['productos_leer']],
  };

  for (const [roleName, permIds] of Object.entries(rolePermissions)) {
    for (const permId of permIds) {
      try {
        await prisma.seg_rol_permiso.create({
          data: { id_rol: roles[roleName], id_permiso: permId },
        });
      } catch (e: any) {
        if (e.code !== 'P2002') throw e;
      }
    }
    console.log(`   ✓ Assigned ${permIds.length} permissions to ${roleName}`);
  }

  // ==================== TEST USERS ====================
  console.log('\n📦 Creating test users...');
  const testUsers = [
    { email: 'gerente.ventas@carrito.com', nombre: 'Gerente', apellido: 'Ventas', rol: 'GerenteVentas', password: 'GerenteVentas123' },
    { email: 'gerente.inventario@carrito.com', nombre: 'Gerente', apellido: 'Inventario', rol: 'GerenteInventario', password: 'GerenteInventario123' },
    { email: 'vendedor@carrito.com', nombre: 'Vendedor', apellido: 'Uno', rol: 'Vendedor', password: 'Vendedor123' },
  ];

  for (const user of testUsers) {
    try {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await prisma.seg_usuarios.create({
        data: {
          email: user.email,
          password_hash: passwordHash,
          nombre: user.nombre,
          apellido: user.apellido,
          telefono: '999999999',
          estado: 'activo',
          email_verificado: true,
          roles: { create: { id_rol: roles[user.rol] } },
        },
      });
      console.log(`   ✓ User: ${user.email} / ${user.password}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`   ↩ User already exists: ${user.email}`);
      } else throw e;
    }
  }

  // ==================== CLIENTE TEST USER ====================
  console.log('\n📦 Creating cliente test user...');
  const clientePassword = await bcrypt.hash('Cliente123', 10);
  let clienteUserId: number;
  try {
    const clienteUser = await prisma.seg_usuarios.create({
      data: {
        email: 'cliente@carrito.com',
        password_hash: clientePassword,
        nombre: 'Cliente',
        apellido: 'Test',
        telefono: '999999999',
        estado: 'activo',
        email_verificado: true,
        roles: { create: { id_rol: roles['Cliente'] } },
      },
    });
    clienteUserId = clienteUser.id;
    console.log(`   ✓ Cliente user created: cliente@carrito.com / Cliente123`);

    // Also create the cli_clientes record
    await prisma.cli_clientes.create({
      data: {
        id_usuario: clienteUserId,
        nombre: 'Cliente',
        apellido: 'Test',
        email: 'cliente@carrito.com',
        telefono: '999999999',
        segmento: 'nuevo',
        fecha_registro: new Date(),
        activo: true,
      },
    });
    console.log(`   ✓ Cliente profile created for: cliente@carrito.com`);
  } catch (e: any) {
    if (e.code === 'P2002') {
      const existing = await prisma.seg_usuarios.findUnique({ where: { email: 'cliente@carrito.com' } });
      clienteUserId = existing!.id;
      console.log(`   ↩ Cliente user already exists`);

      // Check if cli_clientes exists for this user
      const existingCliente = await prisma.cli_clientes.findUnique({ where: { id_usuario: clienteUserId } });
      if (!existingCliente) {
        await prisma.cli_clientes.create({
          data: {
            id_usuario: clienteUserId,
            nombre: 'Cliente',
            apellido: 'Test',
            email: 'cliente@carrito.com',
            telefono: '999999999',
            segmento: 'nuevo',
            fecha_registro: new Date(),
            activo: true,
          },
        });
        console.log(`   ✓ Cliente profile created for existing user`);
      }
    } else throw e;
  }

  // ==================== ADMIN USER ====================
  console.log('\n📦 Creating admin user...');
  const adminPassword = await bcrypt.hash('Admin123', 10);
  let adminUserId: number;
  try {
    const admin = await prisma.seg_usuarios.create({
      data: {
        email: 'admin@carrito.com',
        password_hash: adminPassword,
        nombre: 'Admin',
        apellido: 'Principal',
        telefono: '999999999',
        estado: 'activo',
        email_verificado: true,
        roles: { create: { id_rol: roles['Administrador'] } },
      },
    });
    adminUserId = admin.id;
    console.log('   ✓ Admin user created: admin@carrito.com / Admin123');
  } catch (e: any) {
    if (e.code === 'P2002') {
      const existing = await prisma.seg_usuarios.findUnique({ where: { email: 'admin@carrito.com' } });
      adminUserId = existing!.id;
      console.log('   ↩ Admin user already exists');
    } else throw e;
  }

  // ==================== UNIDADES DE MEDIDA ====================
  console.log('\n📦 Creating unidades de medida...');
  const unidadesData = [
    { nombre: 'Unidad', abreviatura: 'UND', tipo: 'unidad' },
    { nombre: 'Kilogramo', abreviatura: 'KG', tipo: 'peso' },
  ];

  const unidades: Record<string, number> = {};
  for (const unidad of unidadesData) {
    try {
      const created = await prisma.cat_unidades_medida.create({ data: unidad });
      unidades[created.nombre] = created.id;
      console.log(`   ✓ Unidad: ${created.nombre}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        const existing = await prisma.cat_unidades_medida.findFirst({ where: { nombre: unidad.nombre } });
        unidades[existing!.nombre] = existing!.id;
        console.log(`   ↩ Unidad already exists: ${unidad.nombre}`);
      } else throw e;
    }
  }

  // ==================== MONEDAS ====================
  console.log('\n📦 Creating monedas...');
  const monedasData = [
    { codigo: 'PEN', nombre: 'Sol Peruano', simbolo: 'S/' },
    { codigo: 'USD', nombre: 'Dólar Americano', simbolo: '$' },
  ];

  const monedas: Record<string, number> = {};
  for (const moneda of monedasData) {
    try {
      const created = await prisma.monedas.create({ data: moneda });
      monedas[created.codigo] = created.id;
      console.log(`   ✓ Moneda: ${created.codigo}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        const existing = await prisma.monedas.findUnique({ where: { codigo: moneda.codigo } });
        monedas[existing!.codigo] = existing!.id;
        console.log(`   ↩ Moneda already exists: ${moneda.codigo}`);
      } else throw e;
    }
  }

  // ==================== CATEGORÍAS ====================
  console.log('\n📦 Creating categorías...');
  const categoriasData = [
    { nombre: 'Electrónica', slug: 'electronica', descripcion: 'Dispositivos electrónicos y accesorios' },
    { nombre: 'Ropa', slug: 'ropa', descripcion: 'Ropa y accesorios de moda' },
    { nombre: 'Hogar', slug: 'hogar', descripcion: 'Artículos para el hogar' },
    { nombre: 'Deportes', slug: 'deportes', descripcion: 'Equipamiento deportivo' },
    { nombre: 'Juguetes', slug: 'juguetes', descripcion: 'Juguetes y juegos' },
  ];

  const categorias: Record<string, number> = {};
  for (const cat of categoriasData) {
    try {
      const created = await prisma.cat_categorias.create({ data: cat });
      categorias[created.slug] = created.id;
      console.log(`   ✓ Categoría: ${created.nombre}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        const existing = await prisma.cat_categorias.findUnique({ where: { slug: cat.slug } });
        categorias[existing!.slug] = existing!.id;
        console.log(`   ↩ Categoría already exists: ${cat.nombre}`);
      } else throw e;
    }
  }

  // ==================== SUBCATEGORÍAS ====================
  console.log('\n📦 Creating subcategorías...');
  const subcategoriasData = [
    { nombre: 'Smartphones', slug: 'smartphones', id_categoria: categorias['electronica'] },
    { nombre: 'Laptops', slug: 'laptops', id_categoria: categorias['electronica'] },
    { nombre: 'Audio', slug: 'audio', id_categoria: categorias['electronica'] },
    { nombre: 'Camisetas', slug: 'camisetas', id_categoria: categorias['ropa'] },
    { nombre: 'Pantalones', slug: 'pantalones', id_categoria: categorias['ropa'] },
    { nombre: 'Zapatos', slug: 'zapatos', id_categoria: categorias['ropa'] },
    { nombre: 'Muebles', slug: 'muebles', id_categoria: categorias['hogar'] },
    { nombre: 'Decoración', slug: 'decoracion', id_categoria: categorias['hogar'] },
    { nombre: 'Electrodomésticos', slug: 'electrodomesticos', id_categoria: categorias['hogar'] },
    { nombre: 'Futbol', slug: 'futbol', id_categoria: categorias['deportes'] },
    { nombre: 'Gym', slug: 'gym', id_categoria: categorias['deportes'] },
    { nombre: 'Natación', slug: 'natacion', id_categoria: categorias['deportes'] },
    { nombre: 'Muñecas', slug: 'munecas', id_categoria: categorias['juguetes'] },
    { nombre: 'Autos', slug: 'autos', id_categoria: categorias['juguetes'] },
    { nombre: 'Juegos de mesa', slug: 'juegos-mesa', id_categoria: categorias['juguetes'] },
  ];

  const subcategorias: Record<string, number> = {};
  for (const sub of subcategoriasData) {
    try {
      const created = await prisma.cat_subcategorias.create({ data: sub });
      subcategorias[created.slug] = created.id;
      console.log(`   ✓ Subcategoría: ${created.nombre}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        const existing = await prisma.cat_subcategorias.findUnique({ where: { slug: sub.slug } });
        subcategorias[existing!.slug] = existing!.id;
        console.log(`   ↩ Subcategoría already exists: ${sub.nombre}`);
      } else throw e;
    }
  }

  // ==================== MARCAS ====================
  console.log('\n📦 Creating marcas...');
  const marcasData = [
    { nombre: 'Samsung', slug: 'samsung', descripcion: 'Tecnología Samsung' },
    { nombre: 'Nike', slug: 'nike', descripcion: 'Equipamiento deportivo Nike' },
    { nombre: 'Philips', slug: 'philips', descripcion: 'Productos electrónicos Philips' },
  ];

  const marcas: Record<string, number> = {};
  for (const marca of marcasData) {
    try {
      const created = await prisma.cat_marcas.create({ data: marca });
      marcas[created.slug] = created.id;
      console.log(`   ✓ Marca: ${created.nombre}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        const existing = await prisma.cat_marcas.findUnique({ where: { slug: marca.slug } });
        marcas[existing!.slug] = existing!.id;
        console.log(`   ↩ Marca already exists: ${marca.nombre}`);
      } else throw e;
    }
  }

  // ==================== PRODUCTOS ====================
  console.log('\n📦 Creating productos...');
  const productosData = [
    // Electrónica
    { sku: 'SAM-GS24-001', nombre: 'Samsung Galaxy S24', slug: 'samsung-galaxy-s24', descripcion_corta: 'Smartphone premium', descripcion_larga: 'Samsung Galaxy S24 con IA avanzada', precio_venta: 3999.00, id_categoria: categorias['electronica'], id_subcategoria: subcategorias['smartphones'], id_marca: marcas['samsung'], stock: 50 },
    { sku: 'SAM-TV-55-001', nombre: 'Samsung TV 55" QLED', slug: 'samsung-tv-55-qled', descripcion_corta: 'TV QLED 55 pulgadas', descripcion_larga: 'Televisor Samsung QLED 4K de 55 pulgadas', precio_venta: 2999.00, id_categoria: categorias['electronica'], id_subcategoria: subcategorias['laptops'], id_marca: marcas['samsung'], stock: 30 },
    { sku: 'SAM-AUD-001', nombre: 'Samsung Galaxy Buds2', slug: 'samsung-galaxy-buds2', descripcion_corta: 'Auriculares inalámbricos', descripcion_larga: 'Auriculares Samsung con cancelación de ruido', precio_venta: 599.00, id_categoria: categorias['electronica'], id_subcategoria: subcategorias['audio'], id_marca: marcas['samsung'], stock: 100 },
    { sku: 'SAM-WATCH-001', nombre: 'Samsung Galaxy Watch6', slug: 'samsung-galaxy-watch6', descripcion_corta: 'Smartwatch Samsung', descripcion_larga: 'Reloj inteligente Samsung Galaxy Watch6', precio_venta: 1299.00, id_categoria: categorias['electronica'], id_subcategoria: subcategorias['smartphones'], id_marca: marcas['samsung'], stock: 45 },
    { sku: 'PHI-SHAVE-001', nombre: 'Philips Series 5000', slug: 'philips-series-5000', descripcion_corta: 'Rasuradora eléctrica', descripcion_larga: 'Rasuradora eléctrica Philips Serie 5000', precio_venta: 459.00, id_categoria: categorias['electronica'], id_subcategoria: subcategorias['audio'], id_marca: marcas['philips'], stock: 60 },
    // Ropa
    { sku: 'NIKE-JERSEY-001', nombre: 'Nike Dri-FIT Jersey', slug: 'nike-dri-fit-jersey', descripcion_corta: 'Camiseta deportiva', descripcion_larga: 'Camiseta Nike Dri-FIT para entrenamiento', precio_venta: 189.00, id_categoria: categorias['ropa'], id_subcategoria: subcategorias['camisetas'], id_marca: marcas['nike'], stock: 200 },
    { sku: 'NIKE-PANT-001', nombre: 'Nike Sportswear Pant', slug: 'nike-sportswear-pant', descripcion_corta: 'Pantalón deportivo', descripcion_larga: 'Pantalón Nike Sportswear para uso diario', precio_venta: 299.00, id_categoria: categorias['ropa'], id_subcategoria: subcategorias['pantalones'], id_marca: marcas['nike'], stock: 150 },
    { sku: 'NIKE-SHOE-001', nombre: 'Nike Air Max 90', slug: 'nike-air-max-90', descripcion_corta: 'Zapatillas Nike', descripcion_larga: 'Zapatillas Nike Air Max 90 clásicas', precio_venta: 649.00, id_categoria: categorias['ropa'], id_subcategoria: subcategorias['zapatos'], id_marca: marcas['nike'], stock: 80 },
    { sku: 'NIKE-CAP-001', nombre: 'Nike Dri-FIT Cap', slug: 'nike-dri-fit-cap', descripcion_corta: 'Gorra deportiva', descripcion_larga: 'Gorra Nike Dri-FIT para running', precio_venta: 119.00, id_categoria: categorias['ropa'], id_subcategoria: subcategorias['camisetas'], id_marca: marcas['nike'], stock: 300 },
    // Hogar
    { sku: 'PHI-LAMP-001', nombre: 'Philips Hue Go', slug: 'philips-hue-go', descripcion_corta: 'Lámpara portátil', descripcion_larga: 'Lámpara inteligente Philips Hue Go', precio_venta: 349.00, id_categoria: categorias['hogar'], id_subcategoria: subcategorias['decoracion'], id_marca: marcas['philips'], stock: 70 },
    { sku: 'Sofa-001', nombre: 'Sofá 3 Plazas Moderno', slug: 'sofa-3-plazas-moderno', descripcion_corta: 'Sofá moderno gris', descripcion_larga: 'Sofá de 3 plazas estilo moderno color gris', precio_venta: 1899.00, id_categoria: categorias['hogar'], id_subcategoria: subcategorias['muebles'], stock: 15 },
    { sku: 'MESA-001', nombre: 'Mesa de Centro Oslo', slug: 'mesa-centro-oslo', descripcion_corta: 'Mesa de centro minimalista', descripcion_larga: 'Mesa de centro diseño Oslo', precio_venta: 599.00, id_categoria: categorias['hogar'], id_subcategoria: subcategorias['muebles'], stock: 25 },
    { sku: 'PHI-AIR-001', nombre: 'Philips Airfryer XXL', slug: 'philips-airfryer-xxl', descripcion_corta: 'Fritura sin aceite', descripcion_larga: 'Freidora de aire Philips Airfryer XXL', precio_venta: 899.00, id_categoria: categorias['hogar'], id_subcategoria: subcategorias['electrodomesticos'], id_marca: marcas['philips'], stock: 40 },
    // Deportes
    { sku: 'BALL-FUT-001', nombre: 'Balón Adidas World Cup', slug: 'balon-adidas-world-cup', descripcion_corta: 'Balón de fútbol oficial', descripcion_larga: 'Balón de fútbol Adidas World Cup 2024', precio_venta: 299.00, id_categoria: categorias['deportes'], id_subcategoria: subcategorias['futbol'], stock: 120 },
    { sku: 'NIKE-SHORTS-001', nombre: 'Nike Pro Shorts', slug: 'nike-pro-shorts', descripcion_corta: 'Shorts de compresión', descripcion_larga: 'Shorts Nike Pro para entrenamiento', precio_venta: 159.00, id_categoria: categorias['deportes'], id_subcategoria: subcategorias['futbol'], id_marca: marcas['nike'], stock: 180 },
    { sku: 'DUMBBELL-001', nombre: 'Set Mancuernas 20kg', slug: 'set-mancuernas-20kg', descripcion_corta: 'Mancuernas ajustables', descripcion_larga: 'Set de mancuernas de 20kg con soporte', precio_venta: 699.00, id_categoria: categorias['deportes'], id_subcategoria: subcategorias['gym'], stock: 35 },
    { sku: 'YOGA-MAT-001', nombre: 'Mat de Yoga Premium', slug: 'mat-yoga-premium', descripcion_corta: 'Mat de yoga 6mm', descripcion_larga: 'Mat de yoga antideslizante premium', precio_venta: 129.00, id_categoria: categorias['deportes'], id_subcategoria: subcategorias['gym'], stock: 200 },
    { sku: 'GOGGLES-001', nombre: 'Gafas Natación Speed', slug: 'gafas-natacion-speed', descripcion_corta: 'Gafas de natación', descripcion_larga: 'Gafas de natación profesionales Speed', precio_venta: 89.00, id_categoria: categorias['deportes'], id_subcategoria: subcategorias['natacion'], stock: 90 },
    // Juguetes
    { sku: 'DOLL-001', nombre: 'Muñeca Barbie Dreamhouse', slug: 'muneca-barbie-dreamhouse', descripcion_corta: 'Casa de muñecas Barbie', descripcion_larga: 'Casa de muñecas Barbie Dreamhouse', precio_venta: 799.00, id_categoria: categorias['juguetes'], id_subcategoria: subcategorias['munecas'], stock: 40 },
    { sku: 'CAR-001', nombre: 'Auto Hot Wheels Pack', slug: 'auto-hot-wheels-pack', descripcion_corta: 'Pack de autos Hot Wheels', descripcion_larga: 'Pack de 5 autos Hot Wheels colecionables', precio_venta: 149.00, id_categoria: categorias['juguetes'], id_subcategoria: subcategorias['autos'], stock: 150 },
    { sku: 'BOARD-001', nombre: 'Monopoly Clásico', slug: 'monopoly-clasico', descripcion_corta: 'Juego de mesa Monopoly', descripcion_larga: 'Juego de mesa Monopoly edición clásica', precio_venta: 189.00, id_categoria: categorias['juguetes'], id_subcategoria: subcategorias['juegos-mesa'], stock: 75 },
    { sku: 'LEGO-001', nombre: 'LEGO City Police Station', slug: 'lego-city-police', descripcion_corta: 'Set LEGO Ciudad', descripcion_larga: 'Set LEGO City Estación de Policía', precio_venta: 599.00, id_categoria: categorias['juguetes'], id_subcategoria: subcategorias['autos'], stock: 60 },
    { sku: 'PUZZLE-001', nombre: 'Puzzle 1000 piezas', slug: 'puzzle-1000-pzas', descripcion_corta: 'Puzzle 1000 piezas', descripcion_larga: 'Puzzle de 1000 piezas paisaje', precio_venta: 59.00, id_categoria: categorias['juguetes'], id_subcategoria: subcategorias['juegos-mesa'], stock: 200 },
  ];

  const productos: Record<string, number> = {};
  for (const prod of productosData) {
    try {
      const created = await prisma.cat_productos.create({
        data: {
          ...prod,
          id_unidad_medida: unidades['Unidad'],
        },
      });
      productos[created.sku] = created.id;
      console.log(`   ✓ Producto: ${created.nombre}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        const existing = await prisma.cat_productos.findUnique({ where: { sku: prod.sku } });
        productos[existing!.sku] = existing!.id;
        console.log(`   ↩ Producto already exists: ${prod.nombre}`);
      } else throw e;
    }
  }

  // ==================== IMÁGENES DE PRODUCTOS ====================
  console.log('\n📦 Creating product images...');
  for (const prod of productosData) {
    const prodId = productos[prod.sku];
    if (!prodId) continue;
    try {
      await prisma.cat_imagenes_producto.create({
        data: {
          id_producto: prodId,
          url: `https://picsum.photos/seed/${prod.sku}/400/400`,
          texto_alt: prod.nombre,
          es_principal: true,
        },
      });
      console.log(`   ✓ Imagen principal: ${prod.nombre}`);
    } catch (e: any) {
      if (e.code !== 'P2002') console.log(`   ↩ Imagen ya existe: ${prod.nombre}`);
    }
  }

  // ==================== MÉTODOS DE ENVÍO ====================
  console.log('\n📦 Creating métodos de envío...');
  const metodosEnvioData = [
    { nombre: 'Envío estándar', descripcion: 'Entrega en 5-7 días hábiles', precio: 15.00, tiempo_entrega: '5-7 días' },
    { nombre: 'Envío express', descripcion: 'Entrega en 24-48 horas', precio: 35.00, tiempo_entrega: '24-48 horas' },
    { nombre: 'Recoger en tienda', descripcion: 'Recoger en punto de venta', precio: 0, tiempo_entrega: 'Inmediato' },
  ];

  const metodosEnvio: Record<string, number> = {};
  for (const metodo of metodosEnvioData) {
    try {
      const created = await prisma.ord_metodos_envio.create({ data: metodo });
      metodosEnvio[created.nombre] = created.id;
      console.log(`   ✓ Método envío: ${created.nombre}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        const existing = await prisma.ord_metodos_envio.findFirst({ where: { nombre: metodo.nombre } });
        metodosEnvio[existing!.nombre] = existing!.id;
        console.log(`   ↩ Método envío already exists: ${metodo.nombre}`);
      } else throw e;
    }
  }

  // ==================== MÉTODOS DE PAGO ====================
  console.log('\n📦 Creating métodos de pago...');
  const metodosPagoData = [
    { nombre: 'Tarjeta crédito', descripcion: 'Pago con tarjeta de crédito', tipo: 'tarjeta', requiere_verificacion: true },
    { nombre: 'Transferencia', descripcion: 'Transferencia bancaria', tipo: 'transferencia', requiere_verificacion: true },
    { nombre: 'Contra entrega', descripcion: 'Pago al momento de la entrega', tipo: 'efectivo', requiere_verificacion: false },
  ];

  const metodosPago: Record<string, number> = {};
  for (const metodo of metodosPagoData) {
    try {
      const created = await prisma.ord_metodos_pago.create({ data: metodo });
      metodosPago[created.nombre] = created.id;
      console.log(`   ✓ Método pago: ${created.nombre}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        const existing = await prisma.ord_metodos_pago.findFirst({ where: { nombre: metodo.nombre } });
        metodosPago[existing!.nombre] = existing!.id;
        console.log(`   ↩ Método pago already exists: ${metodo.nombre}`);
      } else throw e;
    }
  }

  // ==================== ESTADOS DE ORDEN ====================
  console.log('\n📦 Creating estados de orden...');
  const estadosOrdenData = [
    { estado: 'pendiente_pago', descripcion: 'Pendiente de pago', color: '#FFA500', orden: 1, permite_cancelacion: true },
    { estado: 'pagada', descripcion: 'Pagada', color: '#4169E1', orden: 2, permite_cancelacion: false },
    { estado: 'en_proceso', descripcion: 'En proceso', color: '#9370DB', orden: 3, permite_cancelacion: false },
    { estado: 'enviada', descripcion: 'Enviada', color: '#4169E1', orden: 4, permite_cancelacion: false },
    { estado: 'entregada', descripcion: 'Entregada', color: '#228B22', orden: 5, permite_cancelacion: false },
  ];

  for (const estado of estadosOrdenData) {
    try {
      await prisma.ord_estados_orden.create({ data: estado });
      console.log(`   ✓ Estado: ${estado.estado}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`   ↩ Estado already exists: ${estado.estado}`);
      } else throw e;
    }
  }

  // ==================== CONFIGURACIÓN DEL SISTEMA ====================
  console.log('\n📦 Creating system configuration...');
  const configData = [
    { clave: 'IGV_RATE', valor: '0.18', descripcion: 'Tasa de IGV (18%)' },
    { clave: 'SHOP_NAME', valor: 'Carrito de Compras', descripcion: 'Nombre de la tienda' },
    { clave: 'SHOP_EMAIL', valor: 'contacto@carrito.com', descripcion: 'Email de contacto' },
    { clave: 'CURRENCY_DEFAULT', valor: 'PEN', descripcion: 'Moneda por defecto' },
    { clave: 'FREE_SHIPPING_THRESHOLD', valor: '200', descripcion: 'Monto mínimo para envío gratis' },
    { clave: 'MAX_PASSWORD_ATTEMPTS', valor: '5', descripcion: 'Máximo de intentos de contraseña' },
    { clave: 'TOKEN_EXPIRY_HOURS', valor: '24', descripcion: 'Horas de expiración del token' },
  ];

  for (const config of configData) {
    try {
      await prisma.configuracion_sistema.create({ data: config });
      console.log(`   ✓ Config: ${config.clave}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`   ↩ Config already exists: ${config.clave}`);
      } else throw e;
    }
  }

  // ==================== INVENTARIO STOCK ====================
  console.log('\n📦 Creating inventory stock...');
  for (const prod of productosData) {
    const prodId = productos[prod.sku];
    if (!prodId) continue;
    try {
      await prisma.inv_stock_producto.create({
        data: {
          id_producto: prodId,
          cantidad: prod.stock,
          reservado: 0,
          disponible: prod.stock,
        },
      });
      console.log(`   ✓ Stock: ${prod.nombre}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`   ↩ Stock already exists: ${prod.nombre}`);
      } else throw e;
    }
  }

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n🔌 Prisma disconnected');
  });
