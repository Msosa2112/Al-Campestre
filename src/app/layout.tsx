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

        {/* Marco (Bezel) global de color blanco con esquinas redondeadas hacia adentro */}
        <div className="fixed inset-0 pointer-events-none z-[45]">
          {/* Bordes del marco */}
          <div className="absolute top-0 left-0 right-0 h-3 sm:h-4 bg-white" />
          <div className="absolute bottom-0 left-0 right-0 h-3 sm:h-4 bg-white" />
          <div className="absolute top-0 bottom-0 left-0 w-3 sm:w-4 bg-white" />
          <div className="absolute top-0 bottom-0 right-0 w-3 sm:w-4 bg-white" />

          {/* Esquinas cóncavas para recortar el fondo del contenido */}
          {/* Top-Left */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 w-6 h-6 rounded-tl-2xl bg-transparent shadow-[-20px_-20px_0_20px_#ffffff]" />
          {/* Top-Right */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-6 h-6 rounded-tr-2xl bg-transparent shadow-[20px_-20px_0_20px_#ffffff]" />
          {/* Bottom-Left */}
          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 w-6 h-6 rounded-bl-2xl bg-transparent shadow-[-20px_20px_0_20px_#ffffff]" />
          {/* Bottom-Right */}
          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-6 h-6 rounded-br-2xl bg-transparent shadow-[20px_20px_0_20px_#ffffff]" />
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
