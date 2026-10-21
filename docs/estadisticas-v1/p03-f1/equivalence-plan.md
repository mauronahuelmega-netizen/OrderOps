# Equivalencia diferencial — preparada, no ejecutada contra una optimización

No existe implementación candidata en P03-F.1. No se afirma equivalencia original/candidata. La comparación Phase02/extendida ya aceptada es evidencia previa, no prueba de un nuevo diseño.

## Protocolo propuesto

1. Tras autorización P03-F.2, conservar originales y candidato en funciones internas propias de review sobre instancia aislada, sin reemplazar writers ni duplicar fuente comercial. Revisar firmas, defaults, volatility, invoker/search_path, grants y autorización de cada helper.
2. Cada fixture sintético se inserta en transacción aislada, con marcador verificado y presupuesto. No DDL temporal. Perfil/negocio/rol se seleccionan del fixture, nunca del JSON enviado al candidato. Limpiar por ROLLBACK, incluidos errores y desconexiones; comprobar conteos/fingerprints antes/después.
3. Ejecutar ambas respuestas en una sola sentencia SELECT en la misma conexión/transacción autenticada. Las funciones STABLE toman el mismo statement_timestamp y snapshot MVCC. No comparar respuestas generadas en dos solicitudes HTTP o dos sentencias distintas sin fijar correctamente todos los cortes/revision/cursor.
4. Comparación exacta jsonb original = candidato: objetos no dependen del orden de claves, arrays sí. No ignorar asOf, coverage, calidad, reasons, revision, requestKey, cursor o series para hacer pasar la prueba. Si un campo volátil debe fijarse, usar el contrato original de cursor/asOf y la misma revisión, sin cambiar su semántica. Verificar que outputs string monetarios conservan formato/redondeo, no solo igualdad numérica.
5. Verificar también el JSON legacy completo y legacy = extended-'series'. Pasar decoders actuales sin cambios. Cada helper directamente ejecutable por authenticated debe denegar tenant ajeno/rol inválido incluso si el wrapper no se llama.
6. Separar pruebas de exactitud y rendimiento: pares instrumentados no son muestras limpias de latencia. Fallo semántico detiene la propuesta independientemente del speedup.

| Dominio / contrato | Casos diferenciales obligatorios | Igualdad/invariante |
|---|---|---|
| B1 ventas | agreed_total completo, NULL, cambio post-finalización, conflicto, descuento/ajuste registrados, envío desglosado/desconocido, totales cero/no válidos según contrato | Mismos importes, flags, reconciliación y reasons. Ningún reparto silencioso ni fuente alternativa. |
| B2 composición | producto, upsell parent válido/inválido, modificador/extra incluido en precio, varias líneas, identidad desconocida/reemplazada | Unidades principales iguales; dinero comercial completo una sola vez; digest detecta los mismos cambios. |
| Pedidos/ticket | 0/1/N, mezcla de conocidos/desconocidos, sin finalización fiable | Conteo y denominador exactos; ticket NULL cuando el contrato lo exige, no COALESCE a cero. |
| Precisión | centavos, números grandes, negativos donde permitidos, límites numeric, orden de agregación | Strings y redondeos idénticos; ningún float/Number. |
| B3 jornada | apertura nocturna, cierre después de medianoche, sin sesión, fecha no fiable, timezone cambiada, múltiples sesiones por jornada | Asociación capturada conservada; fuera de sesión explícito; sin asociación retrospectiva. |
| Eventos | finalización duplicada, reopen, cancel, recomplete, ajuste financiero/composición posteriores | Mismo ciclo activo/invalidaciones y datos efectivos; captura no alterada. |
| Períodos | ocho presets/custom, meses cortos, leap year, rango largo, pasado extremo admitido, vacío | Igualdad exacta de período/cobertura/buckets/rankings/paginación. |
| Series | current/previous estructurados, período parcial, comparación no válida, disponibilidad vs calidad | Mismas claves e intervalos; diferencias solo válidas; ninguna pareja por índice. |
| Fronteras | apertura/cierre/corte asOf, microsegundos, límites internos, DST fold/gap, zonas | Pertenencia exclusiva y conservación de hechos; máximo 200 puntos. |
| RLS/B4 | seis roles originales, NULL/desconocido, perfil ausente, negocio cambiado, dos/varios tenants, llamada directa helper | Misma denegación; super_admin sin bypass, cero datos extranjeros. |
| Calidad | históricos sin fecha, composición distinta, evidencia ausente, conflict flags | Misma calidad por indicador, coverage y advertencias; desconocido no es cero. |
| Compatibilidad | configuración requerida, permisos/defaults/errores/p_cursor stale, Products/categories legacy | JSON íntegro, decoders existentes y errores SQLSTATE iguales. No reducir contrato al Resumen. |

## Concurrencia y recursos a autorizar posteriormente

Comparar lecturas concurrentes con finalización/reapertura/acuerdo/cancelación dentro del aislamiento. Comprobar snapshot coherente, rollbacks, deadlocks y ausencia de cambio de locks de escritores. Mantener lock_timeout y limpiar únicamente fixtures propios. Serial primero; dos lectores y un escritor acotados después de aprobación de plan, nunca generador de estrés. Medir spills/work_mem y p95 con varias líneas/tenants y largos períodos.

## Matriz de escalabilidad preparada

Para cada N en 50,100,200,500,1000,5000: una empresa vs dos/cuatro; reparto 1/7/30/180 jornadas; líneas 1/3/10 por pedido; exactos vs 25%/50% reconciliación incompleta; nocturnos, fuera de sesión y ciclos. Es una matriz planificada, no un producto cartesiano obligatorio de carga. Primero validar representatividad y escoger cohortes mínimas; avanzar solo después de gates de tiempo/memoria. La inserción histórica sintética debe tener origen explícito de fixture y fechas conocidas: nunca producir backfill inferido ni modificar datos reales. Preferir captura real bajo sesiones/eventos sintéticos donde sea posible.

## Gate de aceptación

Cero diferencias JSON/decoders/autorización; una evaluación de composición por pedido elegible demostrada con planes; sin debilitamiento de RLS o helper; estabilidad de recursos y ausencia de nuevos deadlocks. Evaluar los p95 propuestos con más muestras y contexto de ejecución representativo; cinco repeticiones solo exploran. Candidato no se aprueba por media ni por mejorar un caso vacío. No ejecutar este protocolo ni instalar candidatos sin autorización expresa.
