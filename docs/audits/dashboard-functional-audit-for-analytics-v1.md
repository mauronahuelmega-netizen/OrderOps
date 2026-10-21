# OrderOps — Auditoría funcional del dashboard para Estadísticas V1

Fecha: 12 de octubre de 2026, America/Buenos_Aires (UTC−03:00).
Estado: **LISTA PARA REVISIÓN CON COBERTURA PARCIAL DE RUNTIME**. Auditoría de código, esquema conectado y datos agregados; no es una validación funcional de punta a punta.

## 1. Resumen funcional del dashboard actual

**COMPROBADO EN CÓDIGO.** El panel del comercio organiza pedidos, catálogo, personalizaciones, configuración y autorizaciones de asistencia de promotores. El menú actual contiene Pedidos, Cocina (condicional), Asistencia, Productos y Configuración. El negocio se obtiene del perfil autenticado, no de un selector libre de tenants. El dashboard de pedidos carga órdenes del negocio y luego restringe su presentación a una ventana operativa. Esa ventana usa la sesión abierta, después la última sesión cerrada y finalmente una jornada calendario como fallback.

El hero y el tablero comparten el conjunto visible por **fecha de creación**. Los filtros y la búsqueda afectan al tablero y sus métricas contextuales, pero no reducen el conjunto del hero. Las acciones operativas se autorizan por rol y requieren una sesión activa en el servidor. Revisar la última sesión cerrada permite consultar pedidos y bloquea las mutaciones operativas del dashboard.

**COMPROBADO EN CÓDIGO + COMPROBADO EN DATOS.** Las cifras llamadas «Ventas» y «Ticket promedio» son volumen nominal de pedidos no cancelados, incluyendo pedidos pendientes, preparando y listos. No representan ventas finalizadas, cobros ni saldos. No hay `orders.completed_at`, `orders.updated_at` ni relación persistida `orders.store_session_id` en el código/esquema conectado auditados.

**COMPROBADO EN DATOS.** La base local compartida contiene una capa financiera adicional que el frontend de esta rama no consume: `order_financials`, cuentas, fondos, operaciones, transacciones, asientos y conciliaciones. También contiene campos para pedidos legacy y zona horaria. **Al inicio había 118 migraciones registradas frente a 74 archivos locales**: todas las 74 estaban registradas y faltaban 44 versiones aplicadas. Durante la auditoría aparecieron esos 44 archivos como untracked por una modificación externa a esta tarea: al cierre hay 118 archivos locales. Esta aparición de archivos no agrega consumidores UI ni actualiza los tipos del frontend. No se aplicó ni reconcilió ninguna migración desde esta tarea.

**INFERENCIA.** Una sección histórica independiente es viable como trabajo posterior, pero no debe reutilizar directamente el hero ni su loader como fuente histórica completa. Antes debe acordarse la fecha de finalización, el importe de venta y la política de unidades/categorías, y reconciliarse conceptualmente la rama con el contrato de la base heredada. La presente tarea no implementa esa sección ni modifica el dashboard.

## 2. Versión, entorno y límites

| Elemento | Evidencia de esta ejecución |
|---|---|
| Repositorio | `OrderOps`, carpeta `C:/Users/Oasis Desktop/Desktop/Full Stack Developer/Projects/OrderOps` |
| Rama | `cursor/commercial-core-v1-integration` |
| HEAD completo inicial | `3a3abb43b15f5e0448b89a3ced8fa47a584ebead` |
| Inicio registrado | `2026-10-12T00:03:13-03:00` |
| Revisión principal | Desde 00:03; primer corte de datos/código alrededor de 00:14; control de cambios externos a las 00:42 y revisión final posterior consignada al pie |
| Estado inicial | Sin diferencias tracked/staged informadas por `git status --short`. Untracked previos: `.codex-remote-attachments/`, `docs/landing-recovery-validation-2026-10-11.md`, `tmp/landing-recovery-2026-10-11/` |
| Instrucciones | Búsqueda de `AGENTS.md` incluyendo archivos ocultos fuera de `.git`/`node_modules`, y revisión de ancestros de la carpeta: no se encontró uno aplicable. Se siguió el documento adjunto de auditoría |
| Runtime local observado | Navegación a `http://localhost:3000/admin/dashboard` termina en `http://localhost:3000/admin/login`; formulario de acceso visible. Sin usuario autenticado en el navegador disponible |
| Segundo intento de consulta | Navegación a `/admin/dashboard/orders` bloqueada por el cliente de navegador. No se atribuye un HTTP 401 observado a ese intento |
| Runtime desplegado | No navegado en esta ejecución. `https://orderops.vercel.app` aparece en antecedentes, sin confirmar su versión actual |
| Runtime de herramientas | Node `v24.12.0`; package declara Next `^16.2.9`, React `^19.2.7`, TypeScript `^5.8.3`. Son declaraciones del repo, no una identificación de la versión del servidor abierto |
| Backend configurado | Se extrajo únicamente el host de la variable de URL local: `127.0.0.1:54321`. No se copiaron claves ni archivos de entorno |
| Backend consultado | Docker `supabase_db_OrderOps`, Postgres 17, base `postgres`; API local publicada en 54321 y DB en 54322. `SHOW timezone`: UTC |
| Conexión servidor/browser | `server.ts` y `service.ts` usan `getSupabaseEnv`; `client.ts` usa las mismas variables públicas. Browser puede conservar valores de compilación. Sin sesión autenticada no se comprobó tráfico de cada módulo hacia este backend |
| Relación con Majo | Consulta agregada: un negocio coincide con la identidad Majo. Esto confirma su presencia en la base, no qué build usa hoy la aplicación Majo ni un despliegue compartido de ambas aplicaciones |
| Roles presentes en datos | Dos perfiles `owner`. No se observaron pantallas autenticadas de owner ni otros roles |
| Procedencia de datos | Dos negocios activos; dos pedidos pendientes. No se pudo certificar si son pedidos reales, demo o fixtures de QA. Ninguno tiene `migration_evidence_id` informado; eso no demuestra procedencia real |

Las consultas SQL se ejecutaron mediante `psql -X`, `ON_ERROR_STOP=1`, dentro de `BEGIN READ ONLY … COMMIT`. La primera confirmó `transaction_read_only=on`. Se leyeron catálogos, definiciones de funciones y agregados. **No se invocó ninguna RPC de negocio**, ni siquiera las de resumen; sus fórmulas se inspeccionaron con `pg_get_functiondef`/`pg_proc`. Tampoco se ejecutaron tests SQL, seeds, bootstrap, builds o scripts que escribieran datos/artefactos.

### Cambio de la copia de trabajo durante la ejecución

**COMPROBADO EN CÓDIGO / ESTADO DE ARCHIVOS.** A las 00:13 el status conservaba los tres grupos untracked iniciales. A las 00:42 se detectaron 44 migraciones nuevas, versiones entre `20260909040000` y `20261004010000`, todas untracked. Rama y HEAD permanecieron iguales y no había diferencias tracked/staged. Esta tarea solo escribió el informe; no conoce el autor o mecanismo de incorporación de esos SQL y no los revirtió ni stageó.

Se revisaron sus contratos pertinentes y se conservan dos cortes: Q6 describe la divergencia inicial; Q7 describe el cierre. Las conclusiones sobre dinero/legacy/timezone ya tenían evidencia del esquema vivo y ahora también tienen SQL local como fuente. No afirmar a partir de la coincidencia de versiones que todos los cuerpos SQL/tipos/runtime estén alineados byte a byte: un ledger de migraciones no sustituye comparación de definiciones. Para reproducir el corte final deben conservarse también estos 44 archivos sin commit.

### Antecedentes contrastados

- `ORDEROPS_LIVING_MEMORY.md`: útil como mapa histórico, pero su encabezado dice Next 15.3 y algunas entradas clasifican los modos como roadmap. El package y los consumidores actuales tienen diferencias; no se aceptaron esas entradas como estado actual.
- `docs/CURRENT_PHASE.md:3`: presenta un release de septiembre y un HEAD anterior como estado actual. No describe el HEAD de esta auditoría ni la integración comercial de octubre.
- `docs/admin-dashboard-forensic-living-audit.md`: conserva arquitectura y cambios históricos, incluyendo QA anterior. Ese QA no se contabiliza como observación nueva.
- `docs/board-orders-session-scope-metrics-audit.md`: el señalamiento histórico sobre queue pressure que volvía a filtrar por «hoy» no describe la implementación actual de `getActiveOrdersInScope`, que usa el array recibido.
- `docs/admin-dashboard-metrics-semantic-audit-1.md`: confirma el volumen no cancelado; sus propuestas y columnas no sustituyen el SQL actual. En particular, no se comprobó una partida separada de envío.
- `docs/landing-recovery-validation-2026-10-11.md`: describe otro HEAD y cambios que entonces estaban sin commit. Hoy esos archivos operacionales no aparecen modificados; se conservó el informe anterior y sus temporales.
- El informe del 11/10 sobre la instalación heredada de Majo es referido por el encargo, pero su texto completo no fue localizado en esta copia. **La divergencia de esquema/migraciones sí se comprobó nuevamente**, con las consultas descritas más abajo.

## 3. Inventario completo de secciones y rutas

En esta tabla «Código» significa **COMPROBADO EN CÓDIGO**, no funcionamiento observado. Salvo login, runtime autenticado **NO VERIFICADO**. Los identificadores E remiten a archivos/símbolos/líneas en §11.

| Sección / ruta real | Propósito y entidades | Qué ve el usuario | Acciones y efectos trazados | Rol / flag / modo | Fuentes principales | Evidencia / cobertura |
|---|---|---|---|---|---|---|
| `/admin`, `/admin/login` | Entrada al panel | Acceso por email/contraseña, soporte | Autenticación; salida desde shell | Perfil asociado a negocio | Auth, `profiles` | E1; login observado |
| `/admin/dashboard` | Coordinar la operación del negocio | Hero, señales, pedidos, columnas o lista, búsqueda, sincronización | Abrir/cerrar sesión, pedido manual, consultar workspace, cambiar estado, tomar/liberar responsable | Todos leen; viewer no modifica; sesiones owner/manager; assignment por flag | `orders`, `order_items`, `order_events`, `store_sessions`, `business_settings`, Presence | E2–E8; Código |
| Workspace en `?order=[id]` | Resolver un pedido sin abandonar el tablero | Cliente, modalidad, productos/preparación, total, estado, contacto, responsables, timeline | Estado contextual/manual, responsabilidad, abrir detalle, copiar/contactar | Rol + política de sesión; assignment condicional | Seed/caché cliente y endpoints summary/workspace | E7–E10; Código |
| `/admin/orders/[id]` | Detalle profundo y acceso histórico por UUID | Información completa, productos, historial y acciones | Consultar fuera de la ventana; estado/asignación siguen guard del servidor | Perfil del mismo negocio; viewer solo lectura | Orden por id+business, eventos y contexto del cliente | E9; Código |
| `/admin/dashboard/orders` | Reconciliar lista | JSON para el cliente | GET vuelve a cargar el conjunto tenant | Autenticación; 401/500 en contrato | `getAdminOrders` | E2, E9; navegación bloqueada |
| `/admin/orders/[id]/summary`, `/workspace` | Hidratar tarjetas/detalle | JSON | GET; 401 sin contexto, 404 si ajeno/ausente | Tenant del perfil | Loaders por id+business, workspace incluye timeline | E9; Código |
| Modal de pedido manual | Ingresar pedidos recibidos fuera del catálogo | Datos de cliente, delivery/retiro, líneas, configuración, ticket | Validar y crear vía `create_order`; stock en SQL | updateOrders + sesión activa; flag/config de personalización | Productos disponibles, reglas de personalización, órdenes/items | E11; Código; sin submit |
| `/admin/kitchen` | Entrada condicional de cocina | Encabezado descriptivo | No hay tablero de cocina ni acciones propios implementados en esta página | `kitchen_mode_active`; layout autenticado | Settings del shell | E12; **placeholder**, no producto completo |
| `/admin/onboarding` | Autorizar asistencia de catálogo | Solicitudes y vigencia | Aprobar/rechazar/revocar grant; aprobación UI por 30 días | manageProducts; SQL valida solicitud/actor | RPC `business_onboarding_requests`, grants Commercial Core | E13; Código |
| `/admin/products` | Mantener oferta | Tabla/grid, filtros, páginas, flyouts | Crear, editar, disponibilidad, imagen, SKU, stock/track_stock | owner/manager; variante de actions para promotor autorizado | `products`, `categories`, Storage | E14; Código |
| `/admin/categories` | Organizar productos | Lista y formularios de categorías | Crear/editar categorías; cambia asociación actual, no snapshots vendidos | manageProducts; gate alternativo de promotor | `categories` | E14; Código |
| `/admin/products/customizations?product=[id]` | Construir opciones/extras/plus | Secciones reutilizables, asignaciones, overrides y sugerencias | Crear/editar/desactivar, quitar asignación, restaurar override, reordenar | manageProducts; flag de personalización controla su uso | customization groups/options/assignments/overrides, upsell groups/items | E15; Código |
| `/admin/products/preview` | Probar experiencia pública | Iframe de catálogo con contexto preview; vacío sin slug | Navegar preview; cookie de bloqueo de confirmación, salir a catálogo real | manageProducts; checkout preview bloqueado servidor | Slug, catálogo público, cookie scoped | E16; Código; cookie no activada |
| `/admin/settings` | Hub de configuración | Resumen y navegación de subsecciones | Acceder a secciones autorizadas | manageNotifications; permisos por subsección | Contexto de permisos | E17; Código |
| `/admin/settings/public` | Resumen de presencia pública | Branding, landing, catálogo y enlaces públicos | Entrar a editores/abrir vista pública | Entrada manageNotifications; contenido completo requiere managePublicSettings | `businesses` | E17; Código |
| `/admin/settings/public/landing` | Identidad y presentación | Logo, portada, descripción, color, Instagram | Guardar campos de negocio/subir assets; invalida presencia pública | owner/manager | `businesses`, Storage | E17; Código |
| `/admin/settings/public/catalogo` | Presentación del catálogo | Headline, badge, microcopy | Guardar hero público; invalida caché | owner/manager | `businesses.catalog_hero_*` | E17; Código |
| `/admin/settings/operations` | Estado de apertura y reglas de pedidos futuros | Bajo demanda, modos, reglas programadas condicionales | Abrir/cerrar a través de sesiones; guardar anticipación/corte/días inactivos si Programado activo | owner/manager escribe; operator accede con controles restringidos | `business_settings`, acciones de sesiones | E18; Código |
| `/admin/settings/notifications` | Preferencias personales | Sonido, toast, resaltado, browser/push y dispositivo | Guardar preferencias; registrar/revocar suscripción de dispositivo | UI manageNotifications; actions usan contexto autenticado | `profiles.notification_preferences`, `push_subscriptions`, browser | E19; Código; no permisos ni push activados |
| `/admin/settings/team`, alias `/admin/team` | Gestionar acceso interno | Miembros y roles | Crear usuario/perfil, cambiar roles gestionables; alias redirige | owner/admin equivalente; no auto degradación ni edición de owner/admin/super_admin | `profiles`, Auth admin service | E20; Código |
| `/admin/manifest.webmanifest`, `/api/internal/orders/[id]/push` | PWA y avisos | Manifest; avisos de nuevo pedido | POST push tiene efectos externos y no se ejecutó | Contratos propios del endpoint | Branding, push subscriptions | E19; Código, fuera de consultas funcionales |

### Límites y conexiones con otras superficies

| Superficie / rutas descubiertas | Relación con el comercio | Fuentes / acceso | Cobertura |
|---|---|---|---|
| `/super-admin`, `/super-admin/businesses`, `/super-admin/users` | Administración de plataforma: negocios/usuarios, altas y configuración global | `requireSuperAdmin`, Auth admin y tablas públicas; no es el dashboard tenant | Código de rutas y contexto; runtime no verificado |
| `/commercial`, `/commercial/opportunities`, `/commercial/opportunities/[id]` | Pipeline CRM y tareas; no ventas de pedidos del comercio | `commercial_session`, principal interno commercial/superadmin, RPC de oportunidades | Inventario y frontera comprobados; sin auditoría exhaustiva del CRM |
| `/promoter/login`, `/promoter`, `/promoter/businesses`, `/promoter/opportunities`, `/promoter/claims`, `/promoter/tasks`, `/promoter/profile` | Panel de promotor, negocios registrados, oportunidades, atribución/tareas/perfil | `promoter_session`, `promoter_overview`, autorización específica | Código; no sesiones de promotor observadas |
| `/promoter/onboarding`, `/promoter/onboarding/[businessId]` | Solicitar y utilizar asistencia autorizada; editor limitado de catálogo | Grants por negocio, vigencia y RPC; no convierte al promotor en operador tenant | Código y SQL del repo; sin concesiones ejecutadas |
| `/b/[slug]`, `/b/[slug]/catalogo`, `/checkout`, `/success` | Fuente pública de pedidos, vista preview y enlaces del comercio | Slug → business, cache de catálogo + aceptación dinámica; RPC de creación | Trazado de integración; no checkout ejecutado |
| `/`, `/demo`, `/demo/gracias`, `/privacidad`, `/sitemap.xml` | Marketing y solicitud comercial, separadas de ventas del comercio | Demo conecta con CRM; no constituye pedido operativo | Inventariadas como frontera; fuera del recorrido tenant |

No se descubrieron rutas tenant de Estadísticas, caja, finanzas, exportación, suscripción/checkout de planes ni un historial navegable independiente de sesiones. `delivery_mode_active` existe como setting, sin una ruta de administración delivery dedicada. No se encontró entidad separada de combos: su existencia comercial no se presume a partir de extras o upsells.

## 4. Recorridos funcionales y reglas de negocio

### 4.1 Contexto y entrada

**COMPROBADO EN CÓDIGO.** Layout protegido resuelve Auth → perfil → `business_id`, rol y preferencias. Carga marca del negocio para el shell. `getAdminContext` usa `cache` de React para deduplicar en el contexto de servidor; no equivale a caché global de permisos entre negocios. Sin usuario/perfil de negocio redirige al login. Las páginas de gestión usan `requireAdminPermission`; las consultas añaden business_id. Un perfil super_admin sin negocio no obtiene por sí solo contexto tenant.

El shell resuelve settings en browser mediante `useBusinessSettings`: carga/error/null, consulta por business_id y estado local. Cocina se oculta mientras carga o si el flag no es true. Ese hook no implementa una suscripción realtime universal a todos los settings. No hay resolución central de planes/entitlements de Estadísticas.

### 4.2 Dashboard, hero, búsqueda y columnas

Entrada SSR carga órdenes, sesión abierta, última cerrada y assignment flag en paralelo. `getAdminOrders` selecciona órdenes+items+eventos, filtra por business_id y ordena `delivery_date` ascendente. **No pagina, no pide count exact ni recorre rangos**. `supabase/config.toml` declara `max_rows=1000`: existe riesgo de truncamiento y de eventos embebidos incompletos bajo límites del API; no se midió el valor efectivo de PostgREST. Dos órdenes actuales no ejercitan ese límite.

Derivación: órdenes cargadas → hidratación/reconciliación → optimismo local → ventana por created_at → filtros → búsqueda → agrupación. Hero recibe el conjunto anterior a filtros/búsqueda. URL acepta `filter` y `order`; el texto de búsqueda permanece en estado cliente. Filtros: todos, pending, preparing, ready, delivery y pickup. Búsqueda operacional interpreta cliente, estado/situación y referencias/código mediante `natural-search.ts`; no consulta un histórico remoto adicional.

Todos muestra kanban; filtros específicos muestran lista. Columnas persistentes: pendientes, preparando, listos, completados. Cancelados aparece cuando existe en el conjunto base y se accede mediante la ventana de columnas terminales en desktop ancho. No se encontró drag and drop de pedidos en el dashboard actual: cambios por controles/acciones rápidas. El drag and drop encontrado corresponde a imágenes y orden de personalizaciones.

En móvil (≤767 px), columnas apiladas y completados/cancelados muestran inicialmente cinco pedidos, expandibles. Desktop ancho (≥1200 px) alterna conjuntos de cuatro columnas. Es paginación/disclosure de presentación, no recuperación de páginas faltantes en DB. Hero móvil y desktop usan el mismo view model. Foco, scroll y navegación modal se conservan con estado/URL y sessionStorage; sin QA visual nuevo.

Vacío operacional, ventana sin pedidos, filtros sin resultados y búsqueda sin coincidencias son estados distintos. Puede conservarse kanban vacío en «Todos». Los loaders lanzan error si falla la consulta; endpoint de refresh captura y responde 500. Sync expone offline, syncing, error, stale y synced, con stale después de cinco minutos sin éxito. No hay evidencia de una cola durable para operar offline.

### 4.3 Fórmulas actuales del hero

Todas las siguientes son **COMPROBADAS EN CÓDIGO**, E3/E5/E6. Sea W el conjunto de órdenes con `created_at ≥ start` y `< end`, y V las órdenes de W no canceladas.

| Indicador / señal | Fórmula o condición real | Implicación |
|---|---|---|
| Ventas | Σ `total_price` sobre V | Incluye activos; desconoce agreed_total y cobros |
| Ticket promedio | Ventas / cantidad de V; sin V muestra «Sin datos» | No denominador de completados |
| Pedidos activos | Count pending+preparing+ready en W | No incluye completed/cancelled |
| Producto más pedido | Cantidades de nodos raíz del árbol sobre V, agrupadas por `product_name` | Upsells adjuntos excluidos; huérfanos visibles como raíces; productos distintos con mismo nombre se fusionan |
| Listos para entrega/retiro | Count ready en W, sin distinguir modalidad en la tarjeta | No prueba entrega efectuada |
| Tiempo promedio | Media redondeada de (primer evento ready − primer preparing); fallback de inicio created_at | Sin ready no hay duración; ciclos/reaperturas no se modelan como nuevas muestras |
| Demorados | Activos con ≥20 min desde última actividad entre created_at, assigned_at y eventos | Una reasignación puede reiniciar el reloj sin avance de preparación |
| Estado de cocina | Preparando / capacidad global 5; redondea %; <80 fluida, 80–100 demanda alta, >100 saturada | Umbral global, no capacidad por negocio |
| Estado del negocio | Prioriza demorados, después saturación/demanda, después sin activos/fluid | No representa caja o salud financiera |
| Señales de sesión | Demorados, ≥2 listos, ≥3 ingresos en últimos 10 min, predominio delivery/retiro ≥70%; hasta cuatro por prioridad; fallback positivo | Ventana activa/última cerrada; predominio excluye cancelados, pico cuenta ingresos del conjunto |
| Presencia del hero | Se muestra cuando hay más de un usuario online | Estado realtime efímero, no historial de personal |

No hay selector de semana/mes/rango ni comparación automática de períodos implementados en el hero. Los atributos `futureActionKey` de señales no prueban acciones ejecutables: se renderizan como metadatos de tarjetas.

### 4.4 Apertura/cierre y continuidad

Owner/manager abre o cierra por server actions. Apertura inserta sesión o reutiliza la abierta y reconcilia `on_demand_mode_active`. Si falla esa sincronización después del insert intenta cerrar la sesión nueva como compensación. Cierre marca status/closed_at/closed_by y luego recalcula si queda otra abierta. Son varios requests, no una transacción única de sesión+setting. Fallos parciales son un riesgo operativo trazado, no reproducido.

El dashboard pide confirmación si detecta activos **del conjunto visible**, permite cerrar igual y no completa/cancela esos pedidos. Settings también llama `toggleBusinessStatus`; no debe darse por demostrado que aplica la misma advertencia de cierre. Al cerrar se revisa última sesión; al abrir otra se cambia la ventana y las órdenes viejas quedan fuera. Esto restringe también sus mutaciones por las actions actuales, aunque continúen pendientes. No se detectó selector de sesiones históricas arbitrarias.

### 4.5 Creación manual y pública, composición y stock

Manual: `createManualOrderAction` → updateOrders → validación de cliente/modalidad/ticket → sesión activa → rechazar personalizables enviados como líneas simples → validar configuración/precios → JSON RPC → `create_order` → hidratar orden. La fecha manual se deriva del momento operativo, sin selector de historial para crear hacia atrás.

Público: slug → negocio activo → bloqueo preview → aceptación fresca (setting + sesión cuando existe tabla) → teléfono argentino, dirección para delivery y fecha → configuración/cart → service client `create_order`. Si Programado está activo aplica anticipación/corte/días inactivos. Sin ese modo usa fecha de hoy en UTC por `toISOString().slice(0,10)`.

SQL actual y del repositorio: valida negocio activo y `on_demand_mode_active`, fechas, productos propios/disponibles, cantidades positivas y parents de upsell. Bloquea productos tracked, comprueba demanda agregada, genera código único tenant, crea parents e hijos, suma precios por cantidad y decrementa stock en la misma transacción. Registra `stock_movements` por línea tracked. La RPC no asigna store_session_id ni registra order_created en su cuerpo inspeccionado. La action manual y pública inspeccionadas tampoco muestran esa escritura; cero eventos actuales no acredita un historial completo de creación.

Extras/opciones se preservan en snapshot V1/V2, con cantidad por unidad y pricing de parent. Upsells son líneas order_items separadas enlazadas al parent. La representación de preparación omite precios de opciones y trata adicionales como hijos para evitar duplicación visual. Eso **no define automáticamente** la unidad estadística deseada para ventas. No se ejecutó ninguna creación ni reducción/reposición de stock.

### 4.6 Workspace, estados, correcciones y contacto

Modal usa datos iniciales de tarjeta/caché y carga detalle con `/workspace`; los fallos de hidratación tienen componentes de skeleton/error y recuperación. Deep link de detalle consulta por UUID+business sin filtrar por sesión. Workspace muestra productos, cliente, dirección/modalidad/fecha/notas, total nominal, timeline, riesgos, presencia y asignación condicional. No se encontró editor persistente de composición, dirección, importe o notas de pedidos ya existentes, ni action para eliminar pedido.

Estados reales: pending (recién ingresado), preparing (en preparación), ready (listo), completed (terminal operativo) y cancelled (cancelado). No hay estado separado de aceptación, pago o delivery entregado. UI ofrece siguiente estado contextual y selector de corrección manual. `updateOrderStatusAction` acepta cualquier estado del conjunto; la RPC tampoco exige un grafo de transiciones consecutivas. Permite retrocesos/reapertura operativa cuando el guard de sesión lo autoriza.

Action: valida rol, negocio y sesión → RPC `transition_order_status` → reload → inserta evento `status_changed` **en otro request**. Si falla el evento el cambio de estado puede seguir devolviendo éxito. RPC bloquea orden y comprueba perfil tenant no viewer; en su cuerpo no comprueba sesión, ni fecha de finalización, ni escribe timeline. RLS de UPDATE de orders se limita a pertenencia tenant/super_admin y no excluye viewer. **INFERENCIA de riesgo de permisos:** los guards de la UI/actions no protegen por sí solos acceso directo a tabla/RPC. No se probó explotación ni se alteraron políticas.

Cancelación desde pending/preparing/ready repone stock solo donde existe decremento ledger sin reposición previa. Cancelar desde completed no repone con esa regla. Reabrir desde cancelled no muestra un nuevo decremento en `transition_order_status`: riesgo de reabrir pedidos con stock ya restituido. Documentar en tarea separada; no corregido.

Contacto: `lib/whatsapp/admin.ts` construye `wa.me` con teléfono normalizado y plantilla contextual (resumen, aviso según estado/modalidad, confirmación de dirección); también genera `tel:` y Maps. Componentes permiten abrir y copiar texto. No son mensajes persistidos en OrderOps ni pruebas de envío/recepción. No se abrió WhatsApp, llamada ni Maps para transmitir datos.

### 4.7 Responsabilidad, presencia, timeline y realtime

Assignment se habilita solo con `order_assignment_enabled=true`, server-side fail-closed. Claim asigna usuario actual y timestamp; release solo permite liberar al responsable actual; claim puede reemplazar a otro responsable según el código. Update filtrado por id+business, sin compare-and-swap del responsable leído: posible carrera entre operadores. Los eventos llevan previous_assigned_to/released_from. No se realizó coordinación multiusuario real.

Presence canal por business_id, heartbeat de 30 s y caducidad local de 90 s; muestra personas online/viendo el pedido. No es ownership persistido ni auditoría histórica fiable. Escribir Presence es distinto de modificar pedido; al no entrar al dashboard autenticado no se observó ese canal.

Realtime de pedidos escucha INSERT/UPDATE/DELETE tenant. Patches y deduplicación por ID se combinan con summary/workspace y refresh silencioso. Candados de mutación in-memory de 8 s evitan que un eco viejo pise inmediatamente el optimismo; hay rollback/reconciliación. Reconexión, online y visibilitychange disparan recuperación con throttling. Sesiones tienen canal y rehidratación separada. Desconectado/error conserva información local que puede estar vieja; la señal «En vivo» tiene un fallback basado en presencia, que no constituye prueba suficiente de consistencia de todos los pedidos.

Timeline profundo: últimos 30 eventos en orden inverso y luego revertidos para presentación; puede omitir el inicio de un pedido con muchos eventos. Loader embebido del tablero tiene otro contrato, sin esa limitación explícita de 30. Nombres de actores se resuelven mediante service Auth admin listUsers, primera página hasta 1000: puede faltar identidad de autores. Ninguno de esos límites debe trasladarse a una agregación histórica.

### 4.8 Catálogo, configuración, equipo y asistencia

Productos: filtros q sobre nombre/SKU, categoría, stock (≤0, 1–5, >0) y activo/inactivo; orden created_at desc; 24 por página, máximo de limit 100, count exact. Flyout carga detalle bajo demanda. Crear/editar valida categoría del tenant, precio/nombre/stock y persiste products; disponibilidad tiene optimismo y validación server. SKU vacío puede autogenerarse. Imágenes van a Storage con crop/upload. Stock 0 y auto suspensión deben leerse con track_stock y los triggers actuales; no inferir agotado para todo producto sin tracking. No existe action actual de eliminación de productos/categorías en los archivos revisados. Categorías se consultan por `position` ascendente, nulls al final, después nombre.

**COMPROBADO EN CÓDIGO, corte final.** Los SQL externos incorporados documentan `products.archived_at`, archivo/restauración vía update y RPC `delete_product_permanently`, además de `save_product_edit_draft` y `save_category_display_order`. No se encontraron consumidores de esas RPC en app/lib/components/types actuales; no presentarlos como acciones disponibles de esta UI. La eliminación permanente SQL conserva snapshots de order_items y vuelve product_id null, limpia relaciones/stock_movements y devuelve image_url para limpieza de Storage posterior. La lista admin actual no filtra archived_at. El contrato de stock SQL actualizado fuerza indisponibilidad solo para track_stock=true y stock≤0; no reactiva automáticamente al reponer. El contrato de categorías incorpora posición/orden público y validaciones de rol.

Personalizaciones: groups/options, assignments por producto/categoría, overrides y grupos/items upsell; min/max/requerido/disponibilidad y cantidad de extras. Actions verifican manageProducts y pertenencia de entidades, actualizan tablas e invalidan catálogo. Hay eliminación de assignments/overrides; no confundirla con borrar pedidos. Arrastrar aquí reordena configuración persistida, por eso no se interactuó durante la auditoría.

Preview usa iframe, query flag y cookie httpOnly por ruta de negocio; checkout server bloquea creación por cookie o declaración isPreview. Sin slug muestra vacío. Catálogo tiene caché estable por negocio/tags, mientras aceptación pública es dinámica `noStore`; una oferta visible no implica tienda abierta.

Presencia pública guarda campos de businesses y assets; distingue resumen, editor landing y editor hero. Operación muestra flags como modos de suscripción, pero no implementa compra/entitlement billing. Guardar reglas programadas requiere managePublicSettings y scheduled activo. Notificaciones guardan preferencias del perfil actual, mientras push usa service client con scope de profile_id; actions no repiten la misma restricción de manageNotifications de la página. Es una divergencia UI/action a documentar, no una prueba de envío ilícito.

Equipo: owner gestiona manager/operator/viewer, crea Auth user+profile y actualiza rol con service client. Valida negocio, impide auto degradación y tocar owner/admin/super_admin. Falta de datos muestra vacíos/formularios según componentes; errores de acciones vuelven como mensajes. No se probó alta ni cambio de permisos.

Asistencia: página manageProducts lee solicitudes; actions reconsultan grant propio antes de aprobar/rechazar/revocar. Editor de promotor usa permisos/grants separados y campos de catálogo permitidos: no habilita precios, stock ni operación del dashboard por pertenecer al programa comercial. El flujo de conversión y términos comerciales existe en esquema commercial, sin consumo que condicione hoy las métricas del hero. Sus comisiones/cobros futuros no se suman a pedidos del negocio.

## 5. Mapa de dependencia de store sessions

**COMPROBADO EN CÓDIGO**, y ausencia de FK **COMPROBADA EN DATOS**. El nombre `store_session_id` aparece como campo opcional en el tipo del guard, pero no está en orders ni en sus selects/actions. El comportamiento efectivo es temporal.

| Consumidor | Dependencia | Regla actual | Efecto de abrir/cerrar | Evidencia | Implicación para Estadísticas |
|---|---|---|---|---|---|
| SSR dashboard | Directa | Carga abierta y última cerrada por negocio | Nueva renderización cambia contexto | E2, E4 | No usar como resolver de períodos históricos |
| Resolver abierta | Directa | status=open, closed_at null, opened_at desc, maybeSingle | Abierta tiene prioridad | E4:159 | Depende de unicidad; no elige arbitrary historial |
| Resolver última cerrada | Directa | status=closed, closed_at no null, desc y limit 1 | Cierre convierte sesión en referencia de revisión | E4:194 | Solo una sesión cerrada, no rango |
| getOperationalWindow | Directa | Abierta [opened_at, now); cerrada [opened_at,closed_at); fallback 00–24 | Cambia límites y fuente | E3:279 | Futura ventana independiente debe tener otro contrato |
| getAdminOrders / refresh | Indirecta cliente | SQL solo business_id, delivery_date asc; scope después | No filtra session_id en SQL | E2:109 | Puede consultar otras sesiones, pero loader no pagina |
| Hero | Indirecta | visibleOperationalOrders por created_at | Números cambian con la sesión, no por completed_at | E5:1828, E3:358 | No usar para P2/P3 |
| Kanban/lista/chips/búsqueda | Indirecta | Ventana → filtro → búsqueda → columnas/contadores | Viejos pedidos dejan conjunto visible | E6 | Necesita drill-down histórico aparte |
| Métricas/riesgos/queue | Indirecta | filteredOrders; aging usa now | Cambia contexto; reloj sigue actual | E5:1763, E6, E7 | No interpretar revisión cerrada como snapshot de riesgos al cierre |
| Controles/advertencia cierre | Directa/indirecta | Permiso + abierta; alerta por activos visibles | Cierra incluso con activos tras confirmación | E5:2514 | Sesión no certifica finalización ni saldo |
| Pedido manual | Directa | UI abierta y guard server obligatorio | Cerrada/sin sesión impide crear | E11:406, E4:52 | Fuente de ingreso sin vínculo session_id persistido |
| Mutación estado/responsable | Directa | Guard: ID si existiera, en esta rama created_at≥openedAt | Órdenes anteriores a apertura quedan bloqueadas | E8:119/311, E4:27/81 | Históricos deben consultar sin requerir operar |
| Workspace modal | Política + guard | Revisión cerrada bloquea UI de mutación, lectura posible | Rehidrata permisos y datos | E9/E10 | Lectura ≠ permiso para alterar histórico |
| Deep link detalle | Guard solo al escribir | GET por id+business sin ventana | Pedido viejo continúa consultable | E9 | Punto reutilizable para drill-down, no loader agregado |
| Realtime pedidos | Indirecta | Canal tenant, no sesión; renderer scope después | Puede recibir fuera del conjunto visible | E7 | Suscripción no asegura cobertura histórica |
| Realtime sesiones | Directa | Canal store_sessions tenant, hidratación/visibilidad/online | Actualiza abierta/última y recomputa | E7 | No suscribir Estadísticas solo a cambios de sesión |
| Apertura/cierre y setting | Directa | reconcile deriva on_demand del count abiertas | Habilita/deshabilita recepción | E4:292–387, E18 | Estado comercial/aceptación distinto de período estadístico |
| Catálogo/checkout público | Directa de aceptación | on_demand true y abierta si tabla disponible; fallback legacy si falta | Deja navegar oferta, bloquea confirmación cerrada | E21 | Disponibilidad no define universo histórico |
| create_order SQL | Solo setting | Verifica on_demand; no busca/adjunta sesión | Puede diferir del guard app | E22 + Q3 | Aislar invariantes de aplicación y DB |
| Productos/categorías/settings/team | Sin scope de sesión | Tenant/rol/flags y sus propios filtros | Consultas no cambian de período | E14–E20 | Catálogo actual no es catálogo histórico |
| Finanzas en DB | Sin FK de sesión | business+order, fechas de movimientos/estado financiero | No acopladas a store_sessions en fórmulas leídas | Q2–Q5 | Cobros requieren período por occurred_at, no sesión |

**COMPROBADO EN DATOS:** existe una orden del negocio con sesión abierta creada antes de su apertura. No se alteró para demostrar visibilidad. **INFERENCIA:** esa orden queda fuera del tablero actual por el filtro y bloqueada por las actions si se intenta operarla; la consulta profunda sigue siendo viable por contrato.

No hay horarios semanales configurables para estadísticas ni acoplamiento de apertura con un calendario semanal automático. Hay reglas de fechas programadas y sesiones manuales. El helper genérico admite un tramo que cruza medianoche, pero el dashboard consume una constante global 00–24.

## 6. Diccionario de datos y semántica

### 6.1 Fechas, estados e historial

| Campo / entidad real | Significado y contrato | Evidencia / calidad |
|---|---|---|
| `orders.created_at` | Ingreso persistido timestamptz; base de ventana/aging | Repo + DB; no equivale a finalización |
| `delivery_date`, `delivery_time` | Fecha prevista y texto de hora; no timestamp de entrega efectiva | DB permite null a diferencia de tipo/SQL antiguo |
| `assigned_at` | Última asignación; se limpia al liberar | Persistido, cambia con coordinación |
| `orders.status` | Estado operativo actual, no financiero | Cinco valores; backwards permitidos |
| `order_events.created_at` + payload from/to | Momento de registro de transición por action | Evento fuera de la transacción de cambio; historial no garantizado |
| completed/preparing/ready/cancelled_at | No columnas propias en orders | Fechas solo derivables de eventos que existan |
| Aceptación | No fecha/estado separado; preparing puede ser el primer avance | No inventar accepted_at |
| `store_sessions.opened_at/closed_at` | Límites de operación manual | No fechas de venta/finalización |
| `order_financials.settled_at/cancelled_at` | Cierre/cancelación **financiera** | DB conectada y SQL incorporado al cierre; ausentes de consumidores/tipos tenant de esta rama; no entrega operativa |
| `finance_transactions.occurred_at` | Fecha económica informada o now como fallback | Distinta de created_at (registro); admite movimientos tardíos por contrato |

Reabrir operativamente no borra eventos previos si fueron insertados, pero el cálculo actual usa `.find` de primera finalización/preparación/listo. Un evento faltante no se reconstruye automáticamente. La tabla order_events tiene FK cascade a orders; no es una garantía inmutable frente a eliminación administrativa. No hay trigger en orders que registre finalización/evento atómicamente: los dos triggers activos observados son de identidad/evidencia de importación.

**NO VERIFICADO:** una fecha fiable de finalización para todos los pedidos históricos. En la muestra no hay completados: «0 completados sin evento» es un conteo vacuo, no validación del historial. `updated_at` no se usó como sustituto; ni siquiera existe en orders actual.

### 6.2 Dinero: UI, contrato de venta y ledger

**COMPROBADO EN CÓDIGO + DATOS.** `total_price` se genera en create_order como Σ unit_price×quantity de parents e hijos. Extras forman parte del precio parent. No se encontró columna ni parámetro de tarifa de envío, descuento general o ajuste monetario del pedido en esa RPC. Delivery es una modalidad y una dirección, no una partida monetaria persistida. Por eso P11 «ventas incluye envío» **no está respaldado como partida separada** por el flujo actual. Un precio nominal que contenga una negociación implícita no demuestra importe de envío. El SQL incorporado `20260926017000_order_contract_finalize.sql` exige itemized con total conocido y legacy_unknown con total null; no confundir nulabilidad del contrato legacy con datos opcionales arbitrarios de todos los pedidos.

La UI muestra `total_price` en total/hero; no consulta `order_financials`. DB permite total_price null y `composition_status=legacy_unknown`, que los tipos del repo no contemplan. No tratar una suma JS que convierte null en cero como dato de ventas conocido.

Contratos financieros **COMPROBADOS EN DATOS por definición SQL**, sin invocación:

| Concepto | Fuente / fórmula actual en DB | Distinción necesaria |
|---|---|---|
| Total nominal | `orders.total_price` | Composición de productos; puede ser null legacy |
| Total acordado | `order_financials.agreed_total`, nullable | Contrato de cobro; no necesariamente nominal; set_order_agreed_total no permite menor que paid_net ni limpiar tras cobro |
| Estado financiero | `financial_status`: open/settled/cancelled | Independiente de orders.status |
| Cobrado `paid_net` | `private.order_paid_net`: entradas in posted de deposit/order_payment sin contrapartida out en esa transacción, más historical_deposit del fondo committed propio; resta payment reversals, piso 0 | Excluye transferencias internas y releases como cobro nuevo; no resta todas las devoluciones |
| Devoluciones | `private.order_refunded_amount`: allocations refund+operation order_refund | Se descuentan para net_collected, no confundir con reversión de pago |
| Cobrado después de devoluciones | `order_financial_exception_summary.net_collected = paid_net − refunded_amount` | «paid_net» y «net_collected» tienen semánticas distintas |
| Saldo contractual | `private.order_remaining`: null si agreed_total null; si no max(agreed_total−paid_net,0) | No igual a total_price−cobros; no deducirlo del hero |
| Saldo exigible | collectible_remaining: remaining solo si financial_status=open; 0 en cerrado/cancelado | Resumen global distingue contractual_order_remaining/collectible_order_remaining |
| Fondos protegidos | committed: suma balances de funds committed del pedido | Dinero reservado, no venta/cobro adicional |
| Fondos liberados | released: salidas committed de release_deposit/order_retention menos allocations payment_reversal liberadas | Movimiento interno; no volver a sumar como ingreso |
| Caja / cuentas / fondos | finance_accounts/funds + finance_transaction_entries.direction/amount | No sumar entradas y transferencias indiscriminadamente |
| Ledger | finance_operations → transactions → entries; posted/voided | Evitar multiplicar operation por transacciones/asientos en joins |
| Seña histórica | `create_historical_deposit`, occurred_at explícito o now | Fondo committed propio; no equivale necesariamente a dinero nuevo recibido hoy |
| Cierre/reapertura | settle requiere agreed_total positivo, paid_net igual y remaining 0; reopen settled→open limpia settled_at | No representa completed del pedido |
| Anulación/devolución/ajuste | RPC y tipos para refund, retention, payment_reversal, correction, void, adjustment | Existen backend; no UI en esta rama; efecto histórico requiere contrato por evento/fecha |

**No se sumaron importes ni se publicaron detalles de pagos.** La base tiene cero finance_operations/transactions en esta muestra. Las fórmulas anteriores no tienen validación empírica de casos parciales, tardíos o devoluciones aquí. El resumen financiero de lista tiene p_limit por defecto 100, máximo 500, sin paginación histórica completa en su cuerpo. No reemplaza una fuente por período.

Los roles financieros DB exigen membership del negocio; read permite owner/admin/manager/operator/viewer; operate también operator; excepciones/contrato/correcciones se restringen a owner/admin/manager; escrituras exigen finance_enabled. Un super_admin sin membership no se habilita automáticamente en `require_business_member`. Esto difiere de algunos permisos generales de plataforma. Dinero del comercio, atribución/comisiones de promotor y suscripción de OrderOps pertenecen a contratos distintos; esta muestra no prueba pagos de promotores/suscripción.

### 6.3 Productos, unidades, categorías y legado

`order_items.product_name`, unit_price y quantity son snapshots; product_id nullable con ON DELETE SET NULL. Renombrar producto no cambia snapshot vendido. El top actual agrupa por nombre, con riesgo de separar un mismo producto renombrado o fusionar productos distintos. Una línea actual ya tiene product_id null: ranking por ID debe prever la identidad desconocida.

`item_kind=product|upsell`, parent_order_item_id y customization_snapshot V1/V2 definen árbol. Cantidad parent no equivale a número de filas ni a cantidad de opciones extra. Para sumar importes de la composición puede contarse una vez cada línea parent/hijo; no sumar otra vez deltas del snapshot ya incluidos en unit_price. Para unidades hay al menos dos lecturas: unidades principales (semántica del card/top) y productos físicos incluyendo upsells; el usuario debe elegir.

Categoría se obtiene hoy vía products.category_id→categories. No hay snapshot categórico en columnas order_items del esquema inspeccionado; no se comprobó preservación universal en snapshots JSON. Renombrar/recategorizar/eliminar puede alterar un análisis con categorías actuales. Con productos borrados la categoría puede perderse. `legacy_unknown` admite pedidos sin composición fiable en el contrato DB aunque los dos presentes son itemized; no inferir cero unidades cuando composición sea desconocida.

Si se decide usar agreed_total o un ajuste global, el reparto por producto/categoría necesita una regla explícita. Σ composición y total acordado pueden divergir; tampoco se puede atribuir un envío a una categoría de producto sin decisión adicional.

### 6.4 Horarios, zona horaria y modos

Reglas persistidas Programado: `scheduled_min_lead_time_hours` (default 24), max_days_in_advance (30), cutoff_time (`18:00:00`) e inactive_working_days (0 domingo a 6 sábado). Formato y defaults comprobados en helpers/SQL; valores activos del negocio solo parcialmente consultados (flags). No son apertura por tramos, calendario de feriados/excepciones ni definición de día estadístico.

El dashboard usa global `DEFAULT_BUSINESS_WINDOW_CONFIG=00:00–24:00`; Date/setHours/toLocale del cliente usan su zona local, no un timezone tenant explícito. DB usa UTC; checkout obtiene hoy UTC, SQL usa current_date/current_time, helpers programados calculan Date local. **INFERENCIA:** pueden diferir alrededor de medianoche. DB tiene business_settings.timezone (un negocio con America/Argentina/Buenos_Aires y otro null), pero este repo no declara/consume ese campo en su contrato de settings. No se probó el caso de medianoche.

Hay implementación parcial de Programado: flag, selector/validación pública de fecha futura, reglas y edición condicional. No es correcto decir que solo existe en documentos. Tampoco permite dar por implementado un dashboard especializado ni estadísticas Programadas: la ventana actual sigue created_at/sesión. En la base observada ambos scheduled=false. Bajo demanda combina estado de recepción con sesiones; kitchen=false y delivery=false en ambos negocios. Cocina actual es placeholder.

### 6.5 Roles, scoping y flags

| Rol tenant | Ver pedidos | Cambiar/crear pedido | Productos/categorías/público | Sesiones | Equipo | Preferencias UI |
|---|---|---|---|---|---|---|
| owner; admin legacy normalizado | Sí | Sí con sesión | Sí | Sí | Sí | Sí |
| manager | Sí | Sí con sesión | Sí | Sí | No | Sí |
| operator | Sí | Sí con sesión | No | No | No | Sí |
| viewer | Sí | No por actions | No | No | No | No por ruta |
| super_admin | Normaliza a owner si consigue contexto con negocio | Depende de contexto/action/SQL | No asumir equivalencia para RPC financiera/comercial | Contexto necesario | Plataforma aparte | Contexto necesario |

Aislamiento tenant: business_id del perfil + filtros explícitos + RLS; el service client omite RLS y exige scoping/guard explícito en cada consumidor. Permiso, modo y flag son capas diferentes.

Flags existentes por negocio: on_demand_mode_active, scheduled_mode_active, kitchen_mode_active, delivery_mode_active, product_customization_enabled y order_assignment_enabled. Los dos últimos fail-closed server-side (solo true explícito, error/missing→false); options permiten reutilizar valor leído evitando doble consulta. Navegación esconde Cocina mientras carga y si false/null. Caché pública por negocio/tags se invalida con mutations; aceptación se mantiene fresca. Hay finance_enabled en DB, pero no integración con UI de esta rama ni flag de estadísticas existente. No se creó ni reemplazó sistema de flags.

**INFERENCIA para reutilización futura:** resolver contexto/permisos, settings tenant y patrón fail-closed existente es compatible con nueva sección bajo flag. Faltan el flag concreto, su contrato en DB/tipos, permisos y guards de rutas/consultas. Una etiqueta de «Suscripción» en settings no demuestra entitlements comerciales centralizados.

## 7. Matriz de viabilidad de estadísticas históricas

Datos observados por SQL: dos negocios activos, dos perfiles owner, dos órdenes pending/itemized creadas el 06/10/2026, dos líneas product (una sin product_id), cero snapshots en esas líneas, cero eventos, dos financials open con agreed_total informado e igual al nominal, cero operaciones/transacciones financieras y una sesión abierta. No hay muestra de completados, cancelados, sesiones cerradas, upsells, pagos, devoluciones o importaciones. Los conteos globales **no son una consulta autorizada de usuario tenant**; las futuras fuentes deben filtrar por negocio antes de agregar.

| Indicador / análisis | Definición requerida | Tabla / campo / función real | Regla temporal | Cobertura histórica | Calidad / limitación | Evidencia |
|---|---|---|---|---|---|---|
| Ventas completadas con envío | Importe de completed dentro del período, incl. envío | orders.status/total_price; DB agreed_total como alternativa contractual | Finalización requerida; created_at actual no basta | No completados observados | No completed_at ni partida envío; total nullable legacy; elegir importe | E3/E8/E22, Q1–Q5 |
| Pedidos completados | Órdenes distintas, política de reapertura | orders.status + order_events to_status=completed | Primera/última finalización/evento pendiente de definir | Cero eventos/completados | Inserción de evento no atómica; no garantía universal | E8/E23, Q3/Q4 |
| Ticket promedio | Ventas / count completed del mismo universo | Fuentes anteriores | Mismo período/fecha de ventas | No validación empírica | Hero divide por no cancelados; faltan null/base cero | E3:450, Q4 |
| Unidades vendidas | Cantidad física/principal con composición conocida | order_items.quantity/item_kind/parent, snapshots | Órdenes completed del período | Dos líneas simples; nada V1/V2 observado | Definir upsells/extras; legacy_unknown no es cero | E24, Q1/Q4 |
| Evolución y comparación | Agregados por día estadístico y período equivalente | created_at/eventos; falta calendario estadístico | Zona/huecos/medianoche/transcurrido pendientes | Solo un día de creación presente | Sin agregador histórico completo; loader limitado | E2/E3/E18, Q4 |
| Ranking unidades | Identidad estable + cantidades elegidas | product_id nullable, product_name snapshot | Finalización para P2 | Una línea sin identidad | Top por nombre no reutilizable sin política | E3:460/E24, Q4 |
| Ranking importe | Línea histórica unit_price×quantity; política de ajuste | order_items, agreed_total alternativo | Finalización | No ventas completadas | Evitar duplicar snapshot/hijos; reparto de agreed/envío pendiente | E22/E24/Q5 |
| Categorías unidades/importe | Categoría histórica o clasificación actual explícita | products.category_id/categories; sin snapshot universal acreditado | Finalización + política de vigencia de categoría | No historia categórica auditada | Cambios/eliminaciones reescriben clasificación actual | E14/E24, Q1 |
| Actividad por ingreso | Count entradas elegidas por created_at | orders.created_at | Día/hora tenant | Dos ingresos el 06/10 | P16 pendiente; definir cancelados/fuentes/legacy | E2, Q4 |
| Actividad por finalización | Count completions con tratamiento de ciclos | order_events, sin completed_at | Evento de completion | Ninguna | Calidad y pertenencia temporal no demostradas | E8/E23, Q4 |
| Cobros/señas | Flujos netos por fecha económica, no transferencias | finance_operations/transactions/entries, private.order_paid_net | occurred_at; created_at fecha registro | Cero movimientos | SQL disponible pero no UI/tipos repo; paid_net acumulado no serie por período | Q2/Q5 |
| Saldos pendientes | Contractual vs exigible open, fecha de corte | order_financials + private.order_remaining/exception_summary | Saldo actual o reconstruido a corte (definir) | Dos financials open | agreed_total nullable; snapshot actual no saldo histórico | Q1/Q4/Q5 |
| Tiempos operación | Tramos de ciclo con eventos completos | order_events from/to y created_at | Eventos de ciclo; media por muestra conocida | Ninguno | `.find` primer evento actual no trata reapertura robustamente | E6/E23, Q4 |
| Cancelaciones | Separar cancelación operativa/financiera/devolución | orders.status, events; financials.cancelled_at, refund allocations | Evento/fecha elegida | Ninguna en muestra | Cancelled actual no cuenta todos los eventos históricos | E8/E22, Q4/Q5 |

No extrapolar sesión actual para ninguna fila. Consultar fuera de sesión está soportado por query/ID, pero la disponibilidad histórica completa exige paginación o agregación de backend diseñada posteriormente. No se creó función agregadora ni fixture. Definiciones SQL disponibles permiten evaluar factibilidad, no declarar PASS funcional de estadísticas.

## 8. Compatibilidad con decisiones confirmadas

| Referencia | Evaluación con evidencia actual | Trabajo o aclaración pendiente |
|---|---|---|
| Alcance V1 / nueva sección bajo flag | Patrón tenant de flags existe; sección/flag concreto ausentes | Definir permiso, flag, ruta y fallback; no implementados |
| P1 ventas/demanda → cobros → operación | Compatible como prioridad de diseño | Fuente de venta y finalización antes de fórmulas |
| P2 completed dentro del período | No es semántica del hero | Decidir finalización/ciclos y cobertura sin eventos |
| P3 independencia de sesiones | Necesaria; hero abierta/última/fallback comprobado | Fuente independiente, no migrar dashboard en V1 |
| P4/P5/P6 horarios por negocio/día/múltiples tramos | No existe ese calendario; reglas programadas son otra cosa | Nuevo contrato de horarios, excepciones y vigencia |
| P7 fuera de horario incluido | Posible con consulta temporal independiente | Atribución al día pendiente, incluir sin etiqueta no la resuelve |
| P8/P9 semana inicial y presets/rango | No selector histórico actual | Semana/zona/límites/rango inclusivo/exclusivo |
| P10 tramo transcurrido anterior | Sin implementación reutilizable | Alinear duración estadística y tratar base cero/datos insuficientes |
| P11 incluir envío | Modalidad existe; importe separado no acreditado | Determinar si agreed_total lo contiene o falta fuente; no cambiar elección |
| P12 cuatro tarjetas | Ventas/ticket actuales son otros universos; completed count existe como helper | Cambiar definiciones en sección futura, unidades pendientes |
| P13 evolución selector | No implementación actual | Fuente agregada y calidad por indicador |
| P14 ranking selector | Cantidad raíz por nombre existe | Identidad/upsell/importe/legacy/reparto |
| P15 categorías selector | Categorías actuales disponibles | Historia o clasificación actual y desconocidos |
| P16 actividad ingreso/finalización/ambas/posponer | **PENDIENTE, SIN ELECCIÓN REGISTRADA** | Presentar diferencia de cobertura: created_at presente, completion no garantizada |
| Futuro Programado | Ya hay piezas runtime/SQL parciales, flags OFF en muestra | Revisar terminología de «futuro» sin asumir semántica analítica ni dashboard completo |

Se preservan todas las elecciones. Las aclaraciones corrigen supuestos de soporte técnico, no decisiones de producto.

## 9. Hallazgos, bloqueos y datos faltantes

| Prioridad para diseño | Hallazgo | Clasificación | Consecuencia / tarea separada sugerida |
|---|---|---|---|
| Alta | Al inicio faltaban 44 migraciones aplicadas; aparecieron como untracked durante la tarea. Finanzas/legacy/timezone siguen sin tipos/consumidores tenant | COMPROBADO EN DATOS + CÓDIGO | Conservar ambos cortes y revisar contrato autoritativo de instalación heredada. Coincidencia de versiones no valida tipos/cuerpos/runtime. No reset/reconcile automático |
| Alta | No finalización persistida fiable; eventos fallan después de RPC sin revertir estado | COMPROBADO EN CÓDIGO + DATOS | Acordar contrato y auditoría histórica específica; no backfill automático |
| Alta | Hero incluye activos; ventas nominales no son cobros/agreed_total | COMPROBADO EN CÓDIGO | Definición explícita de venta para nueva sección |
| Alta | Total/envío/legacy: no partida envío; DB permite null | COMPROBADO EN CÓDIGO + DATOS | Determinar fuente contractual y desconocidos; no asumir cero |
| Alta | UPDATE orders RLS no aplica rol viewer y RPC status no aplica sesión | COMPROBADO EN DATOS; riesgo INFERENCIA | Revisión de seguridad separada, sin explotación ni parche en auditoría |
| Media | Loader orders sin paginación; API repo max_rows 1000; timeline profundo 30 | COMPROBADO EN CÓDIGO | Fuente histórica por período/paginación en trabajo futuro |
| Media | Abrir otra sesión oculta/bloquea pedido viejo; existe uno anterior a abierta | COMPROBADO EN CÓDIGO + DATOS; conducta UI INFERENCIA | No usar sesiones como semántica de estadísticas |
| Media | Fecha UTC/browser/SQL y timezone tenant no consumido | COMPROBADO EN CÓDIGO + DATOS; bug de medianoche INFERENCIA | Contrato temporal y QA posterior |
| Media | Identidad/categoría histórica incompleta; una línea sin product_id | COMPROBADO EN DATOS + CÓDIGO | Desconocidos y política de categorías; no suprimir ventas |
| Media | Reabrir cancelado no redescuenta stock en RPC leída | COMPROBADO EN CÓDIGO + DATOS; efecto operativo INFERENCIA | Revisar reaperturas/stock por separado |
| Media | Assignment claim puede reemplazar y update carece de CAS | COMPROBADO EN CÓDIGO; carrera INFERENCIA | QA multiusuario y regla de ownership separada |
| Cobertura | Sin login disponible; solo owner en datos, sin otros roles ni historial | OBSERVADO EN RUNTIME + COMPROBADO EN DATOS | Lectura autenticada por roles pendiente; no crear cuentas/fixtures aquí |

No se corrigió ninguno. La auditoría no considera un hallazgo inferido como incidente reproducido. Tampoco considera vacío financiero una ausencia de funcionalidad: el backend existe y fue inspeccionado.

## 10. Cobertura de verificación por sección, rol y entorno

| Sección / capa | Código | Esquema/datos | Runtime de consulta | Escritura E2E |
|---|---|---|---|---|
| Auth/entrada tenant | Sí | Dos perfiles owner, sin datos personales | Login y redirección observados | No ejecutada |
| Dashboard/hero/kanban/search | Sí, fórmula y derivación | Orders/items/settings/sesiones consultados | No autenticado | No ejecutada |
| Workspace/detalle/endpoints | Sí | Entidades/contratos, eventos vacíos | GET lista bloqueado por cliente; demás no visitados | No ejecutada |
| Manual/público | UI/actions/SQL trazados | create_order vivo leído, líneas existentes agregadas | No ejecutado | No ejecutada |
| Productos/categorías/personalizaciones/preview | Páginas, actions, modelos y flag | Tablas presentes; muestra sin snapshots | No autenticado | No ejecutada |
| Configuración/presencia/operación | Sí | Settings y timezone/flags observados | No autenticado | No ejecutada |
| Equipo/notificaciones | Sí | Roles/tablas presentes | Sin prueba de dispositivo/permisos | No ejecutada |
| Asistencia/Commercial/promotores/plataforma | Rutas, guards y conexiones | Esquema commercial presente | Sin principal de esos roles | No ejecutada |
| Finanzas heredadas | Ausentes del frontend/tipos de esta rama | Esquema y fórmulas vivos, cero movimientos | Sin UI en esta rama | No ejecutada |
| Responsive/offline/realtime/multiusuario | Componentes/contratos trazados | No prueba de suscripción ni concurrencia | Sin QA móvil/desktop autenticado | No ejecutada |
| Producción/Majo como app | Antecedentes solamente | Majo presente en DB local | No visitadas | No ejecutada |

**NO VERIFICADO** para runtime autenticado owner/manager/operator/viewer/admin/super_admin/commercial/promoter. Las consultas privilegiadas de catálogos/agregados no simulan permisos de usuario. No se declararon pruebas completas de flujos de escritura por haber leído sus contratos.

## 11. Fuentes y referencias reproducibles

Rutas relativas a la copia auditada. `archivo:línea` identifica el inicio de un contrato, no toda su extensión.

| ID | Archivo / símbolo / línea |
|---|---|
| E1 | `lib/admin/context.ts:41` getAdminContext; `:99` requireAdminContext; `:109` requireAdminPermission; `lib/admin/permissions.ts:13` normalización/matriz; `app/admin/(protected)/layout.tsx:18`; `components/admin/admin-nav-config.ts:30` |
| E2 | `app/admin/(protected)/dashboard/page.tsx:10`; `lib/orders/admin.ts:91` getAdminOrders, `:161` dashboard por ID, `:228` detalle por ID; `app/admin/(protected)/dashboard/orders/route.ts:5`; `supabase/config.toml:17` max_rows |
| E3 | `lib/orders/analytics.ts:74` policy, `:221` default, `:279` window, `:358` filtro temporal, `:431` completed, `:444` revenue, `:450` ticket, `:460` top, `:488` analytics |
| E4 | `lib/store-sessions/admin.ts:27` pertenencia, `:52` creación, `:81` mutación, `:159` abierta, `:194` última cerrada, `:292` reconcile, `:307` abrir, `:387` cerrar |
| E5 | `components/admin/orders/admin-dashboard-orders.tsx:142` stale, `:171` constante, `:1646` ventana, `:1693` board, `:1763` métricas filtradas, `:1828` hero, `:2514` cierre |
| E6 | `lib/orders/dashboard-board-view-model.ts` buildDashboardBoardViewModel; `lib/orders/dashboard-execution-view-model.ts` filtros/sync; `components/admin/orders/DashboardKanbanBoard.tsx:25` columnas, `:41` breakpoints, `:237` límite móvil |
| E7 | `components/admin/orders/use-admin-orders-realtime.ts:45` TTL, `:234` INSERT, `:266` UPDATE, `:353` DELETE; `use-admin-store-session-realtime.ts:118`; `use-admin-presence.ts:36`; `lib/orders/dashboard-order-reconciliation.ts` |
| E8 | `app/admin/(protected)/orders/[id]/actions.ts:119` updateOrderStatusAction, `:188` RPC, `:271` evento separado, `:311` assignment; `lib/orders/assignment-flags.ts:19` fail-closed |
| E9 | `app/admin/(protected)/orders/[id]/page.tsx:23`; rutas `summary/route.ts:11`, `workspace/route.ts:12`; `lib/orders/workspace.ts` seed/patch; `use-order-workspace-hydration.ts` |
| E10 | `components/admin/orders/order-workspace.tsx`, `order-detail-page-client.tsx`, `admin-order-workspace-modal.tsx`, `order-total-section.tsx`; `lib/whatsapp/admin.ts:116`, `:236`, `:247`, `:309` |
| E11 | `app/admin/(protected)/orders/actions.ts:390` productos, `:406` createManualOrderAction, `:485` create_order; `manual-order-modal.tsx`; `lib/orders/manual-order-customization-*`; `lib/product-customization/order-validation.ts` |
| E12 | `app/admin/(protected)/kitchen/page.tsx:8`; `components/admin/admin-nav-config.ts` isAdminNavItemFeatureEnabled |
| E13 | `app/admin/(protected)/onboarding/page.tsx:12`; `actions.ts:22`; `supabase/migrations/20261011030000_commercial_onboarding_reads.sql`; migrations `20261011021000`, `20261011021100`, `20261011022000` |
| E14 | `lib/products/admin.ts:17` page size, `:84` getAdminProducts; `lib/categories/admin.ts:12`; products actions `:54`, `:150`, `:211`; categories actions `:16`, `:74` |
| E15 | `app/admin/(protected)/products/customizations/page.tsx`; `actions.ts:101` groups, `:275` options, `:595` assignments, `:795` removal, `:883` overrides, `:1182` upsells; `lib/product-customization/admin.ts`; `flags.ts:19` |
| E16 | `app/admin/(protected)/products/preview/page.tsx`; preview actions; `lib/admin/catalog-preview.ts` cookie/shouldBlockCatalogPreviewOrder; `components/admin/products/catalog-preview-shell.tsx` |
| E17 | `components/admin/settings/settings-navigation.tsx:38`; settings page/public page/landing/catalogo; `app/admin/(protected)/settings/public/actions.ts:16`, `:105` |
| E18 | `app/admin/(protected)/settings/operations/page.tsx:6`; `operations-settings-client.tsx:30`; `actions.ts:68`; `dashboard/actions.ts:46`, `:94`, `:151`, `:169`; `lib/business/scheduled-delivery-rules.ts:8` |
| E19 | Settings notifications page/actions `:20`, `:97`, `:154`; `lib/notifications/*`; `app/api/internal/orders/[id]/push/route.ts`; `app/admin/manifest.webmanifest/route.ts` |
| E20 | `app/admin/(protected)/settings/team/page.tsx`; `components/admin/team/admin-team-settings-view.tsx`; team actions `:17`, `:59`; `lib/admin/team.ts:35`, `:79`, `:134`; `/admin/team/page.tsx:4` |
| E21 | `lib/store-sessions/acceptance.ts:5`, `public.server.ts:34`; `app/b/[slug]/checkout/actions.ts:71`; `lib/catalog/public-cached-data.ts`, `public-cache-tags.ts`; `lib/business/public-catalog-readiness.ts` |
| E22 | `supabase/migrations/20260827234500_add_orders_order_code.sql:88` create_order, `:349` insert, `:441/:494` suma, `:498` total; `20260717140000_product_stock_restock_cancel_1.sql:6` transition; defs vivos Q3 |
| E23 | `lib/orders/events.server.ts:16` insert y `:49` loader limit 30; `lib/orders/metrics.ts:258` completion y `:270` preparation; `lib/orders/constants.ts`; `lib/orders/saturation-metrics.ts:25`; `queue-pressure.ts:26`; `20260516233000_s4_order_events.sql` |
| E24 | `lib/product-customization/order-dashboard.ts:368` árbol; `order-types.ts`, `order-preparation.ts`, `order-snapshot.ts`; `lib/orders/dashboard-card-summary.ts`; `20260426221000_t3_orders_order_items.sql`; `types/database.ts` |
| E25 | `lib/business/use-business-settings.ts`; `lib/supabase/{server,client,service}.ts`; `lib/env.ts`; `lib/commercial/auth/require-commercial-principal.ts:13`; `lib/commercial/promoters/require-promoter-principal.ts:20`; `lib/super-admin/context.ts` |
| E26 | SQL incorporado externamente al cierre: `20260909040000_products_manage_role_rls.sql`, `20260909154400_products_stock_availability_contract.sql`, `20260916180000_products_removal_lifecycle.sql:125` delete RPC, `20260917210150_categories_public_catalog_order.sql:184` orden; `20260926010000_shared_core_expand.sql`, `20260926011000_order_financials.sql`, `20260926017000_order_contract_finalize.sql`; familias `2026092618*`–`2026100210*` de finanzas; `20261003010000_m2_shared_read_contracts.sql`, `20261003012000_finance_collectible_order_reads.sql`, `20261004010000_m3_historical_import_provenance.sql` |

### Evidencia SQL de la base conectada

Las funciones de negocio **solo fueron leídas como texto**, no ejecutadas. Este informe retiene definiciones y resultados agregados necesarios, sin dumps de clientes, claves, contactos, notas o pagos.

| Consulta | Método de lectura y resultado |
|---|---|
| Q1 | information_schema.tables/columns + migrations ledger: finanzas/legacy/timezone presentes; orders solo created_at/assigned_at como timestamps propios, sin completed_at/session_id/fee; 118 migraciones |
| Q2 | pg_proc/pg_namespace + pg_get_functiondef para resúmenes, paid_net/remaining/released/refunded y require_finance_permission; columnas finance_*; sin views públicas; policies y triggers de orders |
| Q3 | Definición viva completa de public.create_order y transition_order_status: total de composición y stock; sin completion timestamp/session guard SQL/timeline atómico |
| Q4 | SELECT agregados por status/composition/event_type/item_kind/financial_status; roles/flags, counts y min/max de fechas. Muestra detallada en §7; sin importaciones identificadas |
| Q5 | Definiciones privadas de remaining/paid_net/committed/reversed; pública financial_summary/exception_summary; líneas relevantes de payment/historical/settle/reopen/cancel/agreed_total/dashboard summary; enums de finanzas y composición |
| Q6 | CTE VALUES con las 74 versiones de nombres de migraciones: repo_missing_in_database=0; database_missing_in_repo=44. Agregado de identidad Majo=1 y orders_before_active_session=1 |
| Q7 | CTE final con 118 versiones locales: repo_missing_in_database=0 y database_missing_in_repo=0. Se mantienen dos órdenes, cero completed, cero eventos y cero operaciones financieras. Confirma products.archived_at y trigger que suspende solo track_stock=true/stock≤0; constraints vivas: itemized→total conocido, legacy_unknown→total null, campos operativos obligatorios en órdenes nativas y excepción documentada para importaciones con evidencia |

Patrón de consulta reproducible, sin funciones de negocio:

```sql
BEGIN READ ONLY;
SHOW transaction_read_only;
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('orders', 'order_items', 'order_financials',
                     'store_sessions', 'business_settings')
ORDER BY table_name, ordinal_position;
SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;
SELECT count(*) FROM public.orders;
COMMIT;
```

No se usó `SELECT rpc(...)` como equivalente de consulta segura. Cada transacción de datos fue independiente: la auditoría no promete un snapshot único de toda la DB durante los minutos de inspección. Q6 conserva los resultados del corte de 74 archivos; los resultados del cierre se agregan como Q7, sin reescribir la evidencia inicial.

## 12. Temas para retomar el cuestionario

Propuesta de orden; **no contiene decisiones nuevas**:

1. Precisar soporte de completados: fecha autoritativa, primera/última finalización, retrocesos y tratamiento de histórico sin eventos. Separar «dato desconocido» de cero.
2. Elegir fuente de venta con evidencia: total nominal vs agreed_total; incorporación de envío, ajustes y devoluciones; corte operativo vs financiero.
3. Definir día estadístico y timezone: medianoche, huecos, días cerrados, fuera de horario, cambios históricos de horarios y excepciones. Mantener varias franjas agrupadas sin migrar dashboard.
4. Definir unidades e identidad: principales/upsells/extras, legacy_unknown, productos sin ID, renombrados y categoría histórica vs actual.
5. Revisar semana/presets/comparación: mismo tramo transcurrido, rangos personalizados, períodos completos, base cero y muestra insuficiente.
6. Retomar P16 con sus cuatro opciones originales y la limitación comprobada: ingreso tiene timestamp; finalización depende de eventos no garantizados. No hay elección realizada.
7. Delimitar saldos actuales vs a fecha, fechas económicas/registro, señas históricas y ledger, sin sumar transferencias/liberaciones como nuevos cobros.
8. Acordar permisos/flag/drill-down/exportación y alcance de adaptación futura Programado, reconociendo las piezas parciales ya existentes.

Antes de implementación, revisar este informe y localizar el contrato autoritativo de la base heredada. No iniciar Estadísticas ni migración del dashboard como consecuencia automática de esta auditoría.

## Control final de alcance

Única escritura realizada por esta tarea: este informe, inexistente al inicio. No se editaron funcionalidad, tipos, SQL, configuración, memoria viva ni documentos previos; no hubo checkout/stash/reset/restore/commit/push/merge/deploy, instalación ni datos creados/modificados. El workspace sí recibió 44 SQL untracked externos durante la ejecución (§2). No se atribuyen a esta auditoría y no se revirtieron. El control final se incorpora a continuación.

**Control final registrado el 12/10/2026 a las 00:46:38 UTC−03:00:** rama `cursor/commercial-core-v1-integration`; HEAD `3a3abb43b15f5e0448b89a3ced8fa47a584ebead`, ambos iguales al inicio. `git diff --name-only` y `git diff --cached --name-only` sin salida. El informe queda untracked, junto con los tres grupos previos y los 44 SQL externos. Solo hay un archivo en `docs/audits/`: `dashboard-functional-audit-for-analytics-v1.md`. No se alteró el índice para registrar ningún archivo.

**Resultado de cobertura:** inventario completo de las rutas tenant y sus conexiones, flujos y fórmulas por código; dependencia de sesiones por consumidor; diccionario operativo/financiero; matrices de factibilidad, compatibilidad y cobertura; fuentes concretas. Lectura real de esquema y agregados confirmada. Runtime autenticado, responsive, reconexión, permisos por rol y calidad de un histórico de completados/cobros permanecen **NO VERIFICADOS**. La falta de historial es una limitación de la muestra, no ausencia demostrada de funcionalidad. Los flujos de escritura se trazaron, sin ejecutarlos.
