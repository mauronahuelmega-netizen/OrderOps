# T08-A — Acreditaciones externas sin imputar

Fecha: 17 de octubre de 2026.

`COMMERCIAL_V1_T08A: PASS`

No se llamó a `record_collection`. No se cerraron obligaciones ni se generaron comisiones, slots ni suscripciones. No se crearon clientes Talo ni transferencias. No se abrió un túnel.

## Qué se reutilizó

`platform_collections` sigue siendo el libro de una cobranza ya imputada. El outbox sigue encolando avisos. Ninguno de los dos guarda una acreditación de proveedor pendiente de imputar. El receptor `receiveTaloCustomerWebhook` sigue validando el aviso y leyendo la transacción. La persistencia nueva empieza después de esa lectura.

## Asociación y registro

`commercial.provider_customer_links` une un `won_business_id` con un cliente `talo`, su entorno, el CVU y el alias. El cliente externo no puede pertenecer a dos negocios. Un negocio no tiene dos clientes del mismo proveedor y entorno. La relación no depende de una mensualidad.

`commercial.provider_receipts` distingue `received`, `pending_review` y `confirmed`. La unicidad es proveedor, entorno, cliente y transacción. `confirmed` exige ARS, bruto, neto, diferencia igual al bruto menos el neto, y la procedencia `detail` o `list` de cada importe. Un fallo temporal queda en `pending_review` y puede confirmarse después. Una confirmación ya guardada no se pisa ni se baja de estado. El webhook solo deja `received`.

La consulta autenticada sigue en el adaptador de sandbox. Si el detalle trae el neto y el listado el bruto, se conservan las dos procedencias. No se calcula el bruto con un porcentaje.

## Pruebas

`supabase/tests/commercial/phase08_provider_receipts.sql` terminó en `ROLLBACK` sobre `supabase_db_orderops-phase06-qa`. Cubre promotor rechazado, conflicto entre negocios, cliente desconocido, importe incompleto, reintento, preservación del importe, dos movimientos fuera de orden y la unicidad ante un insert directo. Las tablas económicas no cambiaron de cantidad.

Dos sesiones concurrentes confirmaron `tx-race` y dejaron una sola fila. Esos datos de carrera se borraron. La migración `20261017220000` quedó aplicada y registrada solo en ese QA.

## Después

T08-B puede imputar una fila `confirmed` a una obligación, todavía sin unificar proveedores. T09 puede ampliar el `provider` y compartir esta unicidad con Mobbex. La firma `X-Talo-Signature` sigue pendiente. El webhook no acredita por sí solo.
