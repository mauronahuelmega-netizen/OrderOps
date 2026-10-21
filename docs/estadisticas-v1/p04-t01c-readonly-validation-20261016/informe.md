# P04-T01C — ejecución única SQL READ ONLY

**Veredicto: BLOCKED.** La consulta terminó con ROLLBACK observado y sin errores SQLSTATE; la comparación estricta falló en el texto de13 triggers. No hubo reintento, consulta adicional, corrección del runner ni modificación de referencias. P04-T01C sigue BLOCKED, sin autorización Docker o QA.

## 1. Autorización, destino y ejecución

Se verificaron exactamente los tres hashes autorizados antes de lanzar el proceso:

| Artefacto | SHA-256 |
|---|---|
|readonly-verification.proposed.mjs|76c4653891367e1c55d3d3b51af841f3ae0a5b980490ee5912e4e7ac65588dad|
|verification.proposed.psql|485cf660d8230a868b4051aecce8418da9cc30d799aaec6a001f5eb0e4309a15|
|readonly-query-manifest.json|85fefde4aa8256a4f42bfa38b5cd0a8b8819b8919bc77f8643ed3823adcfd294|

Worktree OrderOps-Estadisticas, rama codex/estadisticas-v1, HEAD923300265323d411c5c91b7935472d5423d228d2. Los3.086 archivos previos se inventariaron antes de ejecutar. El wrapper propio registra intención y rechaza una segunda invocación; invocó **una vez** el runner aprobado, sin cambiar su código, consultas o límites. Evidencia: execution-envelope.json y authorization-pins.json.

El preflight interno completó las comprobaciones de manifest/config/signing keys, cinco IDs y hashes Config/HostConfig, salud exigible, red y dos volúmenes originales/exclusivos. Comparó metadata global únicamente para detectar consumidores ajenos de esos recursos; no conectó a servicios de otros proyectos. Todas esas aserciones preceden a psql. El runner alcanzó psql y produjo sus cinco bloques, por lo que esos gates se superaron; no se guardó un inspect bruto con secretos.

Destino real: DB **592f44984962a26c6552ccb02937d56385a8db008eb8e7a27e8be2d932f77bd1**, proyecto orderops-statistics-v1-test-74718de66a41, red dfbf3cf0bf455393fd0c01a0f61438fd19fd18dfe5f4107c2bafc32589c476af y los volúmenes supabase_db_…/supabase_storage_… originales. API56321 y DB56322 se contrastaron como bindings Docker; siguen wildcard, sin mitigación. psql accedió por **socket Unix dentro del ID DB**, no mediante una URL ni otra base: database postgres, current_user postgres, PostgreSQL17.6. serverAddress/serverPort NULL son propios de esa conexión, no puertos faltantes. No Auth HTTP ni RPC de aplicación.

## 2. Marcador, ledger y transacción

| Control | Resultado |
|---|---|
|Marcador privado, base y usuario|PASS por flujo del gate aprobado: exactamente una fila y token coincidente antes de los bloques; el token y su sentencia expandida no se persistieron. No se inventa un booleano emitido por el runner: la evidencia es que el script superó su rama de rechazo y devolvió los cinco bloques.|
|Ledger count|124; gate superado.|
|Ledger completo|PASS de igualdad estricta de versiones y hashes de statements contra referencia.|
|Transacción|transaction_read_only=on; transaction_isolation=repeatable read.|
|Límites|Sin cambios:15s/sentencia,3s/lock,90s/proceso psql.|
|Proceso SQL|exitCode0, clientError NULL, sqlStates vacío.|
|ROLLBACK|**Confirmado en la salida del script aprobado:** rollbackObserved=true y marcador ROLLBACK_COMPLETED después del ROLLBACK explícito. No se abrió una segunda conexión para comprobarlo.|
|Resultado del runner Node|exitCode1, BLOCKED_DIFFERENCE_OR_EXECUTION_ERROR por comparación; diferente del exitCode0 del proceso SQL.|

## 3. Comparación con referencias inmutables

Resultado original sanitizado, sin editar: ../p04-t01c-focused-preflight-20261016/sql-readonly-observed.json. El runner certificó catalogue y data antes de detener su comparación en extra.triggers. Posteriormente se compararon **offline**, sin otra consulta, todos los campos ya capturados:34 de35 iguales, uno diferente. Esa revisión no convierte el resultado del runner en PASS.

| Área | Resultado |
|---|---|
|22 funciones estadísticas: firmas/defaults/definiciones/SECURITY/config/ACL|Iguales a referencia. RPC pública original conservada; A+B/D1 privados sin adopción y sin nuevas funciones C/Productos.|
|79 políticas públicas,153 índices,47 constraints inspeccionadas|Iguales a referencia.|
|Conteos y profileFingerprint de catálogo|Iguales. Pedidos/items/finanzas/audit/sesiones/snapshots/completions todos0.|
|15 huellas de tablas públicas|Iguales.2businesses,12profiles,2business_settings y1business_statistics_state; tablas de pedidos/composición/finanzas/productos/categorías vacías. No son pruebas funcionales no vacías.|
|Settings/state, productos/categorías/stock del bloque extra|Iguales.|
|Triggers extra|52 antes/ahora,13 diferencias textuales; BLOCKED.|
|Privilegios efectivos/RLS incluidos en bloque privileges|Campos comparados offline iguales: schemaUsage, permiso Summary, flags de roles y sourceRls, ausencia de las tres funciones Productos, helper QA y configuración QA. El runner no alcanzó esta comparación por su fallo anterior; se distingue de la comparación offline.|
|Flags RLS/forceRLS adicionales|Registrados para16 relaciones en metadata, como observación nueva. La vista effective_facts no es una tabla con flag RLS; no se interpreta eso como cambio o bypass nuevo.|

Son inspecciones ejecutadas como postgres, no ensayos de acceso con ROLE authenticated. Igualdad de políticas/grants no demuestra nuevamente su ejecución bajo cada rol. Los fingerprints MD5 heredados sirven para comparación, no autenticación. Contadores acumulativos como deadlocks no se usaron para ocultar diferencias de catálogo.

## 4. Diferencia exacta y límites del diagnóstico

En13 de52 posiciones, tabla/nombre de trigger coinciden; el texto histórico contiene:

```text
EXECUTE FUNCTION moddatetime('updated_at')
```

El texto observado contiene:

```text
EXECUTE FUNCTION extensions.moddatetime('updated_at')
```

Tablas: business_settings, customization_groups, customization_options, customization_group_assignments, product_customization_overrides, upsell_groups, upsell_group_items, order_financials, finance_accounts, finance_categories, finance_funds, business_finance_settings y finance_transactions. Las diferencias completas, con índices originales de arrays, están en trigger-differences.json. No se ordenaron ni normalizaron arrays/textos para forzar igualdad.

**Hipótesis concreta:** el template aprobado fija search_path=pg_catalog,public, excluyendo extensions; esto es compatible con que pg_get_triggerdef decompile el nombre ahora calificado. Es una explicación de representación plausible, **no prueba de igualdad de tgfoid ni autorización para aceptar la diferencia**. El SELECT aprobado no capturó tgfoid/schema/identidad de la función de cada trigger y la configuración histórica exacta de esa decompilación no está registrada aquí. No se ha demostrado ni cambio real de triggers ni equivalencia semántica completa. No se ejecutó DDL para explicarlo o corregirlo.

Limitación adicional del runner inmutable: system_identifier se devolvió como número JSON grande y JSON.parse no preserva su exactitud en un entero JavaScript inseguro. Se conserva el artefacto sin corregirlo, pero **no usar ese valor como identificador exacto de clúster ni nuevo pin**. La identidad autorizada se apoyó en contenedor/pins y marcador. Cualquier captura futura exacta como texto requiere revisión y permiso nuevos, no una repetición silenciosa.

## 5. Bloqueos y próxima decisión humana

| Bloqueo | Estado después de esta única ejecución |
|---|---|
|Identidad lógica/ledger/conteos/huellas|Marcador y124 entradas confirmados; huellas/catálogo de alcance inspeccionado coinciden, salvo triggers extra. La verificación global sigue sin PASS.|
|13 triggers / equivalencia estricta|Abierto: necesita decisión sobre una verificación adicional focalizada.|
|Atributos ocultos Kong y representación completa|Abierto, sin nueva lectura o cambio en esta tarea.|
|Recuperabilidad por restauración independiente|Abierto; respaldo íntegro/TOC conocido no equivale a restauración.|
|Loopback/LAN, wire/replay y autorización de sustitución|Abiertos; no se modificaron recursos ni se habilitó el adaptador.|

**Solicitar nueva decisión humana:** aprobar primero el diseño de una comprobación READ ONLY focalizada de identidad de los13 triggers (tgfoid/schema/función y representación bajo search_path explícito), sin modificar objetos ni referencias. Su ejecución posterior requerirá aprobación del conjunto exacto. Si se requiere volver a capturar system_identifier, hacerlo como texto bajo esa nueva revisión. No repetir el runner actual ni cambiar search_path/consultas para obtener PASS dentro de esta autorización consumida.

No hubo DDL/DML, seeds, restauración, instalación QA, cambios de grants/RLS, nuevos PostgreSQL, lifecycle Docker, cambios de red/firewall, commits ni T02. Los informes/checkpoints históricos permanecen intactos. Esta tarea termina con **BLOCKED** y sin nuevas consultas.
