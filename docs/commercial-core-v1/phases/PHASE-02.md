# PHASE-02 — Captación y CRM

- ID: PHASE-02
- Objetivo: una solicitud de demo local se convierte en comercio potencial y oportunidad, sin duplicar en los casos de alta confianza, y sin atribución.
- Alcance: tablas CRM, dedup, pipeline, tareas, formulario, UI interna mínima, fusión.
- Depende de: PHASE-01 done.
- Prerrequisitos: gate local sigue en verde antes de aplicar la migración.
- Riesgos: filtrar fichas entre promotores (todavía no hay panel, pero la RPC pública no debe devolver PII de terceros); crear claim desde el formulario.
- No incluye: activación de promotores, comisiones, grant de catálogo.

Contratos: dedup ENG-07, etapas de [DATA_MODEL.md](../DATA_MODEL.md) sección 3, CC-01, CC-08, CC-09, CC-35, CC-36, CC-37.

## Lectura de CRM

Requisito obligatorio de esta fase. P02-T01 niega toda lectura CRM a soporte, porque grant y onboarding todavía no existen. El acceso positivo, limitado a oportunidades con grant o vínculo de onboarding, queda para cuando esas relaciones existan. La prueba de denegación de P02-T01 mira el resultado de la consulta.

`crm.read` no concede acceso irrestricto a todas las filas. Soporte solo puede leer oportunidades con autorización por grant o vinculadas al onboarding, como dice [SECURITY_MATRIX.md](../SECURITY_MATRIX.md). Superadmin y commercial conservan la lectura que esa matriz ya les da.

El control va en la consulta efectiva: política RLS o filtro de la RPC o del server action que lee. Ocultar una fila en la interfaz no cumple el requisito.

Antes de dar la fase por hecha tiene que haber una prueba de denegación: un principal `support` no recibe una oportunidad fuera de ese alcance. La prueba mira el resultado de la consulta, no el HTML. P02-T01 no se adelanta en la sesión que solo documenta esta regla.

Estados de oportunidad: `new`, `contacting`, `qualified`, `demo_scheduled`, `demo_done`, `follow_up`, `won`, `lost`. En esta fase la RPC de `won` puede existir pero debe fallar con `won_requires_business` hasta PHASE-04, o directamente no exponerse. No insertar `won` a mano en la UI.

Errores: `validation`, `duplicate_submission`, `rate_limited`, `open_opportunity_exists`, `lost_reason_required`, `open_tasks_remaining`, `merge_forbidden`.

## P02-T01 Tablas CRM

- Descripción: comercios, contactos, interacciones, submissions, oportunidades, eventos de etapa, tareas, merges (tabla; la RPC de fusión es P02-T06).
- Archivos: `supabase/migrations/<timestamp>_commercial_phase02_crm.sql`, `supabase/rollbacks/commercial_phase02_down.sql`, `supabase/tests/commercial/phase02_crm.sql`.
- Depende de: P01-T04.
- Cambios: objetos de la sección 3 del modelo, checks de `won`/`lost`, unique parcial de una oportunidad abierta por comercio.
- Restricciones: sin FK a comisiones. `initial_promoter_id` no crea claim.
- Tests: insert `lost` sin motivo falla; segunda oportunidad abierta del mismo comercio falla; oportunidad nueva después de `lost` pasa.
- Aceptación: migración local aplicada y testeada.
- Evidencia: comando y exit code.
- Recuperación: down de fase 02 si fase 03 no está aplicada.

## P02-T02 Deduplicación

- Descripción: normalizar nombre y teléfono AR, clasificar `high | probable | none`.
- Archivos: `lib/commercial/crm/normalize.ts`, `lib/commercial/crm/dedup.ts`, `lib/commercial/crm/dedup.verify.ts`, RPC `commercial.find_or_prepare_business`.
- Depende de: P02-T01.
- Cambios: teléfono a E.164 con prefijo Argentina cuando el input es local de 10 u 11 dígitos típicos; si el formato es irreconocible, no es high match. High solo con nombre normalizado igual y teléfono igual y fiscal no contradictorio. Lock advisory por teléfono dentro de la RPC.
- Restricciones: la función usada por un promotor no devuelve filas de comercios ajenos. En esta fase el caller público es el server action, no el promotor. Igual la RPC no hace `select *` hacia el cliente anónimo.
- Tests: `dedup.verify.ts` con formatos `11 5555-0101`, `+54 9 11 5555-0101`, nombre igual → high. Mismo nombre, otro teléfono → none o probable según ENG-07 (probable si se considera señal, nunca high). Mismo teléfono, otro nombre → probable. Dos llamadas concurrentes: el test SQL usa dos transacciones; si el harness no puede, un test secuencial con lock documentado y un comentario de límite.
- Aceptación: ningún caso de un solo campo produce `high`.
- Evidencia: exit 0 del verify.
- Recuperación: revertir el módulo. Los datos de prueba se borran por transacción del test.

## P02-T03 Pipeline y tareas

- Descripción: transiciones auditadas y tareas.
- Archivos: `lib/commercial/crm/stages.ts`, `lib/commercial/crm/stages.verify.ts`, RPC `transition_opportunity`, `upsert_task`.
- Depende de: P02-T01.
- Cambios: cualquier salto de etapa no terminal permitido para `crm.write`, siempre con fila en `opportunity_stage_events` y `audit_events`. `lost` exige motivo. Cerrar (`lost` o el gancho futuro de `won`) con tareas `open` falla. Completar tarea no extiende claims (no hay tabla de extensión todavía; el verify de texto asegura que esta RPC no escribe `attribution_claims`).
- Restricciones: el promotor aún no tiene sesión de producto completa; la RPC igual debe aceptar solo cuentas con permiso, no anon.
- Tests: transición `new` → `demo_done` genera evento; `lost` sin motivo falla; tarea `open` bloquea el cierre.
- Aceptación: CC-09 y CC-37 cubiertos sin UI.
- Evidencia: verify + SQL.
- Recuperación: drop de RPC en down de fase 02.

## P02-T04 Formulario público

- Descripción: campos CC-35, validación servidor, aviso de privacidad, antispam, idempotencia.
- Archivos: `app/demo/page.tsx` o ruta colocada junto a la landing existente sin romper el CTA de WhatsApp, `components/marketing/demo-request-form.tsx`, `components/marketing/demo-request-form.module.css`, `app/demo/actions.ts`, enlace desde `components/marketing/marketing-action.tsx` solo si el destino actual es WhatsApp: agregar un segundo camino al formulario, no reemplazar el enlace de WhatsApp.
- Depende de: P02-T02, P02-T03.
- Cambios: action valida obligatorios (responsable, comercio, WhatsApp, rubro). Email y necesidades opcionales. Rate limit 5/hora por teléfono y por hash de IP. Origen `organic` si no hay código. Si hay `promoter_ref`, guardarlo en la submission y en el origen de la interacción, sin claim. Alta confianza reutiliza el comercio y suma interacción. Crea oportunidad solo si no hay una abierta. Encola `demo.submitted`. Página de confirmación sin eco de datos de otros comercios.
- Restricciones: sin service role en el cliente. Texto de privacidad visible con enlace; si la política pública todavía no existe, enlazar una ruta local `/privacidad` con un texto mínimo de finalidad de la demo, no un dictamen legal (`BLK-LEG-01`). CSS solo en module. Tokens semánticos.
- Tests: SQL E2E-01 de [TEST_STRATEGY.md](../TEST_STRATEGY.md). Verify de validación (falta rubro). Idempotency key repetida no duplica.
- Aceptación: segunda submission idéntica no crea otro lead; no aparece fila en `attribution_claims`.
- Evidencia: test SQL y, si hay browser, smoke del formulario en `localhost`. Si no hay browser, decirlo en `PROGRESS.md`.
- Recuperación: quitar la ruta. Las filas de prueba locales se eliminan con el rollback de datos fixture, no con deletes ad hoc de comercios reales. En local de esta fase solo debe haber fixtures.

## P02-T05 Backoffice mínimo

- Descripción: lista y ficha para un interno `commercial`.
- Archivos: `app/commercial/layout.tsx`, `app/commercial/opportunities/page.tsx`, componentes en `components/commercial/` con CSS module, ampliación del matcher en `middleware.ts` a `/commercial/:path*`.
- Depende de: P02-T04, P01-T03.
- Cambios: lista de oportunidades no archivadas, ficha con contactos, interacciones (origen visible), tareas de hoy, próximas y vencidas. Acciones de etapa y de tarea vía RPC. Sin botones de ganar ni de confirmar atribución.
- Restricciones: no reutilizar `requireAdminContext` como si el comercial tuviera `business_id`. Gate nuevo `requireCommercialPrincipal`.
- Tests: usuario sin rol interno recibe redirect o 403. Verify de que el middleware incluye el matcher nuevo (test de lectura del archivo o prueba de request local).
- Aceptación: la oportunidad creada en P02-T04 se ve y puede pasar a `contacting` quedando el evento.
- Evidencia: SQL del evento más nota de UI.
- Recuperación: revertir `app/commercial` y el matcher. Cuidado de no quitar `/admin` ni `/b`.

## P02-T06 Fusión

- Descripción: fusionar dos comercios potenciales sin tocar atribuciones (aunque en esta fase aún no existan filas de atribución, el trigger debe estar escrito para no actualizar esa tabla).
- Archivos: RPC `merge_commercial_businesses`, test en `phase02_merge.sql`.
- Depende de: P02-T01.
- Cambios: solo `crm.write` o superadmin, motivo obligatorio, audit, `commercial_merges`, contactos e interacciones reasignados, absorbido con `merged_into_id`.
- Restricciones: no borrar interacciones. No cambiar `origin` de una interacción.
- Tests: fixture de dos leads, fusión, orígenes distintos siguen en las interacciones. Un update de prueba contra una tabla de atribución inexistente no hace falta; el test lee el cuerpo de la función y falla si contiene `opportunity_attributions`, y cuando la fase 03 cree la tabla se agrega un test de comportamiento en P03.
- Aceptación: INV-15 preparado. CC-36 fusión auditada.
- Evidencia: SQL.
- Recuperación: no deshacer fusiones de fixture con updates manuales; reset de fixture.

## Hecho de fase

E2E-01 y E2E-09 (en la parte que no necesita promotor) pasan. E2E-09 completo se refuerza en fase 03 para el secreto entre promotores. La prueba de denegación de `crm.read` para soporte, definida arriba, también pasa. `next_task` = P03-T01.

## Corrección posterior a la auditoría

No reabre la fase. Migración `20261009013318_commercial_phase02_audit_fix.sql`: hash de IP obligatorio en una solicitud nueva, respuesta pública sin ids, `EXECUTE` de `public.submit_demo_request` solo para `service_role`, y los otros seis wrappers públicos solo para `authenticated`. `/commercial` redirige a `/commercial/opportunities`. La evidencia está en `PROGRESS.md`, separada de P02-T01 a P02-T06.
