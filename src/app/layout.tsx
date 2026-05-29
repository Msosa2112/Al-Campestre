import type { Metadata } from "next";
import "./globals.css";
import NavigationHeader from "@/components/NavigationHeader";
import BottomNavigation from "@/components/BottomNavigation";

export const metadata: Metadata = {
  title: "Restaurant Al Campestre - Envíos a Cuba",
  description: "Comercio electrónico y logística de envíos rápidos a Cuba con cero fricción.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen flex flex-col relative bg-gradient-to-br from-[#F3F8F5] via-[#EAF5EE] to-[#DDF2E4] text-[#1A2421]">
        {/* Blobs de fondo líquido premium (tonos arena y terracota suave) */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-10]">
          <div className="bg-liquid-blob-1" />
          <div className="bg-liquid-blob-2" />
        </div>


        
        <NavigationHeader />
        
        {/* Contenedor principal */}
        <main className="flex-1 flex flex-col z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-24 sm:pb-28">
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </main>

        <BottomNavigation />
      </body>
    </html>
  );
}
