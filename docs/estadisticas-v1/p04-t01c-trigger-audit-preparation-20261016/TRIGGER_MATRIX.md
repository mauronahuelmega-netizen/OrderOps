# Matriz exacta de los13 triggers

Los índices son las posiciones originales del array de52 triggers. No se renumeran ni se ordenan por nombre. Todas las tablas son del schema public. Ningún OID se presenta como ya observado en esta preparación.

| Índice original | Tabla | Trigger | Migración de creación |
|---:|---|---|---|
|18|business_settings|handle_business_settings_updated_at|20260607210325_business_settings.sql|
|19|customization_groups|handle_customization_groups_updated_at|20260712090000_product_customization_v1_schema.sql|
|20|customization_options|handle_customization_options_updated_at|20260712090000_product_customization_v1_schema.sql|
|21|customization_group_assignments|handle_customization_group_assignments_updated_at|20260712090000_product_customization_v1_schema.sql|
|22|product_customization_overrides|handle_product_customization_overrides_updated_at|20260712090000_product_customization_v1_schema.sql|
|23|upsell_groups|handle_upsell_groups_updated_at|20260712090000_product_customization_v1_schema.sql|
|24|upsell_group_items|handle_upsell_group_items_updated_at|20260712090000_product_customization_v1_schema.sql|
|25|order_financials|handle_order_financials_updated_at|20260926011000_order_financials.sql|
|28|finance_accounts|handle_finance_accounts_updated_at|20260926012000_finance_foundation.sql|
|29|finance_categories|handle_finance_categories_updated_at|20260926012000_finance_foundation.sql|
|31|finance_funds|handle_finance_funds_updated_at|20260926012000_finance_foundation.sql|
|33|business_finance_settings|handle_business_finance_settings_updated_at|20260926013000_business_finance_settings.sql|
|38|finance_transactions|handle_finance_transactions_updated_at|20260926014000_finance_ledger.sql|

## Atributos a verificar para cada fila

| Familia | Campos / expectativa | Referencia histórica disponible |
|---|---|---|
|Identidad relacional|triggerOid, tableOid, schema, table, name;13 OIDs únicos, índices exactos|Solo nombre/tabla/posición y DDL; no OIDs|
|Función vinculada|tgfoid=functionOid=OID de extensions.moddatetime(); schema/nombre/firma cero argumentos, retorno trigger; lenguaje y dueño|DDL calificado; no tgfoid/OID/owner capturados|
|Modo de disparo|tgtype19, enabledO, no interno/parent/constraint/deferrable/initially deferred|BEFORE UPDATE ROW textual; enabled y varios flags no capturados|
|Argumentos|tgnargs1, updated_at más terminador NUL;11bytes; tgattr vacío, sin WHEN/transitions|updated_at textual; no bytea original|
|Implementación/config|Invocador, LANGUAGE c, source/bin esperados, sin proconfig; hashes/ACL/dueño/volatilidad/parallel y otras propiedades iguales A/B/A|No capturados históricamente para moddatetime|
|Dependencia de extensión|Una membresía moddatetime en extensions, OID/versión/tipo e estables|CREATE EXTENSION en fuentes; no dependencia OID capturada|
|Representación|pg_get_triggerdef(false), visibilidad, resolución sin esquema bajo A/B/A|Parejas de texto exactas por fila en targets.json|
|Clúster|system_identifier como texto, identidad QA y RR READ ONLY|Número previo no preciso; marcador/proyecto sí verificados antes|

Las referencias y textos exactos de cada una de las13 parejas están en targets.json. Función común no significa inferir identidad por nombre: el join principal es pg_trigger.tgfoid=pg_proc.oid. No se afirma continuidad histórica de campos nunca capturados.
