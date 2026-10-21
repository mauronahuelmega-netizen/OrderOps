# Superficies HTTP y Supabase

| Superficie | Control real | Estado |
|---|---|---|
|GET/admin/statistics|SSR rawprofile + publication QA privada + actualtarget|Cerrada por defecto, no menú habilitado|
|GET/admin/statistics/query|Mismo principal/callback antes de una RPC, decoder/tenant/period, no-store|404no publicado;401anon;403roles denegados|
|readAuthenticatedSummary interno|Política por defecto false, rol/tenant revalidados|No HTTP directo; serverentry aporta política explícita|
|getStatistics antiguo en server.ts|LegacyrequireAdminContext; no ruta actual invocante|No reutilizar para HTTP/Productos; fallback de rol documentado previamente|
|public.statistics_v1_summary via Supabase/PostgREST|Grants propios,RLS,statistics_can_read/perfiloriginal/guard original|Independiente del gate HTTP; lector original activo en último catálogo aislado|
|A+B/D1 helpers privados|Permisos autenticados/guards/RLS de candidatos experimentales|No públicos adoptados; schema private no es garantía suficiente de seguridad|
|C|Archivo de diseño|No instalada/no acceso|
|products RPC propuesta|Nuevas funciones invoker/guards/grants propios, sin instalación|No endpoint Productos ni tráfico; futura aplicación solo aislada por hash autorizado|

Un usuario autenticado con rol/negocio permitido puede invocar la RPC pública de Supabase si está instalada/accesible en ese entorno, aunque el menú y HTTP estén cerrados. Este trabajo no cambia permisos DB ni claims; no afirma clausurar esa superficie. Antes de migrar/activar en un entorno con clientes, revisar explícitamente exposición PostgREST, grants, RLS y política de publicación DB si se requiere; no ejecutar una nueva política silenciosamente. Producción no inspeccionada ni usada como laboratorio.

Compatibilidad: archivos compartidos administrativos preservados por hash; Cursor solo referencia comprometida previa, su estado efectivo no tocado ni certificado. Ningún diff compartido fue aplicado; cualquier modificación posterior requiere diff previo y aprobación. Memoria/docs históricos no son verificación live; última evidencia catálogo sigue F.4C.

QA posterior: repetir identidadoffline/live, hash/catalog/ledger, healthy/resources; env privada definida únicamente para parejas sintéticas verificadas y proceso3037; API56321/DB56322, sin .envreal/service role ni cambios deDB. Test de cookies y dos negocios, configausente→404, QApermitido→unaRPC, otro actor/biz→404, roleNull/unknown/superadmin→403, anon/expiry→401, invalidperiod→400, cierre tras revocación→sinRPC. No iniciar/reiniciar servicios aquí.
