# Enmienda definitiva de alcance — Estadísticas V1

Fecha: 2026-10-16. Fuente: instrucción del propietario adjunta a esta tarea. Esta enmienda prevalece sobre las menciones anteriores de tres pestañas o de Oportunidades «Próximamente» para el release V1. No reescribe esos documentos, decisiones ni checkpoints. No autoriza implementación.

## Incluido y excluido

V1 tiene exactamente **Resumen** y **Productos** como pestañas principales.

- **Resumen:** Ventas comerciales, Pedidos completados, Ticket promedio, Unidades vendidas, evolución agregada, comparaciones válidas y calidad/cobertura.
- **Productos:** ranking Top 5/Ver más por unidades e ingresos atribuibles; distribución por categorías con dona/leyenda y selector independiente; detalle contextual y lectura descriptiva determinista. Categorías es un panel de Productos, nunca una tercera pestaña.
- **Fuera:** Phase 05 — Oportunidades, recomendaciones comerciales automatizadas, pestaña/placeholder/enlace que sugiera su disponibilidad. Se conserva únicamente como backlog de una versión posterior, sin obligación dentro de V1.
- **Fuera de Phase 04 V1:** Evolución del producto, series individuales, comparaciones temporales por producto, gráfico de líneas, endpoints/consultas para evolución y espacio vacío reservado. Los mockups no amplían el contrato.

Se conservan P01–P04, T00–T06, B1–B6, D04-01/02/03 y P-V01–P-V10. La lectura comercial describe hechos verificados y cobertura; no recomienda precios, promociones, stock ni atribuye causalidad. No se modifica ningún contrato financiero: agreed_total canónico en Resumen; ingresos de Productos solo del subconjunto reconciliado y verificable, sin reparto implícito; unidades principales sin duplicación de upsells; identidad y categoría históricas, sin reconstrucción desde catálogo actual. Sin categoría, Sin atribución fiable y Otras categorías mantienen significados diferentes. Desconocido nunca se convierte en cero.

## Roadmap operativo y gates

| Orden | Trabajo conservando nomenclatura | Dependencia y salida exigida |
|---|---|---|
|1|Resolver **P04-T01C**|Aclarar atributos, respaldos y compatibilidad; permisos separados para SELECT de integridad, intervención loopback, ensayo transaccional y eventual instalación QA. Aislamiento localhost/LAN IPv4/IPv6 e integridad realmente verificados. Hoy BLOCKED.|
|2|Completar **P04-T02–T06**|T00 conserva descubrimiento; T01 contratos y lector revisado, no instalado por esta tarea. T02 shell/ranking; T03 categorías; T04 detalle/lectura sin evolución; T05 estados/accesibilidad; T06 verificación. Cada etapa necesita autorización y evidencia de salida.|
|3|Certificar **Phase 03 — Resumen**|Gate de publicación propio default-closed, permisos efectivos y superficie RPC independiente; E2E no vacío persistido en QA, build, Auth refresh/expiry, ocho períodos, KPI/series, accesibilidad y regresiones. Implementación previa aceptada no equivale a cierre certificado.|
|4|Integrar ambas vistas|Shell y período global de ocho opciones conservados al alternar; dos pestañas exclusivamente. Revisar diff propio para retirar placeholder Oportunidades. Revalidar compatibilidad efectiva con Cursor antes de cualquier integración autorizada; no asumir vigentes sus HEAD/versiones históricas.|
|5|Validación final y preparación de lanzamiento V1|Matriz conjunta funcional, seguridad, RLS, publicación, rendimiento/deuda aceptada, rollback y operación. Revisión y autorización humana separadas para integrar/publicar/habilitar negocios.|

T02: Top 5, Ver más/menos, orden/paginación estables y selección accesible. T03: denominadores auditados, grupos especiales y desglose de Otras, controles independientes. T04: detalle desde agregados disponibles, selección única, lectura con evidencia o neutral. T05: carga/vacío/parcial/error/reintento, respuestas tardías, foco/teclado, móvil y temas. T06: SQL/decoder/transporte/Auth/E2E, dos negocios, roles, ocho períodos, dinero exacto y regresión de Resumen. No se renumeran ni se fusionan tareas históricas.

## Criterios de aceptación de V1

1. Solo dos pestañas; Categorías integrada en Productos y ausencia de Oportunidades en navegación V1. **Pendiente de implementación futura**, no cambiado ahora.
2. Resumen conserva sus cuatro KPI, períodos, jornadas comerciales/nocturnas y comparaciones estructuradas válidas. Productos satisface P-V01–P-V10 sin evolución individual.
3. Totales, denominadores, NULL, reconciliación y cobertura demostrados con datos sintéticos; no atribución inventada ni unión por nombre.
4. Acceso SSR por identidad/negocio originales y roles owner/manager/admin; sin bypass super_admin. Publicación default-closed separada de roles, menú y grants de RPC.
5. QA aislado efectivo, pruebas con datos no vacíos persistidos autorizados, expiración/refresh, cambio de negocio y acceso cruzado denegado. TypeScript/lint/build, teclado, zoom y responsive claro/oscuro verificados.
6. Evidencias reproducibles y aprobación de limitaciones; no SLA declarado. RPC pública original conservada, A+B/D1 privados no adoptados y C no instalada según última evidencia SQL, **sin revalidación SQL en esta tarea**.

Rendimiento avanzado permanece suspendido. Las metas p95 100≤500 ms, 500≤1.000 ms, 1.000≤1.500 ms y 5.000≤3.000 ms siguen pendientes; futuros benchmarks en staging representativo sin datos operativos de producción. La adopción de optimizaciones no se impone como requisito de construcción de Productos ni se da por aprobada para lanzamiento: requiere revisión específica si se propone.

Los documentos FUNCTIONAL_READINESS.md y PHASE04_IMPLEMENTATION_PLAN.md son referencias históricas, no estados live actuales. El gate P03-G1 fue aceptado posteriormente; falta certificar su regresión conjunta. No se cerró Phase 03, no se comenzó T02 y no se modificó aplicación, SQL ni memoria histórica.
