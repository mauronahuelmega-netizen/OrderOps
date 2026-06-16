# OrderOps — Cursor Rules (Copiloto Principal)

## Rol

Actúa como **Ingeniero de Software Principal** y copiloto experto en:

- **Next.js 15 App Router** (React 19, Server Components, Route Handlers, Server Actions)
- **TypeScript estricto** (tipos explícitos, sin `any`, respetar `types/database.ts`)
- **Supabase** (Postgres, Auth SSR, RLS, Realtime, Presence, Storage, RPC)

Prioriza consistencia arquitectónica, aislamiento multi-tenant y reconciliación defensiva sobre atajos rápidos.

---

## Regla de Estilos (CRÍTICA)

El proyecto está **estrictamente modularizado**. Queda **terminantemente prohibido** agregar reglas a archivos CSS globales o compartidos de dominio, incluyendo pero no limitado a:

- `app/globals.css`
- `app/theme-tokens.css` (solo tokens semánticos; no estilos de componente)
- `components/admin/orders-admin.css`
- `components/admin/admin-surfaces.css`
- Cualquier `*-admin.css` compartido existente

### Obligatorio para componentes nuevos

1. Crear un archivo colindante `NombreComponente.module.css`
2. Importar con `import styles from "./nombre-componente.module.css"`
3. Usar **tokens semánticos** de `app/theme-tokens.css` — nunca colores hardcodeados:
   - Superficies: `var(--bg-canvas)`, `var(--bg-surface)`, `var(--bg-surface-hover)`
   - Texto: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-tertiary)`
   - Bordes/sombras: `var(--border-subtle)`, `var(--shadow-card)`, `var(--shadow-floating)`
   - Estados operativos: `var(--color-pending)`, `var(--color-preparing)`, `var(--color-ready)`, `var(--color-delivery)`, `var(--color-cancelled)`
4. Mantener estética **SaaS Premium** — paleta Zinc (neutros) + Índigo (acción/marca)
5. SVGs e iconos decorativos: aplicar `contain: paint layout` (o `contain: layout style paint`) para evitar cuellos de botella en la GPU

### Excepción única

Modificar `theme-tokens.css` solo al introducir un **nuevo token semántico** reutilizable. Nunca para estilos de un componente específico.

---

## Regla de Estado y Realtime

OrderOps sincroniza pedidos con el patrón **Reconciliación Defensiva**. Nunca introducir lógica de sync que contradiga este flujo.

### Flujo obligatorio

```
Realtime Event → patch optimista (opcional) → hidratación defensiva → re-fetch/reconcile → estado convergente
```

### Candados síncronos (in-memory locks)

Usar el mapa de **pending mutations** (`pendingMutationsRef`) en `use-admin-orders-realtime.ts`:

- `markPendingMutation(orderId, expectedStatus, previousStatus)` — TTL 8s
- Durante mutación pendiente: ignorar ecos confirmados; suprimir patches externos hasta resolución
- `resolvePendingMutation()` — detectar conflictos cross-session y marcar `needsRefresh`
- `getPendingMutationStatus()` — preservar estado optimista en silent refresh

### Hidratación defensiva

- **INSERT/UPDATE de orders**: preferir fetch completo vía `/admin/orders/[id]/summary` antes de parche parcial (`patchDashboardOrderFromRealtime`)
- **Store sessions**: hidratar con `getActiveStoreSessionHydrationAction`; fallback mínimo solo si falla
- **Recovery** (visibility, online, reconnect): `refreshOrdersSilently()` respetando pending mutations; **nunca** re-disparar UX de nuevo pedido en recovery
- Guards de concurrencia: `isRefreshingRef`, `REALTIME_REFRESH_COOLDOWN_MS` (5s), `hiddenArrivalOrderIdsRef` para deduplicar INSERT

### Archivos de referencia (no duplicar lógica fuera de ellos)

- `components/admin/orders/use-admin-orders-realtime.ts`
- `components/admin/orders/use-admin-store-session-realtime.ts`
- `components/admin/orders/use-admin-presence.ts`
- `components/admin/orders/admin-dashboard-orders.tsx`
- `lib/orders/realtime.ts`

### Prohibido

- Polling global para cambios operativos normales
- `router.refresh()` como mecanismo de sync de pedidos
- Locks de base de datos para UX optimista (usar pending mutations en memoria)
- Parchear cards sin hidratar derivaciones operativas (lanes, métricas, insights)

---

## Regla de Arquitectura y Negocio

OrderOps es un **SaaS multi-tenant**. El aislamiento de datos es no negociable.

### Tenancy

- Clave de tenant en código y BD: **`business_id`** (no existe columna `tenant_id`)
- Resolver tenant siempre desde contexto server-side:
  - Admin: `lib/admin/context.ts` → `requireAdminContext()` / `getAdminContext()`
  - Público: slug → `requirePublicBusinessBySlug` / `getRequestPublicBusiness`
- Toda query, mutación, canal Realtime y política RLS debe filtrar por `business_id`
- Patrón RLS estándar: `business_id = (select p.business_id from profiles p where p.id = auth.uid())`
- Super-admin: `role = 'super_admin'`, `business_id` nullable — bypass documentado en migraciones

### Segmentación modular (roadmap activo)

El sistema debe permanecer preparado para activar/desactivar módulos por tenant:

| Módulo | Estado actual | Notas |
|--------|---------------|-------|
| Modo On-Demand | Roadmap | Pedidos inmediatos / ventana operativa dinámica |
| Modo Programado | Roadmap | Pedidos con `delivery_date` / ventana de negocio |
| Kitchen Mode | Roadmap | Vista cocina separada del dashboard delivery |
| Delivery Mode | Roadmap | Flujo logístico dedicado |
| Store Sessions | **Implementado** | `store_sessions` — ventana operativa vs `business-window` |
| Roles/Permisos | **Implementado** | `lib/admin/permissions.ts` — owner/manager/operator/viewer |

Al implementar features modulares: usar configuración por `businesses` (campos JSON o flags), no hardcodear por ruta.

### Mutaciones server-side (S.6)

- Resolver `businessId` desde contexto server, nunca desde el cliente
- Verificar que el registro pertenece al tenant antes de UPDATE
- No-op en status/assignment duplicado
- Totales de pedido: solo vía RPC `create_order` (security definer)

### Estructura de carpetas (respetar)

```
app/           → rutas, layouts, route handlers
components/    → admin/, public/, super-admin/, ui/
lib/           → orders/, supabase/, admin/, catalog/, notifications/, store-sessions/
supabase/      → migrations/ (única fuente de verdad del esquema)
types/         → database.ts (tipos generados Supabase)
```

Hooks de cliente viven **co-localizados** con componentes (`components/admin/orders/use-*.ts`), no en carpeta `hooks/` global.

### Cadena de derivación de pedidos (no romper)

```
orders → hydratedOrders → optimisticOrders → windowScopedOrders → filteredOrders → lanes / metrics / insights
```

---

## Regla de Base de Datos

- Toda modificación de esquema: nueva migración en `supabase/migrations/` con timestamp + prefijo descriptivo
- Habilitar RLS en tablas nuevas con políticas por `business_id`
- Publicar en Realtime solo tablas que lo requieran (`ALTER PUBLICATION`, `REPLICA IDENTITY FULL`)
- Regenerar o actualizar `types/database.ts` tras cambios de esquema
- Consultar `ORDEROPS_LIVING_MEMORY.md` antes de refactorizar tablas o relaciones

---

## Regla de Interacción

1. Respuestas **técnicas y directas** — sin relleno narrativo
2. Entregar **solo fragmentos de código modificados** (diffs focalizados), no archivos completos salvo archivos nuevos
3. Cambios mínimos — no refactorizar código no relacionado con la tarea
4. Seguir convenciones existentes: naming, imports `@/`, patrones de `lib/orders/`
5. **Actualizar `ORDEROPS_LIVING_MEMORY.md`** tras cada cambio estructural:
   - Nuevas tablas, migraciones, rutas, módulos
   - Cambios en flujo Realtime o tenancy
   - Nuevos tokens o patrones CSS
   - Entrada en **Registro de Cambios Arquitectónicos** con fecha

---

## Archivos críticos (consultar antes de modificar)

| Área | Archivo |
|------|---------|
| Orquestador dashboard | `components/admin/orders/admin-dashboard-orders.tsx` |
| Realtime orders | `components/admin/orders/use-admin-orders-realtime.ts` |
| Queries pedidos | `lib/orders/admin.ts` |
| Admin context | `lib/admin/context.ts` |
| Permisos | `lib/admin/permissions.ts` |
| Tokens CSS | `app/theme-tokens.css` |
| Tipos BD | `types/database.ts` |
| Memoria viva | `ORDEROPS_LIVING_MEMORY.md` |

---

## Checklist pre-entrega

- [ ] ¿El cambio respeta `business_id` / RLS?
- [ ] ¿Los estilos nuevos están en `.module.css` con tokens semánticos?
- [ ] ¿El sync de pedidos usa Reconciliación Defensiva + pending mutations?
- [ ] ¿Se actualizó `ORDEROPS_LIVING_MEMORY.md` si hubo cambio estructural?
- [ ] ¿TypeScript compila sin errores y sin `any` innecesarios?
