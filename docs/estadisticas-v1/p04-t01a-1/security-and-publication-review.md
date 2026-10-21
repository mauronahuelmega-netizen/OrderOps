# P04-T01A.1 — seguridad y publicación

## Superficies independientes

| Superficie | Control actual/propuesto | Publicación |
|---|---|---|
| /admin/statistics | SSR verifica identidad, perfil original y negocio; luego gate P03-G1 | Cerrado sin configuración server confiable; fuente conservada byte por byte. |
| /admin/statistics/query | Autenticación/denegación existente; gate server; private/no-store | Resumen permanece default-closed; no cambio de RPC. |
| public.statistics_v1_summary | Grants/RLS existentes + perfil original + invoker | Independiente del gate HTTP; el gate no revoca RPC directa. Sin cambios. |
| public.statistics_v1_products | Candidato no instalado; grant EXECUTE a authenticated | **Si se instala y confirma, será invocable directamente por usuarios authenticated autorizados del negocio aunque menú/ruta estén ocultos.** |
| private.statistics_v1_products_reader | Perfil desde auth.uid(), business_id desde perfil, owner/manager/admin exclusivamente + RLS | No acepta business_id ni autoridad del JSON cliente. Schema private no suele exponerse en PostgREST, pero SQL directo requiere la misma denegación. |
| private.statistics_products_metric | Cálculo puro sobre argumentos del llamador; sin tablas ni identidad | No proporciona datos del negocio ni una autorización. Su JSON arbitrario no es evidencia comercial. |

La política QA usa variable server privada ORDEROPS_STATISTICS_QA_PUBLICATION, destino real del cliente 127.0.0.1:56321, proyecto/DB esperados y pares usuario/negocio sintéticos explícitos. Sin configuración o con destino/configuración no fiable devuelve false. No depende de NEXT_PUBLIC, URL, localStorage ni menú. No se habilitó configuración ni un negocio. Las pruebas puras nuevas demuestran default-closed, config incompleta cerrada, par QA permitido, negocio distinto denegado y destino remoto denegado; no constituyen E2E live.

## Auditoría de autorización y RLS

Las tres funciones nuevas son SECURITY INVOKER con search_path fijo; objetos comerciales se referencian por schema. No SECURITY DEFINER nuevo, permisos elevados, bypass, escritor ni reemplazo de una función existente. El lector consulta profiles por auth.uid() y deniega ausencia de sesión/perfil/negocio, NULL, desconocidos, operator, viewer y super_admin con SQLSTATE 42501 antes de leer hechos. La autorización no depende de un rol normalizado del shell ni claims de negocio. Cambios de perfil deben reflejarse en la sentencia siguiente; lectura usa snapshot coherente.

Todas las tablas analíticas leídas tienen RLS activada y políticas SELECT authenticated con statistics_can_read(business_id) en las migraciones originales. La vista effective_facts es invoker/barrier y vuelve a aplicar can_read. La función can_read **existente** es SECURITY DEFINER, con búsqueda fija y perfil original; esta dependencia preexistente no se elimina ni se cambia. También existen capturadores definer preexistentes, que este candidato no invoca como escritores. No afirmar que todo el backend sea invoker por serlo el lector nuevo.

orders, profiles, business_settings, store_sessions y order_financials conservan políticas compartidas. Su comportamiento efectivo debe probarse bajo authenticated, nunca solo como propietario/postgres, que puede evadir RLS de tablas. El chequeo explícito del lector añade la restricción de roles incluso si una política compartida permite lectura más amplia.

business_id se obtiene del perfil y se aplica a hechos, líneas, evidencia y session snapshots; FK compuesta y PK impiden joins cruzados. Claims manipulados no se convierten en parámetro de negocio; la validez criptográfica de sesión corresponde al Auth/Supabase existente. En SQL de pruebas, SET LOCAL de claims solo puede emular identidades dentro del harness administrado; no prueba por sí solo la validación HTTP de firmas.

No hay dependencia de A+B, D1 ni C. Vista y helpers originales permanecen como fuente; no se adopta ninguno de esos candidatos.

## Instalación experimental segura propuesta — requiere autorización posterior

**Opción recomendada inicial: evaluación transaccional sin publicación persistente.**

1. Verificar identidad adversarial y live, API/DB loopback exclusivos, contenedores/red/volúmenes/ledger; no datos reales ni usuarios/clientes ajenos. Detenerse ante discrepancia.
2. Autorizar expresamente el nuevo hash y un harness con límites 15 s/3 s. El SQL entregado conserva BEGIN/COMMIT y sus grants propuestos: **ejecutarlo completo y confirmar no equivale a rollback**.
3. Preparar y revisar separadamente un harness que use exactamente las tres definiciones/firma/ACL del hash autorizado pero **una única transacción externa y ROLLBACK obligatorio**, excluyendo explícitamente BEGIN/COMMIT del archivo. No hacer eliminación automática ambigua ni usar el archivo como migración general. Registrar hashes del cuerpo original, extracción y harness; obtener autorización para ese procedimiento antes de ejecutar.
4. En esa misma conexión/transacción: verificar objetos nuevos, propietarios, proconfig, prosecdef=false, firmas/defaults y ACL; SET LOCAL ROLE authenticated y claims sintéticos para cada prueba; comprobar perfiles originales, dos negocios, roles denegados, NULL, sin sesión, acceso directo a helper/wrapper y decodificación real. Fixtures selectivos exclusivamente sintéticos.
5. ROLLBACK revierte tanto definiciones y grants nuevos como fixtures. Segunda conexión solo observa que no hubo publicación confirmada; no usar HTTP para invocar objetos no confirmados, que otra conexión no puede ver.
6. Comparar catálogo y datos antes/después, documentar errores, limpieza y SQLSTATE. Un fallo aborta y no autoriza corregir/aplicar otro hash.

**Si se necesitan pruebas HTTP:** no basta la transacción invisible a PostgREST. Hace falta autorización separada para una instalación persistente exclusivamente en proyecto local sintético con acceso de red efectivo restringido. 127.0.0.1 debe probarse también en los bindings reales del proxy y PostgreSQL; no asumir aislamiento por el URL usado. Sin clientes reales, sin credenciales reales, sin URL alternativa pública ni transporte service role. Comprobar schema cache/ACL y probar autenticación HTTP real. La exposición local a todas las identidades QA que satisfagan el lector debe declararse explícitamente.

**Fuera del aislado:** no instalar el candidato con grant authenticated general. Antes de cualquier integración se necesita una decisión aprobada de publicación a nivel SQL/ACL (por ejemplo lector privado sin wrapper RPC expuesto durante validación, o autorización de lanzamiento propia en el lector). Cambiar únicamente permisos de un rol global authenticated afecta a todos sus usuarios; no es una allowlist por negocio. Un gate de lector/ACL requeriría otro diff y autorización; no se incorporó silenciosamente. Mantener cierre HTTP no resuelve esa superficie.

## Matriz mínima para validación futura

- owner/manager/admin originales con sesión y negocio sintético: respuesta consistente únicamente de su negocio.
- operator/viewer/super_admin/desconocido/NULL/sin sesión/sin perfil/perfil sin negocio: wrapper y helper lector deniegan 42501 sin datos; no fallback ni bypass.
- Claims de business_id o rol de aplicación falsos, cursor de otro negocio, cambio de negocio: nunca datos cruzados; cursor inválido/stale no otorga acceso.
- helper métrico directo: solo cálculo de argumentos, sin lectura; reader directo aplica autorización completa.
- RLS: consultas a cada tabla/vista bajo authenticated, dos negocios y todas las identidades. Revisar ACL y políticas reales antes de afirmar protección.
- Gate HTTP: cerrado sin configuración aunque rol sea owner; expiración/refresh conserva respuesta de autenticación previa; allowlist solo para QA verificado.
- Preservación: Resumen, permisos/nav, gate, captura, migrations, funciones/grants/RLS existentes y hashes de candidatos privados inalterados.

No se modificó ningún grant, política, rol o configuración real. No se conectó ninguna base ni se inició servicio. Esta auditoría no certifica permisos efectivos runtime ni lanzamiento.
