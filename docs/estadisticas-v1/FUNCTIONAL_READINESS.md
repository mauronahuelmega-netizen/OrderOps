# Phase03 — Functional readiness y descubrimiento Phase04

2026-10-14. **BLOCKED para declarar Phase03 cerrada y Phase04 implementable íntegramente.** Descubrimiento/plan preparados; no implementación, integración ni lanzamiento autorizados. Rendimiento suspendido según PERFORMANCE_DEBT.md.

## Estado real y alcance de auditoría

Worktree OrderOps-Estadisticas, rama codex/estadisticas-v1, HEAD923300265323d411c5c91b7935472d5423d228d2. Inventario exacto rastreado/no rastreado, status y hashes en phase04-discovery/baseline.json. Git diff entre commits **omite implementación no rastreada**; no describir HEAD como entrega completa.

Cinco tracked dirty preservados: permissions.ts, admin-nav-config.ts, admin-nav-list.tsx (P03-E1), fase-01-evidencia.json y next-env.d.ts preexistentes. Archivos propios de UI/rutas/P03-C y migraciones posteriores continúan en parte sin seguimiento. Nada staged/committed aquí. La preparación de una integración futura deberá seleccionar archivos propios y excluir cambios ajenos; no stage-all ni commits automáticos.

Migraciones propias01000/02000/03000 Phase02,04000comparativa,05000A+B; D1 es instalación experimental aparte del ledger. Último catálogo aceptado F.4C:124=119base+3Phase02+comparativa+A+B, originales públicos intactos, D1 privado, C ausente. Inventario local/versiones/SHA completos en baseline. No DDL ni conexión DB nueva; distinguir estado registrado de verificación live actual. Comentarios SQL/TS que todavía dicen preparado/no ruta son históricos y no autoridad sobre instalación actual.

## Implementación y pruebas

| Área | Evidencia / estado |
|---|---|
|Página y endpoint|app/admin/(protected)/statistics/page.tsx y query/route.ts, force-dynamic; cliente SSR normal, sin service role.|
|Principal original|summary-principal.ts: getUser, profiles.id real, negocio original, owner/manager/admin exclusivamente; NULL/unknown/operator/viewer/super_admin denegados.|
|Menú|releasePending:true y filtros sidebar/drawer; viewStatistics sin bypass super_admin. **Ocultar menú no bloquea URL/RPC.**|
|Transporte|summary-transport/server: una RPC pública extendida, decoder, scope/periodo verificados, no-store/Vary Cookie; URL estado.|
|UI|statistics-summary, summary-panels/chart, CSS: cuatro KPI, serie comparativa y selección local; tabs Productos/Oportunidades disabled. Cabecera/filtros/tabs embebidos en componente Resumen, no shell estadístico compartido aún.|
|Pruebas históricas|P03-E1:89aserciones permisos/navigation;110E2E; Auth real ownerA/managerB, cookies SSR y logout/limpieza. Archivos hash confrontados en evidence de este descubrimiento; no inventar reejecución.|
|Validación nueva offline|tsc --noEmit --incremental false PASS; ESLint config propia P03-E1 sobre7archivos de seguridad/nav PASS, sin --fix. No ejecutar suites viejas que sobrescriben evidencias.|
|E2E con datos|Rutas live se probaron con dataset vacío. Casos no vacíos interceptados por Playwright con fixture sintético; pruebas SQL rollback no equivalen a UI con datos committed. **Pendiente E2E no vacío persistido aislado.**|
|Production build|No ejecución/evidencia de next build para esta entrega. QA dev no prueba build production; planificar espejo aislado de fuentes con env exclusiva, sin .env producción ni tocar next-env.d.ts/.next originales.|
|Auth|Login/logout reales y expiración JWT/denegaciones previas; falta ciclo de refresh real, token expirado→refresh, invalidación/revocación y cambio de negocio con cookie refresh en SSR.|
|Accesibilidad|Capturas escritorio/móvil/temas y teclado, texto125%; no certificación WCAG, lector de pantalla/zoom200%/contraste automatizado completo pendientes.|

Legacy lib/statistics/server.ts aún usa requireAdminContext, cuyo role fallback es admin cuando perfil.role=NULL. **No reutilizar ese transporte para Phase04**: página/endpoint actuales usan verificador original propio. No se cambió contexto compartido ni se declara explotación de ruta que no lo invoca.

## Bloqueos y gates

R03-01 publicación: falta gate server-side default-closed independiente de menú/rol. Actualmente owner/manager/admin autorizados pueden abrir directamente página y endpoint. Propuesta propia futura statistics-release-server.ts: principal SSR verificado AND permiso de publicación trusted server/tenant, deny por defecto y errores; aplicar a ambos entrypoints antes de datos. No usar query/localStorage/NEXT_PUBLIC como autorización. Mantener anonimato401/login y denegaciones actuales; definir404/estado neutral para no-publicado. QA exclusivo con identidad aislada. Direct RPC Supabase tiene autorización DB propia: controlar su disponibilidad antes de instalar en entorno con negocios reales; un gate de aplicación no revoca grants DB. Requiere revisión separada, no SQL ahora.

R03-02 base de integración: especificación exige Phase03 estable/aceptada. No hay cierre formal; programar aprobación de baseline y prueba de release gating antes de habilitar Productos.

R03-03 lanzamiento: E2E persistido no vacío, production build, refresh/expiry real, accesibilidad pendiente y matriz de integración actualizada; no se declaran PASS por reutilizar tests de datos interceptados.

R03-04 seguridad de datos Productos: category units/provenance, quality por indicador, denominadores/identidad estable y detalle/paginación no están en contrato público completo; ver PHASE04_DATA_CONTRACT_AUDIT.md.

R03-05 integración Cursor: referencia comprometida actual7bdae560d358fbcf16ec2db87a97a66c1d268ca6, distinta del0e430b… auditado P03-E0. Leída solo mediante Git propio, **sin tocar su worktree**. Archivos comunes comprometidos no muestran cambios en package/auth/shell/nav frente a own HEAD, pero own nav/permisos dirty incorporan patch revisado. Cursor añade9versiones de CommercialPhase05(20261013010000…070000); no colisión actual con01000…05000. Estado no committed de Cursor **no verificado**; no presentar esta comparación como compatibilidad efectiva completa. Antes de integrar: autorización read-only efectiva o inventario suministrado por propietario, contratos/triggers/finanzas, versiones y diffs conjuntos; prohibido aplicar pendientes juntos accidentalmente.

## Decisiones y pendientes de aprobación

No reabrir P-V01–P-V10 ni opciónA. Necesitan revisión: arquitectura del agregado Productos (extensión aditiva vs RPC propia sin series), proof de categoría histórica cuando snapshot no existe, tratamiento conservador de ingresos fuera del subconjunto reconciliado y presentación de cobertura, extracción mínima del shell y publication gate. Propuesta: no repartir ajustes; mostrar verificables/parcial o No disponible con razones. Captura/writers/RLS compartidos solo si se demuestra imprescindible y se aprueba diff separado.

Suspender performance no autoriza adoptar A+B/D1/C ni altera SQL; deuda no bloquea por sí sola descubrimiento de Productos. Los bloqueos anteriores sí impiden declarar Phase03 cerrada o iniciar una implementación completa sin nuevas decisiones/autorización.
