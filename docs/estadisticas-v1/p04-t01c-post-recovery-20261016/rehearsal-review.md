# Revisión del ensayo futuro — NO ejecutado ni autorizado

Paquete inmutable: ../p04-t01c/qa-install.proposed.sql, SHA-256 `f7940a54a58b93b04d56b10eb1f65bf425299436a2e25a1d3ae79feec919272f`.

El plan anterior sigue siendo aplicable, sujeto al bloqueo de red y a autorización posterior. La revisión estática nueva no reemplaza la validación de las cuatro funciones, tabla y RLS en PostgreSQL.

## Preparación obligatoria posterior

1. Repetir preflight privado, catálogo, hashes, ausencia de colisiones y restricción de red comprobada. Inventariar datos, ACL, ledger y sesiones sin autenticaciones nuevas.
2. Derivar un harness auditable del hash exacto. Extraer únicamente BEGIN/COMMIT de nivel superior del instalador mediante delimitadores verificados; conservar todas las definiciones, guards y sentencias restantes. Registrar hashes fuente/derivado. No ejecutar el instalador íntegro ni ningún enable/uninstall por accidente.
3. Una transacción externa, límites SQL 15 s / locks 3 s y ROLLBACK incondicional en finally. Ante fallo, rollback de transacción abortada y cierre de conexión; no reparar SQL silenciosamente. Las pruebas de error necesitan savepoints controlados para no confundir una transacción abortada con denegaciones correctas. No COMMIT, migrador automático ni NOTIFY entregado fuera de la transacción.
4. Comprobar catálogo, owner, ACL, SECURITY INVOKER, search_path, defaults y resolución efectiva de dependencias. El instalador deja QA vacía y disabled por defecto. Resumen y candidatos privados existentes deben conservar hashes y ACL.

## Matriz mínima revisada

| Grupo | Casos / resultado exigido |
|---|---|
| Default closed | Tabla vacía, fila disabled, enabled sin expiración rechazada, expiración NULL/pasada y límite exacto: no datos. Sin configuración no hay autorización implícita. |
| Identidad/roles | owner/manager/admin originales únicamente; operator/viewer/super_admin/NULL/desconocido, sin sesión/perfil/negocio denegados. Si constraints impiden un estado, registrarlo como no representable sin alterar esquema; no simular un PASS. |
| Configuración | Solo los seis pares fijados por CHECK pueden ser configurados; cualquier enable temporal pertenece al futuro harness autorizado, no a esta tarea. No INSERT/UPDATE/DELETE por authenticated. SELECT solo del par propio autorizado. |
| Dos negocios | Acceso cruzado, business_id/claims manipulados, perfil movido de negocio o rol cambiado: denegación; no confiar en business_id del JSON. |
| Acceso directo | Wrapper y reader privado deben pasar por autorización original y gate. Helper QA no expone datos ajenos; helper métrico puro solo procesa argumentos, no constituye autorización. |
| Caducidad | Comparar contra statement_timestamp actual, no asOf del cursor. Probar antes, igual y después de expiración en sentencias diferenciadas; STABLE usa snapshot/reloj de la sentencia. No prometer observar una revocación concurrente dentro de una sentencia ya iniciada. |
| RLS | Comprobar ROLE authenticated, barreras sobre fuentes y tabla QA; sin bypass/SECURITY DEFINER. SET LOCAL claims verifica SQL/RLS, no autenticación HTTP real. |
| Regresión | Repetir SQL-05/07, ocho períodos, nueve diferenciales con Resumen y decoder real; ingresos, cobertura, categorías, upsells, cursores, microsegundos y NULL sin normalizar divergencias. No evolución individual. |
| Preservación | ROLLBACK, segunda conexión de solo lectura: funciones/config/grants/fixtures nuevos ausentes, ledger y datos originales idénticos. No limpieza global ni scripts uninstall como sustituto del rollback. |

El gate HTTP G1 y menú cerrado no protegen una RPC directamente. Con authenticated y SECURITY INVOKER, el wrapper necesita permisos de ejecución en los helpers; revocar el reader rompe la cadena, no la hace exclusiva del backend. El gate SQL propuesto cubre también el reader. Un usuario sintético habilitado podría invocar directamente la RPC: debe declararse y probarse. No se habilitan clientes reales.

Auth HTTP real, refresh/expiry y datos persistidos visibles por HTTP requieren autorización separada. SignOut no demuestra caducidad inmediata de un access JWT. Los fixtures revertidos por SQL no pueden servir para pruebas HTTP no vacías. La instalación persistente y la posterior activación no quedan autorizadas por un eventual ensayo exitoso.
