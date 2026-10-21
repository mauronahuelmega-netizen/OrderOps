# Phase04 — Auditoría de contratos y data lineage

Fuente íntegra: attachment1-ORDEROPS_ESTADISTICAS_V1_PHASE04_PRODUCTOS_SPEC-1.md (hash/line count en baseline), incluida sección7.2 y ratificación final. P-V01–P-V10 vinculantes; mockups ilustrativos. No evoluciones individuales, series/compare por producto, gráfico de líneas ni espacio vacío. No usar cifras/fotos/fechas como fixtures.

## Fuentes reales

| Dato | Fuente / límite |
|---|---|
|Universo efectivo|orders.status=completed + completion activa con business_id, fecha/completed_at fiables y asOf; vista statistics_v1_effective_facts, públicos originales. Reapertura/cancelación inactivan; recompletado nuevo ciclo; sin backfill.|
|Día comercial|store_session_statistics_snapshots abre jornada con timezone histórica; fuera de sesión fiable usa fecha local de finalización; sin fecha queda fuera de períodos y aviso global. No nearest-session ni horarios actuales.|
|Finanzas|order_financials.agreed_total y finance_audit_events; agreement actual se coteja con completion.agreed_total. Cobros/señas no son ingresos de producto ni sustituyen total acordado.|
|Composición|order_items principal/upsell,parent_order_item_id,quantity/unit_price y customization_snapshot. Writer histórico integra precio de personalización en unit_price, upsells child tienen línea propia. No sumar snapshot.extra otra vez.|
|Captura|order_statistics_completions y completion_items: identidad/nombre/categoría/gross/net históricos, parent_line_key, cantidad bigint>0; id+business FK, PK completion_id+line_key.|
|Identidad|order_item_statistics_snapshots guarda generaciones/source_kind/product/category al insert/reemplazo. Sin product_id queda identity_unknown; líneas anteriores al trigger pueden carecer de snapshot. No agrupar por nombre.|
|Categoría|category_identity/name histórica del snapshot. NULL no incluye provenance en completion_items; puede significar ausencia demostrada o falta de snapshot, indistinguibles en RPC actual.|
|Catálogo actual|products/categories no reconstruyen pasado. Estado activo/imagen/descripcion opcionales si verificados; no consultar catálogo cliente ni convertir categoría actual en histórica.|

La captura considera reconciliable únicamente composición válida itemized, evidencia copy_total_price sin agreed_total_changed, agreed_total=gross=new.total_price. Solo allí products_net=agreed_total, delivery=0 y net_amount=gross por línea. Resto unresolved/netNULL; no asignación de descuento/envío/ajuste. Los campos existentes no demuestran desglose comercial independiente para otros modos.

## Cobertura de RPC/decoder actual

| Requisito | Disponible | Brecha |
|---|---|---|
|Ranking|products.items identity/label/mainUnits/netAmount/quality; sort units/amount; cursoroffset/revision/key/asOf, limit1…50|No group_key estable para identityNULL; filtro de desconocidos/cero debe ocurrir antes de pagination, no eliminar filas en frontend y perder Top5. quality es financiera, no calidad por indicador.|
|Participación producto|metrics.mainUnits global y productos paginados|Suma Top5 no es denominador. Totales atribuibles a identidades confiables no devueltos; mainUnits global puede ser NULL por cobertura.|
|Categorías|categories identity/label/amount/percentage, por ingresos efectivos|Sin mainUnits, sin quality/coverage/provenance; NULL se agrupa como Sin categoría histórica aunque signifique desconocido.|
|Detalle|Nombre y ambas cifras de agregado producto|No categoría(s) del producto, status fiable, row key desconocidos, razones por métrica o coverage. Selección sin fetch individual exige enriquecer fila.|
|Cobertura|historicalWithoutDate global, outsideSession, pendingAgreedTotal/unresolvedOrders|No conteos de identidad/categoría no fiables ni universos denominadores por panel. pendingAgreedTotal no permite calcular ingresos individuales faltantes.|
|Series/compare|statistics.series.v1 del Resumen y ruleEvidence.previousMainUnits|No usarlas para evolución/comparación de Productos; no construir UI ni consultar para ese fin.|

Decoder actual es estricto en campos existentes, pero ampliación de Productos necesitará contrato/decoder propios; conservar fields y firma originales, no relajar validación para aceptar datos ficticios. currency actualmente ARS literal; no asumir multimoneda implementada ni cambiar contrato silenciosamente.

## Contrato futuro propuesto, no implementado

Envelope versionado propio con principal/negocio, period/asOf/revision originales, ranking y categories con availability separada. Cada metric: value decimal-string|null, quality exact/partial/unavailable/empty, reasons, known/unknownCount; units enteras exactas sin coerción Number fuera de límites. ProductKey=identidad histórica fiable; desconocidos no se agrupan por label y no se fuerzan a producto nombrado. Si se decide mostrar líneas desconocidas, key opaca source-line+completion estable y marcada como no atribuible, nunca UUID de catálogo inventado.

Ranking: sort units/attributedRevenue, items elegibles conocidos>0 filtrados **antes** de orden/cursor, fullMainUnits y attributedRevenue por fila, shares opcionales con denominator explícito; posición estable y límite/página. Empate por identidad fiable/COLLATE C del backend; no locale client que reordene páginas. Reusar offset/revision/requestKey/asOf, con invalidación si cambia sort/período; no inventar cursor cruzado.

Categorías: filas real(categoryId), uncategorized_verified, attribution_unknown, other_ui. value por métrica y denominator descriptor; sumas exactas, scope=verified subset / full known quantifiable universe. Unknown quantity solo segmento si cuantía conocida/comparable; de otro modo aviso y porcentaje de cobertura no disponible. Top5 reales más grupos especiales visibles fuera de Otras; Otras es suma/desglose client de cola completa, key reservada diferente de categoría real llamada Otras. Reordenamiento independiente de ranking.

Detalle: mismos agregados enriquecidos de fila seleccionada, categoría histórica única o lista/Varias categorías históricas cuando cambia en ventana. Nombre último snapshot fiable del período, no mezcla por texto. Sin imagen/descripcion/status cuando no verificables; Histórico si evidencia histórica, no Inactivo inventado. No endpoint/series individual. Cambiar período borra selección inmediatamente; cambiar ranking metric conserva solo si item existe en nuevo universo verificable, en otro caso limpia. Retry conserva identidad/intención sin cifras viejas bajo rótulo nuevo.

Coverage: scope y unidad explícitos para eligible/composition/identity/category/revenue; historicalWithoutDate global separado del período. Conservar unknown≠0, money strings y exactitud de reconciliación. Nunca inferir porcentaje monetario desde conteo de pedidos. Ingreso conocido sin identidad puede formar Sin atribución fiable, pero no sumarse nuevamente a producto/categoría. Montos globales pendientes no se prorratean ni convierten en sector de dona por intuición.

## Brechas y alternativas

D04-01 ingresos: recomendar solo net_amount del subconjunto reconciliado con fuentes/conflictos verificados, explícitamente parcial o No disponible fuera de él. La especificación permite indisponibilidad; no introducir una nueva regla contable. Distribuir descuento global/envío a líneas requeriría aprobación adicional; fuera de V1 por defecto.

D04-02 categoría: NULL no prueba Sin categoría. Propuesta conservadora: evidencia explícita del snapshot de esa línea/generación y completion temporal matching; si existe prueba de categoríaNULL, uncategorized_verified; si falta, attribution_unknown. No emparejar snapshot cercano ni catálogo actual; preservar source_kind y vínculo verificable. El public response no contiene esa prueba. Si los snapshots existentes no bastan (p.ej. borrado de línea elimina snapshots pero completion persiste), marcar desconocido; cualquier nueva provenance de captura requiere diff/writer/migración separado, no backfill inferido.

D04-03 agregación/API: opción recomendada para revisión: lector Productos propio aditivo, sin series, reutilizando semántica de universo original y controles; contrato fullcategories/detalle/ranking-cursor. No adoptar core A+B/D1/C como atajo. Alternativa: extensión aditiva de RPC pública conservandofirma/legacy JSON pero obligaría a pagar series y revisar regresión/rendimiento de Resumen. Presentar arquitectura/diff y equivalencia antes de SQL; no implementar ninguno aquí. No crear endpoints específicos de evolución.

D04-04 cifras fraccionarias/combos: esquema actual quantityinteger/bigint>0, units principales por kindproduct. No soportar fracciones ni desglose combo inventado; test input inválido y reportar no-supported. Negativos de ingresos no admitidos por constraints actuales; si escritor financiero nuevo los introduce, bloquear y revisar contrato antes de barras/dona.

## Pruebas de contrato requeridas

≥100productos/10categorías, homónimos con IDs distintos, rename/delete, categoríaNULLprobada/desconocida, cambio categoría mismaidentidad, upsell propiaidentidad/parent/modificador incluido, copy_total exacto vs descuento/ajuste/envío no reconciliado, signos/NULL/precision/zero, apertura/cierre/asOf±microsegundo, jornada nocturna/DST, reapertura/cancelación/recompletado, histórico sinfecha, cursor/página/empates, dosnegocios y seisroles+NULL/unknown, loaders/late/retry/partial, comparar totalde categorías/cola y denominadores globales sin usar Top5. Fixtures aisladas únicamente con autorización posterior; no SQL ejecutado en este descubrimiento.
