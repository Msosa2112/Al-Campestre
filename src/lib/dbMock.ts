// Mock database utility for Restaurant Al Campestre MVP
// Simulates Supabase storage and operations in localStorage

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

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Carne de Cerdo (Lomo)',
    description: 'Lomo de cerdo fresco criado en granja local. Ideal para asar.',
    price: 4.50,
    stock: 80,
    barcode: '7501020304068',
    image_url: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-2',
    name: 'Arroz Criollo',
    description: 'Arroz blanco de grano largo de primera calidad.',
    price: 1.20,
    stock: 200,
    barcode: '7501020304051',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-3',
    name: 'Frijoles Negros',
    description: 'Frijoles negros secos tradicionales, cosechados en el campo cubano.',
    price: 1.80,
    stock: 150,
    barcode: '7501020304075',
    image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-4',
    name: 'Aceite de Girasol',
    description: 'Aceite refinado vegetal para cocinar, botella de 1 Litro.',
    price: 5.50,
    stock: 40,
    barcode: '7501020304082',
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-5',
    name: 'Leche en Polvo Entera',
    description: 'Leche en polvo entera fortificada, bolsa de 1kg importada.',
    price: 9.99,
    stock: 30,
    barcode: '7501020304099',
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-6',
    name: 'Pollo Entero Troceado',
    description: 'Paquete de pollo entero limpio y troceado de 2.5 kg.',
    price: 11.50,
    stock: 65,
    barcode: '7501020304105',
    image_url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-7',
    name: 'Frijoles Colorados',
    description: 'Frijoles colorados (rojos) secos, ideales para potajes tradicionales.',
    price: 2.10,
    stock: 100,
    barcode: '7501020304112',
    image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80',
    category: 'Granos'
  },
  {
    id: 'prod-8',
    name: 'Picadillo de Res Criollo',
    description: 'Carne de res molida y sazonada de forma tradicional.',
    price: 3.80,
    stock: 90,
    barcode: '7501020304129',
    image_url: 'https://images.unsplash.com/photo-1588168333986-5078647a5c7e?w=400&q=80',
    category: 'Carnes'
  },
  {
    id: 'prod-9',
    name: 'Café Turquino Extra',
    description: 'Auténtico café cubano con tostado oscuro y aroma intenso. Bolsa de 250g.',
    price: 6.99,
    stock: 110,
    barcode: '7501020304136',
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-10',
    name: 'Queso Blanco del Campo',
    description: 'Queso blanco artesanal criollo fresco prensado, especial para freír.',
    price: 5.80,
    stock: 35,
    barcode: '7501020304143',
    image_url: 'https://images.unsplash.com/photo-1486887396153-fa416525c108?w=400&q=80',
    category: 'Lácteos'
  },
  {
    id: 'prod-11',
    name: 'Malta Hatuey (Lata)',
    description: 'Bebida de malta cubana sin alcohol, muy nutritiva y refrescante.',
    price: 1.50,
    stock: 240,
    barcode: '7501020304150',
    image_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-12',
    name: 'Cerveza Cristal (Lata)',
    description: 'La preferida de Cuba. Cerveza clara tipo Pilsener refrescante de 355ml.',
    price: 1.80,
    stock: 300,
    barcode: '7501020304167',
    image_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80',
    category: 'Abarrotes'
  },
  {
    id: 'prod-13',
    name: 'Spaghetti La Milanesa 500g',
    description: 'Pasta de trigo sémola de alta calidad, ideal para comidas rápidas.',
    price: 1.20,
    stock: 180,
    barcode: '7501020304174',
    image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&q=80',
    category: 'Abarrotes'
  }
];

const DEFAULT_FAMILIES: Family[] = [
  {
    id: 'fam-1',
    nickname: 'Mamá Leonor',
    full_name: 'Leonor Valdés Pérez',
    address: 'Calle 23 #405 e/ G y H, Apto 4',
    province: 'La Habana',
    municipality: 'Plaza de la Revolución',
    phone: '+53 52345678'
  },
  {
    id: 'fam-2',
    nickname: 'Abuela María',
    full_name: 'María Caridad Gómez Díaz',
    address: 'Avenida 41 #8802 e/ 88 y 90',
    province: 'La Habana',
    municipality: 'Playa',
    phone: '+53 58765432'
  }
];

const DEFAULT_DRIVERS: Driver[] = [
  { id: 'drv-1', name: 'Juan Carlos Pérez', status: 'Disponible', active_order_id: null, return_eta: null },
  { id: 'drv-2', name: 'Yusniel Gómez', status: 'Disponible', active_order_id: null, return_eta: null },
  { id: 'drv-3', name: 'Marcos Díaz', status: 'Disponible', active_order_id: null, return_eta: null }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'FAC-1001',
    client_name: 'Miguel Ángel (Miami)',
    family_id: 'fam-1',
    family_name: 'Leonor Valdés Pérez',
    family_phone: '+53 52345678',
    family_address: 'Calle 23 #405 e/ G y H, Apto 4, Plaza de la Revolución, La Habana',
    items: [
      { productId: 'prod-1', productName: 'Carne de Cerdo (Lomo)', quantity: 4, price: 4.50 },
      { productId: 'prod-2', productName: 'Arroz Criollo', quantity: 10, price: 1.20 }
    ],
    total_amount: 30.00,
    stripe_payment_id: 'ch_3MtgXHLkGvP71sC20aBcdEFG',
    status: 'delivered',
    delivery_id: 'drv-1',
    delivery_name: 'Juan Carlos Pérez',
    delivery_eta_return: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'FAC-1002',
    client_name: 'Miguel Ángel (Miami)',
    family_id: 'fam-2',
    family_name: 'María Caridad Gómez Díaz',
    family_phone: '+53 58765432',
    family_address: 'Avenida 41 #8802 e/ 88 y 90, Playa, La Habana',
    items: [
      { productId: 'prod-5', productName: 'Leche en Polvo Entera', quantity: 2, price: 9.99 },
      { productId: 'prod-4', productName: 'Aceite de Girasol', quantity: 2, price: 5.50 }
    ],
    total_amount: 30.98,
    stripe_payment_id: 'ch_3MtgXHLkGvP71sC20aXyzWVu',
    status: 'assigned',
    delivery_id: 'drv-2',
    delivery_name: 'Yusniel Gómez',
    delivery_eta_return: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
];

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

const isBrowser = typeof window !== 'undefined';

export const initializeDb = () => {
  if (!isBrowser) return;

  if (!localStorage.getItem('campestre_products')) {
    localStorage.setItem('campestre_products', JSON.stringify(DEFAULT_PRODUCTS));
  }
  if (!localStorage.getItem('campestre_families')) {
    localStorage.setItem('campestre_families', JSON.stringify(DEFAULT_FAMILIES));
  }
  if (!localStorage.getItem('campestre_drivers')) {
    localStorage.setItem('campestre_drivers', JSON.stringify(DEFAULT_DRIVERS));
  }
  if (!localStorage.getItem('campestre_orders')) {
    localStorage.setItem('campestre_orders', JSON.stringify(DEFAULT_ORDERS));
  }
};

export const getProducts = (): Product[] => {
  if (!isBrowser) return DEFAULT_PRODUCTS;
  initializeDb();
  return JSON.parse(localStorage.getItem('campestre_products') || '[]');
};

export const saveProduct = (product: Product): Product[] => {
  if (!isBrowser) return [];
  const products = getProducts();
  const index = products.findIndex(p => p.id === product.id || p.barcode === product.barcode);
  
  if (index >= 0) {
    // Edit/Merge stock
    products[index] = {
      ...products[index],
      ...product,
      stock: product.stock // overwrite or add depends on admin page
    };
  } else {
    // New
    products.push(product);
  }
  
  localStorage.setItem('campestre_products', JSON.stringify(products));
  return products;
};

export const addProductStock = (barcode: string, quantity: number): { success: boolean; product?: Product } => {
  if (!isBrowser) return { success: false };
  const products = getProducts();
  const index = products.findIndex(p => p.barcode === barcode);
  if (index >= 0) {
    products[index].stock += quantity;
    localStorage.setItem('campestre_products', JSON.stringify(products));
    return { success: true, product: products[index] };
  }
  return { success: false };
};

export const getFamilies = (): Family[] => {
  if (!isBrowser) return DEFAULT_FAMILIES;
  initializeDb();
  return JSON.parse(localStorage.getItem('campestre_families') || '[]');
};

export const saveFamily = (family: Family): Family[] => {
  if (!isBrowser) return [];
  const families = getFamilies();
  const index = families.findIndex(f => f.id === family.id);
  if (index >= 0) {
    families[index] = family;
  } else {
    families.push(family);
  }
  localStorage.setItem('campestre_families', JSON.stringify(families));
  return families;
};

export const deleteFamily = (id: string): Family[] => {
  if (!isBrowser) return [];
  let families = getFamilies();
  families = families.filter(f => f.id !== id);
  localStorage.setItem('campestre_families', JSON.stringify(families));
  return families;
};

export const getOrders = (): Order[] => {
  if (!isBrowser) return DEFAULT_ORDERS;
  initializeDb();
  return JSON.parse(localStorage.getItem('campestre_orders') || '[]');
};

export const saveOrder = (order: Order): Order[] => {
  if (!isBrowser) return [];
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === order.id);
  if (index >= 0) {
    orders[index] = order;
  } else {
    orders.unshift(order); // Put new orders on top
  }
  localStorage.setItem('campestre_orders', JSON.stringify(orders));
  return orders;
};

export const createOrderWithStockCheck = (
  items: { productId: string; quantity: number }[],
  familyId: string,
  clientName: string = 'Miguel Ángel (Miami)'
): { success: boolean; error?: string; order?: Order } => {
  if (!isBrowser) return { success: false, error: 'Acceso en servidor deshabilitado' };

  // Concurrency Simulation & Stock Lock
  const products = getProducts();
  const families = getFamilies();
  const family = families.find(f => f.id === familyId);

  if (!family) {
    return { success: false, error: 'Familiar receptor no encontrado' };
  }

  const orderItems: OrderItem[] = [];
  let totalAmount = 0;

  // Verify stock for all items
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      return { success: false, error: `Producto no encontrado` };
    }
    if (product.stock < item.quantity) {
      return { success: false, error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}` };
    }
  }

  // Deduct stock strictly
  const updatedProducts = products.map(product => {
    const purchasedItem = items.find(item => item.productId === product.id);
    if (purchasedItem) {
      const quantity = purchasedItem.quantity;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        price: product.price
      });
      totalAmount += product.price * quantity;
      return {
        ...product,
        stock: product.stock - quantity
      };
    }
    return product;
  });

  // Save new products stock
  localStorage.setItem('campestre_products', JSON.stringify(updatedProducts));

  // Create Order
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
    status: 'paid', // Immediately paid via 1-click
    delivery_id: null,
    delivery_name: null,
    delivery_eta_return: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  saveOrder(newOrder);
  return { success: true, order: newOrder };
};

export const getDrivers = (): Driver[] => {
  if (!isBrowser) return DEFAULT_DRIVERS;
  initializeDb();
  return JSON.parse(localStorage.getItem('campestre_drivers') || '[]');
};

export const saveDrivers = (drivers: Driver[]) => {
  if (!isBrowser) return;
  localStorage.setItem('campestre_drivers', JSON.stringify(drivers));
};

export const assignOrderToDriver = (orderId: string, driverId: string): boolean => {
  if (!isBrowser) return false;
  const orders = getOrders();
  const drivers = getDrivers();
  
  const orderIndex = orders.findIndex(o => o.id === orderId);
  const driverIndex = drivers.findIndex(d => d.id === driverId);

  if (orderIndex >= 0 && driverIndex >= 0) {
    const order = orders[orderIndex];
    const driver = drivers[driverIndex];

    driver.status = 'En Ruta';
    driver.active_order_id = orderId;
    driver.return_eta = null; // resets until delivered

    order.status = 'assigned';
    order.delivery_id = driver.id;
    order.delivery_name = driver.name;
    order.updated_at = new Date().toISOString();

    localStorage.setItem('campestre_orders', JSON.stringify(orders));
    saveDrivers(drivers);
    return true;
  }
  return false;
};

export const updateDeliveryMilestone = (
  orderId: string,
  status: 'assigned' | 'in_transit' | 'delivered' | 'incident',
  notes?: string,
  incidentReason?: string
): { success: boolean; order?: Order; whatsappNotificationSimulated?: string } => {
  if (!isBrowser) return { success: false };
  const orders = getOrders();
  const drivers = getDrivers();
  
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex < 0) return { success: false };

  const order = orders[orderIndex];
  order.status = status;
  order.updated_at = new Date().toISOString();

  let whatsappNotificationSimulated = '';

  if (status === 'in_transit') {
    whatsappNotificationSimulated = `Notificación de WhatsApp enviada a ${order.family_name} (${order.family_phone}): "¡Hola! Su pedido de Restaurant Al Campestre está en camino con nuestro repartidor ${order.delivery_name || 'asignado'}. Prepárese para recibirlo."`;
  }

  if (status === 'delivered' || status === 'incident') {
    // Find driver and update status
    const driverIndex = drivers.findIndex(d => d.id === order.delivery_id);
    if (driverIndex >= 0) {
      const driver = drivers[driverIndex];
      if (status === 'delivered') {
        driver.status = 'En Retorno';
        driver.active_order_id = null;
        // Parse municipality to calculate base return ETA
        // We'll extract municipality from address or use the order's stored family data
        const families = getFamilies();
        const family = families.find(f => f.id === order.family_id);
        const mins = family ? getReturnTimeForZone(family.municipality) : 45;
        const returnTime = new Date(Date.now() + mins * 60 * 1000);
        
        driver.return_eta = returnTime.toISOString();
        order.delivery_eta_return = returnTime.toISOString();
        whatsappNotificationSimulated = `Notificación de WhatsApp enviada a ${order.family_name} (${order.family_phone}): "¡Hola! Su pedido ${order.id} ha sido entregado exitosamente. ¡Gracias por confiar en Restaurant Al Campestre!"`;
      } else {
        // Incident
        driver.status = 'Disponible'; // Driver comes back or is available for resolution
        driver.active_order_id = null;
        driver.return_eta = null;
        order.incident_reason = incidentReason;
      }
    }
  }

  localStorage.setItem('campestre_orders', JSON.stringify(orders));
  saveDrivers(drivers);

  return { success: true, order, whatsappNotificationSimulated };
};

export const checkDriverReturnStatus = () => {
  if (!isBrowser) return;
  const drivers = getDrivers();
  let changed = false;

  const now = new Date().getTime();
  const updatedDrivers = drivers.map(d => {
    if (d.status === 'En Retorno' && d.return_eta) {
      const eta = new Date(d.return_eta).getTime();
      if (now >= eta) {
        changed = true;
        return {
          ...d,
          status: 'Disponible' as const,
          return_eta: null,
          active_order_id: null
        };
      }
    }
    return d;
  });

  if (changed) {
    saveDrivers(updatedDrivers);
  }
};

export const issueRefund = (orderId: string, amount: number, mode: 'stripe' | 'credit'): { success: boolean; refundAmount?: number; storeCredit?: number } => {
  if (!isBrowser) return { success: false };
  const orders = getOrders();
  const orderIndex = orders.findIndex(o => o.id === orderId);

  if (orderIndex >= 0) {
    const order = orders[orderIndex];
    if (mode === 'stripe') {
      order.refunded = true;
      order.notes = `${order.notes || ''} [Reembolso Stripe $${amount} emitido el ${new Date().toLocaleDateString()}]`;
    } else {
      order.store_credit_issued = amount;
      order.notes = `${order.notes || ''} [Crédito de tienda $${amount} asignado el ${new Date().toLocaleDateString()}]`;
    }
    order.updated_at = new Date().toISOString();
    localStorage.setItem('campestre_orders', JSON.stringify(orders));
    return {
      success: true,
      refundAmount: mode === 'stripe' ? amount : undefined,
      storeCredit: mode === 'credit' ? amount : undefined
    };
  }
  return { success: false };
};
