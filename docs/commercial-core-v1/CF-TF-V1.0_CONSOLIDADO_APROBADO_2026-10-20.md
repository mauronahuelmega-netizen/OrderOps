# ORDEROPS — CF-TF-V1.0
## Contrato funcional consolidado y roadmap de implementación — Talo First V1

**Versión:** CF-TF-V1.0-CONSOLIDADO-2026-10-20  
**Estado:** `FUNCTIONAL_DECISIONS_APPROVED / IMPLEMENTATION_NOT_AUTHORIZED / PRODUCTION_BLOCKED`  
**Decisiones:** 29/29 cerradas (TF 9/9, H 9/9, P0 6/6, P1 5/5).  
**Carácter:** especificación normativa funcional para que Cursor **audite, contraste y planifique**. No autoriza cambios de código, migraciones, despliegues, operaciones bancarias ni acciones productivas.

> **Trazabilidad documental.** El archivo original `ORDEROPS_TALO_FIRST_V1_CONTRATO_FUNCIONAL.md` no pudo localizarse en el repositorio ni en la ruta previa comunicada por Cursor. Este documento es una **reconstrucción consolidada** de las decisiones aprobadas expresamente durante esta conversación, del texto literal de P1.5 recuperado de una lectura anterior aportada por Cursor y del roadmap de auditoría proporcionado por Cursor (`cursor/commercial-core-v1-integration` HEAD `8717e62`, según informe, **no revalidado en este documento**). No debe presentarse como copia textual íntegra del original ni adjudicarle texto no comprobado. Cursor deberá reconstruir trazabilidad contra contratos vigentes antes de implementación.

---

## 0. Alcance, prioridades y lenguaje de cumplimiento

**V1:** Talo Pay con CVU persistente por negocio, acreditaciones mediante lectura autenticada, activación Founder, renovaciones prepagas, comisiones y slots existentes, conciliación supervisada, control de acceso operacional, notificaciones **dentro** de OrderOps y Billing & Invoices con facturas fiscales emitidas **externamente** y registradas de forma segura.

**V1.X:** Mobbex real, tarjetas, suscripciones de tarjeta, emails automáticos, integración fiscal electrónica automatizada si se autoriza, y otras capacidades diferidas. Preservar T09.1–T09.3 existentes (synthetic Mobbex) sin presentarlos como productivos. T07, T09.4 y mecanismos de correo transaccional pasan a V1.X.

**No objetivos de V1:** saldos automáticos a favor, wallet, combinación automática de transferencias parciales, devoluciones bancarias automáticas, remoción de deuda histórica o edición retroactiva de asientos cerrados, obligaciones generadas para todos los períodos ofrecidos, reintentos de cobro de tarjetas, emisión fiscal interna ficticia, uso del webhook como prueba suficiente de acreditación.

**Niveles de autoridad:**

1. `APROBADO_FUNCIONAL`: las 29 decisiones de este documento.
2. `PENDIENTE_VERIFICACIÓN_TÉCNICA`: contratos, semántica real de funciones, API/infraestructura y pruebas necesarias para implementarlas correctamente.
3. `BLOQUEO_PRODUCTIVO`: requisitos externos y T14/T15; no se levantan automáticamente con este documento.

Un PASS en sandbox o QA **no equivale** a aprobación productiva. Cursor no puede inferir autorización de implementación ni despliegue de la existencia de este archivo.

## 1. Contrato económico Founder y calendario

- **Activación Founder:** ARS 290.000, **incluye el primer mes de uso**; no crear obligación mensual adicional, slot ni comisión mensual para ese primer período. Comisión de activación del promotor: ARS 120.000 conforme contrato existente, separada de la recurrencia.
- **Suscripción Founder:** ARS 55.000 por período mensual, abonado mediante transferencia al CVU persistente del negocio. Imputación por **importe bruto** nominal, nunca por el neto descontadas las comisiones de Talo. La tarifa/fee productivo real de Talo sigue sin verificar.
- **Promotor, mensualidades elegibles:** ARS 22.000 por mes acreditado y elegible, **máximo 12 slots** por negocio según PHASE-05. El primer mes incluido y los días puente no consumen slots ni generan comisión recurrente. Mantener reglas originales de atribución, auditoría y no duplicación.
- **Aniversario fijo:** día anclado al comienzo del servicio mediante el contrato `founder_period_on` (CC-C19), con ajuste al último día válido de meses cortos cuando corresponda. Los pagos tardíos **no desplazan** el aniversario.
- **Zona horaria contractual:** `America/Argentina/Buenos_Aires`, con instantes almacenados inequívocamente (`timestamptz`/UTC y representación local cuando corresponda).
- **Renovación prepaga:** los períodos no renovados se extinguen, sin generar por sí solos deuda recuperable; conservar operaciones históricas cerradas. No abrir mensualidades económicas simplemente por enviar avisos de renovación.

**Ejemplo canónico:** período 16/10–16/11. La renovación es ofrecida desde el 06/10 a las 00:00 hora BA. Si no está cubierta, hay gracia del 16/10 al 22/10 inclusive y suspensión desde el **23/10 a las 00:00 BA**. El período siguiente conserva comienzo 16/11. No generar otra gracia automáticamente si el negocio permanece suspendido y sin cobertura nueva.

## 2. Matriz cerrada de decisiones funcionales TF (9/9)

| ID | Decisión aprobada, obligatoria para V1 |
|---|---|
| **TF-01** | Confirmación automática de cobros mediante `GET` autenticado a Talo, evidencia durable, vínculo verificable al negocio, moneda y estado. Webhooks solo disparan lectura; casos anómalos a conciliación. |
| **TF-02** | Renovaciones **prepagas**; sin deuda mensual acumulada; períodos impagos expiran y aniversario original permanece fijo. |
| **TF-03** | Abrir oferta de renovación y emitir aviso **T−10** días calendario antes del aniversario. **Enmienda posterior aprobada P1.1:** V1 notifica solo dentro de la app; email automático a V1.X. La facturación fiscal se rige por P0.5. |
| **TF-04** | Trabajos automáticos con actor auditable `system`, privilegios estrictamente acotados y ejecución privilegiada solo del lado servidor. No ampliar permisos financieros a roles tenant. |
| **TF-05** | La comisión y slot mensual se devengan al **inicio efectivo del período pagado**; si el período ya comenzó al imputar, el devengo ocurre cuando la imputación queda confirmada. Sin comisión por períodos impagos, primer mes incluido o puente. |
| **TF-06** | Gracia de **7 días completos** desde el aniversario; suspensión a las 00:00 BA del aniversario+7; cortar nuevos pedidos en backend, preservar historial y finalización de pedidos previos; reactivar automáticamente ante pago válido imputado. |
| **TF-06.1** | Puente excepcional: negocio suspendido dentro de la ventana **T−10** puede elegir explícitamente pagar el **próximo período** y recuperar acceso inmediatamente hasta su inicio, por máximo 10 días; no se modifica aniversario ni se genera slot/comisión por puente. Frecuencia y reversas según P0.1/P1.5. |
| **TF-07** | Billing & Invoices completo para Owner y Manager, lectura de CVU, pagos, períodos y documentos; solo Owner modifica datos fiscales; Operator/Viewer reciben información operativa genérica sin datos financieros privados. Añadir `viewBilling` independiente. |
| **TF-08** | Endpoint HTTPS estable en dominio desplegado Next.js/Vercel, inbox durable, worker de consulta autenticada; no crear clientes productivos con URL provisional ni dar valor económico a un webhook no autenticado. |

## 3. Matriz cerrada de compatibilidad H (9/9)

| ID | Enmienda/decisión aprobada | Contrato o módulo afectado |
|---|---|---|
| **H1 = A** | Sustituir expresamente CC-C14: vencimiento 16 implica suspensión **23** a las 00:00 BA, no el 24. | CC-C14, T11, pruebas de borde. |
| **H2 = A** | Sustituir semántica de “deuda mensual pospaga” en CC-C13 y textos relevantes por **oferta de período cobrable prepago**; solo enmiendas acotadas, sin cambiar importes ni borrar registros históricos. | CC-C13, `ensure_founder_monthly`, T09-T1/T2. |
| **H3 = B** | Los 15 días de disponibilidad de comisión recurrente se cuentan desde el **devengo efectivo**, no desde el pago anticipado. | PHASE-05 availability (`posted_at`), control de fechas. |
| **H4 = A** | Suspendido **fuera** de T−10: una transferencia nominal, autenticada y de único destino elegible cubre automáticamente el **período vigente** y reactiva; no mueve el aniversario. | T09-T2, T11. |
| **H5 = A** | Suspendido **dentro** de T−10, con período actual y siguiente potenciales: si no hay intención válida, `reconciliation_required`, sin imputación ni puente automáticos. | T09-T2, `renewal_intents`, T10. |
| **H6 = A** | Negocios legados sin términos Founder requieren **exención específica, autorizada y auditable**; la falta genérica de términos no exime automáticamente. Inventariar/migrar existentes sin bloquearlos indebidamente. | T11, migración P1.3. |
| **H7 = B** | Crear **evidencia separada** para `provider_read` autenticado (p. ej. `provider_read_evidence`) conservando estructura y CHECK de atestación manual T08-B. Adaptar ruta segura de confirmación y prohibir falsificar atestaciones. | T08-B, `confirm_provider_receipt`, T08-D. |
| **H8 = A** | Apertura de `platform_obligations` **just-in-time** al imputar transferencia válida, con `ensure_founder_monthly` + `record_collection` atómicos e idempotentes. La oferta T−10 no genera obligación `open`. | T09-T1/T2, CC-C13. |
| **H9 = A** | Una `renewal_intent` válida, única por negocio, junto con **una única acreditación nominal elegible** permite imputar el período elegido. Duplicados, ambigüedades, intentos vencidos a conciliación. Expiración corta (~72h) **propuesta técnica, no parámetro aprobado**. | T09-T2, T10, T11. |

**Nota de coherencia H4/H5/H9:** no es obligatorio que un pago ordinario tenga intención. Es necesaria cuando hay destinos múltiples y para solicitar el puente. El CVU identifica un destino de fondos, no prueba que el remitente eligió un período; no inferir correlación de pago a partir de monto solamente en casos ambiguos. Una misma intención no debe consumir dos recibos por carrera.

## 4. Matriz cerrada de políticas P0 (6/6)

| ID | Decisión aprobada |
|---|---|
| **P0.1 = A** | Máximo **un puente cada 12 meses móviles por negocio**, computado desde la concesión real de acceso; auditoría e inmutabilidad ante cambio de Owner. Si ya se usó, permitir pagar próximo período pero activar solo al inicio, sin puente. Reversa de un puente efectivamente usado no restaura cupo automáticamente (P1.5). |
| **P0.2 = A** | Cobros duplicados, parciales, excedentes o de destino incierto: **conciliación supervisada**; sin saldo a favor automático ni cobertura/comisión/slot hasta resolución válida. Devolución por proceso autorizado y documentado. |
| **P0.3 = A** | Regreso tras meses expirados: cobrar únicamente **período vigente elegible**, sin cobrar períodos anteriores ni mover aniversario; no dar otra gracia periódica por meses sin cobertura. Dentro de T−10 rigen puente/intención/conciliación. Informar fin de cobertura antes de transferir. |
| **P0.4 = A** | Fecha económica = **fecha autoritativa de acreditación verificada por Talo**; almacenar por separado verificación e imputación. No habilitar acceso sin verificación autenticada. Si API no ofrece fecha confiable, **conciliación/definición técnica, no timestamp inventado**. |
| **P0.5 = A** | **Emisión fiscal externa supervisada** en V1, comprobantes válidos emitidos por ARCA o herramienta autorizada, registrados en Billing & Invoices, archivos privados y entrega conforme requisitos legales. Integración fiscal automática y email automático de entrega a V1.X. Validación contable/fiscal previa a producción. |
| **P0.6 = B** | **Lanzamiento comercial general** una vez aprobados T14/T15 y todos los bloqueos, **sin piloto comercial obligatorio**. No significa permiso para desplegar o cobrar ahora. Pruebas productivas controladas y aprobación humana de producción siguen siendo necesarias. |

## 5. Matriz cerrada de políticas P1 (5/5)

| ID | Decisión aprobada |
|---|---|
| **P1.1 = ajuste V1** | **Solo notificaciones internas** (sin emails automáticos V1): aviso T−10, recordatorio T−3, aviso de gracia T+3, suspensión T+7, confirmación de pago/reactivación y reversa. Actualizar conforme al estado efectivo; campana y banners contextuales visibles. Owner/Manager ven detalles financieros; Operator/Viewer avisos genéricos. Notificaciones de facturas vía plataforma, entrega manual legalmente válida si corresponde. Emails automáticos a V1.X. |
| **P1.2 = A** | Reembolsos y pagos no nominales por **conciliación y devolución manual auditada**, sin wallet ni devolución automática. Objetivo interno: primera revisión en 1 día hábil, resolución o escalamiento ordinario hasta 5 días hábiles, sin prometer acreditación bancaria ni desplazar plazos legales. Ajustes de comisiones liquidadas conforme BLK-ECO-03, **sin neteo automático indebido**. |
| **P1.3 = A** | Migración **prospectiva y auditada**: conservar registros económicos históricos cerrados, coberturas ya pagadas, slots y comisiones; fecha explícita de entrada en vigor por negocio; exención legacy autorizada hasta regularización. No recalcular ni borrar pasado para que “encaje” en prepago. |
| **P1.4 = A** | Suspensión bloquea **todo pedido nuevo** de cualquier canal, pero permite terminar, entregar, cancelar y gestionar financieramente pedidos ya aceptados, incluso programados a futuro, sin límite artificial de tiempo. No agregar nuevas ventas disfrazadas de modificaciones ni reabrir indefinidamente pedidos finalizados. |
| **P1.5 = A** | **Reversa efectiva y autenticada** antes de aniversario: revocar cobertura/puente asociado, salvo otra cobertura válida; mantener finalización de pedidos previos, comunicar dentro de app. Una mera solicitud de devolución o evento no confirmado no revoca. Cancelar devengo diferido antes del período; posterior, ajustar auditablemente, sin neteo automático de comisiones ya liquidadas. Puente ya disfrutado **consume** cupo anual pese a reversa, salvo excepción humana autorizada. |

**P1.5 literal original aportado por Cursor:** “P1.5 Uso del puente frente a devolución/cancelación: revocar o mantener el acceso puente y qué informar si se revierte la transferencia antes del aniversario”. La política anterior es la resolución aprobada de esa pregunta, no una cita literal del resto del contrato original.

## 6. Semántica operacional del servicio

### 6.1 Ciclo normal

- `renewal_offer`/ventana disponible desde T−10: **no** es obligación fiscal ni cobro ni asiento exigible.
- Renovación nominal imputada en período corriente o siguiente: obligación just-in-time y cobranza durables, idempotentes.
- `active` si existe período actual efectivamente cubierto (incluido primer mes) **sin reversa invalidante**, o puente válido.
- `grace` solo si el período inmediatamente previo estaba realmente cubierto y estamos dentro de los siete días completos posteriores al aniversario sin renovación. No reiniciar gracia por cada nuevo aniversario mientras el negocio permanece suspendido.
- `suspended` fuera de cobertura/gracia/puente: restringir creación de nuevos pedidos **en el backend**; aún se pueden terminar compromisos aceptados.
- Pago tardío fuera de la ventana futura de un suspendido: puede cubrir período actual aunque haya perdido días; **mostrar fecha final de cobertura**. Dentro de ventana futura, intención inequívoca o conciliación.
- `expired` es una condición derivada de fechas, no una deuda ni una obligación abierta por cada mes impago.

### 6.2 Puente

Si suspendido y la ventana del siguiente período está abierta, el Owner/Manager elige explícitamente el siguiente período/puente. Se valida intención y pago único nominal. El puente comienza al activar tras verificación, termina al empezar el período pagado, **máximo 10 días**. No afecta aniversario ni comisión. Un negocio no puede obtener otro puente hasta transcurridos 12 meses móviles desde el beneficio concedido. Si no hay cupo de puente, se permite comprar cobertura siguiente **sin acceso antes del aniversario**, comunicado claramente. Un puente revertido después de haberse disfrutado consume cupo. Una reversa autenticada cancela el puente y recalcula acceso.

### 6.3 Pedidos

Identificar e interceptar **todos** los caminos de creación: catálogo público, mostrador, teléfono, WhatsApp, APIs, RPC u otros presentes en el código. Bloquear carritos/solicitudes aún no aceptados al confirmarse durante suspensión. Preservar pedidos ya confirmados aun cuando la fecha programada sea posterior; permitir transiciones y finanzas asociadas sin que editar un pedido genere nuevas ventas. Aplicar límites server-side/RLS/RPC de verdad, no solamente ocultar controles. Evitar que políticas por negocio suspendido rompan la lectura y finalización de pedidos previos.

### 6.4 Timestamps y carreras

Registrar por separado `provider_credited_at`, `verified_at`, `imputed_at` (nombres **conceptuales**, confirmar contra esquema existente), más fechas efectivas de acceso, reversas y devengos. El instante de iniciación bancaria no reemplaza acreditación. Si la lectura autenticada llega después de medianoche, tomar la fecha económica certificada por Talo para elegibilidad de la operación; **reactivar solo al verificar**. Si una reversa confirmada llega tarde, recalcular la cobertura actual y ajustar devengos sin reescribir hechos históricos ni fingir pedidos que no pudieron ingresar durante suspensión temporal. Coordinar locks/constraints para dos recibos, dos workers, una intención, una obligación.

## 7. Modelo de evidencia, pagos, conciliación y devoluciones

### 7.1 Flujo de verificación

`webhook Talo (no confiable) → inbox durable deduplicado → worker autenticado Talo GET → validación de customer_id, transaction_id, entorno, ARS, PROCESSED, bruto/neto, tenant y timestamp disponible → evidencia provider_read separada → confirmación segura → decisión de imputación → activación/devengo diferido o conciliación`.

No afirmar `X-Talo-Signature` como verificado: el informe de sandbox lo deja pendiente. No reutilizar falsamente `operator_attestation` para pruebas de API. Asegurar que el camino real `confirm_provider_receipt` o su wrapper **consuma** la evidencia nueva de manera segura. Webhook sin firma autenticada jamás prueba movimiento económico.

### 7.2 Unicidad y contabilidad

- Recibo único por `(provider, environment, provider_customer_id, transaction_id)` o clave real equivalente validada.
- Cobranza única por idempotency key vinculada al `receipt_id`.
- Obligación una por `(business_id, period_key)` donde el contrato lo exija, creada y satisfecha junto con el cobro válido.
- Devengo diferido uno por `collection_id`; comisión/slot bajo índices/contratos económicos existentes.
- Intención de renovación activa como máximo una por negocio; una sola transferencia puede consumirla, con exclusión frente a carreras.
- Una recepción duplicada de webhook nunca produce segundo cobro.
- Distinguir bruto cobrado, neto liquidado y tarifa del proveedor; verificar fees productivos, sin trasladar accidentalmente costo al promotor.

### 7.3 Conciliación

`pending_review` para consultas a Talo transitoriamente no concluyentes; `reconciliation_required` para pagos no nominales, duplicados, destinos ambiguos, intención vencida, fecha no fiable o reversas y excepciones. Finanzas resuelve con permisos restringidos y hechos auditables, sin imponer una deuda por meses expirados. No permitir devengos, slots ni acceso nuevo por movimientos en conciliación. Devoluciones manuales requieren comprobante y verificación del destinatario; no construir wallet.

**BLK-ECO-03:** si un pago revertido ya generó comisión o fue liquidado al promotor, no borrarla ni netearla automáticamente con futuras comisiones. Registrar hechos y ajustes verificables, sujetar proceso humano/contractual pendiente a validación.

## 8. Incompatibilidades concretas que Cursor debe analizar (sin asumir solución desplegada)

| Contrato/código en informe anterior | Riesgo y respuesta funcional autorizada |
|---|---|
| `CC-C14` vs TF-06 | Ejemplo anterior suspendía día 24, nuevo día 23. **H1:** enmienda documental explícita y tests exactos. |
| `CC-C13` y plan pospago anterior | Apariencia de deuda/FIFO/obligaciones mensuales al vencer. **H2/H8:** período cobrable, apertura just-in-time, no abrir mensualidad impaga, sin ediciones históricas retroactivas. |
| PHASE-05 `satisfy_subscription_collection` + `accrue_commissions_for_collection` | Slot y comisión ocurrían al cobrar. **TF-05/H3:** devengo diferido; **auditar** si llamadas diferidas toleran fechas, causación y reversas. Si requieren enmienda PHASE-05, documentarla y obtener autorización técnica antes de aplicar. |
| PHASE-05 disponibilidad por `posted_at + 15 days` | Comisión anticipada liberada demasiado pronto. **H3:** computar desde `accrued_at` efectivo para recurrencias, no alterar comisión de setup sin contrato. |
| T08-B `provider_receipt_evidence` CHECK | Solo atestación manual, `provider_api_verified=false`. **H7:** tabla nueva de evidencia API; nuevo camino de confirmación sin adulterar T08-B cerrado. |
| `impute_provider_receipt` | Se reporta que solo resuelve setup ARS 290k; mensualidad en conciliación (`subscription_due_not_defined`). **L5:** nuevo `system_impute_subscription_receipt`, no redefinir setup. |
| `reverse_collection` | Según lectura reportada **no reabre** obligación revertida. **P1.5:** cobertura jamás depende solo de `platform_obligations.status='satisfied'`; considerar reversas en ledger y auditar integración con slots. |
| `service_subscriptions` | Estados de PHASE-05 no modelan gracia ni suspensión contractual. **T11:** calcular elegibilidad por período y cobertura, no usar `service_subscriptions.active` como criterio suficiente. |
| `public.create_order` sin gating | Permitiría crear órdenes tras suspender. **P1.4:** inventario de todos los canales, gate backend, excepciones limitadas para pedidos anteriores. |
| Tenants legacy sin términos Founder | Gate indiscriminado suspendería operaciones históricas. **H6/P1.3:** concesiones `legacy_exempt` explícitas, auditadas y limitadas; nuevos sin contrato/bypass bloqueados. |
| `commercial.notifications.recipient_account_id` | Refería a `platform_accounts`, no a perfiles del negocio. **P1.1:** avisos IN-APP tenant-aware; no emails V1; destino por `profiles` y autorización real. |
| `lib/admin/permissions.ts` y Billing ausente | Falta `viewBilling` y área de lectura. **TF-07:** crear permisos explícitos y RPC tenant-safe. |
| Mobbex T09.1–T09.3 (sintético) | Preservar para V1.X; no poner tarjeta, Mobbex ni `no_retry` en ruta crítica V1. |
| Talo `webhook_url` de sandbox/temporal | No está verificada mutabilidad; clientes productivos solo tras dominio/URL definitivo y credenciales aprobadas. |
| API de Talo timestamp de acreditación | **P0.4:** identificar campo real y semántica, o conciliación; nunca inventar a partir del webhook/worker. |
| Fiscal y privacidad | PDF cargado internamente no constituye emisión fiscal. Definir circuito externo real, almacenamiento privado, plazos y acceso por rol; bloquear producción si no cumple. |

**Importante:** los hallazgos anteriores son **informes previos de Cursor**, no una auditoría de código ejecutada por este documento. Revalidar HEAD, rutas, SQL, permisos y datos reales antes de afirmar compatibilidad.

## 9. Roadmap V1 corregido: L0–L10 (PLAN, NO EJECUCIÓN)

**Regla de entrega por lote:** informar rama/HEAD, precondiciones, artefactos, migraciones nuevas si correspondieran, SQL tests con `ROLLBACK`, pruebas de carrera/idempotencia, controles de RLS/grants, tipos, actualización de documentación y riesgos residuales. No tocar instalaciones productivas ni worktree smoke. El QA indicado en el informe previo era `supabase_db_orderops-phase06-qa:56722` (**revalidar antes de cualquier conexión**).

| Lote | Alcance y entregable verificable | Precedencia |
|---|---|---|
| **L0 — Compatibilidad y auditoría documental** | Localizar contratos vigentes, producir enmiendas CC-C13/14, aprobación H1/H3/H7, revisar PHASE-05, `reverse_collection`, inventariar todos los canales de orden, legado y schema de receipts/fecha, crear mapa de aceptación y autorización de lotes. **Solo documentación/plan** en esta fase. | Primero. |
| **L1 — T08-E actor system** | Wrappers `service_role`-only, actor `system`, `SECURITY DEFINER` controlado, `search_path` fijo, grants revocados, audit correlation. No `collection.write` a tenant. | Tras L0; antes de L3–L8. |
| **L2a — T08-C CVU persistente** | Alta idempotente por negocio ganado y entorno, customer ID estable, protección entre tenants, pruebas sandbox. Producción prohibida antes de URL final y aprobaciones. | Tras L0; coordinado con L2b. |
| **L2b — T08-F webhook + inbox** | HTTPS Next.js/Vercel estable, límites, dedup, retry durable, rate limiting; el handler no confirma ni imputa dinero. Verificación de firma pendiente; lectura autenticada siempre imprescindible. | Tras L0; en paralelo con L2a si seguro. |
| **L3 — T08-D provider-read** | Worker `GET` autenticado, datos `PROCESSED`/ARS/customer/tenant/gross/net, fecha económica autoritativa si existe, evidencia separada H7, confirmación segura, retry y conciliación. | L1 y L2. |
| **L4 — T09-T1 calendario prepago** | Función pura calendario BA anclado con `founder_period_on`, T−10, gracia 7 días, sin reapertura mensual automática, sin obligación anticipada, pruebas de 28/29/30/31 y bisiestos. | L0/L1; antes de L5/L6/L8. |
| **L5 — T09-T2 intents + imputación** | `renewal_intents`, una activa por negocio, vencimiento corto por parametrizar, destino único validado, ARS 55k bruto, obligación+collection atómicos, idempotencia y reconciliación de ambiguos; setup sin cambios. | L3/L4. |
| **L6 — T09-T3 devengo diferido** | Cola por collection y período pagado; primer mes y puente sin slots; comisión a inicio del período o al imputar si ya comenzó; 15 días desde devengo, reversas antes/después, cap 12. Auditoría de compatibilidad PHASE-05. | L5. |
| **L7 — T10 conciliación** | Consola supervisada de no nominales/duplicados/reversas/fecha dudosa; permisos de Finanzas, resolución auditada, registro de devoluciones manuales y comprobantes, objetivos de revisión/escalamiento. | L3/L5 y políticas P0/P1. |
| **L8 — T11 access/gating/puente** | `business_service_access` derivado, una gracia si período anterior cubierto, gate en todas las vías, excepciones legacy auditables, terminar pedidos existentes, puente un año móvil y revocación P1.5. Sin cron como autoridad de acceso. | L4–L7. |
| **L9 — T12 Billing & Invoices** | `viewBilling` Owner/Manager, CVU y períodos, intenciones explícitas, avisos 100% internos, historial, suspensión y consulta de pedidos existentes, registro fiscal de documentos válidos emitidos externamente, Storage privado. **Sin integración email V1.** | L8 (pueden prepararse contratos UI antes, no habilitar prematuramente). |
| **L10 — T14/T15 QA integral y liberación condicionada** | E2E de todos los escenarios, seguridad RLS/grants, fallos, cron detenido, concurrencia, reversas, activos legacy, PHASE-05, fiscal/privacidad, rollback; resultados de sandbox vs prod separados; verificación productiva Talo y autorización explícita. **P0.6=B: sin piloto comercial obligatorio**; si gates completos, apertura general autorizable. | Todos los anteriores. |

**Preparación de árbol de trabajo:** no cambiar de rama en el árbol `cursor/promoter-panel-smoke-ux` si está sucio. Una vez que el usuario autorice implementar, preparar **worktree separado** basado en `cursor/commercial-core-v1-integration` luego de verificar HEAD, estado remoto, cambios locales y backups. No ejecutar `git reset --hard`, `clean`, migraciones ni alteraciones de la pila smoke.

**Planes anteriores revocados o modificados:** T09-T1 **ya no** abre obligaciones al vencimiento; T09-T2 **ya no** aplica FIFO de deuda vieja; T11 **ya no** se basa en cron diario para cambiar estado de acceso; T12 **ya no** incluye emails automáticos; T14/T15 **no** imponen piloto comercial obligatorio, aunque sí aceptación productiva y aprobación humana. Versionar explícitamente estas sustituciones en L0.

## 10. Matriz de pruebas de aceptación obligatorias

El contrato original referenciado por Cursor contiene 18 escenarios numerados, pero su texto íntegro original no está disponible. En L0 **recuperar/reconstruir con evidencias** los 18 y vincularlos a lotes sin afirmar reproducción literal. El informe previo asignó: 1–3 L5/L6, 4–7 L8, 8–9 L5/L8, 10–11 L4, 12–14 L3/L5/L7, 15 L9, 16 L9/RLS, 17 L6, 18 L8.

Escenarios mínimos adicionales (propuestos a partir de decisiones aprobadas):

| Caso | Resultado requerido |
|---|---|
| CVU creado dos veces con mismo negocio | Un solo customer/provider link, sin fuga entre tenants. |
| Notificación webhook duplicada, fuera de orden o falsa | Sin segunda cobranza ni comisión; verificación por GET autentificado. |
| Transferencia ARS 290k setup | Sin segundo cobro setup, con primer mes incluido, sin slot mensual; comisión de activación bajo reglas previas. |
| ARS 55k T−10 renovado | Cobertura futura; ningún devengo o slot antes del aniversario. |
| ARS 55k durante período iniciado | Imputación período correcto, devengo al confirmar si ya empezó. |
| Período 16/10 sin pago | Gracia 16–22/10, gate nuevas órdenes desde 23/10 00:00 BA. |
| Cron detenido tres días | Mismo rechazo desde 23/10 00:00 BA. |
| Suspendido sin pagar meses | Sin deudas acumuladas ni nuevas gracias en cada aniversario. |
| Suspendido 25/10, único destino | Cobertura 16/10–16/11, reactiva y conserva aniversario. |
| Suspendido 10/11 sin intención | Conciliación por destino ambiguo, sin activar. |
| Suspendido 12/11 con intención y cupo | Cobertura futura 16/11–16/12, acceso puente 12–15/11, sin comisión puente. |
| Segundo puente antes de 12 meses | No concede cortesía; pago del siguiente período habilita en su inicio. |
| Dos recibos simultáneos para una intención | Uno puede imputarse, el otro conciliación; no dos cobros/slots. |
| Intención vencida o sin timestamp autoritativo | No autoasignar por tiempo inventado, conciliación controlada. |
| 50k/60k/dos pagos de 55k | Sin pago parcial automático ni saldo; conciliación con evidencia. |
| Reversa pre-inicio | Puente revocado, devengo diferido cancelado, sin comisión/slot. |
| Reversa post-inicio con comisión liquidada | Histórico preservado, ajuste auditable sin neteo futuro automático. |
| Puente disfrutado y luego revertido | Cupo anual consumido, a menos que excepción humana autorizada. |
| Pedido antes de suspensión, entrega futura | Puede concluirse; no aceptar nuevos ni sumar artículos como ventas nuevas. |
| Tenant legacy autorizado sin términos | No bloqueado; tenant nuevo sin términos ni excepción sí bloqueado. |
| Visibilidad Owner/Manager | CVU y facturas visibles solo a roles autorizados; Operator/Viewer sin datos privados. |
| Fiscal | Comprobante externo válido registrado en almacenamiento privado, permisos y entrega conforme obligaciones legales. |
| Email V1 | Ningún proveedor email automático requerido ni flujo obligatorio; avisos internos independientes de login. |
| Aprobación productiva | QA y evidencia prod verificables; no hay liberación ni cobro hasta aprobación humana, sin piloto comercial obligatorio. |

**Pruebas de carreras:** trabajador duplicado, receipt duplicado, reversa concurrente a devengo, impute/reverse concurrentes, creación de pedido y corte simultáneos, refresh/suspensión en sesiones persistentes; preservar invariantes económicos. Probar recuperación ante cortes y reintentos con la cola durable.

## 11. Bloqueos, incógnitas y condiciones de producción

### 11.1 Bloqueos estrictos (no quedan aprobados automáticamente)

| Bloqueo | Qué se debe demostrar antes de producción |
|---|---|
| **Talo productivo** | Habilitación de cuenta, términos comerciales/tarifario y límites, disponibilidad y custodia de fondos, funcionamiento real de CVU, reversas, reintentos, URLs, firma y acceso API. |
| **Webhook/infra** | Dominio HTTPS real estable, seguridad del endpoint, recuperación, autenticación de lectura y separación sandbox/producción, sin clientes con túnel temporal. |
| **BLK-LEG-01 fiscal** | Responsable emisor, facturación externa legalmente válida, momento de emisión, número/CAE cuando corresponda, entrega/puesta a disposición y respaldo contable; revisión profesional. |
| **BLK-PRIV-01 privacidad** | Política de conservación, acceso, borrado cuando corresponda, protección de documentos y movimiento bancario, RLS/Storage. |
| **BLK-ECO-01/02** | Tratamiento contable de bruto/neto/fee, parcial/excedente/duplicado/reversa y ausencia de saldo automático. Contratos económicos existentes preservados. |
| **BLK-ECO-03** | Ajustes de comisión ante reversa/desembolso ya hecho, garantías sin neteo indebido y procedimiento humano auditable. |
| **L0 + QA** | Conflictos con PHASE-05/T08-B/CC-C, funciones reales, vistas y canales de pedidos, 18 escenarios del contrato reconciliados, pruebas no ambiguas. |
| **T14/T15 y autorización** | PASS reproducible, seguridad, QA aislada, documentación y revisión humana antes de despliegue/cobros. |

### 11.2 Incógnitas técnicas a investigar en L0, no nuevas decisiones funcionales implícitas

- Si el API real de Talo entrega fecha autoritativa de acreditación (y su semántica); verificar firma `X-Talo-Signature`, posibilidad de actualizar `webhook_url` y lógica de retries. Estado actual histórico reportado: **sin verificar**.
- Si `satisfy_subscription_collection` requiere `posted_at` o un instante de cobranza para crear slot/suscripción; si no tolera devengo diferido, preparar propuesta de migración aditiva aprobable, sin alterar PHASE-05 silenciosamente.
- Si `reverse_collection` deja `platform_obligations` en `satisfied`, qué prueba define cobertura vigente y qué hacer con `service_subscriptions` y comisiones ya generadas.
- Política temporal concreta de `renewal_intent`: 72h fue recomendación de diseño, **no aprobación de duración**; proponer con pruebas de boundary/delayed bank settlement.
- Cadencia exacta y persistencia de avisos internos T−10/T−3/T+3/T+7, sin generar falsos “enviados” por no haber usuarios en sesión; visibilidad al regresar al panel.
- Inventario exhaustivo de todas las rutas/RPC para crear pedidos y el modelo de edición con límites bajo P1.4.
- Cómo asegurar migración controlada por tenant y exención legacy auditable sin convertirse en excepción universal.
- Contratos y SLA internos de revisión y devolución, reconciliación fiscal entre reversas y comprobantes emitidos, si el proveedor permite devoluciones (V1 manual).

## 12. Indicaciones para Cursor: próxima acción permitida (solo planificación)

**Objetivo de la siguiente sesión:** hacer un **L0 PLAN-ONLY**, no construir aún L1–L10.

1. Reconocer este documento como **decisiones funcionales cerradas** y registrar divergencias del plan anterior; no editar contratos económicos originales directamente sin producir un diff de enmiendas explícitas.
2. Verificar git status/branches/HEAD y worktrees, sin tocar el árbol `cursor/promoter-panel-smoke-ux`; verificar rutas a QA sin conectarse para escrituras.
3. Buscar fuentes reales (contratos comerciales, migraciones y funciones citadas), informar cualquier discrepancia y sugerir cambios aditivos. El contrato original extraviado **no** puede ser declarado cotejado.
4. Preparar mapa de impacto SQL/TS/RLS/API/UI y secuencia L0–L10 con criterios PASS/FAIL verificables, pruebas que faltan y riesgos regresivos en PHASE-05/Etapa 1/T08.
5. Presentar **propuestas, diffs documentales y planes**, sin aplicar ni ejecutar nada. Detenerse y solicitar autorización expresa del usuario para cada fase/lote de implementación.
6. Tratar P0.6=B correctamente: lanzamiento general elegible tras T14/T15 y gates, **no** piloto comercial obligatorio; producción siempre requiere aprobación humana.

**Regla final:** el contrato funcional está cerrado en sus 29 decisiones; **el diseño técnico, la comprobación del código, la QA y las condiciones productivas NO están cerrados**.
