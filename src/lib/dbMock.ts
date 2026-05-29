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
  }
];

export const initializeDb = async () => {
  // Try to seed database if empty
  const prods = await getProducts();
  if (prods.length === 0) {
    console.log("Seeding initial products...");
  }
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

const defaultDrivers: Driver[] = [
  { id: 'driver-1', name: 'Yoan Martínez', status: 'Disponible', active_order_id: null, return_eta: null },
  { id: 'driver-2', name: 'Eduardo Gómez', status: 'Disponible', active_order_id: null, return_eta: null }
];

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
