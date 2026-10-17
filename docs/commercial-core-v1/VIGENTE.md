# Índice vigente — Commercial Core V1

Fecha: 17 de octubre de 2026.

## Qué manda

| Tema | Documento |
| --- | --- |
| Decisiones de cierre CC-C01 a CC-C16, CC-C18 y CC-C19 | [ORDEROPS_COMMERCIAL_CORE_PROMOTORES_V1_DECISIONES_CIERRE.md](ORDEROPS_COMMERCIAL_CORE_PROMOTORES_V1_DECISIONES_CIERRE.md) |
| Importes, doce cobranzas, aprobación, liquidación y pago de comisiones | [FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md), secciones 18 y 19 |
| Paquete de planificación del 8 de octubre de 2026 | [MASTER_PLAN.md](MASTER_PLAN.md). Histórico de secuencia. No fija el precio vigente |
| Cierre de la Etapa 1, 17 de octubre de 2026 | [STAGE1_CLOSURE_REPORT.md](STAGE1_CLOSURE_REPORT.md) |

`ORDEROPS_COMMERCIAL_V1_PLAN_CURSOR_REVISADO.md` no está en el repositorio.

## Founder V1, Revisión 2

Un plan. Activación ARS 290.000. Abono ARS 55.000. Mismo precio en Mobbex y en Talo Pay. Sin efectivo. La activación incluye el primer período de servicio. La primera mensualidad es el período siguiente. El inicio se registra en `founder_service_starts.service_started_on`; no se infiere de la conversión ni del cobro. Los vencimientos siguientes salen de esa fecha. Un pago tardío no los corre. Comisión de alta ARS 120.000. Comisión recurrente ARS 22.000 por cobranza elegible, hasta doce. El período incluido no genera comisión recurrente ni consume un puesto.

La revisión 1, con abono de ARS 65.000 y efectivo a ARS 55.000, está sustituida dentro del documento de cierre. No se borra el registro de que existió.

## Qué no está verificado

Los adaptadores de Mobbex y Talo no están construidos. Este índice no afirma que el motor rechace efectivo ni que un proveedor haya cobrado. La preparación de sandbox está en [T06A_SANDBOX_PREP.md](T06A_SANDBOX_PREP.md). La conexión Talo está en [T06A_TALO_CONNECTION.md](T06A_TALO_CONNECTION.md) y espera las tres variables del SDK en `.env.local`. El CVU de prueba y la transferencia ficticia de ARS 290.000 están en [T06A_TALO_PERSISTENT_CVU.md](T06A_TALO_PERSISTENT_CVU.md) y [T06B_TALO_TRANSFER.md](T06B_TALO_TRANSFER.md). El receptor de webhook todavía no está expuesto: [T06B_TALO_WEBHOOK_PREP.md](T06B_TALO_WEBHOOK_PREP.md). No hay adaptador de cobro.

CC-C19 fija el fin de mes. El vencimiento conserva el día de `service_started_on`. Si ese día no existe en el mes destino, se usa el último día disponible. El cálculo sale del inicio y del offset pedido: no arrastra el ajuste de un vencimiento anterior y un pago tardío no corre la fecha. Un 29 de febrero se conserva en un año bisiesto.
