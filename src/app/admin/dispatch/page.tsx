'use client';

import React, { useState, useEffect } from 'react';
import { 
  getOrders, 
  getDrivers, 
  assignOrderToDriver, 
  checkDriverReturnStatus, 
  Order, 
  Driver 
} from '@/lib/dbMock';
import { Truck, UserCheck, Clock, CheckCircle } from 'lucide-react';
import { CustomSelect } from "@/components/ui/custom-select";

export default function AdminDispatch() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeTab, setActiveTab] = useState<'disponibles' | 'en_ruta' | 'en_retorno'>('disponibles');

  const loadData = async () => {
    try {
      await checkDriverReturnStatus();
      const [ords, drvs] = await Promise.all([
        getOrders(),
        getDrivers()
      ]);
      setOrders(ords);
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

  const getRemainingMinutes = (isoString: string | null) => {
    if (!isoString) return 0;
    const diff = new Date(isoString).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 60000));
  };

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
          Estado de Repartidores en Base
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
            <div className="premium-card p-4 bg-white/90 border-[#40916C]/10 flex flex-col gap-3 min-h-[220px]">
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
            <div className="premium-card p-4 bg-white/90 border-[#40916C]/10 flex flex-col gap-3 min-h-[220px]">
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
            <div className="premium-card p-4 bg-white/90 border-[#40916C]/10 flex flex-col gap-3 min-h-[220px]">
              <h3 className="text-xs font-extrabold text-[#1A2421] pb-2 border-b border-[#1A2421]/5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" />
                En Retorno ({enRetornoDrivers.length})
              </h3>
              <div className="flex flex-col gap-2">
                {enRetornoDrivers.length === 0 ? (
                  <p className="text-[10px] text-[#1A2421]/40 text-center py-8 font-semibold">No hay choferes en camino de regreso.</p>
                ) : (
                  enRetornoDrivers.map(drv => {
                    const minsRemaining = getRemainingMinutes(drv.return_eta);
                    return (
                      <div key={drv.id} className="p-3 bg-[#FFFFFF]/40 border border-[#40916C]/10 rounded-xl flex flex-col gap-2 text-xs">
                        <div className="flex justify-between items-center font-bold">
                          <span>{drv.name}</span>
                          <span className="bg-purple-50 text-purple-700 text-[9px] px-1.5 py-0.5 rounded font-extrabold border border-purple-200">Retorno</span>
                        </div>
                        <div className="flex items-center gap-1 bg-purple-50 p-2 rounded-lg border border-purple-100 text-[10px] text-purple-800">
                          <Clock size={12} className="flex-shrink-0" />
                          <span className="font-bold">Regresa en {minsRemaining} min ({formatTime(drv.return_eta)})</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vista Escritorio: Rejilla clásica de 3 columnas */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          
          {/* COLUMN 1: Disponibles */}
          <div className="glass-panel p-4 bg-[#FFFFFF]/40 border-[#40916C]/10 flex flex-col gap-3 min-h-[300px]">
            <div className="flex justify-between items-center pb-2 border-b border-[#40916C]/10">
              <h3 className="text-xs font-extrabold text-[#1A2421] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                Disponibles ({availableDrivers.length})
              </h3>
            </div>
            
            <div className="flex flex-col gap-2">
              {availableDrivers.length === 0 ? (
                <p className="text-[10px] text-[#1A2421]/40 text-center py-8 font-semibold">No hay repartidores disponibles en base.</p>
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

          {/* COLUMN 2: En Ruta */}
          <div className="glass-panel p-4 bg-blue-50/10 border-blue-500/10 flex flex-col gap-3 min-h-[300px]">
            <div className="flex justify-between items-center pb-2 border-b border-blue-500/10">
              <h3 className="text-xs font-extrabold text-[#1A2421] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                En Ruta ({enRutaDrivers.length})
              </h3>
            </div>
            
            <div className="flex flex-col gap-2">
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

          {/* COLUMN 3: En Retorno */}
          <div className="glass-panel p-4 bg-purple-50/10 border-purple-500/10 flex flex-col gap-3 min-h-[300px]">
            <div className="flex justify-between items-center pb-2 border-b border-purple-500/10">
              <h3 className="text-xs font-extrabold text-[#1A2421] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" />
                En Retorno ({enRetornoDrivers.length})
              </h3>
            </div>
            
            <div className="flex flex-col gap-2">
              {enRetornoDrivers.length === 0 ? (
                <p className="text-[10px] text-[#1A2421]/40 text-center py-8 font-semibold">No hay repartidores regresando.</p>
              ) : (
                enRetornoDrivers.map(drv => {
                  const minsRemaining = getRemainingMinutes(drv.return_eta);
                  return (
                    <div key={drv.id} className="p-3 bg-white border border-purple-500/10 rounded-xl shadow-sm flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-[#1A2421]">{drv.name}</p>
                        <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.5 rounded font-extrabold">Retorno</span>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-purple-50 p-2 rounded-lg border border-purple-500/5 text-[10px] text-purple-900">
                        <Clock size={12} className="flex-shrink-0" />
                        <span className="font-bold">Regresa en {minsRemaining} min ({formatTime(drv.return_eta)})</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
