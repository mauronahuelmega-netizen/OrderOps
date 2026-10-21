# Propuesta separada — no ejecutada ni autorizada

Objetivo: corroborar identidad lógica e integridad antes de una futura ventana. No instalar funciones ni habilitar QA. Esta propuesta requiere aprobación expresa adicional.

1. Repetir primero identidad Docker exacta y exclusividad. Fijar hashes de SELECT históricos de p04-t01c/catalog-select.sql, data-select.sql, extra-select.sql y privilege-audit.sql; revisar sus expresiones antes de autorizar. No ejecutar automáticamente scripts antiguos ni sus finalizadores.
2. Usar una única conexión local exclusiva 127.0.0.1:56322, con base/usuario QA previamente identificados. Credenciales solo memoria, nunca argumentos visibles/logs.
3. BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY; SET LOCAL statement_timeout='15s'; SET LOCAL lock_timeout='3s'. Ejecutar exclusivamente SELECT revisados del marcador privado (sin mostrar token), ledger esperado124, definiciones/ACL/search_path/security de funciones, RLS/políticas y huellas de datos conforme a referencias aprobadas. No llamar funciones de aplicación con efectos laterales ni usar SELECT como permiso genérico para escribir.
4. Confirmar RPC pública original, A+B y D1 privados, C ausente y Productos/gate QA ausentes. Comparar JSON, firmas y fingerprints contra referencias sin reemplazarlas ni normalizar diferencias.
5. ROLLBACK obligatorio; ante error/cancelación, cierre de conexión y registro sanitizado. Sin COMMIT, DDL, seeds, fixtures, Auth ni ensayo de creación transaccional. No es autorización de instalación QA ni de prueba funcional Productos.
6. Diferencia = detener y presentar diagnóstico. Una transacción read-only también toma locks/consume recursos; mantener presupuesto y no ampliar timeouts. Registrar alcance de fingerprints: los históricos de tablas públicas no prueban todo Auth/Storage.

No se ha abierto ninguna conexión PostgreSQL en la tarea actual. Esta propuesta documental no es un harness ejecutado.
