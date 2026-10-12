# Contratos técnicos — Estadísticas V1

Estado: definidos para revisión; solo documentación de Fase 01. Versión propuesta `statistics.v1`.

## Fuentes y sincronización

orders.status es autoridad de vigencia; order_financials.agreed_total de acuerdo monetario; order_items de composición; store_sessions de sesión; business_settings.timezone de zona configurada. Los snapshots preservan **el estado comercial de una finalización**, no una segunda interfaz de edición.

Una transición real a completed captura todo en la transacción operacional. Finalización usa clock_timestamp() después de los bloqueos, ciclo secuencial por pedido y una sola fila vigente. No usa created_at, entrega, settled_at o evento de timeline. completed→completed es no-op; salir de completed invalida; recompletar crea nuevo ciclo. Un rollback revierte hechos y revisión. INSERT completed histórico no se fecha con «ahora».

Snapshot de línea al INSERT: identidad/nombre/categoría con procedencia verificada. Cambios de catálogo posteriores no lo actualizan. product_id borrado/SET NULL no pierde identidad. Si una línea se reemplaza realmente con otro producto, requiere nueva evidencia de línea; no conservar identidad antigua como si fuera la nueva. Cantidades/precios comerciales se congelan al completar. Sin identidad fiable, conservar línea individual y rotular; nunca fusionar por nombre.

Snapshot de sesión al alta: timezone, opened_at y fecha comercial. Asociar un pedido a una sesión únicamente en captura fiable, con business_id igual y sesión verificable. Sesiones anteriores a instrumentación no reciben garantía retrospectiva de timezone/apertura sin evidencia. La observación de cierre se conserva para completitud, no para reclasificar hechos.

Cambios de agreed_total tras finalización: snapshot monetario anterior permanece inmutable; marcar divergencia de calidad y aumentar revisión. No sustituir su valor silenciosamente ni convertir el cambio en un nuevo ciclo de finalización. La nueva finalización captura el nuevo acuerdo. No se agrega acción de corrección comercial en V1. Revisar la fuente en la RPC como defensa contra señales de invalidación faltantes.

## Importe y composición

- Agreed_total conocido es la autoridad. Sin acuerdo conocido: desconocido; no copiar ni inicializar contratos desde Estadísticas.
- Venta reconciliada: V=P+E, productos netos y envío separados. Pagos/saldos/refunds no son V.
- V conocido con desglose pendiente: mostrar como importe acordado pendiente de reconciliación; no como Ventas exactas reconciliadas. Mantener V, B=composición y diferencia conocida en evidencia, sin afirmar la naturaleza de la diferencia.
- La igualdad V=B no demuestra por sí sola ausencia de descuento y envío compensados. Requiere procedencia del contrato que acredita la composición. initialize_order_financials(copy_total_price) con evidencia consistente es candidato verificable, no un fallback implícito.
- La fuente actual no conserva desglose universal de ajustes/envío. En V1, fuente faltante genera estado explícito; no se inventa un nuevo formulario de desglose ni se exige cambiar el contrato financiero sin aprobación.
- Ajuste identificado de productos: reparto por importe bruto de línea con mayor resto en centavos; desempate por UUID. Base cero/importe positivo: no repartir. Extras ya están en el precio padre; upsells se incluyen una vez.
- Identidad monetaria del upsell conserva su producto; su cantidad no participa en unidades principales ni crecimiento/caída por unidades.
- Moneda ARS según formatter actual; no funciones multimoneda. Postgres numeric(14,2), transporte decimal string, operaciones exactas; NaN/infinito/overflow o fuente incoherente: calidad inválida.

## Métricas y cobertura

Pedidos: count distinto de hechos vigentes y pedidos actualmente completed, con fecha fiable. Ventas: suma reconciliada del mismo universo. Ticket: Ventas/Pedidos solo si todos los importes del universo son fiables; si cero pedidos, null. Unidades: cantidades de principales de completados con composición conocida.

`quality`: exact | partial | unavailable | empty. `reasons`: missing_completion, missing_timezone, unverified_session, missing_agreement, unresolved_breakdown, agreement_changed_after_completion, missing_composition, missing_identity, missing_category, incomplete_comparable, source_conflict.

Fecha faltante: no asignar al rango; cobertura histórica sin fecha a nivel negocio. Sin categoría: «Sin categoría histórica» para importes de productos atribuibles. Importe no atribuible no se mezcla con esa categoría. Calidad se calcula por indicador; identidad desconocida no invalida un count fiable. Cero requiere ausencia comprobable, no falta de datos.

Si el subtotal reconciliado es parcial: «Ventas con importe reconciliado» y cobertura; ticket no calculable. Mantener separado el subtotal de acuerdos pendientes de desglose. Oportunidades monetarias no se generan con parcialidad.

## Fechas y comparables

Fecha comercial = fecha de apertura de sesión verificada bajo timezone congelado. Sin sesión pero con finalización fiable = fecha local de finalización y «Fuera de sesión verificada». Sin fecha o timezone fiable = no asignable; no UTC ni Buenos Aires asumidos.

Referencia actual: fecha comercial de sesión activa verificada; si no, fecha local actual. Hoy/Ayer usan esa referencia; semana lunes; mes día1; anterior completo; ventanas7/30 incluyen referencia. Personalizado inclusivo en UI, semiabierto por fechas comerciales en servidor; validar fecha/futuro/inversión. Sin límite histórico arbitrario.

Query selecciona fechas comerciales congeladas y hechos completados observados al corte. No filtra por creación ni redefine jornadas con horarios actuales. asOf es corte de consulta, NO reconstrucción de vigencia a fecha pasada. Una reapertura retira el pedido de resultados históricos actuales.

Comparables cerrados: igual número de fechas comerciales completas, intervalo anterior contiguo. Mes anterior: número de días equivalente, mostrando fechas. Semana parcial: mismos días previos; mes parcial: tramo desde día1 (si mes anterior no admite tramo, sin comparable). Móviles: desplazar7/30. El KPI actual nunca se recorta para fabricar base.

Sesiones de día en curso: ordinal de apertura del mismo día comercial relativo; segmentos anteriores cerrados completos y sesión actual con igual tiempo transcurrido desde apertura. Falta de par/duración insuficiente: sin comparación global. Fuera de sesión se compara por segmento civil equivalente y se combina solo si todo es válido. Una diferencia de cantidad/duración de segmentos impide afirmar equivalencia sin evidencia. DST requiere resolución explícita y offsets; no asumir 86400 segundos para todo día.

Buckets: hoy/ayer horario real de jornadas, incluso dos fechas; ≤31 días comercial;32–180 semanal;>180 mensual, máximo200 mediante agrupación. Fechas diarias por fecha comercial. Σventas/pedidos/unidades = tarjeta cuando misma cobertura; ticket es derivado. Intervalos de calidad incompleta no se rellenan como cero verificado.

Δ=actual−anterior; %=Δ/anterior únicamente si base>0. Base0: «Sin base comparable»; absoluta puede mostrarse si fiable. Sin ticket válido no hay Δticket.

## Lectura, tipos y seguridad

Propuesta RPC `public.statistics_v1_summary(p_period text, p_start_date date default null, p_end_date date default null, p_product_sort text default 'units', p_limit integer default 5, p_cursor jsonb default null)` returns jsonb, STABLE, SECURITY INVOKER, search_path fijo. Cálculo temporal usa statement_timestamp() como corte único. No parámetro tenant seleccionable. Granularidad se deriva en servidor; validar enums/fechas y limit1–20.

Perfil auth.uid exige role ORIGINAL owner/manager/admin y business_id, sin normalizeBusinessAdminRole para autorizar. Página, endpoint y RPC guard; RLS de tablas analíticas nueva igualmente restrictiva; no service_role en endpoint. Los triggers de captura necesitan privilegios mínimos de SECURITY DEFINER y no grants ejecutables al cliente.

Respuesta tipada futura: contractVersion, businessId/name, currency, timezone, policyVersion, period(commercialDates/reference/asOf), comparable(ranges/segments/available/reason), revision, coverage, metrics(value decimal/null/count, quality, knownCount, unknownCount), deltas, buckets, products(items/nextCursor), categories, unattributedComponents y ruleEvidence(current/previous). No nombres/teléfonos/direcciones de clientes.

Payload agregado en una sentencia/snapshot; preagregar por pedido antes de joins. Universo productos incluye ausentes actuales y anteriores. Cursor vinculado a tenant/período/sort/revisión por endpoint; cambio revisión→recarga coherente, no páginas mezcladas. AbortController+requestKey en cliente. Sin caché compartida ni realtime global inicialmente.

## Oportunidades

Determinísticas, evidencia exacta y comparable, máximo3; Resumen destaca misma primera. Umbrales: ventas↓15%, base≥20/current≥10; pedidos↓15% y5, base≥20; ticket±15% con20 en ambos; producto↑25%+5 conbase10 y20 pedidos ambos; producto↓25%−5 conbase10/universo actual completo; concentración≥40%, rango cerrado≥7 fechas,30 pedidos,5 jornadas verificadas activas,10 dominante. Fuera de sesión/incompletitud impide concentración si afecta universo.

Score=min(magnitud,1)×peso (ventas3,pedidos2,resto1); concentración utiliza cuota; desempate muestra y clave. Consolidar caída ventas/pedidos relacionada; una por producto; no fabricar tarjetas. Cada resultado tiene observación/evidencia/interpretación/sugerencia, sin causalidad ni acción automática.
