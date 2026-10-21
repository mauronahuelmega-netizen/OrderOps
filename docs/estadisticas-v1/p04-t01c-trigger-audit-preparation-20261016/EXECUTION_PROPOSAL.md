# Propuesta de ejecución posterior — NO EJECUTADA

Requiere autorización humana separada para **una única ejecución** del nuevo runner y los hashes de evidence.json. La preparación actual solo permite --review y pruebas offline. No se invocó --execute-readonly, no se consultó Docker y no se inició psql en esta tarea.

## Secuencia revisable

1. Revisar runner.proposed.mjs, validation.mjs, artifact-pins.json y sus20 archivos fijados. El hash del manifest está compilado en el runner; modificar SQL, targets, validación, preflight o fuentes invalida la revisión. No se admite SQL/host/container/search_path arbitrario desde CLI, URL o env.
2. --review verifica hashes de todos los archivos; no usa procesos/red. --execute-readonly admite solo ese argumento, exige nuevo permiso humano y crea intent exclusivo. Un intento fallido también consume intent y necesita revisión humana; no borrarlo para reintentar.
3. Preflight: Git y manifest privado contra hash histórico; config/signing keys; pipe local npipe:////./pipe/docker_engine fija; cinco IDs originales; Config/HostConfig e imágenes; red/volúmenes/exclusividad; bindings actuales. No acceso a servicios de proyectos ajenos. El adaptador nativo de recreación no se importa ni habilita.
4. Una invocación docker exec -i al ID DB original, psql -X -U postgres -d postgres por socket local. SQL de plantilla íntegra con token64hex en stdin desde memoria, sin archivo expandido ni argumento secreto. Proceso90s; sin aumentar recursos.
5. BEGIN RR READ ONLY y ajustes LOCAL. Gate de marcador antes de catálogo, gate ledger124, captura exacta de system_identifier. Los SELECT enfocados leen pg_trigger/pg_class/pg_namespace/pg_proc/pg_language/pg_depend/pg_extension únicamente para el conjunto fijo. No llaman moddatetime, helpers comerciales ni RPC.
6. En A/B/A, gate de13 identidades y propiedades antes de emitir cada frame; SQL sin filas de negocio. Cambio de path solo local, llamadas builtin siempre calificadas con pg_catalog; incluir extensions no ejecuta funciones de ese esquema. Resolución de nombre se usa como metadato, no invocación.
7. ROLLBACK explícito en todas las ramas previstas. En éxito se emite ROLLBACK_COMPLETED y se validan los cuatro bloques JSON. Sin salida extra, duplicados, tipos imprecisos ni divergencias. Guardar ejecución nueva dentro de este expediente, nunca sobre el runner anterior o referencias.
8. Ante error, no reintentar, no consultar para depurar ni corregir objetos. Detener y entregar evidencia sanitizada. Si el cliente pierde respuesta, no asegurar cierre de transacción observado; la decisión posterior corresponde al propietario.

```powershell
# Ejecutado solo offline durante esta preparación:
node docs/estadisticas-v1/p04-t01c-trigger-audit-preparation-20261016/runner.proposed.mjs --review

# NO EJECUTADO. Necesita nueva autorización sobre hashes exactos:
node docs/estadisticas-v1/p04-t01c-trigger-audit-preparation-20261016/runner.proposed.mjs --execute-readonly
```

## Auditoría estática y riesgos

El conjunto VALUES conserva los13 índices/nombres/tablas de trigger-differences.json. Joins LEFT preservan ausencias como error; los nombres schema/tabla y trigger son únicos por catálogo. La membresía de extensión se agrega lateralmente antes de unir, evitando multiplicación de filas. Gates exigen13 OIDs únicos y una sola función. No se hace scan de filas de esas tablas.

Las funciones de JSON se dividieron en dos constructores de menos de100 argumentos cada uno; controles offline comprueban pares, paréntesis y ausencia de coma final. Validación por hash exacto es la allowlist de SQL, no una expresión regular que autorice consultas nuevas. El chequeo lexical complementario no es un parser PostgreSQL y no prueba compilación. Columnas y mecanismo se contrastaron con fuentes primarias17, pero resolución real requiere este ensayo autorizado.

El runner no persiste código/argumentos/config inesperados; el argumento conocido aparece en hex solo al coincidir exactamente. Source/bin/config de la función se contrastan con valores esperados y hashes, sin copiar secretos. Proyección de definición de trigger solo con función/argumento/WHEN seguros. Ningún body de función ni fila financiera se devuelve. Los errores del proceso nunca se imprimen íntegros.

El intento futuro todavía usa Config/HostConfig originales wildcard; una intervención o cambio de IDs obliga nueva revisión. No se rediseñó recreación, red ni firewall. Aun si el diagnóstico actual es satisfactorio, siguen pendientes preservación de atributos Kong, restauración independiente y posterior autorización de aislamiento. No T02 ni instalación Productos.
