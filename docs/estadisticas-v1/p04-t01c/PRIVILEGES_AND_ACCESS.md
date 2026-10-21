# Privilegios y superficies de acceso

Inventario efectivo READ ONLY: `privileges-live.json`. Las tres funciones Products están ausentes; su exposición actual es inexistente. Original Summary conserva authenticated EXECUTE, anon/service_role sin EXECUTE. Esquema private: authenticated USAGE ya existente; no se propone modificar ese grant compartido. service_role puede tener bypassRls y USAGE preexistentes, pero no se concederá EXECUTE de objetos nuevos ni SELECT de configuración.

| Objeto nuevo propuesto | PUBLIC / anon / service_role | authenticated | Justificación |
|---|---|---|---|
| public.statistics_v1_products | Sin EXECUTE | EXECUTE | Standard SSR RPC con JWT del usuario; gate dentro del lector protege llamada REST directa. |
| private.statistics_v1_products_reader | Sin EXECUTE | EXECUTE | Necesario porque wrapper invoker ejecuta como authenticated; mismo guard propio protege llamada SQL directa. |
| private.statistics_products_metric | Sin EXECUTE | EXECUTE | Necesario para nested invoker; helper puro no consulta datos ni otorga permisos. |
| private.statistics_products_qa_can_query | Sin EXECUTE | EXECUTE | Invoker necesita ejecutarlo; verifica identidad/negocio/rol/TTL/RLS, argumento negocio no es autoridad. |
| statistics_products_qa_access | Sin privilegios | SELECT con RLS; sin escritura | Un usuario no puede activar/modificar su publicación. Solo ve configuración propia y original role autorizado. |

Propietario esperado postgres para objetos nuevos, inherencia/superuser no añadidos, search_path fijo y SECURITY INVOKER en cuatro funciones. No SECURITY DEFINER nuevo, nuevo role, credencial privilegiada de transporte, ALTER DEFAULT PRIVILEGES, nuevos grants de esquemas ni cambios a políticas existentes. Las ACL solo se proponen en archivos.

RPC directa: un token Auth real de usuario QA habilitado puede consultar. No es distinguible del mismo token utilizado por SSR; el backend no se presenta falsamente como único camino. Un cliente real fuera de los seis pares, incluso owner/manager/admin, no encuentra fila y recibe NOT_PUBLISHED; super_admin nunca bypass. La propuesta solo se instala en el entorno privado cuyo marcador coincide y contiene exclusivamente datos sintéticos.

Tabla pública de control es visible mediante REST únicamente como filas propias; son identificadores sintéticos/estado/TTL, sin importes ni secreto del marcador. SELECT no permite habilitar, y CHECK fijo prohíbe pares ajenos incluso al administrar la configuración sin cambiar DDL. Si se desea permitir otros QA usuarios o producción, necesita nueva propuesta y aprobación.

HTTP G1 y menú quedan intactos/cerrados; el contrato de página/endpoint de Resumen no cambia. No afirmar que su gate revoca RPC Summary directa. La configuración SQL nueva se limita a Productos; abrirla para QA no abre automáticamente la página ni navegación de Estadísticas.

Cambiar negocio del perfil no queda bloqueado por FK compuesta: gate deja de reconocer el par anterior. Cambiar rol a viewer/operator/super_admin deniega en la lectura siguiente. Expiry usa tiempo actual del servidor, no fecha de cursor ni reloj cliente. Reinicios, pooling y caché HTTP no son fuentes de autorización. No polling/config cache compartida entre usuarios.
