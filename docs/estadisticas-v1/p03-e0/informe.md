# Estadísticas V1 — Auditoría de preintegración P03-E.0

**Veredicto: READY_WITH_LIMITATIONS.** El paquete de navegación está preparado para revisión. No certifica integración, lanzamiento, SQL en otro entorno ni P03-E.1. No se aplicaron los diffs. No hubo conexiones a bases, servidores, contenedores, cambios de archivos compartidos ni operaciones de integración Git.

## Estado efectivo y referencia

| Árbol | Rama | HEAD observado |
|---|---|---|
| OrderOps-Estadisticas | `codex/estadisticas-v1` | `923300265323d411c5c91b7935472d5423d228d2` |
| OrderOps / Cursor | `cursor/commercial-core-v1-integration` | `0e430b08342b638b02392927ed560ea5e0950403` |

El merge-base es el HEAD efectivo de Cursor: está contenido en la rama de Estadísticas. La comparación no dependió de una referencia anterior. Se leyeron los archivos actuales de ambos worktrees y se compararon sus hashes antes y después. `evidence.json` registra los estados completos, las migraciones, los resultados y los hashes base de los tres diffs. `preexisting-hashes.json` registra 1.984 archivos propios y 1.821 de Cursor, seguidos o sin seguimiento no ignorados. No inventaría directorios ignorados ni certifica procesos, base live o modificaciones futuras de Cursor.

Estadísticas conserva dos modificaciones seguidas preexistentes: `docs/estadisticas-v1/fase-01-evidencia.json` y `next-env.d.ts`. Los archivos de P03-A/B/B.1/C/D, la migración comparativa, ruta, componentes, fixtures y scripts continúan mayormente sin seguimiento; el detalle está en el estado inicial de la evidencia. El diff entre HEADs no incluye esa implementación sin seguimiento. No se crearon commits ni se añadió nada al índice.

Cursor no tenía modificaciones seguidas al observarlo. Tenía sin seguimiento `.codex-remote-attachments/`, `docs/audits/`, `docs/landing-recovery-validation-2026-10-11.md` y `tmp/landing-recovery-2026-10-11/`. Fueron preservados. La comprobación Git utilizó una excepción `safe.directory` limitada a cada comando, sin alterar configuración global, y `--no-optional-locks`.

821 archivos seguidos comunes difieren únicamente por CRLF/LF. Se conservan sus hashes binarios distintos; la comparación textual normaliza solo finales de línea. La única diferencia textual entre los archivos seguidos de Cursor y sus equivalentes propios es el `next-env.d.ts` preexistente: `.next/dev/types/routes.d.ts` frente a `.next/types/routes.d.ts`. No debe incluirse en una integración de Estadísticas. No se cambió ni normalizó ningún archivo original.

## Matriz de compatibilidad con Cursor efectivo

| Superficie | Evidencia/compatibilidad observada | Condición de integración |
|---|---|---|
| Autenticación SSR y middleware | Mismo contenido en `lib/supabase/server.ts`, `lib/env.ts`, `middleware.ts` y middleware Supabase; cookies SSR, cliente con anon key, usuario verificado. | Mantener infraestructura existente; ningún service role ni caché compartida. Validar configuración de destino antes de cualquier ejecución autorizada. |
| Perfil y roles administrativos | `types/database.ts`, `lib/admin/context.ts` y permisos equivalentes. El contexto normaliza super_admin y utiliza admin como fallback de rol nulo. | El nuevo permiso compara el rol original; nunca usar businessRole ni isOwner. No utilizar requireAdminPermission como único gate de Estadísticas debido al fallback. |
| Acceso propio de Estadísticas | Gate de página y transporte reconsultan `profiles.business_id,role` para el usuario de getUser; rol nulo denegado; RPC y RLS conservan comprobación propia por negocio. | Mantener estas comprobaciones independientes de la visibilidad del menú. No confiar en businessId recibido por URL/JSON. |
| Commercial Core | Autorización mediante commercial_session y roles commercial/superadmin; contratos y archivos comunes sin cambios efectivos. | No equiparar superadmin comercial con permiso de Estadísticas; no importar esos guards a la ruta propia. |
| Promotores | promoter_session y require-promoter-principal independientes; archivos comunes equivalentes. | No habilitar Estadísticas por ser promotor ni modificar sus rutas/claims. |
| Navegación | Los tres archivos objetivo coinciden; sidebar y drawer filtran con getAdminNavItemsForRole e isAdminNavItemFeatureEnabled. | Aplicar solo el diff revisado tras nueva autorización y volver a verificar sus hashes. |
| Shell y temas | AdminShell, layout protegido, cabecera, drawer, sidebar y tokens comunes equivalentes. Estadísticas utiliza el shell real y CSS local. | Ningún rediseño/global CSS. Conservar permisos ajenos y normalizaciones existentes. |
| Rutas | `/admin/statistics` y `/admin/statistics/query` son propias, nuevas y sin seguimiento; no existen en Cursor. No hay cambio de matcher necesario. | Incluir ambas en el inventario de integración; no depender del layout para proteger el endpoint. |
| Dependencias | package.json, lockfile, Next/React/Supabase/lucide/TypeScript y configuraciones seguidas equivalentes. BarChart3 existe en lucide instalado. | No hay instalación o actualización requerida. El transpile offline no sustituye build/E2E de integración. |
| Baseline SQL | 119 migraciones en Cursor; las 119 equivalentes propias tienen el mismo texto, con diferencias de EOL en algunas. | Equivalencia de archivos no demuestra el ledger de una base destino; no se consultó ninguna. |
| SQL propio | Cuatro versiones adicionales: 20261013001000, 20261013002000, 20261013003000 y 20261013004000; ninguna colisión de versión conocida. SHA comparativa autorizado conservado. | No trasladar la aprobación de instalación aislada a otra base. Revisión explícita del plan de migración y writers operativos antes de cualquier instalación futura. |

## Diffs propuestos, sin aplicar

`navigation-permissions.proposed.patch` contiene exclusivamente tres archivos. `base/` contiene copias de lectura de Cursor y `proposed/` las postimágenes con extensión `.txt`; no son código activo.

1. `lib/admin/permissions.ts`: añade `viewStatistics`, helper `canViewStatistics` y rama de hasAdminPermission. Solo owner, manager y admin originales. No modifica normalizeBusinessAdminRole, getAdminPermissions ni permisos existentes. No se añade una propiedad al objeto getAdminPermissions porque ningún consumidor la necesita para esta entrada.
2. `components/admin/admin-nav-config.ts`: añade entrada Estadísticas y campo opcional `releasePending`; la entrada lleva **true**. Ambos filtros la excluyen mientras ese valor siga activo, sin consultar flags operativos o crear columnas. Las entradas anteriores mantienen su comportamiento.
3. `components/admin/layout/admin-nav-list.tsx`: import y mapa de icono BarChart3. Renderizado, foco, aria-current y composición del shell conservados.

El patch pasó `git apply --check` exclusivamente como comprobación de aplicabilidad sobre este worktree. No se ejecutó git apply sin --check. Los hashes efectivos de las bases se incluyen en evidence.json; una modificación de cualquiera invalida este paquete y exige regenerar el diff.

## Permisos, visibilidad y lanzamiento

| Rol original | viewStatistics propuesto | Menú propuesto hoy | Página/endpoint propios |
|---|---|---|---|
| owner | Sí | Oculto | Permitidos solo con sesión y negocio verificados |
| manager | Sí | Oculto | Igual |
| admin | Sí | Oculto | Igual |
| operator | No | Oculto | Denegados |
| viewer | No | Oculto | Denegados |
| super_admin | No | Oculto | Denegados, sin bypass |
| Nulo/desconocido | No | Oculto | Denegados por guards propios |

La tabla describe autorización y visibilidad; no una habilitación de lanzamiento. `releasePending: true` mantiene el menú oculto incluso para usuarios reales autorizados. Ningún cliente, rol comercial o flag de Cocina puede levantar esa condición.

**La ruta puede seguir protegida sin entrada en menú.** La página ejecuta statisticsRouteScope y la consulta reautentica mediante readAuthenticatedSummary; el endpoint no delega autorización al layout. Se conservan tenant derivado del perfil, decoders, una RPC y Cache-Control private/no-store/Vary Cookie. No se ejecutaron pruebas live nuevas en esta auditoría.

**Limitación de lanzamiento:** los guards actuales verifican acceso B4, pero no incorporan un interruptor server de lanzamiento. Si esas rutas se desplegaran con la RPC en una base real, un owner/manager/admin del negocio podría acceder directamente pese al menú oculto. Por eso el paquete actual no autoriza despliegue ni habilitación real. Antes de un despliegue anticipado se necesita aprobar e implementar en archivos propios un gate server de lanzamiento, cerrado por defecto, común a página y endpoint y anterior a la RPC, con configuración explícita de entorno y allowlist de negocios verificados. No inferir aprobación por puerto, correo, rol, variable pública o parámetros del navegador; ningún super_admin bypass. La allowlist sintética de QA no puede migrar a producción. La decisión de abrir a negocios reales debe ser expresa.

Hay otra condición para habilitar el menú: el shell recibe `adminContext.profile.role`, que convierte NULL en admin. Cambiar releasePending a false sin resolver la procedencia original podría mostrar el enlace a un perfil nulo, aunque el backend siga denegándolo. Propuesta posterior: gate server propio verificado y prop de elegibilidad para ambas superficies de navegación, o un cambio aditivo de contexto preservando el rol original. Cualquiera requiere un diff separado autorizado; no se modifica aquí el contexto ni se habilita la entrada. No usar el nuevo permiso del contexto heredado como prueba de autorización efectiva.

## Inventario de conflictos y riesgos

| Conflicto potencial | Estado observado | Riesgo/medida |
|---|---|---|
| Tres archivos compartidos | Bases coincidentes, patch pendiente | Cursor puede cambiarlas posteriormente. Congelar/revalidar HEAD, estado y hashes justo antes de integrar. No reemplazar archivos enteros ni resolver automáticamente nuevos conflictos. |
| Implementación sin seguimiento | P03-A/C/D y comparativa no están en HEAD | Revisar manifiesto y preparar commits acotados propios solo tras autorización; no usar git add . ni incluir attachments, artefactos runtime o los dos cambios preexistentes. |
| Normalización/fallback de roles | Existente, intocado | Denegación propia correcta; menú requiere elegibilidad original antes de abrir. |
| SQL/operativas compartidas | Cuatro triggers de captura en orders, order_items, order_financials, store_sessions y cuatro constraint triggers diferidos de revisión en esas mismas tablas | Hay interacción con transacciones/locks de los escritores existentes aunque los archivos se llamen statistics. Repetir concurrencia, finalización, reapertura, cancelación y writers financieros sobre integración aislada autorizada. No desactivar hooks existentes. |
| Identidad histórica y captura | Cinco estructuras propias y FK a negocios/pedidos/items/sesiones; RLS y RPC propias | Validar cascadas, locks, ciclos e idempotencia con writers reales sintéticos. No backfill inferido, no nueva fuente financiera ni desconocidos=0. |
| Migración comparativa | b10c330adff70b803d9d25165f07830e90d4cd092aa4ba2cf3d0120a43f95219 | Conservar archivo inmutable. No existe esa versión en Cursor; ninguna aprobación de esta entrega permite instalarla. |
| Ledger destino | No consultado en E.0 | El baseline de archivos no demuestra qué SQL tiene una base compartida. Reconciliar solo mediante procedimiento autorizado futuro. |
| Rendimiento | Evidencia histórica aceptada P03-B.1: 200 pedidos mediana extendida 2.267 ms, 500 pedidos timeout 15 s; 1.000 no ejecutado | Bloquea lanzamiento y certificación de integración funcional a volumen. No se optimizó ni remidió. Preparar mejora separada de SQL con aprobación. |
| Cobertura E2E | P03-D aceptado con limitaciones: live vacío y estados no vacíos mediante fixtures; zoom 200%/lectores de pantalla pendientes | Repetir recorrido no vacío end-to-end con captura real sintética, seis roles y dos tenants; no convertir capturas previas en evidencia de esta integración. |
| Entorno genérico SSR | getSupabaseEnv acepta configuración suministrada | No arrancar integración con env de Cursor/producción. Gate adversarial y live exclusivos antes de tests futuros; ningún acceso live efectuado ahora. |

## Procedimiento propuesto de integración y rollback

Estos pasos son instrucciones futuras, no operaciones realizadas ni autorización implícita.

1. Revisar este paquete y resolver/aprobar política de lanzamiento server y procedencia original del rol para menú; recibir autorización P03-E.1 con archivos/alcance concretos. Mantener pendiente el lanzamiento real.
2. Volver a capturar ambos HEAD, estados, fuentes efectivas y baseline SQL. Si Cursor avanzó o cambió cualquiera de las bases, revisar diferencias y regenerar patch; detener solo el conflicto que requiera decisión. No tocar sus cambios sin seguimiento.
3. Preparar en Estadísticas commits locales de archivos propios revisados, con listado explícito y exclusión de los cambios preexistentes. Sellar hashes y verificar que la implementación revisada quede representada en Git; esta auditoría no crea commits.
4. Con autorización específica de integración, crear un worktree de integración separado basado en el Cursor aprobado y trabajar ahí; nunca utilizar su checkout activo. Registrar refs de entrada y commits propios. No se autoriza aquí merge, cherry-pick, rebase ni otra operación de integración.
5. Incorporar cambios propios y únicamente los hunks compartidos aprobados; mantener releasePending true. Añadir cualquier gate server solo tras revisión de su diff. Compilar y ejecutar pruebas offline de tipos/decoders/permisos/navegación/negocio/URL, antes de pruebas live.
6. Cualquier validación SQL futura exige autorización distinta, verificación adversarial/live y ledger de la instancia exclusivamente aislada, baseline y hashes aprobados; sin reset global ni uso de Cursor/producción. Si ya está instalada una versión, comprobar ledger/hash y no reaplicarla. Una nueva versión requiere revisión y autorización propia.
7. Sobre QA aislado autorizado, probar RPC legacy/extensión, writers operativos, concurrencia, RLS, roles y transporte/UI con datos sintéticos y limpieza verificable. Resolver rendimiento antes de certificar integración/lanzamiento a volúmenes reales. No introducir límites silenciosos.
8. Revisar E2E responsive/temas/accesibilidad/menu oculto/acceso directo gate cerrado; presentar evidencia y detenerse para decisión de lanzamiento. Activación de menú, allowlist real, migraciones externas y deploy son aprobaciones separadas.

Rollback propuesto: registrar previamente commits integrados, artefacto anterior y configuración de lanzamiento. Ante fallo, cerrar primero gate server y menú; si todavía no existe gate, no desplegar anticipadamente. Retirar/revertir únicamente commits de integración propios revisados en el árbol de integración, sin reset, limpieza de worktrees, force push ni revert de trabajo ajeno. Para código ya publicado, usar el artefacto anterior solo bajo autorización de despliegue. La vuelta del frontend no exige eliminar tablas, snapshots o ledger. Mantener captura y datos históricos; no desactivar triggers financieros/de captura arbitrariamente. Cualquier incompatibilidad SQL requiere corrección hacia adelante revisada, backup autorizado y verificación aislada; no ejecutar scripts down ni borrar historial. Repetir regresión de Commercial Core/Promotores y comprobar que el lanzamiento permanece cerrado.

## Pruebas y evidencia

Ejecutado offline: `node docs/estadisticas-v1/p03-e0/audit.mjs`. Cincuenta y una comprobaciones: matriz de roles originales incluyendo NULL/desconocidos; equivalencia de permisos y menú existentes por seis roles; menú cerrado para todos; filtro independiente de settings; matching de rutas; transpile de TS/TSX propuestos; icono disponible; liberación hipotética solo en objeto en memoria; aplicabilidad del patch sin aplicarlo; baseline/colisiones/hash comparativa; preservación de ambos árboles y HEADs. Los resultados individuales están en evidence.json. Transpile comprueba sintaxis y ejecución aislada de helpers, no un typecheck completo ni runtime Next.

Pendiente, únicamente con autorizaciones posteriores: typecheck/build del árbol integrado sin cambiar generated/preexistentes; pruebas con cookies, seis roles y dos tenants, null role, sesión expirada, URL directa y endpoint con gate cerrado; sidebar/drawer y active state; regresión de roles comerciales/promotores; no mezcla de negocio/URL/cache; ocho períodos y una RPC; datos no vacíos capturados realmente; concurrencia y reconciliación monetaria; rendimiento con estadísticas representativas; zoom 200% y lector de pantalla. No se ejecutó ninguna prueba live, SQL, contenedor o servidor en E.0.

## Entrega y límites

Archivos nuevos exclusivamente en `docs/estadisticas-v1/p03-e0/`: informe, auditoría reproducible, evidencia JSON, hashes de archivos preexistentes, patch, tres copias base y tres postimágenes `.txt`. El manifiesto `artifacts.sha256.json` registra hashes de esta entrega, sin autorreferencia. Cero archivos anteriores alterados; cero commits. No se aprobaron ni aplicaron cambios compartidos. **Detención en P03-E.0; esperar autorización expresa antes de P03-E.1.**
