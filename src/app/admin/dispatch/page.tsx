'use client';

import React, { useState, useEffect } from 'react';
import { 
  getOrders, 
  getDrivers, 
  assignOrderToDriver, 
  checkDriverReturnStatus, 
  Order, 
  Driver,
  getReturnTimeForZone
} from '@/lib/dbMock';
import { Truck, UserCheck, Clock, CheckCircle, MessageCircle, X, MapPin } from 'lucide-react';
import { CustomSelect } from "@/components/ui/custom-select";

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

export default function AdminDispatch() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeTab, setActiveTab] = useState<'disponibles' | 'en_ruta' | 'en_retorno'>('disponibles');

  interface WhatsAppToast {
    id: string;
    phone: string;
    name: string;
    message: string;
    timestamp: string;
  }
  const [toasts, setToasts] = useState<WhatsAppToast[]>([]);

  const triggerToast = (phone: string, name: string, message: string, orderId: string) => {
    const newToast: WhatsAppToast = {
      id: `${orderId}-${Date.now()}`,
      phone,
      name,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setToasts(prev => [newToast, ...prev].slice(0, 5));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 6000);
  };

  const loadData = async () => {
    try {
      await checkDriverReturnStatus();
      const [ords, drvs] = await Promise.all([
        getOrders(),
        getDrivers()
      ]);
      
      setOrders(prevOrders => {
        if (prevOrders.length > 0) {
          ords.forEach(newOrder => {
            const oldOrder = prevOrders.find(o => o.id === newOrder.id);
            if (oldOrder && oldOrder.status !== newOrder.status) {
              if (newOrder.status === 'in_transit') {
                triggerToast(
                  newOrder.family_phone,
                  newOrder.family_name,
                  `¡Hola! Su pedido de Restaurant Al Campestre está en camino con nuestro repartidor ${newOrder.delivery_name || 'asignado'}. Prepárese para recibirlo.`,
                  newOrder.id
                );
              } else if (newOrder.status === 'delivered') {
                triggerToast(
                  newOrder.family_phone,
                  newOrder.family_name,
                  `¡Hola! Su pedido ${newOrder.id} ha sido entregado exitosamente. ¡Gracias por confiar en Restaurant Al Campestre!`,
                  newOrder.id
                );
              }
            }
          });
        }
        return ords;
      });
      setDrivers(drvs);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    if (!driverId) return;
    const success = await assignOrderToDriver(orderId, driverId);
    if (success) {
      await loadData();
      alert(`¡Pedido ${orderId} despachado con éxito! Repartidor asignado.`);
    } else {
      alert('No se pudo asignar el repartidor.');
    }
  };

  const pendingDispatchOrders = orders.filter(o => o.status === 'paid');
  
  const availableDrivers = drivers.filter(d => d.status === 'Disponible');
  const enRutaDrivers = drivers.filter(d => d.status === 'En Ruta');
  const enRetornoDrivers = drivers.filter(d => d.status === 'En Retorno');

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getRemainingSeconds = (isoString: string | null) => {
    if (!isoString) return 0;
    const diff = new Date(isoString).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 1000));
  };

  const getActiveDriverPositions = () => {
    return drivers
      .map(driver => {
        if (driver.status === 'Disponible') return null;

        const baseCoord = coordinates['Base'];
        let destCoord = coordinates['Plaza de la Revolución'];
        let progressPct = 0;
        let municipality = 'Plaza de la Revolución';
        let orderId = '';
        let targetName = '';

        if (driver.status === 'En Ruta' && driver.active_order_id) {
          const order = orders.find(o => o.id === driver.active_order_id);
          if (order) {
            orderId = order.id;
            targetName = order.family_name;
            const address = order.family_address || '';
            const parts = address.split(',');
            municipality = parts.length > 1 ? parts[parts.length - 2].trim() : 'Plaza de la Revolución';
            destCoord = coordinates[municipality] || coordinates['Plaza de la Revolución'];

            const updatedTime = new Date(order.updated_at).getTime();
            const elapsed = (Date.now() - updatedTime) / 1000;
            const totalDuration = getReturnTimeForZone(municipality);
            progressPct = Math.min(100, (elapsed / totalDuration) * 100);
            
            const x = baseCoord.x + (destCoord.x - baseCoord.x) * (progressPct / 100);
            const y = baseCoord.y + (destCoord.y - baseCoord.y) * (progressPct / 100);
            return {
              driverId: driver.id,
              driverName: driver.name,
              status: 'En Ruta',
              x,
              y,
              progressPct,
              municipality,
              orderId,
              targetName
            };
          }
        } else if (driver.status === 'En Retorno' && driver.return_eta) {
          const lastOrder = orders.find(o => o.delivery_id === driver.id && o.status === 'delivered');
          if (lastOrder) {
            orderId = lastOrder.id;
            targetName = lastOrder.family_name;
            const address = lastOrder.family_address || '';
            const parts = address.split(',');
            municipality = parts.length > 1 ? parts[parts.length - 2].trim() : 'Plaza de la Revolución';
            destCoord = coordinates[municipality] || coordinates['Plaza de la Revolución'];
          }

          const etaTime = new Date(driver.return_eta).getTime();
          const totalDuration = getReturnTimeForZone(municipality) * 1000;
          const remaining = etaTime - Date.now();
          const elapsed = totalDuration - remaining;
          const pct = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
          progressPct = 100 - pct;
          
          const x = destCoord.x + (baseCoord.x - destCoord.x) * (pct / 100);
          const y = destCoord.y + (baseCoord.y - destCoord.y) * (pct / 100);
          return {
            driverId: driver.id,
            driverName: driver.name,
            status: 'En Retorno',
            x,
            y,
            progressPct: pct,
            municipality,
            orderId,
            targetName
          };
        }
        return null;
      })
      .filter((pos): pos is NonNullable<typeof pos> => pos !== null);
  };

  const activePositions = getActiveDriverPositions();

  const RouteSimulatorMap = () => (
    <div className="glass-panel p-5 bg-white/90 border-[#40916C]/10 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-extrabold text-[#1A2421] flex items-center gap-1.5">
          <MapPin size={16} className="text-[#2D6A4F]" />
          Monitoreo de Envíos en Tiempo Real
        </h2>
        <p className="text-[10px] text-gray-500 font-bold mt-1">Ubicación de toda la flota en La Habana y Artemisa</p>
      </div>

      <div className="w-full bg-[#1A2421]/5 border border-[#40916C]/15 rounded-3xl overflow-hidden shadow-inner relative flex justify-center items-center py-4 bg-gradient-to-b from-slate-100 to-slate-200">
        <svg width="300" height="240" className="w-full h-auto select-none" viewBox="0 0 300 240">
          <rect x="0" y="0" width="300" height="240" fill="none" />
          
          {Object.keys(coordinates).map(key => {
            if (key === 'Base') return null;
            const target = coordinates[key];
            const base = coordinates['Base'];
            const isPathActive = activePositions.some(pos => pos.municipality === key);
            
            return (
              <line
                key={`line-${key}`}
                x1={base.x}
                y1={base.y}
                x2={target.x}
                y2={target.y}
                stroke="#2D6A4F"
                strokeWidth={isPathActive ? 2.5 : 1}
                strokeOpacity={isPathActive ? 0.8 : 0.15}
                strokeDasharray={isPathActive ? '5,5' : '3,3'}
              />
            );
          })}

          {Object.keys(coordinates).map(key => {
            const coord = coordinates[key];
            const isBase = key === 'Base';
            const isTarget = activePositions.some(pos => pos.municipality === key);
            
            return (
              <g key={`node-${key}`}>
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isBase ? 6 : isTarget ? 5 : 3.5}
                  fill={isBase ? '#1B4332' : isTarget ? '#2D6A4F' : '#FFFFFF'}
                  stroke="#2D6A4F"
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

          {activePositions.map(pos => (
            <g key={`driver-marker-${pos.driverId}`} className="transition-all duration-300">
              <circle
                cx={pos.x}
                cy={pos.y}
                r="12"
                fill={pos.status === 'En Retorno' ? '#6B21A8' : '#2D6A4F'}
                fillOpacity="0.15"
                className="animate-ping"
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={7}
                fill={pos.status === 'En Retorno' ? '#6B21A8' : '#2D6A4F'}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <text
                x={pos.x}
                y={pos.y + 16}
                textAnchor="middle"
                fontSize="7.5px"
                fontWeight="bold"
                fill={pos.status === 'En Retorno' ? '#6B21A8' : '#2D6A4F'}
                className="pointer-events-none bg-white/95 px-1 rounded shadow-xs font-bold"
              >
                {pos.driverName.split(' ')[0]} ({pos.status === 'En Retorno' ? 'Retorno' : 'Ruta'})
              </text>
            </g>
          ))}
        </svg>

        <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/80 backdrop-blur-xs border border-[#40916C]/10 rounded-xl p-2 text-[9px] font-semibold text-[#1A2421]/70 flex justify-between gap-2 shadow-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1B4332]" /> Base Al Campestre</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2D6A4F]" /> Repartidor (Ruta)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#6B21A8]" /> Repartidor (Retorno)</span>
        </div>
      </div>

      {activePositions.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          <h3 className="text-xs font-extrabold text-[#1A2421]">Monitoreo de Avance Individual:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activePositions.map(pos => (
              <div key={pos.driverId} className="bg-[#FFFFFF]/40 border border-[#40916C]/10 p-2.5 rounded-xl text-[10px] flex flex-col gap-1">
                <div className="flex justify-between items-center font-bold">
                  <span className={pos.status === 'En Retorno' ? 'text-purple-700' : 'text-[#2D6A4F]'}>
                    {pos.driverName.split(' ')[0]} ({pos.status === 'En Retorno' ? 'Retorno' : 'Ruta'})
                  </span>
                  <span>{Math.round(pos.progressPct)}%</span>
                </div>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      pos.status === 'En Retorno' ? 'bg-purple-600' : 'bg-[#2D6A4F]'
                    }`}
                    style={{ width: `${pos.progressPct}%` }} 
                  />
                </div>
                <div className="flex justify-between items-center text-[8px] text-gray-500 font-bold mt-0.5">
                  <span>Hacia: {pos.municipality}</span>
                  <span>Pedido: {pos.orderId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      
      {/* Pending Dispatch Section */}
      <div className="glass-panel p-5 bg-white/80 border-[#40916C]/10">
        <h2 className="text-lg font-extrabold text-[#1A2421] flex items-center gap-2 mb-3">
          <Clock size={18} className="text-[#2D6A4F]" />
          Pedidos Pendientes de Despacho ({pendingDispatchOrders.length})
        </h2>
        
        {pendingDispatchOrders.length === 0 ? (
          <div className="text-center py-6 bg-[#2D6A4F]/5 rounded-2xl border border-dashed border-[#2D6A4F]/15">
            <p className="text-xs text-[#1A2421]/60 font-semibold">No hay pedidos pagados esperando despacho.</p>
          </div>
        ) : (
          <>
            {/* Vista Escritorio: Tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#40916C]/10 text-[#1A2421]/60 font-bold">
                    <th className="py-2">Código</th>
                    <th className="py-2">Familiar Destinatario</th>
                    <th className="py-2">Dirección Cuba</th>
                    <th className="py-2">Total Pedido</th>
                    <th className="py-2 text-right">Asignar Repartidor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2421]/5">
                  {pendingDispatchOrders.map(order => (
                    <tr key={order.id} className="hover:bg-white/20 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-[#1A2421]">{order.id}</td>
                      <td className="py-2.5 font-semibold text-[#40916C]">{order.family_name}</td>
                      <td className="py-2.5 text-[#1A2421]/70 truncate max-w-[200px]">{order.family_address}</td>
                      <td className="py-2.5 font-extrabold text-[#1A2421]">${order.total_amount.toFixed(2)}</td>
                      <td className="py-2.5 text-right">
                        {availableDrivers.length === 0 ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                            Sin choferes disponibles
                          </span>
                        ) : (
                          <CustomSelect
                            options={availableDrivers.map(drv => ({ value: drv.id, label: drv.name }))}
                            value=""
                            onChange={val => handleAssignDriver(order.id, val)}
                            placeholder="-- Seleccionar Chofer --"
                            triggerClassName="text-[10px] py-1 px-2 h-7 font-bold text-[#1A2421]"
                            className="max-w-[150px] inline-block text-left"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista Móvil: Tarjetas */}
            <div className="block md:hidden flex flex-col gap-3">
              {pendingDispatchOrders.map(order => (
                <div key={order.id} className="p-3.5 bg-white/40 border border-[#40916C]/10 rounded-2xl flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center pb-1.5 border-b border-[#1A2421]/5">
                    <span className="font-mono font-bold text-[#1A2421]">{order.id}</span>
                    <span className="text-[#1A2421] font-bold">${order.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-[#1A2421]/80">
                    <p><span className="font-semibold text-[#1A2421]">Familiar:</span> {order.family_name}</p>
                    <p className="truncate"><span className="font-semibold text-[#1A2421]">Destino:</span> {order.family_address}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2 border-t border-[#1A2421]/5 pt-2">
                    <span className="font-semibold text-[10px] text-[#1A2421]/70">Asignar Repartidor:</span>
                    {availableDrivers.length === 0 ? (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        Sin choferes
                      </span>
                    ) : (
                      <CustomSelect
                        options={availableDrivers.map(drv => ({ value: drv.id, label: drv.name }))}
                        value=""
                        onChange={val => handleAssignDriver(order.id, val)}
                        placeholder="-- Elegir --"
                        triggerClassName="text-[10px] py-0.5 px-2 h-7 font-bold text-[#1A2421]"
                        className="max-w-[120px] inline-block text-left"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Drivers status board - 3 columns (Desktop) or Tabs (Mobile) */}
      <div>
        <h2 className="text-lg font-extrabold text-[#1A2421] mb-4 flex items-center gap-2">
          <Truck size={18} className="text-[#40916C]" />
          Panel de Control y Despacho
        </h2>

        {/* Vista Móvil: Selector de Pestañas (Tabs) */}
        <div className="flex md:hidden glass-track p-1 mb-4">
          <button
            onClick={() => setActiveTab('disponibles')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'disponibles'
                ? 'bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] text-white shadow-sm'
                : 'text-[#1A2421]/60'
            }`}
          >
            Disponibles ({availableDrivers.length})
          </button>
          <button
            onClick={() => setActiveTab('en_ruta')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'en_ruta'
                ? 'bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] text-white shadow-sm'
                : 'text-[#1A2421]/60'
            }`}
          >
            En Ruta ({enRutaDrivers.length})
          </button>
          <button
            onClick={() => setActiveTab('en_retorno')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'en_retorno'
                ? 'bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] text-white shadow-sm'
                : 'text-[#1A2421]/60'
            }`}
          >
            Retorno ({enRetornoDrivers.length})
          </button>
        </div>

        {/* Vista Móvil: Panel de Hitos Activo */}
        <div className="block md:hidden">
          {activeTab === 'disponibles' && (
            <div className="premium-card p-4 bg-white/90 border-[#40916C]/10 flex flex-col gap-3 min-h-[200px]">
              <h3 className="text-xs font-extrabold text-[#1A2421] pb-2 border-b border-[#1A2421]/5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                Disponibles ({availableDrivers.length})
              </h3>
              <div className="flex flex-col gap-2">
                {availableDrivers.length === 0 ? (
                  <p className="text-[10px] text-[#1A2421]/40 text-center py-8 font-semibold">No hay repartidores disponibles.</p>
                ) : (
                  availableDrivers.map(drv => (
                    <div key={drv.id} className="p-3 bg-[#FFFFFF]/40 border border-[#40916C]/10 rounded-xl flex items-center justify-between text-xs font-bold">
                      <span>{drv.name}</span>
                      <UserCheck size={16} className="text-green-500" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'en_ruta' && (
            <div className="premium-card p-4 bg-white/90 border-[#40916C]/10 flex flex-col gap-3 min-h-[200px]">
              <h3 className="text-xs font-extrabold text-[#1A2421] pb-2 border-b border-[#1A2421]/5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                En Ruta ({enRutaDrivers.length})
              </h3>
              <div className="flex flex-col gap-2">
                {enRutaDrivers.length === 0 ? (
                  <p className="text-[10px] text-[#1A2421]/40 text-center py-8 font-semibold">No hay despachos en ruta.</p>
                ) : (
                  enRutaDrivers.map(drv => {
                    const order = orders.find(o => o.id === drv.active_order_id);
                    return (
                      <div key={drv.id} className="p-3 bg-[#FFFFFF]/40 border border-[#40916C]/10 rounded-xl flex flex-col gap-2 text-xs">
                        <div className="flex justify-between items-center font-bold">
                          <span>{drv.name}</span>
                          <span className="bg-blue-50 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-extrabold border border-blue-200">En Ruta</span>
                        </div>
                        {order && (
                          <div className="bg-[#FFFFFF]/80 p-2 rounded-lg border border-[#40916C]/5 text-[10px] text-[#1A2421]/70">
                            <p className="font-bold text-blue-900">Pedido: {order.id}</p>
                            <p className="truncate mt-0.5">Destinatario: {order.family_name}</p>
                            <p className="truncate text-gray-500 mt-0.5 font-bold">Estado: {
                              order.status === 'assigned' ? 'Asignado (Base)' : 'En Tránsito (WhatsApp)'
                            }</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'en_retorno' && (
            <div className="premium-card p-4 bg-white/90 border-[#40916C]/10 flex flex-col gap-3 min-h-[200px]">
              <h3 className="text-xs font-extrabold text-[#1A2421] pb-2 border-b border-[#1A2421]/5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" />
                En Retorno ({enRetornoDrivers.length})
              </h3>
              <div className="flex flex-col gap-2">
                {enRetornoDrivers.length === 0 ? (
                  <p className="text-[10px] text-[#1A2421]/40 text-center py-8 font-semibold">No hay choferes en camino de regreso.</p>
                ) : (
                  enRetornoDrivers.map(drv => {
                    const secsRemaining = getRemainingSeconds(drv.return_eta);
                    return (
                      <div key={drv.id} className="p-3 bg-[#FFFFFF]/40 border border-[#40916C]/10 rounded-xl flex flex-col gap-2 text-xs">
                        <div className="flex justify-between items-center font-bold">
                          <span>{drv.name}</span>
                          <span className="bg-purple-50 text-purple-700 text-[9px] px-1.5 py-0.5 rounded font-extrabold border border-purple-200">Retorno</span>
                        </div>
                        <div className="flex items-center gap-1 bg-purple-50 p-2 rounded-lg border border-purple-100 text-[10px] text-purple-800">
                          <Clock size={12} className="flex-shrink-0" />
                          <span className="font-bold">Regresa en {secsRemaining} s ({formatTime(drv.return_eta)})</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Mapa Móvil */}
          <div className="mt-6">
            <RouteSimulatorMap />
          </div>
        </div>

        {/* Vista Escritorio: Dos Columnas (Listas de Choferes a la Izquierda + Mapa a la Derecha) */}
        <div className="hidden md:grid grid-cols-12 gap-6">
          
          {/* Columna Izquierda: Listas de Repartidores (5/12 cols) */}
          <div className="col-span-5 flex flex-col gap-4">
            
            {/* Disponibles */}
            <div className="glass-panel p-4 bg-[#FFFFFF]/40 border-[#40916C]/10 flex flex-col gap-3 min-h-[160px]">
              <div className="flex justify-between items-center pb-2 border-b border-[#40916C]/10">
                <h3 className="text-xs font-extrabold text-[#1A2421] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  Disponibles ({availableDrivers.length})
                </h3>
              </div>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                {availableDrivers.length === 0 ? (
                  <p className="text-[10px] text-[#1A2421]/40 text-center py-6 font-semibold">No hay repartidores disponibles en base.</p>
                ) : (
                  availableDrivers.map(drv => (
                    <div key={drv.id} className="p-3 bg-white border border-[#40916C]/10 rounded-xl shadow-sm flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#1A2421]">{drv.name}</p>
                        <p className="text-[10px] text-green-600 font-bold mt-0.5">Listo para despacho</p>
                      </div>
                      <UserCheck size={16} className="text-green-500" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* En Ruta */}
            <div className="glass-panel p-4 bg-blue-50/10 border-blue-500/10 flex flex-col gap-3 min-h-[180px]">
              <div className="flex justify-between items-center pb-2 border-b border-blue-500/10">
                <h3 className="text-xs font-extrabold text-[#1A2421] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  En Ruta ({enRutaDrivers.length})
                </h3>
              </div>
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                {enRutaDrivers.length === 0 ? (
                  <p className="text-[10px] text-[#1A2421]/40 text-center py-8 font-semibold">No hay despachos activos en este momento.</p>
                ) : (
                  enRutaDrivers.map(drv => {
                    const order = orders.find(o => o.id === drv.active_order_id);
                    return (
                      <div key={drv.id} className="p-3 bg-white border border-blue-500/10 rounded-xl shadow-sm flex flex-col gap-2 text-xs">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-[#1A2421]">{drv.name}</p>
                          <span className="bg-blue-50 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-extrabold border border-blue-200">Entregando</span>
                        </div>
                        {order && (
                          <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-500/5 text-[10px] text-[#1A2421]/70">
                            <p className="font-bold text-blue-900">Pedido: {order.id}</p>
                            <p className="truncate mt-0.5 font-semibold">Hacia: {order.family_name}</p>
                            <p className="truncate text-gray-500 font-semibold mt-0.5">Estado: {
                              order.status === 'assigned' ? 'Asignado (Base)' : 'En Tránsito (WhatsApp)'
                            }</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* En Retorno */}
            <div className="glass-panel p-4 bg-purple-50/10 border-purple-500/10 flex flex-col gap-3 min-h-[180px]">
              <div className="flex justify-between items-center pb-2 border-b border-purple-500/10">
                <h3 className="text-xs font-extrabold text-[#1A2421] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" />
                  En Retorno ({enRetornoDrivers.length})
                </h3>
              </div>
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                {enRetornoDrivers.length === 0 ? (
                  <p className="text-[10px] text-[#1A2421]/40 text-center py-8 font-semibold">No hay repartidores regresando.</p>
                ) : (
                  enRetornoDrivers.map(drv => {
                    const secsRemaining = getRemainingSeconds(drv.return_eta);
                    return (
                      <div key={drv.id} className="p-3 bg-white border border-purple-500/10 rounded-xl shadow-sm flex flex-col gap-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-[#1A2421]">{drv.name}</p>
                          <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.5 rounded font-extrabold">Retorno</span>
                        </div>
                        <div className="flex items-center gap-1 bg-purple-50 p-2 rounded-lg border border-purple-500/5 text-[10px] text-purple-900">
                          <Clock size={12} className="flex-shrink-0" />
                          <span className="font-bold">Regresa en {secsRemaining} s ({formatTime(drv.return_eta)})</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Columna Derecha: Mapa Interactivo (7/12 cols) */}
          <div className="col-span-7 flex flex-col gap-4">
            <RouteSimulatorMap />
          </div>

        </div>
      </div>

      {/* Contenedor de WhatsApp Toasts Flotantes */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className="pointer-events-auto bg-white border-l-4 border-[#25D366] rounded-2xl shadow-xl p-4 flex flex-col gap-1.5 transition-all duration-300 animate-slide-in relative overflow-hidden"
            style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
              <span className="flex items-center gap-1 text-[#25D366] font-extrabold uppercase tracking-wider">
                <MessageCircle size={12} fill="#25D366" className="text-white" />
                WhatsApp Simulado
              </span>
              <span>{toast.timestamp}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="font-extrabold text-xs text-[#1A2421]">{toast.name}</span>
              <span className="text-[10px] text-[#1A2421]/60 font-semibold">{toast.phone}</span>
            </div>

            <p className="text-xs text-[#1A2421]/80 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
              "{toast.message}"
            </p>

            <div className="flex items-center gap-1.5 text-[9px] text-[#25D366] font-bold mt-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
              <span>Mensaje enviado a Cuba</span>
            </div>

            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
