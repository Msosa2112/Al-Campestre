'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ShieldCheck, Truck, RotateCcw, Utensils, Menu, X } from 'lucide-react';
import { initializeDb } from '@/lib/dbMock';

export default function NavigationHeader() {
  const pathname = usePathname();
  const [activeRole, setActiveRole] = useState<'client' | 'admin' | 'delivery'>('client');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    initializeDb();
    if (pathname.startsWith('/admin')) {
      setActiveRole('admin');
    } else if (pathname.startsWith('/delivery')) {
      setActiveRole('delivery');
    } else {
      setActiveRole('client');
    }
  }, [pathname]);

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      if (confirm('¿Restablecer todos los datos del MVP simulado a los valores predeterminados?')) {
        localStorage.clear();
        initializeDb();
        window.location.reload();
      }
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="glass-panel px-5 py-3.5 mb-6 flex justify-between items-center sticky top-4 z-50">
      
      {/* Brand logo (aligned with logo brand colors) */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="bg-gradient-to-br from-[#D95D39] to-[#C24C2A] text-white p-2.5 rounded-2xl border border-white/40 shadow-sm group-hover:scale-105 transition-transform duration-200">
          <Utensils size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#2B2521] to-[#C24C2A] bg-clip-text text-transparent">
            Al Campestre
          </span>
          <span className="text-[10px] font-extrabold block text-[#D95D39] -mt-1">
            Envíos a Cuba · MVP
          </span>
        </div>
      </Link>

      {/* Hamburger Toggle Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="glass-button p-2.5 rounded-xl border-[#D95D39]/15 text-[#D95D39] hover:bg-[#D95D39]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Cambiar de Rol / Configuración"
        >
          <Menu size={18} />
          <span className="text-xs font-bold hidden sm:inline text-[#2B2521]">Perfiles</span>
        </button>
      </div>

      {/* Sliding Side Drawer for Roles (Hamburger Menu) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-[#2B2521]/10 backdrop-blur-xs transition-opacity"
            onClick={closeMenu}
          />

          {/* Drawer Content */}
          <div className="w-full max-w-sm h-full bg-white/95 backdrop-blur-md border-l border-[#8C6239]/10 shadow-2xl p-6 flex flex-col justify-between z-10 animate-slideIn">
            
            <div>
              {/* Header inside drawer */}
              <div className="flex justify-between items-center pb-4 border-b border-[#8C6239]/10 mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-[#2B2521] flex items-center gap-1.5">
                    ⚙️ Panel de Control
                  </h3>
                  <p className="text-[10px] text-[#2B2521]/50 font-semibold mt-0.5">Intercambia entre perfiles del MVP</p>
                </div>
                <button
                  onClick={closeMenu}
                  className="text-[#2B2521]/60 hover:text-[#2B2521] p-1.5 rounded-full hover:bg-[#8C6239]/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Roles switcher list */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/"
                  onClick={closeMenu}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    activeRole === 'client'
                      ? 'bg-[#D95D39]/10 border-[#D95D39] shadow-sm text-[#D95D39] font-extrabold'
                      : 'bg-white/40 border-white/60 hover:bg-white/70 text-[#2B2521]/70 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#D95D39]/15 text-[#D95D39] flex items-center justify-center">
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <p className="text-xs">Cliente (EE.UU.)</p>
                      <p className="text-[9px] text-[#2B2521]/50 font-normal">Tienda de cara al comprador</p>
                    </div>
                  </div>
                  {activeRole === 'client' && (
                    <span className="w-2 h-2 rounded-full bg-[#D95D39]" />
                  )}
                </Link>

                <Link
                  href="/admin/dispatch"
                  onClick={closeMenu}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    activeRole === 'admin'
                      ? 'bg-[#D95D39]/10 border-[#D95D39] shadow-sm text-[#D95D39] font-extrabold'
                      : 'bg-white/40 border-white/60 hover:bg-white/70 text-[#2B2521]/70 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#D95D39]/15 text-[#D95D39] flex items-center justify-center">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <p className="text-xs">Administrador</p>
                      <p className="text-[9px] text-[#2B2521]/50 font-normal">Inventario, despacho e incidencias</p>
                    </div>
                  </div>
                  {activeRole === 'admin' && (
                    <span className="w-2 h-2 rounded-full bg-[#D95D39]" />
                  )}
                </Link>

                <Link
                  href="/delivery"
                  onClick={closeMenu}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    activeRole === 'delivery'
                      ? 'bg-[#D95D39]/10 border-[#D95D39] shadow-sm text-[#D95D39] font-extrabold'
                      : 'bg-white/40 border-white/60 hover:bg-white/70 text-[#2B2521]/70 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#D95D39]/15 text-[#D95D39] flex items-center justify-center">
                      <Truck size={16} />
                    </div>
                    <div>
                      <p className="text-xs">Repartidor (PWA)</p>
                      <p className="text-[9px] text-[#2B2521]/50 font-normal">Hitos de entrega offline-first</p>
                    </div>
                  </div>
                  {activeRole === 'delivery' && (
                    <span className="w-2 h-2 rounded-full bg-[#D95D39]" />
                  )}
                </Link>
              </div>
            </div>

            {/* Bottom Actions inside drawer */}
            <div className="flex flex-col gap-3 pt-6 border-t border-[#8C6239]/10">
              <div className="bg-[#D95D39]/5 p-3 rounded-2xl text-[10px] text-[#2B2521]/70 border border-[#D95D39]/5">
                <span className="font-bold text-[#D95D39] block mb-0.5">Modo de Demostración:</span>
                Puedes cambiar de rol en cualquier momento para ver cómo se comunican las pantallas entre sí en tiempo real.
              </div>

              <button
                onClick={handleReset}
                className="glass-button w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold border-white/50 text-[#2B2521] hover:bg-rose-500/10 hover:text-rose-700 hover:border-rose-500/25 cursor-pointer"
              >
                <RotateCcw size={14} />
                Reiniciar Datos del MVP
              </button>
            </div>

          </div>

        </div>
      )}

    </header>
  );
}
