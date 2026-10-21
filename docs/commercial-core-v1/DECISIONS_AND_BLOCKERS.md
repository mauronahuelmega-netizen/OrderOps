# Decisiones y bloqueos — Commercial Core V1

Las decisiones de ingeniería de la sección 1 están cerradas para implementar. Los bloqueos de la sección 2 no se cierran en código.

## 1. Decisiones que el agente puede aplicar

| ID | Decisión | Por qué no es una regla económica nueva |
| --- | --- | --- |
| ENG-01 | Esquema `commercial` separado del tenant | Encaje con el repo. La spec pide integrar, no fusionar conceptos |
| ENG-02 | `businesses` es la organización cliente | CC-10. No hay otra entidad de cliente |
| ENG-03 | No extender `profiles.role` | El enum y las RLS de comercio son de otro dominio |
| ENG-04 | Libro `platform_collections` manual en local | No existe suscripción SaaS. La spec manda a inspeccionar la fuente real; la fuente real está ausente |
| ENG-05 | Centavos `bigint` | Precisión. Los montos aprobados se almacenan × 100 |
| ENG-06 | Fail-closed si el bruto ≠ precio congelado | No elige una base alternativa. Se niega a calcular. CC-21 sigue vigente para el caso nominal |
| ENG-07 | Dedup automática solo con teléfono y nombre normalizados iguales, sin fiscal contradictorio | CC-36 prohíbe que teléfono o nombre solos fusionen. El umbral más estricto compatible |
| ENG-08 | Extensión de claim solo manual, con interacción sustantiva de la lista de la spec | CC-06. No define frecuencia mínima nueva: simplemente no automatiza |
| ENG-09 | Confirmación automática solo por demo con `promoter_ref` de promotor activo, sin atribución contradictoria | Único ejemplo inequívoco que da la spec (sección 13.2) |
| ENG-10 | SoD: preparador ≠ aprobador ≠ registrador del pago | Lectura estricta de «separación de funciones». Aflojarla es BLK-SEC-02 |
| ENG-11 | Una cuenta no es miembro de comercio y promotor | Evita mezclar RLS. Aflojarlo es BLK-SEC-01 |
| ENG-12 | `opportunity.win` solo superadmin en V1 | La spec exige usuario autorizado de OrderOps. No se delega a Comercial sin permiso nuevo |
| ENG-13 | Outbox en la misma transacción. Dispatcher aparte. Correo a Inbucket loopback | CC-34 sin proveedor nuevo |
| ENG-14 | Monotributo = documento revisado por interno | No hay API fiscal. No afirma vigencia real ante AFIP |
| ENG-15 | Factura V1 = archivo + importe igual al total aprobado | CC-28 sin ARCA |
| ENG-16 | Unique de una oportunidad abierta por comercio | Evita paralelas del mismo proceso sin impedir oportunidades sucesivas tras `won`/`lost` |
| ENG-17 | Comprobantes en bucket privado | Los buckets actuales son públicos |
| ENG-18 | Setup commission = monto fijo del snapshot, no 40 % de 290_000 | La spec fija ARS 120_000 |
| ENG-19 | Recurrente nominal = `eligible_base_cents * bps / 10000` | 40 % de 55_000 = 22_000, que la propia spec tabula |
| ENG-20 | Fecha prevista de pago = día 10 del mes siguiente o, si se usa como dato, el campo `due_on`. No dispara transferencia | CC-26 y CC-27 |

## 2. Bloqueos abiertos

### BLK-ECO-01 Base comisionable

- Contexto: la spec dice que la comisión recurrente usa la base elegible cobrada, y que OrderOps retiene antes de impuestos y costos. No dice si el 40 % se calcula sobre el neto de IVA, el bruto con IVA, o el precio menos descuento.
- Decisión necesaria: fórmula de `eligible_base_cents` cuando hay IVA, descuento o cargo no elegible.
- Alternativas: (a) bruto cobrado; (b) neto sin IVA; (c) precio de lista menos descuentos explícitos, IVA fuera.
- Recomendación técnica: no elegir. Mantener ENG-06 hasta respuesta humana.
- Riesgo de elegir mal: pagar de más o de menos en cada mensualidad, de forma reproducible y difícil de revertir sin ajustes masivos.
- Fases: P05-T02 en todo lo que no sea el caso nominal G-01..G-08.
- Se puede seguir: modelo, uniques, caso nominal, liquidaciones del caso nominal, CRM, promotores, onboarding.

### BLK-ECO-02 Pagos parciales

- Contexto: una liquidación admite pagos parciales al promotor (CC-27). Una mensualidad del cliente también podría cobrarse en varios movimientos. La spec deja el segundo caso al contrato técnico y dice que un reintento de la misma obligación no es otra mensualidad.
- Decisión necesaria: ¿qué suma de cobros marca la obligación `satisfied` y consume un slot?
- Alternativas: (a) solo el pago único por el total; (b) suma de posted que alcanza el precio de lista; (c) cualquier parcial positivo consume slot y comisiona el proporcional.
- Recomendación técnica: no implementar (c) ni (b) todavía. Un `posted` distinto del precio de lista queda `blocked_pending_policy`. Los parciales de la liquidación al promotor sí se implementan, porque CC-27 los exige y no cambian el contador Founder.
- Riesgo: consumir 12 slots con señas chicas, o no comisionar un mes que el negocio sí quería reconocer.
- Fases: P05-T02, P05-T04.
- Se puede seguir: pagos parciales de `settlement_payments`, fallos y reintentos de transferencia.

### BLK-ECO-03 Ajuste después de pagar al promotor

- Contexto: hay que registrar la diferencia. La spec no dice si se descuenta de la próxima liquidación, si se pide devolución, o si queda como saldo.
- Decisión necesaria: tratamiento contractual del saldo negativo.
- Alternativas: (a) arrastrar el ajuste a la liquidación siguiente; (b) dejar el ajuste visible y no compensar hasta orden humana caso por caso.
- Recomendación técnica: (b) en V1 local. El ajuste se puede incluir en una liquidación solo si Finanzas lo agrega de forma explícita. No hay neteo automático.
- Riesgo de (a) automático: retener plata del promotor sin cláusula usada.
- Fases: P05-T05.
- Se puede seguir: registrar el ajuste y mostrarlo. No autoincluirlo.

### BLK-CRM-01 Actividad calificada fina

- Contexto: CC-06 distingue tarea administrativa de actividad sustantiva y deja frecuencia y autoridad al contrato técnico.
- Decisión necesaria: cuántas interacciones, de qué antigüedad, bastan para extender o para la protección de 90 días.
- Alternativas: (a) una interacción sustantiva alcanza; (b) hace falta un mínimo en los últimos N días.
- Recomendación técnica: una interacción de la lista sustantiva, previa al evento, vinculada a la oportunidad, más autorización interna para la extensión. Es el mínimo que la spec ya distingue de «crear una tarea». No inventar N.
- Riesgo: extensiones débiles o protecciones que no se otorgan.
- Fases: P03-T03, P03-T06.
- Se puede seguir con (a) porque no fija un número de negocio nuevo; si el usuario rechaza (a), la tarea de extensión queda blocked.

### BLK-CRM-02 Unicidad de disputas abiertas por oportunidad

Estado: resuelto el 2026-10-09 por decisión humana. El historial de abajo se conserva.

- Contexto: auditoría post PHASE-03 (AUD-P03-05). El contrato exige expediente con partes involucradas, historial y estados terminales, y admite múltiples disputas históricas. No define si pueden coexistir dos filas `attribution_disputes.status = 'open'` sobre la misma oportunidad, ni si un reintento concurrente debe ser idempotente o denegado.
- Decisión necesaria: (a) como máximo una disputa `open` por `opportunity_id`; (b) varias `open` permitidas si las partes o el motivo difieren; (c) varias `open` siempre permitidas, con deduplicación solo de partes dentro del mismo expediente.
- Recomendación técnica histórica: no inventar (a) ni (b) hasta respuesta humana.
- Resolución: alternativa (a). Máximo una disputa `open` por `opportunity_id`; múltiples disputas históricas no `open` permitidas. El predicado de unicidad usa únicamente `status = 'open'`; `retained` no se considera disputa abierta según este contrato. Unicidad por oportunidad, no por promotor/claim/motivo. Varias partes en el mismo expediente abierto. Tras un estado terminal (`decided`/`closed`), puede abrirse otra. Sin reapertura silenciosa ni alteración de historial. Concurrencia cubierta por índice único parcial.
- Implementación escrita: migración `20261009140600_commercial_blk_crm_02_one_open_dispute.sql` (pendiente de aplicación local cuando el gate pase). Índice `attribution_disputes_one_open_per_opportunity_idx`. RPC `open_dispute` → `dispute_open_exists` sin devolver `dispute_id`.
- Fases: corrección post-auditoría PHASE-03; no reabre P03-T05 como tarea ni inicia PHASE-04.

### BLK-SEC-01 Misma persona, dos mundos

- Contexto: ¿un humano puede ser comercial interno y promotor, o dueño de un comercio y promotor?
- Decisión necesaria: sí o no.
- Alternativas: cuentas distintas obligatorias; permitir interno+promotor con permisos separados; permitir todo.
- Recomendación técnica: cuentas distintas. El trigger de ENG-11 niega promotor si `profiles.business_id` está ocupado. Interno y promotor también son kinds excluyentes en `platform_accounts`.
- Riesgo de permitirlo: un promotor hereda lectura de todos los leads, o un owner se autoatribuye.
- Fases: P01-T02.
- Se puede seguir con el default estricto. No aflojarlo en una tarea posterior sin este BLK cerrado por el usuario.

### BLK-SEC-02 SoD con varios roles

- Contexto: la spec permite varios roles y pide controles adicionales en aprobar y ajustar. No dice qué pasa si la única persona de Finanzas también es superadmin.
- Decisión necesaria: confirmar el default de tres personas distintas, y si la excepción auditada de superadmin es aceptable en local.
- Alternativas: SoD dura siempre; SoD con break-glass; sin SoD en dev.
- Recomendación técnica: SoD dura con break-glass auditado. Los fixtures de E2E-03 usan tres usuarios de prueba, no el break-glass.
- Riesgo de desactivarla en dev: el único camino testeado sería el inseguro.
- Fases: P01-T03, P05-T06, P05-T08.
- Se puede seguir implementando el default.

### BLK-PRIV-01 Plazos de conservación

- Contexto: CC-38 pide plazos por categoría revisados por un abogado. No están en la spec.
- Decisión necesaria: meses o años por leads, contratos, CBU, comprobantes, y si la supresión anonimiza o borra.
- Alternativas: no borrar nada en V1; anonimizar bajo pedido y conservar economía.
- Recomendación técnica: la segunda, ya reflejada en P06-T02. Sin job que borre a los N días.
- Riesgo: retener datos de más, o borrar prueba económica.
- Fases: P06-T02.
- Se puede seguir: archivo lógico de oportunidades inactivas (`archived_at`) porque la spec lo pide como tratamiento, no como plazo.

### BLK-LEG-01 Validación jurídica y contable

- Contexto: sección 40 de la spec. Contrato de agencia, independencia, monotributo, tipo de factura, retenciones, reversas, datos personales.
- Decisión necesaria: textos y validaciones de un profesional. No las produce este repositorio.
- Recomendación técnica: campos y adjuntos, estados `verified` por un humano, sin simular que AFIP respondió.
- Riesgo: operar en producción con un flujo que un contador rechazaría. Aceptable solo en local ficticio.
- Fases: P03-T02, P05-T07. No bloquean el modelo.
- Se puede seguir en local.

### BLK-ENV-01 Destino de la base

- Contexto: `.env.local` fue verificado por el gate. El gate local pasó antes de `20261008215314` y antes de `20261008233833`. Esa evidencia está en `PROGRESS.md`. La memoria viva menciona `supabase.co` para imágenes, así que un gate viejo no autoriza la migración siguiente.
- Decisión necesaria: ninguna de producto. El bloqueo no se cierra de forma permanente.
- Recomendación técnica: volver a ejecutar `node scripts/commercial-core/assert-local-supabase.mjs` antes de cada migración. Si no pasa, no se aplica SQL.
- Riesgo: migrar el proyecto remoto.
- Fases: todas las que aplican SQL.
- No se puede «seguir igual» contra remoto. Un gate anterior en verde no reemplaza el de la sesión que va a migrar.

### BLK-DOC-01 Significado de `product_code`

Estado: resuelto el 2026-10-08. El historial de abajo se conserva.

- Contexto: `PROGRESS.md` tenía `product_code: not_started`. [AUTONOMOUS_EXECUTION.md](AUTONOMOUS_EXECUTION.md) listaba los campos vigentes de ese archivo y no incluía `product_code`. No había otra definición en el paquete.
- Frases cercanas, no equivalentes: `MASTER_PLAN.md` dice que escribir el paquete no autoriza «código de producto». `PHASE-01.md` dice que la implementación de producto de pedidos no fue tocada.
- Decisión necesaria en ese momento: si el campo es el código funcional del Commercial Core, o si es el código del producto de pedidos de OrderOps.
- Resolución: decisión humana del 2026-10-08, sección 4. El nombre se conserva. El campo es solo el código funcional de Commercial Core V1. El valor pasó a `in_progress`. No cubre pedidos ni el producto principal OrderOps.

## 3. Cómo cerrar un bloqueo

El usuario escribe la decisión en el chat. El agente agrega una fila en la sección 4 de este archivo con fecha y texto, y recién entonces cambia el código afectado.

Hasta ese momento el estado es el de `PROGRESS.md`.

## 4. Decisiones humanas registradas

2026-10-08: `product_code` representa exclusivamente el estado de implementación del código funcional de Commercial Core V1. No representa el código del sistema de pedidos ni del producto principal OrderOps. Se conserva el nombre. `BLK-DOC-01` queda resuelto. El valor en `PROGRESS.md` pasa a `in_progress`. PHASE-01 permanece cerrada y P02-T01 no se inicia.

2026-10-08: corrección posterior a la auditoría de PHASE-02. La IP del rate limit es `x-vercel-forwarded-for` solo si `VERCEL=1`. El repositorio despliega en Vercel directo y no documenta un proxy inverso. Vercel documenta ese encabezado como el valor de plataforma y la sobreescritura de `X-Forwarded-For` contra suplantación. No se acepta `x-forwarded-for`. Sin runtime Vercel, sin sal o sin una sola IP en ese encabezado, la solicitud nueva se rechaza. `public.submit_demo_request` queda en `service_role` porque el hash lo calcula el servidor. Los otros wrappers públicos quedan en `authenticated`. `/commercial` redirige a `/commercial/opportunities` después del gate existente. PHASE-03 no se inicia.

2026-10-09: corrección post-auditoría PHASE-03. En ese momento `BLK-CRM-02` quedó abierto. El formulario público `/demo` no captura identificador fiscal; se conserva `fiscal=null` en `find_or_prepare_business` y no se agregan campos CUIT. Storage `commercial-documents` permanece deny-by-default sin policies de objeto. PHASE-04 no se inicia.

2026-10-09: decisión humana. `BLK-CRM-02` queda resuelto: máximo una disputa `status = 'open'` por `opportunity_id`; múltiples expedientes históricos no abiertos permitidos. No se reabre una disputa cerrada ni se altera su historial. La implementación escrita usa el índice único parcial `attribution_disputes_one_open_per_opportunity_idx` y el código `dispute_open_exists`. Migración `20261009140600` creada; aplicación local y PASS SQL pendientes del gate. PHASE-04 no se inicia.
