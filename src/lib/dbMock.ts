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
  delivery_eta_return: string | null;
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
  return_eta: string | null;
}

// Helpers checking environment and localStorage availability
const isSupabaseConfigured = (): boolean => {
  if (typeof window === 'undefined') return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && !url.includes('placeholder') && key && !key.includes('placeholder'));
};

const getLocalData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
};

const setLocalData = <T>(key: string, value: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

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
  return times[municipality] || 45;
};

const defaultProducts: Product[] = [
  // ==================== CARNES ====================
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
    name: 'Pechuga de Pollo Deshuesada',
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
    name: 'Chorizo Criollo Ahumado',
    description: 'Paquete de 6 unidades de chorizo ahumado artesanal, sabor criollo.',
    price: 11.20,
    stock: 35,
    barcode: '740100512012',
    image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-7',
    name: 'Chuletas de Cerdo Frescas',
    description: 'Paquete de 4 chuletas de cerdo de corte grueso listas para asar.',
    price: 14.80,
    stock: 30,
    barcode: '740100512013',
    image_url: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-8',
    name: 'Muslos de Pollo Especial',
    description: 'Bolsa de 5 lbs de contramuslos y muslos de pollo frescos.',
    price: 12.00,
    stock: 55,
    barcode: '740100512014',
    image_url: 'https://images.unsplash.com/photo-1587593817642-8b9a751c1f3c?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-9',
    name: 'Carne de Cerdo Troceada',
    description: '3 lbs de carne de cerdo limpia cortada en trozos, ideal para guisar o freír.',
    price: 16.50,
    stock: 30,
    barcode: '740100512015',
    image_url: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-meat-10',
    name: 'Salchichas de Pollo Hot Dog',
    description: 'Paquete de 10 salchichas de pollo clásicas estilo americano.',
    price: 5.20,
    stock: 60,
    barcode: '740100512016',
    image_url: 'https://images.unsplash.com/photo-1524438418049-ab2acb7aa48f?w=600&q=80',
    category: 'Carnes'
  },
  // ==================== GRANOS ====================
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
    name: 'Frijoles Colorados Premium',
    description: 'Frijol colorado seleccionado de grano grande, cocción tierna y rápida (Bolsa de 2 lbs).',
    price: 3.90,
    stock: 90,
    barcode: '740100512017',
    image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-4',
    name: 'Garbanzos Extra Selección',
    description: 'Garbanzos secos de primera calidad, importados para potajes y hummus (Bolsa de 2 lbs).',
    price: 4.20,
    stock: 80,
    barcode: '740100512018',
    image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-5',
    name: 'Lentejas Importadas Tiernas',
    description: 'Lenteja tierna de rápida cocción, rica en hierro y fibra (Bolsa de 2 lbs).',
    price: 3.10,
    stock: 110,
    barcode: '740100512019',
    image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-6',
    name: 'Arroz Integral Fibra',
    description: 'Arroz integral rico en fibra, cocción saludable y grano entero (Bolsa de 2 lbs).',
    price: 3.50,
    stock: 75,
    barcode: '740100512020',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-7',
    name: 'Chícharos Partidos Verdes',
    description: 'Chícharo verde partido importado, ideal para sopas y cremas (Bolsa de 2 lbs).',
    price: 2.50,
    stock: 140,
    barcode: '740100512021',
    image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-8',
    name: 'Harina de Maíz Amarilla',
    description: 'Harina de maíz fina para tamal en cazuela y polenta criolla (Bolsa de 2 lbs).',
    price: 2.20,
    stock: 160,
    barcode: '740100512022',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-9',
    name: 'Quinoa Orgánica Blanca',
    description: 'Superalimento quinoa blanca orgánica lavada, lista para hervir (Paquete de 500g).',
    price: 6.80,
    stock: 50,
    barcode: '740100512023',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-grain-10',
    name: 'Frijol Blanco Criollo',
    description: 'Frijoles blancos seleccionados para potajes tradicionales (Bolsa de 2 lbs).',
    price: 3.80,
    stock: 85,
    barcode: '740100512024',
    image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&q=80',
    category: 'Granos'
  },
  // ==================== LÁCTEOS ====================
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
    description: 'Queso Gouda joven en bloque de 1 lb, excelente fundición y sabor cremoso.',
    price: 11.50,
    stock: 45,
    barcode: '740100512025',
    image_url: 'https://images.unsplash.com/photo-1486887396181-e090ad70a6c8?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-4',
    name: 'Leche en Polvo Entera 1kg',
    description: 'Leche entera instantánea de alta calidad fortificada con vitaminas.',
    price: 14.00,
    stock: 80,
    barcode: '740100512026',
    image_url: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-5',
    name: 'Mantequilla Anchor con Sal',
    description: 'Mantequilla neozelandesa pura de pastoreo, barra de 227g.',
    price: 4.80,
    stock: 90,
    barcode: '740100512027',
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-6',
    name: 'Yogur Natural Sin Azúcar',
    description: 'Yogur natural cremoso, sin azúcar añadida ni conservantes (Pote de 500g).',
    price: 2.90,
    stock: 40,
    barcode: '740100512028',
    image_url: 'https://images.unsplash.com/photo-1486887396181-e090ad70a6c8?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-7',
    name: 'Queso Crema Clásico',
    description: 'Queso crema clásico suave para untar en pan y tostadas (Taza de 226g).',
    price: 3.60,
    stock: 55,
    barcode: '740100512029',
    image_url: 'https://images.unsplash.com/photo-1486887396181-e090ad70a6c8?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-8',
    name: 'Crema de Leche Repostería',
    description: 'Nata líquida con 35% de materia grasa para repostería y salsas (Caja de 250ml).',
    price: 4.20,
    stock: 60,
    barcode: '740100512030',
    image_url: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-9',
    name: 'Leche Evaporada Carnation',
    description: 'Leche evaporada Nestlé Carnation en lata de 354ml, ideal para postres.',
    price: 2.80,
    stock: 70,
    barcode: '740100512031',
    image_url: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-dairy-10',
    name: 'Queso Mozzarella Rallado',
    description: 'Queso mozzarella rallado de fácil derretimiento para pizzas y pastas (Bolsa de 1 lb).',
    price: 6.90,
    stock: 50,
    barcode: '740100512032',
    image_url: 'https://images.unsplash.com/photo-1486887396181-e090ad70a6c8?w=600&q=80',
    category: 'Lácteos'
  },
  // ==================== ABARROTES ====================
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
    name: 'Azúcar Blanca Refinada',
    description: 'Azúcar de caña refinada blanca de alta pureza (Bolsa de 2 lbs).',
    price: 2.50,
    stock: 130,
    barcode: '740100512033',
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-4',
    name: 'Puré de Tomate Concentrado',
    description: 'Puré de tomate concentrado estilo cubano para salsas y guisados (Lata de 300g).',
    price: 1.80,
    stock: 150,
    barcode: '740100512034',
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-5',
    name: 'Pasta Espaguetis La Italiana',
    description: 'Pasta de sémola de trigo duro espaguetis número 5 tradicionales (Paquete de 500g).',
    price: 1.90,
    stock: 160,
    barcode: '740100512035',
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-6',
    name: 'Atún en Aceite de Girasol',
    description: 'Lomos de atún claro en aceite vegetal de girasol (Lata de 140g).',
    price: 2.20,
    stock: 80,
    barcode: '740100512036',
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-7',
    name: 'Mayonesa Real Kraft',
    description: 'Mayonesa clásica cremosa e importada para ensaladas y untar (Frasco de 443ml).',
    price: 4.50,
    stock: 95,
    barcode: '740100512037',
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-8',
    name: 'Salsa de Tomate Tradicional',
    description: 'Salsa para pastas tradicional con hierbas italianas (Frasco de 680g).',
    price: 3.80,
    stock: 85,
    barcode: '740100512038',
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-9',
    name: 'Sal de Mesa Yodada',
    description: 'Sal de mesa refinada yodada de alta pureza para cocina (Bolsa de 1kg).',
    price: 1.20,
    stock: 200,
    barcode: '740100512039',
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-grocery-10',
    name: 'Vinagre Criollo de Caña',
    description: 'Vinagre blanco de caña fermentado, ideal para aderezos y conservas (Botella de 750ml).',
    price: 1.90,
    stock: 120,
    barcode: '740100512040',
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',
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
  { id: 'driver-1', name: 'Juan Carlos Pérez', status: 'Disponible', active_order_id: null, return_eta: null },
  { id: 'driver-2', name: 'Yusniel Gómez', status: 'Disponible', active_order_id: null, return_eta: null },
  { id: 'driver-3', name: 'Marcos Gómez', status: 'Disponible', active_order_id: null, return_eta: null }
];

export const initializeDb = async (force: boolean = false) => {
  if (!isSupabaseConfigured()) {
    if (force || !localStorage.getItem('campestre_products')) {
      setLocalData('campestre_products', defaultProducts);
      setLocalData('campestre_families', defaultFamilies);
      setLocalData('campestre_drivers', defaultDrivers);
      setLocalData('campestre_orders', []);
      console.log("Local Storage database successfully reset and seeded!");
    }
    return;
  }
  try {
    if (force) {
      console.log("Forcing database reset...");
      await supabase.from('orders').delete().neq('id', '');
      await supabase.from('products').delete().neq('id', '');
      await supabase.from('families').delete().neq('id', '');
      await supabase.from('drivers').delete().neq('id', '');
      
      await supabase.from('products').insert(defaultProducts);
      await supabase.from('families').insert(defaultFamilies);
      await supabase.from('drivers').insert(defaultDrivers);
      console.log("Supabase database successfully reset and seeded!");
    } else {
      await getProducts();
      await getFamilies();
      await getDrivers();
    }
  } catch (err) {
    console.error("Supabase initializeDb failed, falling back to local storage:", err);
  }
};

export const getProducts = async (): Promise<Product[]> => {
  if (!isSupabaseConfigured()) {
    return getLocalData('campestre_products', defaultProducts);
  }
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) {
      await supabase.from('products').insert(defaultProducts);
      return defaultProducts;
    }
    return data;
  } catch (err) {
    console.warn("Supabase getProducts failed, using local storage:", err);
    return getLocalData('campestre_products', defaultProducts);
  }
};

export const saveProduct = async (product: Product): Promise<Product[]> => {
  if (!isSupabaseConfigured()) {
    const prods = getLocalData('campestre_products', defaultProducts);
    const index = prods.findIndex(p => p.id === product.id);
    if (index >= 0) prods[index] = product;
    else prods.push(product);
    setLocalData('campestre_products', prods);
    return prods;
  }
  try {
    const { error } = await supabase.from('products').upsert(product);
    if (error) throw error;
  } catch (err) {
    console.warn("Supabase saveProduct failed, using local storage:", err);
    const prods = getLocalData('campestre_products', defaultProducts);
    const index = prods.findIndex(p => p.id === product.id);
    if (index >= 0) prods[index] = product;
    else prods.push(product);
    setLocalData('campestre_products', prods);
  }
  return getProducts();
};

export const addProductStock = async (barcode: string, quantity: number): Promise<{ success: boolean; product?: Product }> => {
  if (!isSupabaseConfigured()) {
    const prods = getLocalData('campestre_products', defaultProducts);
    const prod = prods.find(p => p.barcode === barcode);
    if (!prod) return { success: false };
    prod.stock += quantity;
    setLocalData('campestre_products', prods);
    return { success: true, product: prod };
  }
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .single();
    if (error || !data) throw error;
    const newStock = data.stock + quantity;
    const { data: updatedData, error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('barcode', barcode)
      .select()
      .single();
    if (updateError || !updatedData) throw updateError;
    return { success: true, product: updatedData };
  } catch (err) {
    console.warn("Supabase addProductStock failed, using local storage:", err);
    const prods = getLocalData('campestre_products', defaultProducts);
    const prod = prods.find(p => p.barcode === barcode);
    if (!prod) return { success: false };
    prod.stock += quantity;
    setLocalData('campestre_products', prods);
    return { success: true, product: prod };
  }
};

export const getFamilies = async (): Promise<Family[]> => {
  if (!isSupabaseConfigured()) {
    return getLocalData('campestre_families', defaultFamilies);
  }
  try {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .order('nickname', { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) {
      await supabase.from('families').insert(defaultFamilies);
      return defaultFamilies;
    }
    return data;
  } catch (err) {
    console.warn("Supabase getFamilies failed, using local storage:", err);
    return getLocalData('campestre_families', defaultFamilies);
  }
};

export const saveFamily = async (family: Family): Promise<Family[]> => {
  if (!isSupabaseConfigured()) {
    const fams = getLocalData('campestre_families', defaultFamilies);
    const index = fams.findIndex(f => f.id === family.id);
    if (index >= 0) fams[index] = family;
    else fams.push(family);
    setLocalData('campestre_families', fams);
    return fams;
  }
  try {
    const { error } = await supabase.from('families').upsert(family);
    if (error) throw error;
  } catch (err) {
    console.warn("Supabase saveFamily failed, using local storage:", err);
    const fams = getLocalData('campestre_families', defaultFamilies);
    const index = fams.findIndex(f => f.id === family.id);
    if (index >= 0) fams[index] = family;
    else fams.push(family);
    setLocalData('campestre_families', fams);
  }
  return getFamilies();
};

export const deleteFamily = async (id: string): Promise<Family[]> => {
  if (!isSupabaseConfigured()) {
    const fams = getLocalData('campestre_families', defaultFamilies);
    const filtered = fams.filter(f => f.id !== id);
    setLocalData('campestre_families', filtered);
    return filtered;
  }
  try {
    const { error } = await supabase.from('families').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.warn("Supabase deleteFamily failed, using local storage:", err);
    const fams = getLocalData('campestre_families', defaultFamilies);
    const filtered = fams.filter(f => f.id !== id);
    setLocalData('campestre_families', filtered);
    return filtered;
  }
  return getFamilies();
};

export const getOrders = async (): Promise<Order[]> => {
  if (!isSupabaseConfigured()) {
    return getLocalData<Order[]>('campestre_orders', []);
  }
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("Supabase getOrders failed, using local storage:", err);
    return getLocalData<Order[]>('campestre_orders', []);
  }
};

export const saveOrder = async (order: Order): Promise<Order[]> => {
  if (!isSupabaseConfigured()) {
    const ords = getLocalData<Order[]>('campestre_orders', []);
    const index = ords.findIndex(o => o.id === order.id);
    if (index >= 0) ords[index] = order;
    else ords.push(order);
    setLocalData('campestre_orders', ords);
    return ords;
  }
  try {
    const { error } = await supabase.from('orders').upsert(order);
    if (error) throw error;
  } catch (err) {
    console.warn("Supabase saveOrder failed, using local storage:", err);
    const ords = getLocalData<Order[]>('campestre_orders', []);
    const index = ords.findIndex(o => o.id === order.id);
    if (index >= 0) ords[index] = order;
    else ords.push(order);
    setLocalData('campestre_orders', ords);
  }
  return getOrders();
};

export const createOrderWithStockCheck = async (
  items: { productId: string; quantity: number }[],
  familyId: string,
  clientName: string = 'Miguel Ángel (Miami)'
): Promise<{ success: boolean; error?: string; order?: Order }> => {
  
  const processLocalCheckout = () => {
    const families = getLocalData('campestre_families', defaultFamilies);
    const family = families.find(f => f.id === familyId);
    if (!family) return { success: false, error: 'Familiar receptor no encontrado' };

    const products = getLocalData('campestre_products', defaultProducts);
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) return { success: false, error: `Producto no encontrado` };
      if (product.stock < item.quantity) {
        return { success: false, error: `Stock insuficiente para ${product.name}.` };
      }
    }

    const orderItems: OrderItem[] = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)!;
      product.stock -= item.quantity;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price
      });
      totalAmount += product.price * item.quantity;
    }

    setLocalData('campestre_products', products);

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
      stripe_payment_id: `ch_${Math.random().toString(36).substring(2, 10)}`,
      status: 'paid',
      delivery_id: null,
      delivery_name: null,
      delivery_eta_return: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const ords = getLocalData<Order[]>('campestre_orders', []);
    ords.unshift(newOrder);
    setLocalData('campestre_orders', ords);
    return { success: true, order: newOrder };
  };

  if (!isSupabaseConfigured()) {
    return processLocalCheckout();
  }

  try {
    const { data: family, error: famError } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();

    if (famError || !family) throw famError;

    const productIds = items.map(i => i.productId);
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (prodError || !products) throw prodError;

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) return { success: false, error: `Producto no encontrado` };
      if (product.stock < item.quantity) {
        return { success: false, error: `Stock insuficiente para ${product.name}.` };
      }
    }

    const orderItems: OrderItem[] = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)!;
      const newStock = product.stock - item.quantity;
      await supabase.from('products').update({ stock: newStock }).eq('id', product.id);

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
      stripe_payment_id: `ch_${Math.random().toString(36).substring(2, 10)}`,
      status: 'paid',
      delivery_id: null,
      delivery_name: null,
      delivery_eta_return: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await supabase.from('orders').insert(newOrder);
    return { success: true, order: newOrder };
  } catch (err) {
    console.warn("Supabase createOrderWithStockCheck failed, using local storage:", err);
    return processLocalCheckout();
  }
};

export const getDrivers = async (): Promise<Driver[]> => {
  if (!isSupabaseConfigured()) {
    return getLocalData('campestre_drivers', defaultDrivers);
  }
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) {
      await supabase.from('drivers').insert(defaultDrivers);
      return defaultDrivers;
    }
    return data;
  } catch (err) {
    console.warn("Supabase getDrivers failed, using local storage:", err);
    return getLocalData('campestre_drivers', defaultDrivers);
  }
};

export const saveDrivers = async (drivers: Driver[]): Promise<void> => {
  if (!isSupabaseConfigured()) {
    setLocalData('campestre_drivers', drivers);
    return;
  }
  try {
    for (const d of drivers) {
      await supabase.from('drivers').upsert(d);
    }
  } catch (err) {
    console.warn("Supabase saveDrivers failed, using local storage:", err);
    setLocalData('campestre_drivers', drivers);
  }
};

export const assignOrderToDriver = async (orderId: string, driverId: string): Promise<boolean> => {
  const processLocalAssignment = () => {
    const drivers = getLocalData('campestre_drivers', defaultDrivers);
    const orders = getLocalData<Order[]>('campestre_orders', []);
    const driver = drivers.find(d => d.id === driverId);
    const order = orders.find(o => o.id === orderId);
    if (!driver || !order) return false;

    driver.status = 'En Ruta';
    driver.active_order_id = orderId;
    order.status = 'assigned';
    order.delivery_id = driverId;
    order.delivery_name = driver.name;
    order.updated_at = new Date().toISOString();

    setLocalData('campestre_drivers', drivers);
    setLocalData('campestre_orders', orders);
    return true;
  };

  if (!isSupabaseConfigured()) {
    return processLocalAssignment();
  }

  try {
    const { data: driver, error: drvError } = await supabase.from('drivers').select('*').eq('id', driverId).single();
    const { data: order, error: ordError } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (drvError || ordError || !driver || !order) throw drvError || ordError;

    await supabase.from('drivers').update({ status: 'En Ruta', active_order_id: orderId, return_eta: null }).eq('id', driverId);
    await supabase.from('orders').update({ status: 'assigned', delivery_id: driver.id, delivery_name: driver.name, updated_at: new Date().toISOString() }).eq('id', orderId);
    return true;
  } catch (err) {
    console.warn("Supabase assignOrderToDriver failed, using local storage:", err);
    return processLocalAssignment();
  }
};

export const updateDeliveryMilestone = async (
  orderId: string,
  status: 'assigned' | 'in_transit' | 'delivered' | 'incident',
  notes?: string,
  incidentReason?: string
): Promise<{ success: boolean; order?: Order; whatsappNotificationSimulated?: string }> => {
  
  const processLocalMilestone = () => {
    const orders = getLocalData<Order[]>('campestre_orders', []);
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false };

    order.status = status;
    order.updated_at = new Date().toISOString();
    if (notes) order.notes = notes;
    if (incidentReason) order.incident_reason = incidentReason;

    let whatsappNotificationSimulated = '';
    if (status === 'in_transit') {
      whatsappNotificationSimulated = `Notificación de WhatsApp enviada a ${order.family_name} (${order.family_phone}): "¡Hola! Su pedido de Restaurant Al Campestre está en camino con nuestro repartidor ${order.delivery_name || 'asignado'}. Prepárese para recibirlo."`;
    }

    if (status === 'delivered' || status === 'incident') {
      if (order.delivery_id) {
        const drivers = getLocalData('campestre_drivers', defaultDrivers);
        const driver = drivers.find(d => d.id === order.delivery_id);
        if (driver) {
          if (status === 'delivered') {
            const address = order.family_address || '';
            const parts = address.split(',');
            const municipality = parts.length > 1 ? parts[parts.length - 2].trim() : 'Plaza de la Revolución';
            const mins = getReturnTimeForZone(municipality);
            // Simulación acelerada para MVP: 1 segundo por cada minuto de retorno
            const returnTime = new Date(Date.now() + mins * 1000);

            order.delivery_eta_return = returnTime.toISOString();
            driver.status = 'En Retorno';
            driver.active_order_id = null;
            driver.return_eta = returnTime.toISOString();
            whatsappNotificationSimulated = `Notificación de WhatsApp enviada a ${order.family_name} (${order.family_phone}): "¡Hola! Su pedido ${order.id} ha sido entregado exitosamente. ¡Gracias por confiar en Restaurant Al Campestre!"`;
          } else {
            driver.status = 'Disponible';
            driver.active_order_id = null;
            driver.return_eta = null;
          }
          setLocalData('campestre_drivers', drivers);
        }
      }
    }

    setLocalData('campestre_orders', orders);
    return { success: true, order, whatsappNotificationSimulated };
  };

  if (!isSupabaseConfigured()) {
    return processLocalMilestone();
  }

  try {
    const { data: order, error: ordError } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (ordError || !order) throw ordError;

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
          // Simulación acelerada para MVP: 1 segundo por cada minuto de retorno
          const returnTime = new Date(Date.now() + mins * 1000);

          orderUpdates.delivery_eta_return = returnTime.toISOString();

          await supabase.from('drivers').update({
            status: 'En Retorno',
            active_order_id: null,
            return_eta: returnTime.toISOString()
          }).eq('id', order.delivery_id);

          whatsappNotificationSimulated = `Notificación de WhatsApp enviada a ${order.family_name} (${order.family_phone}): "¡Hola! Su pedido ${order.id} ha sido entregado exitosamente. ¡Gracias por confiar en Restaurant Al Campestre!"`;
        } else {
          await supabase.from('drivers').update({
            status: 'Disponible',
            active_order_id: null,
            return_eta: null
          }).eq('id', order.delivery_id);
        }
      }
    }

    const { data: updatedOrder, error: updOrdErr } = await supabase.from('orders').update(orderUpdates).eq('id', orderId).select().single();
    if (updOrdErr) throw updOrdErr;

    return { success: true, order: updatedOrder, whatsappNotificationSimulated };
  } catch (err) {
    console.warn("Supabase updateDeliveryMilestone failed, using local storage:", err);
    return processLocalMilestone();
  }
};

export const checkDriverReturnStatus = async (): Promise<void> => {
  if (!isSupabaseConfigured()) {
    const drivers = getLocalData('campestre_drivers', defaultDrivers);
    const now = new Date().getTime();
    let changed = false;
    for (const d of drivers) {
      if (d.status === 'En Retorno' && d.return_eta) {
        const eta = new Date(d.return_eta).getTime();
        if (now >= eta) {
          d.status = 'Disponible';
          d.return_eta = null;
          d.active_order_id = null;
          changed = true;
        }
      }
    }
    if (changed) setLocalData('campestre_drivers', drivers);
    return;
  }
  try {
    const { data: drivers, error } = await supabase.from('drivers').select('*').eq('status', 'En Retorno');
    if (error || !drivers) throw error;
    const now = new Date().getTime();
    for (const d of drivers) {
      if (d.return_eta) {
        const eta = new Date(d.return_eta).getTime();
        if (now >= eta) {
          await supabase.from('drivers').update({ status: 'Disponible', return_eta: null, active_order_id: null }).eq('id', d.id);
        }
      }
    }
  } catch (err) {
    console.warn("Supabase checkDriverReturnStatus failed, using local storage:", err);
  }
};

export const issueRefund = async (
  orderId: string,
  amount: number,
  mode: 'stripe' | 'credit'
): Promise<{ success: boolean; refundAmount?: number; storeCredit?: number }> => {
  const processLocalRefund = () => {
    const orders = getLocalData<Order[]>('campestre_orders', []);
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false };

    const newNotes = `${order.notes || ''} [${mode === 'stripe' ? 'Reembolso Stripe' : 'Crédito de tienda'} $${amount} emitido el ${new Date().toLocaleDateString()}]`;
    order.notes = newNotes;
    order.updated_at = new Date().toISOString();
    if (mode === 'stripe') order.refunded = true;
    else order.store_credit_issued = amount;

    setLocalData('campestre_orders', orders);
    return {
      success: true,
      refundAmount: mode === 'stripe' ? amount : undefined,
      storeCredit: mode === 'credit' ? amount : undefined
    };
  };

  if (!isSupabaseConfigured()) {
    return processLocalRefund();
  }

  try {
    const { data: order, error: ordError } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (ordError || !order) throw ordError;

    const newNotes = `${order.notes || ''} [${mode === 'stripe' ? 'Reembolso Stripe' : 'Crédito de tienda'} $${amount} emitido el ${new Date().toLocaleDateString()}]`;
    const updates: Partial<Order> = {
      notes: newNotes,
      updated_at: new Date().toISOString()
    };
    if (mode === 'stripe') updates.refunded = true;
    else updates.store_credit_issued = amount;

    const { error: updError } = await supabase.from('orders').update(updates).eq('id', orderId);
    if (updError) throw updError;

    return {
      success: true,
      refundAmount: mode === 'stripe' ? amount : undefined,
      storeCredit: mode === 'credit' ? amount : undefined
    };
  } catch (err) {
    console.warn("Supabase issueRefund failed, using local storage:", err);
    return processLocalRefund();
  }
};
