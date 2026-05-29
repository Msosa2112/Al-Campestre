"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Home, Search, Sparkles, ClipboardList, User } from 'lucide-react';

// ==========================================
// TIPADOS DE TYPESCRIPT
// ==========================================
interface NavItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  isProminent?: boolean;
  href: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function BottomNavigation() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>('home');

  // Ocultar la barra de navegación en las vistas de administrador o repartidor
  const isClientRoute = !pathname.startsWith('/admin') && !pathname.startsWith('/delivery');

  useEffect(() => {
    if (pathname === '/chat') {
      setActiveTab('assistant');
    } else if (pathname === '/') {
      // Por defecto en la página de inicio, pero puede ser "buscar" o "pedidos" según URL/scroll
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('search') === 'true') {
          setActiveTab('search');
        } else if (searchParams.get('orders') === 'true') {
          setActiveTab('orders');
        } else {
          setActiveTab('home');
        }
      }
    } else {
      setActiveTab('home');
    }
  }, [pathname]);

  if (!isClientRoute) return null;

  const handleSearchClick = (e: React.MouseEvent) => {
    setActiveTab('search');
    if (pathname === '/') {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInput.focus();
      }
    }
  };

  const handleOrdersClick = (e: React.MouseEvent) => {
    setActiveTab('orders');
    if (pathname === '/') {
      e.preventDefault();
      const ordersSection = document.getElementById('orders-tracking');
      if (ordersSection) {
        ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        alert("No tienes pedidos activos para rastrear.");
      }
    }
  };

  const handleProfilesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const trigger = document.getElementById('profile-menu-trigger');
    if (trigger) {
      trigger.click();
    }
  };

  const NAV_ITEMS: NavItem[] = [
    { id: 'home', icon: Home, label: 'Inicio', href: '/' },
    { id: 'search', icon: Search, label: 'Buscar', href: '/?search=true', onClick: handleSearchClick },
    { id: 'assistant', icon: Sparkles, label: 'Asistente IA', href: '/chat', isProminent: true },
    { id: 'orders', icon: ClipboardList, label: 'Pedidos', href: '/?orders=true', onClick: handleOrdersClick },
    { id: 'profiles', icon: User, label: 'Perfiles', href: '#', onClick: handleProfilesClick },
  ];

  return (
    <>
      {/* Estilos para las máscaras de fusión (Melted Effect) */}
      <style dangerouslySetInnerHTML={{__html: `
        /* MAGIA DE LA FUSIÓN: Máscaras radiales para crear curvas invertidas */
        .fusion-bottom-left {
          -webkit-mask-image: radial-gradient(circle at top left, transparent 7.5px, black 8px);
          mask-image: radial-gradient(circle at top left, transparent 7.5px, black 8px);
        }
        .fusion-bottom-right {
          -webkit-mask-image: radial-gradient(circle at top right, transparent 7.5px, black 8px);
          mask-image: radial-gradient(circle at top right, transparent 7.5px, black 8px);
        }
      `}} />

      {/* Wrapper fijo al fondo de la pantalla real */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-3 sm:pb-4">
        {/* Contenedor principal de la nav bar.
          pointer-events-auto permite hacer click. 
        */}
        <div className="w-[290px] h-[58px] bg-white rounded-t-[1.15rem] flex justify-between items-center px-2 relative shadow-[0_-10px_25px_rgba(0,0,0,0.06)] border-x border-t border-[#2D6A4F]/10 pointer-events-auto">
            
          {/* Esquinas cóncavas inferiores (Fusión de 8px contra el borde del dispositivo) */}
          <div className="absolute bottom-0 -left-2 w-2 h-2 bg-white fusion-bottom-left pointer-events-none"></div>
          <div className="absolute bottom-0 -right-2 w-2 h-2 bg-white fusion-bottom-right pointer-events-none"></div>

          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            // DISEÑO DEL BOTÓN PROMINENTE (ASISTENTE IA)
            if (item.isProminent) {
              return (
                <div key={item.id} className="relative flex flex-col items-center justify-end h-full w-[54px] pb-1">
                  <Link href={item.href} onClick={item.onClick} className="no-underline">
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute bottom-[18px] left-1/2 -translate-x-1/2 w-[50px] h-[50px] bg-[#2D6A4F] rounded-full flex items-center justify-center text-white shadow-[0_6px_12px_rgba(45,106,79,0.3)] z-30 transition-transform cursor-pointer"
                    >
                      <Icon size={22} strokeWidth={2} />
                    </motion.div>
                  </Link>
                  <span className="text-[9px] font-bold text-[#2d6a4f] whitespace-nowrap z-20">
                    {item.label}
                  </span>
                </div>
              );
            }

            // DISEÑO DE BOTONES NORMALES
            return (
              <Link key={item.id} href={item.href} onClick={item.onClick} className="no-underline">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center justify-center gap-[2px] w-[46px] h-full transition-colors duration-200 pt-1 cursor-pointer ${
                    isActive ? 'text-[#2D6A4F]' : 'text-[#628F75]'
                  }`}
                >
                  <div className="relative flex items-center justify-center h-[26px]">
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 rounded-full bg-[#EAF5EF] -z-10 scale-125"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                  </div>
                  <span className={`text-[9px] tracking-tight ${isActive ? 'font-bold' : 'font-semibold'}`}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}

        </div>
      </div>
    </>
  );
}
