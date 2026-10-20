# Talo First V1 — L0 compatibilidad y enmiendas

Fecha: 2026-10-20. Base: `cursor/commercial-core-v1-integration` en `8717e62`. Worktree: `cursor/commercial-talo-first-v1`.

Fuentes normativas: [CF-TF-V1.0_CONSOLIDADO_APROBADO_2026-10-20.md](CF-TF-V1.0_CONSOLIDADO_APROBADO_2026-10-20.md) y el mandato de ejecución V1 mínima del 2026-10-20.

El contrato original `ORDEROPS_TALO_FIRST_V1_CONTRATO_FUNCIONAL.md` **no fue localizado y no se recotejó**. Los 18 escenarios de la sección 4 se transcriben desde una lectura previa hecha en la conversación de planificación. Esa procedencia se conserva.

## 1. Enmiendas a contratos cerrados

- **CC-C14 (H1).** El ejemplo "vence el 10, suspendido desde el 18" se sustituye. Hay siete días completos de gracia `[period_start, period_start + 7 días)` y la suspensión rige a las `00:00` hora Buenos Aires de `period_start + 7 días`. Ejemplo: vencimiento 16/10, suspensión 23/10 00:00 BA (`03:00Z`).
- **CC-C13 y reglas de conciliación (H2).**
  - Donde dice "deuda" o "deuda/periodo único asociado" para mensualidades, se lee "período cobrable prepago".
  - Un período no renovado expira y no es exigible.
  - No cambian importes, idempotencia ni la regla de importe exacto.
- **PHASE-05 (H3, TF-05).**
  - Las comisiones recurrentes se devengan al inicio del período pagado, o al imputar si el período ya empezó.
  - `available_at` se fija explícitamente en `devengo efectivo + 15 días`.
  - `refresh_commission_availability` no cambia: usa `coalesce(available_at, posted_at + 15 days)`.
  - La comisión de activación conserva `posted_at + 15 días`.
- **PHASE-05 (cobertura, DT-02).** `reverse_collection` deja la obligación en `satisfied`. Por eso la cobertura se deriva de cobranzas `posted` y `nominal`, nunca de `platform_obligations.status`.
- **PHASE-01 (DT-01).**
  - Se agrega `platform_accounts.kind = 'system'`, con una única cuenta de sistema no humana.
  - `has_permission` solo concede a esa cuenta `collection.write`, y solo dentro de wrappers `system_*` ejecutables por `service_role`.
  - `audit_events.actor_kind` registra `system` para esa cuenta.
  - No se suplanta a ningún usuario de Finanzas.
- **T08-B (H7).** `provider_receipt_evidence` y su CHECK quedan intactos. La lectura autenticada se registra en `provider_read_evidence`, una tabla separada.

## 2. Reducciones de alcance V1 (mandato)

- **Diferido a V1.X:** TF-06.1, P0.1 y las partes de P1.5 propias del puente. No hay `bridge_grants`, ni `next_bridge`, ni acceso de cortesía.
- **DT-03 reducido:** no se construye `renewal_intents`.
  - Si existe un único destino elegible, se imputa automáticamente.
  - Si hay más de uno (negocio suspendido dentro de la ventana T−10 del próximo período), va a conciliación y Finanzas elige el período (H5).
- **DT-04:** sin margen fijo de 24 h.
  - La elegibilidad se calcula con la fecha del proveedor (`observed_at`, tomada de `creation_timestamp` o `payment_date` de Talo, semántica NOT_VERIFIED) y con la hora de verificación.
  - Si los destinos difieren entre ambos instantes, o falta la fecha del proveedor, el recibo va a conciliación.
- **DT-08 reducido:** los avisos se calculan en el momento a partir del estado comercial. No hay tabla de avisos, ni `business_notice_reads`, ni centro de notificaciones, ni email.
- **DT-09 mínimo:** Finanzas registra comprobantes emitidos externamente, guardados en un bucket privado por tenant. Owner y Manager los descargan mediante una URL firmada de corta duración.
- **Inicio de servicio:** se conserva el contrato de Etapa 1 (`20261017120000`): `service_started_on` se registra explícitamente y no es un timestamp de pago. El sistema no lo registra. Con la activación cobrada y sin inicio registrado, el negocio queda `active` en el período incluido como "inicio pendiente"; Billing y la cola de Finanzas lo muestran hasta que Finanzas lo registre.

## 3. Protección de tenants existentes (H6, P1.3)

- La puerta de pedidos solo rige desde `commercial.service_gate_config.enforced_from`, nulo por defecto. Activarla es un paso de lanzamiento que requiere:
  - `service_gate_preflight()` vacío;
  - exenciones legacy expresas en `service_access_exemptions`.
- Una exención es explícita, auditada y revocable. La falta de términos no exime.
- En QA hay dos tenants de fixture sin términos (`negocio-fixture-phase06`, `negocio-privacidad-qa`). La puerta no se activa globalmente en QA; las pruebas la activan dentro de transacciones con `ROLLBACK`.

## 4. Escenarios originales (recuperados de lectura previa, no recotejados)

1. Primera activación: ARS 290.000, un mes incluido, comisión de setup elegible; ningún slot mensual.
2. Aviso T−10 enviado una sola vez por canal y renovación visible en Billing. *V1: aviso interno calculado, sin email.*
3. Transferencia de ARS 55.000 en T−10: renovación futura cubierta; slot 1 solo al comenzar el período.
4. Pago T+5 dentro de la gracia: acceso continuo, fecha fija, devengo al confirmar.
5. Sin pago al final de T+6: suspensión a T+7 00:00 BA y bloqueo server-side de pedidos nuevos.
6. Pedidos aceptados antes de la suspensión se terminan con permisos acotados; el catálogo público no permite checkout.
7. Pago después de la suspensión (25/10): reactivación del período pertinente hasta el 16/11, sin mover el ancla.
8. Puente (12/11). **DIFERIDO V1.X.** En V1 se trata como destino ambiguo: conciliación.
9. Reingreso fuera de ventana (01/11): sin promesa de cobertura hasta el 01/12.
10. Meses sin renovar expiran sin deuda, comisiones ni slots.
11. Días 29/30/31, febrero, bisiesto y cambio de año preservan `founder_period_on`.
12. Duplicados, parciales, excedentes, `PENDING` o moneda errónea: nunca un cobro, una comisión o un acceso dobles.
13. Acreditación sin referencia de período y con varios destinos: conciliación.
14. Worker detenido, lectura fallida o webhooks fuera de orden: recuperación idempotente.
15. Factura emitida según el régimen aplicable, accesible solo para Owner y Manager del tenant. *V1: emisión externa registrada; entrega por plataforma.*
16. Aislamiento entre tenants y entre promotores; Operator y Viewer sin montos.
17. Comisión 12 elegible, 13 no.
18. Sin gracia infinita ni puentes abusivos. *La parte de puentes está DIFERIDA V1.X.*
