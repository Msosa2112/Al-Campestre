import { supabase } from './supabaseClient';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  barcode: string;
  image_url: string;
  category: string;
}

export interface Family {
  id: string;
  nickname: string;
  full_name: string;
  address: string;
  province: string;
  municipality: string;
  phone: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  client_name: string;
  family_id: string;
  family_name: string;
  family_phone: string;
  family_address: string;
  items: OrderItem[];
  total_amount: number;
  stripe_payment_id: string;
  status: 'pending' | 'paid' | 'assigned' | 'in_transit' | 'delivered' | 'incident';
  delivery_id: string | null;
  delivery_name: string | null;
  delivery_eta_return: string | null; // ISO Timestamp when the delivery person returns
  created_at: string;
  updated_at: string;
  notes?: string;
  incident_reason?: string;
  refunded?: boolean;
  store_credit_issued?: number;
}

export interface Driver {
  id: string;
  name: string;
  status: 'Disponible' | 'En Ruta' | 'En Retorno';
  active_order_id: string | null;
  return_eta: string | null; // ISO Timestamp
}

// Returns eta to base in minutes based on municipality
export const getReturnTimeForZone = (municipality: string): number => {
  const times: Record<string, number> = {
    'Plaza de la Revolución': 25,
    'Playa': 35,
    'Centro Habana': 30,
    'Habana Vieja': 35,
    'Boyeros': 50,
    'San Antonio de los Baños': 80,
    'Bauta': 70,
    'Bejucal': 90,
    'San José de las Lajas': 100,
  };
  return times[municipality] || 45; // Default 45 minutes
};

const defaultProducts: Product[] = [
  {
    id: 'prod-meat-1',
    name: 'Combo de Res Premium',
    description: '10 lbs de pulpa de res limpia y seleccionada para asar o guisar.',
    price: 45.00,
    stock: 25,
    barcode: '740100512001',
    image_url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-2',
    name: 'Lomo de Cerdo Criollo',
    description: 'Lomo de cerdo fresco y tierno, corte especial para bistec o asados.',
    price: 22.50,
    stock: 35,
    barcode: '740100512002',
    image_url: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-3',
    name: 'Pechuga de Pollo deshuesada',
    description: 'Pechugas de pollo frescas deshuesadas, congeladas en origen.',
    price: 18.00,
    stock: 45,
    barcode: '740100512003',
    image_url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-4',
    name: 'Picadillo de Res Especial',
    description: 'Carne de res molida magra de primera calidad, ideal para picadillos y hamburguesas.',
    price: 8.50,
    stock: 50,
    barcode: '740100512010',
    image_url: 'https://images.unsplash.com/photo-1588168333986-5078647a5c8e?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-5',
    name: 'Jamón York Rebanado',
    description: 'Jamón de cerdo York curado, rebanado en lonjas finas para sándwiches (Paquete de 1 lb).',
    price: 9.90,
    stock: 40,
    barcode: '740100512011',
    image_url: 'https://images.unsplash.com/photo-1524438418049-ab2acb7aa48f?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-6',
    name: 'Chorizo Español Casero',
    description: 'Chorizo curado artesanal con pimentón de la Vera, sabor criollo picante (Pack x4).',
    price: 12.00,
    stock: 30,
    barcode: '740100512012',
    image_url: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-7',
    name: 'Costillas de Cerdo Ahumadas',
    description: 'Costillas de cerdo ahumadas al carbón con leña natural, listas para hornear.',
    price: 19.50,
    stock: 28,
    barcode: '740100512013',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-8',
    name: 'Muslos de Pollo (Caja 10 lbs)',
    description: 'Caja de muslos y contramuslos de pollo americanos seleccionados.',
    price: 24.00,
    stock: 20,
    barcode: '740100512014',
    image_url: 'https://images.unsplash.com/photo-1562967914-01dee72a7e44?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-9',
    name: 'Chuletas de Cerdo Frescas',
    description: 'Chuletas de cerdo con hueso, corte grueso ideal para asados criollos.',
    price: 14.50,
    stock: 32,
    barcode: '740100512015',
    image_url: 'https://images.unsplash.com/photo-1432139786580-d729c67486f5?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-10',
    name: 'Carne Molida de Pavo',
    description: 'Picadillo de pechuga de pavo baja en grasa y alta en proteínas.',
    price: 7.80,
    stock: 45,
    barcode: '740100512016',
    image_url: 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-11',
    name: 'Filete de Pescado Blanco',
    description: 'Filetes de pescado blanco limpios sin espinas, congelados de origen (2 lbs).',
    price: 16.90,
    stock: 25,
    barcode: '740100512017',
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-12',
    name: 'Salchichas de Pollo Hot Dog',
    description: 'Paquete de 10 salchichas de pollo clásicas estilo americano.',
    price: 3.20,
    stock: 80,
    barcode: '740100512018',
    image_url: 'https://images.unsplash.com/photo-1541232972175-127e22a8ae14?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-13',
    name: 'Bacon Ahumado Premium',
    description: 'Tiras de tocino curado y ahumado crujiente (Paquete de 1 lb).',
    price: 8.50,
    stock: 55,
    barcode: '740100512019',
    image_url: 'https://images.unsplash.com/photo-1606850246452-0763f01b22e9?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-14',
    name: 'Carne de Cerdo Troceada',
    description: 'Fricase de cerdo limpio cortado en dados, listo para guisar.',
    price: 11.00,
    stock: 40,
    barcode: '740100512020',
    image_url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-15',
    name: 'Tasajo de Res Curado',
    description: 'Carne de res curada y seca estilo tasajo cubano tradicional.',
    price: 15.50,
    stock: 18,
    barcode: '740100512021',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-grain-1',
    name: 'Frijoles Negros Importados',
    description: 'Frijol negro de primera calidad, cocción rápida y sabor tradicional.',
    price: 3.50,
    stock: 120,
    barcode: '740100512004',
    image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-2',
    name: 'Arroz Blanco Grano Largo',
    description: 'Arroz blanco super extra grano largo de cocción suelta.',
    price: 2.80,
    stock: 180,
    barcode: '740100512005',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-3',
    name: 'Frijoles Colorados Nacionales',
    description: 'Frijoles colorados frescos, ideales para potajes y congris cubano (2 lbs).',
    price: 3.90,
    stock: 95,
    barcode: '740100512022',
    image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-4',
    name: 'Garbanzos Mexicanos',
    description: 'Garbanzo gigante seleccionado, ideal para garbanzadas con chorizo.',
    price: 4.20,
    stock: 110,
    barcode: '740100512023',
    image_url: 'https://images.unsplash.com/photo-1545156521-77bd85671d30?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-5',
    name: 'Lentejas de la Casa',
    description: 'Lentejas tiernas de cocción rápida, ricas en hierro y fibra alimentaria.',
    price: 3.10,
    stock: 130,
    barcode: '740100512024',
    image_url: 'https://images.unsplash.com/photo-1547050605-2f88cd02c374?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-6',
    name: 'Arroz Integral Orgánico',
    description: 'Arroz integral rico en fibra, cocción saludable y grano entero.',
    price: 4.50,
    stock: 80,
    barcode: '740100512025',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-7',
    name: 'Chícharos Partidos Verdes',
    description: 'Chícharo verde partido importado, ideal para sopas y cremas.',
    price: 2.50,
    stock: 140,
    barcode: '740100512026',
    image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-8',
    name: 'Frijoles Blancos Premium',
    description: 'Alubias blancas tiernas, ideales para fabadas y caldos criollos.',
    price: 3.80,
    stock: 85,
    barcode: '740100512027',
    image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-9',
    name: 'Harina de Maíz Amarilla',
    description: 'Harina de maíz fina para tamal en cazuela y polenta criolla (2 lbs).',
    price: 1.90,
    stock: 160,
    barcode: '740100512028',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-10',
    name: 'Quinoa Orgánica 500g',
    description: 'Superalimento quinoa blanca orgánica lavada, lista para hervir.',
    price: 5.80,
    stock: 50,
    barcode: '740100512029',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-dairy-1',
    name: 'Queso Blanco Criollo',
    description: 'Queso blanco semiduro artesanal, ideal para freír o comer fresco.',
    price: 7.50,
    stock: 30,
    barcode: '740100512006',
    image_url: 'https://images.unsplash.com/photo-1486887396181-e090ad70a6c8?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-2',
    name: 'Leche Condensada Nestlé',
    description: 'Leche condensada azucarada en lata de 397g para postres y café.',
    price: 3.20,
    stock: 65,
    barcode: '740100512007',
    image_url: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-3',
    name: 'Queso Gouda Importado',
    description: 'Queso Gouda joven en bloque de 1 lb, excelente fundición y cremosidad.',
    price: 12.50,
    stock: 45,
    barcode: '740100512030',
    image_url: 'https://images.unsplash.com/photo-1486887396181-e090ad70a6c8?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-4',
    name: 'Leche en Polvo Entera 1kg',
    description: 'Leche entera instantánea de alta calidad fortificada con vitaminas.',
    price: 16.90,
    stock: 120,
    barcode: '740100512031',
    image_url: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-5',
    name: 'Mantequilla Criolla',
    description: 'Mantequilla pura de vaca con sal, sabor artesanal cubano (Paquete de 250g).',
    price: 4.50,
    stock: 70,
    barcode: '740100512032',
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-6',
    name: 'Yogur Natural Sin Azúcar',
    description: 'Yogur natural cremoso, fermentado naturalmente sin aditivos (1 Litro).',
    price: 2.20,
    stock: 50,
    barcode: '740100512033',
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-7',
    name: 'Queso Crema Philadelphia',
    description: 'Queso crema clásico suave para untar en pan y tostadas (taza de 226g).',
    price: 5.90,
    stock: 60,
    barcode: '740100512034',
    image_url: 'https://images.unsplash.com/photo-1486887396181-e090ad70a6c8?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-8',
    name: 'Crema de Leche Para Batir',
    description: 'Nata líquida con 35% de materia grasa para repostería y salsas.',
    price: 4.10,
    stock: 40,
    barcode: '740100512035',
    image_url: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-9',
    name: 'Margarina Vegetal 500g',
    description: 'Margarina untable enriquecida con Omega 3 y libre de grasas trans.',
    price: 3.50,
    stock: 75,
    barcode: '740100512036',
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-10',
    name: 'Leche Evaporada Carnation',
    description: 'Leche evaporada Nestlé Carnation en lata de 354ml, ideal para postres.',
    price: 2.80,
    stock: 90,
    barcode: '740100512037',
    image_url: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-grocery-1',
    name: 'Aceite de Girasol 1L',
    description: 'Aceite vegetal refinado de girasol 100% puro para cocinar.',
    price: 5.50,
    stock: 90,
    barcode: '740100512008',
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-2',
    name: 'Café La Llave 284g',
    description: 'Café expreso molido cubano de tueste oscuro y sabor intenso.',
    price: 6.90,
    stock: 110,
    barcode: '740100512009',
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-3',
    name: 'Harina de Trigo Todo Uso',
    description: 'Harina de trigo blanca refinada para repostería y pan (Paquete de 1kg).',
    price: 2.50,
    stock: 140,
    barcode: '740100512038',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-4',
    name: 'Azúcar Blanca Refinada',
    description: 'Azúcar de caña refinada blanca de alta pureza (2 lbs).',
    price: 1.80,
    stock: 150,
    barcode: '740100512039',
    image_url: 'https://images.unsplash.com/photo-1581447109200-bf2769116db0?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-5',
    name: 'Puré de Tomate Concentrado',
    description: 'Puré de tomate concentrado estilo cubano para salsas y guisados (300g).',
    price: 1.90,
    stock: 120,
    barcode: '740100512040',
    image_url: 'https://images.unsplash.com/photo-1590561991957-a55d787b629e?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-6',
    name: 'Espaguetis Italianos 500g',
    description: 'Pasta de sémola de trigo duro espaguetis número 5 tradicionales.',
    price: 2.10,
    stock: 130,
    barcode: '740100512041',
    image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-7',
    name: 'Galletas de Soda Familiares',
    description: 'Paquete familiar de galletas de soda saladas y crujientes (Caja de 500g).',
    price: 3.90,
    stock: 100,
    barcode: '740100512042',
    image_url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-8',
    name: 'Cerveza Cristal (Pack 6)',
    description: 'La preferida de Cuba. Paquete de 6 latas de cerveza clara Cristal.',
    price: 14.00,
    stock: 60,
    barcode: '740100512043',
    image_url: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-9',
    name: 'Refresco Ciego Montero Cola',
    description: 'Lata de refresco nacional cubano de cola Ciego Montero (355ml).',
    price: 1.50,
    stock: 200,
    barcode: '740100512044',
    image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-10',
    name: 'Detergente en Polvo 1kg',
    description: 'Detergente multiusos activo con aroma fresco para ropa blanca y de color.',
    price: 4.90,
    stock: 85,
    barcode: '740100512045',
    image_url: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-11',
    name: 'Jabón de Baño Olor Suave',
    description: 'Jabón de tocador cremoso para el cuidado diario de la piel (Pack x3).',
    price: 1.20,
    stock: 150,
    barcode: '740100512046',
    image_url: 'https://images.unsplash.com/photo-1607006342411-b0135f082f25?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-12',
    name: 'Crema Dental Colgate 150g',
    description: 'Crema dental Colgate Triple Acción protección anticaries y aliento fresco.',
    price: 2.50,
    stock: 110,
    barcode: '740100512047',
    image_url: 'https://images.unsplash.com/photo-1559591937-e1b697ff2fbf?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-13',
    name: 'Desodorante Rexona Roll-on',
    description: 'Desodorante antitranspirante roll-on protección 48h de larga duración.',
    price: 3.20,
    stock: 90,
    barcode: '740100512048',
    image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-14',
    name: 'Papel Higiénico (Pack x4)',
    description: 'Rollos de papel higiénico doble hoja suave de alta resistencia.',
    price: 2.90,
    stock: 100,
    barcode: '740100512049',
    image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-15',
    name: 'Atún en Aceite de Girasol',
    description: 'Lata de lomos de atún claro en aceite de girasol de primera calidad (170g).',
    price: 1.80,
    stock: 140,
    barcode: '740100512050',
    image_url: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&q=80',
    category: 'Abarrotes'
  }
];

const defaultFamilies: Family[] = [
  {
    id: 'fam-default-1',
    nickname: 'Abuela María',
    full_name: 'María Gutiérrez Delgado',
    address: 'Calle 23 #152 e/ L y M, Apto 3B',
    province: 'La Habana',
    municipality: 'Plaza de la Revolución',
    phone: '+53 51234567'
  },
  {
    id: 'fam-default-2',
    nickname: 'Tío Juan',
    full_name: 'Juan Carlos Valdés Pérez',
    address: 'Calle Primera #12 e/ Central y Final',
    province: 'Artemisa',
    municipality: 'San Antonio de los Baños',
    phone: '+53 59876543'
  }
];

const defaultDrivers: Driver[] = [
  { id: 'driver-1', name: 'Yoan Martínez', status: 'Disponible', active_order_id: null, return_eta: null },
  { id: 'driver-2', name: 'Eduardo Gómez', status: 'Disponible', active_order_id: null, return_eta: null }
];

export const initializeDb = async (force: boolean = false) => {
  if (force) {
    console.log("Forcing database reset...");
    // Clean up Supabase tables
    await supabase.from('orders').delete().neq('id', '');
    await supabase.from('products').delete().neq('id', '');
    await supabase.from('families').delete().neq('id', '');
    await supabase.from('drivers').delete().neq('id', '');
    
    // Seed default datasets in Supabase
    await supabase.from('products').insert(defaultProducts);
    await supabase.from('families').insert(defaultFamilies);
    await supabase.from('drivers').insert(defaultDrivers);
    console.log("Supabase database successfully reset and seeded!");
    return;
  }

  // Normal check: if empty, query functions will auto-seed themselves.
  const prods = await getProducts();
  const fams = await getFamilies();
  const drvs = await getDrivers();
};

export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  if (!data || data.length === 0) {
    console.log('No products in Supabase, seeding default products...');
    const { error: seedError } = await supabase
      .from('products')
      .insert(defaultProducts);
    if (seedError) {
      console.error('Error seeding default products:', seedError);
      return defaultProducts;
    }
    return defaultProducts;
  }
  return data || [];
};

export const saveProduct = async (product: Product): Promise<Product[]> => {
  const { error } = await supabase
    .from('products')
    .upsert(product);
  if (error) {
    console.error('Error saving product:', error);
  }
  return getProducts();
};

export const addProductStock = async (barcode: string, quantity: number): Promise<{ success: boolean; product?: Product }> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .single();
  if (error || !data) {
    console.error('Error fetching product for stock add:', error);
    return { success: false };
  }
  const newStock = data.stock + quantity;
  const { data: updatedData, error: updateError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('barcode', barcode)
    .select()
    .single();
  if (updateError || !updatedData) {
    console.error('Error updating product stock:', updateError);
    return { success: false };
  }
  return { success: true, product: updatedData };
};



export const getFamilies = async (): Promise<Family[]> => {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .order('nickname', { ascending: true });
  if (error) {
    console.error('Error fetching families:', error);
    return [];
  }
  if (!data || data.length === 0) {
    console.log('No families in Supabase, seeding default families...');
    const { error: seedError } = await supabase
      .from('families')
      .insert(defaultFamilies);
    if (seedError) {
      console.error('Error seeding default families:', seedError);
      return defaultFamilies;
    }
    return defaultFamilies;
  }
  return data || [];
};

export const saveFamily = async (family: Family): Promise<Family[]> => {
  const { error } = await supabase
    .from('families')
    .upsert(family);
  if (error) {
    console.error('Error saving family:', error);
  }
  return getFamilies();
};

export const deleteFamily = async (id: string): Promise<Family[]> => {
  const { error } = await supabase
    .from('families')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting family:', error);
  }
  return getFamilies();
};

export const getOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return data || [];
};

export const saveOrder = async (order: Order): Promise<Order[]> => {
  const { error } = await supabase
    .from('orders')
    .upsert(order);
  if (error) {
    console.error('Error saving order:', error);
  }
  return getOrders();
};

export const createOrderWithStockCheck = async (
  items: { productId: string; quantity: number }[],
  familyId: string,
  clientName: string = 'Miguel Ángel (Miami)'
): Promise<{ success: boolean; error?: string; order?: Order }> => {
  const { data: family, error: famError } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single();

  if (famError || !family) {
    return { success: false, error: 'Familiar receptor no encontrado' };
  }

  const productIds = items.map(i => i.productId);
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds);

  if (prodError || !products) {
    return { success: false, error: 'Error al consultar productos' };
  }

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      return { success: false, error: `Producto no encontrado` };
    }
    if (product.stock < item.quantity) {
      return { success: false, error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}` };
    }
  }

  const orderItems: OrderItem[] = [];
  let totalAmount = 0;

  for (const item of items) {
    const product = products.find(p => p.id === item.productId)!;
    const newStock = product.stock - item.quantity;
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', product.id);

    if (updateError) {
      return { success: false, error: `Error al actualizar stock de ${product.name}` };
    }

    orderItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      price: product.price
    });
    totalAmount += product.price * item.quantity;
  }

  const orderId = `FAC-${Math.floor(1000 + Math.random() * 9000)}`;
  const newOrder: Order = {
    id: orderId,
    client_name: clientName,
    family_id: family.id,
    family_name: family.full_name,
    family_phone: family.phone,
    family_address: `${family.address}, ${family.municipality}, ${family.province}`,
    items: orderItems,
    total_amount: parseFloat(totalAmount.toFixed(2)),
    stripe_payment_id: `ch_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`,
    status: 'paid',
    delivery_id: null,
    delivery_name: null,
    delivery_eta_return: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error: orderInsertError } = await supabase
    .from('orders')
    .insert(newOrder);

  if (orderInsertError) {
    console.error('Error inserting order:', orderInsertError);
    return { success: false, error: 'Error al registrar el pedido en base de datos.' };
  }

  return { success: true, order: newOrder };
};



export const getDrivers = async (): Promise<Driver[]> => {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('name', { ascending: true });
  if (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
  if (!data || data.length === 0) {
    console.log('No drivers in Supabase, seeding default drivers...');
    const { error: seedError } = await supabase
      .from('drivers')
      .insert(defaultDrivers);
    if (seedError) {
      console.error('Error seeding default drivers:', seedError);
      return defaultDrivers;
    }
    return defaultDrivers;
  }
  return data || [];
};

export const saveDrivers = async (drivers: Driver[]): Promise<void> => {
  for (const d of drivers) {
    const { error } = await supabase
      .from('drivers')
      .upsert(d);
    if (error) {
      console.error('Error saving driver:', error);
    }
  }
};

export const assignOrderToDriver = async (orderId: string, driverId: string): Promise<boolean> => {
  const { data: driver, error: drvError } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .single();

  const { data: order, error: ordError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (drvError || ordError || !driver || !order) {
    console.error('Error getting driver/order for assignment:', drvError, ordError);
    return false;
  }

  const { error: updDrvError } = await supabase
    .from('drivers')
    .update({
      status: 'En Ruta',
      active_order_id: orderId,
      return_eta: null
    })
    .eq('id', driverId);

  const { error: updOrdError } = await supabase
    .from('orders')
    .update({
      status: 'assigned',
      delivery_id: driver.id,
      delivery_name: driver.name,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (updDrvError || updOrdError) {
    console.error('Error during assignment update:', updDrvError, updOrdError);
    return false;
  }

  return true;
};

export const updateDeliveryMilestone = async (
  orderId: string,
  status: 'assigned' | 'in_transit' | 'delivered' | 'incident',
  notes?: string,
  incidentReason?: string
): Promise<{ success: boolean; order?: Order; whatsappNotificationSimulated?: string }> => {
  const { data: order, error: ordError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (ordError || !order) {
    console.error('Error fetching order for milestone update:', ordError);
    return { success: false };
  }

  const orderUpdates: Partial<Order> = {
    status,
    updated_at: new Date().toISOString()
  };
  if (notes) orderUpdates.notes = notes;
  if (incidentReason) orderUpdates.incident_reason = incidentReason;

  let whatsappNotificationSimulated = '';

  if (status === 'in_transit') {
    whatsappNotificationSimulated = `Notificación de WhatsApp enviada a ${order.family_name} (${order.family_phone}): "¡Hola! Su pedido de Restaurant Al Campestre está en camino con nuestro repartidor ${order.delivery_name || 'asignado'}. Prepárese para recibirlo."`;
  }

  if (status === 'delivered' || status === 'incident') {
    if (order.delivery_id) {
      if (status === 'delivered') {
        const address = order.family_address || '';
        const parts = address.split(',');
        const municipality = parts.length > 1 ? parts[parts.length - 2].trim() : 'Plaza de la Revolución';
        const mins = getReturnTimeForZone(municipality);
        const returnTime = new Date(Date.now() + mins * 60 * 1000);

        orderUpdates.delivery_eta_return = returnTime.toISOString();

        await supabase
          .from('drivers')
          .update({
            status: 'En Retorno',
            active_order_id: null,
            return_eta: returnTime.toISOString()
          })
          .eq('id', order.delivery_id);

        whatsappNotificationSimulated = `Notificación de WhatsApp enviada a ${order.family_name} (${order.family_phone}): "¡Hola! Su pedido ${order.id} ha sido entregado exitosamente. ¡Gracias por confiar en Restaurant Al Campestre!"`;
      } else {
        await supabase
          .from('drivers')
          .update({
            status: 'Disponible',
            active_order_id: null,
            return_eta: null
          })
          .eq('id', order.delivery_id);
      }
    }
  }

  const { data: updatedOrder, error: updOrdErr } = await supabase
    .from('orders')
    .update(orderUpdates)
    .eq('id', orderId)
    .select()
    .single();

  if (updOrdErr) {
    console.error('Error updating order milestone:', updOrdErr);
    return { success: false };
  }

  return { success: true, order: updatedOrder, whatsappNotificationSimulated };
};

export const checkDriverReturnStatus = async (): Promise<void> => {
  const { data: drivers, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('status', 'En Retorno');

  if (error || !drivers) return;

  const now = new Date().getTime();

  for (const d of drivers) {
    if (d.return_eta) {
      const eta = new Date(d.return_eta).getTime();
      if (now >= eta) {
        await supabase
          .from('drivers')
          .update({
            status: 'Disponible',
            return_eta: null,
            active_order_id: null
          })
          .eq('id', d.id);
      }
    }
  }
};

export const issueRefund = async (
  orderId: string,
  amount: number,
  mode: 'stripe' | 'credit'
): Promise<{ success: boolean; refundAmount?: number; storeCredit?: number }> => {
  const { data: order, error: ordError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (ordError || !order) {
    console.error('Error fetching order for refund:', ordError);
    return { success: false };
  }

  const newNotes = `${order.notes || ''} [${
    mode === 'stripe' ? 'Reembolso Stripe' : 'Crédito de tienda'
  } $${amount} emitido el ${new Date().toLocaleDateString()}]`;

  const updates: Partial<Order> = {
    notes: newNotes,
    updated_at: new Date().toISOString()
  };

  if (mode === 'stripe') {
    updates.refunded = true;
  } else {
    updates.store_credit_issued = amount;
  }

  const { error: updError } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId);

  if (updError) {
    console.error('Error issuing refund:', updError);
    return { success: false };
  }

  return {
    success: true,
    refundAmount: mode === 'stripe' ? amount : undefined,
    storeCredit: mode === 'credit' ? amount : undefined
  };
};
