# Mapa expresión por expresión

Referencia exacta: función private.statistics_v1_summary_candidate extraída del SQL A+B SHA fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9. functions.diff tiene dos cambios: nombre nuevo y materialización. Invertir ambos reproduce el texto completo byte por byte. No se reutiliza texto rediseñado ni se normaliza JSON para certificar igualdad.

| Expresión o bloque | D1 y efecto semántico previsto |
|---|---|
| Firma/defaults | text,date=NULL,date=NULL,text='units',integer=5,jsonb=NULL; retorna jsonb; iguales |
| STABLE / SECURITY INVOKER / search_path | Iguales, pg_catalog,public,private; sin nueva autoridad |
| profiles WHERE id=auth.uid() | Conservada; raw role owner/manager/admin; NULL/negocio ausente denegados |
| auth.uid/role NULL y excepción42501 | Conservadas antes de cualquier lectura del núcleo |
| v_bundle := read_core_candidate(...) | Única llamada al núcleo A+B, sin copiarlo/reemplazarlo |
| v_base y configuración requerida | Mismo bundle->legacy y retorno temprano; nunca evalúa puntos sin configuración |
| businessId mismatch | Mismo chequeo42501; el negocio sale del perfil, no del JSON del cliente |
| período/asOf/revision/cursor | Delegados sin cambio al núcleo; mismo statement_timestamp y snapshot |
| effective/v_facts | Mismos filtros, fechas, calidad y campos; no nueva composición ni finanzas |
| sessions/pairs y ordinal | Identidad y emparejamiento backend conservados; no arrays por índice |
| cn/pn, sizing y lanes | Iguales; mismo presupuesto200, segundos exactos y cortes microsegundos |
| calendar_plan/session_plan/outside_plan | Iguales, DST, zonas, jornadas, nocturnas y parciales |
| plan MATERIALIZED | Ya existente, permanece; mismos descriptor, basis, ca/pa, mapping y reason |
| membership MATERIALIZED | Igual CASE por side, >=apertura, <cierre con inclusión terminal condicionada; no filas agregadas/omitidas |
| groups MATERIALIZED | Igual GROUP BY descriptor,side y jsonb_agg ORDER BY date,at,id |
| point_metrics p.* y LEFT JOIN groups | Iguales, cardinalidad una por fila de plan si groups único descriptor/side; no DISTINCT nuevo |
| CASE WHEN ca THEN statistics_metrics(coalesce(c.rows,[]),v_historical) END cm | Texto idéntico; una evaluación por fila con ca=true; ca=false/NULL conserva NULL y no ejecuta metrics |
| CASE WHEN pa THEN statistics_metrics(coalesce(b.rows,[]),0) END pm | Texto idéntico; una evaluación por fila con pa=true; no convertir NULL previo en0 |
| point_metrics AS MATERIALIZED | Único cambio de cálculo: almacena cm/pm por descriptor/fila de plan, reutiliza en métricas y comparaciones; antes el planner podía inlinearlos y repetir llamadas |
| intervals/cslices/pslices | Iguales; metadatos y timestamps no se materializan/rediseñan adicionalmente |
| key/md5 y label | Mismas entradas, orden jsonb_build_array, mapping, zonas y descriptor |
| current/previous CASE ca/pa | Iguales; salida ausente sigue NULL; availability temporal separada de calidad |
| comparisons unnest cuatro indicadores | Iguales; delta usa cm/pm materializados; métricas iguales no producen nuevas diferencias |
| jsonb_agg(points ORDER BY sort_date,sort_time NULLS FIRST,descriptor) | Igual orden; no sorting/normalización adicional en pruebas |
| bool_and/alignment/reason elegido | Iguales, mismo ORDER BY para primer reason |
| current_check/previous_check statistics_metrics | Conservados e independientes del materializado; siguen verificando cohortes completas |
| v_bad/membership counts/200/keys | Todos conservados; mismas excepciones22023 |
| metrics legacy mismatch y comparisons totales | Conservadas; no confiar en promedios ni totales para construir puntos |
| salida base || series | Exactos campos, string numéricos, NULL, calidad/reasons y cobertura |

Evaluaciones eliminadas por diseño: repeticiones del MISMO cm/pm al ser referenciado en métricas de salida y cuatro deltas. No eliminar métricas de buckets legacy, resumen, checks de conservación ni llamadas por lados distintos. No compartir métricas entre descriptores por semejanza de JSON: su identidad temporal sigue separada.

MATERIALIZED puede adelantar cm/pm respecto a consumidores, pero dentro de sus CASE idénticos. statistics_metrics es IMMUTABLE y sus entradas son rows ya construidas por groups y v_historical validado; no accede a finanzas ni depende de reloj. Esto no equivale a prueba runtime: entrada malformada/errores podrían cambiar el momento o precedencia de una excepción. Comparar SQLSTATE y mensaje, estado vacío/configuración/calidad/pa=false/DST inválido; cualquier divergencia bloquea certificación. No anticipar un pa ausente como disponible ni retirar CASE.

