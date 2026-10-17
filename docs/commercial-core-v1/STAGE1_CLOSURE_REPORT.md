# Commercial Core V1 — cierre de Etapa 1

Fecha: 17 de octubre de 2026.

Rama: `cursor/commercial-core-v1-integration`.

Punto de partida de T05: `7bad5b5103b701add15d58cdb145a9d286af62eb`.
Veredicto de T05: `COMMERCIAL_V1_STAGE1_T05: PASS`.

Etapa 1 cierra el contrato económico Founder que no depende de un proveedor: activación, mes incluido, calendario anclado, imputación y comisiones. No declara Commercial V1 listo para producción. No autoriza a empezar T06.

## Resumen

T01 dejó la Revisión 2 escrita y pruebas que todavía veían el hueco del mes incluido. T02, T03 y T04 cerraron ese hueco en SQL, sobre el motor que ya existía. T05 reejecutó las suites y no encontró regresión.

La SPEC vigente sigue siendo la Revisión 2 de `ORDEROPS_COMMERCIAL_CORE_PROMOTORES_V1_DECISIONES_CIERRE.md`. El índice es `VIGENTE.md`. `MASTER_PLAN.md` queda como paquete del 8 de octubre y no fija el precio. El texto de ARS 65.000 y el efectivo a ARS 55.000 aparece solo como revisión sustituida.

## Resultados T01–T04

| Lote | Resultado | Qué quedó |
| --- | --- | --- |
| T01 | `PASS_WITH_EXPECTED_RED`, resuelto en T02 | Revisión 2 y pruebas de contrato |
| T02 | `PASS` | `service_started_on` y rechazo del período incluido |
| T03 | `PASS` | `ensure_founder_monthly` y calendario fijo |
| T04 | `PASS` | Imputación, comisión y aislamiento reutilizando el motor |

## Matriz de aceptación

| Contrato | Estado | Evidencia de esta pasada |
| --- | --- | --- |
| Activación ARS 290.000 y alta ARS 120.000 | PASS | `founder-v1-contract.verify.ts`; `phase05_commissions.sql` |
| Mes incluido, sin obligación ni slot | PASS | `phase05_founder_included_period.sql`; `phase05_founder_schedule.sql` |
| Primera mensualidad 10/12/2026 por ARS 55.000 | PASS | Las dos suites anteriores |
| Vencimientos 10/01/2027 y 10/02/2027 | PASS | `phase05_founder_schedule.sql` |
| Pago del 20/12/2026 no corre enero | PASS | `phase05_founder_schedule.sql` |
| Abrir la mensualidad no crea comisión | PASS | `phase05_founder_schedule.sql` |
| Cobro exacto ARS 55.000 reconoce ARS 22.000 | PASS | `phase05_commissions.sql` y el calendario |
| Misma operación no duplica cobro ni comisión | PASS | `phase05_collections.sql`; `phase05_commissions.sql` |
| ARS 50.000 y ARS 65.000 no imputan | PASS | `phase05_collections.sql`; `phase05_founder_schedule.sql` |
| Diciembre no cierra enero | PASS | `phase05_founder_schedule.sql` |
| Negocio A no cierra negocio B | PASS | `phase05_founder_imputation.sql` |
| Reversa sin compensación automática | PASS | `phase05_reversals.sql`; `phase05_negative_adjustment.sql` |
| Tope de doce cobranzas | PASS | `phase05_p0_cap.sql`; `phase05_slots.sql` |
| Escritura de cobranza solo con Finanzas | PASS | `phase05_founder_imputation.sql`; `phase05_collections.sql` |
| Días 29, 30 y 31 | BLOCKED | `month_length_unspecified` en `phase05_founder_schedule.sql`. No hay política |
| Efectivo rechazado en un cobro real | NOT_VERIFIED | No hay adaptador |
| Mobbex y Talo Pay | NOT_VERIFIED | No hay sandbox ni webhook |

`verify-all` recorre `lib/commercial/**/*.verify.ts` con `tsx`. No abre Postgres, no corre `phase05_*.sql` y no llama a un proveedor. La prueba de calendario dentro de `founder-v1-contract.verify.ts` ejecuta la función pura y lee el texto de la migración. La prueba de base es la suite SQL.

## Migraciones y QA

Entorno confirmado: contenedor `supabase_db_orderops-phase06-qa`, base `postgres`, puerto `127.0.0.1:56722`.

| Versión | Archivo | Ledger QA |
| --- | --- | --- |
| `20261017120000` | `commercial_founder_included_period.sql` | Presente |
| `20261017143000` | `commercial_founder_monthly_schedule.sql` | Presente |

La segunda depende de `founder_service_starts`, `founder_period_on` y `open_obligation` de la primera. El orden de nombres lo respeta. No exigen datos previos de QA. No están aplicadas en la base principal ni en Cloud. Las 17 suites `phase05_*.sql` terminaron en `ROLLBACK`.

En esta pasada también salieron en 0: `npx tsx lib/commercial/founder-v1-contract.verify.ts`, `npx tsc --noEmit --incremental false` y `node scripts/commercial-core/verify-all.mjs` (19 archivos). No hubo archivos TypeScript nuevos, así que no hubo una corrida de ESLint de un diff.

## Cobertura

Método de la auditoría diferencial, sin cambiar el denominador: CC-C01 a CC-C16, peso 1. Pleno = 1. Parcial, o bloqueado con camino nominal, = 0,5. No construido = 0. La verificación vale 1 solo si una suite SQL o `tsx` cubre la regla, y 0,5 si el código existe pero la aceptación autenticada no se ejecutó. CC-C18 no suma una decisión 17: modifica el modelo Founder dentro de CC-C12 y CC-C15.

Antes de Etapa 1: implementación 8,5/16 y verificación 8/16. CC-C11, CC-C13, CC-C14 y CC-C15 valían 0.

Después de T01–T04, CC-C15 pasa de 0 a 0,5 en las dos columnas. El pago tardío ya no corre el vencimiento y eso se ejecutó en SQL. Sigue fuera el reinicio de calendario después de una reactivación, porque la suspensión de pedidos no existe. CC-C12 permanece en 0,5: el mes incluido y el precio único ya están verificados, pero Mobbex, Talo y el rechazo operativo del efectivo no. El resto de la matriz no cambia.

Implementación: **9/16 = 56,25 %**. Verificación: **8,5/16 = 53,125 %**.

Siguen en 0: CC-C11, CC-C13 y CC-C14. Siguen en 0,5: CC-C01, CC-C03, CC-C05, CC-C07, CC-C10, CC-C12, CC-C15 y CC-C16. Siguen en 1 de implementación: CC-C02, CC-C04, CC-C06, CC-C08 y CC-C09. Eso no es preparación para producción.

## Límites de lo construido

T01–T04 no crearon un segundo ledger, otra fórmula de comisión, cobros parciales automáticos ni un precio nuevo. No tocaron el Panel de Promotores, Estadísticas, Ledger ni Cloud. No activaron una pasarela. Los días 29, 30 y 31 quedan bloqueados a propósito.

`BLK-ECO-01`, `BLK-ECO-02`, `BLK-ECO-03` y `BLK-PRIV-01` siguen abiertos. Son decisiones legales o fiscales, no un resultado de estas suites.

## Handoff a Etapa 2

Precondiciones antes de T06, sin pedir credenciales en este informe:

- Contrato y sandbox de Mobbex, y de Talo Pay.
- Prueba de que la suscripción puede diferir el primer abono, coherente con el mes incluido.
- CVU persistente por negocio. La Payments API de Talo, que crea un CVU por pago, no alcanza.
- Consulta de la acreditación en el proveedor. El webhook no basta como única prueba.
- Firma o autenticación real de eventos. En Talo, `X-Talo-Signature` seguía anunciada como pendiente.
- Prueba de frenar un reintento de Mobbex ya lanzado antes de pasar solo a CVU.
- Guardado de secretos fuera del cliente y fuera de este informe.
- Decisión de producto para los días 29, 30 y 31 antes de aceptar esos inicios.
- Los cuatro bloqueos económicos y de privacidad citados arriba, separados de la prueba técnica.

Recomendación: no iniciar T06. Etapa 1 está cerrada. La preparación de Etapa 2 puede reunir accesos de sandbox, pero el calendario de fin de mes y los bloqueos legales no son solo una credencial externa.
