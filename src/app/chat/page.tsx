'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getProducts, getFamilies, createOrderWithStockCheck, Product, Family, Order } from '@/lib/dbMock';
import { Send, Sparkles, ShoppingCart, User, Check, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface CartProposalItem {
  product: Product;
  quantity: number;
}

export default function ChatCommerce() {
  const [products, setProducts] = useState<Product[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cartProposal, setCartProposal] = useState<CartProposalItem[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [orderCreated, setOrderCreated] = useState<Order | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProducts(getProducts());
    const fams = getFamilies();
    setFamilies(fams);
    if (fams.length > 0) {
      setSelectedFamily(fams[0]); // default
    }

    setMessages([
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: '¡Hola! Soy el asistente inteligente de Restaurant Al Campestre. Estoy aquí para ayudarte a armar tu paquete de envíos a Cuba de forma rápida y sencilla. \n\nEscríbeme lo que deseas mandar en lenguaje natural. Por ejemplo:\n"Mándale a mi mamá 10 libras de arroz, 5 de carne de cerdo y 2 botellas de aceite."',
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const query = inputText.toLowerCase();
    setInputText('');
    setIsTyping(true);
    setCheckoutError('');

    // Simulate AI parsing after a delay
    setTimeout(() => {
      setIsTyping(false);
      processQuery(query);
    }, 1200);
  };

  const processQuery = (query: string) => {
    // 1. Detect relative/receiver
    let matchedFamily = selectedFamily;
    
    // Scan family list
    for (const fam of families) {
      const nick = fam.nickname.toLowerCase();
      const name = fam.full_name.toLowerCase();
      // If prompt says "mamá", "abuela", "leonor", etc.
      if (query.includes(nick) || query.includes(name.split(' ')[0]) || (query.includes('mamá') && nick.includes('mamá')) || (query.includes('abuela') && nick.includes('abuela'))) {
        matchedFamily = fam;
        break;
      }
    }
    
    if (matchedFamily && matchedFamily.id !== selectedFamily?.id) {
      setSelectedFamily(matchedFamily);
    }

    // 2. Parse items and quantities
    // Keywords matching dictionary mapping to product IDs
    const dictionary = [
      { keys: ['cerdo', 'puerco', 'lomo', 'carne'], id: 'prod-1' },
      { keys: ['arroz', 'grano'], id: 'prod-2' },
      { keys: ['frijoles', 'caraotas', 'judias', 'negros'], id: 'prod-3' },
      { keys: ['aceite', 'girasol', 'cocina'], id: 'prod-4' },
      { keys: ['leche', 'polvo'], id: 'prod-5' },
      { keys: ['pollo', 'gallina', 'muslos'], id: 'prod-6' }
    ];

    const detectedItems: CartProposalItem[] = [...cartProposal];
    let matchedAny = false;

    // A simple regex to find numbers and words
    // Match structure like: 10 libras de arroz, 5 de lomo, 3 de aceite, 1 bolsa de leche, 2 pollos, etc.
    // Try to find numbers followed by potential product keywords
    const regex = /(\d+)\s*(?:libras|libra|kg|kilogramos|kilos|kilo|paquetes|paquete|botellas|botella|unidades|unidad|bolsas|bolsa|de)?\s+([a-záéíóúñ\s]+?)(?=\d+|$|,|y\s+\d+|a\s+mi|\.)/gi;
    
    let match;
    const cleanQuery = query.replace(/a mi (mamá|abuela|tia|hermano|papa)/g, ''); // avoid parsing relationship as product
    
    while ((match = regex.exec(cleanQuery)) !== null) {
      const quantity = parseInt(match[1]);
      const productTerm = match[2].trim().toLowerCase();
      
      // Try to match productTerm to our dictionary keys
      const matchedDict = dictionary.find(item => 
        item.keys.some(key => productTerm.includes(key))
      );

      if (matchedDict) {
        const prod = products.find(p => p.id === matchedDict.id);
        if (prod) {
          matchedAny = true;
          // Check if already in proposal, then sum or overwrite
          const existingIndex = detectedItems.findIndex(item => item.product.id === prod.id);
          if (existingIndex >= 0) {
            detectedItems[existingIndex].quantity = quantity;
          } else {
            detectedItems.push({ product: prod, quantity });
          }
        }
      }
    }

    // Fallback: search key directly if regex didn't extract quantity
    if (!matchedAny) {
      dictionary.forEach(item => {
        const hasKey = item.keys.some(key => query.includes(key));
        if (hasKey) {
          const prod = products.find(p => p.id === item.id);
          if (prod) {
            // default quantity = 2
            const existingIndex = detectedItems.findIndex(i => i.product.id === prod.id);
            if (existingIndex < 0) {
              detectedItems.push({ product: prod, quantity: 2 });
              matchedAny = true;
            }
          }
        }
      });
    }

    setCartProposal(detectedItems);

    let botResponse = '';
    if (matchedAny) {
      botResponse = `Entendido. He procesado tu solicitud. He configurado un paquete para **${matchedFamily?.nickname || 'tu familiar'}**.\n\n`;
      if (matchedFamily && matchedFamily.id !== selectedFamily?.id) {
        botResponse += `✓ Cambié el destinatario de entrega a **${matchedFamily.full_name}** (${matchedFamily.nickname}).\n`;
      }
      botResponse += 'Por favor, revisa el cuadro de **"Paquete Propuesto"** a la derecha y haz clic en "Pagar con 1-Clic" para cerrar el pedido.';
    } else {
      botResponse = 'No logré identificar claramente los productos o cantidades en tu mensaje. \n\nPor favor, prueba escribir algo como: \n*"Quiero mandarle a mi mamá 5 libras de carne de cerdo y 10 de arroz"*';
    }

    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      sender: 'bot',
      text: botResponse,
      timestamp: new Date()
    }]);
  };

  const handleProposalCheckout = () => {
    if (!selectedFamily) {
      setCheckoutError('Por favor registra o selecciona un familiar recibidor.');
      return;
    }
    if (cartProposal.length === 0) {
      setCheckoutError('El paquete propuesto está vacío.');
      return;
    }

    setCheckoutError('');
    const items = cartProposal.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    const result = createOrderWithStockCheck(items, selectedFamily.id, 'Miguel Ángel (Miami)');

    if (result.success && result.order) {
      setOrderCreated(result.order);
      setCartProposal([]);
      // Add success bot message
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: `🎉 ¡Felicidades! He completado tu orden **${result.order?.id}** por un total de **$${result.order?.total_amount.toFixed(2)}**. Los productos han sido reservados atómicamente y el repartidor será asignado a la brevedad.`,
        timestamp: new Date()
      }]);
    } else {
      setCheckoutError(result.error || 'Error al validar el inventario.');
    }
  };

  const clearProposal = () => {
    setCartProposal([]);
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      sender: 'bot',
      text: 'He limpiado la propuesta. ¿Qué te gustaría enviar ahora?',
      timestamp: new Date()
    }]);
  };

  const totalAmount = cartProposal.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="flex-1 flex flex-col gap-4 max-h-[85vh]">
      
      <div className="flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <div>
          <h1 className="text-xl font-extrabold text-emerald-950">Comercio Conversacional IA</h1>
          <p className="text-xs text-emerald-950/60 font-semibold">Simulación de Chatbot + pgvector para emparejamiento semántico</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Chat Window */}
        <div className="lg:col-span-2 glass-panel flex flex-col justify-between overflow-hidden h-[68vh] bg-white/70">
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map(msg => (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm ${
                  msg.sender === 'user' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {msg.sender === 'user' ? 'ME' : 'AI'}
                </div>
                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-inner ${
                  msg.sender === 'user' 
                    ? 'bg-emerald-500 text-white rounded-tr-none' 
                    : 'bg-white/90 text-emerald-950 border border-emerald-500/10 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 self-start max-w-[85%]">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold shadow-sm">
                  AI
                </div>
                <div className="p-4 rounded-2xl bg-white/90 text-emerald-950 border border-emerald-500/10 rounded-tl-none flex gap-1.5 items-center">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-emerald-500/10 bg-white/30 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Escribe lo que quieres enviar (Ej: manda 10 libras de arroz a mi abuela)..."
              className="flex-1 glass-input focus:bg-white text-sm"
              disabled={isTyping || !!orderCreated}
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim() || !!orderCreated}
              className="glass-button-primary px-4 py-2.5 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </form>

        </div>

        {/* AI Proposal Drawer */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-[68vh]">
          
          <div className="glass-panel p-5 bg-gradient-to-b from-white/90 to-emerald-500/5 flex flex-col justify-between h-full border-emerald-500/20">
            
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-emerald-500/10 mb-4">
                <h3 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-500 animate-spin" style={{ animationDuration: '4s' }} />
                  Paquete Propuesto (IA)
                </h3>
                {cartProposal.length > 0 && (
                  <button 
                    onClick={clearProposal}
                    className="text-xs font-bold text-emerald-950/60 hover:text-red-500 flex items-center gap-1"
                  >
                    <RefreshCw size={10} />
                    Limpiar
                  </button>
                )}
              </div>

              {/* Destination selector inside proposal */}
              <div className="bg-white/60 p-3 rounded-2xl border border-emerald-500/10 flex flex-col gap-1 mb-4 text-xs">
                <span className="font-bold text-emerald-900/60">Destinatario Cuba (Vinculado por IA):</span>
                {selectedFamily ? (
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <p className="font-bold text-emerald-950">{selectedFamily.nickname}</p>
                      <p className="text-emerald-950/60">{selectedFamily.full_name}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                      Detectado
                    </span>
                  </div>
                ) : (
                  <span className="text-amber-600 font-semibold">Crea un familiar en la pestaña Inicio para enlazar</span>
                )}
              </div>

              {/* Items in proposal */}
              {cartProposal.length === 0 ? (
                <div className="text-center py-12 bg-white/20 rounded-2xl border border-dashed border-emerald-500/10">
                  <p className="text-2xl mb-2">🍽️</p>
                  <p className="text-xs font-semibold text-emerald-950/50 leading-relaxed max-w-[200px] mx-auto">
                    El chatbot agregará los productos aquí en tiempo real cuando describas lo que deseas.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[25vh] overflow-y-auto pr-1">
                  {cartProposal.map(item => (
                    <div key={item.product.id} className="p-2.5 bg-white/50 border border-emerald-500/5 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-emerald-950">{item.product.name}</p>
                        <p className="text-emerald-950/60">${item.product.price.toFixed(2)} x {item.quantity}</p>
                      </div>
                      <span className="font-extrabold text-emerald-950">${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Proposal CTA */}
            {cartProposal.length > 0 && (
              <div className="border-t border-emerald-500/10 pt-4 flex flex-col gap-3">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-emerald-950/60">Importe Total:</span>
                  <span className="text-xl font-extrabold text-emerald-950">${totalAmount.toFixed(2)}</span>
                </div>

                {checkoutError && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 p-2.5 rounded-xl">{checkoutError}</p>
                )}

                <div className="bg-emerald-50 text-[10px] p-2.5 rounded-xl border border-emerald-500/10 flex gap-2 items-start">
                  <Check size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-emerald-950/70">
                    Pagar con tarjeta guardada (Stripe) y descontar stock automáticamente.
                  </p>
                </div>

                <button
                  onClick={handleProposalCheckout}
                  disabled={!selectedFamily || orderCreated !== null}
                  className={`w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all ${
                    selectedFamily && !orderCreated
                      ? 'glass-button-primary cursor-pointer'
                      : 'bg-emerald-950/5 text-emerald-950/40 border border-emerald-950/10 cursor-not-allowed'
                  }`}
                >
                  Confirmar y Pagar ${totalAmount.toFixed(2)}
                </button>
              </div>
            )}

            {orderCreated && (
              <div className="bg-emerald-500/10 border border-emerald-500 p-4 rounded-2xl text-center flex flex-col gap-2">
                <p className="text-xs font-bold text-emerald-950">¡Orden Procesada Correctamente!</p>
                <p className="text-base font-extrabold text-emerald-700">{orderCreated.id}</p>
                <Link
                  href="/"
                  className="text-xs font-extrabold text-emerald-600 hover:underline flex items-center justify-center gap-1"
                >
                  Ver en mi lista de órdenes →
                </Link>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
