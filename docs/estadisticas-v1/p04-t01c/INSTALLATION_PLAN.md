# P04-T01C — plan de instalación QA controlada

Veredicto propuesto: **READY_FOR_QA_INSTALL**, exclusivamente como paquete de revisión para instalar **cerrado**, con los gates siguientes. No es autorización de ejecución, activación QA, publicación comercial ni T02.

## Estado comprobado

Worktree OrderOps-Estadisticas, rama codex/estadisticas-v1, HEAD `923300265323d411c5c91b7935472d5423d228d2`. Identidad live `orderops-statistics-v1-test-74718de66a41`, API 127.0.0.1:56321, DB 127.0.0.1:56322; cinco contenedores con salud verificada, red y dos volúmenes exclusivos; ledger 124 y hashes aprobados intactos. Catálogo, ACL, políticas y originales coinciden con referencia aprobada. Tres funciones de Productos ausentes; auxiliar/configuración QA propuestos también ausentes. No existen grants efectivos de Productos para auditar como instalados: la ACL anterior fue transitoria y ya fue revertida. `privileges-live.json` diferencia ambos estados.

Los bindings reales de Docker son **0.0.0.0 y ::** para 56321/56322. Que el cliente use 127.0.0.1 no prueba exclusividad de acceso de red desde LAN. No se modificó red, firewall ni contenedores. Antes de ejecución persistente debe revisarse esa exposición; antes de activar QA o entregar credenciales debe demostrarse restricción efectiva al ámbito QA mediante firewall/red o proponerse un cambio separado. No se da por comprobada esa restricción externa.

## Política recomendada

Preservar las tres funciones financieras del candidato aprobado, con un único guard adicional en el lector privado. Wrapper público delega al lector; llamada privada directa queda igualmente cubierta. Función métrica pura sigue calculando solo sus argumentos, sin autoridad comercial.

Nuevo control **solo QA**:

- Tabla propia `public.statistics_products_qa_access`: metadatos de publicación, no datos de ventas ni una sexta fuente analítica. PK usuario/negocio, default enabled=false, expiración obligatoria al habilitar, solo seis pares sintéticos fijados por CHECK. FK independientes a profiles.id y businesses.id con cascade de configuración; no FK compuesta que bloquee cambios de negocio del perfil.
- RLS SELECT únicamente sobre fila del usuario autenticado con negocio y rol original autorizados. Ningún INSERT/UPDATE/DELETE para authenticated.
- `private.statistics_products_qa_can_query(uuid)`, invoker/STABLE, ruta fija, verifica identidad real del perfil, negocio, par permitido, enabled y caducidad contra statement_timestamp actual. El cursor/asOf no puede retroceder el reloj de publicación.
- Reader verifica primero rol original owner/manager/admin y negocio; después gate QA; falla con 42501 STATISTICS_PRODUCTS_NOT_PUBLISHED cuando cerrado. Role operator/viewer/super_admin/NULL/desconocido conserva rechazo anterior STATISTICS_ACCESS_DENIED.
- Instalar deja la tabla **vacía**, sin usuarios habilitados. Activar esos seis usuarios durante 30 minutos es otro archivo/acto explícito. No se permite añadir clientes reales: el CHECK fija pares exactos, no nombres ni rol cliente ni business_id de JSON.

Se conserva el gate HTTP G1 default-closed, releasePending y navegación oculta. No existe nueva ruta de Productos. El futuro backend debe usar SSR/getUser/perfil original y período validado; no service role. Gate de HTTP y gate SQL son independientes: un QA allowlisted habilitado puede invocar RPC directamente. Esta política no promete acceso exclusivo desde el backend usando el mismo JWT; limita quién puede leer también por Supabase.

Alternativas descartadas para este paso: grant solo al wrapper y revocar reader/metric rompe SECURITY INVOKER; ocultar wrapper con reader sin gate protege REST pero no llamadas SQL privadas; role backend nuevo/credencial SQL o JWT propio cambia transporte/gestión de identidades e implica autorización adicional. La tabla de control pequeña permite TTL, cierre inmediato y pruebas sin modificar contratos financieros ni políticas compartidas.

## Artefactos y alcance del diff

- `qa-install.proposed.sql`: instalador QA aditivo, fuera del directorio de migraciones automáticas. Cuatro funciones (tres Products + gate), una tabla de control y su propia RLS/PK/FK. No altera objetos existentes ni append al ledger de release; este permanece 124. Fuente y cambios registrados en qa-proposal-manifest.json.
- `candidate-products-qa-gated.proposed.sql` / `qa-reader-gate.diff`: muestra el único guard añadido al candidato `57395a7920d95cf63c1b67fb8191e40272a26aeb445a4abe7bec4d822b99c2c1`, conservado inmutable. El instalador tiene otro hash: necesita aprobación expresa, el hash del candidato financiero no autoriza este derivado.
- `qa-enable-synthetic.proposed.sql`: habilitación separada, pares fijos y 30 minutos, nunca parte automática de instalación.
- `qa-disable.proposed.sql`: cierra la configuración sin cambiar finanzas ni firmas.
- `qa-uninstall.proposed.sql`: elimina únicamente objetos QA propios sin CASCADE, después de verificar ownership/definiciones y dependencias; no restaura ni reemplaza Resumen, A+B/D1/C o fuentes.

## Secuencia segura posterior — no ejecutada

1. Revisar/autorizar hash exacto del instalador y política nueva (tabla/helper/guard), alcance del ensayo y decisión de persistir cerrado. La habilitación y Auth HTTP necesitan autorización adicional explícita. Revisar bindings/red antes de escritura persistente; ninguna reparación automática.
2. Preflight adversarial + live inmediatamente antes: hashes, proyecto/marker, recursos/puertos/exclusividad, ledger/base, fuentes/ACL/políticas originales, ausencia de los cinco objetos nuevos y firma, signing keys exclusivas. Cualquier discrepancia detiene sin escritura.
3. **Ensayo obligatorio en transacción con ROLLBACK**, excluyendo explícitamente BEGIN/COMMIT del instalador; compilar gate nuevo, tabla/política y funciones. Probar cierre sin configuración y disabled, pares ajenos, expiry NULL/pasada, roles/biz/direct helper, guard con asOf anterior, prohibición de escribir la tabla, y 91 regresiones financieras/temporales con configuración sintética transaccional. Source restore/diff y 54 respuestas previas validan núcleo, no certifican el gate/RLS nuevos.
4. Si falla el ensayo, rollback y detener: no reparar/adaptar silenciosamente otro hash. Si pasa y persiste la autorización de instalación, ejecutar **solo** el archivo aprobado en una transacción con límites 15 s/3 s. No `supabase migration up/reset`, no archivos pendientes, no baseline histórico modificado. COMMIT solo estaría permitido por futura autorización persistente; hoy no se ejecutó ninguno.
5. Verificar catálogo y nueva ACL, tabla vacía/default cerrado, SQL-05/07 intactos, RPC pública original/datos/ledger sin cambio. NOTIFY reload schema de PostgREST está en el instalador; requiere verificación de cache/HTTP, no reinicio de servicio. Registrar checkpoint `qa-installed-evidence.json`, objetos exactos, hashes, referencia de esquema QA y autorización/modalidad de tests.
6. Actualizar el **verificador propio** para aceptar exactamente esos cuatro objetos de función y relación/política QA, manteniendo chequeos completos de originales. No relajar ni sobreescribir los verificadores anteriores que esperan ausencia. Preparado `qa-installed-live.verify.mjs`; compara identidad, bodies/ACL y originales.

El checkpoint nuevo debe contener result=PASS, projectId exacto, installSha256 autorizado, policyMode=closed/enabled, httpTestsAuthorized explícito y qaConfigSchemaFingerprint. El fingerprint de owner/ACL/columnas/constraints/RLS se obtiene y revisa tras el ensayo aprobado; no se rellena por confiar en un catálogo desconocido. Cambiar filas enabled/expiry no cambia ese fingerprint. No se creó un checkpoint de instalación falso en esta preparación.
7. Ejecutar primero HTTP/Auth real en modo cerrado, con usuarios sintéticos y limpieza de sesiones propias; todos los roles no obtienen Productos. Después, solo si se autoriza activación, habilitar seis pares por 30 minutos, probar permitidos/denegados/tenants/refresh/config write denial. Real expiry, sesión faltante y Next ruta deben declararse por separado; no crear ruta alternativa pública.
8. Cerrar QA nuevamente y verificar denegación inmediata; JWT access puede seguir válido hasta exp, pero gate SQL cerrado niega datos. Registrar evidencia antes/después y conservar datos/archivos originales.

## Reversión y dependencias

Primera reversión: cerrar configuración QA, conservar funciones para diagnóstico; no hay pérdida de ventas ni snapshot. Segunda, solo bajo permiso y sin consumidores nuevos: verificar marcador de entorno, hashes de catálogo instalado, propietarios, ACL, dependencias/consumidores y exportar configuración; eliminar wrapper, reader, metric, gate y tabla QA, sin CASCADE. Source de configuración guardada no incluye credenciales. Si cualquier objeto cambió, tiene otro consumidor o pertenece a una integración posterior, detener y preparar reversión forward compatible, no ejecutar uninstall genérico.

Ownership comment del uninstall es un guard adicional, **no reemplaza** el cotejo de hashes de catálogo por el verificador y operador. Funciones con cuerpos SQL/PLpgSQL string no siempre expresan todas sus referencias en pg_depend; buscar usos de código/RPC además de depender de DROP sin CASCADE.

Es un instalador exclusivo QA sin versión de release ni nueva entrada automática al ledger. Una migración integrable con Cursor/producción requiere revisión separada de versiones, contratos y publicación; no se asigna por inferencia ni se usa el QA installer como release.

## Entrada a T02

T02 sigue bloqueado por autorización, no iniciado. Requerirá instalación QA aprobada y comprobada, gate cerrado/QA activación acotada explícita, pruebas nuevas de seguridad PASS y permiso para shell/ranking/transporte. No requiere adopción A+B/D1/C ni evolución individual. Pruebas UI no vacías exigirán fixtures sintéticos persistidos propios y limpieza selectiva aprobada; los fixtures rollback de T01B no son visibles por HTTP.
