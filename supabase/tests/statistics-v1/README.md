# Estadísticas V1: pruebas preparadas, sin ejecutar SQL

La autorización de Fase 02 permite preparar estas pruebas, NO ejecutarlas. El runner no contiene una vía para aplicar migraciones.

## Verificación permitida ahora

`node scripts/statistics-v1/sql-static.verify.mjs` usa el parser local PostgreSQL 17 instalado en `.runtime/sql-tools` (`pgsql-parser@17.9.15`). Valida gramática exterior, cuerpos LANGUAGE SQL y superficies. No resuelve tipos, permisos, funciones de PostgreSQL ni compila PL/pgSQL. No conecta a DB.

`npx --no-install tsx lib/statistics/domain.verify.ts`, `npx --no-install tsx lib/statistics/read.verify.ts`, `npx --no-install tsc --noEmit --incremental false` y ESLint con la configuración propia no escriben DB. El adaptador de lectura se prueba con cliente falso.

## Condiciones futuras de escritura

1. Aprobación humana explícita del conjunto exacto identificado por `node scripts/statistics-v1/review-bundle.mjs`, incluyendo triggers sobre tablas compartidas, y de las pruebas de escritura. Cualquier edición cambia el hash y exige nueva revisión.
2. Revalidar rama/worktree, recursos Docker, identidad privada, API 56321/DB 56322, baseline119 y versiones libres. No ejecutar CLI desde el directorio raíz con configuración compartida.
3. Aplicar manualmente, mediante una operación posteriormente autorizada y con registro de hashes, únicamente las tres migraciones revisadas en orden 01000/02000/03000 sobre el contenedor propio. No se proporciona un comando automático para hacerlo en esta fase.
4. Registrar después la aprobación en el archivo ignorado `.runtime/sql-review-approval.local.json`: `{ "approvedByOwner": true, "allowWriteTests": true, "projectId": "<proyecto verificado>", "reviewedBundleHash": "<hash aprobado>" }`. Ese recibo no constituye por sí mismo autorización del chat y NO se crea en Fase 02.
5. Ejecutar `node scripts/statistics-v1/sql-approved-tests.mjs unit` y después `... concurrency`. Se rechazan recibo ausente, contenido cambiado, recursos ajenos y migraciones no registradas.

## Suites y límites

- `capture-metrics.sql`: fixtures sintéticos de principal + upsell, sesión nocturna, identidad histórica, captura, acuerdo, suma23/unidades2, lectura RPC, idempotencia, reapertura, última finalización, rollback de ciclo, cambio de acuerdo, diferencia inexplicada, conflicto de composición, cancelación, fuera de sesión, cobertura sin fecha, revisión diferida. BEGIN/ROLLBACK; no conserva datos.
- `security-money.sql`: centavos/residuos, descuento identificado como input explícito, entradas inválidas, DST, vacío frente a desconocido; dos tenants con filas reales en las cinco estructuras, seis roles originales por tenant, RPC/helper/RLS, ausencia de escritura y ausencia de bypass anon/service. BEGIN/ROLLBACK.
- `concurrency-fixture.sql`/`concurrency-cleanup.sql`: preparación/limpieza exacta de IDs sintéticos f203 en negocio A. Solo para el runner aprobado, sin reset ni eliminación masiva. Conservan temporalmente pedidos/sesión para que varias conexiones puedan observarlos. Al fallar se dejan para inspección; nunca limpiar mientras haya sesiones activas.
- Runner de concurrencia: dos sesiones independientes; barreras por salida HELD/CAPTURED y espera real `pg_stat_activity.wait_event_type=Lock`, sin usar un sleep como prueba de solapamiento. Completar/completar, reabrir/refinalizar, acuerdo/finalización y cierre/finalización. Timeouts explícitos, unicidad activa/ciclo. La revisión puede bloquear commits del mismo negocio; no debe bloquear la captura por la fila financiera.

Pendientes antes de declarar garantía runtime: compilar/aplicar SQL, ejecutar suites, sumar schedules inversos y estrés, integridad de FK compuestas y cambios reales de producto, borrar catálogo/pedido/sesión, timezone ausente/cambiado, cursor inválido/cambio de revisión, comparación parcial con varias sesiones y límites de mes, sumar buckets, UPDATE migraciones sobre datos existentes, rollback de la migración fallida y rendimiento con EXPLAIN. Regresión de `create_order`, stock/cancelación y RPC financieras reales requiere sus fixtures y contratos definitivos del árbol combinado. No se declara PASS por la validación sintáctica ni por simular esos RPC con UPDATE directo.

Un escritor que use `SET CONSTRAINTS ALL IMMEDIATE` o toque múltiples negocios exige revisión específica del orden de locks. No desactivar triggers para fabricar historia; no modificar fechas de snapshots para ajustar fixtures.
