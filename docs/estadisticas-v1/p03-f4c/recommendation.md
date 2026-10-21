# Próximo paso propuesto

**MIXED_EVIDENCE. Revisar F.5B como experimento SQL, sin autorizar aquí su ejecución.** No hay base suficiente para cambiar CPU/RAM/JIT, detener otros proyectos o reparar infraestructura. El trabajo SQL repetido está demostrado y el camino de completion_items cambia50→100, por lo que C requiere comparación explícita de ambos escenarios.

Antes de cualquier futura batería, corregir observador read-only para refrescar snapshot local de actividad por muestreo (pg_stat_clear_snapshot, no reset global) o utilizar snapshots de actividad fuera de transacción larga. Propuesta mínima en observer-refresh.proposed.patch, no ejecutada ni aplicada a esta corrida. Mantener raw actual y marcar waits no fiables; no rellenar NOT_AVAILABLE con cero ni repetir ahora muestras automáticamente.

F.5B futura: autorización expresa del hash C, gates live/ACL/RLS/equivalencia de cuatro lectores antes de timings. Mantener timeout15s/lock3s, no elevar recursos, no caché limpia ni restart. Planificar cohorte50 con Seq Scan y100 con Index Scan, capturar plan actual en vez de forzarlo. Conservar asOf, datos lógicos, filas por pedido y número de puntos; documentar estadísticas y huella física tras rollback. Normal y perfiles separados, orden contrabalanceado y mismos observadores para todos los lectores. Un candidato no puede aprobarse por mean más baja, normalizar JSON o eliminar RLS.

La presión ambiental debe seguir observándose: intervalos lentos coinciden con PSI elevado, pero hay contraejemplos y solo tres muestras/grupo. Si en F.5B los gates paran o la equivalencia/estabilidad falla, no insistir ni incrementar límites. Presentar caso reproducible y decidir un nuevo experimento, sin redefinir metas p95 ni declarar SLA de producción.

C permanece sin instalar, D1 sin adopción pública. Finalizar F.4C y esperar autorización del propietario.
