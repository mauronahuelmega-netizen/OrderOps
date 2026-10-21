# Autorización, dependencias y cardinalidad

Nuevas funciones privadas, sin CREATE OR REPLACE:

| Nombre | Firma/defaults | Resultado | Propiedades |
|---|---|---|---|
| private.statistics_v1_read_core_c_candidate | (p_period text, p_start_date date=NULL, p_end_date date=NULL, p_product_sort text='units', p_limit integer=5, p_cursor jsonb=NULL) | jsonb legacy/effectiveFacts interno | STABLE, SECURITY INVOKER, search_path=pg_catalog,public,private |
| private.statistics_v1_summary_c_candidate | misma firma | respuesta completa statistics.v1 + statistics.series.v1 | mismas propiedades, D1 point_metrics MATERIALIZED |

ACL propuestas: revocar PUBLIC/anon/authenticated/service_role en **estas dos nuevas firmas**, otorgar EXECUTE solo authenticated; propietario de instalación mantiene derechos inherentes. Ningún grant/policy existente cambia. Helpers invoker requieren permiso de ejecución para llamadas transitivas, por eso no se confía en privacidad nominal del esquema.

Dependencias directas preservadas: auth.uid(); private.statistics_can_read(uuid), statistics_source_items(uuid,uuid), statistics_source_digest(jsonb), statistics_metrics(jsonb,bigint), statistics_local_cutoff(date,time,text), statistics_v1_series_instant(timestamptz), statistics_v1_series_delta(jsonb,jsonb,boolean,text); tipo relacional public.statistics_v1_effective_facts; tablas profiles, business_settings, business_statistics_state, orders, order_financials, order_statistics_completions, order_statistics_completion_items, store_sessions, store_session_statistics_snapshots. El ensamblador depende del nuevo núcleo C; los restantes helpers y dependencias transitivas son los existentes del catálogo F.4A. Revisar firmas reales, ACL y definiciones por catálogo antes de aplicación, no derivarlas de estos rótulos abreviados.

Guard de entrada y core directo: auth.uid() real, profiles.id y business_id originales, role original en owner/manager/admin. NULL/sin perfil/sin negocio/roles desconocidos/operator/viewer/super_admin se deniegan 42501; ninguna normalización/fallback administrativo. El ensamblador comprueba negocio del bundle contra el autenticado. Cursor/JSON no pueden seleccionar negocio ni conceder rol. Claim role debe seguir siendo authenticated en los tests; claims owner/business falsificados no reemplazan profiles.

Se mantienen explicit statistics_can_read(c.business_id) en eligible, la comprobación de source_items y **todas las políticas RLS**. completion_items es SELECT invoker con statistics_completion_item_read USING statistics_can_read(business_id). La nueva relación es almacenamiento efímero del resultado autorizado en la misma consulta. Releerla no permite incorporar filas rechazadas ni otros negocios. No es caché persistente ni autoridad extraída de JSON. No se incorpora SECURITY DEFINER; statistics_can_read es una dependencia histórica SECURITY DEFINER, intacta, cuyo comportamiento debe revalidarse. No se sustituye por una función nueva con bypass.

RLS de orders/finance/profiles/settings/sesiones continúa según las políticas del catálogo previo. El diseño no asegura que dichas políticas sean correctas solo por existir: la futura prueba debe verificar SELECT con JWT/SET ROLE authenticated y negocio real, nunca certificar mediante postgres. El instalador privilegiado no es el transporte de aplicación.

Cardinalidad: cada fila de la CTE proviene de un i.* base; EXISTS es semijoin, no join multiplicador. El FK compuesto fija pertenencia al negocio del completion. current/previous conservan reglas originales y el join posterior i.completion_id=f.id; cualquier multiplicidad de facts preexistente sigue siendo la original (no se introduce DISTINCT que encubra errores). Las sumas no agregan upsells a main_units; financial quality filtra net como antes. Reutilizar materialización no evalúa anticipadamente métricas/CASE inválidos: contiene solo columnas tipadas y pertenencia; previous vacío cuando v_compare=false. Puede evaluar permisos antes/en diferente orden: conservar SQLSTATE exigirá pruebas de acceso directo, sin sesión y objetos faltantes.

Seguridad estática favorable; seguridad efectiva y timing de errores pendientes. Cualquier cambio requerido en tabla, política, helper existente o índice se presenta aparte y detiene esta propuesta.
