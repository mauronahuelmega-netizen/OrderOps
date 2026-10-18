# T08-B — Imputación de una activación atestada

Fecha: 17 de octubre de 2026.

`COMMERCIAL_V1_T08B: PASS` en el QA `orderops-phase06-qa`. No es una verificación automática de Talo ni de `X-Talo-Signature`. No hay commit.

## Qué hace

`commercial.attest_provider_receipt` guarda dos constancias de Finanzas: la consulta del movimiento y la autorización de Talo para una obligación. Copia los importes del recibo. `provider_api_verified` y `webhook_signature_verified` quedan en falso por restricción.

`commercial.impute_provider_receipt` llama a `commercial.record_collection` solo si hay esa atestación y una única activación `setup` abierta del mismo negocio y del mismo bruto. La clave es `provider-receipt:<receipt_id>`. La referencia externa incluye el cliente. Una mensualidad pasa a `reconciliation_required` con `subscription_due_not_defined`. Una reversa no reabre la obligación. No llama a `accrue_commissions_for_collection` ni a `satisfy_subscription_collection`.

## Pruebas

| Prueba | Resultado |
| --- | --- |
| `phase08_impute_provider_receipt.sql` en `ROLLBACK` | PASS |
| Carrera de dos imputaciones y reversa concurrente | PASS. Una sesión `idempotent=false`, la otra `true`. Una cobranza `posted`, cero comisiones y cero slots. La segunda acreditación quedó `obligation_not_open`. La reversa dejó la obligación `satisfied` y cero `posted`. Limpieza sin filas de la carrera |
| `tsc --noEmit --incremental false` | PASS |
| ESLint de `scripts/commercial-core/t08b-impute-race.mjs` | PASS, sin hallazgos |
| `verify-all` | PASS, 26 archivos, 47 tablas |

## Pendiente

Firma del webhook, evidencia de lectura autenticada a Talo, regla de vencimiento de mensualidades, medio de pago activo y reapertura después de una reversa. El listener no imputa.
