# Recomendación

**INCONCLUSIVE. Realizar primero un experimento corto de infraestructura/planes, no F.5B.** No se ha demostrado que Docker cause la lentitud ni que el entorno actual sea estadísticamente estable bajo carga. La presión ambiental observable y el cambio de lecturas lógicas requieren una medición sincronizada.

Experimento propuesto para autorización posterior: dos ventanas de actividad natural,50 pedidos primero (100 solo si gates), tres lectores existentes alternados. Registrar tiempos normales start/end UTC y muestras crudas con CPU/PSI/deltas I/O de observador ligero; realizar perfiles anidados separados, con mismo dataset/asOf, para identificar joins/plan/heap/JIT. Mantener SQL15s/lock3s, recursos y servicios sin cambios. No instalar C, no modificar planes por configuración ni intentar una ventana artificialmente limpia.

Pregunta concreta: ¿el crecimiento de shared hits del original50 de12.268 a≈111.000 se reproduce con cambios identificables de loops/planes internos/huella física? ¿Las latencias residuales a trabajo lógico comparable coinciden con CPU pressure o waits? Un plan externo Result y CPU agregada del contenedor no bastan. Dejar explícitos fallos de contadores Windows y emplear un proveedor read-only fiable si ya está disponible; si necesita reparación/configuración, pedir autorización.

Si el trabajo lógico cambia, primero fijar comparación de inputs/huella/plan y revisar su costo; si permanece comparable pero latencia sigue PSI/waits, diseñar una prueba de entorno específica con autorización separada. Si ninguna explicación aparece, conservar INCONCLUSIVE y no transformar hipótesis en causa. F.5B podrá revisarse con esta metodología y autorización explícita del hash C; no es continuación automática de F.4B.

No se recomiendan ahora cambios de CPU/RAM, JIT, índices, SQL o timeouts. Objetivos acordados siguen exploratorios, adopción pública y lanzamiento siguen pendientes.
