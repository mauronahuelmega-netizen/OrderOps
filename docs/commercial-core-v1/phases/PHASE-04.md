# PHASE-04 — Conversión y onboarding

- ID: PHASE-04
- Objetivo: Ganada queda atada a un `public.businesses` real de la base local, con términos congelados, y el promotor solo edita catálogo con un grant vigente y sin precios.
- Alcance: win, snapshot, grants, guard en actions existentes de productos y categorías.
- Depende de: PHASE-03 done. Catálogo admin actual intacto.
- Prerrequisitos: al menos un negocio local de prueba creado por el flujo ya existente de super-admin, o por la RPC de esta fase si reutiliza esa validación de slug.
- Riesgos: romper el save del owner; dar al promotor `manageProducts`; mezclar precio y nombre en un POST y aceptar el POST.
- No incluye: cobrar ni comisionar. `won` sigue sin crear comisión (test explícito).

Contratos: INV-02, INV-03, INV-07, INV-12, INV-13. CC-10, CC-13 a CC-17. ENG-12, ENG-18 en el snapshot (copia de columnas, no recalcula).

Errores: `won_requires_business`, `won_forbidden`, `terms_immutable`, `grant_missing`, `grant_expired`, `grant_field_forbidden`, `grant_not_client_approved`.

## P04-T01 Ganar y congelar términos

- Descripción: transición a `won` y fila `conversion_terms`.
- Archivos: migración `commercial_phase04_conversion.sql`, RPC `win_opportunity`, `lib/commercial/conversion/snapshot.ts`, verify.
- Depende de: P03-T04.
- Cambios: solo permiso `opportunity.win`. Exige `won_business_id` de un `businesses` existente y atribución `confirmed` vigente (o protección de 90 días todavía dentro de fecha si el promotor ya está separated). Copia literal del programa vigente `founder` v1, o del programa que superadmin indique por id, hacia `conversion_terms`. Vincula `commercial_businesses.linked_business_id`. Encola `conversion.terms_frozen`. No inserta en tablas de comisión aunque la fase 05 aún no exista: el test busca que la RPC no mencione `promoter_commissions`.
- Restricciones: no duplicar la creación de slug si ya hay action en super-admin. Leer `app/super-admin/(protected)/businesses` y reutilizar la función si está extraída; si está embebida, duplicar la validación mínima de slug único en una función compartida solo si el comportamiento observable del super-admin queda cubierto por un verify. No cambiar campos de branding.
- Tests: `won` sin business falla en SQL. Update de `conversion_terms` falla. Cambiar la fila del programa después no altera el snapshot (insertar versión 2 de programa de prueba y comparar). Promotor no puede ganar. Comercial no puede ganar.
- Aceptación: CC-10, CC-23, INV-07. Cuatro hechos siguen distintos: aceptar (etapa), vincular (`won_business_id`), cobrar (ausente), comisionar (ausente).
- Evidencia: SQL.
- Recuperación: down de fase 04. No borrar `public.businesses` creados por el flujo viejo.

## P04-T02 Grants

- Descripción: pedido, aprobación del comercio, excepción, revocación, tope 30 días.
- Archivos: `onboarding_grants`, `onboarding_grant_events`, RPC `request_onboarding_grant`, `respond_onboarding_grant`, `revoke_onboarding_grant`, `complete_onboarding`.
- Depende de: P04-T01.
- Cambios: el promotor o un interno piden. Aprueba owner/manager de ese `business_id` (mismo criterio que `manageProducts`). Excepción solo superadmin con motivo. `ends_at <= starts_at + 30 days`. Renovar = fila nueva, no estirar en silencio la vieja. Revocar y completar cierran escritura. Separar promotor (RPC de fase 03) debe revocar grants: alterar esa RPC en una migración chica de esta fase, con test.
- Restricciones: la atribución no inserta grant. El miembro del comercio no gana lectura del CRM.
- Tests: promotor no aprueba su propio grant. Fin a 31 días falla el check. Owner de otro business no aprueba.
- Aceptación: CC-13, CC-15, CC-16.
- Evidencia: SQL.
- Recuperación: revocar grants de fixture.

## P04-T03 Guard de catálogo

- Descripción: enganchar las actions reales.
- Archivos: `lib/commercial/onboarding/catalog-guard.ts`, `app/admin/(protected)/products/actions.ts`, actions de categorías en `app/admin/(protected)/categories/actions.ts`, verify de regresión.
- Depende de: P04-T02.
- Cambios: al inicio de cada mutación, si el usuario es principal promotor, exigir grant `active` y `now() < ends_at` para el `business_id` del recurso, y rechazar el form completo si incluye precio u otro campo prohibido. Si el usuario es admin del comercio, llamar `requireAdminPermission("manageProducts")` como hoy, sin pasar por el grant. Lista permitida: nombre, descripción, categorías, imágenes, texto descriptivo de variante. Stock y disponibilidad: si la action actual los trata como operación de venta, quedan prohibidos para el promotor en V1 (más estricto que «dudar»). Documentar esa elección en el PR de la tarea como ENG de alcance, no como cambio de precio.
- Restricciones: no dar de alta `profiles` al promotor en el comercio. No debilitar RLS de productos para `authenticated` en general. CSS no aplica salvo un mensaje de error ya estilado con module existente; no sumar reglas a `globals.css`.
- Tests: E2E-10 sobre un producto fixture. Owner cambia precio y el valor persiste. Promotor con grant cambia descripción. Promotor envía precio y el precio queda igual. Grant revocado: descripción no cambia.
- Aceptación: CC-14 y CC-17. Regresión del owner.
- Evidencia: SQL o test de action contra local, más exit del verify de permisos admin.
- Recuperación: revertir el guard. Si una action quedó a medias, el owner no puede guardar: eso es bloqueo de fase, no se sigue a fase 05.

## P04-T04 Expiración

- Descripción: la autorización mira el reloj, no solo el status.
- Archivos: RPC `expire_onboarding_grants`, test con `ends_at` en el pasado, llamada desde el guard.
- Depende de: P04-T03.
- Cambios: job invocable en local marca `expired`. El guard niega aunque el status siga `active` si `ends_at` ya pasó, por si el job no corrió.
- Restricciones: no borrar la fila.
- Tests: E2E-10 rama de vencimiento.
- Aceptación: denegación sin depender del cron.
- Evidencia: SQL.
- Recuperación: sin efecto sobre catálogo del owner.

## Hecho de fase

E2E-10 pasa. Un `won` de prueba no tiene filas de comisión. `next_task` = P05-T01.

Releer las actions tocadas: si el guard quedó solo en create y no en update, la fase no está hecha.
