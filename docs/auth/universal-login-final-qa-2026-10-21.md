# QA final — Login universal + Gestión Comercial

**Fecha:** 2026-10-21  
**Rama / worktree:** `commercial` @ `OrderOps-talo-first`  
**Base runtime:** `http://localhost:3105`  
**Credenciales:** solo `ORDEROPS_DEMO_ACCESS.private.md` (no reproducidas)

## Corrección aplicada durante el QA

Al validar logout se detectó que `?choose=1` con una sola área podía impedir el cambio de cuenta, y que Gestión Comercial no tenía control de cierre de sesión.

- Restaurado el selector/`Usar otra cuenta` con `?choose=1` también para un solo espacio.
- Añadido **Cerrar sesión** en la nav de `/commercial` (misma `universalLogoutAction`).

## Automatización

| Suite | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `universal-login.verify` | PASS |
| `commercial-access.verify` | PASS |
| `promoter-access.verify` | PASS |
| `promoter-panel.verify` | PASS |
| `scripts/auth/qa-login-matrix.mjs` (Auth + áreas) | PASS (sesión previa) |
| `scripts/auth/qa-final-login-browser.mjs` (Playwright, 8 cuentas) | **8/8 PASS** |
| `node scripts/commercial-core/verify-all.mjs` | FAIL preexistente: `schema-names.verify` falta documentar `promoter_portal_preferences` en `DATA_MODEL.md` (ajeno al login) |

## Matriz por rol (browser completo)

| Rol | Landing | Nav / notas | Deny URL | Logout |
|-----|---------|-------------|----------|--------|
| Owner | `/admin/dashboard` | — | `/super-admin`, `/commercial/opportunities`, `/promoter` → 403 | `/login` PASS |
| Manager | `/admin/dashboard` | — | `/super-admin`, `/promoter` → 403 | PASS |
| Operator | `/admin/dashboard` | — | `/super-admin`, `/promoter` → 403 | PASS |
| Owner suspendido | `/admin/dashboard` | `next=/admin/billing` → billing; texto suspendido presente | 403 en áreas ajenas | PASS |
| Comercial | `/commercial/opportunities` | Gestión Comercial, Oportunidades, Liquidaciones; **sin** Cobranzas | 403 super-admin/promoter; billing read-only | PASS |
| Finanzas | `/commercial/settlements` | Gestión Comercial, Liquidaciones, Cobranzas; **sin** Oportunidades | 403 oportunidades/super-admin/promoter | PASS |
| Promotor | `/promoter` | — | 403 áreas ajenas | PASS |
| Superadmin | chooser → `/super-admin` | Labels: Gestión Comercial + Administración general; **sin** “Finanzas” | `/promoter` → 403 | PASS |

## Escenarios transversales

| Escenario | Resultado | Evidencia |
|-----------|-----------|-----------|
| Comercial y Finanzas comparten `/commercial` | PASS | Mismo layout/nav; módulos filtrados por rol |
| Selector multi-área | PASS | Superadmin: 2 áreas, sin Finanzas separada |
| `next` autorizado (billing owner) | PASS | Playwright |
| `next` malicioso | PASS | `/login?next=https://evil.test` permanece en login |
| Legacy `/admin/login`, `/promoter/login` | PASS | Final pathname `/login` |
| Unauth deep link preserva `next` | PASS | `/admin/dashboard` → `/login?next=%2Fadmin%2Fdashboard` |
| Sin bucles en deny | PASS | 403 / Acceso denegado; logout disponible |
| Owner suspendido → billing | PASS | Path + copy “suspendido” |

## Indicador “1 Issue” de Next.js (dev)

| Pregunta | Conclusión |
|----------|------------|
| ¿Bloquea login/navegación? | No |
| ¿Es regresión funcional del login? | **No atribuible como regresión de auth** |
| Observación | Overlay de hydration en modo dev; a veces cita `app/login/page.tsx` como primer contenido RSC, otras `app/layout.tsx` (script de tema admin). El bootstrap de tema en root layout es preexistente y solo aplica rutas `/admin`. |
| Acción | Ninguna en este cierre; deuda de DX/dev overlay, no de autorización. |

## Server actions / RPC

No se ejercieron mutaciones económicas ni rotación de credenciales. Las restricciones de ruta (403 / read-only cobranzas para comercial) se verificaron en navegación. Mutaciones SoD de liquidaciones/cobranzas: **NOT_VERIFIED** en este pase (fuera del alcance seguro pedido).

## Commits del QA (locales)

Ver `git log` en `commercial` tras este informe.

## Recomendación de publicación

**SÍ: `commercial` está lista para publicarse en `origin/commercial`** tras revisión humana, con estos matices:

1. Push solo de la rama `commercial` (sin merge a `main`).
2. Aceptar deuda preexistente de `schema-names.verify` / hydration overlay de desarrollo.
3. No se rotaron credenciales ni se alteraron datos persistentes en este QA.
