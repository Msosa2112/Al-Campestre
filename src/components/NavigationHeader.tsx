'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ShieldCheck, Truck, RotateCcw, Utensils, Menu, X, Settings, Sparkles } from 'lucide-react';
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

  const handleReset = async () => {
    if (typeof window !== 'undefined') {
      if (confirm('¿Restablecer todos los datos en Supabase a los valores predeterminados de fábrica?')) {
        try {
          localStorage.clear();
          await initializeDb(true);
          window.location.reload();
        } catch (err) {
          console.error("Error resetting Supabase:", err);
          alert("Disculpe, ocurrió un error al comunicarse con la base de datos.");
        }
      }
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  const handleToggleAi = () => {
    if (pathname !== '/') {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('open-ai-assistant', 'true');
      }
      window.location.href = '/';
    } else {
      window.dispatchEvent(new CustomEvent('toggle-ai-assistant'));
    }
  };

  return (
    <header className="sticky top-3 sm:top-5 left-0 right-0 z-50 flex justify-between items-center bg-transparent border-0 p-0 m-0 shadow-none h-0 overflow-visible sm:glass-panel sm:w-full sm:px-4 sm:py-3 sm:mb-0 sm:my-4 sm:mx-auto sm:max-w-7xl sm:px-6 sm:py-4 sm:rounded-3xl sm:border sm:mb-6 transition-all duration-300">
      
      {/* Brand logo (aligned with logo brand colors) */}
      <Link href="/" className="hidden sm:flex items-center gap-3 group">
        <div className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] text-white p-2.5 rounded-2xl border border-white/40 shadow-sm group-hover:scale-105 transition-transform duration-200">
          <Utensils size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#1A2421] to-[#1B4332] bg-clip-text text-transparent">
            Al Campestre
          </span>
          <span className="text-[10px] font-extrabold block text-[#2D6A4F] -mt-1">
            Envíos a Cuba · MVP
          </span>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={handleToggleAi}
          className="glass-button p-2.5 rounded-xl border-[#2D6A4F]/15 text-[#2D6A4F] hover:bg-[#2D6A4F]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Asistente de Compra con IA"
        >
          <Sparkles size={18} className="text-[#2D6A4F] animate-pulse" />
          <span className="text-xs font-bold hidden sm:inline text-[#1A2421]">Asistente IA</span>
        </button>

        <button
          id="profile-menu-trigger"
          onClick={() => setIsMenuOpen(true)}
          className="glass-button p-2.5 rounded-xl border-[#2D6A4F]/15 text-[#2D6A4F] hover:bg-[#2D6A4F]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Cambiar de Rol / Configuración"
        >
          <Menu size={18} />
          <span className="text-xs font-bold hidden sm:inline text-[#1A2421]">Perfiles</span>
        </button>
      </div>

      {/* Sliding Side Drawer for Roles (Hamburger Menu) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-[#1A2421]/10 backdrop-blur-xs transition-opacity"
            onClick={closeMenu}
          />

          {/* Drawer Content */}
          <div className="w-full max-w-sm h-full bg-white/95 backdrop-blur-md border-l border-[#40916C]/10 shadow-2xl p-6 flex flex-col justify-between z-10 animate-slideIn">
            
            <div>
              {/* Header inside drawer */}
              <div className="flex justify-between items-center pb-4 border-b border-[#40916C]/10 mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-[#1A2421] flex items-center gap-1.5">
                    <Settings size={18} className="text-[#2D6A4F]" /> Panel de Control
                  </h3>
                  <p className="text-[10px] text-[#1A2421]/50 font-semibold mt-0.5">Intercambia entre perfiles del MVP</p>
                </div>
                <button
                  onClick={closeMenu}
                  className="text-[#1A2421]/60 hover:text-[#1A2421] p-1.5 rounded-full hover:bg-[#40916C]/10 transition-colors cursor-pointer"
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
                      ? 'bg-[#2D6A4F]/10 border-[#2D6A4F] shadow-sm text-[#2D6A4F] font-extrabold'
                      : 'bg-white/40 border-white/60 hover:bg-white/70 text-[#1A2421]/70 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#2D6A4F]/15 text-[#2D6A4F] flex items-center justify-center">
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <p className="text-xs">Cliente (EE.UU.)</p>
                      <p className="text-[9px] text-[#1A2421]/50 font-normal">Tienda de cara al comprador</p>
                    </div>
                  </div>
                  {activeRole === 'client' && (
                    <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                  )}
                </Link>

                <Link
                  href="/admin/dispatch"
                  onClick={closeMenu}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    activeRole === 'admin'
                      ? 'bg-[#2D6A4F]/10 border-[#2D6A4F] shadow-sm text-[#2D6A4F] font-extrabold'
                      : 'bg-white/40 border-white/60 hover:bg-white/70 text-[#1A2421]/70 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#2D6A4F]/15 text-[#2D6A4F] flex items-center justify-center">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <p className="text-xs">Administrador</p>
                      <p className="text-[9px] text-[#1A2421]/50 font-normal">Inventario, despacho e incidencias</p>
                    </div>
                  </div>
                  {activeRole === 'admin' && (
                    <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                  )}
                </Link>

                <Link
                  href="/delivery"
                  onClick={closeMenu}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    activeRole === 'delivery'
                      ? 'bg-[#2D6A4F]/10 border-[#2D6A4F] shadow-sm text-[#2D6A4F] font-extrabold'
                      : 'bg-white/40 border-white/60 hover:bg-white/70 text-[#1A2421]/70 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#2D6A4F]/15 text-[#2D6A4F] flex items-center justify-center">
                      <Truck size={16} />
                    </div>
                    <div>
                      <p className="text-xs">Repartidor (PWA)</p>
                      <p className="text-[9px] text-[#1A2421]/50 font-normal">Hitos de entrega offline-first</p>
                    </div>
                  </div>
                  {activeRole === 'delivery' && (
                    <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                  )}
                </Link>
              </div>
            </div>

            {/* Bottom Actions inside drawer */}
            <div className="flex flex-col gap-3 pt-6 border-t border-[#40916C]/10">
              <div className="bg-[#2D6A4F]/5 p-3 rounded-2xl text-[10px] text-[#1A2421]/70 border border-[#2D6A4F]/5">
                <span className="font-bold text-[#2D6A4F] block mb-0.5">Modo de Demostración:</span>
                Puedes cambiar de rol en cualquier momento para ver cómo se comunican las pantallas entre sí en tiempo real.
              </div>

              <button
                onClick={handleReset}
                className="glass-button w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold border-white/50 text-[#1A2421] hover:bg-rose-500/10 hover:text-rose-700 hover:border-rose-500/25 cursor-pointer"
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
