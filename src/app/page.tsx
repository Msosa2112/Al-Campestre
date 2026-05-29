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
import { Plus, User, ShoppingCart, Check, CreditCard, ArrowRight, Sparkles, Home, Phone, MapPin, X, Search, ChevronDown, ClipboardList } from 'lucide-react';
import Link from 'next/link';

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const activeFamily = families.find(f => f.id === selectedFamilyId);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active Delivery Area States
  const [deliveryProvince, setDeliveryProvince] = useState('La Habana');
  const [deliveryMunicipality, setDeliveryMunicipality] = useState('Plaza de la Revolución');
  const [showZoneModal, setShowZoneModal] = useState(false);
  
  // Hero Promotion Index
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  
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

  const loadData = async () => {
    try {
      const [prods, fams, ords] = await Promise.all([
        getProducts(),
        getFamilies(),
        getOrders()
      ]);
      setProducts(prods);
      setFamilies(fams);
      setOrders(ords.filter(o => o.client_name === 'Miguel Ángel (Miami)'));
      
      if (fams.length > 0 && !selectedFamilyId) {
        setSelectedFamilyId(fams[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    if (activeFamily) {
      setDeliveryProvince(activeFamily.province);
      setDeliveryMunicipality(activeFamily.municipality);
    }
  }, [selectedFamilyId, families, activeFamily]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePromoIndex(prev => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
    // Refresh interval for live order status updates
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [selectedFamilyId]);

  const handleAddFamily = async (e: React.FormEvent) => {
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

    const updated = await saveFamily(newFam);
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

  const handleCheckout = async () => {
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

    const result = await createOrderWithStockCheck(itemsForOrder, selectedFamilyId, 'Miguel Ángel (Miami)');

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

  return (
    <div className="flex-1 flex flex-col gap-6 pb-20 md:pb-0">
      
      {/* Hero Banner Slideshow Premium */}
      <div className="relative overflow-hidden rounded-3xl h-44 sm:h-52 w-full shadow-lg">
        {/* Promos */}
        {[
          {
            title: "Envía Alimentos Frescos y Abarrotes directos a Cuba",
            desc: "Compra combos de carnes, granos y abarrotes desde EE.UU. con entrega garantizada en la puerta de tus familiares. Pago rápido en 1-clic con Stripe.",
            badge: "🕒 Entrega en 24-48h",
            gradient: "from-[#D95D39]/95 to-[#8C6239]/95",
            image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80"
          },
          {
            title: "Combos de Carne Premium con 15% OFF",
            desc: "Lomo de cerdo fresco, pollo entero y picadillo de res seleccionados directamente en el campo. Sabor criollo garantizado.",
            badge: "🔥 Súper Oferta",
            gradient: "from-[#C24C2A]/95 to-[#D95D39]/95",
            image: "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=800&q=80"
          },
          {
            title: "Nuevas Zonas de Cobertura en Provincias",
            desc: "Ya entregamos en San Antonio de los Baños, Bauta, Bejucal y San José de las Lajas. Cobertura ampliada para tu tranquilidad.",
            badge: "📍 Cobertura Ampliada",
            gradient: "from-[#8C6239]/95 to-[#EADEC9]/95",
            image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80"
          }
        ].map((promo, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 w-full h-full flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-8 text-white transition-opacity duration-700 bg-gradient-to-r ${promo.gradient} ${
              activePromoIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-25"
              style={{ backgroundImage: `url('${promo.image}')` }}
            />
            <div className="relative z-10 flex-1 flex flex-col gap-1.5 max-w-2xl">
              <span className="bg-white/25 border border-white/30 text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full w-fit">
                {promo.badge}
              </span>
              <h1 className="text-base sm:text-2xl font-extrabold tracking-tight leading-tight">
                {promo.title}
              </h1>
              <p className="text-white/80 text-[10px] sm:text-xs leading-relaxed line-clamp-2">
                {promo.desc}
              </p>
            </div>
          </div>
        ))}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              onClick={() => setActivePromoIndex(i)}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                activePromoIndex === i ? 'bg-white w-5' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Botón flotante secundario para el Asistente de IA (Comercio Conversacional) */}
      <Link
        href="/chat"
        className={`fixed right-4 sm:right-6 z-40 bg-gradient-to-r from-[#D95D39] to-[#C24C2A] text-white rounded-full shadow-xl border border-white/30 hover:scale-105 transition-all duration-300 flex items-center justify-center sm:justify-start gap-2 font-bold text-xs w-12 h-12 sm:w-auto sm:h-auto sm:px-5 sm:py-3.5 ${
          cart.length > 0 && !isCartOpen 
            ? 'bottom-[140px] md:bottom-6' 
            : 'bottom-[80px] md:bottom-6'
        }`}
        title="Ordenar usando Inteligencia Artificial"
      >
        <Sparkles size={18} className="animate-pulse text-[#FAF9F5] shrink-0" />
        <span className="hidden sm:inline">¿Pedir con Asistente IA?</span>
      </Link>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar: Familiar Recibidor */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-panel p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#2B2521] flex items-center gap-2">
                <User size={18} className="text-[#8C6239]" />
                ¿Quién Recibe en Cuba?
              </h2>
              <button 
                onClick={() => setShowOnboarding(true)}
                className="bg-[#D95D39]/10 hover:bg-[#D95D39]/20 text-[#D95D39] p-1.5 rounded-xl transition cursor-pointer"
                title="Agregar Familiar"
              >
                <Plus size={16} />
              </button>
            </div>

            {families.length === 0 ? (
              <div className="text-center py-6 bg-white/30 rounded-2xl border border-dashed border-[#8C6239]/20">
                <p className="text-xs text-[#2B2521]/60 mb-3">No tienes familiares guardados aún.</p>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="glass-button text-xs px-4 py-2 font-bold cursor-pointer"
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
                        ? 'bg-[#D95D39]/10 border-[#D95D39] shadow-sm'
                        : 'bg-white/40 border-white/55 hover:bg-white/70'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-[#2B2521]">{fam.nickname}</p>
                      <p className="text-xs text-[#2B2521]/60 truncate max-w-[180px]">{fam.full_name}</p>
                      <p className="text-xs text-[#2B2521]/50 mt-1">{fam.municipality}, {fam.province}</p>
                    </div>
                    {selectedFamilyId === fam.id && (
                      <span className="bg-[#D95D39] text-white p-1 rounded-full text-xs">
                        <Check size={12} className="stroke-[3]" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeFamily && (
              <div className="bg-white/60 p-3.5 rounded-2xl text-xs flex flex-col gap-2 border border-[#8C6239]/10">
                <p className="font-bold text-[#8C6239] mb-1">Detalles de Entrega:</p>
                <p className="flex items-start gap-1.5 text-[#2B2521]">
                  <MapPin size={12} className="mt-0.5 text-[#8C6239] flex-shrink-0" />
                  <span>{activeFamily.address}, {activeFamily.municipality}, {activeFamily.province}</span>
                </p>
                <p className="flex items-center gap-1.5 text-[#2B2521]">
                  <Phone size={12} className="text-[#8C6239] flex-shrink-0" />
                  <span>{activeFamily.phone}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Catalog */}
        <div className="lg:col-span-3 flex flex-col gap-6" id="catalog-section">
          
          {/* Barra de Búsqueda y Selector de Zona para Móviles y Escritorio */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Buscador */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar productos (ej. pollo, arroz, lomo)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-2.5 text-xs font-semibold focus:bg-white"
                id="search-input"
              />
              <Search className="absolute left-3.5 top-3.5 text-[#8C6239] w-4 h-4" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-[#2B2521]/60 hover:text-red-500 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Selector de Provincia / Municipio */}
            <button
              onClick={() => setShowZoneModal(true)}
              className="glass-button px-4 py-2.5 flex items-center justify-between gap-2 border-[#8C6239]/15 text-[#8C6239] font-bold text-xs cursor-pointer min-w-[200px]"
            >
              <span className="flex items-center gap-1.5">
                <span>📍 Envíos a:</span>
                <span className="text-[#2B2521] font-extrabold">{deliveryMunicipality}, {deliveryProvince}</span>
              </span>
              <ChevronDown size={14} className="text-[#8C6239]" />
            </button>
          </div>

          {/* Header & Cart Button */}
          <div className="flex justify-between items-center mt-2">
            <h2 className="text-xl font-extrabold text-[#2B2521]">Catálogo de Productos</h2>
            <button
              onClick={() => setIsCartOpen(true)}
              className="glass-button px-4 py-2.5 hidden md:flex items-center gap-2 relative border-[#8C6239]/15 text-[#8C6239] cursor-pointer"
            >
              <ShoppingCart size={16} />
              <span className="font-bold text-sm">Mi Carrito</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D95D39] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Más Vendidos (Best Sellers Section) - Only shown on "Todos" category when not searching */}
          {selectedCategory === 'Todos' && searchQuery === '' && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-extrabold text-[#8C6239] flex items-center gap-1.5">
                <span>🔥</span> Productos Más Vendidos
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {products
                  .filter(p => ['prod-1', 'prod-4', 'prod-9'].includes(p.id))
                  .map(product => {
                    const inCartItem = cart.find(i => i.product.id === product.id);
                    const remainingStock = product.stock - (inCartItem?.quantity || 0);

                    return (
                      <div key={`best-${product.id}`} className="glass-card flex flex-col overflow-hidden relative border-[#8C6239]/10 bg-[#FAF9F5]/40">
                        <span className="absolute top-2 left-2 bg-[#D95D39] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full z-10 shadow-sm animate-pulse">
                          🔥 MÁS VENDIDO
                        </span>
                        
                        <div className="h-32 w-full overflow-hidden bg-[#8C6239]/5 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-sm text-[#2B2521] leading-tight">{product.name}</h4>
                            <p className="text-[10px] text-[#2B2521]/60 line-clamp-1 mt-0.5">{product.description}</p>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-extrabold text-[#2B2521]">${product.price.toFixed(2)}</span>
                            <button
                              onClick={() => addToCart(product)}
                              disabled={remainingStock <= 0}
                              className="glass-button-primary px-3.5 py-1.5 text-[10px] font-bold cursor-pointer"
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
            <h3 className="text-xs font-bold text-[#2B2521]/70 uppercase tracking-wider">Categorías de Envíos:</h3>
            <div className="glass-track flex items-center p-1 w-full overflow-x-auto whitespace-nowrap scrollbar-none">
              {['Todos', 'Carnes', 'Granos', 'Lácteos', 'Abarrotes'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'glass-button-segmented-active'
                      : 'text-[#2B2521]/60 hover:text-[#2B2521] px-4'
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
              .filter(p => {
                const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
                const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                      p.description.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesCategory && matchesSearch;
              })
              .map(product => {
                const inCartItem = cart.find(i => i.product.id === product.id);
                const remainingStock = product.stock - (inCartItem?.quantity || 0);

                return (
                  <div key={product.id} className="glass-card flex flex-col overflow-hidden relative">
                    {/* Image wrapper */}
                    <div className="h-44 w-full overflow-hidden bg-[#8C6239]/5 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <span className="absolute top-2 right-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-[#8C6239] border border-white">
                        {product.category}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-bold text-base text-[#2B2521] leading-tight">{product.name}</h3>
                        <p className="text-xs text-[#2B2521]/60 line-clamp-2 leading-relaxed">{product.description}</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xl font-extrabold text-[#2B2521]">${product.price.toFixed(2)}</span>
                          <span className={`text-xs font-semibold ${
                            remainingStock > 10 
                              ? 'text-green-600' 
                              : remainingStock > 0 
                              ? 'text-[#D95D39] animate-pulse' 
                              : 'text-red-500'
                          }`}>
                            {remainingStock > 0 ? `Stock: ${remainingStock} disp.` : 'Agotado'}
                          </span>
                        </div>

                        <button
                          onClick={() => addToCart(product)}
                          disabled={remainingStock <= 0}
                          className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            remainingStock > 0
                              ? 'glass-button-primary'
                              : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
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

          {/* Vista Móvil: Diseño de 1 Sola Columna con Imágenes Grandes y Stock Destacado */}
          <div className="grid grid-cols-1 gap-5 md:hidden">
            {products
              .filter(p => {
                const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
                const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                      p.description.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesCategory && matchesSearch;
              })
              .map(product => {
                const inCartItem = cart.find(i => i.product.id === product.id);
                const remainingStock = product.stock - (inCartItem?.quantity || 0);

                return (
                  <div key={`mob-${product.id}`} className="glass-card flex flex-col overflow-hidden relative border border-[#8C6239]/10">
                    <div className="h-48 w-full overflow-hidden bg-[#8C6239]/5 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold text-[#8C6239] border border-white">
                        {product.category}
                      </span>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                      <div>
                        <div className="flex justify-between items-baseline gap-2">
                          <h4 className="font-extrabold text-base text-[#2B2521] leading-tight">{product.name}</h4>
                          <span className="text-base font-extrabold text-[#D95D39]">${product.price.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-[#2B2521]/60 leading-relaxed mt-1">{product.description}</p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2.5 border-t border-[#2B2521]/5">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          remainingStock > 10 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : remainingStock > 0 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {remainingStock > 0 ? `Quedan ${remainingStock} libras` : 'Agotado'}
                        </span>
                        
                        <button
                          onClick={() => addToCart(product)}
                          disabled={remainingStock <= 0}
                          className="glass-button-primary px-5 py-2.5 text-xs font-bold cursor-pointer"
                        >
                          {remainingStock > 0 ? 'Añadir' : 'Agotado'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

      </div>

      {/* Orders Tracking List */}
      {orders.length > 0 && (
        <div className="glass-panel p-5 mt-4" id="orders-tracking">
          <h2 className="text-lg font-extrabold text-[#2B2521] mb-4">Progreso del Pedido</h2>
          
          {/* Vista Escritorio: Tabla */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#8C6239]/10 text-[#2B2521]/60 font-bold">
                  <th className="py-2.5">Código Pedido</th>
                  <th className="py-2.5">Destinatario</th>
                  <th className="py-2.5">Monto Total</th>
                  <th className="py-2.5">Estado</th>
                  <th className="py-2.5">Repartidor Asignado</th>
                  <th className="py-2.5">Notas logísticas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2521]/5">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-white/20 transition-colors">
                    <td className="py-3 font-mono font-bold text-[#2B2521]">{order.id}</td>
                    <td className="py-3 text-[#2B2521] font-semibold">{order.family_name}</td>
                    <td className="py-3 font-extrabold text-[#2B2521]">${order.total_amount.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                        order.status === 'delivered' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : order.status === 'in_transit' 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200 animate-pulse' 
                          : order.status === 'incident' 
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-[#FAF9F5] text-[#8C6239] border border-[#8C6239]/20'
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
                    <td className="py-3 text-[#2B2521]/70">{order.delivery_name || 'Pendiente de despacho'}</td>
                    <td className="py-3 text-xs text-[#2B2521]/60 max-w-[200px] truncate" title={order.notes || order.incident_reason}>
                      {order.incident_reason ? `Fallo: ${order.incident_reason}` : (order.notes || 'Ninguna')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista Móvil: Línea de Tiempo Vertical de Hitos Asíncronos */}
          <div className="grid grid-cols-1 gap-5 md:hidden">
            {orders.map(order => {
              // Hito activo (0 a 3)
              let step = 0;
              if (order.status === 'assigned') step = 1;
              else if (order.status === 'in_transit') step = 2;
              else if (order.status === 'delivered' || order.status === 'incident') step = 3;

              const steps = [
                { title: 'Pedido Recibido', desc: 'Pago procesado por Stripe', index: 0 },
                { title: 'En Preparación', desc: 'Validando productos en almacén', index: 1 },
                { title: 'En Camino a Cuba', desc: 'Repartidor en tránsito', index: 2 },
                { title: 'Entregado con Éxito', desc: order.status === 'incident' ? `Fallo: ${order.incident_reason}` : 'Entregado a tu familiar', index: 3 }
              ];

              return (
                <div key={order.id} className="premium-card p-5 bg-white shadow-md flex flex-col gap-4 border border-[#8C6239]/10">
                  <div className="flex justify-between items-center pb-2 border-b border-[#2B2521]/5">
                    <div>
                      <span className="text-[9px] font-bold text-[#8C6239] uppercase tracking-wider block">Código Pedido</span>
                      <span className="font-mono font-extrabold text-sm text-[#2B2521]">{order.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-[#8C6239] uppercase tracking-wider block">Total Pagado</span>
                      <span className="text-sm font-extrabold text-[#D95D39]">${order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] text-[#2B2521]/80">
                    <p><span className="font-semibold text-[#2B2521]">Recibe:</span> {order.family_name}</p>
                    <p className="truncate"><span className="font-semibold text-[#2B2521]">Dirección:</span> {order.family_address}</p>
                    {order.delivery_name && <p><span className="font-semibold text-[#2B2521]">Repartidor:</span> {order.delivery_name}</p>}
                  </div>

                  {/* Timeline Vertical */}
                  <div className="flex flex-col gap-4 mt-2 pl-1">
                    {steps.map((s) => {
                      const isCompleted = step >= s.index;
                      const isIncident = order.status === 'incident' && s.index === 3;
                      const isLast = s.index === 3;

                      return (
                        <div key={s.index} className="flex gap-3 relative">
                          {/* Línea conectora */}
                          {!isLast && (
                            <div className={`absolute left-[11px] top-6 w-[2.5px] h-8 ${
                              step > s.index ? 'bg-[#D95D39]' : 'bg-gray-200'
                            }`} />
                          )}

                          {/* Nodo del Timeline */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold z-10 ${
                            isIncident
                              ? 'bg-red-500 text-white shadow-md shadow-red-500/25 border border-red-600'
                              : isCompleted 
                              ? 'bg-[#D95D39] text-white shadow-md shadow-[#D95D39]/25 border border-[#D95D39]' 
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                          }`}>
                            {isIncident ? '✕' : isCompleted ? '✓' : s.index + 1}
                          </div>

                          {/* Info del paso */}
                          <div className="flex flex-col justify-center">
                            <span className={`text-xs font-bold leading-tight ${
                              isIncident
                                ? 'text-red-600'
                                : isCompleted 
                                ? 'text-[#2B2521]' 
                                : 'text-gray-400'
                            }`}>
                              {s.title}
                            </span>
                            <span className="text-[10px] text-gray-500 mt-0.5 leading-none">
                              {s.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Incidentes o Reembolsos */}
                  {(order.refunded || order.store_credit_issued) && (
                    <div className="mt-1 pt-2.5 border-t border-[#2B2521]/5 flex gap-2">
                      {order.refunded && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-extrabold rounded">
                          Reembolso Stripe
                        </span>
                      )}
                      {order.store_credit_issued && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-extrabold rounded">
                          +${order.store_credit_issued} Crédito
                        </span>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Onboarding Familiar */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-[#2B2521]/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 bg-white/95 shadow-2xl relative">
            <button 
              onClick={() => setShowOnboarding(false)}
              className="absolute top-4 right-4 text-[#2B2521]/60 hover:text-[#2B2521] cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-[#2B2521] flex items-center gap-2 mb-2">
              👨‍👩‍👧‍👦 Registrar Familiar Recibidor en Cuba
            </h3>
            <p className="text-xs text-[#2B2521]/60 mb-4">
              Agrega los datos de envío de tu familiar en Cuba. Esto se guardará como recibidor predeterminado.
            </p>

            <form onSubmit={handleAddFamily} className="flex flex-col gap-3">
              {familyError && <p className="text-xs font-bold text-red-500 bg-red-50 p-2.5 rounded-xl">{familyError}</p>}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#2B2521]/70">Apodo Familiar (Ej. Mamá, Abuela)</label>
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
                  <label className="text-xs font-bold text-[#2B2521]/70">Nombre Completo del Recibidor</label>
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
                  <label className="text-xs font-bold text-[#2B2521]/70">Provincia</label>
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
                  <label className="text-xs font-bold text-[#2B2521]/70">Municipio</label>
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
                <label className="text-xs font-bold text-[#2B2521]/70">Dirección Exacta (Calle, Número, e/ Calles)</label>
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
                <label className="text-xs font-bold text-[#2B2521]/70">Teléfono Celular en Cuba (WhatsApp preferente)</label>
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
                className="glass-button-primary py-2.5 mt-2 text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Guardar y Activar Familiar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Checkout Exitoso (Simulación Stripe) */}
      {checkoutSuccess && (
        <div className="fixed inset-0 bg-[#2B2521]/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md p-6 bg-white/95 shadow-2xl text-center flex flex-col items-center gap-4 border-[#D95D39]/30">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-3xl shadow-inner border border-green-200">
              ✓
            </div>
            
            <div>
              <h3 className="text-xl font-extrabold text-[#2B2521]">¡Pago Exitoso en 1-Clic!</h3>
              <p className="text-xs text-[#2B2521]/60 mt-1">Procesado con Stripe Checkout para LLC en EE.UU.</p>
            </div>

            <div className="bg-[#FAF9F5] w-full p-4 rounded-2xl text-left border border-[#8C6239]/10 text-xs flex flex-col gap-1.5">
              <p className="text-[#8C6239] font-bold">Resumen del Pedido:</p>
              <p className="text-[#2B2521] font-bold text-sm">Código: {checkoutSuccess.id}</p>
              <p className="text-[#2B2521]"><span className="font-semibold">Recibe:</span> {checkoutSuccess.family_name}</p>
              <p className="text-[#2B2521]"><span className="font-semibold">Destino:</span> {checkoutSuccess.family_address}</p>
              <p className="text-[#D95D39] font-extrabold text-right text-sm mt-1">Total Pagado: ${checkoutSuccess.total_amount.toFixed(2)}</p>
            </div>

            <p className="text-xs text-[#2B2521]/60 leading-relaxed bg-[#D95D39]/5 p-3 rounded-xl border border-[#D95D39]/10">
              📦 <span className="font-bold text-[#8C6239]">Validación de Inventario:</span> El stock ha sido descontado estrictamente en tiempo real en la base de datos de Restaurant Al Campestre.
            </p>

            <button
              onClick={() => setCheckoutSuccess(null)}
              className="glass-button-primary w-full py-2.5 text-sm font-bold cursor-pointer"
            >
              Entendido / Seguir Comprando
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Selector de Zona de Entrega */}
      {showZoneModal && (
        <div className="fixed inset-0 bg-[#2B2521]/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md p-6 bg-white/95 shadow-2xl relative border-[#D95D39]/20">
            <button 
              onClick={() => setShowZoneModal(false)}
              className="absolute top-4 right-4 text-[#2B2521]/60 hover:text-[#2B2521] cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-[#2B2521] flex items-center gap-2 mb-2">
              📍 Seleccionar Zona de Entrega
            </h3>
            <p className="text-xs text-[#2B2521]/60 mb-4">
              Configura el destino de envío en Cuba para mostrar las tarifas de entrega y disponibilidad de productos.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2B2521]/70">Provincia</label>
                <select
                  value={deliveryProvince}
                  onChange={e => {
                    const newProv = e.target.value;
                    setDeliveryProvince(newProv);
                    // Set default municipality for province
                    if (newProv === 'La Habana') setDeliveryMunicipality('Plaza de la Revolución');
                    else if (newProv === 'Artemisa') setDeliveryMunicipality('San Antonio de los Baños');
                    else if (newProv === 'Mayabeque') setDeliveryMunicipality('Bejucal');
                  }}
                  className="glass-input text-sm"
                >
                  <option value="La Habana">La Habana</option>
                  <option value="Artemisa">Artemisa</option>
                  <option value="Mayabeque">Mayabeque</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#2B2521]/70">Municipio</label>
                {deliveryProvince === 'La Habana' && (
                  <select 
                    value={deliveryMunicipality} 
                    onChange={e => setDeliveryMunicipality(e.target.value)} 
                    className="glass-input text-sm"
                  >
                    <option value="Plaza de la Revolución">Plaza de la Revolución</option>
                    <option value="Playa">Playa</option>
                    <option value="Centro Habana">Centro Habana</option>
                    <option value="Habana Vieja">Habana Vieja</option>
                    <option value="Boyeros">Boyeros</option>
                  </select>
                )}
                {deliveryProvince === 'Artemisa' && (
                  <select 
                    value={deliveryMunicipality} 
                    onChange={e => setDeliveryMunicipality(e.target.value)} 
                    className="glass-input text-sm"
                  >
                    <option value="San Antonio de los Baños">San Antonio de los Baños</option>
                    <option value="Bauta">Bauta</option>
                  </select>
                )}
                {deliveryProvince === 'Mayabeque' && (
                  <select 
                    value={deliveryMunicipality} 
                    onChange={e => setDeliveryMunicipality(e.target.value)} 
                    className="glass-input text-sm"
                  >
                    <option value="Bejucal">Bejucal</option>
                    <option value="San José de las Lajas">San José de las Lajas</option>
                  </select>
                )}
              </div>

              <button
                onClick={() => setShowZoneModal(false)}
                className="glass-button-primary py-2.5 mt-2 text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                Confirmar Zona de Envío
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar Panel */}
      {isCartOpen && (
        <div className="fixed inset-0 z-40 bg-[#2B2521]/20 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white/95 backdrop-blur-md border-l border-[#8C6239]/10 shadow-2xl p-6 flex flex-col justify-between">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-[#8C6239]/10">
                <h3 className="text-lg font-bold text-[#2B2521] flex items-center gap-2">
                  <ShoppingCart size={18} className="text-[#8C6239]" />
                  Detalle del Carrito
                </h3>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-[#2B2521]/60 hover:text-[#2B2521] p-1 rounded-full hover:bg-[#8C6239]/10 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-3xl mb-3">🛒</p>
                  <p className="text-sm font-semibold text-[#8C6239]/60">Tu carrito está vacío.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.product.id} className="p-3 bg-[#FAF9F5]/40 border border-[#8C6239]/10 rounded-2xl flex justify-between items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#2B2521] truncate">{item.product.name}</p>
                        <p className="text-xs text-[#2B2521]/60 font-semibold">${item.product.price.toFixed(2)} / libra</p>
                      </div>
                      
                      {/* Quantity selector */}
                      <div className="flex items-center gap-2.5 bg-white/80 px-2 py-1 rounded-xl border border-[#8C6239]/15">
                        <button 
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="font-bold text-[#2B2521] hover:text-[#D95D39] px-1 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-[#2B2521] min-w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className="font-bold text-[#2B2521] hover:text-[#D95D39] px-1 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-[#2B2521]">${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Stripe Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-[#8C6239]/10 pt-4 flex flex-col gap-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-[#2B2521]/70">Subtotal:</span>
                  <span className="text-2xl font-extrabold text-[#2B2521]">${totalCartPrice.toFixed(2)}</span>
                </div>

                {checkoutError && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 p-2.5 rounded-xl">{checkoutError}</p>
                )}

                <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-[#8C6239]/10 text-xs flex flex-col gap-2">
                  <p className="font-bold text-[#8C6239]">💳 Método de Pago (Stripe 1-Clic)</p>
                  <div className="flex justify-between text-[#2B2521]/70 font-semibold">
                    <span>Tarjeta Guardada:</span>
                    <span>Visa terminada en •••• 4242</span>
                  </div>
                  {activeFamily ? (
                    <div className="flex justify-between text-[#2B2521]/70 font-semibold truncate">
                      <span>Destinatario en Cuba:</span>
                      <span className="font-bold text-[#8C6239]">{activeFamily.nickname}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        setShowOnboarding(true);
                      }}
                      className="text-[#D95D39] font-bold hover:underline text-left cursor-pointer"
                    >
                      ⚠️ Asignar recibidor en Cuba
                    </button>
                  )}
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={!selectedFamilyId}
                  className={`w-full py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
                    selectedFamilyId
                      ? 'glass-button-primary cursor-pointer'
                      : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
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

      {/* Barra de Carrito Fija en Móvil (solo si hay items y el carrito no está abierto) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#8C6239]/10 p-4 flex justify-between items-center shadow-lg animate-slide-up md:hidden">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#8C6239] uppercase tracking-wider">Tu Carrito</span>
            <span className="text-base font-extrabold text-[#2B2521]">${totalCartPrice.toFixed(2)}</span>
            <span className="text-[10px] text-[#2B2521]/60 font-semibold">{cart.reduce((sum, i) => sum + i.quantity, 0)} lbs en total</span>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="glass-button-primary px-5 py-3 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
          >
            <ShoppingCart size={14} />
            Ver Carrito & Pagar
          </button>
        </div>
      )}

      {/* Barra de Navegación Móvil Fija (Tab Bar Inferior) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#8C6239]/10 h-16 flex justify-around items-center md:hidden">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center justify-center text-[#8C6239] hover:text-[#D95D39] transition-colors"
        >
          <Home size={20} />
          <span className="text-[10px] font-bold mt-1">Inicio</span>
        </button>
        <button 
          onClick={() => {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
              searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
              searchInput.focus();
            }
          }}
          className="flex flex-col items-center justify-center text-[#8C6239] hover:text-[#D95D39] transition-colors"
        >
          <Search size={20} />
          <span className="text-[10px] font-bold mt-1">Buscar</span>
        </button>
        <Link 
          href="/chat"
          className="flex flex-col items-center justify-center text-[#D95D39] hover:scale-105 transition-transform"
        >
          <div className="bg-gradient-to-r from-[#D95D39] to-[#C24C2A] p-2 rounded-full text-white shadow-md">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <span className="text-[10px] font-extrabold mt-0.5">Asistente IA</span>
        </Link>
        <button 
          onClick={() => {
            const ordersSection = document.getElementById('orders-tracking');
            if (ordersSection) {
              ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              alert("No tienes pedidos activos para rastrear.");
            }
          }}
          className="flex flex-col items-center justify-center text-[#8C6239] hover:text-[#D95D39] transition-colors relative"
        >
          <ClipboardList size={20} />
          <span className="text-[10px] font-bold mt-1">Pedidos</span>
          {orders.length > 0 && (
            <span className="absolute -top-1 right-2 bg-[#D95D39] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white">
              {orders.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => {
            const trigger = document.getElementById('profile-menu-trigger');
            if (trigger) {
              trigger.click();
            }
          }}
          className="flex flex-col items-center justify-center text-[#8C6239] hover:text-[#D95D39] transition-colors"
        >
          <User size={20} />
          <span className="text-[10px] font-bold mt-1">Perfiles</span>
        </button>
      </div>

    </div>
  );
}
