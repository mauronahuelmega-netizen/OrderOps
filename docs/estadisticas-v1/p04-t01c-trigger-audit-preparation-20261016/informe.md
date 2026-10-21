# P04-T01C — preparación de auditoría focalizada de13 triggers

**Preparación: READY_FOR_SINGLE_READONLY_REVIEW. Estado operativo: P04-T01C = BLOCKED.** No SQL ejecutado, ningún comando Docker, ningún ensayo del runner anterior ni cambios de objetos/infraestructura.

## Hipótesis y diseño

Los13 cambios históricos consisten en el nombre de función decompilado moddatetime → extensions.moddatetime. Las migraciones de creación identificadas usan explícitamente extensions.moddatetime('updated_at'). PostgreSQL guarda la referencia de trigger en tgfoid; pg_get_triggerdef genera texto desde ese catálogo y puede calificar nombres según resolución. Se propone contrastar identidad y representación en tres frames A→B→A dentro del mismo snapshot, con search_path local **pg_catalog,public**, después **pg_catalog,public,extensions**, y retorno al primero.

La documentación define tgfoid como referencia a pg_proc y tgrelid a la tabla. El código PostgreSQL17 de la decompilación usa tgfoid al generar el nombre. Esto fundamenta la prueba, sin demostrar todavía el resultado en la instancia. [Catálogo pg_trigger17](https://www.postgresql.org/docs/17/catalog-pg-trigger.html), [implementación ruleutils17](https://raw.githubusercontent.com/postgres/postgres/REL_17_STABLE/src/backend/utils/adt/ruleutils.c).

## Entregables

- TRIGGER_MATRIX.md y targets.json: trece nombres/tablas/índices originales sin renumeración, atributos y fuentes.
- trigger-catalog.select.sql: unión de catálogo limitada a esos13, identidad/OIDs en texto, propiedades, membresía de extensión, visibilidad y decompilación.
- trigger-gate.select.sql: cardinalidad13, función común, argumentos y configuración esperada; se detiene ante cualquier condición inesperada.
- cluster-identity.select.sql: identidad de sesión y system_identifier::text exacto, después de pasar marcador/ledger.
- verification.proposed.psql y runner.proposed.mjs: transacción y ejecutor independiente, hashes verificados antes de Engine/SQL, límites15s/3s/90s, destino fijado y un intento máximo.
- HISTORICAL_COMPARABILITY.md: qué se sabe y qué no fue capturado.
- ACCEPTANCE_CRITERIA.md: aceptación actual por identidad más reproducción textual exacta; límites históricos y divergencias.
- EXECUTION_PROPOSAL.md: secuencia para otra autorización; no ejecutada.
- offline-results.json: **74 controles PASS_OFFLINE_ONLY**, con fixtures sintéticos en memoria. Modo review probado con tripwire que impide procesos/red. No se invocó modo real.
- evidence.json y preservation.json: inventario/SHA-256 y preservación de3.100 archivos previos, logs ignorados registrados y referencias privadas.

No se dispone de parser PostgreSQL offline en las dependencias examinadas; las comprobaciones SQL son estructurales/lexicales y de allowlist por hash, no compilación ni prueba de resolución de catálogo. No se instalaron herramientas. Se corrigió durante la preparación la construcción JSON para respetar el máximo de argumentos por función; las consultas finales y hashes son los del inventario, no borradores.

## Seguridad y alcance

El primer destino se verifica por ID/config/red/volúmenes en la pipe Docker local. El primer SELECT es el gate de marcador, usuario y base; no imprime token. Ledger124 es control de identidad adicional, no una nueva auditoría general. Solo se leen catálogos para13 triggers más marcador/ledger/control file. No se llama moddatetime ni ninguna RPC comercial. No datos de pedidos, Auth, perfiles ni finanzas.

Todos los SET son LOCAL dentro de READ ONLY. El search_path no se persiste. Los argumentos solo se muestran si son exactamente updated_at; prosrc/probin/config se representan mediante coincidencias y huellas, sin valores arbitrarios. Un resultado validado conserva los tres textos completos; un resultado inesperado no se guarda como salida bruta. El proceso no reintenta ni hace consultas de diagnóstico después de error. No se adapta una referencia para obtener PASS.

## Conclusión y próximo permiso

La prueba puede establecer que **en el snapshot actual** los mismos OIDs/atributos producen ambos textos bajo los paths controlados. No puede probar continuidad histórica de OIDs/propiedades nunca registrados. Incluso un resultado satisfactorio deja abiertos Kong/atributos, recuperabilidad por restauración y loopback/ventana/build operativo.

Se solicita autorización humana **nueva y específica para una única ejecución READ ONLY** del nuevo runner, template y artifact-pins.json con los hashes de evidence.json. No ejecutar hasta esa autorización. No corregir triggers ni iniciar otra etapa.
