# Estrategia HTTP/Auth y regresiones — preparadas, no ejecutadas

Estado: todos los casos nuevos runtime QA/publicación/HTTP **NOT_EXECUTED**. Se hicieron únicamente preflight/auditoría READ ONLY y revisión estática. Las 91 pruebas previas prueban núcleo de Productos, no el helper/config/RLS nuevos.

## HTTP real

`http-auth.prepared.mjs` usa @supabase/ssr instalado, Auth.signInWithPassword/getUser y cookie jar SSR real por usuario. Solicita perfiles originales y llama RPC con JWT de usuario, sin service role, solo origin 127.0.0.1:56321. Credenciales desde runtime privado; nunca passwords/tokens/cookie values en evidencia. Requiere explícito --authorized-http-qa, checkpoint instalado aprobado y fresh verifier; no puede ejecutarse como preparación.

Primera tanda cerrada: owner/manager/admin reciben NOT_PUBLISHED; operator/viewer/super_admin ACCESS_DENIED. Segunda tanda, solo tras autorización de enable: seis perfiles originales permitidos, seis denegados, negocio correcto, otra configuración invisible, UPDATE config denegado, refreshSession real y signOut scope local en finally. Anónimo denegado sin JSON de Productos; registrar 401/403/404 real según gateway/ACL/schema cache, no transformar error de infraestructura en denegación PASS.

Es transporte SSR/cookies hacia Supabase, **no E2E de una ruta Next Productos**, que no existe. No se crea ruta alternativa. Una futura app de QA usa solo puerto 3037/API56321/DB56322, fuente espejo propia para evitar archivos generados en worktree; iniciar app requiere permiso posterior y ninguna instancia ajena. Gate G1 Summary cerrado sigue probado por regresión offline e HTTP donde el servidor QA autorizado esté disponible.

Refresh real no es expiry. TTL Auth observado en configuración es 3600 segundos; no se alterará para forzar test. Preparar token Auth emitido/documentado antes de su expiración real y conservar únicamente en almacenamiento privado; ejecutar getUser/RPC tras exp dentro de una ventana posterior autorizada, sin falsear exp y llamar eso sesión real. El runner corto declara expiry NOT_EXECUTED. Puede añadirse firma corrupta como otro caso, nunca como prueba equivalente de expiración.

La documentación local del SDK auth-js, GoTrueClient.ts líneas 3700–3709, aclara que signOut no revoca inmediatamente JWT access; invalida refresh y quita sesión cliente. Por eso no se exige que un JWT viejo sea inmediatamente rechazado por PostgREST. Cierre SQL/TTL de publicación sí debe bloquear datos independientemente de la vida restante de ese JWT.

Antes/después de Auth: inventariar sesiones/refresh families y users sintéticos. Login/refresh actualizan metadatos Auth y crean filas, no son rollback SQL. Preservar todas las sesiones preexistentes; registrar exclusivamente IDs/fingerprints propios nuevos y limpieza por logout local. Si quedan filas propias revocadas, documentar; no borrar globalmente ni declarar inventario idéntico sin comprobarlo. Cualquier limpieza SQL selectiva adicional requiere autorización específica. Perfil/negocio/finanzas permanecen preservados, excepto fixtures propios expresamente aprobados.

## Matriz mínima posterior

| Grupo | Escenario / aceptación | Preparación |
|---|---|---|
| Compilación/publicación | Ensayo rollback de cuatro funcs + tabla + RLS; catálogo/ACL/defaults/search_path y cierre sin filas | QA SQL completo + static-review.json; falta runtime. |
| Publicación cerrada | Ausencia/disabled/expiry NULL/pasada; owner válido no obtiene datos, wrapper y reader | SQL + HTTP cerrado, sin menú/URL como autoridad. |
| Publicación abierta QA | Solo seis pares fijados con TTL, role original y negocio correctos | Enable separado; ninguna fila cliente real admitida. |
| Roles | Tres permitidos, operator/viewer/super_admin/NULL/desconocido/sin perfil/negocio denegados | Auth real para 12 usuarios existentes; estados imposibles no crean schema inválido. |
| RLS | Config SELECT propio, sin escrituras, analytics/direct helper/pair foreign, claims manipulados | Repetir matriz SQL con permiso; PostgREST private schema sigue no expuesto. |
| Autenticación | getUser, cookie SSR, refresh real, anónimo, firma inválida, expiración real | Runner parcial preparado; expiry/bad signature/Next E2E se etiquetan pendientes hasta ejecutar. |
| Cambio de negocio/rol | Perfil mutable solo sintético, datos no se mezclan; gate cierra al perder el par | SQL rollback y, para observación HTTP, escritura persistida/selectiva autorizada/restaurada. |
| SQL-05/07 | Canonical key TZ/DateStyle/seis dígitos, NaN→NULL con unresolved>0, datos no cero | Repetir ocho regresiones antes de habilitar. |
| Núcleo funcional | 91 casos, ocho períodos, nueve diferenciales, 54 JSON reales decoder | Repetir con configuración QA transaccional habilitada, fuentes originales intactas. |
| Resumen | Definición/ACL/RLS/datos/hash idénticos, G1/menu cerrado, ocho períodos/KPI/gráfico | SQL original + pruebas propias existentes; no modificar Summary RPC. |
| HTTP no vacío | Ranking/cursor/shares con datos persistidos de dos negocios, no fixtures rollback invisibles | Seed específico con manifiesto de IDs y limpieza selectiva; requiere aprobación separada. |
| MVCC | Config/expiry actual no reabierto con asOf, snapshot consistente, cierre inmediato | Pruebas acotadas; sin benchmarking avanzado. |
| Red | Wildcard bindings constatados; alcance efectivo al entorno QA verificado | Falta prueba firewall/reachability; no modificar servicios/config por iniciativa. |
| Reversión | Disable primero, luego uninstall solo hash/catálogo/consumidores coincidentes | Scripts propuestos; no CASCADE ni fuentes financieras eliminadas. |

No completar una matriz con PASS heredado. Si falla un caso de seguridad, no abrir QA. Si falla un nuevo SQL/hash, registrar y detener sin versión silenciosa. Salida persistente debe dejar configuración cerrada a menos que la autorización de QA aún esté vigente; nunca habilitar clientes reales.
