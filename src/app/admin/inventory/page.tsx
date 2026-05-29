'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getProducts, saveProduct, addProductStock, Product } from '@/lib/dbMock';
import { Scan, Plus, ImageIcon, AlertCircle, Sparkles, Camera } from 'lucide-react';
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { CustomSelect } from "@/components/ui/custom-select";


export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [scannedBarcode, setScannedBarcode] = useState('');
  
  // States for Scanning Simulation
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  
  // Form States
  const [isNewProductForm, setIsNewProductForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    stock: '',
    barcode: '',
    image_url: '',
    category: 'Granos',
    cleanBackground: true // remove.bg mockup
  });
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isClearingBg, setIsClearingBg] = useState(false);

  useEffect(() => {
    const loadProductsData = async () => {
      try {
        const prods = await getProducts();
        setProducts(prods);
      } catch (err) {
        console.error('Error loading products:', err);
      }
    };
    loadProductsData();
  }, []);

  const handleSimulatedScan = (barcode: string) => {
    if (!barcode) return;
    setIsScanning(true);
    setScanMessage('Enfocando cámara...');
    
    setTimeout(() => {
      setScanMessage(`Código de barras leído: ${barcode}`);
      setTimeout(() => {
        setIsScanning(false);
        setScannedBarcode(barcode);
        processScannedBarcode(barcode);
      }, 800);
    }, 1000);
  };

  const processScannedBarcode = async (barcode: string) => {
    const existing = products.find(p => p.barcode === barcode);
    
    if (existing) {
      // Exist: sum 10 items or increment stock
      const result = await addProductStock(barcode, 10);
      if (result.success && result.product) {
        const updated = await getProducts();
        setProducts(updated);
        alert(`¡Producto Existente! Se sumaron +10 unidades de stock a "${result.product.name}". Nuevo stock: ${result.product.stock}`);
      }
    } else {
      // New: open form
      alert('¡Código de barras NO registrado! Abriendo formulario para registrar nuevo producto.');
      setFormData({
        id: `prod-${Date.now()}`,
        name: '',
        description: '',
        price: '',
        stock: '10',
        barcode: barcode,
        image_url: '',
        category: 'Abarrotes',
        cleanBackground: true
      });
      setPhotoPreview(null);
      setIsNewProductForm(true);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        
        if (formData.cleanBackground) {
          setIsClearingBg(true);
          // Simulate remove.bg background removal API
          setTimeout(() => {
            setIsClearingBg(false);
            // Replace with a clean high-quality simulated background cut-out image
            setPhotoPreview('https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80');
            setFormData(prev => ({
              ...prev,
              image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'
            }));
          }, 2000);
        } else {
          setFormData(prev => ({
            ...prev,
            image_url: base64
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(formData.price);
    const stockNum = parseInt(formData.stock);
    
    if (isNaN(priceNum) || isNaN(stockNum) || !formData.name || !formData.barcode) {
      alert('Por favor complete todos los datos correctamente.');
      return;
    }

    const newProd: Product = {
      id: formData.id,
      name: formData.name,
      description: formData.description,
      price: priceNum,
      stock: stockNum,
      barcode: formData.barcode,
      image_url: formData.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80', // default fallback
      category: formData.category
    };

    const updated = await saveProduct(newProd);
    setProducts(updated);
    setIsNewProductForm(false);
    setScannedBarcode('');
    alert(`¡Producto "${newProd.name}" registrado con éxito!`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Barcode scanner simulator */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="glass-panel p-5 flex flex-col gap-4">
          <h2 className="text-lg font-extrabold text-[#1A2421] flex items-center gap-2">
            <Scan size={18} className="text-[#40916C]" />
            Escáner de Inventario Móvil
          </h2>
          <p className="text-xs text-[#1A2421]/60 leading-relaxed">
            Escanea códigos de barras para sumar existencias. Si el producto no existe, creará uno nuevo automáticamente.
          </p>

          {/* Camera Frame Mockup (Mitad superior de la pantalla en móvil) */}
          <div className="h-48 md:h-56 bg-[#1A2421] rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border-2 border-[#2D6A4F]/20 shadow-inner">
            {isScanning ? (
              <div className="text-center flex flex-col items-center gap-3 px-6 animate-pulse">
                <Camera size={32} className="text-white/60 mb-1" />
                <p className="text-xs font-bold text-white tracking-wider">{scanMessage}</p>
                <div className="w-12 h-1 bg-[#2D6A4F] rounded-full animate-bounce mt-1" />
              </div>
            ) : (
              <div className="text-center flex flex-col items-center gap-2 px-6">
                <Camera size={36} className="text-[#2D6A4F] mb-1" />
                <p className="text-xs text-white font-bold">Cámara de escaneo inactiva</p>
                <p className="text-[10px] text-white/50 mt-1 max-w-[180px]">Utiliza el simulador de abajo para disparar la lectura de códigos</p>
              </div>
            )}

            {/* Simulated red/terracota laser scanning line */}
            {isScanning && (
              <div className="absolute left-0 right-0 h-0.5 bg-[#2D6A4F] shadow-md shadow-[#2D6A4F]/80 animate-bounce" style={{ top: '50%' }} />
            )}
          </div>

          {(() => {
            const scanningOptions = [
              {
                label: "Existentes en Catálogo",
                options: products.map(p => ({ value: p.barcode, label: `${p.name} (${p.barcode})` }))
              },
              {
                label: "Nuevo Código (Simula Registro)",
                options: [
                  { value: "7501020504013", label: "Café Serrano 500g (Nuevo)" },
                  { value: "7501020504020", label: "Arroz Extra Sabanero 1kg (Nuevo)" }
                ]
              }
            ];
            return (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#1A2421]/70">Disparar Escaneo (Simulación de Códigos):</label>
                <CustomSelect
                  options={scanningOptions}
                  value=""
                  onChange={handleSimulatedScan}
                  placeholder="-- Selecciona un código de barras --"
                  triggerClassName="text-xs font-bold h-10"
                  className={isScanning ? "pointer-events-none opacity-50" : ""}
                />
              </div>
            );
          })()}

          {scannedBarcode && (
            <div className="bg-[#FFFFFF] p-3 rounded-2xl text-xs border border-[#40916C]/15 flex items-center justify-between shadow-sm">
              <div>
                <span className="font-semibold text-[#1A2421]/60 block">Último Código Leído:</span>
                <span className="font-mono font-bold text-[#40916C]">{scannedBarcode}</span>
              </div>
              <span className="bg-[#2D6A4F] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">Leído</span>
            </div>
          )}
        </div>
      </div>

      {/* Form or stock visual listing (Mitad inferior de la pantalla en móvil) */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        
        {isNewProductForm ? (
          <div className="glass-panel p-6 flex flex-col gap-4 bg-white/90">
            <div className="flex justify-between items-center pb-2 border-b border-[#40916C]/10">
              <h2 className="text-lg font-extrabold text-[#1A2421] flex items-center gap-1.5">
                <Plus size={18} className="text-[#40916C]" />
                Registrar Nuevo Producto
              </h2>
              <button
                onClick={() => setIsNewProductForm(false)}
                className="text-xs font-bold text-[#1A2421]/60 hover:text-[#1A2421]"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-3">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#1A2421]/70">Nombre del Producto</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Refresco de Cola 1.5L"
                    className="glass-input text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#1A2421]/70">Código de Barras</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={formData.barcode}
                    className="glass-input text-sm bg-gray-50 font-mono font-bold text-[#40916C]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1A2421]/70">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalles sobre el producto..."
                  className="glass-input text-sm h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#1A2421]/70">Precio ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="1.50"
                    className="glass-input text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#1A2421]/70">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    className="glass-input text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#1A2421]/70">Categoría</label>
                  <CustomSelect
                    options={[
                      { value: "Granos", label: "Granos" },
                      { value: "Carnes", label: "Carnes" },
                      { value: "Abarrotes", label: "Abarrotes" },
                      { value: "Lácteos", label: "Lácteos" }
                    ]}
                    value={formData.category}
                    onChange={val => setFormData({ ...formData, category: val })}
                    triggerClassName="text-sm font-bold h-10"
                  />
                </div>
              </div>

              {/* Photo Background removal option */}
              <div className="bg-[#2D6A4F]/5 p-4 rounded-2xl border border-[#2D6A4F]/10 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#1A2421] flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-[#40916C]" />
                    Fotografía del Producto
                  </h3>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-[#40916C]">
                    <input
                      type="checkbox"
                      checked={formData.cleanBackground}
                      onChange={e => setFormData({ ...formData, cleanBackground: e.target.checked })}
                      className="rounded text-[#2D6A4F] focus:ring-[#2D6A4F]"
                    />
                    <Sparkles size={10} className="text-[#2D6A4F]" />
                    Limpiar fondo (remove.bg API)
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-[#1A2421]/70 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#2D6A4F]/10 file:text-[#2D6A4F] hover:file:bg-[#2D6A4F]/20"
                  />

                  {photoPreview && (
                    <div className="w-16 h-16 rounded-xl border border-[#40916C]/20 overflow-hidden bg-white flex items-center justify-center relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoPreview} alt="Vista previa" className="w-full h-full object-cover" />
                      {isClearingBg && (
                        <div className="absolute inset-0 bg-[#1A2421]/40 flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                          Recortando...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <InteractiveHoverButton
                type="submit"
                className="w-full text-sm mt-2"
              >
                Guardar Producto
              </InteractiveHoverButton>

            </form>
          </div>
        ) : (
          <div className="glass-panel p-5">
            <h2 className="text-lg font-bold text-[#1A2421] mb-4">Listado de Inventario de Restaurant</h2>
            
            {/* Vista Escritorio: Tabla clásica */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#40916C]/10 text-[#1A2421]/60 font-bold">
                    <th className="py-2.5">Código de Barras</th>
                    <th className="py-2.5">Producto</th>
                    <th className="py-2.5">Categoría</th>
                    <th className="py-2.5">Precio Unit.</th>
                    <th className="py-2.5">Stock Disponible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2421]/5">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-white/20 transition-colors">
                      <td className="py-3 font-mono text-xs text-[#1A2421]">{p.barcode}</td>
                      <td className="py-3 font-bold text-[#40916C]">{p.name}</td>
                      <td className="py-3 text-[#1A2421]/60 font-medium">{p.category}</td>
                      <td className="py-3 font-extrabold text-[#1A2421]">${p.price.toFixed(2)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          p.stock > 10 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : p.stock > 0 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {p.stock} unidades
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista Móvil: Lista de Tarjetas Desplazable (UX Vertical Mitad Inferior) */}
            <div className="block md:hidden flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
              {products.map(p => (
                <div key={p.id} className="p-3 bg-white/40 border border-[#40916C]/10 rounded-2xl flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center pb-1 border-b border-[#1A2421]/5">
                    <span className="font-bold text-[#40916C]">{p.name}</span>
                    <span className="font-extrabold text-[#1A2421]">${p.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#1A2421]/60 mt-1">
                    <span>Cod: <span className="font-mono">{p.barcode}</span></span>
                    <span>Categoría: {p.category}</span>
                  </div>
                  <div className="text-right mt-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.stock > 10 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : p.stock > 0 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      Stock: {p.stock} u.
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
