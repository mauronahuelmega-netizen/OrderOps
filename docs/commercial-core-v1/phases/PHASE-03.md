# PHASE-03 — Promotores y atribuciones

- ID: PHASE-03
- Objetivo: un promotor se registra, se verifica en local con documentos ficticios, opera solo si está activo, y su atribución queda auditada sin ver datos de otro promotor.
- Alcance: ciclo de vida, contrato, verificación, CBU restringido, claims, confirmación, disputas, desvinculación, panel.
- Depende de: PHASE-02 done.
- Prerrequisitos: usuarios de prueba locales, no cuentas reales.
- Riesgos: activar sin monotributo; confirmación automática demasiado amplia; protección de 90 días sobre un claim provisional.
- No incluye: precios de catálogo, comisiones monetarias. La desvinculación conserva «derechos» como filas que la fase 05 llenará; en esta fase no hay montos.

Contratos: estados `registered | pending_verification | active | suspended | separated`. Claims `provisional | expired | rejected | confirmed | superseded`. Atribución única `confirmed` por oportunidad. ENG-08, ENG-09, ENG-14. CC-02 a CC-07, CC-11, CC-12, CC-28, CC-29, CC-30.

Errores: `promoter_not_active`, `verification_incomplete`, `claim_expired`, `extension_not_substantive`, `attribution_exists`, `cannot_self_confirm`, `dispute_scope`.

## P03-T01 Cuenta promotor y estados

- Descripción: tablas `promoters` y RPC de alta preliminar.
- Archivos: migración `commercial_phase03_promoters.sql`, rollback, `lib/commercial/promoters/status.ts`, verify de transiciones.
- Depende de: P02-T06.
- Cambios: alta crea `auth` user local + `platform_accounts.kind=promoter` + fila `registered` + `public_code`. Transiciones legales: registered → pending_verification → active; active → suspended; active o suspended → separated. No hay camino a `active` en esta tarea (lo abre T02). Trigger ENG-11.
- Restricciones: no usar el enum de `profiles`. No marcar `active` a mano en la UI.
- Tests: usuario con `profiles.business_id` no puede ser promotor. Estado `registered` no pasa la función `assertCanOperate`.
- Aceptación: el código público es único.
- Evidencia: SQL + verify.
- Recuperación: down de fase 03 solo sin fase 04.

## P03-T02 Contrato, verificación y banco

- Descripción: evidencias y activación.
- Archivos: tablas de contratos, verificaciones y cuentas bancarias; bucket privado `commercial-documents` en la misma migración o en una de storage siguiente del timestamp; RPC `submit_promoter_evidence`, `review_verification`, `activate_promoter`, `replace_bank_account`.
- Depende de: P03-T01.
- Cambios: activación exige identity, cuit y monotributo en `verified`, más contrato con `accepted_at`. Quien verifica es interno con `promoter.review`. Quien activa es superadmin (`promoter.activate`), persona distinta si se quiere endurecer: default, el activador puede ser otro superadmin; no hace falta SoD de tres para esto. CBU: fila nueva, `is_current`, audit. Lectura de CBU solo propio o finance/superadmin.
- Restricciones: archivos ficticios. No llamar a AFIP. No bucket público.
- Tests: activar sin monotributo falla. Promotor no lee el CBU de otro. Cambio de CBU deja la fila vieja `disabled`.
- Aceptación: CC-28 operativo en local sin validez fiscal real. Nota en UI: «verificación interna de documento, no consulta fiscal».
- Evidencia: SQL.
- Recuperación: vaciar el bucket local de prueba. No borrar buckets `product-images` ni `business-assets`.

## P03-T03 Reclamaciones y vencimiento

- Descripción: claim provisional 30 días.
- Archivos: `attribution_claims`, `claim_extensions`, RPC `create_claim`, `extend_claim`, `expire_due_claims`.
- Depende de: P03-T01, P02-T03.
- Cambios: solo promotor `active`. `provisional_until = created_at + 30 días`. `expire_due_claims` pasa a `expired` y encola evento. Historial permanece. Extensión exige interacción `call|whatsapp|email|meeting|demo_completed|follow_up` de esa oportunidad o comercio, actor interno, motivo. Una tarea no se acepta como interacción.
- Restricciones: crear claim no crea oportunidad (CC-08). No confirma.
- Tests: promotor `registered` falla. Extensión con solo una tarea falla. Claim con `provisional_until` en el pasado lo marca el job. No aparece `opportunity_attributions`.
- Aceptación: CC-02 y CC-06.
- Evidencia: SQL.
- Recuperación: las claims de fixture se van con el down.

## P03-T04 Confirmación híbrida

- Descripción: automática estrecha y manual.
- Archivos: `opportunity_attributions`, RPC `confirm_attribution`, gancho desde `submit_demo_request` cuando aplica ENG-09.
- Depende de: P03-T03, P02-T04.
- Cambios: automática solo con demo, `promoter_ref` de promotor active, oportunidad resultante, sin otra atribución confirmed, sin fiscal contradictorio. Manual: superadmin, motivo, oportunidad existente. Claim orgánico tardío sin interacción sustantiva previa del promotor → `rejected`. Confirmación exige `opportunity_id` (CC-07). Unique parcial de una confirmed.
- Restricciones: el promotor no ejecuta `confirm_attribution`. Comercial tampoco, salvo el flag delegado que en V1 no se enciende en seeds.
- Tests: E2E-02. Dos promotores: gana la primera confirmación válida; la segunda RPC falla con `attribution_exists`. Lead orgánico no queda atribuido por un claim posterior vacío.
- Aceptación: CC-03, CC-04, CC-07.
- Evidencia: SQL e2e_02.
- Recuperación: no reconfirmar a mano si el test falla; arreglar la RPC.

## P03-T05 Disputas

- Descripción: expediente.
- Archivos: `attribution_disputes`, `dispute_parties`, `dispute_events`, RPC `open_dispute`, `decide_dispute`.
- Depende de: P03-T04.
- Cambios: las abre un interno. Decisión solo superadmin, motivo, efecto económico textual. En esta fase el efecto monetario se guarda como instrucción (`hold_unpaid_commissions` | `adjust_later` | `none`) para que la fase 05 lo honre. No hay update de montos porque todavía no existen. Partes: promotores involucrados. El promotor ve el expediente donde es parte, no el de otros.
- Restricciones: no borrar la atribución histórica. `voided` solo con decisión y audit.
- Tests: promotor no decide. Un dispute no lista comisiones globales (tabla aún vacía). Otro promotor no lee el expediente.
- Aceptación: CC-05 y el procedimiento de CC-32 quedan persistidos.
- Evidencia: SQL.
- Recuperación: down de objetos de disputa.

## P03-T06 Desvinculación y 90 días

- Descripción: separar promotor.
- Archivos: `promoter_separations`, `opportunity_protections`, RPC `separate_promoter`.
- Depende de: P03-T04, P03-T02.
- Cambios: status `separated`, `separated_at`, revoca ability de operar, reasigna `owner_account_id` de oportunidades abiertas a un interno indicado, conserva contratos. Protección: si hay atribución confirmed y al menos una interacción sustantiva anterior, fila con `ends_at = effective_at + 90 días`. Claim solo provisional: sin protección. Excepción: superadmin con motivo y `basis = exception`, auditada.
- Restricciones: sin cascade sobre tablas futuras de comisiones. El down no debe enseñar un cascade peligroso; la migración 05 tampoco.
- Tests: E2E-06 en su parte no monetaria. Promotor separated no crea claim. Sesión: la RPC vuelve a leer status.
- Aceptación: CC-29 (canal de factura se completa en fase 05; aquí el promotor separated puede leer sus expedientes y su perfil) y CC-30.
- Evidencia: SQL.
- Recuperación: no reactivar un promotor de fixture editando status sin RPC. Si hace falta deshacer, transacción de test.

## P03-T07 Panel del promotor

- Descripción: secciones de la spec en versión utilizable.
- Archivos: `app/promoter/**`, `components/promoter/**` con CSS module, matcher `/promoter/:path*` en `middleware.ts`.
- Depende de: P03-T03, P03-T06.
- Cambios: inicio (conteos), comercios visibles, oportunidades asignadas, reclamaciones, tareas hoy/próximas/vencidas, perfil (contrato, estado fiscal, CBU propio). Placeholders explícitos de onboarding, comisiones y liquidaciones que dicen «disponible en una fase posterior» y no inventan cifras. Acciones: registrar comercio, nota, tarea, etapa permitida, perdido con motivo, pedir claim. Sin botón de ganada, sin confirmar atribución, sin disputa, sin porcentajes editables.
- Restricciones: queries filtradas por `current_promoter_id`. No service role.
- Tests: E2E-08 parcial (A no lee B). Smoke de UI si hay browser.
- Aceptación: CC-11 y CC-12 en la superficie. Un promotor no activo ve el perfil y no ve el formulario de alta de comercio habilitado.
- Evidencia: test RLS + nota de UI.
- Recuperación: revertir `app/promoter` sin tocar `app/admin`.

## Hecho de fase

E2E-02, E2E-06 (sin dinero) y el aislamiento entre promotores pasan. `next_task` = P04-T01.

Al crear `opportunity_attributions`, agregar el test de fusión de P02-T06: fusionar comercios no cambia `promoter_id` de la atribución.
