# Auditoría completa de OrderOps

> Manual de referencia antes de tocar código.  
> Fecha de relevamiento: junio 2026.  
> Stack: Next.js 15 · React 19 · TypeScript · Supabase · CSS modular (sin librería de UI pesada).

---

## Índice

1. [Qué es esta aplicación](#1-qué-es-esta-aplicación)
2. [Mapa general de carpetas](#2-mapa-general-de-carpetas)
3. [Mapa de rutas y pantallas](#3-mapa-de-rutas-y-pantallas)
4. [Cómo fluye la información](#4-cómo-fluye-la-información)
5. [Panel admin: capas y componentes clave](#5-panel-admin-capas-y-componentes-clave)
6. [Catálogo público: capas y componentes clave](#6-catálogo-público-capas-y-componentes-clave)
7. [Super Admin](#7-super-admin)
8. [Capa de datos (`lib/`)](#8-capa-de-datos-lib)
9. [El archivo CSS gigante: `orders-admin.css](#9-el-archivo-css-gigante-orders-admincss)`
10. [Otros archivos CSS importantes](#10-otros-archivos-css-importantes)
11. [Resumen visual rápido](#11-resumen-visual-rápido)
12. [Puntos de atención antes de modificar](#12-puntos-de-atención-antes-de-modificar)

---

## 1. Qué es esta aplicación

**OrderOps** es una plataforma multi-negocio para tomar pedidos online y operarlos desde un panel interno.

En la práctica hay tres mundos distintos:


| Mundo                 | Quién lo usa                    | Para qué                                                          |
| --------------------- | ------------------------------- | ----------------------------------------------------------------- |
| **Público**           | Clientes finales                | Ver catálogo, armar carrito, enviar pedido                        |
| **Admin del negocio** | Dueños, managers, operadores    | Ver pedidos en vivo, cambiar estados, gestionar catálogo y equipo |
| **Super Admin**       | Operadores internos de OrderOps | Crear negocios y usuarios a nivel plataforma                      |


Cada negocio tiene su propio `business_id`. Los datos públicos se filtran por `slug` (ej: `/b/mi-cafeteria/catalogo`). Los datos del admin se filtran por el negocio del usuario logueado.

---

## 2. Mapa general de carpetas

```
OrderOps/
├── app/                    ← Rutas (páginas y APIs de Next.js)
├── components/             ← Piezas visuales reutilizables
│   ├── admin/              ← Panel del negocio
│   ├── public/             ← Catálogo y checkout del cliente
│   ├── super-admin/        ← Panel de plataforma
│   └── ui/                 ← Botones, inputs, cards genéricos
├── lib/                    ← Lógica de negocio, acceso a Supabase, helpers
├── supabase/migrations/    ← Esquema y reglas de la base de datos
├── types/                  ← Tipos TypeScript (ej: database.ts)
├── public/                 ← Archivos estáticos (sonidos, favicon, imágenes)
└── docs/                   ← Documentación interna del proyecto
```

### Qué hace cada carpeta principal


| Carpeta                | Rol                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `app/`                 | Define **URLs**, carga datos en el servidor y elige qué componente mostrar.                                                |
| `components/`          | Define **cómo se ve e interactúa** la interfaz. No debería hablar directo con la base salvo casos puntuales en el cliente. |
| `lib/`                 | Define **reglas, consultas, formateo y permisos**. Es el cerebro reutilizable.                                             |
| `supabase/migrations/` | Historial de tablas, permisos (RLS) y funciones de base de datos.                                                          |
| `public/`              | Assets servidos tal cual (ej: `/sounds/new-order-sound.mp3`).                                                              |


---

## 3. Mapa de rutas y pantallas

### 3.1 Sitio principal (sin login)


| Ruta | Archivo de página | Qué muestra                                                        |
| ---- | ----------------- | ------------------------------------------------------------------ |
| `/`  | `app/page.tsx`    | Landing de marketing de OrderOps (problema, solución, beneficios). |


---

### 3.2 Catálogo público del cliente

Todas viven bajo `/b/[slug]/…`. El `slug` identifica al negocio.


| Ruta                 | Archivo                          | Vista principal            | Función                                       |
| -------------------- | -------------------------------- | -------------------------- | --------------------------------------------- |
| `/b/[slug]`          | `app/b/[slug]/page.tsx`          | `BusinessLandingPage`      | Página de bienvenida del negocio.             |
| `/b/[slug]/catalogo` | `app/b/[slug]/catalogo/page.tsx` | `PublicCatalogPageContent` | Catálogo con categorías, productos y carrito. |
| `/b/[slug]/checkout` | `app/b/[slug]/checkout/page.tsx` | `CheckoutClient`           | Formulario de pedido y envío a Supabase.      |
| `/b/[slug]/success`  | `app/b/[slug]/success/page.tsx`  | Página de confirmación     | Muestra que el pedido se recibió.             |


**Layout compartido:** `app/b/[slug]/layout.tsx` envuelve todas las rutas del negocio con `PublicBusinessHeader` (logo, nombre, navegación).

**Middleware:** `middleware.ts` refresca la sesión de Supabase en rutas `/b/`* y `/admin/*`.

---

### 3.3 Panel admin del negocio


| Ruta                              | Archivo                                          | Vista principal             | Función                                                     |
| --------------------------------- | ------------------------------------------------ | --------------------------- | ----------------------------------------------------------- |
| `/admin`                          | `app/admin/page.tsx`                             | Redirección                 | Si hay sesión → `/admin/dashboard`. Si no → `/admin/login`. |
| `/admin/login`                    | `app/admin/login/page.tsx`                       | Formulario de login         | Email + contraseña.                                         |
| `/admin/dashboard`                | `app/admin/(protected)/dashboard/page.tsx`       | `AdminDashboardOrders`      | **Corazón operativo:** lista de pedidos en vivo.            |
| `/admin/orders/[id]`              | `app/admin/(protected)/orders/[id]/page.tsx`     | `OrderDetailPageClient`     | Detalle profundo de un pedido.                              |
| `/admin/products`                 | `app/admin/(protected)/products/page.tsx`        | `ProductsWorkspace`         | Gestión de productos.                                       |
| `/admin/categories`               | `app/admin/(protected)/categories/page.tsx`      | Formularios de categorías   | Crear y editar categorías.                                  |
| `/admin/team`                     | `app/admin/(protected)/team/page.tsx`            | Formularios de equipo       | Usuarios internos y roles.                                  |
| `/admin/settings/public`          | `app/admin/(protected)/settings/public/page.tsx` | Resumen de configuración    | Notificaciones + links a landing/catálogo.                  |
| `/admin/settings/public/landing`  | `…/landing/page.tsx`                             | `PublicSettingsForm`        | Logo, portada, color, Instagram.                            |
| `/admin/settings/public/catalogo` | `…/catalogo/page.tsx`                            | `PublicCatalogSettingsForm` | Textos del hero del catálogo.                               |


**Menú de navegación** (definido en `components/admin/admin-nav-config.ts`):


| Ítem del menú | Ruta                     | Permiso requerido     |
| ------------- | ------------------------ | --------------------- |
| Pedidos       | `/admin/dashboard`       | `viewOrders`          |
| Productos     | `/admin/products`        | `manageProducts`      |
| Equipo        | `/admin/team`            | `manageTeam`          |
| Configuración | `/admin/settings/public` | `manageNotifications` |


> La ruta `/admin/orders/[id]` no tiene ítem propio en el menú; se llega desde una tarjeta de pedido o desde el modal.

**Layout protegido:** `app/admin/(protected)/layout.tsx`  
Monta el cascarón visual (`AdminShell`), los toasts y **carga todos los CSS del admin**, incluido `orders-admin.css`.

---

### 3.4 Super Admin (plataforma)


| Ruta                      | Archivo                                | Función                           |
| ------------------------- | -------------------------------------- | --------------------------------- |
| `/super-admin`            | `app/super-admin/(protected)/page.tsx` | Alta de clientes + links rápidos. |
| `/super-admin/businesses` | `…/businesses/page.tsx`                | Gestión de negocios.              |
| `/super-admin/users`      | `…/users/page.tsx`                     | Gestión de usuarios admin.        |


Layout: `app/super-admin/(protected)/layout.tsx` — más simple que el admin del negocio; **no importa** `orders-admin.css`.

---

### 3.5 APIs internas (route handlers)


| Ruta                                  | Archivo                                           | Para qué sirve                                               |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| `GET /admin/dashboard/orders`         | `app/admin/(protected)/dashboard/orders/route.ts` | Devuelve pedidos en JSON (recarga silenciosa del dashboard). |
| `GET /admin/orders/[id]/summary`      | `…/summary/route.ts`                              | Resumen liviano de un pedido.                                |
| `GET /admin/orders/[id]/workspace`    | `…/workspace/route.ts`                            | Datos completos para el modal de pedido.                     |
| `POST /api/internal/orders/[id]/push` | `app/api/internal/orders/[id]/push/route.ts`      | Notificaciones push de pedidos.                              |


---

## 4. Cómo fluye la información

### Flujo del cliente (público)

```
Cliente entra al catálogo
    → Lee categorías y productos (lib/catalog/public.ts)
    → Arma carrito (localStorage, lib/cart/local.ts)
    → Va al checkout
    → Se llama la RPC create_order en Supabase
    → Redirige a /success?order_id=...
```

### Flujo del negocio (admin)

```
Usuario inicia sesión (/admin/login)
    → middleware.ts mantiene la cookie de Supabase
    → lib/admin/context.ts resuelve businessId + permisos + rol
    → AdminShell envuelve todas las pantallas protegidas
    → Dashboard carga pedidos server-side (lib/orders/admin.ts)
    → AdminDashboardOrders se hidrata en el navegador
    → use-admin-orders-realtime.ts escucha cambios en la tabla orders
    → Al tocar un pedido: modal instantáneo O página /admin/orders/[id]
```

### Realtime

- Solo la tabla `orders` tiene suscripción en vivo.
- Cuando entra o cambia un pedido, el dashboard se actualiza sin recargar la página.
- Hay sonido, toast y notificación del navegador configurables por usuario.

---

## 5. Panel admin: capas y componentes clave

Piense el admin como **capas apiladas**, de afuera hacia adentro:

```
AdminShell          ← Marco global: header, menú, área principal
  └── AdminPageLayout   ← Ancho y ritmo de la página
        └── AdminPageHeader   ← Título, descripción, acciones
              └── Contenido específico de la pantalla
```

### Capa 1 — Cascarón global


| Componente           | Archivo                                     | Qué hace                                               |
| -------------------- | ------------------------------------------- | ------------------------------------------------------ |
| `AdminShell`         | `components/admin/admin-shell.tsx`          | Marco principal: header + nav + `<main>`.              |
| `AdminHeader`        | `components/admin/admin-header.tsx`         | Logo del negocio, usuario logueado, botón menú mobile. |
| `AdminNavLinks`      | `components/admin/admin-nav-links.tsx`      | Links del menú según rol.                              |
| `AdminMobileDrawer`  | `components/admin/admin-mobile-drawer.tsx`  | Menú lateral en celular.                               |
| `AdminToastProvider` | `components/admin/admin-toast-provider.tsx` | Avisos flotantes (ej: "Nuevo pedido").                 |


### Capa 2 — Layout de página


| Componente        | Archivo                                  | Qué hace                                           |
| ----------------- | ---------------------------------------- | -------------------------------------------------- |
| `AdminPageLayout` | `components/admin/admin-page-layout.tsx` | Contenedor con ancho `default`, `wide` o `narrow`. |
| `AdminPageHeader` | `components/admin/admin-page-header.tsx` | Encabezado interno de cada pantalla.               |


### Capa 3 — Pantalla de pedidos (la más compleja)

**Página:** `app/admin/(protected)/dashboard/page.tsx`  
**Componente central:** `components/admin/orders/admin-dashboard-orders.tsx` (~3.100 líneas)

Este archivo es el director de orquesta del dashboard. No solo dibuja la lista: coordina filtros, búsqueda, lanes, métricas, modal, sonido, presencia de operadores y actualizaciones optimistas.

#### Piezas que compone el dashboard


| Componente                 | Archivo                                  | Rol en pantalla                                                |
| -------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `AudioUnlockGate`          | `notifications/audio-unlock-gate.tsx`    | Pide permiso para sonido de nuevos pedidos.                    |
| `OperationalSearch`        | `orders/operational-search.tsx`          | Barra de búsqueda natural ("cliente Juan", "pendiente", etc.). |
| `OperationalSummaryStrip`  | `orders/operational-summary-strip.tsx`   | Franja con resumen operativo del momento.                      |
| `BusinessInsightsStrip`    | `orders/business-insights-strip.tsx`     | Insights de negocio (ticket promedio, ritmo, etc.).            |
| `OperationalFeed`          | `orders/operational-feed.tsx`            | Actividad reciente clickeable.                                 |
| `LaneNavigationScanning`   | `orders/lane-navigation-scanning.tsx`    | Navegación rápida entre grupos de pedidos.                     |
| `LaneMetricsLayer`         | `orders/lane-metrics-layer.tsx`          | Métricas por carril (pendientes, demorados, etc.).             |
| `PriorityRiskLanes`        | `orders/priority-risk-lanes.tsx`         | Agrupa pedidos por prioridad y riesgo.                         |
| `DeliveryWorkflowLanes`    | `orders/delivery-workflow-lanes.tsx`     | Agrupa pedidos por tipo de entrega.                            |
| `OrderCardQuickActions`    | `orders/order-card-quick-actions.tsx`    | Botones rápidos en cada tarjeta (confirmar, listo, etc.).      |
| `OperatorPresencePill`     | `orders/operator-presence-pill.tsx`      | Muestra quién más está online viendo pedidos.                  |
| `AdminOrderWorkspaceModal` | `orders/admin-order-workspace-modal.tsx` | Modal con detalle completo sin salir del dashboard.            |


#### Hooks y lógica de apoyo (misma carpeta `orders/`)


| Archivo                               | Qué hace                                          |
| ------------------------------------- | ------------------------------------------------- |
| `use-admin-orders-realtime.ts`        | Escucha INSERT/UPDATE en `orders`.                |
| `use-admin-presence.ts`               | Presencia ligera de operadores conectados.        |
| `use-admin-store-session-realtime.ts` | Sesión de jornada de la tienda (apertura/cierre). |


#### Detalle de un pedido (página completa)

**Ruta:** `/admin/orders/[id]`  
**Componente:** `components/admin/orders/order-detail-page-client.tsx`


| Componente hijo          | Qué muestra                                    |
| ------------------------ | ---------------------------------------------- |
| `OrderWorkspaceOverview` | Cabecera con estado, total, asignación.        |
| `OrderRiskPanel`         | Señales de riesgo (demora, sin asignar, etc.). |
| `OrderHumanTimeline`     | Historial legible de eventos.                  |
| `OrderWorkspace`         | Grid con secciones del pedido (ver abajo).     |


`**OrderWorkspace`** (`order-workspace.tsx`) arma el layout de detalle con:


| Sección   | Componente                                            | Contenido                         |
| --------- | ----------------------------------------------------- | --------------------------------- |
| Cliente   | `order-customer-section.tsx`                          | Nombre, teléfono, señales.        |
| Entrega   | `order-delivery-section.tsx`                          | Tipo de entrega, dirección.       |
| Productos | `order-items-section.tsx` + `order-products-list.tsx` | Lista de ítems.                   |
| Notas     | `order-notes-section.tsx`                             | Observaciones del pedido.         |
| Total     | `order-total-section.tsx`                             | Monto final.                      |
| Acciones  | `order-actions-section.tsx` + `status-form.tsx`       | Cambiar estado, asignar operador. |
| Externas  | `order-external-actions.tsx`                          | WhatsApp, maps, compartir.        |


El **mismo `OrderWorkspace`** se reutiliza dentro del modal (`variant="modal"`) y en la página (`variant="page"`).

#### Modal de pedido


| Componente                         | Rol                                    |
| ---------------------------------- | -------------------------------------- |
| `AdminOrderModalShell`             | Overlay, panel, botón cerrar.          |
| `AdminOrderWorkspaceModal`         | Carga datos, maneja estado optimista.  |
| `AdminOrderWorkspaceErrorBoundary` | Atrapa errores del modal.              |
| `OrderProductModal`                | Zoom de un producto dentro del pedido. |


---

## 6. Catálogo público: capas y componentes clave


| Componente                 | Archivo                                      | Rol                              |
| -------------------------- | -------------------------------------------- | -------------------------------- |
| `PublicBusinessHeader`     | `public/business/public-business-header.tsx` | Header con branding del negocio. |
| `BusinessLandingPage`      | `public/business/business-landing-page.tsx`  | Landing del negocio.             |
| `PublicCatalogPageContent` | `public/catalog/public-catalog-page.tsx`     | Wrapper del catálogo.            |
| `CatalogClient`            | `public/catalog/catalog-client.tsx`          | Lógica del catálogo y carrito.   |
| `ProductDetailModal`       | `public/catalog/product-detail-modal.tsx`    | Detalle de producto.             |
| `CartBar`                  | `public/catalog/cart-bar.tsx`                | Barra inferior del carrito.      |
| `CheckoutClient`           | `public/checkout/checkout-client.tsx`        | Formulario y envío del pedido.   |
| `ThemeToggle`              | `public/catalog/theme-toggle.tsx`            | Modo claro/oscuro del catálogo.  |


**Estilos públicos:** viven principalmente en `app/globals.css` (clases `catalog-`*, `public-*`, `landing-*`). **No usan** `orders-admin.css`.

---

## 7. Super Admin


| Componente                | Rol                               |
| ------------------------- | --------------------------------- |
| `CreateClientForm`        | Alta de negocio + primer usuario. |
| `BusinessManagementPanel` | Lista y edición de negocios.      |
| `UserManagementPanel`     | Lista y edición de usuarios.      |
| `SuperAdminNav`           | Navegación entre secciones.       |


Usa clases compartidas de `admin-surfaces.css` (via `globals.css`) como `admin-form-card`, `admin-form-header`.  
En dos paneles reutiliza nombres de clase `admin-order-row` y `admin-order-meta`, pero **sin cargar** `orders-admin.css` — eso significa que esos estilos específicos de pedido probablemente no se aplican ahí (detalle menor a tener en cuenta).

---

## 8. Capa de datos (`lib/`)

### Carpetas más usadas


| Carpeta                             | Responsabilidad                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| `lib/supabase/`                     | Clientes server, browser, middleware y service role.                                              |
| `lib/admin/`                        | Contexto del usuario admin, permisos, equipo, soporte.                                            |
| `lib/orders/`                       | Todo lo relacionado a pedidos: carga, presentación, métricas, riesgo, lanes, realtime, workspace. |
| `lib/catalog/` + `lib/business/`    | Datos públicos del catálogo y negocio.                                                            |
| `lib/products/` + `lib/categories/` | CRUD admin de catálogo.                                                                           |
| `lib/notifications/`                | Sonido, push, browser notifications, preferencias.                                                |
| `lib/super-admin/`                  | Contexto y CRUD de plataforma.                                                                    |
| `lib/whatsapp/`                     | Links de WhatsApp para admin y público.                                                           |
| `lib/cart/`                         | Carrito en localStorage.                                                                          |


### Archivos clave de pedidos


| Archivo                        | Qué resuelve                                                         |
| ------------------------------ | -------------------------------------------------------------------- |
| `lib/orders/admin.ts`          | Consultas server: lista del dashboard, detalle, contexto de cliente. |
| `lib/orders/presenter.ts`      | Formateo: moneda, tiempos, labels de entrega, timeline.              |
| `lib/orders/workspace.ts`      | Estado del workspace/modal y parches optimistas.                     |
| `lib/orders/realtime.ts`       | Fusión de filas realtime con estado local.                           |
| `lib/orders/sorting.ts`        | Orden de pedidos en el dashboard.                                    |
| `lib/orders/risk-detection.ts` | Evalúa riesgo operativo por pedido.                                  |
| `lib/orders/lane-*.ts`         | Modelos de carriles, métricas y navegación.                          |
| `lib/orders/analytics.ts`      | KPIs de jornada y ventana operativa.                                 |


### Base de datos (tablas principales)

Definidas en `supabase/migrations/`:

- `businesses` — datos del negocio y branding.
- `profiles` — usuarios ligados a un negocio + rol.
- `categories`, `products` — catálogo.
- `orders`, `order_items` — pedidos.
- `order_events` — historial de cambios.
- Tablas de notificaciones push y sesiones de tienda (migraciones recientes).

---

## 9. El archivo CSS gigante: `orders-admin.css`

### Datos del archivo


| Dato                          | Valor                                        |
| ----------------------------- | -------------------------------------------- |
| Ubicación                     | `components/admin/orders-admin.css`          |
| Tamaño aproximado             | **~5.964 líneas**                            |
| Selectores `.admin-`* propios | **~713 reglas**                              |
| Importado desde               | `app/admin/(protected)/layout.tsx` (línea 9) |


### Punto crítico: cuándo se carga

El CSS **no se importa solo en el dashboard**. Se carga en el layout de **todas** las rutas admin protegidas:

```
/admin/dashboard          ← usa casi todo el archivo
/admin/orders/[id]        ← usa la parte de detalle y modal
/admin/products           ← carga el archivo pero casi no lo usa
/admin/categories         ← idem
/admin/team               ← idem
/admin/settings/public/*  ← idem
```

Es decir: el navegador descarga ~6.000 líneas de CSS de pedidos incluso cuando el usuario está editando productos o configuración. Hoy funciona, pero es deuda técnica si se busca optimizar performance.

---

### Bloques temáticos dentro del CSS

El archivo no tiene comentarios de sección (solo uno inicial). Por convención de nombres, se organiza así:

#### A. Estructura del dashboard (~líneas 1–800)

Prefijo: `admin-orders-structure`, `admin-orders-section`, `admin-orders-controls`


| Clases representativas             | Para qué sirven                    |
| ---------------------------------- | ---------------------------------- |
| `.admin-orders-structure`          | Grid principal del dashboard.      |
| `.admin-orders-section--overview`  | Zona superior de métricas.         |
| `.admin-orders-section--execution` | Zona de lista y carrilves.         |
| `.admin-orders-section--context`   | Zona lateral de contexto.          |
| `.oo-panel`                        | Paneles con padding y borde suave. |


**Usado por:** `admin-dashboard-orders.tsx`

---

#### B. Barra de estado en vivo (~100–280)

Prefijo: `admin-orders-realtime-*`, `admin-orders-pressure-*`, `admin-orders-presence-*`


| Qué estiliza                                        | Componente                   |
| --------------------------------------------------- | ---------------------------- |
| Punto verde/amarillo de conexión realtime           | `admin-dashboard-orders.tsx` |
| Indicador de presión de cola (calma/activo/crítico) | `admin-dashboard-orders.tsx` |
| Avatares de operadores online                       | `operator-presence-pill.tsx` |


---

#### C. Analytics y KPIs (~280–820)

Prefijos: `admin-orders-analytics-*`, `admin-orders-insight-*`, `admin-orders-micro-insights-*`, `admin-orders-operational-summary-*`, `admin-orders-business-insights-*`, `admin-orders-recent-activity-*`, `admin-orders-mobile-overview-*`


| Qué estiliza                                 | Componente                                                   |
| -------------------------------------------- | ------------------------------------------------------------ |
| Strip de KPIs (ventas, ticket, completados…) | `admin-dashboard-orders.tsx`                                 |
| Micro-insights operativos                    | `operational-summary-strip.tsx`                              |
| Insights de negocio                          | `business-insights-strip.tsx`                                |
| Feed de actividad reciente                   | `operational-feed.tsx`                                       |
| Overview compacto para mobile                | `admin-dashboard-orders.tsx`                                 |
| Iconos KPI                                   | `admin-dashboard-orders.tsx` (clase `admin-orders-kpi-icon`) |


---

#### D. Búsqueda y filtros (~820–1100)

Prefijos: `admin-orders-search-*`, `admin-orders-filters-*`, `admin-orders-filter-empty`


| Qué estiliza                                  | Componente                   |
| --------------------------------------------- | ---------------------------- |
| Input de búsqueda + chips                     | `operational-search.tsx`     |
| Pills de filtro (pendiente, preparando, etc.) | `admin-dashboard-orders.tsx` |
| Mensaje "sin resultados con este filtro"      | `admin-dashboard-orders.tsx` |


---

#### E. Navegación por carriles (~1100–1300)

Prefijo: `admin-orders-lane-nav-*`


| Qué estiliza                 | Componente                     |
| ---------------------------- | ------------------------------ |
| Barra de saltos entre grupos | `lane-navigation-scanning.tsx` |
| Estado vacío "Sin pedidos"   | `admin-dashboard-orders.tsx`   |


---

#### F. Métricas por carril (~1300–1800)

Prefijo: `admin-orders-lane-metrics-*`


| Qué estiliza                  | Componente               |
| ----------------------------- | ------------------------ |
| Tarjetas de métricas por lane | `lane-metrics-layer.tsx` |


---

#### G. Carriles de prioridad y entrega (~1800–2160)

Prefijos: `admin-orders-priority-lane-*`, `admin-orders-priority-lanes`, `admin-orders-workflow-lane-*`, `admin-orders-workflow-lanes`, `admin-orders-groups-*`


| Qué estiliza                                 | Componente                    |
| -------------------------------------------- | ----------------------------- |
| Lanes de riesgo/prioridad                    | `priority-risk-lanes.tsx`     |
| Lanes por tipo de entrega                    | `delivery-workflow-lanes.tsx` |
| Agrupación de listas de pedidos              | `admin-dashboard-orders.tsx`  |
| Estado vacío con links al catálogo/productos | `admin-dashboard-orders.tsx`  |


---

#### H. Tarjetas de pedido (~2160–3130)

Prefijo: `admin-order-card`, `admin-order-row`, `admin-order-meta`, `admin-order-timeline`, `admin-order-quick-action*`, `admin-order-risk-chip`, `admin-order-status-badge`


| Qué estiliza                                      | Componente                     |
| ------------------------------------------------- | ------------------------------ |
| Tarjeta clickeable de cada pedido                 | `admin-dashboard-orders.tsx`   |
| Timeline mini de progreso en la tarjeta           | `admin-dashboard-orders.tsx`   |
| Chips de riesgo y "Nuevo"                         | `admin-dashboard-orders.tsx`   |
| Botones rápidos en tarjeta                        | `order-card-quick-actions.tsx` |
| Variantes por estado (pending, preparing, ready…) | `admin-dashboard-orders.tsx`   |
| Variantes por aging/stale/riesgo                  | `admin-dashboard-orders.tsx`   |


> **Nota:** `super-admin/business-management-panel.tsx` y `user-management-panel.tsx` usan `admin-order-row` y `admin-order-meta` como nombres de clase, pero ese CSS no se carga en super-admin.

---

#### I. Modal de pedido (~3130–3420)

Prefijo: `admin-order-modal-*`


| Qué estiliza                           | Componente                        |
| -------------------------------------- | --------------------------------- |
| Overlay y panel del modal              | `admin-order-modal-shell.tsx`     |
| Header, cierre, estados de carga/error | `admin-order-workspace-modal.tsx` |
| Ajustes de layout dentro del modal     | `order-workspace.tsx`             |


---

#### J. Workspace overview (~3259–3360)

Prefijo: `admin-order-workspace-overview-*`


| Qué estiliza                                  | Componente                     |
| --------------------------------------------- | ------------------------------ |
| Cabecera resumida del pedido (modal y página) | `order-workspace-overview.tsx` |


---

#### K. Layout de detalle (~3337–4100)

Prefijos: `admin-detail-*`, `admin-items-*`, `admin-item-row`, `admin-status-form`, `admin-detail-total-card`


| Qué estiliza                       | Componente                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| Grid de paneles del detalle        | `order-workspace.tsx`                                                                 |
| Paneles de cliente, entrega, notas | `order-customer-section.tsx`, `order-delivery-section.tsx`, `order-notes-section.tsx` |
| Lista de productos                 | `order-products-list.tsx`, `order-items-section.tsx`                                  |
| Total del pedido                   | `order-total-section.tsx`                                                             |
| Formulario de cambio de estado     | `status-form.tsx`                                                                     |
| Panel de acciones                  | `order-actions-section.tsx`                                                           |
| Timeline humano                    | `order-human-timeline.tsx`                                                            |
| Notas de asignación                | `order-assignment-controls.tsx`                                                       |


---

#### L. Panel de riesgo (~3800–4010)

Prefijo: `admin-order-risk-*` (y variantes dentro de detail)


| Qué estiliza               | Componente             |
| -------------------------- | ---------------------- |
| Panel de señales de riesgo | `order-risk-panel.tsx` |


---

#### M. Timeline humano (~4010–4076)

Prefijo: `admin-order-human-timeline-*`


| Qué estiliza                       | Componente                 |
| ---------------------------------- | -------------------------- |
| Línea de tiempo legible de eventos | `order-human-timeline.tsx` |


---

#### N. Modal de audio (~4077–4200)

Prefijo: `admin-audio-unlock-modal-*`


| Qué estiliza                                | Componente               |
| ------------------------------------------- | ------------------------ |
| Popup para activar sonido de nuevos pedidos | `audio-unlock-modal.tsx` |


---

#### O. Detalle de página completa (~4200–5000)

Ajustes de `.admin-detail-layout--page`, header de detalle, links de vuelta, presencia contextual.


| Qué estiliza               | Componente                     |
| -------------------------- | ------------------------------ |
| Vista `/admin/orders/[id]` | `order-detail-page-client.tsx` |


---

#### P. Media queries (~5000–5964)

Una porción grande del archivo (~1.000+ líneas) son breakpoints:


| Breakpoint                   | Qué adapta                                     |
| ---------------------------- | ---------------------------------------------- |
| `@media (min-width: 640px)`  | Grids de KPIs, tarjetas.                       |
| `@media (min-width: 768px)`  | Layout de secciones, modal.                    |
| `@media (min-width: 1024px)` | Tres columnas de contexto, lanes horizontales. |
| `@media (min-width: 1280px)` | Ancho máximo del dashboard (~1180px).          |


Incluye reglas mobile-first para el overview, quick actions compactas y modal en pantallas chicas.

---

### Tabla resumen: pantalla → dependencia de `orders-admin.css`


| Pantalla / superficie             | ¿Depende del CSS?                         | Intensidad               |
| --------------------------------- | ----------------------------------------- | ------------------------ |
| `/admin/dashboard`                | **Sí — total**                            | Usa ~90% del archivo     |
| Modal de pedido (desde dashboard) | **Sí — alta**                             | Bloques I, J, K          |
| `/admin/orders/[id]`              | **Sí — alta**                             | Bloques J, K, L, O       |
| Popup de audio (dashboard)        | **Sí — puntual**                          | Bloque N                 |
| `/admin/products`                 | Carga el archivo, **no lo usa**           | —                        |
| `/admin/categories`               | Carga el archivo, **no lo usa**           | —                        |
| `/admin/team`                     | Carga el archivo, **no lo usa**           | —                        |
| `/admin/settings/public/*`        | Carga el archivo, **no lo usa**           | —                        |
| Catálogo público `/b/...`         | **No**                                    | Estilos en `globals.css` |
| Super Admin                       | **No** (salvo nombres de clase huérfanos) | —                        |


### Tabla resumen: componente → prefijo CSS principal


| Componente                        | Prefijos CSS que consume                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| `admin-dashboard-orders.tsx`      | `admin-orders-*`, `admin-order-card*`, `admin-order-row*`, filtros, groups, mobile-overview |
| `operational-search.tsx`          | `admin-orders-search-*`                                                                     |
| `operational-summary-strip.tsx`   | `admin-orders-operational-summary-*`                                                        |
| `business-insights-strip.tsx`     | `admin-orders-business-insights-*`                                                          |
| `operational-feed.tsx`            | `admin-orders-recent-activity-*`, `admin-orders-activity-*`                                 |
| `lane-navigation-scanning.tsx`    | `admin-orders-lane-nav-*`                                                                   |
| `lane-metrics-layer.tsx`          | `admin-orders-lane-metrics-*`                                                               |
| `priority-risk-lanes.tsx`         | `admin-orders-priority-lane-*`                                                              |
| `delivery-workflow-lanes.tsx`     | `admin-orders-workflow-lane-*`                                                              |
| `order-card-quick-actions.tsx`    | `admin-order-quick-action*`                                                                 |
| `operator-presence-pill.tsx`      | `admin-orders-presence-*`                                                                   |
| `admin-order-modal-shell.tsx`     | `admin-order-modal-shell*`                                                                  |
| `admin-order-workspace-modal.tsx` | `admin-order-modal-*`, `admin-order-modal-content`                                          |
| `order-workspace-overview.tsx`    | `admin-order-workspace-overview-*`                                                          |
| `order-workspace.tsx` + secciones | `admin-detail-*`, `admin-items-*`, `admin-status-form`                                      |
| `order-human-timeline.tsx`        | `admin-order-human-timeline-*`, `admin-detail-panel--timeline`                              |
| `order-risk-panel.tsx`            | clases de riesgo en bloques H y L                                                           |
| `order-detail-page-client.tsx`    | layout de página + presencia                                                                |
| `audio-unlock-modal.tsx`          | `admin-audio-unlock-modal-*`                                                                |
| `order-product-modal.tsx`         | estilos de modal/item derivados de bloque K                                                 |


---

## 10. Otros archivos CSS importantes

Para no confundir responsabilidades:


| Archivo                                         | Dónde se importa        | Qué cubre                                                                                                                        |
| ----------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `app/globals.css`                               | `app/layout.tsx` (raíz) | Reset, landing pública, catálogo público, checkout, login admin, super-admin. Importa `theme-tokens.css` y `admin-surfaces.css`. |
| `components/admin/admin-shell.css`              | Layout admin protegido  | Marco global del panel.                                                                                                          |
| `components/admin/admin-header.css`             | Layout admin protegido  | Header y brand.                                                                                                                  |
| `components/admin/admin-mobile-drawer.css`      | Layout admin protegido  | Menú mobile.                                                                                                                     |
| `components/admin/admin-page-layout.css`        | Layout admin protegido  | Ancho de páginas internas.                                                                                                       |
| `components/admin/admin-page-header.css`        | Layout admin protegido  | Títulos de página.                                                                                                               |
| `components/admin/admin-toast.css`              | Layout admin protegido  | Notificaciones flotantes.                                                                                                        |
| `components/admin/admin-surfaces.css`           | Via `globals.css`       | Cards, forms, botones, empty states (compartido en todo el admin).                                                               |
| `components/admin/products/products-admin.css`  | Layout admin protegido  | Pantalla de productos.                                                                                                           |
| `components/admin/settings/public-settings.css` | Layout admin protegido  | Pantallas de configuración pública.                                                                                              |
| `**components/admin/orders-admin.css`**         | Layout admin protegido  | **Todo lo de pedidos** (ver sección 9).                                                                                          |


**Regla del proyecto:** el CSS específico de un dominio no va a `globals.css`. Los pedidos viven en `orders-admin.css`.

---

## 11. Resumen visual rápido

### Árbol de rutas

```
/ ................................. Landing OrderOps
/b/[slug] ......................... Landing del negocio
/b/[slug]/catalogo ................ Catálogo + carrito
/b/[slug]/checkout ................ Envío del pedido
/b/[slug]/success ................. Confirmación

/admin/login ...................... Login
/admin/dashboard .................. Dashboard de pedidos ★
/admin/orders/[id] ................ Detalle de pedido ★
/admin/products ................... Productos
/admin/categories ................. Categorías
/admin/team ....................... Equipo
/admin/settings/public ............ Configuración
/admin/settings/public/landing .... Branding
/admin/settings/public/catalogo ... Textos del catálogo

/super-admin ...................... Alta de clientes
/super-admin/businesses ........... Negocios
/super-admin/users ................ Usuarios
```

★ = pantallas que **visualmente dependen** de `orders-admin.css`.

### Flujo visual del dashboard de pedidos

```
┌─────────────────────────────────────────────────────────┐
│  AdminShell (header + nav)                              │
├─────────────────────────────────────────────────────────┤
│  AdminPageHeader: "Pedidos"                             │
├─────────────────────────────────────────────────────────┤
│  [Barra realtime] [Presión cola] [Presencia operadores] │
├─────────────────────────────────────────────────────────┤
│  KPIs · Insights · Actividad reciente                   │
├─────────────────────────────────────────────────────────┤
│  [Búsqueda] [Filtros por estado]                        │
├─────────────────────────────────────────────────────────┤
│  [Nav carriles] [Métricas por lane]                     │
├─────────────────────────────────────────────────────────┤
│  Lanes de prioridad / entrega                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│  │ OrderCard│ │ OrderCard│ │ OrderCard│  ← orders-admin │
│  └──────────┘ └──────────┘ └──────────┘                 │
└─────────────────────────────────────────────────────────┘
         │ click
         ▼
┌──────────────────────┐     ┌──────────────────────────┐
│  Modal workspace     │ OR  │  /admin/orders/[id]      │
│  (mismo OrderWorkspace)   │  (página completa)         │
└──────────────────────┘     └──────────────────────────┘
```

---

## 12. Puntos de atención antes de modificar

1. `**admin-dashboard-orders.tsx` es enorme.** Casi toda la lógica visual del dashboard vive ahí. Cualquier cambio de layout de pedidos probablemente toca ese archivo + `orders-admin.css`.
2. `**orders-admin.css` se carga en todo el admin protegido**, no solo en pedidos. Si se optimiza, habría que mover el import a rutas específicas (`dashboard/layout.tsx` y `orders/layout.tsx`).
3. **No mezclar server y client.** Los componentes con `"use client"` no deben importar módulos solo-server (ya hubo bugs por esto).
4. **Realtime solo en `orders`.** Cambios en productos o categorías no se reflejan solos en el dashboard; los pedidos sí.
5. **Permisos por rol.** Antes de mostrar acciones, revisar `lib/admin/permissions.ts` y lo que expone `requireAdminContext()`.
6. **CSS compartido vs dominio.** Botones y cards genéricos → `admin-surfaces.css`. Todo lo que diga `admin-order-`* o `admin-orders-*` → `orders-admin.css`.
7. **Documentación interna existente.** Complementa este manual:
  - `docs/ARCHITECTURE.md` — arquitectura técnica.
  - `docs/admin-layout-system-v1.md` — sistema de layout del admin.
  - `docs/CRITICAL_FILES.md` — archivos sensibles.

---

*Fin del manual de auditoría. Con este mapa se puede navegar el proyecto, saber qué toca cada pantalla y dónde vive cada estilo antes de hacer cambios.*