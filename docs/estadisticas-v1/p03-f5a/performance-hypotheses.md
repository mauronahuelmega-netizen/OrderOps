# Hipótesis y alternativas

| Alternativa | Causa / diseño | Beneficio y riesgo | Decisión |
|---|---|---|---|
| A: líneas autorizadas compartidas | Cuatro sitios completion_items → authorized_completion_items MATERIALIZED | Menos accesos y policies por relectura; hipótesis. Copia O(líneas ventana), spills/plan/orden posibles | C propuesto, impacto aislable |
| B: compartir orders/completions/finance aún más | AB eligible ya compartido; histórico tiene universo distinto | Nuevo reúso requiere separar histórico global y cohortes, podría retener todo el historial o alterar cobertura | No cambiar sin evidencia de costo por join |
| C: eliminar guards repetidos | can_read 124,868 ms propios, pero policies + entradas directas protegen distintas superficies | Eliminar podría ampliar acceso; no autorizado. Materialización reduce repetición de acceso, conserva barreras | No suprimir guards/policies |
| D: histórico | count global 35,682 ms / 2.654 hits | Futuro anti-join equivalente usando índices existentes; sin plan diferencial, no beneficio probado; nunca limitar por período | Deferido, intacto |
| E: sumas por producto preagregadas | ruleEvidence correlacionado recorre CTE por identidad | Puede reducir O(P×L), pero agrega riesgo group/order/NULL, más memoria | Experimento posterior si C demuestra este residual |
| F: relacional sin JSON roundtrip | jsonb_populate_recordset | Costo aislado no demostrado; cambio amplio del núcleo interno | Deferido |

Materialización almacena i.* de la ventana actual más anterior válido, no todos los históricos lógicamente. SELECT base puede usar PK(completion_id,line_key), índice statistics_completion_product(business_id,product_identity) o un scan completo; EXISTS correlacionado con UNION ALL puede perjudicar decorrelación. Antes de otra variante evaluar EXPLAIN real: loops, rows removed, scans, temp blocks, CTE rows y costo RLS. El ahorro puede ser pequeño o negativo cuando pocos productos y muchas líneas. No se promete reducción a una llamada de autorización por pedido ni un porcentaje de mejora.

Memoria: work_mem aplicable por operador, cada consulta concurrente multiplica tuplestores/hash/sort; C suma una copia relacional a JSON effectiveFacts existente. O(L × ancho_fila) retenido, sin cifra inventada; medir ancho promedio, RSS máximo backend, temp read/write blocks y waits. No aumentar work_mem/timeouts para mejorar resultados. MATERIALIZED puede impedir pushdown específico por producto, contrapeso a menos lecturas base.

MVCC: funciones STABLE mantienen lecturas con snapshot de la sentencia invocadora; no escribir ni cachear entre consultas. Una transacción REPEATABLE READ fija además igualdad entre lectores separados. No tratar lecturas de distintas sentencias READ COMMITTED como mismo snapshot. Cambios financieros concurrentes deben verse íntegramente antes/después, con capturas y guards intactos.

No existe medición C. La dispersión F.4A y outlier original 9.570 ms carecen de causa demostrada. No deducir que retirar 124,868 ms de un perfil instrumentado permitiría alcanzar p95 normal ≤500 ms. Metas se mantienen: 100≤500 ms; 500≤1.000; 1.000≤1.500; 5.000≤3.000. Son exploratorias, no SLA local ni producción.
