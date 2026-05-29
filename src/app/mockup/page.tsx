"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Home, Search, Sparkles, ClipboardList, User, Wifi, Battery, Signal } from 'lucide-react';

// ==========================================
// TIPADOS DE TYPESCRIPT
// ==========================================
interface NavItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  isProminent?: boolean;
}

// Actualizado a los 5 ítems de la imagen de referencia
const NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: Home, label: 'Inicio' },
  { id: 'search', icon: Search, label: 'Buscar' },
  { id: 'assistant', icon: Sparkles, label: 'Asistente IA', isProminent: true },
  { id: 'orders', icon: ClipboardList, label: 'Pedidos' },
  { id: 'profiles', icon: User, label: 'Perfiles' },
];

export default function PhoneMockup() {
  // Estado para simular interactividad
  const [activeTab, setActiveTab] = useState<string>('home');

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans selection:bg-[#214D35]/30">
      
      {/* ==========================================
          ESTILOS GLOBALES / TAILWIND V4 INLINE
      ========================================== */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .x-pattern {
          background-image: 
            linear-gradient(to bottom right, transparent calc(50% - 1px), #9ca3af calc(50% - 1px), #9ca3af calc(50% + 1px), transparent calc(50% + 1px)),
            linear-gradient(to top right, transparent calc(50% - 1px), #9ca3af calc(50% - 1px), #9ca3af calc(50% + 1px), transparent calc(50% + 1px));
        }

        /* MAXIA DA FUSIÓN: Máscaras radiais para crear curvas invertidas */
        .fusion-bottom-left {
          -webkit-mask-image: radial-gradient(circle at top left, transparent 7.5px, black 8px);
          mask-image: radial-gradient(circle at top left, transparent 7.5px, black 8px);
        }
        .fusion-bottom-right {
          -webkit-mask-image: radial-gradient(circle at top right, transparent 7.5px, black 8px);
          mask-image: radial-gradient(circle at top right, transparent 7.5px, black 8px);
        }
      `}} />

      {/* MARCO EXTERIOR DO TELÉFONO (VERMELLO) */}
      <div className="relative w-[340px] h-[680px] bg-[#E53935] rounded-[3.5rem] p-3 shadow-2xl border-2 border-red-800">
        
        {/* Botóns físicos laterais */}
        <div className="absolute top-24 -left-1 w-1 h-12 bg-red-900 rounded-l-md"></div>
        <div className="absolute top-40 -left-1 w-1 h-12 bg-red-900 rounded-l-md"></div>
        <div className="absolute top-32 -right-1 w-1 h-16 bg-red-900 rounded-r-md"></div>

        {/* PANTALLA BASE (Bordo negro interno e bisel branco) */}
        <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden border-4 border-gray-900 p-[6px]">
          
          {/* ==========================================
              ÁREA GRIS DESLIZABLE (SCROLL)
          ========================================== */}
          <div className="relative w-full h-full bg-[#b8babb] rounded-[2.1rem] overflow-y-auto hide-scrollbar shadow-inner">
            <div className="min-h-[1200px] w-full p-4 flex flex-col gap-4 pt-16 pb-32">
              
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center text-white text-sm font-medium bg-black/20 rounded-full py-2 px-4 w-fit mx-auto backdrop-blur-md"
              >
                Pasa cara abaixo ↓
              </motion.p>

              {/* Contido simulado (X) */}
              <div className="w-full h-80 border-2 border-gray-400 rounded-2xl x-pattern relative bg-[#c8cace]"></div>
              <div className="w-full h-40 border-2 border-gray-400 rounded-2xl x-pattern relative bg-[#c8cace]"></div>
              <div className="w-full h-80 border-2 border-gray-400 rounded-2xl x-pattern relative bg-[#c8cace]"></div>
              
            </div>
          </div>

          {/* ==========================================
              CÁMARA FRONTAL (Estilo Punch-Hole)
          ========================================== */}
          <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-[14px] h-[14px] bg-gray-900 rounded-full z-20 border border-gray-800 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]"></div>

          {/* Hora e Iconas de estado */}
          <div className="absolute top-4 left-6 z-20 pointer-events-none">
            <span className="text-[13px] font-semibold text-gray-800 tracking-tight">09:00</span>
          </div>
          <div className="absolute top-4 right-5 z-20 flex items-center gap-1.5 text-gray-800 pointer-events-none">
            <Signal size={13} strokeWidth={2.5} />
            <Wifi size={13} strokeWidth={2.5} />
            <Battery size={15} strokeWidth={2.5} />
          </div>

          {/* ==========================================
              BARRA DE NAVEGACIÓN INFERIOR (ESTILO ANTIGRAVITY)
          ========================================== */}
          <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 z-20">
            {/* Contenedor principal: Restaurado al tamaño estrecho original para recuperar el aire y la fusión */}
            <div className="w-[220px] h-[52px] bg-white rounded-t-[1.15rem] flex justify-between items-center px-2.5 relative shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
                
              {/* Esquinas cóncavas inferiores (Fusión) */}
              <div className="absolute bottom-0 -left-2 w-2 h-2 bg-white fusion-bottom-left pointer-events-none"></div>
              <div className="absolute bottom-0 -right-2 w-2 h-2 bg-white fusion-bottom-right pointer-events-none"></div>

              {/* Mapeo de botones */}
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                
                // DISEÑO DEL BOTÓN PROMINENTE (ASISTENTE IA)
                if (item.isProminent) {
                  return (
                    <div key={item.id} className="relative flex flex-col items-center justify-end h-full w-[38px] pb-1">
                      <motion.button
                        onClick={() => setActiveTab(item.id)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        // bg verde oscuro, sobresale hacia arriba, sombra fuerte
                        className="absolute bottom-5 w-10 h-10 bg-[#214D35] rounded-full flex items-center justify-center text-white shadow-[0_6px_12px_rgba(33,77,53,0.25)] z-30 transition-transform"
                      >
                        <Icon size={18} strokeWidth={2} />
                      </motion.button>
                      <span className="text-[7.5px] whitespace-nowrap z-20 font-bold text-[#214D35] tracking-tight">
                        {item.label}
                      </span>
                    </div>
                  );
                }

                // DISEÑO DE BOTONES NORMALES
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center justify-center gap-[2px] w-[34px] h-full transition-colors duration-200 pt-1 ${
                      isActive ? 'text-[#214D35]' : 'text-[#628F75]'
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      
                      {/* Animación sutil de fondo para el tab activo */}
                      {isActive && (
                        <motion.div 
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 rounded-full bg-[#E5F0E9] -z-10 scale-125"
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                      )}
                    </div>
                    <span className={`text-[7.5px] tracking-tight ${isActive ? 'font-bold' : 'font-semibold'}`}>
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
