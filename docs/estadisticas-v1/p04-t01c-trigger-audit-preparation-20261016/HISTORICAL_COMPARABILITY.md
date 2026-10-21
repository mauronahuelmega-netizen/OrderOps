# Comparabilidad histórica

Se preservan trigger-differences.json, extra-after.json, la plantilla anterior y sql-readonly-observed.json. Sus hashes y los de las seis migraciones fuente están fijados en historical-sources.json y artifact-pins.json. No se ejecutó de nuevo el runner anterior.

| Fuente | Captura legítimamente comparable | Información que no aporta |
|---|---|---|
|extra-after.json de P04-T01C|Array52, tabla/nombre/texto,13 posiciones concretas sin calificación de función|OID de tabla/trigger/función, tgfoid, enabled/config de moddatetime, path original efectivo|
|trigger-differences.json|Las13 parejas exactas y sus índices18…38 preservados|No es una captura adicional de catálogo; deriva de los dos JSON|
|sql-readonly-observed.json de ejecución única|Los mismos13 textos con extensions; READ ONLY, repeatable read y rollback observados; ledger124|No captura tgfoid ni pg_proc de moddatetime. El número JSON system_identifier perdió precisión al parsearse.|
|verification.proposed.psql anterior|Path explícito pg_catalog,public usado en esa ejecución|No demuestra cuál era el path de la referencia inicial|
|Seis migraciones históricas|CREATE de esos nombres en tablas public con extensions.moddatetime('updated_at'), BEFORE UPDATE FOR EACH ROW|No registra los OIDs asignados al instalar ni prueba que nunca existió ALTER posterior|
|Backup-inventory.json previo|TOC y procedencia del archivo, no funciones ejecutadas ahora|No contiene los datos de pg_trigger/pg_proc/control file necesarios para una igualdad histórica de OIDs|

El nuevo ensayo usará índices originales y comparación literal: A debe reproducir observed.def; B, reference.def; A2 debe ser idéntico a A. Esa reproducción es un experimento sobre la representación actual, no una sustitución ni corrección de las capturas anteriores.

También se revisó p04-t01c-post-recovery-20261016/extra-observed.json: conserva esas mismas13 definiciones sin esquema. Refuerza la continuidad de la representación registrada después de la recuperación, pero tampoco capturó tgfoid ni el path efectivo. Su contenido permanece fijado por el baseline de3.100 archivos; no se reescribió.

## OIDs y autoridad

tgfoid unido por igualdad a pg_proc.oid identifica exactamente la función vinculada **en ese catálogo/snapshot**; no depende de buscar por nombre ambiguo. La resolución explícita extensions.moddatetime() y membresía pg_depend→pg_extension son contrastes adicionales. OIDs de trigger, tabla, función, lenguaje y extensión se devuelven como texto decimal y se exigen estables entre frames.

Un OID solo no prueba inmutabilidad de código: CREATE OR REPLACE puede conservarlo. Por eso se capturan propiedades/huellas de implementación/definición, dueño, ACL y configuración, comparadas entre frames. No existiendo esos valores históricos de moddatetime, la continuidad histórica sigue **no demostrada** aunque todo coincida actualmente. No se convierte la ausencia de referencia en igualdad.

## system_identifier sin redondeo

Se propone exclusivamente pg_control_system().system_identifier::text dentro de la transacción ya autorizable, sin procesos adicionales ni lectura de archivos físicos. Se valida como string decimal mediante BigInt; nunca Number. Es captura inicial exacta, no «reparación» de la cifra anterior. No se compara contra la representación numérica redondeada ni se actualizan pins históricos.

Esta información identifica el clúster, no el proyecto por sí sola; marcador privado y destino Docker siguen siendo obligatorios. La función de control es introspección, no un writer. [Funciones de control PostgreSQL17](https://www.postgresql.org/docs/17/functions-info.html#FUNCTIONS-CONTROLDATA-TABLE).

## Riesgos que no elimina el experimento

No prueba ausencia de actores concurrentes, restaurabilidad, bytes de la biblioteca compartida en disco, historia de reemplazos, efectos de ejecución del trigger ni permisos funcionales bajo authenticated. No se ejecuta ningún trigger para comprobarlo. RR y los frames repetidos permiten detectar discrepancias del catálogo observado, pero no se promete congelar binarios externos ni toda actividad administrativa de otro actor. Una diferencia o aviso requiere HALT y revisión, no reparación.
