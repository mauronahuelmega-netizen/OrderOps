# Recomendación

**PERFORMANCE_IMPROVED_WITH_LIMITATIONS; no READY_FOR_ADOPTION_REVIEW.** Mantener RPC pública original y D1 privada. No se logró cumplimiento reproducible de100<=500ms ni completar escalabilidad segura. D1 mejora p50/p95 frenteA+B en los cinco lotes completos, pero el sexto es incompleto y no certificable.

El perfil separadoN50 midióD1 total279.339ms, núcleo210.061ms inclusivos, statistics_can_read3976llamadas/124.868ms propios, source_items50llamadas/44.868ms inclusivos/26.574ms propios, metrics73/41.839ms inclusivos (23puntos esta vez). No sumar tiempos inclusivos. Macro current_facts/product_lines/products/categories83.017ms/5050shared hits; eligible/digests54.986ms, historical_count35.682ms, series47.265ms. El trabajo relacional/RLS es el siguiente frente medido; no basta con invocaciones numerosas para concluirlo: tiempos y planes lo sustentan.

Siguiente experimento propuesto, sin implementar: varianteC del núcleo, relaciones autorizadas MATERIALIZED para completion_items/rankings/categorías, orders/finanzas y conjunto fiable de cobertura histórica. Preservar invoker/RLS por tabla y perfil original; filtrar por negocio verificado y cohortes/IDs autorizados, conservar cobertura global sinasOf/período inventado, LEFTJOIN yNULL, cardinalidad/completion+line-key, ordenarrays/cursor, agreed_total y digest. No quitar policy checks ni usarSECURITYDEFINER. Medir primero una variante solo completion_items y después historical/joins, para atribuir efecto; no agrupar un refactor general.

Antes de prepararSQL nuevo requiere autorización: mapa exacto de expresiones+diff, comparación original/AB/D1/nuevo en mismo snapshot, dosnegocios/seisroles, dinero/NULL/reopen/cancel/recomplete/nocturnas/DST/microsegundos, decoders intactos. Solo aplicar nuevohash aprobado luego de revisión. Mantener15s/3s y metas100500ms/5001000ms/10001500ms/50003000ms.

Para investigar la dispersión: registrar inicio/fin de cada query y actividad/memoria/CPU propia, planes anidados tempranos/tardíos en conexión aparte; repetir el ordencontrabalanceado y asOf fijo. Explorar plan_cache_mode/JIT LOCAL solo como experimento autorizado y separado, sin usarlo para declararPASS con límites cambiados. Hoy no hay causa demostrada para eloutlier9.57s ni para variación de host/caché.

