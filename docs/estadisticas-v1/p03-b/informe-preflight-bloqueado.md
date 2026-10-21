# Estadísticas V1 — P03-B

**Veredicto: FAIL por condición previa de infraestructura.** No se aplicó la migración ni se ejecutaron pruebas SQL. Este resultado no demuestra un defecto del SQL: la identidad live del entorno aislado no pudo verificarse. Se detuvo toda operación de base, de acuerdo con la condición expresa del propietario.

## Preflight y evidencia

| Verificación | Resultado |
|---|---|
| Worktree `OrderOps-Estadisticas`, rama `codex/estadisticas-v1` | PASS |
| Hash de `20261013004000_statistics_v1_comparative_series.sql` | PASS, idéntico al autorizado |
| Verificador adversarial offline | PASS |
| Identidad declarada en manifest local | PASS local: `orderops-statistics-v1-test-74718de66a41` |
| 119 archivos base, conjunto y hashes contra el commit del baseline aprobado y copias runtime | PASS local |
| Tres archivos Phase 02 | PASS local: bytes iguales a HEAD y MD5 iguales a la evidencia histórica aprobada |
| Colisión de versión | PASS en archivos y referencias Git locales conocidas; no se consultaron remotos |
| Identidad live, API/DB y recursos exclusivos | FAIL: verificador detenido al acceder a Docker |
| Ledger instalado de 119+3 migraciones | NO VERIFICADO live |

SHA-256 verificado, sin cambios:

```text
b10c330adff70b803d9d25165f07830e90d4cd092aa4ba2cf3d0120a43f95219
```

Primero se ejecutó `node scripts/statistics-v1/isolation-policy.verify.mjs`: pasó sus escenarios adversariales sin escrituras Docker/DB. Luego `node scripts/statistics-v1/assert-isolated-target.mjs` falló por denegación de acceso del sandbox a la configuración y al pipe Docker. Se repitió **el mismo verificador de solo lectura fuera del sandbox**, con escalación autorizada. El daemon respondió:

```text
Error response from daemon: Docker Desktop is unable to start
```

No se intentó arrancar, reiniciar, detener, reparar ni resetear Docker o ningún Supabase. No se sustituyó el fallo por conexiones directas a otros endpoints ni se cargaron credenciales/configuraciones de Cursor o producción.

La evidencia histórica del entorno es del `2026-10-12T22:27:12.833Z`; no acredita su estado actual. API `127.0.0.1:56321` y DB `127.0.0.1:56322` siguen siendo los destinos exigidos, **no verificados live en esta ejecución**. Contenedores, red, volúmenes y marca privada tampoco pudieron confirmarse. `preflight.json` registra la distinción entre comprobaciones locales e históricas y las comprobaciones live fallidas.

## Instalación, catálogo y pruebas individuales

| Prueba autorizada | Estado de P03-B |
|---|---|
| Instalación transaccional de la migración exacta | NO EJECUTADA |
| Catálogo real: funciones, firmas, defaults y dependencias | NO EJECUTADA |
| Compilación PL/pgSQL y rollback atómico de instalación | NO EJECUTADA |
| Igualdad JSON legacy/RPC sin `series` en mismo snapshot | NO EJECUTADA; prueba preparada conservada |
| Grants, RLS y seis roles en dos negocios | NO EJECUTADA |
| Captura, reapertura, cancelación, recompletado y finanzas | NO EJECUTADA |
| Dimensionamiento, límite y pertenencia única | NO EJECUTADA en PostgreSQL |
| Apertura/cierre, microsegundos, noches, DST y zonas | NO EJECUTADA en PostgreSQL |
| Comparaciones, parcialidad y calidad de indicadores | NO EJECUTADA en PostgreSQL |
| Concurrencia, bloqueos y rollback | NO EJECUTADA |
| EXPLAIN y rendimiento con volumen controlado | NO EJECUTADA; ninguna medición disponible |
| Regresiones de base aislada | NO EJECUTADA |

Las pruebas offline PASS del cierre P03-A permanecen como evidencia anterior; no se presentan como validación runtime P03-B. Tampoco se presenta el catálogo de Phase 02 como catálogo de la migración comparativa.

## Fixtures y aislamiento antes/después

Se crearon **cero fixtures**, se aplicaron **cero migraciones** y se ejecutaron **cero escrituras de base**. No hay fixtures creados por esta ejecución que limpiar. El inventario de datos preexistentes y el estado live posterior no pudieron verificarse; no se afirma que una base accesible esté vacía o que sus recursos estén intactos por comprobación live. Ninguna operación de esta ejecución los modificó.

## Inventario y cambios preservados

Archivos nuevos: `docs/estadisticas-v1/p03-b/informe.md` y `preflight.json`. El verificador también actualizó su log de fallo local ignorado `.runtime/verify-failure.local.log`. No se modificó ningún archivo SQL, contrato, decoder, script, permiso ni archivo compartido. Cero commits nuevos; HEAD `923300265323d411c5c91b7935472d5423d228d2`.

Se preservaron los cambios preexistentes en `docs/estadisticas-v1/fase-01-evidencia.json`, `next-env.d.ts` y los archivos sin seguimiento de P03-A, auditorías y adjuntos. Sus hashes locales quedan registrados en `preflight.json`.

## Condiciones de reanudación y detención

Docker debe estar operativo para repetir, desde el principio, la verificación adversarial y de identidad live, puertos, recursos exclusivos, marca privada, baseline instalado y ausencia de colisiones. La evidencia histórica y los hashes locales no reemplazan esas condiciones. Solo entonces puede utilizarse la autorización P03-B para el hash exacto indicado y preparar la evidencia de cada prueba runtime; cualquier cambio de hash requiere nueva autorización expresa.

Persisten todos los riesgos runtime pendientes de P03-A: compilación, dependencia del catálogo, igualdad JSON, RLS, precisión de operadores temporales, concurrencia, rollback y rendimiento. No hay mediciones nuevas que permitan reducirlos. No se propone ninguna corrección SQL a partir de este fallo de infraestructura.

**Trabajo detenido antes de escribir.** No se inició P03-C/D/E, interfaz, navegación, integración con Cursor, merge, rebase, push ni despliegue.
