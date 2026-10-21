# Seguridad offline

Objeto nuevo único: private.statistics_v1_summary_d1_candidate(text,date,date,text,integer,jsonb), STABLE SECURITY INVOKER, search_path=pg_catalog,public,private. Propietario futuro el mismo rol de migración aislada aprobado; comprobar catálogo real, no asumirlo del archivo.

Guarda idéntica al lector A+B: perfil verificado auth.uid(), negocio del perfil, rol ORIGINAL owner/manager/admin. Sin fallback administrativo, claims metadata, businessId recibido o bypass super_admin. NULL/unknown/operator/viewer/super_admin denegados. Núcleo A+B repite su guarda; D1 preserva tenant mismatch. Helpers existentes conservan ACL y autorizaciones, no se conceden derechos nuevos sobre ellos.

SQL propuesto revoca PUBLIC/anon/authenticated/service_role en la función NUEVA y concede EXECUTE solo authenticated; owner implícito queda sujeto al rol de instalación. No grants en preexistentes, esquemas/tablas o políticas. No SECURITY DEFINER, ALTER RLS, funciones reemplazadas, nuevas tablas/índices/cache/jobs ni routing público.

RLS se ejecuta en tablas leídas por núcleo y lectores de series: profiles/business_settings/business_statistics_state, orders/order_financials/order_items, completions/completion_items, snapshots de ítems/sesiones, store_sessions y products según composición. La materialización local ocurre sobre hechos ya autorizados; no eludir ni eliminar statistics_can_read. Ver catálogo/RLS de todas las dependencias como F2B antes y después de una futura instalación.

Pendiente: compilación PL/pgSQL, ACL efectivos y llamadas directas. Preparar seguridad para tres lectores y TODOS helpers candidatos: seis roles en dos negocios, sesión ausente/expirada, perfil ausente/sin negocio, metadata/claims de negocio falsos con JWTsub del actor real, y helper directo. Cambiar sub por otro usuario usando conexión postgres no demuestra seguridad JWT: el transporte debe verificar firma/sesión; distinguir test SQL de claims del test HTTP real. No usar service role de aplicación. RolesNULL/unknown no admitidos por constraints se prueban mediante rechazo de fixture más pruebas del gate, sin alterar constraints para fabricarlos.

La existencia de la función privada con grant authenticated no es un gate de menú/lanzamiento; no exponer por PostgREST ni modificar RPC pública. No certificación efectiva hasta ejecución autorizada. Cualquier acceso cruzado o ampliación de grants detiene con FAIL.

