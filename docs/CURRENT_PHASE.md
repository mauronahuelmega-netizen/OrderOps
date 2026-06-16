# OrderOps: Estado de Desarrollo y Fase Actual (6 de Junio)

## 1. Módulo en Desarrollo Activo

### Pantalla / Componente Principal

**Dashboard Principal Operacional (Orders Dashboard / Workflow Lanes Engine)**

Este módulo representa el centro operacional del sistema y concentra:

* gestión de pedidos en tiempo real;
* lanes dinámicas por workflow;
* ownership colaborativo;
* snapshots operacionales;
* métricas compactas;
* sesiones vivas;
* scanning operacional;
* insights automáticos;
* actividad reciente.

### Funcionalidad Actualmente Bajo Iteración

La fase actual está enfocada en estabilizar la ejecución operacional multioperador sobre estados vivos.

Flujo operativo principal:

```text
Pending
   ↓
Preparing
   ↓
Ready
   ↓
Completed

Cualquier estado:
→ Cancelled
```

Objetivos funcionales activos:

* sincronización visual consistente entre operadores simultáneos;
* evitar desincronización entre pestañas;
* convergencia rápida entre estado optimista y estado persistido;
* preservar ownership y contexto operacional;
* reducir fricción visual durante cambios de estado.

### Tecnologías Involucradas

Frontend:

* Next.js App Router
* React
* TypeScript
* Component Architecture
* Client Components + Hooks

Backend:

* Supabase Postgres
* Supabase Realtime Channels
* Supabase Presence
* Supabase Auth
* Supabase RLS

Estado / Render:

* useMemo
* useEffect
* optimistic state updates
* defensive hydration
* realtime reconciliation

Estilos:

* CSS componentizado
* Mobile-first
* Dashboard styles altamente especializados

Archivos de alta criticidad:

```text
components/admin/orders/admin-dashboard-orders.tsx
components/admin/orders-admin.css
components/admin/admin-shell.css
app/admin/(protected)/dashboard/page.tsx
```

---

## 2. Lógica Visual e Iteraciones en Curso

### Objetivo Visual Actual

Prioridad absoluta:

```text
Estabilidad operacional > fidelidad visual
```

El dashboard debe permanecer estable bajo:

* scroll continuo;
* actualizaciones realtime;
* sesiones largas;
* múltiples operadores;
* dispositivos Android modestos.

### Trabajo Visual Activo

### Dashboard Mobile-First

Se está iterando sobre:

* cards operacionales;
* overview superior;
* snapshots KPI;
* compactación visual;
* spacing adaptativo;
* densidad informativa.

### Empty States Operacionales

Estados vacíos actualmente optimizados para:

* jornada sin pedidos;
* sesión cerrada;
* panel en escucha;
* ausencia de actividad;
* filtros sin resultados.

### Renderer Mobile Alternativo

Actualmente existe una bifurcación controlada:

```text
Desktop Overview
↓
Renderer histórico intacto

Mobile Overview
↓
Renderer simplificado y separado
```

Motivación:

* reducir complejidad de render;
* desacoplar mobile del overview histórico;
* aislar bugs específicos de Chrome Android.

### Preparación Future-Proof

El sistema visual sigue preparándose para:

* Dark Theme
* Kitchen Mode
* Delivery Mode
* Role-specific layouts
* visual tokens reutilizables

### Hallazgo Crítico Visual Actual

Existe un bug de render altamente específico:

```text
Chrome Android
✓ reproduce bug

Opera Mini
✗ NO reproduce bug

Desktop
✗ NO reproduce bug
```

Esto indica:

```text
problema probablemente asociado a:
GPU compositor
rasterization path
viewport rendering
Chrome Android rendering pipeline
```

No existe evidencia fuerte de:

* problema de lógica;
* problema de datos;
* problema de realtime;
* problema de CSS chunking actual.

---

## 3. Estado de la Sincronización y Realtime (Bloqueo Actual)

### Estado Actual del Realtime

El realtime ya opera sobre:

* channels de Supabase;
* hydration defensiva;
* presencia;
* reconciliación;
* optimistic updates.

### Problema Histórico Detectado

Hubo evidencia previa de:

* pestañas que perdían convergencia;
* operadores viendo sesiones desactualizadas;
* dashboards sin refresco automático;
* dependencia excesiva del refresh manual.

### Estrategia Actual de Reconciliación

Patrón implementado:

```text
Realtime Event
      ↓
Patch optimista
      ↓
Hydration defensiva
      ↓
Re-fetch / reconcile
      ↓
Estado convergente
```

### Riesgos Actuales

Problemas que todavía deben vigilarse:

* duplicated optimistic patches;
* stale closures en hooks;
* race conditions entre realtime y hydration;
* order snapshots incompletos;
* payloads parciales.

### Optimistic UX

Objetivo:

```text
feedback inmediato
+
consistencia eventual
```

Reglas:

* la UI responde instantáneamente;
* el backend sigue siendo la fuente de verdad;
* los fallos deben reconciliarse automáticamente.

### Cadena de Derivación Esperada

```text
orders
↓
hydratedOrders
↓
optimisticOrders
↓
windowScopedOrders
↓
filteredOrders
↓
lanes
metrics
insights
activity
```

Toda derivación debe depender de la misma fuente.

---

## 4. Bloqueo Activo Actual (Highest Priority)

### Problema Principal

Bug visual severo en:

```text
Chrome Android
Moto G13
```

Síntomas:

* bandas horizontales;
* ghost rendering;
* cards duplicadas visualmente;
* corrupción parcial del viewport;
* repaint inconsistente;
* artefactos durante scroll.

### Hipótesis Ya Descartadas

Descartado o debilitado:

* CSS chunk corruption;
* HMR parcial;
* translateZ hacks;
* forced layer promotion;
* nested grid overview;
* overview histórico;
* rgba/shadows;
* 100dvh;
* layout mobile previo;
* GPU promotion manual;
* overview renderer antiguo.

### Hipótesis Más Fuertes Ahora

```text
1. Chrome Android raster pipeline
2. compositor GPU específico
3. assets / imágenes / SVG
4. primitives visuales globales
5. bug específico del device GPU path
```

### Regla Importante

NO seguir haciendo microfixes aislados.

Usar:

```text
aislamiento binario
```

---

## 5. Tareas Pendientes Inmediatas (Next Steps para Cursor)

### Paso 1 — Resolver Desincronización / Convergencia

Auditar:

* hooks realtime;
* subscriptions duplicadas;
* stale references;
* hydration ordering.

Validar:

```text
multi-tab
multi-operator
network fluctuation
```

---

### Paso 2 — Estabilizar Hidratación Inicial

Objetivos:

* eliminar CLS;
* reducir saltos visuales;
* evitar flashes de métricas.

Revisar:

* loading boundaries;
* skeleton strategy;
* hydration sequence.

---

### Paso 3 — Fortalecer Tenant Isolation

Verificar:

```text
tenant_id
↓
query
↓
mutation
↓
optimistic update
↓
RLS
```

Ninguna mutación local debe ejecutarse sin contexto tenant.

---

### Paso 4 — Continuar Investigación Chrome Android

NO hacer más tuning fino.

Hacer pruebas binarias:

```text
RF14A
quitar logos / imágenes

RF14B
quitar SVGs

RF14C
header mínimo

RF14D
render-test page incremental
```

Objetivo:

```text
aislar trigger exacto
```

---

## 6. Restricciones Actuales de Desarrollo

NO tocar sin necesidad:

* métricas;
* lógica de pedidos;
* ownership;
* Supabase schema;
* workflow machine;
* RLS;
* realtime base.

Priorizar:

```text
estabilidad
consistencia
convergencia
```

por encima de:

```text
micro mejoras visuales
```

---

## 7. Definición de Done para Esta Fase

La fase se considera cerrada cuando:

* realtime converge entre tabs;
* realtime converge entre operadores;
* hydration deja de producir estados inconsistentes;
* mobile Android Chrome deja de corromper render;
* dashboard mantiene estabilidad en sesiones largas;
* renderer mobile queda desacoplado y robusto;
* tenant isolation queda validado extremo a extremo.
