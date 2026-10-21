# P04-T01C — revalidación posterior a recuperación

Fecha: 2026-10-16. **Veredicto: BLOCKED** por falta de evidencia de restricción efectiva de red. No se alcanza `READY_FOR_TRANSACTIONAL_QA_REHEARSAL`.

La identidad, archivos, recursos privados, catálogo y datos auditados coinciden con las referencias aprobadas. El bloqueo no demuestra una filtración ni una modificación de la base: los bindings son amplios y no fue posible consultar las reglas efectivas del firewall. No se ejecutó el ensayo ni el instalador.

## Controles

| Control | Resultado | Evidencia / alcance |
|---|---|---|
| Worktree, rama y HEAD | PASS | OrderOps-Estadisticas; codex/estadisticas-v1; `923300265323d411c5c91b7935472d5423d228d2`. |
| Archivos anteriores | PASS | 2.947 archivos inventariados antes de crear este directorio. Coinciden los 2.908 del baseline anterior y los 38 artefactos con hash del inventario P04-T01C. Su evidence.json, excluido de su propio inventario, queda capturado en el baseline actual. Ver preservation.json. |
| Cambios Git preexistentes | PASS | Conservados, incluidos los seis archivos rastreados modificados y los no rastreados. Sin commits ni operaciones de integración. |
| Verificador adversarial offline | PASS | isolation-policy.verify.mjs sin cambios; repetido también por el preflight. |
| Manifiesto, configuración y signing keys | PASS | Validadores originales y hashes privados sin cambios; no se exportaron claves ni credenciales. |
| Migraciones | PASS | 119 copias base cotejadas contra manifiesto y Git original; hashes de migraciones propias preservados; ledger live 124 y contenido idéntico al aprobado. |
| Proyecto e identidad live | PASS | orderops-statistics-v1-test-74718de66a41; marcador privado coincide. |
| Contenedores | PASS | Cinco IDs originales, todos running; DB/Auth/Kong/Storage healthy; REST no tiene healthcheck, no se afirma que haya pasado uno. |
| Red y volúmenes exclusivos | PASS | Network ID y dos volúmenes coinciden exactamente con manifiesto. Ningún contenedor ajeno comparte esa red o esos volúmenes. |
| Endpoints configurados | PASS | CLI status validado: API 127.0.0.1:56321 y PostgreSQL 127.0.0.1:56322. No significa que sean los únicos bindings. |
| Alcance real de bindings | PASS (observación) | Docker publica ambos puertos en 0.0.0.0 y ::, como antes. Windows muestra listeners en :: y listeners adicionales de loopback. Ver network-observations.json. |
| Restricción efectiva de red | **BLOCKED** | Perfiles de firewall habilitados; consulta de reglas ActiveStore: Acceso denegado. No se comprobó alcance desde LAN ni filtrado efectivo IPv4/IPv6. El campo rules=0 de la salida resumida significa consulta fallida, no ausencia de reglas. No hubo sondeos remotos. |
| Catálogo y seguridad existentes | PASS | 22 funciones statistics, definiciones/defaults/ACL, políticas, índices, constraints y triggers comparados con P04-T01C; coincidencia exacta. check_function_bodies=on; deadlocks=0 en ambas observaciones. |
| Datos referenciados | PASS | Conteos y huellas de las 15 tablas de data-select.sql idénticos. Dos negocios, doce perfiles; cero pedidos, líneas, finanzas, completions, productos y categorías. No equivale a una comparación de todas las tablas de Auth/Storage del clúster. |
| Resumen original | PASS | Definición y privilegios originales intactos. A+B y D1 siguen privados, sin adopción; C ausente. |
| Hash instalador | PASS | `f7940a54a58b93b04d56b10eb1f65bf425299436a2e25a1d3ae79feec919272f`. Fuente financiera 57395a…c2c1 intacta. |
| Productos y QA ausentes | PASS | Wrapper, reader, helper métrico, helper de gate y tabla QA ausentes; no existen pares QA habilitados. |
| Revisión estática del paquete | PASS | Gramática y checks originales repetidos con salida nueva. Cuatro funciones invoker y tabla vacía/default closed; sin alteraciones al contrato financiero. No es compilación PL/pgSQL ni prueba runtime de RLS. |
| Ensayo transaccional | BLOCKED / no ejecutado | Falta autorización expresa y resolver evidencia de red. Matriz revisada en rehearsal-review.md. |
| Instalación, Auth HTTP y T02 | BLOCKED / no ejecutados | Fuera de esta autorización. |
| Entornos excluidos | PASS de alcance | Ninguna conexión SQL/HTTP Auth a Cursor, OrderOps compartido, Ledger, Majo o producción. Inspección de metadatos Docker ajenos únicamente para negar compartición; no se auditó su salud ni se accedió a sus bases/worktrees. |

## Diferencias respecto de la evidencia anterior

No se detectaron diferencias en archivos referenciados, identidad de recursos, ledger, catálogo, ACL, políticas o datos comparados. Los bindings wildcard ya estaban documentados el 14 de octubre: no se presentan como una regresión causada por la recuperación.

La evidencia nueva confirma listeners Windows en :: para 56321/56322 y perfiles de firewall habilitados, pero el acceso a reglas efectivas fue denegado por Windows incluso con la ejecución fuera del sandbox. Esto impide cerrar la antigua incertidumbre de exposición. No fue un rechazo de revisión automática de autorización; es una limitación del acceso efectivo del proceso al sistema operativo.

CPU DB 0,01% y memoria 1,54% en una observación puntual del preflight. Son una comprobación de presupuesto para auditoría, no un benchmark ni evidencia de estabilidad. Windows/WSL recuperados y respaldo lógico independiente: informados por el propietario; no se verificó ni restauró el respaldo en esta tarea.

## Método y preservación

Solo conexiones PostgreSQL al contenedor DB privado, con PGOPTIONS 15 s / 3 s. Consultas SELECT dentro de BEGIN READ ONLY / ROLLBACK. Sin COMMIT, DDL, fixtures, cambios de grants, sesiones Auth, arranque de servicios o activación de pares. Las consultas devuelven metadatos y huellas; los SELECT no invocan candidatos de Productos.

preflight-readonly.mjs reutiliza las comprobaciones anteriores sin rebajar invariantes, agrega el hash del instalador, compara contra las referencias P04-T01C y dirige las salidas a este directorio. proposal-static-readonly.mjs conserva los checks del verificador estático y cambia únicamente su destino de evidencia. Los originales permanecen intactos. El texto heredado de consola del preflight dice P04-T01B; su destino, controles y evidencia son los de esta revalidación.

Las observaciones de catálogo y datos se compararon con referencias inmutables. No se afirma una comparación nueva antes/después de un ensayo: no hubo ensayo. Al aparecer el bloqueo de red se detuvieron las comprobaciones live; continuaron solo revisión documental/estática y verificación local de preservación.

## Recomendación

Mantener el paquete cerrado y sin instalar. Completar primero una observación autorizada de las reglas efectivas que afectan los listeners Docker/WSL y ambos protocolos, mediante una sesión con permisos suficientes o evidencia administrativa verificable. Firewall habilitado por sí solo no demuestra restricción. No es necesario ni está autorizado cambiar reglas para completar esa auditoría.

Si la auditoría demuestra exposición no aceptada, presentar un cambio mínimo de binding/firewall por separado; no aplicarlo automáticamente. Si demuestra restricción suficiente, emitir el checkpoint pendiente tras repetir identidad, hashes y colisiones. El ensayo con ROLLBACK necesitará otra autorización expresa; persistencia, activación de seis pares, HTTP/Auth y T02 siguen siendo decisiones separadas. No adoptar A+B/D1/C ni reabrir benchmarking.
