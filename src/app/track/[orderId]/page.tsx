'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getOrders, getDrivers, checkDriverReturnStatus, Order, Driver, getReturnTimeForZone } from '@/lib/dbMock';
import { Truck, MapPin, CheckCircle, AlertTriangle, MessageSquare, Clipboard, Calendar, Clock, RefreshCw } from 'lucide-react';
import NavigationHeader from '@/components/NavigationHeader';

const coordinates: Record<string, { x: number; y: number }> = {
  'Base': { x: 150, y: 110 },
  'Plaza de la Revolución': { x: 190, y: 70 },
  'Playa': { x: 100, y: 60 },
  'Centro Habana': { x: 210, y: 60 },
  'Habana Vieja': { x: 230, y: 70 },
  'Boyeros': { x: 140, y: 160 },
  'San Antonio de los Baños': { x: 40, y: 160 },
  'Bauta': { x: 50, y: 90 },
  'Bejucal': { x: 130, y: 200 },
  'San José de las Lajas': { x: 250, y: 190 },
};

export default function TrackOrder() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0); // 0 to 100
  const [truckPos, setTruckPos] = useState({ x: 150, y: 110 });

  const loadData = async () => {
    try {
      await checkDriverReturnStatus();
      const [ords, drvs] = await Promise.all([getOrders(), getDrivers()]);
      const foundOrder = ords.find(o => o.id === orderId);
      
      if (!foundOrder) {
        setError('El código de pedido ingresado no existe en nuestro sistema.');
        return;
      }

      setOrder(foundOrder);
      setError('');

      if (foundOrder.delivery_id) {
        const foundDriver = drvs.find(d => d.id === foundOrder.delivery_id);
        setDriver(foundDriver || null);

        // Calculate progress for Map Animation
        if (foundOrder.status === 'in_transit') {
          // In transit: simulation progresses from base to destination
          // Let's mock a progress curve based on seconds since it was updated (ETA of route is typically 25-100s)
          const updatedTime = new Date(foundOrder.updated_at).getTime();
          const elapsed = (Date.now() - updatedTime) / 1000;
          const address = foundOrder.family_address || '';
          const parts = address.split(',');
          const municipality = parts.length > 1 ? parts[parts.length - 2].trim() : 'Plaza de la Revolución';
          const totalDuration = getReturnTimeForZone(municipality); // accelerated seconds

          const pct = Math.min(100, (elapsed / totalDuration) * 100);
          setProgress(pct);
        } else if (foundOrder.status === 'delivered' && foundOrder.delivery_eta_return) {
          // Delivered / Returning: progresses from destination back to base
          const etaTime = new Date(foundOrder.delivery_eta_return).getTime();
          const address = foundOrder.family_address || '';
          const parts = address.split(',');
          const municipality = parts.length > 1 ? parts[parts.length - 2].trim() : 'Plaza de la Revolución';
          const totalDuration = getReturnTimeForZone(municipality) * 1000; // ms
          const remaining = etaTime - Date.now();
          
          const elapsed = totalDuration - remaining;
          const pct = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
          setProgress(100 - pct); // Returning to base (100% -> 0%)
        } else if (foundOrder.status === 'delivered') {
          setProgress(100);
        } else {
          setProgress(0);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al obtener la información.');
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1000); // 1-second refresh for smooth updates
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    const address = order.family_address || '';
    const parts = address.split(',');
    const municipality = parts.length > 1 ? parts[parts.length - 2].trim() : 'Plaza de la Revolución';
    
    const baseCoord = coordinates['Base'];
    const destCoord = coordinates[municipality] || coordinates['Plaza de la Revolución'];

    if (order.status === 'in_transit') {
      const x = baseCoord.x + (destCoord.x - baseCoord.x) * (progress / 100);
      const y = baseCoord.y + (destCoord.y - baseCoord.y) * (progress / 100);
      setTruckPos({ x, y });
    } else if (order.status === 'delivered' && order.delivery_eta_return && driver?.status === 'En Retorno') {
      // Returning path (from destCoord back to baseCoord)
      const x = destCoord.x + (baseCoord.x - destCoord.x) * ((100 - progress) / 100);
      const y = destCoord.y + (baseCoord.y - destCoord.y) * ((100 - progress) / 100);
      setTruckPos({ x, y });
    } else if (order.status === 'delivered') {
      setTruckPos(destCoord);
    } else {
      setTruckPos(baseCoord);
    }
  }, [progress, order, driver]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <NavigationHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="glass-panel p-8 max-w-md w-full bg-white/95 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <h1 className="text-lg font-extrabold text-[#1A2421]">Pedido No Encontrado</h1>
            <p className="text-xs text-[#1A2421]/60">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="glass-button-primary w-full py-2.5 text-xs cursor-pointer"
            >
              Volver a la Tienda
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <NavigationHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2D6A4F]">
            <RefreshCw size={16} className="animate-spin" />
            Cargando estado de seguimiento...
          </div>
        </main>
      </div>
    );
  }

  const address = order.family_address || '';
  const parts = address.split(',');
  const municipality = parts.length > 1 ? parts[parts.length - 2].trim() : 'Plaza de la Revolución';
  const destCoord = coordinates[municipality] || coordinates['Plaza de la Revolución'];

  // Tracking steps
  const steps = [
    { label: 'Recibido', active: order.status !== 'pending', current: order.status === 'paid' },
    { label: 'Preparado', active: ['assigned', 'in_transit', 'delivered', 'incident'].includes(order.status), current: order.status === 'assigned' },
    { label: 'En Camino', active: ['in_transit', 'delivered', 'incident'].includes(order.status), current: order.status === 'in_transit' },
    { label: 'Entregado', active: order.status === 'delivered', current: order.status === 'delivered', failed: order.status === 'incident' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-10">
      <NavigationHeader />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 mt-6 flex flex-col gap-6">
        
        {/* Info Cabecera */}
        <div className="glass-panel p-5 bg-white/90 border-[#40916C]/10 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold text-[#2D6A4F] bg-[#2D6A4F]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Seguimiento de Envíos Cuba
            </span>
            <h1 className="text-xl font-extrabold text-[#1A2421] mt-2">Orden: {order.id}</h1>
            <p className="text-[11px] text-[#1A2421]/60 font-semibold flex items-center gap-1.5 mt-1">
              <Calendar size={12} />
              <span>Realizado el: {new Date(order.created_at).toLocaleString()}</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:items-end justify-center">
            <span className="text-[10px] text-[#1A2421]/50 uppercase tracking-wider font-bold">Estado del Envío</span>
            <span className={`text-sm font-extrabold px-3 py-1.5 rounded-2xl border mt-1 inline-block text-center ${
              order.status === 'delivered'
                ? 'bg-green-50 text-green-700 border-green-200'
                : order.status === 'in_transit'
                ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                : order.status === 'incident'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-white text-[#2D6A4F] border-[#40916C]/10'
            }`}>
              {order.status === 'paid' && 'Preparando pedido en almacén'}
              {order.status === 'assigned' && 'Listo para despacho en base'}
              {order.status === 'in_transit' && 'Repartidor en camino a Cuba'}
              {order.status === 'delivered' && 'Entregado con éxito'}
              {order.status === 'incident' && `Reportado: ${order.incident_reason}`}
            </span>
          </div>
        </div>

        {/* Layout en 2 columnas: Tracker & Mapa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Columna Izquierda: Hitos & Datos de Destinatario */}
          <div className="flex flex-col gap-6">
            
            {/* Barra de progreso visual */}
            <div className="glass-panel p-5 bg-white/90 border-[#40916C]/10 flex flex-col gap-4">
              <h2 className="text-sm font-extrabold text-[#1A2421] flex items-center gap-1.5 pb-2 border-b border-[#1A2421]/5">
                <Clock size={16} className="text-[#2D6A4F]" /> Estado de Progreso
              </h2>
              
              <div className="flex justify-between items-center relative py-2">
                <div className="absolute left-0 right-0 h-[3px] bg-gray-100 -z-10 rounded-full" />
                <div 
                  className="absolute left-0 h-[3px] bg-[#2D6A4F] -z-10 rounded-full transition-all duration-500" 
                  style={{ 
                    width: order.status === 'delivered' ? '100%' : order.status === 'in_transit' ? '70%' : order.status === 'assigned' ? '35%' : '5%' 
                  }} 
                />

                {steps.map((st, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border shadow-sm ${
                      st.failed
                        ? 'bg-red-500 text-white border-red-600'
                        : st.current
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] scale-110 shadow-md shadow-[#2D6A4F]/25 animate-pulse'
                        : st.active
                        ? 'bg-[#E8F5E9] text-[#2D6A4F] border-[#2D6A4F]/20'
                        : 'bg-white text-gray-300 border-gray-200'
                    }`}>
                      {st.failed ? '✕' : '✓'}
                    </div>
                    <span className={`text-[10px] font-bold ${
                      st.failed
                        ? 'text-red-600'
                        : st.active
                        ? 'text-[#1A2421] font-extrabold'
                        : 'text-gray-400'
                    }`}>{st.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Datos del Familiar receptor */}
            <div className="glass-panel p-5 bg-white/90 border-[#40916C]/10 flex flex-col gap-4">
              <h2 className="text-sm font-extrabold text-[#1A2421] flex items-center gap-1.5 pb-2 border-b border-[#1A2421]/5">
                <MapPin size={16} className="text-[#2D6A4F]" /> Destinatario en Cuba
              </h2>
              
              <div className="bg-[#2D6A4F]/5 p-4 rounded-2xl border border-[#40916C]/10 text-xs flex flex-col gap-2 text-[#1A2421]/80">
                <p><strong className="text-[#1A2421]">Nombre Familiar:</strong> {order.family_name}</p>
                <p className="leading-relaxed"><strong className="text-[#1A2421]">Dirección de Entrega:</strong> {order.family_address}</p>
                <p><strong className="text-[#1A2421]">Teléfono de Contacto:</strong> {order.family_phone}</p>
              </div>

              {driver && (
                <div className="bg-[#FFFFFF]/60 p-4 rounded-2xl border border-purple-500/10 text-xs flex flex-col gap-2">
                  <p className="font-bold text-purple-800 flex items-center gap-1"><Truck size={14} /> Información del Courier:</p>
                  <p className="font-semibold text-[#1A2421]">{driver.name}</p>
                  <p className="text-[10px] text-gray-500 font-bold -mt-1">
                    {order.status === 'in_transit' && 'El repartidor está viajando a tu ubicación.'}
                    {order.status === 'delivered' && 'Pedido entregado exitosamente.'}
                  </p>
                </div>
              )}
            </div>

            {/* Ítems del Pedido */}
            <div className="glass-panel p-5 bg-white/90 border-[#40916C]/10 flex flex-col gap-3">
              <h2 className="text-sm font-extrabold text-[#1A2421] flex items-center gap-1.5 pb-2 border-b border-[#1A2421]/5">
                <Clipboard size={16} className="text-[#2D6A4F]" /> Lista de Alimentos
              </h2>
              <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs pb-1.5 border-b border-[#1A2421]/5 last:border-b-0">
                    <span className="font-semibold text-[#1A2421]">{item.productName}</span>
                    <span className="font-bold text-[#2D6A4F] bg-[#2D6A4F]/10 px-2 py-0.5 rounded-lg">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Columna Derecha: Mapa Interactivo SVG */}
          <div className="glass-panel p-5 bg-white/90 border-[#40916C]/10 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#1A2421] flex items-center gap-1.5">
                <MapPin size={16} className="text-[#2D6A4F]" /> Localización de Envío en Tiempo Real
              </h2>
              <p className="text-[10px] text-gray-500 font-bold mt-1">Ubicación del courier simulada dinámicamente</p>
            </div>

            {/* Canvas SVG del Mapa de Cuba */}
            <div className="w-full bg-[#1A2421]/5 border border-[#40916C]/15 rounded-3xl overflow-hidden shadow-inner relative flex justify-center items-center py-4 bg-gradient-to-b from-slate-100 to-slate-200">
              <svg width="300" height="240" className="w-full h-auto select-none" viewBox="0 0 300 240">
                {/* Background terrain or path grid */}
                <rect x="0" y="0" width="300" height="240" fill="none" />
                
                {/* Dotted paths from base to destinations */}
                {Object.keys(coordinates).map(key => {
                  if (key === 'Base') return null;
                  const target = coordinates[key];
                  const base = coordinates['Base'];
                  const isActivePath = order.status === 'in_transit' && key === municipality;
                  
                  return (
                    <line
                      key={`line-${key}`}
                      x1={base.x}
                      y1={base.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isActivePath ? '#2D6A4F' : '#2D6A4F'}
                      strokeWidth={isActivePath ? 2.5 : 1}
                      strokeOpacity={isActivePath ? 0.8 : 0.15}
                      strokeDasharray={isActivePath ? '5,5' : '3,3'}
                    />
                  );
                })}

                {/* Nodes markers */}
                {Object.keys(coordinates).map(key => {
                  const coord = coordinates[key];
                  const isBase = key === 'Base';
                  const isTarget = key === municipality;
                  
                  return (
                    <g key={`node-${key}`}>
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={isBase ? 6 : isTarget ? 5 : 3.5}
                        fill={isBase ? '#1B4332' : isTarget ? '#2D6A4F' : '#FFFFFF'}
                        stroke={isBase ? '#FFFFFF' : '#2D6A4F'}
                        strokeWidth={1.5}
                        strokeOpacity={isBase || isTarget ? 1 : 0.4}
                        fillOpacity={isBase || isTarget ? 1 : 0.6}
                      />
                      <text
                        x={coord.x}
                        y={coord.y - 8}
                        textAnchor="middle"
                        fontSize={isBase ? '9px' : isTarget ? '8.5px' : '7.5px'}
                        fontWeight={isBase || isTarget ? 'bold' : 'normal'}
                        fill={isBase ? '#1B4332' : isTarget ? '#2D6A4F' : '#1A2421'}
                        fillOpacity={isBase || isTarget ? 1 : 0.35}
                        className="pointer-events-none"
                      >
                        {isBase ? 'Restaurante Base' : key}
                      </text>
                    </g>
                  );
                })}

                {/* Truck Marker (only shown when in transit or delivered but returning) */}
                {order.status === 'in_transit' || (order.status === 'delivered' && order.delivery_eta_return && driver?.status === 'En Retorno') ? (
                  <g className="transition-all duration-300">
                    {/* Ripple/Pulse effect around the truck */}
                    <circle
                      cx={truckPos.x}
                      cy={truckPos.y}
                      r="12"
                      fill="#2D6A4F"
                      fillOpacity="0.15"
                      className="animate-ping"
                    />
                    <circle
                      cx={truckPos.x}
                      cy={truckPos.y}
                      r="7"
                      fill={order.status === 'delivered' ? '#6B21A8' : '#2D6A4F'}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      shadow-md="true"
                    />
                  </g>
                ) : null}
              </svg>
              
              {/* Leyenda flotante */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/80 backdrop-blur-xs border border-[#40916C]/10 rounded-xl p-2 text-[9px] font-semibold text-[#1A2421]/70 flex justify-between gap-2 shadow-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1B4332]" /> Base Al Campestre</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2D6A4F]" /> Repartidor (Ruta)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#6B21A8]" /> Repartidor (Retorno)</span>
              </div>
            </div>

            {/* Simulación del progreso de viaje */}
            {(order.status === 'in_transit' || (order.status === 'delivered' && order.delivery_eta_return && driver?.status === 'En Retorno')) && (
              <div className="bg-[#2D6A4F]/5 p-4 rounded-2xl border border-[#40916C]/10 text-xs flex flex-col gap-2">
                <div className="flex justify-between items-center font-bold">
                  <span className={order.status === 'delivered' ? 'text-purple-800' : 'text-[#2D6A4F]'}>
                    {order.status === 'delivered' ? 'Regresando a base' : 'En camino al destinatario'}
                  </span>
                  <span>{Math.round(progress)}% de avance</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      order.status === 'delivered' ? 'bg-purple-600' : 'bg-[#2D6A4F]'
                    }`}
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
