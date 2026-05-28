import type { Metadata } from "next";
import "./globals.css";
import NavigationHeader from "@/components/NavigationHeader";

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
      <body className="antialiased min-h-screen flex flex-col relative">
        {/* Blobs de fondo líquido */}
        <div className="bg-liquid-blob-1" />
        <div className="bg-liquid-blob-2" />
        
        {/* Contenedor principal */}
        <main className="flex-1 flex flex-col z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <NavigationHeader />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
