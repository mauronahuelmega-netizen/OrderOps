# PHASE-05 — Comisiones, liquidaciones y pagos

- ID: PHASE-05
- Objetivo: reproducir en local el caso Founder nominal desde la cobranza ficticia hasta la transferencia simulada, sin duplicar derechos y sin calcular casos sin política.
- Alcance: obligaciones, collections, slots, comisiones, ajustes, liquidaciones, facturas, pagos manuales, UI mínima de Finanzas y del promotor.
- Depende de: PHASE-04 done para el circuito con onboarding. Los tests del motor puro pueden escribirse apenas existan `conversion_terms` de fixture.
- Prerrequisitos: tres usuarios locales distintos para E2E-03 (prepara, aprueba, paga). Programa semilla intacto.
- Riesgos: comisionar desde `order_financials`; float; segundo slot por reintento; pagar sin factura; la misma persona cierra el circuito.
- No incluye: decidir IVA ni parciales del cliente (`BLK-ECO-01`, `BLK-ECO-02`). No incluye neteo automático (`BLK-ECO-03`).

Contratos: sección 6 de [DATA_MODEL.md](../DATA_MODEL.md), tabla dorada de [TEST_STRATEGY.md](../TEST_STRATEGY.md), INV-03 a INV-11, INV-14. CC-18 a CC-27, CC-31, CC-32.

Errores: `policy_blocked`, `duplicate_commission`, `slot_exhausted`, `window_open`, `onboarding_required`, `sod_violation`, `invoice_required`, `invoice_amount_mismatch`, `payment_exceeds_total`, `idempotent_replay`.

Zona horaria de cierre: `America/Argentina/Buenos_Aires`. El `period_key` es el mes calendario de esa zona. Una comisión con `available_at` posterior al último instante de ese mes no entra.

## P05-T01 Cobranzas

- Descripción: obligaciones y collections manuales.
- Archivos: migración `commercial_phase05_economics.sql` (puede partirse en 05a collections y 05b commissions si el archivo crece; el rollback cubre el prefijo), RPC `open_obligation`, `record_collection`.
- Depende de: P04-T01.
- Cambios: finance registra. Idempotency key. Setup único por terms. Reintento reusa `obligation_id`. `failed` no es elegible. `posted` con bruto igual al `list_price_cents` → `nominal`. Distinto → `blocked_pending_policy`. Sin lectura de `finance_*`.
- Restricciones: montos enteros. No Mercado Pago. No webhooks.
- Tests: doble key no duplica. Failed no satisface. Bruto distinto queda blocked. Setup y suscripción son obligaciones distintas.
- Aceptación: CC-18 tiene de dónde nacer. ENG-04 y ENG-06.
- Evidencia: SQL.
- Recuperación: down de fase 05. Si ya hay comisiones de fixture, el down las elimina con las tablas; no tocar finance del local.

## P05-T02 Motor nominal

- Descripción: funciones puras y RPC que inserta comisión solo en caso nominal.
- Archivos: `lib/commercial/commissions/calculate.ts`, `calculate.verify.ts`, RPC `accrue_commissions_for_collection`.
- Depende de: P05-T01.
- Cambios: setup → 12_000_000 fijo del snapshot. Recurrente → `eligible_base * 4000 / 10000`. Unique `(collection_id, right_kind)`. `blocked_pending_policy` no inserta. Ganar no llama a esta RPC.
- Restricciones: módulo puro sin importar `lib/orders` ni clientes Supabase. No redondear con float; división entera de centavos documentada (5_500_000 * 4000 / 10000 = 2_200_000 exacto).
- Tests: G-05, G-09, G-12 y «won sin collection» en verify o SQL.
- Aceptación: CC-18, CC-21, CC-22, CC-23 en el caso nominal.
- Evidencia: `npx tsx lib/commercial/commissions/calculate.verify.ts`.
- Recuperación: revertir el módulo. Comisiones de fixture se borran con el test en transacción.

## P05-T03 Liberación de setup y ventana

- Descripción: estados `pending` y `available`.
- Archivos: `lib/commercial/commissions/availability.ts`, RPC `refresh_commission_availability`, excepción `release_setup_commission`.
- Depende de: P05-T02, P04-T02.
- Cambios: `available_at = posted_at + 15 días`. Recurrente pasa a `available` cuando el reloj de datos cumple, aunque onboarding no esté completo. Setup además exige grant `completed` de ese `business_id` y promotor, o excepción superadmin con motivo. Disputa con `hold_unpaid_commissions` pone `held` solo las comisiones de esa oportunidad.
- Restricciones: no adelantar al cierre mensual. No usar `setTimeout` de 15 días en el server.
- Tests: G-01, G-02, G-03, G-04.
- Aceptación: CC-24 y CC-25 en la ventana.
- Evidencia: verify + SQL.
- Recuperación: las excepciones de fixture quedan auditadas; no borrar `audit_events`.

## P05-T04 Contador de doce y reactivación

- Descripción: slots y `service_subscriptions`.
- Archivos: tablas `founder_slots`, `service_subscriptions`, RPC `satisfy_subscription_collection`, `end_service`, `reactivate_service`.
- Depende de: P05-T02.
- Cambios: slot solo en subscription nominal posted. Failed no inserta. Reintento de la misma obligación: un slot. Máximo 12. La obligación 13 nominal no crea comisión. Cancelación guarda `cancel_requested_at` y `ended_at` por separado. Reactivar con `now <= ended_at + 180 días` sigue el mismo `conversion_terms` y el próximo slot es max+1. Después de 180 días la RPC no reabre terms.
- Restricciones: no contar meses calendario. No inventar el parcial.
- Tests: G-06, G-07, G-08, G-16, G-17, E2E-04, E2E-07.
- Aceptación: CC-19, CC-20, CC-31.
- Evidencia: SQL del conteo 12 y de la suma 26_400_000 recurrente.
- Recuperación: transacción de test.

## P05-T05 Ajustes y reversas

- Descripción: no borrar la cobranza ni la comisión histórica.
- Archivos: `commission_adjustments`, RPC `reverse_collection`, `post_adjustment`.
- Depende de: P05-T03.
- Cambios: `reverse_collection` marca la collection `reversed`, anula slot si la comisión no estaba `paid` (el slot liberado no se reasigna al mismo número si eso duplicaría historia: el slot queda vinculado a la collection revertida y `voided`, y no se reutiliza el número; la spec dice corregir, no reescribir. Una nueva mensualidad exitosa toma el siguiente slot libre, no recicla el revertido). Si estaba `paid`, la comisión sigue `paid` y nace ajuste negativo `available` que Finanzas puede incluir después a mano (`BLK-ECO-03`).
- Restricciones: sin compensación silenciosa. Sin update de `amount_cents` original.
- Tests: G-10, G-11, E2E-05.
- Aceptación: CC-25 y CC-32.
- Evidencia: SQL que muestra la fila original y el ajuste.
- Recuperación: no «arreglar» revirtiendo el ajuste con otro update oculto.

## P05-T06 Liquidación mensual

- Descripción: una por promotor y período.
- Archivos: `promoter_settlements`, `settlement_items`, RPC `prepare_settlement`, `approve_settlement`, UI `app/commercial/settlements`.
- Depende de: P05-T03.
- Cambios: prepara finance. Incluye comisiones `available` con `available_at` dentro del mes Argentina, y ajustes que Finanzas pase en la lista de ids (no todos los negativos solos). SoD en approve. Total = suma de ítems. Unique de período. Unique de source en ítems. `due_on` = día 10 del mes siguiente, informativo. Segunda preparación devuelve la existente si sigue `draft`, o error si ya está aprobada.
- Restricciones: superadmin no prepara salvo que tenga el permiso extra. Los fixtures no le dan ese permiso.
- Tests: G-13. Comisión que libera el día 2 del mes siguiente queda afuera. Misma persona no aprueba. E2E-03 hasta aprobación.
- Aceptación: CC-26.
- Evidencia: SQL de período.
- Recuperación: void de la liquidación draft de fixture por RPC, no delete directo si ya hay audit; en test, rollback.

## P05-T07 Factura del promotor

- Descripción: comprobante antes de pagar.
- Archivos: `promoter_invoices`, storage path `invoices/`, RPC `submit_invoice`, `review_invoice`, UI del promotor en la sección que estaba en placeholder.
- Depende de: P05-T06, P03-T06.
- Cambios: promotor `active` o `separated` carga factura de una liquidación propia `approved`. Importe distinto → finance solo puede `rejected`. Importe igual → `accepted` y settlement `payable`. Documento en bucket privado.
- Restricciones: sin AFIP. Sin marcar `payable` por el promotor.
- Tests: G-14. Promotor separado puede cargar. Promotor ajeno no. Importe mal rechazado.
- Aceptación: CC-28 en la parte de factura previa. CC-29 canal administrativo.
- Evidencia: SQL.
- Recuperación: borrar objetos del bucket local de prueba.

## P05-T08 Transferencia simulada

- Descripción: pagos parciales, fallidos y reintentos.
- Archivos: `settlement_payments`, RPC `record_settlement_payment`, UI de finance, snapshot de CBU.
- Depende de: P05-T07.
- Cambios: exige `payable`. `recorded_by` distinto de `approved_by`. Key única. `failed` no suma. Suma `recorded` no pasa del total. Parcial → `partially_paid`. Igual → `paid` y comisiones incluidas → `paid`. Reintento con otra key después de `failed`. Cambiar el CBU después no altera `destination_snapshot` del pago ya registrado. Encola `payment.recorded`. Nada sale a un banco.
- Restricciones: no integrar transferencias. No usar el break-glass en E2E-03.
- Tests: G-15, E2E-03 completo, parcial, fallido, reintento, CBU cambiado.
- Aceptación: CC-27. INV-09, INV-10. La liquidación no queda pagada al aprobarse.
- Evidencia: SQL de estados y suma.
- Recuperación: el pago de fixture no representa dinero real; rollback de test.

## Hecho de fase

G-01..G-17 y E2E-03, E2E-04, E2E-05, E2E-07 pasan en local. Caso blocked sigue sin comisión. `next_task` = P06-T01.

Si alguien «arregla» G-09 calculando un 40 % del bruto distinto, revertir. Eso cierra mal `BLK-ECO-01`.
