'use client';

import React, { useState, useEffect } from 'react';
import { 
  getDrivers, 
  getOrders, 
  updateDeliveryMilestone, 
  Order, 
  Driver,
  getProducts,
} from '@/lib/dbMock';
import { Truck, Check, AlertCircle, Scan, MessageCircle, RefreshCw, Lock, LogOut, Sparkles, Phone } from 'lucide-react';
import { MapPin, User, CheckCircle2, Navigation, AlertTriangle, CloudOff, ChevronRight, X } from 'lucide-react';
import { CustomSelect } from "@/components/ui/custom-select";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";


interface ScannedPicking {
  [productId: string]: number; // productId -> cantidad validada
}

export default function DeliveryApp() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Estados de Autenticación
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [activeDriverId, setActiveDriverId] = useState<string>('');
  const [authError, setAuthError] = useState('');

  // Estados del flujo del repartidor logueado
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [pickingScans, setPickingScans] = useState<ScannedPicking>({});
  const [pickingCompleted, setPickingCompleted] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estado del modal de incidentes
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentReason, setIncidentReason] = useState('');
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [drvs, ords] = await Promise.all([
        getDrivers(),
        getOrders()
      ]);
      setDrivers(drvs);
      setOrders(ords);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    loadData();
    // Recuperar sesión anterior si existe
    if (typeof window !== 'undefined') {
      const savedDriverId = localStorage.getItem('campestre_active_driver_id');
      if (savedDriverId) {
        setActiveDriverId(savedDriverId);
        setIsLoggedIn(true);
      }
    }
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sincronizar orden activa una vez autenticado
  useEffect(() => {
    if (isLoggedIn && activeDriverId) {
      const currentDriver = drivers.find(d => d.id === activeDriverId);
      if (currentDriver && currentDriver.active_order_id) {
        const order = orders.find(o => o.id === currentDriver.active_order_id);
        setActiveOrder(order || null);
        
        // Inicializar picking si la orden cambia
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
  }, [isLoggedIn, activeDriverId, drivers, orders]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Búsqueda del conductor por nombre (ej: "Juan", "Yusniel", "Marcos")
    const foundDriver = drivers.find(d => 
      d.name.toLowerCase().includes(loginUser.toLowerCase())
    );

    if (!foundDriver) {
      setAuthError('El usuario del repartidor no está registrado.');
      return;
    }

    // Validación simulada de PIN de 4 dígitos
    const validPins: Record<string, string> = {
      'drv-1': '1111', // Juan Carlos Pérez
      'drv-2': '2222', // Yusniel Gómez
      'drv-3': '3333', // Marcos Díaz
    };

    if (validPins[foundDriver.id] === loginPin) {
      setActiveDriverId(foundDriver.id);
      setIsLoggedIn(true);
      localStorage.setItem('campestre_active_driver_id', foundDriver.id);
      setLoginUser('');
      setLoginPin('');
    } else {
      setAuthError('PIN de seguridad incorrecto.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveDriverId('');
    setActiveOrder(null);
    localStorage.removeItem('campestre_active_driver_id');
  };

  const triggerWhatsappToast = (msg: string) => {
    setWhatsappToast(msg);
    setTimeout(() => {
      setWhatsappToast(null);
    }, 6000);
  };

  // Simulación de escaneo de códigos de barra
  const handleSimulatePickingScan = async (barcode: string) => {
    if (!activeOrder || !barcode) return;
    setAlertMessage(null);

    const products = await getProducts();
    const scannedProduct = products.find((p: { barcode: string }) => p.barcode === barcode);

    if (!scannedProduct) {
      setAlertMessage({
        type: 'error',
        text: `ERROR: Código [${barcode}] no registrado en almacén.`
      });
      return;
    }

    const orderItem = activeOrder.items.find(i => i.productId === scannedProduct.id);

    if (!orderItem) {
      setAlertMessage({
        type: 'error',
        text: `CORRESPONDENCIA INCORRECTA: El producto [${scannedProduct.name}] no pertenece a este pedido.`
      });
      return;
    }

    const currentQty = pickingScans[orderItem.productId] || 0;
    if (currentQty >= orderItem.quantity) {
      setAlertMessage({
        type: 'error',
        text: `El producto ${scannedProduct.name} ya está completo (${orderItem.quantity}/${orderItem.quantity}).`
      });
      return;
    }

    const newScans = {
      ...pickingScans,
      [orderItem.productId]: currentQty + 1
    };
    setPickingScans(newScans);

    const isCompleted = activeOrder.items.every(item => 
      (newScans[item.productId] || 0) === item.quantity
    );

    if (isCompleted) {
      setPickingCompleted(true);
      setAlertMessage({
        type: 'success',
        text: '✓ Validación de Picking completa. Todos los códigos coinciden exactamente.'
      });
    } else {
      setAlertMessage({
        type: 'success',
        text: `✓ Escaneado: ${scannedProduct.name} (${currentQty + 1}/${orderItem.quantity})`
      });
    }
  };

  const handleStartRoute = async () => {
    if (!activeOrder) return;
    const result = await updateDeliveryMilestone(activeOrder.id, 'in_transit');
    if (result.success) {
      await loadData();
      if (result.whatsappNotificationSimulated) {
        triggerWhatsappToast(result.whatsappNotificationSimulated);
      }
    }
  };

  const handleDeliverOrder = async () => {
    if (!activeOrder) return;
    const result = await updateDeliveryMilestone(activeOrder.id, 'delivered');
    if (result.success) {
      await loadData();
      if (result.whatsappNotificationSimulated) {
        triggerWhatsappToast(result.whatsappNotificationSimulated);
      }
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !incidentReason.trim()) return;

    const result = await updateDeliveryMilestone(activeOrder.id, 'incident', undefined, incidentReason);
    if (result.success) {
      setShowIncidentModal(false);
      setIncidentReason('');
      await loadData();
      alert('Incidencia guardada. El pedido ha sido reportado en base.');
    }
  };

  const currentDriver = drivers.find(d => d.id === activeDriverId);

  // VISTA 1: Pantalla de Login por PIN (Mobile-First de alto contraste)
  if (!isLoggedIn) {
    return (
      <div className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm premium-card p-6 bg-white shadow-xl flex flex-col gap-6 border-t-4 border-[#2D6A4F]">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#FFFFFF] text-[#2D6A4F] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border border-[#2D6A4F]/10">
              <Lock size={22} />
            </div>
            <h2 className="text-lg font-extrabold text-[#1A2421]">Acceso de Repartidor</h2>
            <p className="text-xs text-[#1A2421]/60 mt-1">Identifícate con tus credenciales de ruta</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {authError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 flex items-center gap-1.5">
                <AlertCircle size={14} className="flex-shrink-0" />
                {authError}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1A2421]/70">Usuario (Nombre):</label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                placeholder="Ej. Juan o Yusniel"
                className="glass-input text-base py-3 w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1A2421]/70">PIN de Seguridad (4 dígitos):</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                required
                value={loginPin}
                onChange={e => setLoginPin(e.target.value)}
                placeholder="••••"
                className="glass-input text-center text-xl font-bold tracking-widest py-3 w-full"
              />
            </div>

            <InteractiveHoverButton
              type="submit"
              className="w-full py-4 text-sm mt-2"
            >
              INGRESAR AL PANEL
            </InteractiveHoverButton>
          </form>

          <div className="text-[10px] text-center text-[#1A2421]/50 bg-[#FFFFFF] p-2.5 rounded-xl border border-dashed border-[#40916C]/25 flex items-center justify-center gap-1.5">
            <Sparkles size={14} className="text-amber-500 flex-shrink-0" />
            <span><span className="font-bold">Demostración:</span> Ingresa <span className="font-bold">"Juan"</span> y PIN <span className="font-bold">"1111"</span>, o <span className="font-bold">"Yusniel"</span> y PIN <span className="font-bold">"2222"</span>.</span>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: Aplicación del Repartidor Logueado (UX de Calle 100% Vertical)
  return (
    <div className="flex-1 flex flex-col gap-5 max-w-md mx-auto w-full px-2">
      
      {/* Floating WhatsApp Toast */}
      {whatsappToast && (
        <div className="fixed top-4 left-4 right-4 bg-emerald-950/95 text-white p-4 rounded-2xl shadow-xl z-50 border border-emerald-500/20 animate-slideIn flex gap-3 items-start">
          <div className="bg-emerald-500 p-2 rounded-xl text-white">
            <MessageCircle size={18} className="fill-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-300">NOTIFICACIÓN WHATSAPP (CUBA)</p>
            <p className="text-xs leading-relaxed mt-0.5">{whatsappToast}</p>
          </div>
        </div>
      )}

      <div className="premium-card p-4 bg-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FFFFFF] flex items-center justify-center border border-[#40916C]/10">
            <Truck size={18} className="text-[#2D6A4F]" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-[#1A2421]">{currentDriver?.name}</h3>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              currentDriver?.status === 'Disponible' 
                ? 'bg-green-100 text-green-800' 
                : currentDriver?.status === 'En Ruta' 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-purple-100 text-purple-800'
            }`}>
              {currentDriver?.status}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="text-[#1A2421]/60 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
          title="Cerrar Sesión"
        >
          <LogOut size={16} />
          <span className="text-[10px] font-bold">Cerrar Sesión</span>
        </button>
      </div>

      {currentDriver && currentDriver.status === 'En Retorno' && (
        <div className="bg-purple-50 text-purple-800 p-4 rounded-3xl border border-purple-200 text-xs flex flex-col gap-1.5 shadow-sm animate-pulse">
          <span className="font-extrabold flex items-center gap-1">
            <RefreshCw size={14} className="animate-spin" />
            Retornando a la Base del Restaurante
          </span>
          <p className="text-[10px] leading-relaxed text-purple-700">
            El sistema ha calculado tu tiempo de retorno y está estimando tu disponibilidad automáticamente en el panel de despacho de base.
          </p>
        </div>
      )}

      {/* Tarjeta Gigante de la Orden Activa */}
      {activeOrder ? (
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Tarjeta de Destinatario y Dirección */}
          <div className="premium-card p-6 bg-white shadow-lg flex flex-col gap-4 border border-[#40916C]/10">
            <div>
              <span className="text-[10px] font-extrabold text-[#2D6A4F] bg-[#2D6A4F]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {activeOrder.status === 'assigned' ? 'Listo para Despacho' : 'Pedido en Camino'}
              </span>
              <h2 className="text-xl font-extrabold text-[#1A2421] mt-2">Pedido: {activeOrder.id}</h2>
            </div>
            
            <div className="bg-[#FFFFFF] p-4 rounded-2xl flex flex-col gap-3 border border-[#40916C]/10">
              <div>
                <span className="text-[10px] font-bold text-[#1A2421]/50 uppercase tracking-wider block">Destinatario (Cuba):</span>
                <span className="text-lg font-extrabold text-[#1A2421] leading-tight block mt-0.5">{activeOrder.family_name}</span>
              </div>
              
              <div>
                <span className="text-[10px] font-bold text-[#1A2421]/50 uppercase tracking-wider block">Teléfono de Contacto:</span>
                <a 
                  href={`tel:${activeOrder.family_phone}`}
                  className="text-base font-bold text-[#2D6A4F] hover:underline flex items-center gap-1.5 mt-0.5"
                >
                  <Phone size={14} className="inline mr-1 align-middle" /> {activeOrder.family_phone}
                </a>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#1A2421]/50 uppercase tracking-wider block">Dirección de Entrega:</span>
                <span className="text-sm font-bold text-[#1A2421] leading-relaxed block mt-0.5">{activeOrder.family_address}</span>
              </div>
            </div>
          </div>

          {/* Sección de validación de picking (solo si está en base) */}
          {activeOrder.status === 'assigned' && (
            <div className="premium-card p-5 bg-white shadow-md flex flex-col gap-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#1A2421]/5">
                <h3 className="text-xs font-extrabold text-[#1A2421] uppercase tracking-wider">Picking de Almacén</h3>
                {pickingCompleted && (
                  <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-0.5">
                    ✓ Validado
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {activeOrder.items.map(item => {
                  const scanned = pickingScans[item.productId] || 0;
                  const isSatisfied = scanned === item.quantity;
                  return (
                    <div 
                      key={item.productId}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-colors ${
                        isSatisfied 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-[#FFFFFF] border-[#40916C]/10 text-[#1A2421]'
                      }`}
                    >
                      <div>
                        <p className="font-extrabold">{item.productName}</p>
                        <p className="text-[10px] text-[#1A2421]/60 mt-0.5">Cantidad total: {item.quantity} lbs</p>
                      </div>
                      <span className="font-mono font-extrabold text-sm text-[#1A2421]">
                        {scanned} / {item.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>

              {alertMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold border ${
                  alertMessage.type === 'success' 
                    ? 'bg-green-50 text-green-800 border-green-100' 
                    : 'bg-red-50 text-red-800 border-red-100'
                }`}>
                  {alertMessage.text}
                </div>
              )}

              {/* Lector simplificado de códigos de barra para picking */}
              {!pickingCompleted && (
                <div className="bg-[#1A2421] p-4 rounded-2xl flex flex-col gap-2.5 text-white">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Scan size={12} className="text-[#2D6A4F]" />
                    Simular Escaneo del Producto
                  </h4>
                  {(() => {
                    const productsList = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('campestre_products') || '[]') : [];
                    const orderItems = activeOrder.items.map(item => {
                      const prod = productsList.find((p: { id: string }) => p.id === item.productId);
                      return prod ? { value: prod.barcode, label: `${item.productName} (${prod.barcode})` } : null;
                    }).filter(Boolean) as { value: string; label: string }[];

                    const pickingOptions = [
                      {
                        label: "Productos en este Pedido",
                        options: orderItems
                      },
                      {
                        label: "Producto Errático (Generará Alerta)",
                        options: [
                          { value: "7501020304082", label: "Aceite de Girasol (Código Incorrecto)" },
                          { value: "7501020304099", label: "Leche en Polvo (Código Incorrecto)" }
                        ]
                      }
                    ];

                    return (
                      <CustomSelect
                        options={pickingOptions}
                        value=""
                        onChange={handleSimulatePickingScan}
                        placeholder="-- Selecciona un código de barras --"
                        triggerClassName="text-xs font-bold bg-white text-[#1A2421] h-10 border-transparent focus:border-transparent focus:ring-0"
                      />
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* BOTÓN DE ACCIÓN GIGANTE (Fácil acceso con pulgar en móvil) */}
          <div className="mt-auto pt-4 flex flex-col gap-3">
            {activeOrder.status === 'assigned' && (
              <InteractiveHoverButton
                onClick={handleStartRoute}
                disabled={!pickingCompleted}
                className="w-full text-sm"
              >
                INICIAR RUTA (NOTIFICAR WHATSAPP)
              </InteractiveHoverButton>
            )}

            {activeOrder.status === 'in_transit' && (
              <div className="flex flex-col gap-3">
                <InteractiveHoverButton
                  onClick={handleDeliverOrder}
                  className="w-full text-sm"
                >
                  MARCAR COMO ENTREGADO
                </InteractiveHoverButton>
                
                <button
                  onClick={() => setShowIncidentModal(true)}
                  className="w-full py-3.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl active:scale-95 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <AlertCircle size={14} />
                  Reportar Incidencia / Fallo de Entrega
                </button>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="premium-card p-10 text-center bg-white border border-[#40916C]/10 flex flex-col items-center justify-center min-h-[340px]">
          <Truck size={48} className="text-[#2D6A4F]/40 mb-4 animate-bounce" />
          <h3 className="text-base font-extrabold text-[#1A2421]">Sin Órdenes Asignadas</h3>
          <p className="text-xs text-[#1A2421]/60 mt-2 max-w-[240px] leading-relaxed">
            Actualmente no tienes pedidos pendientes de despacho en tu ruta activa. Contacta al Administrador de base para asignar pedidos.
          </p>
        </div>
      )}

      {/* Modal de Reporte de Incidencias */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-[#1A2421]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="premium-card w-full max-w-sm p-6 bg-white shadow-2xl relative border-t-4 border-red-500">
            <h3 className="text-sm font-extrabold text-[#1A2421] flex items-center gap-1.5 mb-3">
              <AlertCircle size={16} className="text-red-500" />
              Reportar Incidencia de Entrega
            </h3>
            
            <form onSubmit={handleReportIncident} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1A2421]/70">Escribe el motivo del fallo:</label>
                <textarea
                  required
                  value={incidentReason}
                  onChange={e => setIncidentReason(e.target.value)}
                  placeholder="Ej: Familiar no se encontraba en el domicilio tras reiteradas llamadas..."
                  className="glass-input text-xs h-24 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="glass-button font-bold text-xs py-3 rounded-xl border border-gray-200 text-gray-600"
                >
                  Atrás
                </button>
                <InteractiveHoverButton
                  type="submit"
                  className="py-3 text-xs"
                >
                  Registrar Fallo
                </InteractiveHoverButton>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
