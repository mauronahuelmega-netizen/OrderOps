# Resultado individual de13 triggers

PASS focalizado en el snapshot actual; P04-T01C continúa BLOCKED. OIDs conservados como texto en el JSON. Índices originales sin renumeración.

| Índice | Tabla | Trigger | OID trigger | OID tabla | tgfoid | Propiedades A/B/A | Texto A/B/A | Resultado |
|---:|---|---|---|---|---|---|---|---|
|18|business_settings|handle_business_settings_updated_at|25371|25350|25370|Iguales|Calificado / sin calificar / calificado|PASS|
|19|customization_groups|handle_customization_groups_updated_at|25590|25402|25370|Iguales|Calificado / sin calificar / calificado|PASS|
|20|customization_options|handle_customization_options_updated_at|25591|25432|25370|Iguales|Calificado / sin calificar / calificado|PASS|
|21|customization_group_assignments|handle_customization_group_assignments_updated_at|25592|25464|25370|Iguales|Calificado / sin calificar / calificado|PASS|
|22|product_customization_overrides|handle_product_customization_overrides_updated_at|25593|25493|25370|Iguales|Calificado / sin calificar / calificado|PASS|
|23|upsell_groups|handle_upsell_groups_updated_at|25594|25532|25370|Iguales|Calificado / sin calificar / calificado|PASS|
|24|upsell_group_items|handle_upsell_group_items_updated_at|25595|25558|25370|Iguales|Calificado / sin calificar / calificado|PASS|
|25|order_financials|handle_order_financials_updated_at|25788|25765|25370|Iguales|Calificado / sin calificar / calificado|PASS|
|28|finance_accounts|handle_finance_accounts_updated_at|25915|25831|25370|Iguales|Calificado / sin calificar / calificado|PASS|
|29|finance_categories|handle_finance_categories_updated_at|25916|25854|25370|Iguales|Calificado / sin calificar / calificado|PASS|
|31|finance_funds|handle_finance_funds_updated_at|25917|25876|25370|Iguales|Calificado / sin calificar / calificado|PASS|
|33|business_finance_settings|handle_business_finance_settings_updated_at|25941|25918|25370|Iguales|Calificado / sin calificar / calificado|PASS|
|38|finance_transactions|handle_finance_transactions_updated_at|26102|26007|25370|Iguales|Calificado / sin calificar / calificado|PASS|

Los textos completos de cada frame y las comparaciones se conservan en per-trigger-results.json y en la captura original. Se compararon 54 campos estables por trigger entre frames. No se quitaron prefijos ni se normalizó SQL para conseguir igualdad.
