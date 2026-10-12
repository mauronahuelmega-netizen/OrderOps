# Dependencias y superficies compartidas

Fase01 no modifica ninguna superficie de esta tabla. Inventario sobre commit base; revalidar con HEADs definitivos antes de integración. Cursor trabaja en cursor/commercial-core-v1-integration; no inspeccionar/modificar su worktree desde esta tarea.

| Superficie | Cambio posterior previsto | Conflicto / control |
|---|---|---|
| types/database.ts | Tipos de nuevas tablas/RPC | Patch mínimo; no regeneración que reemplace commercial. Nulabilidad existente solo si se aprueba su alcance exacto. |
| lib/admin/permissions.ts | viewStatistics sobre roles originales | No usar normalizeBusinessAdminRole que normaliza super_admin; no cambiar permisos ajenos. |
| lib/admin/context.ts | Reutilizar contexto; sin cambio por defecto | Solo patch tipado si necesario y revisado. |
| components/admin/admin-nav-config.ts | Entrada Estadísticas | Conservar Asistencia/rutas/flags y patch separado. |
| components/admin/admin-shell.tsx; layout/admin-sidebar.tsx; layout/admin-nav-list.tsx; drawer/layout protegido | Reutilización | Sin cambios por defecto; no duplicar sistema visual. |
| supabase/migrations | Archivos nuevos/versions | Reservar con integración controlada; jamás modificar migraciones históricas. |
| orders/order_items + create_order/transition_order_status | Triggers de captura | No reemplazar firmas ni funciones completas; probar stock/importación/servicio. |
| order_financials + initialize/set_agreed_total/helpers | Lectura y detectar divergencia | Conservar ledger/refunds/settlement y probar orden de locks. |
| store_sessions; lib/store-sessions/admin.ts | Snapshot/observación | No cambiar operación ni atribuir sesiones por proximidad. |
| products/categories + actions públicas/admin/customizaciones | Snapshot de alta | Rename/reclasificación por Promotores no alteran historia. |
| app/admin/(protected)/orders/actions.ts; orders/[id]/actions.ts; app/b/[slug]/checkout/actions.ts | Validación regresión, sin edición prevista | Guards/timeline permanecen; captura DB cubre caminos. |
| settings/operations/actions.ts; products/actions.ts; categories/actions.ts | Sin modificación | Fuentes mutables, no reconstrucción histórica. |
| lib/orders/analytics.ts; dashboard/page.tsx; componentes orders | Sin modificación | Métricas estadísticas en dominio propio. |
| package.json/package-lock.json/tsconfig.json | Ningún cambio en Fase01 | Dependencias locales desde lock; no cambio compartido para runner. |
| supabase/config.toml; .env*; scripts/commercial-core | Ningún cambio | Gate comercial permite54321/54322: NO reutilizar para Estadísticas. |
| app/globals.css/theme-tokens.css; CSS admin compartido | Sin modificación | CSS modules nuevos y tokens existentes. |
| ORDEROPS_LIVING_MEMORY.md | Sin modificación | docs específicos. |
| lib/commercial; app/commercial; app/promoter; docs/commercial-core-v1; esquema commercial | Prohibida modificación | Solo contratos de coexistencia del commit propio, sin autoridad sobre ventas. |

Integración requiere autorización, HEADs fijos, diff compartido revisado, versiones únicas, rebuild del árbol combinado en una tercera instancia exclusiva, tests de ambos dominios y permisos/navegación/regresiones aprobados. Nunca merge/rebase/push/deploy automático; nunca modificar worktree Cursor para resolver conflictos. Nuevas dependencias no listadas se documentan antes de modificar.
