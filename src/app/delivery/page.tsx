'use client';

import React, { useState, useEffect } from 'react';
import { 
  getDrivers, 
  getOrders, 
  updateDeliveryMilestone, 
  Order, 
  Driver,
  getReturnTimeForZone
} from '@/lib/dbMock';
import { Truck, Check, AlertCircle, Scan, MessageCircle, RefreshCw, UserCheck } from 'lucide-react';

interface ScannedPicking {
  [productId: string]: number; // productId -> successfully scanned quantity
}

export default function DeliveryApp() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeDriverId, setActiveDriverId] = useState<string>('');
  
  // States for active driver workflow
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [pickingScans, setPickingScans] = useState<ScannedPicking>({});
  const [pickingCompleted, setPickingCompleted] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Incident Form States
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentReason, setIncidentReason] = useState('');

  // Simulated WhatsApp triggers
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);

  const loadData = () => {
    const drvs = getDrivers();
    const ords = getOrders();
    setDrivers(drvs);
    setOrders(ords);

    if (drvs.length > 0 && !activeDriverId) {
      setActiveDriverId(drvs[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeDriverId) {
      const currentDriver = drivers.find(d => d.id === activeDriverId);
      if (currentDriver && currentDriver.active_order_id) {
        const order = orders.find(o => o.id === currentDriver.active_order_id);
        setActiveOrder(order || null);
        
        // If order changed, reset picking scans
        if (order && activeOrder?.id !== order.id) {
          const initialScans: ScannedPicking = {};
          order.items.forEach(item => {
            initialScans[item.productId] = 0;
          });
          setPickingScans(initialScans);
          setPickingCompleted(false);
          setAlertMessage(null);
        }
      } else {
        setActiveOrder(null);
        setPickingScans({});
        setPickingCompleted(false);
        setAlertMessage(null);
      }
    }
  }, [activeDriverId, drivers, orders]);

  const triggerWhatsappToast = (msg: string) => {
    setWhatsappToast(msg);
    setTimeout(() => {
      setWhatsappToast(null);
    }, 6000);
  };

  // Simulates barcode picking validation
  const handleSimulatePickingScan = (barcode: string) => {
    if (!activeOrder || !barcode) return;
    setAlertMessage(null);

    // Find if barcode matches a product in the order
    // Let's get products list
    const products = JSON.parse(localStorage.getItem('campestre_products') || '[]');
    const scannedProduct = products.find((p: { barcode: string }) => p.barcode === barcode);

    if (!scannedProduct) {
      setAlertMessage({
        type: 'error',
        text: `⚠️ ERROR: Código [${barcode}] no registrado en inventario.`
      });
      return;
    }

    const orderItem = activeOrder.items.find(i => i.productId === scannedProduct.id);

    if (!orderItem) {
      setAlertMessage({
        type: 'error',
        text: `⚠️ ALERTA DE CORRESPONDENCIA: Código de barras [${barcode}] (${scannedProduct.name}) no coincide con ningún producto de la orden. ¡Revisa el picking!`
      });
      return;
    }

    // Check if quantity is already satisfied
    const currentQty = pickingScans[orderItem.productId] || 0;
    if (currentQty >= orderItem.quantity) {
      setAlertMessage({
        type: 'error',
        text: `⚠️ El producto ${scannedProduct.name} ya fue validado en su totalidad (${orderItem.quantity}/${orderItem.quantity}).`
      });
      return;
    }

    // Increment scan
    const newScans = {
      ...pickingScans,
      [orderItem.productId]: currentQty + 1
    };
    setPickingScans(newScans);

    // Check if picking is completely completed
    const isCompleted = activeOrder.items.every(item => 
      (newScans[item.productId] || 0) === item.quantity
    );

    if (isCompleted) {
      setPickingCompleted(true);
      setAlertMessage({
        type: 'success',
        text: '✓ Validación de Picking completa. Todos los códigos de barra coinciden exactamente. Listo para salir de base.'
      });
    } else {
      setAlertMessage({
        type: 'success',
        text: `✓ Escaneado: ${scannedProduct.name}. Total: ${currentQty + 1}/${orderItem.quantity}`
      });
    }
  };

  const handleStartRoute = () => {
    if (!activeOrder) return;
    const result = updateDeliveryMilestone(activeOrder.id, 'in_transit');
    if (result.success) {
      loadData();
      if (result.whatsappNotificationSimulated) {
        triggerWhatsappToast(result.whatsappNotificationSimulated);
      }
    }
  };

  const handleDeliverOrder = () => {
    if (!activeOrder) return;
    const result = updateDeliveryMilestone(activeOrder.id, 'delivered');
    if (result.success) {
      loadData();
      if (result.whatsappNotificationSimulated) {
        triggerWhatsappToast(result.whatsappNotificationSimulated);
      }
    }
  };

  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !incidentReason.trim()) return;

    const result = updateDeliveryMilestone(activeOrder.id, 'incident', undefined, incidentReason);
    if (result.success) {
      setShowIncidentModal(false);
      setIncidentReason('');
      loadData();
      alert('Incidencia guardada. El pedido ha sido reportado en administración.');
    }
  };

  const currentDriver = drivers.find(d => d.id === activeDriverId);

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-md mx-auto w-full">
      
      {/* Floating WhatsApp Mock Notification Toast */}
      {whatsappToast && (
        <div className="fixed top-4 left-4 right-4 bg-emerald-900/95 text-white p-4 rounded-2xl shadow-xl z-50 border border-emerald-500/20 animate-slideIn flex gap-3 items-start">
          <div className="bg-emerald-500 p-2 rounded-xl text-white">
            <MessageCircle size={18} className="fill-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-300">WHATSAPP NOTIFY (SIMULADOR)</p>
            <p className="text-xs leading-relaxed mt-0.5">{whatsappToast}</p>
          </div>
        </div>
      )}

      {/* Driver Login Selector */}
      <div className="glass-panel p-4 flex flex-col gap-3">
        <label className="text-xs font-bold text-emerald-950/70">Iniciar Sesión de Repartidor:</label>
        <select
          value={activeDriverId}
          onChange={e => setActiveDriverId(e.target.value)}
          className="glass-input text-sm font-bold w-full"
        >
          {drivers.map(d => (
            <option key={d.id} value={d.id}>
              🚚 {d.name} ({d.status})
            </option>
          ))}
        </select>

        {currentDriver && currentDriver.status === 'En Retorno' && (
          <div className="bg-purple-50 text-purple-700 p-3 rounded-2xl border border-purple-200 text-xs flex flex-col gap-1">
            <span className="font-bold flex items-center gap-1">
              <RefreshCw size={14} className="animate-spin" />
              Retornando a Base
            </span>
            <p className="text-[10px]">
              El sistema calcula automáticamente tu llegada. Estatus disponible en administración en breve.
            </p>
          </div>
        )}
      </div>

      {/* Driver Active Order Panel */}
      {activeOrder ? (
        <div className="glass-panel p-5 bg-white/90 flex flex-col gap-4">
          
          {/* Order Header */}
          <div className="flex justify-between items-start pb-3 border-b border-emerald-500/10">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                {activeOrder.status === 'assigned' ? 'Asignado (En base)' : 'En Ruta (Tránsito)'}
              </span>
              <h2 className="text-base font-extrabold text-emerald-950 mt-1.5">Orden: {activeOrder.id}</h2>
            </div>
            
            <div className="text-right">
              <span className="text-xs text-emerald-950/60 font-semibold block">Entrega en:</span>
              <span className="text-xs font-bold text-emerald-900">{activeOrder.family_address.split(',')[1] || 'La Habana'}</span>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-emerald-50/50 p-3.5 rounded-2xl text-xs flex flex-col gap-1.5 border border-emerald-500/15">
            <p className="text-emerald-950 font-bold"><span className="text-emerald-900/60 font-medium">Recibe:</span> {activeOrder.family_name}</p>
            <p className="text-emerald-950 font-bold"><span className="text-emerald-900/60 font-medium">Teléfono:</span> {activeOrder.family_phone}</p>
            <p className="text-emerald-950 font-medium leading-relaxed"><span className="text-emerald-900/60">Dirección:</span> {activeOrder.family_address}</p>
          </div>

          {/* Picking checklist validation */}
          <div>
            <h3 className="text-xs font-extrabold text-emerald-950 mb-2 flex items-center justify-between">
              <span>Picking de Productos</span>
              {pickingCompleted && (
                <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                  <Check size={12} className="stroke-[3]" /> Picking Validado
                </span>
              )}
            </h3>

            <div className="flex flex-col gap-2">
              {activeOrder.items.map(item => {
                const scanned = pickingScans[item.productId] || 0;
                const isSatisfied = scanned === item.quantity;
                return (
                  <div 
                    key={item.productId}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between transition ${
                      isSatisfied 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-white border-emerald-500/10 text-emerald-950'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{item.productName}</p>
                      <p className="text-[10px] text-emerald-950/60 mt-0.5">Requerido: {item.quantity} lbs</p>
                    </div>
                    
                    <span className="font-bold font-mono">
                      {scanned} / {item.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert Message for Scanner */}
          {alertMessage && (
            <div className={`p-3 rounded-2xl text-xs font-semibold ${
              alertMessage.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {alertMessage.text}
            </div>
          )}

          {/* Picking barcode scanner simulator */}
          {!pickingCompleted && (
            <div className="bg-emerald-950 p-4 rounded-2xl flex flex-col gap-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Scan size={14} className="text-emerald-400" />
                Simulador Escáner de Packing (Picking)
              </h4>
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-emerald-300 font-semibold">Elegir producto para escanear:</label>
                <select
                  onChange={e => handleSimulatePickingScan(e.target.value)}
                  defaultValue=""
                  className="bg-white text-emerald-950 text-xs rounded-xl p-2 outline-none w-full"
                >
                  <option value="" disabled>-- Escanear producto --</option>
                  <optgroup label="Productos de la Orden">
                    {/* Map active order items back to barcodes */}
                    {activeOrder.items.map(item => {
                      // Lookup barcode
                      const productsList = JSON.parse(localStorage.getItem('campestre_products') || '[]');
                      const prod = productsList.find((p: { id: string }) => p.id === item.productId);
                      return prod ? (
                        <option key={item.productId} value={prod.barcode}>{item.productName}</option>
                      ) : null;
                    })}
                  </optgroup>
                  <optgroup label="Productos Equivocados (Generará Alerta)">
                    <option value="7501020304082">Aceite de Girasol (Incorrecto)</option>
                    <option value="7501020304099">Leche en Polvo (Incorrecto)</option>
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          {/* Milestone Action buttons */}
          <div className="border-t border-emerald-500/10 pt-4 flex flex-col gap-2">
            {activeOrder.status === 'assigned' && (
              <button
                onClick={handleStartRoute}
                disabled={!pickingCompleted}
                className={`w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
                  pickingCompleted
                    ? 'glass-button-primary cursor-pointer'
                    : 'bg-emerald-950/5 text-emerald-950/40 border border-emerald-950/10 cursor-not-allowed'
                }`}
              >
                <Truck size={16} />
                Iniciar Ruta (Enviar WhatsApp a Cuba)
              </button>
            )}

            {activeOrder.status === 'in_transit' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDeliverOrder}
                  className="glass-button-primary py-3 text-xs font-bold flex items-center justify-center gap-1 bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/20"
                >
                  <Check size={16} />
                  Entregado
                </button>
                <button
                  onClick={() => setShowIncidentModal(true)}
                  className="glass-button py-3 text-xs font-bold text-red-700 border-red-500/20 hover:bg-red-500/10 flex items-center justify-center gap-1"
                >
                  <AlertCircle size={16} />
                  Incidencia
                </button>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="glass-panel p-8 text-center bg-white/80 border-emerald-500/10 flex flex-col items-center justify-center min-h-[300px]">
          <span className="text-4xl mb-3">🚚</span>
          <h3 className="text-sm font-bold text-emerald-950">Sin Pedidos Asignados</h3>
          <p className="text-xs text-emerald-950/50 mt-1 max-w-[220px] leading-relaxed">
            Actualmente no tienes ningún encargo de despacho en tu bandeja. Pide al Administrador en base que te asigne una orden.
          </p>
        </div>
      )}

      {/* Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-emerald-950/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-sm p-6 bg-white/95 shadow-2xl relative">
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5 mb-2">
              <AlertCircle size={16} className="text-red-500" />
              Reportar Incidencia de Entrega
            </h3>
            
            <form onSubmit={handleReportIncident} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-emerald-950/70">Motivo del fallo de entrega:</label>
                <textarea
                  required
                  value={incidentReason}
                  onChange={e => setIncidentReason(e.target.value)}
                  placeholder="Ej: Familiar no se encontraba en el domicilio y no responde al teléfono..."
                  className="glass-input text-xs h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="glass-button text-xs py-2"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="glass-button-primary bg-red-600 hover:bg-red-700 text-white text-xs py-2 shadow-red-500/10"
                >
                  Registrar Fallo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
