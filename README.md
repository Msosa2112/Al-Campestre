# Restaurant Al Campestre - MVP de Comercio Electrónico y Envíos a Cuba

Este repositorio contiene el MVP (Producto Mínimo Viable) de la plataforma de comercio electrónico y envíos a Cuba **"Restaurant Al Campestre"**, diseñada para resolver problemas críticos de inventario, logística y fricción de pagos desde el exterior.

---

## 📋 Prompt Inicial del Proyecto

A continuación, se detalla el requerimiento inicial que dio origen a este proyecto:

> Actúa como un Tech Lead Full-Stack. Vamos a construir el MVP de una plataforma de comercio electrónico y envíos a Cuba llamada "Restaurant Al Campestre". El objetivo es superar a la competencia resolviendo problemas críticos de inventario, logística y fricción de pagos.
>
> **Tech Stack:**
> - Frontend/Backend: Next.js (App Router), React, TailwindCSS.
> - Base de Datos & Auth: Supabase (PostgreSQL, pgvector para IA, Realtime, Storage).
> - Pagos: Stripe (Stripe Connect/Checkout para LLC en EE. UU.).
> - Integraciones: WhatsApp API, IA (OpenAI/Anthropic API para Chatbot), librería de escáner de códigos de barras (ej. html5-qrcode).
>
> **Arquitectura de Usuarios (3 Perfiles):**
>
> 1. **PERFIL CLIENTE (Comprador en EE.UU.)**
>    - UX de Cero Fricción: Login rápido. Al registrarse, un pop-up simple pide los datos de su "Recibidor Principal" (Ej: "Mamá", "Abuela", con dirección y teléfono en Cuba). Tendrá un menú de "Mis Familiares" para agregar más.
>    - Comercio Conversacional (IA): Integración de un chatbot (conectado a pgvector en Supabase). El cliente puede pedir en lenguaje natural (Ej: "Mándale a mi mamá 20 libras de arroz y carne"). La IA busca en el inventario, arma el paquete, cotiza el total y ofrece cerrar la venta.
>    - Checkout Ágil: Integración con Stripe para pagos en 1 clic usando tarjetas guardadas. Al pagar, el stock se descuenta estrictamente en tiempo real en Supabase para evitar vender productos sin existencias.
>
> 2. **PERFIL ADMINISTRADOR (Dashboard en el Restaurante)**
>    - Módulo de Inventario Móvil (PWA): Interfaz optimizada para móviles que usa la cámara para escanear códigos de barras. Si el producto es nuevo, abre formulario; si existe, suma stock. Opcional: Integración de API (ej. remove.bg) para limpiar fondos de fotos al subir a Supabase Storage.
>    - Módulo de Despacho Logístico: Panel que muestra a los repartidores en 3 columnas: "Disponibles", "En Ruta", "En Retorno".
>    - Gestión de Incidencias: Panel conectado a Stripe para emitir reembolsos a un clic o dar crédito en tienda si hay problemas con la orden, evitando la burocracia típica del sector.
>
> 3. **PERFIL REPARTIDOR (App Móvil / PWA offline-first)**
>    - Sincronización Asíncrona (Milestones): Debido a la baja conectividad, no usaremos rastreo GPS en tiempo real. La app funcionará por botones de estado: "Asignado" -> "En Tránsito" (dispara notificación de WhatsApp al cliente) -> "Entregado" / "Incidencia".
>    - Zonificación: Al marcar "Entregado", el sistema calcula el tiempo de retorno a la base según la zona geográfica de entrega, actualizando el panel del Administrador automáticamente.
>    - Validación de Picking: Al armar el paquete, el repartidor escanea los productos. El sistema alerta si el código de barras no coincide exactamente con la orden.
>
> **Directivas de Desarrollo para el MVP:**
> 1. Inicia configurando el esquema de base de datos en Supabase para usuarios, productos (con embeddings vectoriales), órdenes y perfiles de familiares.
> 2. Crea la estructura de rutas en Next.js para los 3 paneles (Client Storefront/Chat, Admin Dashboard, Repartidor App).
> 3. Escribe el código modular y escalable. Prioriza la concurrencia en la base de datos para el manejo de inventario.
>
> Vamos a usar un diseño moderno bien moderno, con efectos liquid glass bien limpios y sencillos, tonos claros y verdes. Esquinas redondeadas.

---

## 🛠️ Guía Paso a Paso del Desarrollo del MVP

El MVP se construyó de manera iterativa siguiendo las directivas del rol de Tech Lead Full-Stack:

### Paso 1: Inicialización y Estructura Base
1. Inicializamos un proyecto **Next.js 16 con App Router, TypeScript, y TailwindCSS v4**.
2. Estructuramos las rutas clave para cubrir los tres perfiles solicitados:
   - `/` (Cliente - Tienda principal y registro de familiares).
   - `/chat` (Cliente - Interfaz del asistente inteligente conversacional).
   - `/admin/*` (Administrador - Logística de envíos, inventario y reembolsos).
   - `/delivery` (Repartidor - Aplicación de hitos y validación de picking).

### Paso 2: Motor de Base de Datos y Servicios Simulados (Mocking)
Para permitir pruebas inmediatas sin dependencias externas ni de claves de API, creamos [dbMock.ts](src/lib/dbMock.ts):
- **Base de datos local**: Almacena en `localStorage` las tablas de productos, órdenes, perfiles de familiares y conductores de reparto.
- **Concurrencia Estricta**: Simulamos el control de concurrencia de Supabase PostgreSQL mediante funciones transaccionales locales (`createOrderWithStockCheck`) que bloquean y restan existencias atómicamente al momento del checkout de Stripe, previniendo sobreventas.
- **WhatsApp y Stripe**: Simulamos intenciones de pago en Stripe en 1-clic y el envío de notificaciones de plantillas por WhatsApp al destinatario final en Cuba mediante tosts integrados en el cliente.

### Paso 3: Definición Estética y Diseño de Marca
1. Configuración de **Outfit (Google Fonts)** en [globals.css](src/app/globals.css) y [layout.tsx](src/app/layout.tsx).
2. Diseño **Liquid Glassmorphism**: Fondo difuminado con blobs móviles de color de baja opacidad, tarjetas y botones con sombras suaves y dobles bordes de vidrio refráctil.
3. **Colores del Logotipo Oficial**: Adaptamos las variables CSS de color para coincidir exactamente con el logotipo de la marca:
   - **Verde Bosque Principal**: `#0B5D34`
   - **Gris Carbón / Antracita**: `#4A4A4A`
   - **Fondo de Contraste**: `#fbfcfb`

### Paso 4: Encapsulado en Menú de Hamburguesa
Para que la tienda del cliente se sienta como una aplicación real orientada al consumidor final, escondimos las rutas administrativas y del chofer en un menú de hamburguesa flotante en la cabecera. Al hacer clic, se abre una barra lateral de control para cambiar de rol.

### Paso 5: Expansión del Catálogo y Categorías
1. Ampliamos el catálogo por defecto a **13 productos tradicionales** que incluyen carnes, granos, lácteos y abarrotes.
2. Añadimos un menú segmentado de filtrado de **Categorías** (`Todos`, `Carnes`, `Granos`, `Lácteos`, `Abarrotes`).
3. Agregamos una sección superior especial para los **Productos Más Vendidos** con insignias animadas de fuego.

### Paso 6: Optimización Móvil y Lista Compacta
Para evitar scroll infinito con catálogos masivos en dispositivos móviles:
- **Vista de Escritorio**: Mantiene la rejilla con imágenes grandes para exhibición.
- **Vista Móvil**: Transforma los productos en una lista de filas horizontales compactas con una pequeña miniatura (`w-14 h-14`) y botones pequeños. Permite visualizar de 6 a 8 productos por pantalla de smartphone.
- Modificamos las tablas del repartidor y el despachador para convertirlas en cuadrículas de tarjetas móviles autoadaptables.

---

## 📂 Estructura del Código del MVP

```
C:\Users\migue\.gemini\antigravity-ide\scratch\al-campestre\
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── dispatch/page.tsx      # Despacho en 3 columnas y cálculo de retorno
│   │   │   ├── incidents/page.tsx     # Gestión de reembolsos a Stripe o saldo en un clic
│   │   │   ├── inventory/page.tsx     # Escáner móvil, remove.bg y stock
│   │   │   └── layout.tsx             # Diseño del panel admin
│   │   ├── chat/
│   │   │   └── page.tsx               # Chatbot de IA, NLP local y propuesta de paquete
│   │   ├── delivery/
│   │   │   └── page.tsx               # Repartidor, hitos, picking scanner y WhatsApp Toast
│   │   ├── globals.css                # Estética Liquid Glass, Outfit y variables de marca
│   │   ├── layout.tsx                 # Contenedor raíz con blobs interactivos
│   │   └── page.tsx                   # Tienda del cliente, onboarding familiares y checkout Stripe
│   ├── components/
│   │   └── NavigationHeader.tsx       # Cabecera, menú de hamburguesa y reinicio de base de datos
│   └── lib/
│       └── dbMock.ts                  # Mock database local storage, zona ETA e inventario
├── package.json
└── tsconfig.json
```

---

## 🚀 Instrucciones para Ejecutar y Probar

1. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
2. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Accede a: **[http://localhost:3000](http://localhost:3000)**

### Flujo de Prueba Recomendado
1. **Cliente**: Entra a la tienda, crea un familiar recibidor en Cuba.
2. **Chatbot**: Haz clic en el botón flotante de IA, escribe *"Mándale a mi mamá 5 de cerdo y 10 de arroz"*, revisa la propuesta automática y presiona **Confirmar y Pagar** (Simulación Stripe).
3. **Administrador**: Abre el panel lateral, ve a "Administrador" -> "Despacho Logístico" y asigna la orden a un repartidor disponible.
4. **Repartidor**: Ve a "Repartidor", realiza el picking escaneando los productos (prueba escanear uno erróneo para ver la alerta), marca **Iniciar Ruta** (notificación por WhatsApp) y luego **Entregado**.
5. **Retorno**: En la vista de administrador, el repartidor cambiará a **En Retorno** calculando automáticamente sus minutos de llegada en tiempo real según la zona.
