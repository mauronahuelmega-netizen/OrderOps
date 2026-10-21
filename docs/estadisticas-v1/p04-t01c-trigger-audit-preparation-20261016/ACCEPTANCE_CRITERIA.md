# Criterios objetivos de la futura ejecución

## Precondiciones obligatorias

Hashes nuevos exactos y fuentes previas intactas; worktree/rama/HEAD previstos; cinco IDs/configuraciones y red/dos volúmenes originales exclusivos; DB/Kong saludables; DB56322/API56321 atribuidos al mismo entorno. El wildcard conocido no se presenta como loopback resuelto: este ensayo solo verifica catálogo. Cambiar un recurso/pin o tener otro consumidor impide el ensayo.

Marcador privado exacto y una fila, base/usuario postgres, ledger124. REPEATABLE READ READ ONLY,15s por sentencia,3s lock,90s proceso SQL y2MiB salida. Un solo intento: archivo intent creado con wx/fsync antes de Engine. No flags retry/resume, no overwrite de intent.

## Resultado satisfactorio limitado

1. Trece filas exactamente en cada frame, sin duplicados, en los índices originales; esquema/tabla/nombre exactos.
2. Cada trigger tiene tgfoid=pg_proc.oid=OID de extensions.moddatetime(), misma función común a los13. Tabla/trigger/función/extension/lenguaje OIDs son strings exactos, no números JSON.
3. Configuración esperada actual: tablas ordinarias public; BEFORE UPDATE ROW (tgtype19), enabledO; no interno, partición-clon ni constraint; no deferrable/initially-deferred; tgnargs1, tgargs updated_at+NUL y sin columnas UPDATE OF, WHEN ni transition tables. Son expectativas de diseño/creación, no valores históricos medidos.
4. Función cero argumentos SQL, retorno trigger, LANGUAGE c, SECURITY INVOKER, no set/strict/leakproof, volatilidad v, parallel u, proconfig NULL; implementación moddatetime en $libdir/moddatetime y una sola membresía de extensión moddatetime en extensions. Cualquier variación se reporta como configuración inesperada, sin afirmar automáticamente cuándo cambió.
5. Todas las propiedades capturadas (incluyendo owner/ACL/huellas de función/extensión) son iguales entre A/B/A. Se mantienen los tres frames originales; se compara una lista explícita de propiedades de catálogo, no se borra el campo textual de una comparación para aparentar igualdad.
6. A y A2: path sin extensions, función no visible/no resuelta sin esquema, definición **literalmente** igual al texto observado anterior. B: path con extensions, resolución sin esquema al mismo OID, visible y definición **literalmente** igual a la referencia histórica. Sin regex de sustitución, normalización de SQL ni reordenamiento de arrays.
7. A2 completo idéntico a A y retorno explícito al path inicial; ROLLBACK final observado, sin warnings/SQLSTATE/resultados inesperados. system_identifier solo string decimal válido, no comparado contra número previo impreciso.

Conclusión permitida: **CURRENT_REPRESENTATION_CONFIRMED_WITH_HISTORICAL_LIMITATIONS**. Confirma explicación de la diferencia textual en el snapshot actual. No equivale a demostrar que ningún trigger cambió durante toda la historia, ni a PASS de P04-T01C, publicación o autorización loopback.

## Divergencia o resultado inesperado

OID/resolución distinta, sombra en public, cardinalidad diferente, propiedades cambiantes, función/argumentos inesperados, texto no reproducido o A2 distinto = BLOCKED. Un gate SQL falso provoca ROLLBACK y salida antes del siguiente frame. Una falla de validación después de la transacción no lanza consultas adicionales. No clasificar un cambio como «solo representación» si cualquiera de esas condiciones falla.

Un error/time-out/aviso/salida malformada produce BLOCKED_UNEXPECTED_NO_RETRY. Solo se persisten etapa/código/SQLSTATE/huella de salida no validada, nunca stderr bruto, token, argumentos desconocidos o valores de configuración. No se confirma ROLLBACK si falta evidencia; cierre de conexión no sustituye marcador observado. No ampliar límites ni ejecutar una segunda versión sin nueva aprobación.
