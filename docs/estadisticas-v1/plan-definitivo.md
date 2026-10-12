# Estadísticas V1 — referencia aprobada de implementación

Fecha: 12/10/2026, America/Buenos_Aires. Base: `0e430b08342b638b02392927ed560ea5e0950403`.
Worktree exclusivo: OrderOps-Estadisticas; rama: codex/estadisticas-v1.

## Autoridad y estado

El usuario aprobó la especificación funcional V1 y el plan definitivo presentado en el chat, incluidas B1–B6. Posteriormente autorizó **solo Fase 01**: contratos, baseline, documentación, scripts/configuración exclusivos, fixtures sintéticos y preparación/inicio de Supabase independiente. **No autoriza nuevas migraciones de Estadísticas, patches compartidos, Fase 02, merge, rebase, push ni deploy.** Los commits locales deben incluir únicamente archivos propios.

Esta referencia incorpora las decisiones finales y reemplaza propuestas contradictorias del documento de auditoría inicial. Fuentes: especificación funcional adjunta, auditoría contrastada y decisiones expresas del usuario. No se agregan funciones excluidas.

## Decisiones fijadas

| ID | Contrato |
|---|---|
| B1 | Total acordado autoritativo; descuentos/ajustes/envío identificables y reconciliables. Diferencias no justificadas explícitas, sin reparto silencioso ni fallback a total nominal. |
| B2 | Unidades/ranking por unidades solo principales. Upsells aportan importe una vez, preservando identidad; extras/modificadores no son unidades. |
| B3 | Jornada de sesión verificada de última finalización, fecha de apertura y timezone conservados. Sin sesión fiable pero con finalización fiable: fecha local y «Fuera de sesión verificada». Sin fecha fiable: excluir de períodos y advertir cobertura. |
| B4 | owner/manager/admin heredado, tenant autorizado. operator/viewer excluidos; super_admin sin bypass automático. |
| B5 | Estructuras propias; captura transaccional, idempotencia, integridad referencial, ciclos/reaperturas/cancelaciones explícitos. Snapshots no sustituyen autoridades operacionales. |
| B6 | Supabase local nuevo, puertos/volúmenes/red exclusivos y datos sintéticos. No reutilizar OrderOps ni ledger-rebuild. |

## Orden y entregables

| Fase | Objetivo / dependencias | Archivos y contratos | Esquema / tareas | Pruebas / aceptación / riesgos / avance |
|---|---|---|---|---|
| 01 autorizada | Cerrar contratos, baseline y entorno exclusivo. Depende de las decisiones fijadas. | docs/estadisticas-v1; scripts/statistics-v1; supabase/statistics-v1-test; fixtures propios. Contratos detallados en contratos-tecnicos.md. | Diseñar estructuras sin aplicarlas. Preparar identity gate, reconstruir solo las 119 migraciones del commit base y usuarios sintéticos en entorno verificado. | Gate adversarial, Auth/RLS baseline, migraciones base y verificaciones existentes. Riesgos: puertos, Docker, reconstrucción heredada. Avance solo con revisión y autorización expresa de Fase 02. |
| 02 no autorizada | Captura, cuatro métricas y comparaciones. Depende de 01 y aprobación del diseño/superficies compartidas. | lib/statistics contracts/periods/comparisons/server; tests propios; tipos compartidos mínimos. | Migraciones NUEVAS de snapshots, triggers y RPC; aplicar únicamente tras revisión en entorno aislado. | Ciclos, rollback, concurrencia, fechas, importes, roles y dos tenants. CA-04/05/10/11/14. Riesgos: locks, timeline, ledger. Avanzar cuando captura y agregación sean fiables. |
| 03 no autorizada | Resumen accesible. Depende de API estable de 02. | app/admin/(protected)/statistics; components/admin/statistics; presenter; CSS modules. Nav/permiso compartidos requieren aprobación. | Ocho presets, selector, cuatro tarjetas, SVG/tabla accesible, requestKey/AbortController y estados. Sin esquema adicional. | Flujo browser/API/DB, respuestas desordenadas, mobile/teclado, vacío/parcial. CA-01/02/03/06/12. Avanzar con coherent snapshot y sin regresión del dashboard. |
| 04 no autorizada | Productos/categorías históricos. Depende de snapshots y Resumen. | products.ts y componentes/verificaciones propios; extensión RPC aditiva. | Ranking 5/continuación20, identidad no textual, reparto identificable y categorías históricas/desconocidas. | Borrado, rename, reclasificación, upsells, residuos y cambio de revisión. CA-07/08/14. Riesgo de doble conteo. Avanzar con sumas reconciliadas. |
| 05 no autorizada | Seis reglas y aceptación integral. Depende de calidad exacta/comparables. | opportunities.ts, cards, runner, pruebas SQL/E2E e informe propios. | Motor determinístico, consolidación, máximo3 y misma destacada en Resumen; sin esquema adicional. | Umbrales/muestras/empates, seguridad, responsive, rendimiento y regresión. CA-09/13/15 y CA-01–15 completos. QA faltante no es PASS. Integración requiere permiso separado. |

La documentación de diseño no constituye implementación de ninguna fase futura. Los objetos propuestos no deben existir en la base durante Fase 01.

## Integración controlada

1. Fijar HEADs finales de ambas ramas y diff compartido actualizado.
2. Revisar tipos, roles originales, entrada de navegación, firmas RPC, locks y triggers; no regenerar archivos completos.
3. Reservar versiones únicas de migraciones; conservar bodies/checksums de archivos históricos.
4. Con autorización, preparar checkout/rama de integración independiente, nunca el worktree de Cursor.
5. Rebuild y actualización incremental del árbol combinado en otra instancia aislada.
6. Ejecutar regresiones de ambos dominios, incluyendo catálogo editado por Promotores y ventas históricas inmutables.
7. Merge/push/migraciones compartidas/deploy tienen autorizaciones diferenciadas. Ninguno se deriva de aprobar este plan.

Los detalles de datos, dependencias y ejecución se mantienen en contratos-tecnicos.md, diseno-persistencia.md, dependencias-cursor.md y fase-01-informe.md.
