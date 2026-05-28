'use client';

import React, { useState, useEffect } from 'react';
import { 
  getProducts, 
  getFamilies, 
  saveFamily, 
  createOrderWithStockCheck, 
  getOrders,
  Family, 
  Product, 
  Order 
} from '@/lib/dbMock';
import { Plus, User, ShoppingCart, Check, CreditCard, ArrowRight, Sparkles, Home, Phone, MapPin, X } from 'lucide-react';
import Link from 'next/link';

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  
  // Modals
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<Order | null>(null);
  
  // New Family Form
  const [nickname, setNickname] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('La Habana');
  const [municipality, setMunicipality] = useState('Plaza de la Revolución');
  const [phone, setPhone] = useState('');
  const [familyError, setFamilyError] = useState('');

  // Cart Sidebar Toggle
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const loadData = () => {
    const prods = getProducts();
    const fams = getFamilies();
    const ords = getOrders();
    setProducts(prods);
    setFamilies(fams);
    setOrders(ords.filter(o => o.client_name === 'Miguel Ángel (Miami)'));
    
    if (fams.length > 0 && !selectedFamilyId) {
      setSelectedFamilyId(fams[0].id);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh interval for live order status updates
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAddFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !fullName || !address || !phone) {
      setFamilyError('Por favor complete todos los campos requeridos.');
      return;
    }
    
    const newFam: Family = {
      id: `fam-${Date.now()}`,
      nickname,
      full_name: fullName,
      address,
      province,
      municipality,
      phone
    };

    const updated = saveFamily(newFam);
    setFamilies(updated);
    setSelectedFamilyId(newFam.id);
    setShowOnboarding(false);
    
    // Reset Form
    setNickname('');
    setFullName('');
    setAddress('');
    setPhone('');
    setFamilyError('');
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Disculpe, solo hay ${product.stock} unidades de ${product.name} en stock.`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (productId: string, qty: number) => {
    setCart(prev => {
      const item = prev.find(i => i.product.id === productId);
      if (!item) return prev;
      
      const newQty = item.quantity + qty;
      if (newQty <= 0) {
        return prev.filter(i => i.product.id !== productId);
      }
      if (newQty > item.product.stock) {
        alert(`Disculpe, solo hay ${item.product.stock} unidades disponibles.`);
        return prev;
      }
      return prev.map(i => i.product.id === productId ? { ...i, quantity: newQty } : i);
    });
  };

  const handleCheckout = () => {
    if (!selectedFamilyId) {
      setShowOnboarding(true);
      return;
    }
    if (cart.length === 0) return;

    setCheckoutError('');
    
    // Format cart for order checking
    const itemsForOrder = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    const result = createOrderWithStockCheck(itemsForOrder, selectedFamilyId, 'Miguel Ángel (Miami)');

    if (result.success && result.order) {
      setCheckoutSuccess(result.order);
      setCart([]);
      setIsCartOpen(false);
      loadData();
    } else {
      setCheckoutError(result.error || 'Error al procesar el pago.');
    }
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const activeFamily = families.find(f => f.id === selectedFamilyId);

  return (
    <div className="flex-1 flex flex-col gap-6">
      
      {/* Hero Bienvenida Tradicional */}
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 overflow-hidden relative border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
        <div className="flex-1 flex flex-col gap-2">
          <h1 className="text-xl md:text-3xl font-extrabold text-emerald-950 tracking-tight leading-tight">
            Envía Alimentos Frescos y Abarrotes directos a Cuba
          </h1>
          <p className="text-emerald-950/70 text-xs md:text-sm max-w-2xl leading-relaxed">
            Compra combos de carnes, granos y abarrotes desde EE.UU. con entrega garantizada en la puerta de tus familiares. Selecciona tu familiar recibidor, añade productos al carrito y finaliza con pago rápido en 1-clic con Stripe.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 bg-white/40 border border-white/60 px-3.5 py-2 rounded-2xl">
          <span>🕒 Entrega en 24-48h</span>
        </div>
      </div>

      {/* Botón flotante secundario para el Asistente de IA (Comercio Conversacional) */}
      <Link
        href="/chat"
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-400 to-teal-500 text-emerald-950 px-4 py-3.5 rounded-full shadow-xl border border-white/60 hover:scale-105 transition-transform duration-200 flex items-center gap-2 font-bold text-xs"
        title="Ordenar usando Inteligencia Artificial"
      >
        <Sparkles size={14} className="animate-pulse" />
        <span>¿Pedir con Asistente IA?</span>
      </Link>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar: Familiar Recibidor */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-panel p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                <User size={18} className="text-emerald-600" />
                ¿Quién Recibe en Cuba?
              </h2>
              <button 
                onClick={() => setShowOnboarding(true)}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 p-1.5 rounded-xl transition"
                title="Agregar Familiar"
              >
                <Plus size={16} />
              </button>
            </div>

            {families.length === 0 ? (
              <div className="text-center py-6 bg-white/30 rounded-2xl border border-dashed border-emerald-500/20">
                <p className="text-xs text-emerald-900/60 mb-3">No tienes familiares guardados aún.</p>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="glass-button text-xs px-4 py-2 font-bold"
                >
                  Registrar Primer Recibidor
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {families.map(fam => (
                  <div
                    key={fam.id}
                    onClick={() => setSelectedFamilyId(fam.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedFamilyId === fam.id
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-sm'
                        : 'bg-white/40 border-white/55 hover:bg-white/70'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-emerald-950">{fam.nickname}</p>
                      <p className="text-xs text-emerald-950/60 truncate max-w-[180px]">{fam.full_name}</p>
                      <p className="text-xs text-emerald-900/50 mt-1">{fam.municipality}, {fam.province}</p>
                    </div>
                    {selectedFamilyId === fam.id && (
                      <span className="bg-emerald-500 text-white p-1 rounded-full text-xs">
                        <Check size={12} className="stroke-[3]" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeFamily && (
              <div className="bg-white/60 p-3.5 rounded-2xl text-xs flex flex-col gap-2 border border-emerald-500/10">
                <p className="font-bold text-emerald-900/80 mb-1">Detalles de Entrega:</p>
                <p className="flex items-start gap-1.5 text-emerald-950">
                  <MapPin size={12} className="mt-0.5 text-emerald-600 flex-shrink-0" />
                  <span>{activeFamily.address}, {activeFamily.municipality}, {activeFamily.province}</span>
                </p>
                <p className="flex items-center gap-1.5 text-emerald-950">
                  <Phone size={12} className="text-emerald-600 flex-shrink-0" />
                  <span>{activeFamily.phone}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Catalog */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Header & Cart Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-emerald-950">Catálogo de Productos</h2>
            <button
              onClick={() => setIsCartOpen(true)}
              className="glass-button px-4 py-2 flex items-center gap-2 relative border-emerald-500/20"
            >
              <ShoppingCart size={16} className="text-emerald-700" />
              <span className="font-semibold text-sm">Mi Carrito</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Más Vendidos (Best Sellers Section) - Only shown on "Todos" category */}
          {selectedCategory === 'Todos' && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1">
                <span>🔥</span> Productos Más Vendidos
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {products
                  .filter(p => ['prod-1', 'prod-4', 'prod-9'].includes(p.id))
                  .map(product => {
                    const inCartItem = cart.find(i => i.product.id === product.id);
                    const remainingStock = product.stock - (inCartItem?.quantity || 0);

                    return (
                      <div key={`best-${product.id}`} className="glass-card flex flex-col overflow-hidden relative border-emerald-500/30 bg-emerald-500/5">
                        <span className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full z-10 shadow-sm animate-pulse">
                          🔥 MÁS VENDIDO
                        </span>
                        
                        <div className="h-32 w-full overflow-hidden bg-emerald-950/5 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="p-3 flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-sm text-emerald-950 leading-tight">{product.name}</h4>
                            <p className="text-[10px] text-emerald-950/60 line-clamp-1 mt-0.5">{product.description}</p>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-extrabold text-emerald-950">${product.price.toFixed(2)}</span>
                            <button
                              onClick={() => addToCart(product)}
                              disabled={remainingStock <= 0}
                              className="glass-button-primary px-3 py-1.5 text-[10px] font-bold"
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Categories Selector Pills */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-emerald-950/70">Categorías de Envíos:</h3>
            <div className="glass-track flex items-center p-1 w-fit max-w-full overflow-x-auto whitespace-nowrap scrollbar-none">
              {['Todos', 'Carnes', 'Granos', 'Lácteos', 'Abarrotes'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? 'glass-button-segmented-active'
                      : 'text-emerald-950/60 hover:text-emerald-950 px-4'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Category-Filtered Catalog - Responsive Layout */}
          
          {/* Vista Escritorio: Rejilla de Tarjetas */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
            {products
              .filter(p => selectedCategory === 'Todos' || p.category === selectedCategory)
              .map(product => {
                const inCartItem = cart.find(i => i.product.id === product.id);
                const remainingStock = product.stock - (inCartItem?.quantity || 0);

                return (
                  <div key={product.id} className="glass-card flex flex-col overflow-hidden relative">
                    {/* Image wrapper */}
                    <div className="h-44 w-full overflow-hidden bg-emerald-950/5 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <span className="absolute top-2 right-2 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-emerald-800 border border-white">
                        {product.category}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-bold text-base text-emerald-950 leading-tight">{product.name}</h3>
                        <p className="text-xs text-emerald-950/60 line-clamp-2 leading-relaxed">{product.description}</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xl font-extrabold text-emerald-950">${product.price.toFixed(2)}</span>
                          <span className={`text-xs font-semibold ${
                            remainingStock > 10 
                              ? 'text-emerald-700' 
                              : remainingStock > 0 
                              ? 'text-amber-600 animate-pulse' 
                              : 'text-red-500'
                          }`}>
                            {remainingStock > 0 ? `Stock: ${remainingStock} disp.` : 'Agotado'}
                          </span>
                        </div>

                        <button
                          onClick={() => addToCart(product)}
                          disabled={remainingStock <= 0}
                          className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                            remainingStock > 0
                              ? 'glass-button-primary cursor-pointer'
                              : 'bg-emerald-950/5 border border-emerald-950/10 text-emerald-950/40 cursor-not-allowed'
                          }`}
                        >
                          <Plus size={14} />
                          Agregar al Carrito
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Vista Móvil: Fila Compacta (Previene scroll infinito con miles de productos) */}
          <div className="block md:hidden flex flex-col gap-2.5">
            {products
              .filter(p => selectedCategory === 'Todos' || p.category === selectedCategory)
              .map(product => {
                const inCartItem = cart.find(i => i.product.id === product.id);
                const remainingStock = product.stock - (inCartItem?.quantity || 0);

                return (
                  <div 
                    key={`mob-${product.id}`} 
                    className="glass-card flex items-center justify-between p-2.5 rounded-2xl gap-3 text-xs"
                  >
                    {/* Small left thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-emerald-950/5 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Middle details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="font-bold text-emerald-950 truncate leading-tight">{product.name}</h4>
                        <span className="text-[10px] font-bold text-emerald-950 flex-shrink-0">${product.price.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[9px] bg-white/80 backdrop-blur-md px-1.5 py-0.5 rounded-md font-semibold text-emerald-800 border border-emerald-500/10">
                          {product.category}
                        </span>
                        
                        <span className={`text-[9px] font-bold ${
                          remainingStock > 10 
                            ? 'text-emerald-700' 
                            : remainingStock > 0 
                            ? 'text-amber-600 animate-pulse' 
                            : 'text-red-500'
                        }`}>
                          {remainingStock > 0 ? `Stock: ${remainingStock} disp.` : 'Agotado'}
                        </span>
                      </div>
                    </div>

                    {/* Right compact Add Button */}
                    <div className="flex-shrink-0 pl-1">
                      <button
                        onClick={() => addToCart(product)}
                        disabled={remainingStock <= 0}
                        className={`px-3.5 py-2 text-[10px] font-extrabold rounded-xl transition ${
                          remainingStock > 0
                            ? 'glass-button-primary cursor-pointer'
                            : 'bg-emerald-950/5 text-emerald-950/30 border border-emerald-950/10 cursor-not-allowed'
                        }`}
                      >
                        {remainingStock > 0 ? 'Añadir' : 'Agotado'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

      </div>

      {/* Orders Tracking List */}
      {orders.length > 0 && (
        <div className="glass-panel p-5 mt-4">
          <h2 className="text-lg font-bold text-emerald-950 mb-4">Seguimiento de tus Órdenes (Tiempo Real)</h2>
          
          {/* Vista Escritorio: Tabla */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-emerald-500/10 text-emerald-950/60 font-semibold">
                  <th className="py-2.5">Código Pedido</th>
                  <th className="py-2.5">Destinatario</th>
                  <th className="py-2.5">Monto Total</th>
                  <th className="py-2.5">Estado</th>
                  <th className="py-2.5">Repartidor Asignado</th>
                  <th className="py-2.5">Notas logísticas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/5">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-white/20 transition-colors">
                    <td className="py-3 font-mono font-bold text-emerald-950">{order.id}</td>
                    <td className="py-3 text-emerald-900 font-medium">{order.family_name}</td>
                    <td className="py-3 font-bold text-emerald-950">${order.total_amount.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                        order.status === 'delivered' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : order.status === 'in_transit' 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200 animate-pulse' 
                          : order.status === 'incident' 
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {order.status === 'pending' && 'Pendiente'}
                        {order.status === 'paid' && 'Pagado (1-Clic)'}
                        {order.status === 'assigned' && 'Repartidor Asignado'}
                        {order.status === 'in_transit' && 'En Tránsito'}
                        {order.status === 'delivered' && 'Entregado'}
                        {order.status === 'incident' && 'Incidencia'}
                      </span>
                      {order.refunded && (
                        <span className="ml-2 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold rounded">
                          Reembolsado Stripe
                        </span>
                      )}
                      {order.store_credit_issued && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold rounded">
                          +${order.store_credit_issued} Crédito Tienda
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-emerald-900/70">{order.delivery_name || 'Pendiente de despacho'}</td>
                    <td className="py-3 text-xs text-emerald-900/60 max-w-[200px] truncate" title={order.notes || order.incident_reason}>
                      {order.incident_reason ? `Fallo: ${order.incident_reason}` : (order.notes || 'Ninguna')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista Móvil: Tarjetas */}
          <div className="block md:hidden flex flex-col gap-3">
            {orders.map(order => (
              <div key={order.id} className="p-4 bg-white/40 border border-white/60 rounded-2xl flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-emerald-500/5">
                  <span className="font-mono font-bold text-sm text-emerald-950">{order.id}</span>
                  <span className="text-emerald-950 font-bold">${order.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex flex-col gap-1 text-[#142f1f]/80">
                  <p><span className="font-semibold text-emerald-950">Destinatario:</span> {order.family_name}</p>
                  <p className="truncate"><span className="font-semibold text-emerald-950">Dirección:</span> {order.family_address}</p>
                  <p><span className="font-semibold text-emerald-950">Repartidor:</span> {order.delivery_name || 'Pendiente'}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-1 border-t border-emerald-500/5 pt-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    order.status === 'delivered' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : order.status === 'in_transit' 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200 animate-pulse' 
                      : order.status === 'incident' 
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {order.status === 'pending' && 'Pendiente'}
                    {order.status === 'paid' && 'Pagado'}
                    {order.status === 'assigned' && 'Asignado'}
                    {order.status === 'in_transit' && 'En Tránsito'}
                    {order.status === 'delivered' && 'Entregado'}
                    {order.status === 'incident' && 'Incidencia'}
                  </span>
                  <div className="flex gap-1.5">
                    {order.refunded && (
                      <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-extrabold rounded">
                        Reembolso Stripe
                      </span>
                    )}
                    {order.store_credit_issued && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-extrabold rounded">
                        +${order.store_credit_issued} Crédito
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* MODAL: Onboarding Familiar */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-emerald-950/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 bg-white/90 shadow-2xl relative">
            <button 
              onClick={() => setShowOnboarding(false)}
              className="absolute top-4 right-4 text-emerald-950/60 hover:text-emerald-950"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-emerald-950 flex items-center gap-2 mb-2">
              👨‍👩‍👧‍👦 Registrar Familiar Recibidor en Cuba
            </h3>
            <p className="text-xs text-emerald-950/60 mb-4">
              Agrega los datos de envío de tu familiar en Cuba. Esto se guardará como recibidor predeterminado.
            </p>

            <form onSubmit={handleAddFamily} className="flex flex-col gap-3">
              {familyError && <p className="text-xs font-bold text-red-500 bg-red-50 p-2.5 rounded-xl">{familyError}</p>}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-emerald-950/70">Apodo Familiar (Ej. Mamá, Abuela)</label>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="Ej. Mi Mamá"
                    className="glass-input text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-emerald-950/70">Nombre Completo del Recibidor</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Ej. Leonor Valdés Pérez"
                    className="glass-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-emerald-950/70">Provincia</label>
                  <select
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    className="glass-input text-sm"
                  >
                    <option value="La Habana">La Habana</option>
                    <option value="Artemisa">Artemisa</option>
                    <option value="Mayabeque">Mayabeque</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-emerald-950/70">Municipio</label>
                  {province === 'La Habana' && (
                    <select value={municipality} onChange={e => setMunicipality(e.target.value)} className="glass-input text-sm">
                      <option value="Plaza de la Revolución">Plaza de la Revolución</option>
                      <option value="Playa">Playa</option>
                      <option value="Centro Habana">Centro Habana</option>
                      <option value="Habana Vieja">Habana Vieja</option>
                      <option value="Boyeros">Boyeros</option>
                    </select>
                  )}
                  {province === 'Artemisa' && (
                    <select value={municipality} onChange={e => setMunicipality(e.target.value)} className="glass-input text-sm">
                      <option value="San Antonio de los Baños">San Antonio de los Baños</option>
                      <option value="Bauta">Bauta</option>
                    </select>
                  )}
                  {province === 'Mayabeque' && (
                    <select value={municipality} onChange={e => setMunicipality(e.target.value)} className="glass-input text-sm">
                      <option value="Bejucal">Bejucal</option>
                      <option value="San José de las Lajas">San José de las Lajas</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-emerald-950/70">Dirección Exacta (Calle, Número, e/ Calles)</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Ej. Calle 23 #405 e/ G y H, Apto 4"
                  className="glass-input text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-emerald-950/70">Teléfono Celular en Cuba (WhatsApp preferente)</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ej. +53 52345678"
                  className="glass-input text-sm"
                />
              </div>

              <button
                type="submit"
                className="glass-button-primary py-2.5 mt-2 text-sm font-bold flex items-center justify-center gap-1.5"
              >
                Guardar y Activar Familiar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Checkout Exitoso (Simulación Stripe) */}
      {checkoutSuccess && (
        <div className="fixed inset-0 bg-emerald-950/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md p-6 bg-white/95 shadow-2xl text-center flex flex-col items-center gap-4 border-emerald-500/30">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl shadow-inner">
              ✓
            </div>
            
            <div>
              <h3 className="text-xl font-extrabold text-emerald-950">¡Pago Exitoso en 1-Clic!</h3>
              <p className="text-xs text-emerald-950/60 mt-1">Procesado con Stripe Checkout para LLC en EE.UU.</p>
            </div>

            <div className="bg-emerald-50/50 w-full p-4 rounded-2xl text-left border border-emerald-500/10 text-xs flex flex-col gap-1.5">
              <p className="text-emerald-900/60 font-semibold">Resumen del Pedido:</p>
              <p className="text-emerald-950 font-bold text-sm">Código: {checkoutSuccess.id}</p>
              <p className="text-emerald-950"><span className="font-semibold">Recibe:</span> {checkoutSuccess.family_name}</p>
              <p className="text-emerald-950"><span className="font-semibold">Destino:</span> {checkoutSuccess.family_address}</p>
              <p className="text-emerald-950 font-extrabold text-emerald-800 text-right text-sm mt-1">Total Pagado: ${checkoutSuccess.total_amount.toFixed(2)}</p>
            </div>

            <p className="text-xs text-emerald-950/60 leading-relaxed bg-emerald-500/5 p-3 rounded-xl">
              📦 <span className="font-bold text-emerald-900">Validación de Inventario:</span> El stock ha sido descontado estrictamente en tiempo real en la base de datos de Restaurant Al Campestre.
            </p>

            <button
              onClick={() => setCheckoutSuccess(null)}
              className="glass-button-primary w-full py-2.5 text-sm font-bold"
            >
              Entendido / Seguir Comprando
            </button>
          </div>
        </div>
      )}

      {/* Cart Sidebar Panel */}
      {isCartOpen && (
        <div className="fixed inset-0 z-40 bg-emerald-950/20 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white/95 backdrop-blur-md border-l border-white/55 shadow-2xl p-6 flex flex-col justify-between">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-emerald-500/10">
                <h3 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-emerald-600" />
                  Detalle del Carrito
                </h3>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-emerald-950/60 hover:text-emerald-950 p-1 rounded-full hover:bg-emerald-500/10 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-3xl mb-3">🛒</p>
                  <p className="text-sm font-semibold text-emerald-900/60">Tu carrito está vacío.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.product.id} className="p-3 bg-white/40 border border-white/60 rounded-2xl flex justify-between items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-emerald-950 truncate">{item.product.name}</p>
                        <p className="text-xs text-emerald-950/60 font-semibold">${item.product.price.toFixed(2)} / libra</p>
                      </div>
                      
                      {/* Quantity selector */}
                      <div className="flex items-center gap-2.5 bg-white/80 px-2 py-1 rounded-xl border border-emerald-500/15">
                        <button 
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="font-bold text-emerald-950 hover:text-emerald-600 px-1"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-emerald-950 min-w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className="font-bold text-emerald-950 hover:text-emerald-600 px-1"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-950">${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Stripe Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-emerald-500/10 pt-4 flex flex-col gap-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-emerald-950/70">Subtotal:</span>
                  <span className="text-2xl font-extrabold text-emerald-950">${totalCartPrice.toFixed(2)}</span>
                </div>

                {checkoutError && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 p-2.5 rounded-xl">{checkoutError}</p>
                )}

                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-500/10 text-xs flex flex-col gap-2">
                  <p className="font-bold text-emerald-900/80">💳 Método de Pago (Stripe 1-Clic)</p>
                  <div className="flex justify-between text-emerald-950/70 font-semibold">
                    <span>Tarjeta Guardada:</span>
                    <span>Visa terminada en •••• 4242</span>
                  </div>
                  {activeFamily ? (
                    <div className="flex justify-between text-emerald-950/70 font-semibold truncate">
                      <span>Destinatario en Cuba:</span>
                      <span className="font-bold text-emerald-800">{activeFamily.nickname}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        setShowOnboarding(true);
                      }}
                      className="text-emerald-600 font-bold hover:underline text-left"
                    >
                      ⚠️ Asignar recibidor en Cuba
                    </button>
                  )}
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={!selectedFamilyId}
                  className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
                    selectedFamilyId
                      ? 'glass-button-primary cursor-pointer'
                      : 'bg-emerald-950/5 text-emerald-950/40 border border-emerald-950/10 cursor-not-allowed'
                  }`}
                >
                  <CreditCard size={16} />
                  Pagar en 1-Clic con Stripe
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
