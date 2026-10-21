# Traslado semántico: original → candidato

El diff completo está en functions.diff; originales y propuestos en archivos SQL separados. No existe comparación runtime ejecutada. La generación utiliza cuerpos originales, no una reimplementación de métricas desde el frontend.

| Expresión/bloque original | Destino / cambio exacto | Justificación y prueba pendiente |
|---|---|---|
| summary_base: perfil por auth.uid, business_id y role | read_core_candidate, mismas consultas; añade role IS NULL explícito | En baseline profiles.role es NOT NULL y tiene constraint de valores, por lo que NULL/desconocidos no son estados admitidos. La lógica NOT IN original no deniega NULL por sí sola. Hardening explícito para revisión; comprobar catálogo live en F.2B. No disfrazar diferencia si el esquema destino permite NULL. |
| series_response: guard independiente | summary_candidate, conserva guard y añade IS NULL | No confiar en JSON de core como autorización. Ambos helpers verifican usuario/rol/negocio por su cuenta. |
| Validación de preset/sort/limit/asOf/cursor | Core, textual salvo nombre/guard | Mantener SQLSTATE, límites/casts y revision/requestKey/offset. No simplificar cursor a fecha ni permitir asOf futuro. |
| Timezone/configuration_required | Core devuelve bundle interno; base/series wrappers extraen legacy | JSON externo de configuración se conserva; effectiveFacts [] nunca se añade al JSON público candidato. |
| Jornada de sesión abierta y resolución de fechas | Core textual | Conserva timezone/snapshot apertura y fallback civil, períodos de meses cortos/años extremos. |
| Historical count global sin fecha fiable | Core textual, recorrido original de orders | No limitarlo al período ni convertirlo a cero. No se optimiza este count todavía. |
| Comparación/segments/cutoff DST | Core textual | Misma correspondencia ordinal backend y cortes parciales, motivos, v_compare, boundaries. |
| c.active + orders.status completed + join tenant + agreed_total actual | CTE eligible MATERIALIZED, mismos joins; filtros de fecha y principal explícitos | Cada completion activa por pedido tiene clave única; órdenes/finanzas referencian claves únicas. No agrupar antes de validar ni multiplicar filas. RLS original de tablas sigue aplicándose. |
| date_reliable = fecha/timezone no NULL y no date_conflict | Predicate eligible y proyección effective | Filtrar antes de digest es válido porque esos hechos no aparecen en respuesta. Historic coverage sigue calculado aparte. |
| Digest fuente actual repetido | digests MATERIALIZED por completion.id; CASE not composition_conflict | A lo sumo una lectura por completion elegible no conflicted. No significa una lectura por todo el historial. CASE evita evaluar composición donde el original ya descarta por composition_conflict. No usar snapshot histórico como digest actual. |
| effective_units | `CASE WHEN not composition_conflict AND composition_digest=d.current_digest THEN main_units END` | Misma comparación, precisión bigint y NULL. No incluir upsells/extras/modificadores en unidades. |
| effective_sales | Misma CASE monetaria usando c.current_agreement y d.current_digest | agreed_total canónico, not monetary_conflict, reconciliación IS NOT DISTINCT FROM, copy_total_price y composición. Sin distribuir ajustes/descuentos/envío desconocidos ni asumir gross=sales. |
| reasons array_remove(CASE...) | Proyección textual con sustitución de referencias financiera/digest | Mismo orden de motivos por fila, NULL, unresolved_breakdown, agreement_changed_after_completion, source_conflict, missing_composition. |
| v_current/v_previous, products/ranked/categories/all_products/v_rules | Cuerpos originales leen populate_recordset del bundle | Mismos CASE, sum, redondeos, net_amount, etiquetas históricas y paginación. Bundle retiene cohort completo una vez; consumers siguen separando current/previous. |
| buckets legacy hour/day/week/month y sizing | Originales leen el bundle; no cambian fórmulas | Conservan labels UTC/local, [lo,hi) legacy, horas de sesión y límites. No se cambia el sizing legacy por el de series. |
| construction JSON legacy | Copia exacta a v_result; wrapper devuelve v_result | Preservar todos los campos: no recortar productos/categorías/ruleEvidence porque la UI no los muestre. |
| series_response: llamada summary_base | Sustituida por una llamada a core; extrae legacy del bundle | Elimina recorrido operativo adicional entre ensambladores. No llama legacy original en ejecución candidata. |
| series effective/selected | JSON interno typed con view composite, mismos filtros de side/cut | Core ya aplica exclusión previous parcial. Serie revalida sus mismos filtros. Las filas excluidas no deben afectar el JSON; una eventual excepción de composición de una fila excluida es riesgo de evaluación descrito abajo. |
| count v_cn/v_pn → planificación sesiones/buckets/membership/intervals/points/series deltas | Textualmente idéntico desde ese marcador hasta el final | Evidencia estática exacta: cortes inclusivos terminales, microsegundos, DST, pairing, máximo 200, totalAlignment y fail-closed cohort checks intactos. |

## Evaluación única: condiciones y diferencias potenciales

Source_items es STABLE e invoker; digest es IMMUTABLE. Sin cambios de GUC/rol dentro de una respuesta, todas las lecturas STABLE del mismo statement usan el mismo snapshot. Se conserva la consulta de fuente actual; no se sustituye por agreed_total/gross ni por captured items. Los datos actuales y captured se comparan aún.

No se promete equivalencia de efectos excepcionales por reducir evaluaciones. Un helper que en el futuro se vuelva VOLATILE, lance errores condicionados al número de llamadas o cambie permisos/definición rompe la hipótesis. Catalog gate debe verificar definitions/volatility/security/search_path de source_items/digest y las políticas. Filtrar antes las filas anteriores fuera de su corte puede evitar una evaluación que el original de series hacía antes de descartarlas. Es deseable para rendimiento pero una excepción en una fila descartada podría cambiar el error: se debe probar con fixtures malformados admitidos por constraints y no declarar compatibilidad por asumir ausencia de errores.

En composición_conflict true se usa digest NULL sin ejecutar source_items: units/sales quedan NULL y reason source_conflict sigue true. El resto de flags no suprime digest porque units/reasons pueden necesitarlo incluso si el dinero no está disponible. No se intenta omitir composición únicamente porque main_units o agreed_total sean NULL.

## Arrays y roundtrip

`ruleEvidence.products`, agregados de razones y arrays sin ORDER BY original son riesgo de igualdad estructural si cambia el orden del plan. No se añade ORDER BY silenciosamente ni se ordenan arrays en la comparación diferencial. JSONB ignora orden de claves de objetos, pero mantiene orden de arrays. Cualquier diferencia obliga a corregir el candidato o solicitar una decisión explícita; no se acepta como equivalencia monetaria solamente.

effectiveFacts es JSON interno producido por core, no entrada de cliente. `jsonb_populate_recordset(NULL::public.statistics_v1_effective_facts, ...)` usa el tipo compuesto ya existente, recupera UUID/numeric/timestamptz y NULL. Debe demostrar preservación de escala textual monetaria y microsegundos. Dependencia aditiva en el tipo de la vista: un cambio de columnas/tipos requiere reauditoría. No se cambian decoders para tolerar diferencias.
