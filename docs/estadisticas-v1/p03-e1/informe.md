# Estadísticas V1 — Cierre P03-E.1

**Veredicto: PASS_WITH_LIMITATIONS.** Integración local de los tres hunks compartidos aprobados y refuerzo del gate propio completados. Menú cerrado; página y endpoint autorizan por perfil original verificado. No se integraron ramas, instalaron migraciones, optimizó SQL, habilitaron negocios reales ni desplegó código.

## Estado y preservación

Worktree `OrderOps-Estadisticas`, rama `codex/estadisticas-v1`, HEAD inicial/final `923300265323d411c5c91b7935472d5423d228d2`. Cero commits nuevos, ninguna modificación del índice. Antes de aplicar el patch se comprobaron exactamente los tres SHA-256 propios registrados en P03-E.0 y `git apply --check`; todos coincidieron. Se aplicó exclusivamente `navigation-permissions.proposed.patch`. La evidencia final compara las postimágenes con las revisadas normalizando únicamente CRLF/LF: **texto exacto, sin desviaciones funcionales**.

`baseline.json` inventaría 1.997 archivos seguidos o sin seguimiento no ignorados, incluidos artefactos anteriores y el nuevo script de evidencia creado antes del baseline. `preservation.json` verifica que solo cambiaron cinco archivos preexistentes autorizados y ese script propio nuevo. Conserva los hashes de los dos cambios preexistentes del usuario (`fase-01-evidencia.json`, `next-env.d.ts`), SQL, Commercial Core/Promotores, componentes de Resumen y evidencias anteriores. Los hashes observados de los archivos de Cursor inventariados en P03-E.0 permanecen sin diferencias; no se escribió allí. La evidencia no inventaría archivos ignorados ni atribuye control sobre procesos ajenos.

## Inventario de código

| Archivo | Estado / cambio |
|---|---|
| `lib/admin/permissions.ts` | Modificado: viewStatistics y helper de rol original; permisos anteriores intactos. |
| `components/admin/admin-nav-config.ts` | Modificado: entrada propia con releasePending true; excluida en ambos filtros. |
| `components/admin/layout/admin-nav-list.tsx` | Modificado: icono BarChart3; renderizado y accesibilidad existentes intactos. |
| `lib/statistics/summary-principal.ts` | Nuevo: verificación request-local compartida de usuario, perfil, rol y negocio. |
| `lib/statistics/summary-route-server.ts` | Modificado: utiliza el mismo verificador; mantiene firma de acceso y adaptación SSR propia. |
| `lib/statistics/summary-transport.ts` | Modificado: reutiliza principal verificado antes de RPC; errores de infraestructura de perfil ahora query_failed, no falso forbidden. |
| `lib/statistics/p03-e1.verify.ts` | Nuevo: 89 aserciones de seguridad, transporte, wrappers server y navegación. |
| `scripts/statistics-v1/p03-e1-evidence.mjs` | Nuevo: baseline, hashes previos, postimágenes, preservación e inventario. |
| `scripts/statistics-v1/p03-e1-prepare-tests.mjs` | Nuevo: copias aisladas de suites históricas y redirección de artefactos. |
| `scripts/statistics-v1/p03-e1-eslint.config.mjs` | Nuevo: lint flat propio, sin reparar configuración compartida. |
| `scripts/statistics-v1/p03-e1-qa-server.mjs` | Nuevo: launcher derivado del aprobado; identidad antes de iniciar y espejo privado de fuentes. |
| `scripts/statistics-v1/p03-e1-auth-session.mjs` | Nuevo: Auth real sintético, SSR cookies, dos negocios y limpieza. |
| `scripts/statistics-v1/p03-e1-e2e.mjs` | Nuevo: regresión del recorrido aprobado, más menú cerrado y token expirado. |
| `scripts/statistics-v1/p03-e1-shutdown.ps1` | Nuevo: cierre exclusivamente del proceso QA registrado y sus hijos verificados. |

No fue necesario modificar página, endpoint, shell, contexto administrativo, configuración global, tipos compartidos ni contratos comerciales adicionales. El inventario exacto de fuentes y documentos nuevos, capturas y hashes queda en `preservation.json`; las copias temporales de suites y el espejo QA permanecen únicamente en el runtime propio ignorado. Los scripts nuevos derivados de QA no sobrescriben los originales.

## Seguridad y comportamiento

La página `/admin/statistics` llama statisticsRouteScope, que crea el cliente SSR con cookies y ejecuta verifyStatisticsPrincipal. El endpoint `/admin/statistics/query` llama getStatisticsSummary, cuyo transporte vuelve a ejecutar el mismo verificador para cada solicitud. Ninguna decisión de acceso se conserva entre solicitudes ni depende del contexto administrativo, menú, businessRole, flag cliente o negocio de URL/JSON.

El verificador usa getUser, consulta exactamente `profiles.business_id,role` del ID autenticado y acepta solo `owner`, `manager`, `admin` originales. Deniega NULL, desconocidos, operator, viewer y super_admin. Perfil ausente, negocio vacío/no utilizable o fallo de autorización impiden llamar a la RPC. El backend mantiene su autorización independiente y el decoder rechaza una respuesta de otro negocio. El negocio procede del perfil verificado; no existe parámetro frontend que lo reemplace.

Auth ausente/expirado/inválido conocido se clasifica como unauthenticated; la consulta devuelve 401. Fallos de Auth/perfil de infraestructura continúan como error, sin representar cifras cero ni falta de sesión inventada. Errores conocidos de refresh/session/JWT se reconocen por códigos específicos; para el caso observado validation_failed se exige también el mensaje exacto `Refresh token is not valid`. No se clasifica genéricamente cualquier 400 como sesión ausente.

Página denegada: muestra aviso sin KPI. Endpoint denegado: 403 y sin estadísticas. Una página de aviso puede responder HTTP 200 por su renderizado existente; eso no expone datos ni modifica la respuesta 403 del endpoint. Anónimo se redirige al login en página y recibe 401 en consulta. Los headers private/no-store/Vary Cookie se conservan. RLS no se modificó.

El patch no añade canViewStatistics a getAdminPermissions ni modifica ningún permiso ajeno. Todas las entradas anteriores preservan su filtrado. La entrada nueva lleva **releasePending: true**, se excluye tanto por filtro de rol como por filtro de settings y no se activa para ningún rol. Sidebar y drawer existentes utilizan esos filtros.

El acceso B4 sigue disponible en la ruta local para identidades sintéticas autorizadas. **No se implementó un mecanismo de habilitación comercial ni un interruptor server de lanzamiento a negocios reales.** Antes de publicar o abrir el menú siguen pendientes la decisión expresa de lanzamiento, un gate server de lanzamiento cerrado por defecto y la elegibilidad original del perfil para el menú. El contexto administrativo sigue convirtiendo NULL en admin; no se alteró. Eso no autoriza página/endpoint, porque ambos reconsultan el perfil original; con releasePending true tampoco muestra Estadísticas. Nunca abrir el menú usando ese fallback como elegibilidad.

## Pruebas ejecutadas

| Verificación | Resultado / evidencia |
|---|---|
| Rama/HEAD y tres hashes P03-E.0, aplicabilidad previa | PASS; baseline.json. |
| Postimágenes exactas del patch y preservación | PASS; preservation.json. |
| `tsx lib/statistics/p03-e1.verify.ts` | PASS, 89 aserciones; security-tests.json. Roles crudos, NULL/desconocidos, perfil/negocio inválidos, error de Auth, expiración, no RPC denegada, tenant switch simulado, wrappers server/endpoint reales con SSR inyectado. |
| `tsc --noEmit --incremental false` | PASS en proyecto completo, después de correcciones finales. |
| ESLint P03-E.1 flat propio | PASS en los tres archivos compartidos y gate/transport/pruebas propias. ESLint P03-D de página/endpoint también PASS. |
| Regresión P03-C | PASS, 142 aserciones: ocho períodos, URL, precisión, calidad, variaciones, presenter/lectura, dedupe y respuestas tardías; regression/p03-c/pure-evidence.json. |
| Contratos y decoders | PASS, suite read; serie: 268 aserciones y cinco fixtures; regression/p03-a/pure-evidence.json. |
| Dominio y dinero | PASS; períodos/DST/sesiones, calidad, comparación y 1.111 casos de conservación monetaria. |
| Dimensionamiento | PASS: 1.118 casos, 1.895.743 aserciones y 1.197.144 probes temporales; regression/p03-a-corrective/pure-evidence.json. |
| Geometría y fixture extremo | PASS, siete aserciones; regression/p03-d/pure-ui.json. |
| Verificador adversarial offline | PASS, sin operaciones Docker/DB de escritura. |
| Verificador live | PASS antes/después, proyecto exclusivo y cinco contenedores; identidad incluida en auth-sessions.json y e2e.json. |
| Auth emitida realmente + SSR | PASS, owner A/manager B sintéticos, página/RPC y cuatro KPI, logout propio, API anónima 401; auth-sessions.json. |
| QA E2E Next real | PASS, **110 aserciones**; e2e.json. |
| Cierre de QA | PASS; qa-shutdown.json, puerto 3037 cerrado. |

Reproducción offline: ejecutar prepare-tests, el test p03-e1.verify y las copias de domain/read/series/series-sizing/summary/summary-ui bajo `.runtime/p03-e1-pure` con tsx; TypeScript y ESLint con la configuración propia. No ejecutar de nuevo baseline después de aplicar el patch: exige expresamente las bases antiguas y debe fallar. finish verifica el baseline guardado.

La reproducción live exige primero el verificador adversarial y live PASS, puertos y entorno exclusivo; ejecutar QA launcher, auth-session y E2E secuencialmente y cerrar solo QA con el script de shutdown. No copiar credenciales a documentos ni iniciar contenedores para corregir fallos. La autorización de esta fase no permite pruebas en otras instancias.

## Flujo live, aislamiento y limpieza

Historia verificada: cookies SSR → página protegida → selección de período → endpoint reautenticado → RPC extendida → decoder/presenter → cuatro KPI y gráfico. Servidor Next QA en `127.0.0.1:3037`, API exclusiva `127.0.0.1:56321`, DB `127.0.0.1:56322`, proyecto `orderops-statistics-v1-test-74718de66a41`. El launcher revisó identidad antes de arrancar y suministró solo anon key, sin service role; no cargó configuraciones ajenas. Espejo privado P03-E.1 para evitar generated files/locks del checkout.

El E2E recorrió los ocho períodos, seis roles en dos negocios, URL extranjera ignorada, menú oculto por los doce perfiles, acceso directo denegado, token sintético firmado expirado con endpoint 401, KPI/punto sin nueva consulta, gráfico/lectura sincronizados, retry/timeout, carga sin datos viejos, comparación y datos desconocidos, móvil/escritorio y ambos temas. Cero orígenes ajenos y cero excepciones de navegador. Conserva 16 capturas de regresión, distinguiendo live vacío de estados no vacíos interceptados con fixtures. No se inventó un dataset no vacío real ni se recalcularon finanzas en UI.

Auth-session realizó login real de dos usuarios sintéticos, logout local en finally y limpieza de cookies. Inventario auth.sessions antes/después: 24 filas, mismo fingerprint `895cb57682c6924906450dee054dcdbf`, cero sesiones posteriores al baseline. No se eliminaron sesiones ajenas ni se escribieron pedidos o perfiles. El E2E adicional usa JWT sintéticos firmados por el proyecto aislado; su prueba de expiración no se presenta como expiración temporal de una sesión real emitida por Auth.

No hubo migraciones ni reset. La comprobación de inventario Auth usa SELECT dentro de BEGIN READ ONLY; los únicos cambios de servidor fueron los del ciclo Auth sintético autorizado. Los contenedores/red/volúmenes no se iniciaron, reiniciaron o eliminaron. QA se cerró verificando PID parent 12036 y worker hijo 6456; puerto 3037 cerrado. No hubo listener en 3001 al observar cierre; no se tocó otro servidor.

## Defectos encontrados y correcciones

- El sandbox no tenía acceso al pipe de Docker. La verificación se repitió con acceso aprobado de solo lectura y pasó; no fue necesario reparar Docker.
- La inferencia del tipo Supabase completo provocó TS2589 en el gate: adaptación propia a interfaz estrecha, igual al patrón del transporte, sin modificar Database.
- El arnés inicial tenía top-level await incompatible con CJS y comparación de objetos de distintos contextos VM: función async y comparación estructural serializada de permisos.
- La copia de regresión necesitó directorios de salida propios y el E2E debía conservar la referencia al fixture P03-D. Se corrigieron solo scripts nuevos.
- El generador heredado de geometría reescribió el fixture sintético P03-D con bytes idénticos; la verificación de preservación confirma hash intacto. Se redirigió su salida a evidencia propia y se repitió, evitando futuras escrituras sobre ese fixture anterior.
- El ESLint global existente falla con estructura circular de configuración. No se modificó; lint de las superficies afectadas pasó con flat config propia.
- El E2E detectó refresh inválido como 502. No había exposición de estadísticas, pero se corrigió el estado a 401; luego pasaron las 89 aserciones offline y el recorrido E2E completo de 110.

## Limitaciones y próxima autorización

P03-B.1 sigue pendiente: la RPC extendida tuvo timeout a 500 pedidos en diagnóstico anterior. No se optimizó SQL ni se remidió rendimiento aquí. Impide certificar lanzamiento a volúmenes reales. No se ensayaron modificaciones live de rol NULL, perfil ausente o cambio del business_id persistente: esos casos se verificaron con cliente SSR inyectado y perfil request-local; no se escribió perfiles existentes. El intento de negocio extranjero y dos tenants sí se probaron live. Las series no vacías/UI alternativa siguen bajo fixtures de prueba; captura de datos no vacíos, concurrencia SQL de integración, zoom 200% y lector de pantalla no se certifican en esta fase.

No hay autorización de lanzamiento, gate comercial ni integración entre ramas. Los cambios propios anteriores permanecen sin seguimiento; no se confirmó ningún archivo preexistente ni se hizo commit, push o deploy. Un futuro traslado exige revisar el HEAD efectivo de Cursor, manifiesto completo, rol original para elegibilidad del menú, gate server de lanzamiento y plan SQL autorizado por separado. **Detención al finalizar P03-E.1; esperar autorización expresa para cualquier integración o lanzamiento.**
