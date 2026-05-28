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
import { Truck, UserCheck, ShieldAlert, Clock, CheckCircle } from 'lucide-react';

export default function AdminDispatch() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

  const loadData = () => {
    // Run automated return checkers
    checkDriverReturnStatus();
    setOrders(getOrders());
    setDrivers(getDrivers());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAssignDriver = (orderId: string, driverId: string) => {
    if (!driverId) return;
    const success = assignOrderToDriver(orderId, driverId);
    if (success) {
      loadData();
      alert(`¡Pedido ${orderId} despachado con éxito! Repartidor asignado.`);
    } else {
      alert('No se pudo asignar el repartidor.');
    }
  };

  // Group orders that need dispatch
  const pendingDispatchOrders = orders.filter(o => o.status === 'paid');
  
  // Split drivers into the 3 columns
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
      <div className="glass-panel p-5 bg-white/80">
        <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2 mb-3">
          <Clock size={18} className="text-amber-500" />
          Pedidos Pendientes de Despacho ({pendingDispatchOrders.length})
        </h2>
        
        {pendingDispatchOrders.length === 0 ? (
          <div className="text-center py-6 bg-emerald-500/5 rounded-2xl border border-dashed border-emerald-500/10">
            <p className="text-xs text-emerald-900/60 font-semibold">No hay pedidos pagados esperando despacho.</p>
          </div>
        ) : (
          <>
            {/* Vista Escritorio: Tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-emerald-500/10 text-emerald-950/60 font-semibold">
                    <th className="py-2">Código</th>
                    <th className="py-2">Familiar Destinatario</th>
                    <th className="py-2">Dirección Cuba</th>
                    <th className="py-2">Total Pedido</th>
                    <th className="py-2 text-right">Asignar Repartidor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/5">
                  {pendingDispatchOrders.map(order => (
                    <tr key={order.id} className="hover:bg-white/20 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-emerald-950">{order.id}</td>
                      <td className="py-2.5 font-semibold text-emerald-900">{order.family_name}</td>
                      <td className="py-2.5 text-emerald-950/70 truncate max-w-[200px]">{order.family_address}</td>
                      <td className="py-2.5 font-bold text-emerald-950">${order.total_amount.toFixed(2)}</td>
                      <td className="py-2.5 text-right">
                        {availableDrivers.length === 0 ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                            Sin choferes disponibles
                          </span>
                        ) : (
                          <select
                            onChange={e => handleAssignDriver(order.id, e.target.value)}
                            defaultValue=""
                            className="glass-input text-[10px] py-1 px-2 font-bold max-w-[150px]"
                          >
                            <option value="" disabled>-- Seleccionar Chofer --</option>
                            {availableDrivers.map(drv => (
                              <option key={drv.id} value={drv.id}>{drv.name}</option>
                            ))}
                          </select>
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
                <div key={order.id} className="p-3.5 bg-white/40 border border-white/60 rounded-2xl flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center pb-1.5 border-b border-emerald-500/5">
                    <span className="font-mono font-bold text-emerald-950">{order.id}</span>
                    <span className="text-emerald-950 font-bold">${order.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-[#142f1f]/80">
                    <p><span className="font-semibold text-emerald-950">Familiar:</span> {order.family_name}</p>
                    <p className="truncate"><span className="font-semibold text-emerald-950">Destino:</span> {order.family_address}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2 border-t border-emerald-500/5 pt-2">
                    <span className="font-semibold text-[10px] text-emerald-950/70">Asignar Repartidor:</span>
                    {availableDrivers.length === 0 ? (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        Sin choferes
                      </span>
                    ) : (
                      <select
                        onChange={e => handleAssignDriver(order.id, e.target.value)}
                        defaultValue=""
                        className="glass-input text-[10px] py-0.5 px-2 font-bold max-w-[120px]"
                      >
                        <option value="" disabled>-- Elegir --</option>
                        {availableDrivers.map(drv => (
                          <option key={drv.id} value={drv.id}>{drv.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Drivers state board - 3 columns */}
      <div>
        <h2 className="text-lg font-bold text-emerald-950 mb-4 flex items-center gap-2">
          <Truck size={18} className="text-emerald-600" />
          Estado de Repartidores en Base
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* COLUMN 1: Disponibles */}
          <div className="glass-panel p-4 bg-emerald-50/20 border-emerald-500/10 flex flex-col gap-3 min-h-[300px]">
            <div className="flex justify-between items-center pb-2 border-b border-emerald-500/10">
              <h3 className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                Disponibles ({availableDrivers.length})
              </h3>
            </div>
            
            <div className="flex flex-col gap-2">
              {availableDrivers.length === 0 ? (
                <p className="text-[10px] text-emerald-900/40 text-center py-8">No hay repartidores disponibles en la base.</p>
              ) : (
                availableDrivers.map(drv => (
                  <div key={drv.id} className="p-3 bg-white border border-emerald-500/10 rounded-xl shadow-sm flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-emerald-950">{drv.name}</p>
                      <p className="text-[10px] text-green-600 font-semibold mt-0.5">Listo para despacho</p>
                    </div>
                    <UserCheck size={16} className="text-green-500" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: En Ruta */}
          <div className="glass-panel p-4 bg-blue-50/20 border-blue-500/10 flex flex-col gap-3 min-h-[300px]">
            <div className="flex justify-between items-center pb-2 border-b border-blue-500/10">
              <h3 className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                En Ruta ({enRutaDrivers.length})
              </h3>
            </div>
            
            <div className="flex flex-col gap-2">
              {enRutaDrivers.length === 0 ? (
                <p className="text-[10px] text-emerald-900/40 text-center py-8">No hay despachos activos en este momento.</p>
              ) : (
                enRutaDrivers.map(drv => {
                  const order = orders.find(o => o.id === drv.active_order_id);
                  return (
                    <div key={drv.id} className="p-3 bg-white border border-blue-500/10 rounded-xl shadow-sm flex flex-col gap-2 text-xs">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-emerald-950">{drv.name}</p>
                        <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.5 rounded font-extrabold">Entregando</span>
                      </div>
                      
                      {order && (
                        <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-500/5 text-[10px] text-emerald-950/70">
                          <p className="font-bold text-blue-900">Pedido: {order.id}</p>
                          <p className="truncate mt-0.5">Hacia: {order.family_name}</p>
                          <p className="truncate text-emerald-900/50 font-semibold mt-0.5">Estado: {
                            order.status === 'assigned' ? 'Asignado (En Base)' : 'En Tránsito (Vía WhatsApp)'
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
          <div className="glass-panel p-4 bg-purple-50/20 border-purple-500/10 flex flex-col gap-3 min-h-[300px]">
            <div className="flex justify-between items-center pb-2 border-b border-purple-500/10">
              <h3 className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" />
                En Retorno ({enRetornoDrivers.length})
              </h3>
            </div>
            
            <div className="flex flex-col gap-2">
              {enRetornoDrivers.length === 0 ? (
                <p className="text-[10px] text-emerald-900/40 text-center py-8">No hay repartidores regresando de entregas.</p>
              ) : (
                enRetornoDrivers.map(drv => {
                  const minsRemaining = getRemainingMinutes(drv.return_eta);
                  return (
                    <div key={drv.id} className="p-3 bg-white border border-purple-500/10 rounded-xl shadow-sm flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-emerald-950">{drv.name}</p>
                        <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.5 rounded font-extrabold">Retorno</span>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-purple-50 p-2 rounded-lg border border-purple-500/5 text-[10px] text-purple-900">
                        <Clock size={12} className="flex-shrink-0" />
                        <span className="font-semibold">Regresa en {minsRemaining} min ({formatTime(drv.return_eta)})</span>
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
