# Limitaciones efectivas

- No estabilidad demostrada: 100 pedidos D1 p95=476.775ms y606.202ms en las tandas completas. Tercera incompleta:18D1/17AB/18original, máximo original9570.334ms activó gate5s. Cuantiles del lote incompleto son exploratorios; no sirven para declarar objetivo niPASS.
- 200/500/1000/5000 omitidos por gate; concurrencia/MVCC financiero/reapertura/recompletado de F4A no ejecutados después del fallo serial. Script preparado, no ejecutarlo por inercia. F3C no cuenta como nueva ejecución.
- Tres conexiones independientes por volumen no significan caché fría: no reiniciar, vaciar cachés, analizar ni cambiar configuración persistente. El orden50/100 se contrabalanceó; asOf fijo y JSON igual en cada lectura eliminan deriva temporal de la cohorte.
- Método normal realSELECT y timing psql: incluye ejecución, serialización y wire localUnix. F3C midió ExecutionTime deEXPLAIN; no comparar esos números como si fueran la misma instrumentación. EXPLAIN/perfil de F4A están separados de cuantiles normales.
- Observador de5s añade consultas de actividad/proc/Docker, idéntica política para lectores. CPU/raw container149.62% equivale37.405% de4CPUdelmotor; no atribuir a un operador concreto. VmHWM incluye shared mappings. No Windows-host profiling ni timeline exacto por query.
- Sin spills en planes recogidos ni lock-waits en snapshots; no existe plan del outlier9.57s ni prueba de ausencia de contención entre muestras. No demostrar causa de dispersión solo por coincidencia temporal de CPU.
- Perfil acotadoN50: no extrapolar dominancia o costos a100/5000. Core/RLS/composición/rankings son evidencias de costo residual; materializaciónD1 sigue funcionando.
- HTTP público con datos comprometidos vacíos, porque los fixtures se mantienen uncommitted yrollback. Harness privadoD1 es cliente local que verifica identidad porAuthHTTP y ejecutaSQL autenticado, sin endpointD1, no medición de una rutaHTTPD1.
- JWTstateless con claveES256 exclusiva: firma/expiración/roles verificados sin crear sesiones ni cambiarAuthusers. No login/cookieSSR, refresh ni revocación de una sesiónAuthemitida. No service role de aplicación.
- Primera ejecución normalN50 con20muestras se conserva en initial-explain-parser-failure.json: el fallo fueparser deEXPLAIN posterior, noSQL. Corregido en archivo propio; nuevas tandas fijan asOf. No mezclar esa prueba con las tandas repetidas ni descartar sus valores. Primer intento del harnessHTTP falló al compilar top-level await en.tsCJS; se cambió extensión.mts antes de cualquier request.
- Sin SLA ni aprobación de lanzamiento/adopción. Ninguna función/índice/RLS/grant/migración modificados.

