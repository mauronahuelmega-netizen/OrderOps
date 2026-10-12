# Estadísticas V1 — Informe de Fase 01

Fecha: 12/10/2026, America/Buenos_Aires. Estado: **contratos, baseline y entorno aislado preparados; Fase 02 no iniciada**.

## Worktree y cambios

Worktree OrderOps-Estadisticas, rama codex/estadisticas-v1; base0e430b08342b638b02392927ed560ea5e0950403. Commit de contratos/diseño/fixtures: `b262c83`. El commit de cierre incorpora herramientas, configuración exclusiva y evidencia; su hash se entrega en el chat y puede consultarse con git log. No merge/rebase/push/deploy.

Solo archivos propios bajo docs/estadisticas-v1, scripts/statistics-v1, supabase/statistics-v1-test y fixtures/statistics-v1. La auditoría previa docs/audits sigue untracked y no se incluyó. Ningún cambio en types/database.ts, permisos/nav, SQL históricos, Commercial/Promotores, memoria global, package/lock, configuración Supabase principal o configuración ESLint compartida.

## Entregables de contratos y diseño

- plan-definitivo.md: autoridad, B1–B6 finales y secuencia de fases.
- contratos-tecnicos.md: vigencia/ciclos, fuentes, importe/calidad, jornadas/comparables, respuesta y autorización.
- diseno-persistencia.md: cinco estructuras propias, restricciones/FKs/índices, captura/invalidation, RPC y concurrencia.
- dependencias-cursor.md: superficies concretas y estrategia de integración controlada.
- fixtures/statistics-v1/scenarios.json:13 escenarios sintéticos, sin ejecución de cálculos futuros.

B1 total acordado sin fallback nominal; B2 principales únicamente; B3 apertura de sesión verificada, excepción fuera de sesión y exclusión de fecha desconocida; B4 owner/manager/admin sin bypass; B5 snapshots transaccionales y fuentes canónicas; B6 stack exclusivo.

No se crearon migraciones de Estadísticas ni código de métricas/UI/RPC. Las tablas/triggers/RPC en diseno-persistencia.md son propuestas para revisión, no objetos ejecutados.

## Evidencia de Supabase independiente

Proyecto `orderops-statistics-v1-test-74718de66a41`.
API127.0.0.1:56321; DB127.0.0.1:56322; shadow56320; Next de pruebas reservado3037. Studio/mail/analytics/realtime/edge/pooler deshabilitados; Storage habilitado por dependencia histórica.

Cinco contenedores exclusivos (DB/Auth/PostgREST/Kong/Storage), red supabase_network del mismo projectID, dos volúmenes exclusivos DB y Storage. Gate confirma labels, IDs, mounts, puertos, endpoints, ausencia de contenedores ajenos en la red/volúmenes y marcador privado de base.

119 migraciones **históricas** del commit base reconstruidas y ledger verificado;0 migraciones nuevas de Estadísticas. Hashes de todas las copias cotejados con git show del commit fijo; ningún archivo extra puede entrar al manifest. Aplicación automática y seeds deshabilitados al finalizar.

Dos negocios sintéticos,12 usuarios/perfiles (owner/manager/admin/operator/viewer/super_admin en ambos), cero pedidos. Contraseñas aleatorias y firma ES256 exclusiva; login real de los12 valida alg/kid propios. Owner de cada negocio no lee perfiles del otro por REST. Esto es baseline de Auth/RLS, NO prueba del módulo Estadísticas todavía inexistente.

Evidencia pública reproducible: fase-01-evidencia.json. Claves, passwords, tokens de identidad, cache/logs y copias runtime están ignorados fuera del commit. No se copió el entorno/credenciales de Cursor. Ninguna SQL/RPC de datos se ejecutó sobre la base compartida ni producción; inventario Docker ajeno fue solo metadatos para aislamiento.

## Pruebas ejecutadas

| Comando / operación | Resultado |
|---|---|
| node --check sobre scripts propios | PASS. |
| node scripts/statistics-v1/isolation-policy.verify.mjs | PASS: identidades/config/key/endpoints válidos y rechazos adversariales (shared ports, proyecto ajeno, mounts/binds, red, health, configuración externa y firma inválida). |
| eslint con scripts/statistics-v1/eslint.config.mjs | PASS; configuración propia, sin modificar la global. |
| tsc --noEmit --incremental false | PASS del baseline instalado. |
| tsx lib/orders/dashboard-metrics-semantic-fix.verify.ts | PASS:8/8 suites. |
| tsx lib/orders/order-code-search-partial-match.verify.ts | PASS:10/10 suites. |
| tsx lib/orders/phone-display.verify.ts | PASS. |
| tsx lib/product-customization/order-preparation.verify.ts | PASS. |
| Validación JSON y unicidad de13 escenarios | PASS; no valida métricas futuras. |
| Gate de recursos/marker, rebuild base y ledger | PASS:119 versiones,0 Statistics migrations. |
| Smoke Auth/JWT/REST | PASS:12 logins y2 rechazos cross-tenant owner. |
| Conteos/objetos nuevos | PASS:2 negocios,12 perfiles,0 pedidos,0 tablas de Estadísticas. |

Dependencias instaladas desde lock con npm ci --ignore-scripts; package y lock sin cambios. La primera instalación sandbox falló por acceso/cache/red; la repetición autorizada con cache propio completó378 paquetes.

### Incidencias y resolución acotada

1. Primer arranque: Auth sin clave de firma utilizable. El generador CLI confirmó key_ops sign/verify; se corrigió el generador propio y se agregaron verificaciones. Se retiró únicamente el contenedor Auth detenido de la identidad exclusiva previamente comprobada; segundo arranque PASS.
2. Primer rebuild: migración7 requiere storage.buckets. Se habilitó Storage únicamente en el stack propio, preservando DB/marker y sin modificar SQL heredado. Rebuild reanudado hasta119, PASS.
3. ESLint global: error de referencia circular en FlatCompat/config Next antes de lint de archivos. **Bloqueo preexistente documentado; no corregido porque es superficie compartida fuera de Fase01.** Lint propio independiente PASS. No afirmar lint global verde.
4. Un intento de verificación de catálogo usó un nombre inexistente; se sustituyó por el verify realmente presente order-preparation. El intento fallido no cuenta como cobertura.

## Riesgos pendientes para Fase 02

- Agreed_total y envío/ajustes no tienen desglose universal: calidad explícita; ningún productor nuevo de desglose autorizado.
- Pérdida de identidad/categoría/fecha anterior a instrumentación no se repara por inferencia.
- Captura order→financial→session y writers financieros con financial bloqueado pueden producir lock inverso si el trigger escribe hechos: separar señal de revisión y detectar divergencia en lectura; verificar SQL exacto con carreras antes de aprobar instalación.
- Cierre de sesión usa timestamp de aplicación y update separado: comprobar serialización y distinguir cierre previo, contemporáneo o asociación no verificable.
- Revisión por negocio puede ser punto de contención; triggers no agregan el historial completo.
- Captura de categoría en alta debe ser coherente con producto/línea en writes públicos/manuales. Cambio Promotores no reinterpreta historia.
- Tipos frontend actuales nullable-aware incompletos; no se modificaron en Fase01.
- No hay QA autenticado del módulo, porque aún no existe; ni benchmark100k, ni rollback/ciclos/StatsRLS ejecutados.

## Condiciones para autorizar Fase 02

1. Revisar/aprobar contratos-tecnicos.md y diseno-persistencia.md, especialmente tratamiento monetario incompleto, sesión/compare y lock order.
2. Autorizar expresamente Fase02 y las superficies propuestas: archivos de migración NUEVOS, triggers sobre fuentes públicas y patch mínimo de types/database.ts. No implica permiso de modificar firmas RPC compartidas ni Commercial.
3. Revisar los nuevos SQL antes de aplicarlos, incluso en el stack exclusivo; mantener esta restricción mientras no sea revocada expresamente.
4. Gate de identidad/revisión actualizado pasa; permitir únicamente destino aislado, nunca shared/prod.
5. Definir la resolución del lint global como tarea compartida separada o mantenerlo registrado como baseline pendiente; no modificarlo automáticamente.
6. Ejecutar tests de atomicidad/idempotencia/reapertura/cancelación, dos tenants/roles, componentes/calidad y concurrencia. No pasar a interfaz si esas garantías fallan.

La aprobación de Fase02 no concede merge/rebase/push/deploy ni migraciones en base compartida. El stack queda corriendo para revisión, con los servicios mínimos indicados. Se detiene el trabajo al entregar este informe.
