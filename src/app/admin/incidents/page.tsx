'use client';

import React, { useState, useEffect } from 'react';
import { getOrders, issueRefund, Order } from '@/lib/dbMock';
import { AlertCircle, CreditCard, Gift, ShieldAlert, CheckCircle } from 'lucide-react';

export default function AdminIncidents() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundMode, setRefundMode] = useState<'stripe' | 'credit'>('stripe');
  const [amount, setAmount] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadOrders = () => {
    setOrders(getOrders());
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders with incidents or active issues
  const incidentOrders = orders.filter(o => o.status === 'incident' || o.incident_reason);

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !amount) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > selectedOrder.total_amount) {
      alert(`Monto inválido. El reembolso no puede superar el total pagado de $${selectedOrder.total_amount.toFixed(2)}.`);
      return;
    }

    const result = issueRefund(selectedOrder.id, parsedAmount, refundMode);

    if (result.success) {
      setActionSuccess(
        `Se ha emitido con éxito un ${
          refundMode === 'stripe' ? 'reembolso de Stripe' : 'crédito en tienda'
        } por valor de $${parsedAmount.toFixed(2)} para el pedido ${selectedOrder.id}.`
      );
      setSelectedOrder(null);
      setAmount('');
      loadOrders();
    } else {
      alert('Ocurrió un error al emitir la compensación.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Incident Orders list */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="glass-panel p-5 bg-white/80">
          <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2 mb-3">
            <ShieldAlert size={18} className="text-red-500" />
            Reporte de Pedidos con Incidencia ({incidentOrders.length})
          </h2>

          {actionSuccess && (
            <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-2xl border border-green-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {incidentOrders.length === 0 ? (
            <div className="text-center py-10 bg-emerald-500/5 rounded-2xl border border-dashed border-emerald-500/10">
              <p className="text-xs text-emerald-900/60 font-semibold">No se han registrado incidencias operativas.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {incidentOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setAmount(order.total_amount.toString());
                    setActionSuccess(null);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-start gap-4 ${
                    selectedOrder?.id === order.id
                      ? 'bg-red-50/50 border-red-500'
                      : 'bg-white/40 border-white/60 hover:bg-white/70'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm text-emerald-950">{order.id}</span>
                      <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-extrabold">Incidencia</span>
                      {order.refunded && (
                        <span className="bg-rose-50 text-rose-700 text-[10px] px-1.5 py-0.5 rounded font-extrabold border border-rose-200">Reembolsado</span>
                      )}
                      {order.store_credit_issued && (
                        <span className="bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-extrabold border border-amber-200">Crédito Asignado</span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-950 font-semibold">Cliente: {order.client_name}</p>
                    <p className="text-xs text-emerald-900/60 mt-1">Familiar: {order.family_name}</p>
                    
                    {order.incident_reason && (
                      <div className="mt-2 text-xs bg-red-100/30 text-red-800 p-2.5 rounded-xl border border-red-100 flex items-start gap-1.5">
                        <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-red-500" />
                        <span><span className="font-bold">Motivo:</span> {order.incident_reason}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-emerald-950">${order.total_amount.toFixed(2)}</p>
                    <p className="text-[10px] text-emerald-900/50 mt-1">{new Date(order.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Refund processing form */}
      <div className="lg:col-span-1">
        <div className="glass-panel p-5 bg-white/90 border-emerald-500/10 h-full flex flex-col justify-between min-h-[350px]">
          {selectedOrder ? (
            <form onSubmit={handleProcessRefund} className="flex flex-col gap-4 flex-1 justify-between">
              
              <div className="flex flex-col gap-3">
                <div className="border-b border-emerald-500/10 pb-2">
                  <h3 className="text-sm font-bold text-emerald-950">Procesar Compensación</h3>
                  <p className="text-[10px] text-emerald-900/50 font-semibold mt-0.5">Pedido Seleccionado: {selectedOrder.id}</p>
                </div>

                <div className="bg-emerald-950/5 p-3 rounded-xl text-xs flex flex-col gap-1.5 text-emerald-950">
                  <p><span className="font-bold">Importe original:</span> ${selectedOrder.total_amount.toFixed(2)}</p>
                  <p><span className="font-bold">ID Transacción Stripe:</span> {selectedOrder.stripe_payment_id.substring(0, 15)}...</p>
                  <p><span className="font-bold">Familiar Receptor:</span> {selectedOrder.family_name}</p>
                </div>

                {/* Refund Mode Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-emerald-950/70">Forma de Compensación:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRefundMode('stripe')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition ${
                        refundMode === 'stripe'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 shadow-sm'
                          : 'bg-white/40 border-white/60 text-emerald-950/60 hover:bg-white/70'
                      }`}
                    >
                      <CreditCard size={14} />
                      Stripe Refund
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setRefundMode('credit')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition ${
                        refundMode === 'credit'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 shadow-sm'
                          : 'bg-white/40 border-white/60 text-emerald-950/60 hover:bg-white/70'
                      }`}
                    >
                      <Gift size={14} />
                      Crédito Tienda
                    </button>
                  </div>
                </div>

                {/* Refund amount input */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-emerald-950/70">Monto a Compensar ($ USD):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    max={selectedOrder.total_amount}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="glass-input text-sm font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="glass-button-primary py-2.5 text-xs font-bold mt-4"
              >
                Confirmar {refundMode === 'stripe' ? 'Reembolso Stripe' : 'Asignar Crédito'}
              </button>

            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/20 rounded-2xl border border-dashed border-emerald-500/10">
              <span className="text-4xl mb-3">🛠️</span>
              <h3 className="text-sm font-bold text-emerald-950">Resolución de Incidentes</h3>
              <p className="text-xs text-emerald-950/50 mt-1 max-w-[180px] leading-relaxed">
                Selecciona un pedido con incidencia en la lista de la izquierda para emitir reembolsos en Stripe o crédito de tienda.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
