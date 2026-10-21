# Commercial Core V1 — plan maestro

Fecha de este paquete: 2026-10-08.

Estado: planificación persistida. Ninguna fase de producto está implementada.

Punto de entrada para una sesión nueva de Cursor. Leer este archivo, después [EXECUTION_RULES.md](EXECUTION_RULES.md), después [PROGRESS.md](PROGRESS.md), después el `PHASE-0N.md` de la tarea vigente.

## Objetivo

Commercial Core OrderOps V1 funcional en entorno de desarrollo local aislado.

Circuito:

Captación → Lead → Oportunidad → Atribución → Conversión → Onboarding → Cobranza → Comisión → Liquidación → Factura → Pago.

No es objetivo de este paquete: producción, datos reales, pagos reales, correos reales, despliegue.

## Fuentes y precedencia

1. Comportamiento de negocio: [FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md) (CC-01 a CC-39, versión 1.0, 8 de octubre de 2026).
2. Qué existe hoy: el código, las migraciones y [REPOSITORY_AUDIT.md](REPOSITORY_AUDIT.md).
3. Cómo construirlo: [ARCHITECTURE.md](ARCHITECTURE.md), [DATA_MODEL.md](DATA_MODEL.md), [SECURITY_MATRIX.md](SECURITY_MATRIX.md).
4. En qué orden: [IMPLEMENTATION_PHASES.md](IMPLEMENTATION_PHASES.md) y [phases/](phases/).
5. Cómo probarlo: [TEST_STRATEGY.md](TEST_STRATEGY.md).
6. Cómo retomar el trabajo: [AUTONOMOUS_EXECUTION.md](AUTONOMOUS_EXECUTION.md).
7. Qué no puede inventarse: [DECISIONS_AND_BLOCKERS.md](DECISIONS_AND_BLOCKERS.md).
8. Conducta del agente mientras implementa: [EXECUTION_RULES.md](EXECUTION_RULES.md). Si choca con el protocolo de sesión o con un «se puede seguir», mandan las reglas de ejecución.

Si una frase de este paquete contradice la especificación funcional en una regla económica o de permisos, gana la especificación y se registra el conflicto en `DECISIONS_AND_BLOCKERS.md`. Si una frase describe el código actual y el archivo ya no coincide, gana el archivo y se corrige la auditoría.

## Índice

| Documento | Uso |
| --- | --- |
| [REPOSITORY_AUDIT.md](REPOSITORY_AUDIT.md) | Inventario verificado, reutilización, riesgos |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Límites de dominio, eventos, integraciones |
| [DATA_MODEL.md](DATA_MODEL.md) | Tablas, claves, estados, invariantes de base |
| [SECURITY_MATRIX.md](SECURITY_MATRIX.md) | Actor, recurso, operación, condición, RLS |
| [IMPLEMENTATION_PHASES.md](IMPLEMENTATION_PHASES.md) | Roadmap y definición de hecho |
| [phases/PHASE-01.md](phases/PHASE-01.md) | Fundaciones y seguridad |
| [phases/PHASE-02.md](phases/PHASE-02.md) | Captación y CRM |
| [phases/PHASE-03.md](phases/PHASE-03.md) | Promotores y atribuciones |
| [phases/PHASE-04.md](phases/PHASE-04.md) | Conversión y onboarding |
| [phases/PHASE-05.md](phases/PHASE-05.md) | Comisiones, liquidaciones y pagos |
| [phases/PHASE-06.md](phases/PHASE-06.md) | Consolidación local |
| [TEST_STRATEGY.md](TEST_STRATEGY.md) | Pruebas y matriz CC-01..CC-39 |
| [AUTONOMOUS_EXECUTION.md](AUTONOMOUS_EXECUTION.md) | Protocolo de sesión |
| [EXECUTION_RULES.md](EXECUTION_RULES.md) | Límites duros del agente autónomo |
| [DECISIONS_AND_BLOCKERS.md](DECISIONS_AND_BLOCKERS.md) | Bloqueos y defaults de ingeniería |
| [PROGRESS.md](PROGRESS.md) | Estado real de ejecución |

## Decisiones de ingeniería ya cerradas en este paquete

Estas decisiones reconcilian la especificación con el repositorio. No cambian precios ni plazos aprobados.

- El Commercial Core es un dominio de plataforma en el esquema Postgres `commercial`. No es un módulo por `business_id` del comercio cliente.
- La organización cliente real es la fila existente `public.businesses`. No se crea una segunda tabla de clientes.
- `profiles.role` y [lib/admin/permissions.ts](../../lib/admin/permissions.ts) no absorben roles internos ni promotores.
- La caja del pedido (`order_financials`, `finance_*`, `settle_order_financials`) no es la fuente de cobranzas SaaS. V1 local registra cobranzas de plataforma en `commercial.platform_collections`.
- Importes en `bigint` centavos ARS. Programa Founder congelado al convertir: implementación 29_000_000, mensualidad 5_500_000, comisión setup 12_000_000, recurrente 4000 bps, 12 posiciones, ventana 15 días calendario, onboarding hasta 30 días, protección post-desvinculación 90 días, reactivación 180 días.
- El motor económico calcula el caso nominal definido por la spec. Si el bruto no coincide con el precio congelado, o hay parcial, descuento o IVA sin política, la cobranza queda `blocked_pending_policy` y no consume posición.
- Deduplicación automática solo con teléfono normalizado y nombre normalizado iguales, sin identificador fiscal contradictorio. Teléfono solo, o nombre solo, va a revisión.
- Extender una reclamación no es automático. Exige un usuario interno autorizado, un motivo y una interacción sustantiva. Una tarea no alcanza.
- Separación de funciones por defecto: quien prepara una liquidación no la aprueba; quien aprueba no registra la transferencia. Excepción de superadmin con motivo auditado.
- Una misma cuenta `auth.users` no es miembro de un comercio (`profiles.business_id` no nulo) y promotor a la vez.
- Correo de V1 local solo hacia Inbucket en loopback. Comprobantes en bucket privado `commercial-documents`.
- Migraciones comerciales solo después de [scripts/commercial-core/assert-local-supabase.mjs](../../scripts/commercial-core/assert-local-supabase.mjs) (tarea P01-T01) demostrando API en `127.0.0.1:54321`.

## Reglas que el agente no puede reinterpretar

Constantes aprobadas: ARS 290_000 implementación, ARS 55_000 mensualidad, ARS 120_000 comisión setup, 40 % de las primeras 12 mensualidades elegibles cobradas, 15 días de seguridad, 30 días de reclamación y de onboarding, 90 días de protección de oportunidad, 180 días de reactivación, cierre en `America/Argentina/Buenos_Aires`, pago previsto en los primeros 10 días calendario del mes siguiente.

Invariantes INV-01 a INV-18 de la especificación, sección 35, son criterios de aceptación. Están repetidas en [DATA_MODEL.md](DATA_MODEL.md) donde la base debe garantizarlas.

## Cómo empezar la implementación

La escritura de este paquete no autoriza código de producto.

Cuando haya un pedido explícito de implementar:

1. Seguir [AUTONOMOUS_EXECUTION.md](AUTONOMOUS_EXECUTION.md).
2. Abrir [phases/PHASE-01.md](phases/PHASE-01.md).
3. Ejecutar solo P01-T01. Esa tarea comprueba el destino local y no aplica migraciones.
4. Detenerse si el gate no es loopback (`BLK-ENV-01`).

## Definición de V1 local terminada

Las diez condiciones de la especificación, sección 38, cumplidas en local, con E2E-01 a E2E-10 de [TEST_STRATEGY.md](TEST_STRATEGY.md) en verde, y sin haber tocado un proyecto Supabase remoto.
