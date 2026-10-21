# Estadísticas V1 — Deuda de rendimiento

Actualizado2026-10-14. Decisión del propietario: **investigación avanzada suspendida**; retomar únicamente con autorización y staging representativo, datos sintéticos, nunca producción ni datos operativos reales como laboratorio. F.5B no autorizada. No SLA cumplido, candidatos adoptados ni optimizaciones instaladas por este cierre.

## Estado de lectores

| Lector | Estado / evidencia |
|---|---|
|public.statistics_v1_summary|Original activo: wrapper→private.statistics_v1_series_response→legacy. Último catálogo live validado F.4C, ledger124. No se volvió a conectar en esta auditoría documental.|
|A+B privado|Instalado experimentalmente, no adoptado; SHA fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9.|
|D1 privado|Instalado experimentalmente, preferido, no adoptado; SHA9e8b793df40de1aeb6ecbb71c1ce4e828c717498e62340341d8784726ee78070.|
|C|Solo diseño/archivo, no instalado; SHA7d05e3987695f8bfc0e2477d74a38566269c7b6992682e58dbc4c34032f49bb6.|

Fuentes: p03-f2b/, p03-f3c/, p03-f4a/, p03-f4b/, p03-f4c/ y p03-f5a/. No borrar candidatos/evidencias, redirigir RPC, cambiar grants o ejecutar rollback destructivo.

## Evidencia y límites

F.4A: dispersión entre tandas, original100 máximo9.570,334ms; escalamiento detenido. D1100p95 de tandas completas476,775 y606,202ms; tercera incompleta. No certificación de estabilidad ni objetivos. F.3C EXPLAIN y F.4A SELECT local no son poblaciones combinables. HTTP existente no representa flujo SSR con pedidos persistidos no vacíos a50/100.

F.4B: motor Docker/WSL2 compartido4CPU/~7,70GiB, presión ambiental observable; no causalidad probada. Buffers a50 variaron entre tandas sin plan del outlier. No justificar cambios de recursos/JIT por intuición.

F.4C:18 SELECT normales,3por lector/cohorte50/100;6warmups y12perfiles separados. No p95. Source_items9N original frente aN A+B/D1; completion_items50seqscans/2.500tuples a50 frente a100indexscans/100tuples a100. Dentro de grupo, contadores normales iguales con tiempos variables; PSI elevado coincidió con algunas lentas. Perfiles originales muestran literal→parámetro y gates Result, compatible con custom/generic. No dominante causal demostrado. Observador pg_stat_activity con snapshot no refrescado: waits NOT_AVAILABLE; corrección propuesta, no aplicada/repetida. Instrumentación propia altera costo; no sumar inclusive times ni atribuir profiles a SELECT normales.

## Deuda pendiente

Metas p95 exploratorias inalteradas:100≤500ms;500≤1.000ms;1.000≤1.500ms;5.000≤3.000ms. Falta validar estabilidad, concurrencia/MVCC financiero y HTTP representativo; no aumentar timeout para conseguir PASS. Algunas cohortes grandes nunca ejecutadas por gates; registrar omisión, no convertirla en aprobado.

Hipótesis abiertas: scans/RLS/composición repetida, custom/generic y huella física tras rollback, CPU scheduling WSL/host, costo JSON/materialización, overhead de transporte/observador. No evidencia suficiente de JIT, OOM o physical I/O como causa dominante de las consultas lentas ejecutadas; no excluidos para otros escenarios.

## Criterios para retomar en staging

1. Autorización expresa del entorno/hash/alcance; identidad, puertos, redes, volúmenes y credenciales staging independientes, sin producción/negocios reales. No asumir que el stack local es staging representativo.
2. Datos sintéticos realistas: composición/upsells/modificadores, calidad/finanzas mixtas, varios negocios, sesiones nocturnas, fechas y distribución documentadas. Dataset equivalente, snapshot/asOf/revision fijados; registrar filas/páginas/estadísticas/huella física.
3. Seguridad y equivalencia completa antes de performance: cuatro lectores solo si C expresamente instalada allí; arrays/NULL/moneda/errores/RLS sin normalización. RPC pública sin cambio durante comparación.
4. Observador corregido y bajo overhead: UTC/monotonic start/end, CPU/PSI/I/O/memoria por intervalo; planos internos separados; waits válidos. Normal SELECT, EXPLAIN y HTTP separados, tiempos brutos/outliers preservados.
5. Varias tandas y≥20muestras por lector/cohorte solo si seguro; incertidumbre del p95 y concurrencia pactada. Progresión50/100/200/500/1.000/5.000 condicionada a gates. SQL15s/lock3s, latencia≥5s y recursos previos como criterios conservadores; nuevas condiciones requieren revisión, no ajuste silencioso.
6. Preservación y limpieza selectiva comprobable; detener por timeout/equivalencia/acceso/recursos. Sin cache flush, reinicios, config persistente o stress no autorizados.

La adopción optimizada continúa pendiente, **no es prerrequisito automático de Phase04** por la decisión de suspensión. El rendimiento sigue siendo riesgo de integración/lanzamiento; no se cierra Phase03 ni se libera comercialmente por registrar esta deuda.
