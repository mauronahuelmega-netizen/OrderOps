# Matriz de bloqueos y siguiente permiso

**P04-T01C = BLOCKED. Sin intervención, sustitución de IDs, ensayo QA, instalación o T02.**

| Bloqueo previo | Resultado focalizado | Estado |
|---|---|---|
|¿La discrepancia es un buffer/FFI defectuoso?|Tres vías y buffer fijo reproducen23/46→0; OverlayFS tiene filtrado de nombres documentado. Se acota al límite kernel/visibilidad, sin identificar cada nombre oculto.|Diagnóstico avanzado; hipótesis de buffer insuficiente descartada para estos casos.|
|Representación de todos los atributos necesarios|No hay acceso demostrado a todos los nombres; mecanismo anterior no representa metadata extendida arbitraria. No se cambió para tolerar la diferencia.|PENDIENTE, bloquea parada.|
|Existencia/integridad del respaldo externo|Archivo real fuera del contenedor, PGDMP,1.436.037bytes, hash coincide histórico y copia DB actual.|RESUELTO a nivel de archivo.|
|Inventario/completitud lógica|TOC legible1.840entradas, objetos esperados; sin verificar todos los payloads, filas, roles/globales ni archivos Storage.|PARCIAL.|
|Recuperabilidad independiente|Ninguna restauración; procedimiento propuesto en VM separada, dependencias/input hashes pendientes.|PENDIENTE.|
|Identidad lógica/ledger/catálogo/grants/RLS/datos actuales|Propuesta executable en READ ONLY+ROLLBACK con gates preparada y revisada offline. Sin SQL ejecutado.|PENDIENTE de autorización.|
|Loopback efectivo|Sin cambios: referencia reciente wildcard IPv4/IPv6 y exposición LAN API confirmada por propietario.|PENDIENTE; no mitigado.|
|Compatibilidad del ejecutor/parada/replay|No se habilitó ni se rediseñó recreación. Barrera y referencias anteriores preservadas.|PENDIENTE de etapas futuras; no se autoriza por estos resultados.|

## Recomendación concreta

**Siguiente permiso humano inmediato:** ejecutar exclusivamente la propuesta SQL READ ONLY fijada por hashes en evidence.json, con destino original aislado, marcador/ledger gates y ROLLBACK. Permitirá comprobar correspondencia actual y fijar base lógica para una prueba de recuperación; no resolverá por sí sola atributos ni exposición LAN.

En autorización separada, revisar el alcance mínimo de una inspección daemon-side de atributos restringida a las cinco rutas/layer original, sin modificar privilegios ni tocar capas ajenas. Mientras no pueda acotarse, mantener la limitación y no preparar un nuevo ejecutor de recreación.

Después de conocer catálogo/dependencias, autorizar si corresponde ensayo de restauración en VM independiente, con inputs/hashes exactos y sin usar volúmenes originales. No asumir recuperabilidad por pg_restore --list. Solo tras resolver esas precondiciones se vuelve a revisar una ventana de intervención y un build explícito. Cualquier permiso posterior debe diferenciar lectura SQL, recuperación, intervención y QA.

No se solicita ahora autorización para parar o sustituir contenedores. Esta entrega se detiene en BLOCKED. No se alteraron documentos históricos ni el alcance V1 de dos pestañas.
