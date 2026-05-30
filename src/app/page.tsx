'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  getProducts, 
  getFamilies, 
  saveFamily, 
  createOrderWithStockCheck, 
  getOrders,
  checkDriverReturnStatus,
  Family, 
  Product, 
  Order 
} from '@/lib/dbMock';
import { Plus, User, Users, ShoppingCart, Check, CreditCard, ArrowRight, Sparkles, Home, Phone, MapPin, X, Search, ChevronDown, ClipboardList, Send, Bot, TrendingUp, Flame, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { GooeyInput } from "@/components/ui/gooey-input";
import { CustomSelect } from "@/components/ui/custom-select";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";


const provinceOptions = [
  { value: "La Habana", label: "La Habana" },
  { value: "Artemisa", label: "Artemisa" },
  { value: "Mayabeque", label: "Mayabeque" },
];

const habanaMunicipios = [
  { value: "Plaza de la Revolución", label: "Plaza de la Revolución" },
  { value: "Playa", label: "Playa" },
  { value: "Centro Habana", label: "Centro Habana" },
  { value: "Habana Vieja", label: "Habana Vieja" },
  { value: "Boyeros", label: "Boyeros" },
];

const artemisaMunicipios = [
  { value: "San Antonio de los Baños", label: "San Antonio de los Baños" },
  { value: "Bauta", label: "Bauta" },
];

const mayabequeMunicipios = [
  { value: "Bejucal", label: "Bejucal" },
  { value: "San José de las Lajas", label: "San José de las Lajas" },
];



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
  const [isMobileFamilyOpen, setIsMobileFamilyOpen] = useState(false);
  
  // Hero Promotion Index
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  
  // Modals
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<Order | null>(null);
  
  // Chatbot Widget State
  const [isAiWidgetOpen, setIsAiWidgetOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ id: string; sender: 'user' | 'bot'; text: string }[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: '¡Hola! Soy tu asistente de compras con IA. Escríbeme qué quieres enviar a Cuba (ej. "mándale 5 libras de lomo a mi mamá") y lo añadiré a tu carrito en tiempo real.'
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiIsTyping, setAiIsTyping] = useState(false);
  const widgetEndRef = useRef<HTMLDivElement>(null);
  
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

  // Loading & Flying cart animation states
  const [isLoading, setIsLoading] = useState(true);
  const [flyingItems, setFlyingItems] = useState<{ id: string; x: number; y: number; tx: number; ty: number; img: string }[]>([]);
  const [isCartPopping, setIsCartPopping] = useState(false);

  const loadData = async () => {
    try {
      await checkDriverReturnStatus();
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
    } finally {
      setIsLoading(false);
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

  useEffect(() => {
    const handleToggle = () => {
      setIsAiWidgetOpen(prev => !prev);
    };
    window.addEventListener('toggle-ai-assistant', handleToggle);
    
    if (typeof window !== 'undefined') {
      const shouldOpen = sessionStorage.getItem('open-ai-assistant');
      if (shouldOpen === 'true') {
        setIsAiWidgetOpen(true);
        sessionStorage.removeItem('open-ai-assistant');
      }

      // Detectar si venimos con parámetros de búsqueda o pedidos desde otras páginas
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('search') === 'true') {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          setTimeout(() => {
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            searchInput.focus();
          }, 500);
        }
      } else if (searchParams.get('orders') === 'true') {
        const ordersSection = document.getElementById('orders-tracking');
        if (ordersSection) {
          setTimeout(() => {
            ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 500);
        }
      }
    }
    
    return () => {
      window.removeEventListener('toggle-ai-assistant', handleToggle);
    };
  }, []);

  useEffect(() => {
    if (isAiWidgetOpen) {
      widgetEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, aiIsTyping, isAiWidgetOpen]);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.setProperty('--tilt-x', `${rotateX}deg`);
    card.style.setProperty('--tilt-y', `${rotateY}deg`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  };

  const addToCart = (product: Product, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (product.stock <= 0) return;

    if (e) {
      const clickX = e.clientX;
      const clickY = e.clientY;
      let targetEl = document.getElementById('desktop-cart-btn');
      if (window.innerWidth < 768) {
        targetEl = document.getElementById('mobile-cart-banner');
      }
      if (targetEl) {
        const targetRect = targetEl.getBoundingClientRect();
        const tx = targetRect.left + targetRect.width / 2 - clickX;
        const ty = targetRect.top + targetRect.height / 2 - clickY;
        const flyId = `fly-${Date.now()}-${Math.random()}`;
        setFlyingItems(prev => [...prev, { id: flyId, x: clickX, y: clickY, tx, ty, img: product.image_url }]);
        setTimeout(() => {
          setFlyingItems(prev => prev.filter(item => item.id !== flyId));
          setIsCartPopping(true);
          setTimeout(() => setIsCartPopping(false), 400);
        }, 800);
      }
    }
    
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
    if (window.innerWidth >= 768) {
      setIsCartOpen(true);
    }
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

  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user' as const,
      text: aiInput
    };

    setAiMessages(prev => [...prev, userMsg]);
    const query = aiInput.toLowerCase();
    setAiInput('');
    setAiIsTyping(true);

    setTimeout(() => {
      setAiIsTyping(false);
      
      // 1. Match family
      let matchedFamily = families.find(f => f.id === selectedFamilyId) || null;
      for (const fam of families) {
        const nick = fam.nickname.toLowerCase();
        const name = fam.full_name.toLowerCase();
        if (query.includes(nick) || query.includes(name.split(' ')[0]) || (query.includes('mamá') && nick.includes('mamá')) || (query.includes('abuela') && nick.includes('abuela'))) {
          matchedFamily = fam;
          break;
        }
      }

      if (matchedFamily && matchedFamily.id !== selectedFamilyId) {
        setSelectedFamilyId(matchedFamily.id);
      }

      // 2. Parse products (updated to match Supabase seed IDs)
      const dictionary = [
        { keys: ['cerdo', 'puerco', 'lomo', 'carne'], id: 'prod-meat-2' },
        { keys: ['arroz', 'grano'], id: 'prod-grain-2' },
        { keys: ['frijoles', 'caraotas', 'judias', 'negros'], id: 'prod-grain-1' },
        { keys: ['aceite', 'girasol', 'cocina'], id: 'prod-grocery-1' },
        { keys: ['leche', 'polvo'], id: 'prod-dairy-4' },
        { keys: ['pollo', 'gallina', 'muslos'], id: 'prod-meat-3' }
      ];

      let matchedAny = false;
      const addedItems: { product: Product; quantity: number }[] = [];

      const regex = /(\d+)\s*(?:libras|libra|kg|kilogramos|kilos|kilo|paquetes|paquete|botellas|botella|unidades|unidad|bolsas|bolsa|de)?\s+([a-záéíóúñ\s]+?)(?=\d+|$|,|y\s+\d+|a\s+mi|\.)/gi;
      let match;
      const cleanQuery = query.replace(/a mi (mamá|abuela|tia|hermano|papa)/g, '');

      while ((match = regex.exec(cleanQuery)) !== null) {
        const quantity = parseInt(match[1]);
        const productTerm = match[2].trim().toLowerCase();
        const matchedDict = dictionary.find(item => item.keys.some(key => productTerm.includes(key)));

        if (matchedDict) {
          const prod = products.find(p => p.id === matchedDict.id);
          if (prod) {
            matchedAny = true;
            addedItems.push({ product: prod, quantity });
          }
        }
      }

      if (!matchedAny) {
        dictionary.forEach(item => {
          if (item.keys.some(key => query.includes(key))) {
            const prod = products.find(p => p.id === item.id);
            if (prod) {
              matchedAny = true;
              addedItems.push({ product: prod, quantity: 2 });
            }
          }
        });
      }

      if (matchedAny) {
        setCart(prev => {
          let updated = [...prev];
          addedItems.forEach(ai => {
            const idx = updated.findIndex(item => item.product.id === ai.product.id);
            if (idx >= 0) {
              const newQty = Math.min(ai.product.stock, updated[idx].quantity + ai.quantity);
              updated[idx] = { ...updated[idx], quantity: newQty };
            } else {
              updated.push({ product: ai.product, quantity: Math.min(ai.product.stock, ai.quantity) });
            }
          });
          return updated;
        });

        setIsCartOpen(true);

        const listStr = addedItems.map(ai => `${ai.quantity} lbs de ${ai.product.name}`).join(', ');
        setAiMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: `¡Entendido! He añadido al carrito: **${listStr}**.\n\nDestinatario: **${matchedFamily ? matchedFamily.nickname : 'tu familiar seleccionado'}**.\n\nYa puedes revisar tu carrito a la derecha y pagar.`
        }]);
      } else {
        setAiMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: 'No logré entender qué productos deseas agregar. Prueba escribiendo:\n"Mándale 5 libras de carne de cerdo a mi mamá"'
        }]);
      }

    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 pb-20 md:pb-0">
      
      {/* Hero Banner Slideshow Premium */}
      <div className="relative overflow-hidden rounded-3xl h-44 sm:h-52 w-full shadow-lg">
        {/* Promos */}
        {[
          {
            title: "Envía Alimentos Frescos y Abarrotes directos a Cuba",
            desc: "Compra combos de carnes, granos y abarrotes desde EE.UU. con entrega garantizada en la puerta de tus familiares. Pago rápido en 1-clic con Stripe.",
            badge: "Entrega en 24-48h",
            gradient: "from-[#2D6A4F]/95 to-[#40916C]/95",
            image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80"
          },
          {
            title: "Combos de Carne Premium con 15% OFF",
            desc: "Lomo de cerdo fresco, pollo entero y picadillo de res seleccionados directamente en el campo. Sabor criollo garantizado.",
            badge: "Súper Oferta",
            gradient: "from-[#1B4332]/95 to-[#2D6A4F]/95",
            image: "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=800&q=80"
          },
          {
            title: "Nuevas Zonas de Cobertura en Provincias",
            desc: "Ya entregamos en San Antonio de los Baños, Bauta, Bejucal y San José de las Lajas. Cobertura ampliada para tu tranquilidad.",
            badge: "Cobertura Ampliada",
            gradient: "from-[#40916C]/95 to-[#D8F3DC]/95",
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



      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar: Familiar Recibidor */}
        <div className="hidden lg:flex lg:col-span-1 flex-col gap-4">
          <div className="glass-panel p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#1A2421] flex items-center gap-2">
                <User size={18} className="text-[#40916C]" />
                ¿Quién Recibe en Cuba?
              </h2>
              <button 
                onClick={() => setShowOnboarding(true)}
                className="bg-[#2D6A4F]/10 hover:bg-[#2D6A4F]/20 text-[#2D6A4F] p-1.5 rounded-xl transition cursor-pointer"
                title="Agregar Familiar"
              >
                <Plus size={16} />
              </button>
            </div>

            {families.length === 0 ? (
              <div className="text-center py-6 bg-white/30 rounded-2xl border border-dashed border-[#40916C]/20">
                <p className="text-xs text-[#1A2421]/60 mb-3">No tienes familiares guardados aún.</p>
                <InteractiveHoverButton
                  onClick={() => setShowOnboarding(true)}
                  className="text-xs"
                >
                  Registrar Primer Recibidor
                </InteractiveHoverButton>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {families.map(fam => (
                  <div
                    key={fam.id}
                    onClick={() => setSelectedFamilyId(fam.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedFamilyId === fam.id
                        ? 'bg-[#2D6A4F]/10 border-[#2D6A4F] shadow-sm'
                        : 'bg-white/40 border-white/55 hover:bg-white/70'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-[#1A2421]">{fam.nickname}</p>
                      <p className="text-xs text-[#1A2421]/60 truncate max-w-[180px]">{fam.full_name}</p>
                      <p className="text-xs text-[#1A2421]/50 mt-1">{fam.municipality}, {fam.province}</p>
                    </div>
                    {selectedFamilyId === fam.id && (
                      <span className="bg-[#2D6A4F] text-white p-1 rounded-full text-xs">
                        <Check size={12} className="stroke-[3]" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeFamily && (
              <div className="bg-white/60 p-3.5 rounded-2xl text-xs flex flex-col gap-2 border border-[#40916C]/10">
                <p className="font-bold text-[#40916C] mb-1">Detalles de Entrega:</p>
                <p className="flex items-start gap-1.5 text-[#1A2421]">
                  <MapPin size={12} className="mt-0.5 text-[#40916C] flex-shrink-0" />
                  <span>{activeFamily.address}, {activeFamily.municipality}, {activeFamily.province}</span>
                </p>
                <p className="flex items-center gap-1.5 text-[#1A2421]">
                  <Phone size={12} className="text-[#40916C] flex-shrink-0" />
                  <span>{activeFamily.phone}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Catalog */}
        <div className="lg:col-span-3 flex flex-col gap-6" id="catalog-section">
          
          {/* Barra de Búsqueda y Selector de Zona para Móviles y Escritorio */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="flex-1 flex flex-row items-center justify-between gap-3 w-full">
                {/* Buscador Gooey */}
                <GooeyInput
                  id="search-input"
                  placeholder="Buscar productos (ej. pollo, lomo)..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  collapsedWidth={160}
                  expandedWidth={300}
                  expandedOffset={48}
                  className="flex-1 justify-start"
                  classNames={{
                    trigger: "bg-[#FFFFFF] border border-[#40916C]/20 text-[#1A2421] rounded-full h-10 shadow-sm",
                    input: "text-[#1A2421] placeholder:text-[#1A2421]/45 h-full",
                    bubbleSurface: "bg-[#2D6A4F] text-[#FFFFFF] shadow-md border border-[#1B4332]/10"
                  }}
                />

                {/* Tasas de Cambio elTOQUE */}
                <a 
                  href="https://eltoque.com/tasas-de-cambio-cuba"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-full border border-[#40916C]/10 bg-white/40 hover:bg-white/60 transition-colors shadow-xs text-[10px] text-[#1A2421]/60 font-semibold cursor-pointer max-w-xs overflow-x-auto whitespace-nowrap scrollbar-none"
                  title="Ver tasas de cambio oficiales en elTOQUE"
                >
                  <span className="text-[#2D6A4F] font-bold">CUP:</span>
                  <span>USD <strong className="text-[#1A2421]">575</strong></span>
                  <span className="text-[#1A2421]/20">|</span>
                  <span>EUR <strong className="text-[#1A2421]">645</strong></span>
                  <span className="text-[#1A2421]/20">|</span>
                  <span>MLC <strong className="text-[#1A2421]">420</strong></span>
                  <span className="text-[#1A2421]/20">|</span>
                  <span>Zelle <strong className="text-[#1A2421]">570</strong></span>
                </a>
              </div>

              {/* Selector de Provincia / Municipio */}
              <button
                onClick={() => setShowZoneModal(true)}
                className="glass-button w-full md:w-auto px-4 py-2.5 flex items-center justify-between gap-2 border-[#40916C]/15 text-[#40916C] font-bold text-xs cursor-pointer md:min-w-[200px]"
              >
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#40916C]" />
                  <span>Envíos a:</span>
                  <span className="text-[#1A2421] font-extrabold">{deliveryMunicipality}, {deliveryProvince}</span>
                </span>
                <ChevronDown size={14} className="text-[#40916C]" />
              </button>
            </div>

            {/* Selector de Recibidor (Solo visible en móviles) */}
            <div className="lg:hidden w-full relative">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMobileFamilyOpen(!isMobileFamilyOpen)}
                  className="flex-1 glass-button px-4 py-2.5 flex items-center justify-between gap-2 border-[#40916C]/15 text-[#40916C] font-bold text-xs cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <User size={14} className="text-[#40916C] flex-shrink-0" />
                    <span>Recibe en Cuba:</span>
                    <span className="text-[#1A2421] font-extrabold truncate">
                      {activeFamily ? activeFamily.nickname : 'Seleccionar...'}
                    </span>
                  </span>
                  <ChevronDown size={14} className="text-[#40916C] flex-shrink-0" />
                </button>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="bg-[#2D6A4F]/10 hover:bg-[#2D6A4F]/20 text-[#2D6A4F] p-2.5 rounded-xl border border-[#40916C]/15 transition cursor-pointer flex-shrink-0 flex items-center justify-center"
                  title="Agregar Familiar"
                >
                  <Plus size={16} />
                </button>
              </div>

              {activeFamily && (
                <p className="text-[10px] text-[#1A2421]/60 mt-1 px-1 truncate">
                  📍 {activeFamily.address}, {activeFamily.municipality} | 📞 {activeFamily.phone}
                </p>
              )}

              {isMobileFamilyOpen && families.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-md border border-[#40916C]/15 shadow-lg rounded-2xl p-2 z-35 flex flex-col gap-1 max-h-60 overflow-y-auto">
                  {families.map(fam => (
                    <button
                      key={fam.id}
                      onClick={() => {
                        setSelectedFamilyId(fam.id);
                        setIsMobileFamilyOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-center justify-between text-xs cursor-pointer ${
                        selectedFamilyId === fam.id
                          ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] font-bold'
                          : 'hover:bg-[#2D6A4F]/5 text-[#1A2421]/80 font-medium'
                      }`}
                    >
                      <div className="truncate pr-4">
                        <p className="font-bold">{fam.nickname}</p>
                        <p className="text-[10px] opacity-75 truncate">{fam.full_name} · {fam.municipality}</p>
                      </div>
                      {selectedFamilyId === fam.id && (
                        <Check size={12} className="stroke-[3] text-[#2D6A4F]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Header & Cart Button */}
          <div className="flex justify-between items-center mt-2">
            <h2 className="text-xl font-extrabold text-[#1A2421]">Catálogo de Productos</h2>
            <button
              id="desktop-cart-btn"
              onClick={() => setIsCartOpen(true)}
              className={`glass-button px-4 py-2.5 hidden md:flex items-center gap-2 relative border-[#40916C]/15 text-[#40916C] cursor-pointer ${
                isCartPopping ? 'animate-cart-pop' : ''
              }`}
            >
              <ShoppingCart size={16} />
              <span className="font-bold text-sm">Mi Carrito</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#2D6A4F] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Más Vendidos (Best Sellers Section) - Only shown on "Todos" category when not searching */}
          {!isLoading && selectedCategory === 'Todos' && searchQuery === '' && (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full flex flex-col gap-3"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-[#40916C] flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-[#2D6A4F]" /> Productos Más Vendidos
                </h3>
                <div className="flex gap-2">
                  <CarouselPrevious className="static translate-y-0 translate-x-0 h-8 w-8" />
                  <CarouselNext className="static translate-y-0 translate-x-0 h-8 w-8" />
                </div>
              </div>
              
              <CarouselContent className="-ml-4">
                {products
                  .filter(p => ['prod-meat-1', 'prod-meat-4', 'prod-grocery-2', 'prod-dairy-1', 'prod-grain-1', 'prod-1', 'prod-4', 'prod-9'].includes(p.id))
                  .map(product => {
                    const inCartItem = cart.find(i => i.product.id === product.id);
                    const remainingStock = product.stock - (inCartItem?.quantity || 0);

                    return (
                      <CarouselItem key={`best-${product.id}`} className="pl-4 basis-[85%] sm:basis-1/2 md:basis-1/3">
                        <div 
                          className="uiverse-card h-full min-h-[280px]"
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="uiverse-card__shine" />
                          <div className="uiverse-card__glow" />
                          <div className="uiverse-card__content">
                            <span className={`uiverse-card__badge ${remainingStock <= 0 ? 'bg-red-600 shadow-red-200' : ''}`}>
                              {remainingStock <= 0 ? 'Agotado' : 'MÁS VENDIDO'}
                            </span>
                            
                            <div className="uiverse-card__image">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="uiverse-card__text">
                              <h4 className="uiverse-card__title" title={product.name}>
                                {product.name}
                              </h4>
                              <p className="uiverse-card__description" title={product.description}>
                                {product.description}
                              </p>
                            </div>
                            
                            <div className="uiverse-card__footer">
                              <span className="uiverse-card__price flex flex-col">
                                <span>${product.price.toFixed(2)}</span>
                                <span className={`text-[9px] font-bold mt-0.5 ${
                                  remainingStock > 10 
                                    ? 'text-green-600/70' 
                                    : remainingStock > 0 
                                    ? 'text-amber-600 animate-pulse' 
                                    : 'text-red-500/70'
                                }`}>
                                  {remainingStock > 0 ? `Quedan ${remainingStock} lb` : 'Agotado'}
                                </span>
                              </span>
                              
                              <button 
                                onClick={(e) => addToCart(product, e)}
                                disabled={remainingStock <= 0}
                                className="uiverse-card__button"
                                title="Añadir al carrito"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
              </CarouselContent>
            </Carousel>
          )}

          {/* Categories Selector Pills */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-[#1A2421]/70 uppercase tracking-wider">Categorías de Envíos:</h3>
            <div className="glass-track flex items-center p-1 w-full overflow-x-auto whitespace-nowrap scrollbar-none">
              {['Todos', 'Carnes', 'Granos', 'Lácteos', 'Abarrotes'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'glass-button-segmented-active'
                      : 'text-[#1A2421]/60 hover:text-[#1A2421] px-4'
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
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={`skel-desk-${i}`} className="premium-card p-4 h-[300px] flex flex-col gap-3 border border-[#40916C]/10 shimmer-skeleton rounded-2xl">
                  <div className="w-full h-[120px] bg-gray-200/50 rounded-xl" />
                  <div className="w-3/4 h-5 bg-gray-200/50 rounded-md mt-2" />
                  <div className="w-full h-10 bg-gray-200/50 rounded-md" />
                  <div className="w-full h-8 bg-gray-200/50 rounded-md mt-auto" />
                </div>
              ))
            ) : products
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
                  <div 
                    key={product.id} 
                    className="uiverse-card h-full min-h-[300px]"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="uiverse-card__shine" />
                    <div className="uiverse-card__glow" />
                    <div className="uiverse-card__content">
                      <span className={`uiverse-card__badge ${remainingStock <= 0 ? 'bg-red-600 shadow-red-200' : ''}`}>
                        {remainingStock <= 0 ? 'Agotado' : product.category}
                      </span>
                      
                      <div className="uiverse-card__image">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="uiverse-card__text">
                        <h4 className="uiverse-card__title" title={product.name}>
                          {product.name}
                        </h4>
                        <p className="uiverse-card__description" title={product.description}>
                          {product.description}
                        </p>
                      </div>
                      
                      <div className="uiverse-card__footer">
                        <span className="uiverse-card__price flex flex-col">
                          <span>${product.price.toFixed(2)}</span>
                          <span className={`text-[9px] font-bold mt-0.5 ${
                            remainingStock > 10 
                              ? 'text-green-600/70' 
                              : remainingStock > 0 
                              ? 'text-amber-600 animate-pulse' 
                              : 'text-red-500/70'
                          }`}>
                            {remainingStock > 0 ? `Stock: ${remainingStock} disp.` : 'Agotado'}
                          </span>
                        </span>
                        
                        <button 
                          onClick={(e) => addToCart(product, e)}
                          disabled={remainingStock <= 0}
                          className="uiverse-card__button"
                          title="Añadir al carrito"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Vista Móvil: Diseño Estrecho de 2 Columnas para mejor aprovechamiento del ancho */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={`skel-mob-${i}`} className="premium-card p-3 h-[260px] flex flex-col gap-2.5 border border-[#40916C]/10 shimmer-skeleton rounded-2xl">
                  <div className="w-full h-[90px] bg-gray-200/50 rounded-xl" />
                  <div className="w-5/6 h-4 bg-gray-200/50 rounded-md mt-1" />
                  <div className="w-full h-8 bg-gray-200/50 rounded-md" />
                  <div className="w-full h-7 bg-gray-200/50 rounded-md mt-auto" />
                </div>
              ))
            ) : products
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
                  <div 
                    key={`mob-${product.id}`} 
                    className="uiverse-card h-full min-h-[260px]"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="uiverse-card__shine" />
                    <div className="uiverse-card__glow" />
                    <div className="uiverse-card__content">
                      <span className={`uiverse-card__badge ${remainingStock <= 0 ? 'bg-red-600 shadow-red-200' : ''}`}>
                        {remainingStock <= 0 ? 'Agotado' : product.category}
                      </span>
                      
                      <div className="uiverse-card__image h-[100px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="uiverse-card__text">
                        <h4 className="uiverse-card__title" title={product.name}>
                          {product.name}
                        </h4>
                        <p className="uiverse-card__description" title={product.description}>
                          {product.description}
                        </p>
                      </div>
                      
                      <div className="uiverse-card__footer">
                        <span className="uiverse-card__price flex flex-col">
                          <span>${product.price.toFixed(2)}</span>
                          <span className={`text-[9px] font-bold mt-0.5 ${
                            remainingStock > 10 
                              ? 'text-green-600/70' 
                              : remainingStock > 0 
                              ? 'text-amber-600 animate-pulse' 
                              : 'text-red-500/70'
                          }`}>
                            {remainingStock > 0 ? `${remainingStock} lb` : 'Agotado'}
                          </span>
                        </span>
                        
                        <button 
                          onClick={(e) => addToCart(product, e)}
                          disabled={remainingStock <= 0}
                          className="uiverse-card__button"
                          title="Añadir al carrito"
                        >
                          <Plus size={16} />
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
          <h2 className="text-lg font-extrabold text-[#1A2421] mb-4">Progreso del Pedido</h2>
          
          {/* Vista Escritorio: Tabla */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#40916C]/10 text-[#1A2421]/60 font-bold">
                  <th className="py-2.5">Código Pedido</th>
                  <th className="py-2.5">Destinatario</th>
                  <th className="py-2.5">Monto Total</th>
                  <th className="py-2.5">Estado</th>
                  <th className="py-2.5">Repartidor Asignado</th>
                  <th className="py-2.5">Notas logísticas</th>
                  <th className="py-2.5 text-right">Seguimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2421]/5">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-white/20 transition-colors">
                    <td className="py-3 font-mono font-bold text-[#1A2421]">{order.id}</td>
                    <td className="py-3 text-[#1A2421] font-semibold">{order.family_name}</td>
                    <td className="py-3 font-extrabold text-[#1A2421]">${order.total_amount.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                        order.status === 'delivered' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : order.status === 'in_transit' 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200 animate-pulse' 
                          : order.status === 'incident' 
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-[#FFFFFF] text-[#40916C] border border-[#40916C]/20'
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
                    <td className="py-3 text-[#1A2421]/70">{order.delivery_name || 'Pendiente de despacho'}</td>
                    <td className="py-3 text-xs text-[#1A2421]/60 max-w-[200px] truncate" title={order.notes || order.incident_reason}>
                      {order.incident_reason ? `Fallo: ${order.incident_reason}` : (order.notes || 'Ninguna')}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/track/${order.id}`;
                          navigator.clipboard.writeText(url);
                          alert('¡Enlace de seguimiento copiado al portapapeles!');
                        }}
                        className="glass-button py-1 px-2.5 rounded-lg border-[#40916C]/25 text-[#2D6A4F] text-[10px] font-bold hover:bg-[#2D6A4F]/10 cursor-pointer inline-flex items-center gap-1"
                      >
                        Copiar Link
                      </button>
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
                <div key={order.id} className="premium-card p-5 bg-white shadow-md flex flex-col gap-4 border border-[#40916C]/10">
                  <div className="flex justify-between items-center pb-2 border-b border-[#1A2421]/5">
                    <div>
                      <span className="text-[9px] font-bold text-[#40916C] uppercase tracking-wider block">Código Pedido</span>
                      <span className="font-mono font-extrabold text-sm text-[#1A2421]">{order.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-[#40916C] uppercase tracking-wider block">Total Pagado</span>
                      <span className="text-sm font-extrabold text-[#2D6A4F]">${order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] text-[#1A2421]/80">
                    <p><span className="font-semibold text-[#1A2421]">Recibe:</span> {order.family_name}</p>
                    <p className="truncate"><span className="font-semibold text-[#1A2421]">Dirección:</span> {order.family_address}</p>
                    {order.delivery_name && <p><span className="font-semibold text-[#1A2421]">Repartidor:</span> {order.delivery_name}</p>}
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/track/${order.id}`;
                        navigator.clipboard.writeText(url);
                        alert('¡Enlace de seguimiento copiado al portapapeles!');
                      }}
                      className="glass-button w-full py-1.5 mt-2 rounded-xl border-[#40916C]/20 text-[#2D6A4F] text-[10px] font-bold hover:bg-[#2D6A4F]/10 cursor-pointer flex items-center justify-center gap-1"
                    >
                      Copiar Link de Seguimiento
                    </button>
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
                              step > s.index ? 'bg-[#2D6A4F]' : 'bg-gray-200'
                            }`} />
                          )}

                          {/* Nodo del Timeline */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold z-10 ${
                            isIncident
                              ? 'bg-red-500 text-white shadow-md shadow-red-500/25 border border-red-600'
                              : isCompleted 
                              ? 'bg-[#2D6A4F] text-white shadow-md shadow-[#2D6A4F]/25 border border-[#2D6A4F]' 
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
                                ? 'text-[#1A2421]' 
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
                    <div className="mt-1 pt-2.5 border-t border-[#1A2421]/5 flex gap-2">
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
        <div className="fixed inset-0 bg-[#1A2421]/30 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 bg-white/95 shadow-2xl relative">
            <button 
              onClick={() => setShowOnboarding(false)}
              className="absolute top-4 right-4 text-[#1A2421]/60 hover:text-[#1A2421] cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-[#1A2421] flex items-center gap-2 mb-2">
              <Users size={18} className="text-[#2D6A4F]" /> Registrar Familiar Recibidor en Cuba
            </h3>
            <p className="text-xs text-[#1A2421]/60 mb-4">
              Agrega los datos de envío de tu familiar en Cuba. Esto se guardará como recibidor predeterminado.
            </p>

            <form onSubmit={handleAddFamily} className="flex flex-col gap-3">
              {familyError && <p className="text-xs font-bold text-red-500 bg-red-50 p-2.5 rounded-xl">{familyError}</p>}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#1A2421]/70">Apodo Familiar (Ej. Mamá, Abuela)</label>
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
                  <label className="text-xs font-bold text-[#1A2421]/70">Nombre Completo del Recibidor</label>
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
                  <label className="text-xs font-bold text-[#1A2421]/70">Provincia</label>
                  <CustomSelect
                    options={provinceOptions}
                    value={province}
                    onChange={val => {
                      setProvince(val);
                      // Set default municipality for province
                      if (val === 'La Habana') setMunicipality('Plaza de la Revolución');
                      else if (val === 'Artemisa') setMunicipality('San Antonio de los Baños');
                      else if (val === 'Mayabeque') setMunicipality('Bejucal');
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#1A2421]/70">Municipio</label>
                  <CustomSelect
                    options={
                      province === 'La Habana'
                        ? habanaMunicipios
                        : province === 'Artemisa'
                        ? artemisaMunicipios
                        : mayabequeMunicipios
                    }
                    value={municipality}
                    onChange={setMunicipality}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1A2421]/70">Dirección Exacta (Calle, Número, e/ Calles)</label>
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
                <label className="text-xs font-bold text-[#1A2421]/70">Teléfono Celular en Cuba (WhatsApp preferente)</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ej. +53 52345678"
                  className="glass-input text-sm"
                />
              </div>

              <InteractiveHoverButton
                type="submit"
                className="w-full text-sm mt-2"
              >
                Guardar y Activar Familiar
              </InteractiveHoverButton>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Checkout Exitoso (Simulación Stripe) */}
      {checkoutSuccess && (
        <div className="fixed inset-0 bg-[#1A2421]/30 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="glass-panel w-full max-w-md p-6 bg-white/95 shadow-2xl text-center flex flex-col items-center gap-4 border-[#2D6A4F]/30">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-inner border border-green-200">
              <CheckCircle className="w-8 h-8 stroke-[2.5]" />
            </div>
            
            <div>
              <h3 className="text-xl font-extrabold text-[#1A2421]">¡Pago Exitoso en 1-Clic!</h3>
              <p className="text-xs text-[#1A2421]/60 mt-1">Procesado con Stripe Checkout para LLC en EE.UU.</p>
            </div>

            <div className="bg-[#FFFFFF] w-full p-4 rounded-2xl text-left border border-[#40916C]/10 text-xs flex flex-col gap-1.5">
              <p className="text-[#40916C] font-bold">Resumen del Pedido:</p>
              <p className="text-[#1A2421] font-bold text-sm">Código: {checkoutSuccess.id}</p>
              <p className="text-[#1A2421]"><span className="font-semibold">Recibe:</span> {checkoutSuccess.family_name}</p>
              <p className="text-[#1A2421]"><span className="font-semibold">Destino:</span> {checkoutSuccess.family_address}</p>
              <p className="text-[#2D6A4F] font-extrabold text-right text-sm mt-1">Total Pagado: ${checkoutSuccess.total_amount.toFixed(2)}</p>
            </div>

            <p className="text-xs text-[#1A2421]/60 leading-relaxed bg-[#2D6A4F]/5 p-3 rounded-xl border border-[#2D6A4F]/10">
              <span className="font-bold text-[#40916C] flex items-center gap-1.5"><CheckCircle size={14} className="text-green-600" /> Validación de Inventario:</span> El stock ha sido descontado estrictamente en tiempo real en la base de datos de Restaurant Al Campestre.
            </p>

            <InteractiveHoverButton
              onClick={() => setCheckoutSuccess(null)}
              className="w-full text-sm"
            >
              Entendido / Seguir Comprando
            </InteractiveHoverButton>
          </div>
        </div>
      )}

      {/* MODAL: Selector de Zona de Entrega */}
      {showZoneModal && (
        <div className="fixed inset-0 bg-[#1A2421]/30 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="glass-panel w-full max-w-md p-6 bg-white/95 shadow-2xl relative border-[#2D6A4F]/20">
            <button 
              onClick={() => setShowZoneModal(false)}
              className="absolute top-4 right-4 text-[#1A2421]/60 hover:text-[#1A2421] cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-[#1A2421] flex items-center gap-2 mb-2">
              <MapPin size={20} className="text-[#2D6A4F]" /> Seleccionar Zona de Entrega
            </h3>
            <p className="text-xs text-[#1A2421]/60 mb-4">
              Configura el destino de envío en Cuba para mostrar las tarifas de entrega y disponibilidad de productos.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1A2421]/70">Provincia</label>
                <CustomSelect
                  options={provinceOptions}
                  value={deliveryProvince}
                  onChange={val => {
                    setDeliveryProvince(val);
                    // Set default municipality for province
                    if (val === 'La Habana') setDeliveryMunicipality('Plaza de la Revolución');
                    else if (val === 'Artemisa') setDeliveryMunicipality('San Antonio de los Baños');
                    else if (val === 'Mayabeque') setDeliveryMunicipality('Bejucal');
                  }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1A2421]/70">Municipio</label>
                <CustomSelect
                  options={
                    deliveryProvince === 'La Habana'
                      ? habanaMunicipios
                      : deliveryProvince === 'Artemisa'
                      ? artemisaMunicipios
                      : mayabequeMunicipios
                  }
                  value={deliveryMunicipality}
                  onChange={setDeliveryMunicipality}
                />
              </div>

              <InteractiveHoverButton
                onClick={() => setShowZoneModal(false)}
                className="w-full text-sm mt-2"
              >
                Confirmar Zona de Envío
              </InteractiveHoverButton>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar Panel */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] bg-[#1A2421]/20 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white/95 backdrop-blur-md border-l border-[#40916C]/10 shadow-2xl p-6 flex flex-col justify-between">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-[#40916C]/10">
                <h3 className="text-lg font-bold text-[#1A2421] flex items-center gap-2">
                  <ShoppingCart size={18} className="text-[#40916C]" />
                  Detalle del Carrito
                </h3>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-[#1A2421]/60 hover:text-[#1A2421] p-1 rounded-full hover:bg-[#40916C]/10 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingCart size={36} className="text-[#40916C]/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-[#40916C]/60">Tu carrito está vacío.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.product.id} className="p-3 bg-[#FFFFFF]/40 border border-[#40916C]/10 rounded-2xl flex justify-between items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1A2421] truncate">{item.product.name}</p>
                        <p className="text-xs text-[#1A2421]/60 font-semibold">${item.product.price.toFixed(2)} / libra</p>
                      </div>
                      
                      {/* Quantity selector */}
                      <div className="flex items-center gap-2.5 bg-white/80 px-2 py-1 rounded-xl border border-[#40916C]/15">
                        <button 
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="font-bold text-[#1A2421] hover:text-[#2D6A4F] px-1 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-[#1A2421] min-w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className="font-bold text-[#1A2421] hover:text-[#2D6A4F] px-1 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-[#1A2421]">${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Stripe Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-[#40916C]/10 pt-4 flex flex-col gap-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-[#1A2421]/70">Subtotal:</span>
                  <span className="text-2xl font-extrabold text-[#1A2421]">${totalCartPrice.toFixed(2)}</span>
                </div>

                {checkoutError && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 p-2.5 rounded-xl">{checkoutError}</p>
                )}

                <div className="bg-[#FFFFFF] p-3 rounded-2xl border border-[#40916C]/10 text-xs flex flex-col gap-2">
                  <p className="font-bold text-[#40916C] flex items-center gap-1.5"><CreditCard size={14} /> Método de Pago (Stripe 1-Clic)</p>
                  <div className="flex justify-between text-[#1A2421]/70 font-semibold">
                    <span>Tarjeta Guardada:</span>
                    <span>Visa terminada en •••• 4242</span>
                  </div>
                  {activeFamily ? (
                    <div className="flex justify-between text-[#1A2421]/70 font-semibold truncate">
                      <span>Destinatario en Cuba:</span>
                      <span className="font-bold text-[#40916C]">{activeFamily.nickname}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        setShowOnboarding(true);
                      }}
                      className="text-[#2D6A4F] font-bold hover:underline text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-1"><AlertTriangle size={14} className="text-amber-600" /> Asignar recibidor en Cuba</span>
                    </button>
                  )}
                </div>

                <InteractiveHoverButton
                  onClick={handleCheckout}
                  disabled={!selectedFamilyId}
                  className="w-full text-sm"
                >
                  Pagar en 1-Clic con Stripe
                </InteractiveHoverButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barra de Carrito Fija en Móvil (solo si hay items y el carrito no está abierto) */}
      {cart.length > 0 && !isCartOpen && (
        <div 
          id="mobile-cart-banner"
          className={`fixed bottom-[88px] left-4 right-4 z-40 bg-white/90 backdrop-blur-md border border-[#40916C]/15 p-4 flex justify-between items-center shadow-lg rounded-3xl animate-slide-up md:hidden max-w-[420px] mx-auto ${
            isCartPopping ? 'animate-cart-pop' : ''
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#40916C] uppercase tracking-wider">Tu Carrito</span>
            <span className="text-base font-extrabold text-[#1A2421]">${totalCartPrice.toFixed(2)}</span>
            <span className="text-[10px] text-[#1A2421]/60 font-semibold">{cart.reduce((sum, i) => sum + i.quantity, 0)} lbs en total</span>
          </div>
          <InteractiveHoverButton
            onClick={() => setIsCartOpen(true)}
            className="text-xs"
          >
            Ver Carrito & Pagar
          </InteractiveHoverButton>
        </div>
      )}

      {/* CHATBOT EMERGENTE: Widget de IA */}
      {isAiWidgetOpen && (
        <div 
          className={`fixed right-4 sm:right-6 z-[100] w-[calc(100vw-32px)] sm:w-[360px] h-[450px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-[#2D6A4F]/20 flex flex-col justify-between overflow-hidden animate-slide-up ${
            cart.length > 0 && !isCartOpen 
              ? 'bottom-[164px] md:bottom-6' 
              : 'bottom-[88px] md:bottom-6'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] text-white p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-white" />
              <div>
                <h4 className="font-extrabold text-xs">Asistente Al Campestre</h4>
                <p className="text-[9px] text-white/80 font-semibold">Te ayuda a armar tu envío con IA</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAiWidgetOpen(false)}
              className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {aiMessages.map(msg => (
              <div 
                key={msg.id}
                className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                <div className={`p-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-inner ${
                  msg.sender === 'user' 
                    ? 'bg-[#2D6A4F] text-white rounded-tr-none' 
                    : 'bg-[#FFFFFF] text-[#1A2421] border border-[#40916C]/10 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {aiIsTyping && (
              <div className="flex gap-2 self-start max-w-[85%]">
                <div className="p-3 rounded-2xl bg-[#FFFFFF] text-[#1A2421] border border-[#40916C]/10 rounded-tl-none flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-[#2D6A4F] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#2D6A4F] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#2D6A4F] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={widgetEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendAiMessage} className="p-3 border-t border-[#40916C]/10 bg-[#FFFFFF]/40 flex gap-2">
            <input
              type="text"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="Ej: Mándale 5 lbs de cerdo a mamá..."
              className="flex-1 glass-input focus:bg-white text-xs py-2 px-3"
              disabled={aiIsTyping}
            />
            <button
              type="submit"
              disabled={aiIsTyping || !aiInput.trim()}
              className="glass-button-primary px-3 py-2 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Portal de elementos volando hacia el carrito */}
      {flyingItems.map(item => (
        <div
          key={item.id}
          className="fixed z-50 pointer-events-none animate-fly-to-cart"
          style={{
            left: item.x - 20,
            top: item.y - 20,
            width: 40,
            height: 40,
            '--target-x': `${item.tx}px`,
            '--target-y': `${item.ty}px`,
          } as React.CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.img}
            alt=""
            className="w-full h-full object-cover rounded-full border-2 border-[#2D6A4F] shadow-md"
          />
        </div>
      ))}

    </div>
  );
}
