'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Truck, AlertOctagon, Key } from 'lucide-react';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Inventario Móvil',
      href: '/admin/inventory',
      icon: Layers
    },
    {
      name: 'Despacho Logístico',
      href: '/admin/dispatch',
      icon: Truck
    },
    {
      name: 'Gestión de Incidencias',
      href: '/admin/incidents',
      icon: AlertOctagon
    }
  ];

  return (
    <div className="flex-1 flex flex-col gap-6">
      
      {/* Admin Subheader Navigation */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
            <Key size={20} className="text-[#D95D39]" /> Panel de Administración
          </h1>
          <p className="text-xs text-emerald-950/60 font-semibold">
            Monitoreo en tiempo real del restaurante, despachos de choferes y reembolsos.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-950/5 p-1 rounded-xl">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-emerald-950 shadow-sm border border-emerald-500/10'
                    : 'text-emerald-950/60 hover:text-emerald-950 hover:bg-white/30'
                }`}
              >
                <Icon size={14} />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>

    </div>
  );
}
