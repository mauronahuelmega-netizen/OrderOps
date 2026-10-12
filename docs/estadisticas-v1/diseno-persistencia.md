# Diseño de persistencia y RPC — revisión previa a Fase 02

**Diseño conceptual de Fase 01. La preparación autorizada de Fase 02 lo concreta en tres archivos SQL SIN APLICAR. Las precisiones de fase-02-informe.md y el conjunto de revisión prevalecen sobre esta propuesta inicial: generaciones de identidad, revisión diferida, lectura MVCC sin bloquear financials/items, proyección invoker y nulabilidad explícita. Ningún objeto analítico nuevo se aplica bajo la autorización actual.**

## Tablas propias propuestas

| Objeto | Campos mínimos / restricciones / índices |
|---|---|
| public.order_statistics_completions | id UUID, business_id, order_id, cycle bigint, completed_at timestamptz fiable, source_kind, session_id nullable, session_opened_at/timezone/commercial_date congelados, active bool, invalidated_at/reason, agreed_total numeric nullable, products_net/delivery numeric nullable, breakdown_source/evidence, quality/reasons, contract_version. FK(order_id,business_id)→orders(id,business_id); unique(order_id,cycle); partial unique(order_id) WHERE active; índice(business_id,commercial_date,completed_at) WHERE active. |
| public.order_statistics_completion_items | completion_id,business_id,line_key,source_item_ref nullable, histórico product_identity/category_identity/nombres, item_kind,parent_line_key,quantity,unit_price,gross/net numeric nullable, attribution_quality. PK(completion_id,line_key); FK(completion_id,business_id)→completions(id,business_id); checks cantidades positivas/decimales finitos; índice por tenant/product_identity. Sin FK de catálogo para IDs históricos. |
| public.order_item_statistics_snapshots | source_item_id único/FK order_items(id), order_id/business_id/FK orders(id,business_id), identities/nombres/category/source_evidence/captured_at. Trigger comprueba source_item.order_id=order_id; no nueva columna business_id ni unique compuesto en order_items. Snapshots de finalización mantienen copias para no depender de borrado posterior de línea. |
| public.store_session_statistics_snapshots | session_id PK/FK store_sessions(id), business_id, opened_at/timezone/commercial_date inmutables, observed_closed_at, source_quality/policy_version. Trigger valida pertenencia de sesión; no agregar unique compuesto a tabla compartida por defecto. Snapshot propio único(session_id,business_id) sirve como FK compuesta de completions; asociación nullable si no fiable. |
| public.business_statistics_state | business_id PK/FK businesses(id), instrumented_at, contract_version, revision bigint. Revisión operacional para invalidación, no importe alternativo. Índice PK. |

La eliminación de negocio/pedido sigue políticas existentes; no introducir retención global nueva. Relaciones padre-hijo analíticas se verifican al capturar y no se convierten en productos adicionales. Un snapshot incompleto existe como evidencia parcial, no como dato inferido.

## Triggers propuestos y superficies

1. AFTER INSERT order_items: identidad/categoría de alta, misma transacción.
2. AFTER INSERT store_sessions: snapshot temporal para nuevas sesiones; AFTER UPDATE cierre: observación de cierre, sin modificar apertura comercial.
3. AFTER UPDATE OF status orders: transición real→capture/invalidate; no-op sin evento. AFTER INSERT orders con completed/import: preservar unknown salvo evidencia explícita, nunca inventar now como finalización histórica.
4. AFTER UPDATE agreed_total order_financials: divergencia de calidad del vigente y revisión; no alterar total congelado ni nuevo ciclo. Cubrir INSERT/DELETE financials también como divergencia si cambia la evidencia del acuerdo.
5. Observación de cambios reales de composición de línea: marcar inconsistencias posteriores sin reinterpretar la venta; producto FK SET NULL por borrado no elimina identidad ya capturada.

Helpers propios private.statistics_* con SECURITY DEFINER, search_path fijo y referencias calificadas; revoke a PUBLIC/anon/authenticated/service_role. Tablas propias con RLS owner/manager/admin exactos y mismo perfil business_id. No grants de escritura a usuarios; la captura no depende de permisos de lectura de Estadísticas del operador.

## Orden de bloqueo y riesgos concretos

transition_order_status bloquea orders FOR UPDATE; initialize_order_financials también; set_order_agreed_total bloquea financials. La captura añade lectura/bloqueo financials y sesión. Cierre de sesión existente actualiza sesión fuera de la transacción de estado del pedido. Debe probarse el punto de serialización, sin atribuir automáticamente una finalización a una sesión cerrada en paralelo.

Orden previsto: pedido→financials→sesión→state revision. Triggers sobre financials NO deben tomar un lock inverso de orders ni la revisión antes de un lock de completion tomado por captura: riesgo de deadlock. Diseño recomendado: invalidación monetaria se detecta adicionalmente en lectura contra fuente canónica; una señal revision en actualizaciones financieras no debe leer/escribir facts bajo lock inverso. Revisar SQL exacto en Fase02 y simular carreras de cada combinación. Nunca aprobar un orden por su nombre sin inspeccionar todos los writers.

revision por negocio puede serializar capturas de alto volumen. Mantener trabajo mínimo bajo lock y no hacer agregación en trigger. Probar lock_timeout, rollback y dos conexiones; timeout es fallo, no PASS. MAX(cycle)+1 solo bajo bloqueo de pedido. Unique activo protege carrera adicional.

Catálogo: snapshot al alta, no al cierre. Promotores puede cambiar category_id y nombre en public.products. Lectura de producto/categoría para snapshot debe tener punto de consistencia con la línea creada; no asegurar pasado de una línea preinstrumentación leyendo catálogo actual. Entradas públicas usan create_order con servicio; triggers deben cubrir ese camino sin permitir payload falso del cliente.

## Migraciones futuras y compatibilidad

Grupos nuevos, versiones por reservar: statistics_v1_structures; statistics_v1_capture; statistics_v1_reads_security. No editar SQL históricos ni reemplazar create_order/transition_order_status/set_order_agreed_total. Si una garantía exige modificar sus firmas/bodies, se registra como superficie nueva y se solicita aprobación antes de hacerlo.

Ningún backfill automático. Registrar inicio de cobertura; no actualizar timestamps de pedidos existentes ni acceder a migration_private como usuario de aplicación. No tocar esquema commercial/finanzas ledger/stock. Nullable legacy y signatures existentes conservadas.

RPC propuesta, parámetros y payload están en contratos-tecnicos.md. Tests futuros exigirán: atomicidad, ciclos, FKtenant, bloqueo inverso, cierre simultáneo, ajuste posterior, composición mutable, publicación directa RLS, igualdad de sumas y exclusión SaaS. Este diseño debe aprobarse antes de cualquier migration nueva, incluso aislada.
