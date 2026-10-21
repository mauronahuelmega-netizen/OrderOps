# P03-A — Revisión correctiva

Veredicto: **READY_FOR_ISOLATED_SQL_REVIEW**. Es un estado de revisión del SQL propuesto, sin autorización ni ejecución de P03-B. Cero conexiones a bases/API, cero migraciones aplicadas y cero commits nuevos en esta revisión. Rama `codex/estadisticas-v1`, worktree `OrderOps-Estadisticas`.

## Diff mínimo y corrección

`corrective.diff` compara los cuatro archivos corregidos con sus bytes anteriores conservados en `baseline/`; también incorpora la nueva suite offline. La migración completa actual está en `../p03-a/migration.diff`. El manifiesto `verification.json` registra hashes antes/después, pruebas y limitaciones; sustituye las evidencias anteriores para estos archivos.

El uso de `least` **se conserva** porque su cota es correcta. Se corrigen los techos de dimensionamiento y generación usando `div` sobre microsegundos enteros. Esto evita depender del redondeo de divisiones `numeric` en los umbrales y elimina la multiplicación `3600*v_step` en `integer`, que podía desbordar con duraciones físicas de aproximadamente 68 años. El producto nuevo utiliza `numeric`. El generador recibe límite `-1` antes de generar si no está en modo sesión; no depende del optimizador para descartar un plan horario durante el fallback.

No cambian firma, grants, autorización, fuente de hechos, métricas monetarias ni predicates de pertenencia. El helper TypeScript ya utilizaba cocientes BigInt exactos; solo se añade su explicación formal. Contrato y decoder quedan intactos.

## Demostración de la cota

Sea H = 3.600.000.000 microsegundos y L el número de pares explícitos. En modo sesión se exige 1 ≤ L < 200 y una duración positiva para cada lado presente. Para cada par, dᵢ = max(duración actual, duración anterior), considerando cero únicamente para el **lado ausente**, nunca para un importe desconocido. T = Σdᵢ, M = ceil(max dᵢ/H), P = ceil(T/((200−L)H)) y S = min(M, max(1,P)).

Si S=P: N=Σceil(dᵢ/(SH)) < T/(SH)+L ≤ (200−L)+L = 200. Por integridad, N≤199. Si S=M<P: cada dᵢ≤MH y dᵢ>0, por lo que cada par genera exactamente un punto y N=L≤199. El techo entero `(a+b−1) div b` es exacto para a,b enteros positivos; la suma y los productos SQL se calculan en `numeric`, sin desbordamiento de enteros pequeños. Los extremos UTC admitidos, años 1–9999, también mantienen S dentro de `integer`.

Esta demostración abarca todas las duraciones y distribuciones admitidas, no depende de la muestra de pruebas. 199 es alcanzable; 200 pares no entran al plan horario y activan agrupación por jornada. La representación diaria preserva los mismos hechos por fecha comercial, sin atribuirlos a sesiones nuevas. El límite público sigue siendo ≤200. Los modos calendario y fuera de sesión conservan sus guardas y el chequeo final existente de límite y pertenencia única.

## Límites y conservación

| Caso | Regla revisada |
|---|---|
| Apertura de sesión | Incluida mediante `at >= start` |
| Límite interno | Excluido del intervalo anterior, incluido en el siguiente |
| Cierre de sesión | Incluido solamente en el último intervalo de esa identidad de sesión |
| Corte parcial `asOf` | Incluido; `asOf + 1µs` queda fuera del cohort de origen |
| Sesiones que se tocan | La identidad congelada de sesión impide pertenencia doble en el mismo instante |
| Lado más corto o ausente | No se genera observación después de su extremo; comparación no disponible cuando corresponde |
| Medianoche fuera de sesión | Extremo civil exclusivo; fecha local congelada determina la jornada |
| Fallback por jornada | Fechas disjuntas y exhaustivas sobre el cohort ya filtrado; no inventa intervalos de sesión |

La generación usa `ceil(dᵢ/(SH))` exacto, no añade un punto de longitud cero en cierres exactos y conserva el microsegundo residual. Cada lado presente cubre [apertura, extremo observado] con intervalos contiguos positivos, internos semiabiertos y terminal cerrado. La guardia SQL existente exige exactamente una pertenencia por `(side,id)`, igual cardinalidad que el cohort y reconciliación con los totales legacy; falla explícitamente si no se cumplen. La precisión de PostgreSQL y sus operadores de intervalos todavía requiere validación runtime.

## Pruebas y resultados

- Suite nueva `series-sizing.verify.ts`: **PASS**, 1.118 conjuntos, 1.895.743 aserciones, 1.197.144 sondas de límites y máximo observado 199 puntos. Incluye 1–201 sesiones cortas, duraciones desiguales, exposiciones parciales, lados ausentes, duraciones extremas, techos de 199/200, ±1µs, noches y sesiones que se tocan. Modela el algoritmo/predicado; no ejecuta PostgreSQL ni la RPC.
- Suite de contrato/decoder: **PASS**, 268 aserciones y cinco fixtures; casos DST y zonas horarias se conservan.
- Dominio legacy: **PASS**, 1.111 casos monetarios y verificaciones de períodos/DST; lector legacy: **PASS**.
- Parser offline: **PASS**, 11 sentencias de migración y 11 consultas/cuerpos SQL embebidos; migraciones anteriores y todos los archivos de pruebas SQL aceptados. No compila PL/pgSQL contra un catálogo.
- TypeScript completo `--noEmit --incremental false`: **PASS**. ESLint del verificador estático: **PASS**.
- SQL sintético preparado, **no ejecutado**: 597 combinaciones de dimensionamiento, techos con residuo de 1µs y pertenencia nocturna en apertura/límite interno/terminal/corte. Se agrega al archivo de pruebas existente bajo sus guardas de aislamiento y autorización.

Durante preparación, el parser detectó un paréntesis incorrecto del nuevo generador y un alias SQL que necesitaba `AS`; ambos se corrigieron antes del resultado final. La primera comprobación TypeScript incluyó accidentalmente la copia baseline `.ts` como fuente; se conservó como `.ts.txt` y la comprobación final pasa. No hubo ejecución de ninguno de esos SQL.

## Compatibilidad legacy

El cuerpo de `private.statistics_v1_summary_base` permanece byte a byte idéntico al antiguo `public.statistics_v1_summary`, con SHA-256 `e09061ad5f75d9e100143271dd590b488c4dfa4fe48c1b273437abad7bfbb5d7`. Firma, defaults y retorno también son iguales. La RPC pública añade solamente `series` al objeto base.

La prueba runtime existente usa datos sintéticos no vacíos de dos tenants y tres roles autorizados, ocho períodos, y evalúa base/RPC en **el mismo SELECT** antes de exigir `new - 'series' = old`. El verificador estático ahora comprueba que son las dos expresiones de una sola sentencia SELECT y que permanece la aserción JSON. Ambas funciones STABLE comparten snapshot y corte `statement_timestamp()` de la sentencia. **No se afirma igualdad JSON runtime** hasta ejecutarla en el entorno aislado con autorización expresa.

## Archivos, hashes y riesgos restantes

Código corregido: migración comparativa; comentario de `series-temporal.ts`; verificador estático; pruebas SQL propias. Código nuevo: `series-sizing.verify.ts`. Documentación/evidencias propias: este paquete, aviso de actualización del informe anterior, diff completo y manifiestos/evidencias regenerados. Ningún archivo compartido fue editado. Se preservan los cambios observados al inicio en `fase-01-evidencia.json`, `next-env.d.ts` y los adjuntos/auditorías sin seguimiento.

La revisión no valida compilación de PL/pgSQL, RLS runtime, planes MVCC reales, concurrencia, rollback ni rendimiento/EXPLAIN. Las duraciones extremas prueban aritmética offline, no garantizan que la instancia pueda ejecutar el camino legacy preexistente con esos datos. La referencia local de Cursor puede estar desactualizada; no se inspeccionó ni alteró su worktree. No cambia el inventario de cinco funciones ni los permisos. Se necesita aprobación expresa del hash actualizado, verificación adversarial del entorno independiente y ejecución de las pruebas preparadas antes de afirmar compatibilidad runtime o avanzar.

**Detención:** paquete preparado para revisión; P03-B/C/D/E, bases compartidas, producción, interfaz e integración permanecen fuera del trabajo realizado.
