# Casos mínimos confirmados y siguiente paso

## SQL-05 — continuidad de cursores

Reproducido con siete productos sintéticos y página de cinco. Obtener respuesta y nextCursor en UTC / ISO, MDY; conservar businessId/revision/asOf/sort. Cambiar exclusivamente TimeZone a Pacific/Auckland e invocar la segunda página: SQLSTATE **22023**, STATISTICS_STALE_CURSOR. En una prueba independiente, TimeZone permanece UTC y DateStyle cambia a SQL, DMY: mismo 22023.

Causa comprobable en código: requestKey concatena v_start::text/v_end::text/v_now::text. La representación cambia con parámetros de sesión aunque el instante y las fechas sean equivalentes. El rechazo no filtra datos, pero rompe continuidad y portabilidad del cursor.

Propuesta para revisión posterior, no implementada: serialización canónica de fechas YYYY-MM-DD y del instante UTC con seis microsegundos mediante formato explícito, independiente de DateStyle/TimeZone. Mantener rol, negocio, revision, preset y sort en la clave. No utilizar MD5 como firma de autorización. Validar primero equivalencia de parámetros y rechazo real de cursores ajenos/stale; decidir tratamiento de cursores previos, sin aceptarlos silenciosamente.

## SQL-07 — importe no finito no atribuible

Reproducido sobre un pedido con captura reconciliada: en transacción sintética, current_agreement de order_financials se cambia a numeric NaN. El CHECK positivo existente lo admite. La vista original marca effective_sales no disponible, como corresponde; Productos conserva subtotal conocido parcial, pero coverage.pendingAgreedTotal agrega NaN. `products-read.ts` devuelve STATISTICS_PRODUCTS_INVALID_RESPONSE.

El JSON real y SQLSTATE de la assertion diagnóstica están preservados en attempt-02. La assertion usa P0001 para señalar el defecto; el rechazo del decoder sucede offline sobre ese mismo JSON y no es un SQLSTATE de la RPC. No se inventa un código de error del lector que no ocurrió.

Propuesta posterior: tratar explícitamente no finitos en la proyección diagnóstica pendingAgreedTotal. Preferir NULL cuando no pueda expresarse un total fiable, manteniendo unresolvedOrders y cobertura parcial; no sumar un cero ni eliminar silenciosamente el pedido. Revisar si la razón necesita extensión de contrato antes de cambiar JSON. Alternativa: error de lectura explícito por fuente no finita. La política financiera de la tabla compartida requiere autorización separada si se quisiera cambiar; no modificar writer/constraint/Resumen como reparación incidental.

## Harness

El harness completo y todos sus hashes están disponibles. Corregir estáticamente los supuestos obsoletos de estados, actor, límite entre sentencia/asOf y atribución del upsell antes de la siguiente batería. No confundir una assertion incorrecta con un defecto del SQL. Mantener assertions de SQL-05/07 como regresiones que hoy fallan; no cambiar el decoder para aceptarlas.

No se propone adopción, publicación ni migración persistente. Tras aprobar un nuevo hash, repetir primero compilación, seguridad y exactitud en rollback; completar las pruebas omitidas indicadas en informe.md. Mantener 15 s SQL y 3 s locks, sin reabrir benchmarking avanzado.
