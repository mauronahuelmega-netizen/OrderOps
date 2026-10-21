# P04-T01C — consolidación de integridad y preparación de recuperación

**READY_FOR_RECOVERY_TEST_APPROVAL. P04-T01C continúa BLOCKED.** La prueba está preparada, no autorizada ni ejecutada.

- [Procedimiento de recuperación](RECOVERY_TEST_PROCEDURE.md): destino nuevo sin puertos/volúmenes compartidos, etapas, límites/costos, alcance comparado y PASS/FAIL/RECOVERY_INCOMPLETE.
- [Comandos y gates](COMMANDS_AND_GATES.md): create/start propuestos del lab, staging binario, restore y comparación; limpieza posterior separada.
- [Decisión de Kong](KONG_PRESERVATION_DECISION.md): opción única recomendada de reconstrucción declarativa, original íntegro retenido y prueba de clon previa, sin suponer irrelevantes los atributos ocultos.
- [Matriz consolidada y permiso siguiente](CONSOLIDATED_DECISION.md).
- Inventario/SHA-256, fuentes, pruebas offline y preservación: evidence.json, APPROVAL_HASHES.md, offline-results.json y preservation.json.

La investigación SQL de los13 triggers queda resuelta dentro de su alcance y no se repite. El PASS_FOCALIZADO y los veredictos históricos permanecen intactos; el runner general anterior sigue BLOCKED.

## Evidencia nueva sin SQL

El dump verificado se leyó offline en memoria, con lector limitado al formato PGDMP1.16 y validación contra el TOC anterior. Se identificaron12 nombres de rol, siete extensiones sin versión explícita, metadata de DB no listada en la vista anterior y108 bloques COPY descomprimidos (738 filas), sin guardar valores de filas ni cuerpos SQL. Se guardan conteos/huellas y prerrequisitos. Esto **no es una restauración** ni prueba de servicio funcional.

El procedimiento no pretende recuperar desde el dump los roles globales/membresías/passwords PostgreSQL, claves/env, Storage físico, WAL/PGDATA o configuración de servicios. Los auxiliares de rol en el nuevo laboratorio son explícitos y no se presentan como original recuperado. Hay64 referencias de dependencia fuera de los nodos del TOC: se informa el límite, no se declara equivalencia histórica de esos IDs.

## Riesgos residuales

La prueba podría detectar falta de dependencia/configuración de extensión o divergencia de ownership/defaults; se detiene y registra recuperación incompleta. Versiones/flags no fijados por el dump y recuperación de servicio integral requerirán material complementario si son necesarios. El laboratorio comparte host/motor, aunque no datos/red/volúmenes, con límites acotados y gates de capacidad; no es ensayo de fallo físico del host.

Kong no está listo para sustituirse: se preserva la información desconocida en el original y se recomienda probar primero equivalencia del estado lógico/aplicación en un clon separado. No se modifica el antiguo gate de xattrs ni se habilita su adaptador. La recomendación necesita aceptación explícita del contrato de preservación y pruebas; no permite eliminar capas originales o asumir «sin pérdida».

## Próximo paso

Solicitar autorización expresa para **una prueba independiente de recuperación** con los hashes del paquete, nuevo ID obtenido durante create y presupuesto indicado. Ese permiso debe excluir limpieza del contenedor/intervención original y aceptar el alcance de roles auxiliares. No se inició la prueba ni P04-T02. La tarea se detiene aquí.
