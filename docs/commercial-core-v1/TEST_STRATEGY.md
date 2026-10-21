# Estrategia de pruebas — Commercial Core V1

## 1. Cómo se corre

El repo no tiene `npm test`. Las pruebas nuevas siguen dos carriles.

Carril A — lógica pura, sin base:

```text
npx tsx lib/commercial/<area>/<nombre>.verify.ts
```

Aserciones con `node:assert/strict`. Sin red. El motor de comisiones entra aquí.

Cuando exista un conjunto estable, un script `scripts/commercial-core/verify-all.mjs` recorre esos archivos. Agregarlo es parte de P01-T03, junto con declarar `tsx` en `devDependencies` si el script lo invoca. No se fuerza Jest.

Carril B — SQL contra el stack local que pasó el gate:

```text
supabase test db
```

si el CLI del repo ya ejecuta `supabase/tests`. Si el comando no existe en la versión usada, la tarea documenta el comando real (`psql` al puerto 54322 con el archivo) y lo deja escrito en `PROGRESS.md`. Los archivos viven en `supabase/tests/commercial/`.

Carril C — regresión del producto actual: correr los `*.verify.ts` que no necesitan servicios, como mínimo uno de productos y uno de pedidos que hoy pasen en el árbol, listados en la tarea de la fase. No se exige la suite histórica completa de `docs/` en cada fase. Sí se exige no dejar roto el verify tocado por el guard de catálogo (fase 04).

No hay Playwright en el repo. Los E2E de V1 son escenarios de RPC y SQL con datos ficticios, más un smoke manual del formulario descrito en E2E-01. Si en fase 06 el agente puede abrir el browser local, completa el smoke y adjunta qué vio. Si no hay browser, el criterio SQL igual tiene que pasar y el hueco queda escrito en `PROGRESS.md`.

## 2. Qué cubre cada carril

| Carril | Cubre |
| --- | --- |
| Unitario `verify.ts` | Normalización de teléfono y nombre, máquina de etapas, cálculo nominal, tope de 12, fallo que no consume slot, 15 días, 90 días, 180 días, SoD |
| SQL / RLS | Uniques, checks, inmutabilidad de terms, fusión que no toca atribuciones, políticas de promotor, anon, miembro de comercio |
| Autorización | Matriz de [SECURITY_MATRIX.md](SECURITY_MATRIX.md), sesión revocada |
| Económico | Tabla dorada Founder de abajo. Casos bloqueados no crean comisión |
| Regresión | Actions de producto del owner; permisos de `lib/admin/permissions.ts` sin cambio de comportamiento |

## 3. Tabla dorada nominal

Precios congelados: setup cliente 29_000_000, mensual 5_500_000, comisión setup 12_000_000, 40 % → 2_200_000 por mensualidad nominal. Tope teórico 12 × 2_200_000 + 12_000_000 = 38_400_000 centavos, que son ARS 384_000.

| Caso | Entrada | Resultado |
| --- | --- | --- |
| G-01 | Setup `posted` 29_000_000, onboarding incompleto, día 16 | Comisión setup `pending` hasta onboarding, monto 12_000_000. No ocupa slot |
| G-02 | Igual, onboarding `completed`, día 16 | `available` |
| G-03 | Setup día 10, onboarding completo | Sigue `pending` por ventana |
| G-04 | Excepción de release auditada día 10 con onboarding trabado | `available` solo si el actor es superadmin |
| G-05 | Mensualidad `posted` 5_500_000, onboarding incompleto, día 16 | Recurrente `available`, slot N |
| G-06 | Mensualidad `failed` | Sin slot, sin comisión |
| G-07 | Reintento `posted` de la misma obligación después de un `failed` | Un slot, una comisión |
| G-08 | Doce nominales | Slots 1..12. La 13ª obligación satisfecha no crea comisión recurrente |
| G-09 | Bruto 5_000_000 | `blocked_pending_policy`, sin slot, sin comisión |
| G-10 | Reversa de collection con comisión `pending` o `available` | Comisión `voided` o ajuste negativo; la fila original sigue |
| G-11 | Reversa con comisión `paid` | Ajuste negativo `available`. La comisión pagada no se borra |
| G-12 | Segunda comisión misma collection y `right_kind` | Error de unique |
| G-13 | Segunda liquidación mismo promotor y `period_key` | Error de unique |
| G-14 | Pago sin factura `accepted` | Rechazo |
| G-15 | Dos posts del mismo `idempotency_key` de pago | Una sola suma |
| G-16 | Reactivación día 180 desde `ended_at` con 5 slots | El próximo nominal usa slot 6 y el mismo `conversion_terms` |
| G-17 | Reactivación día 181 | No reabre el contador |

G-09 existe para demostrar el fail-closed. No es una decisión de que 50_000 sea inelegible para siempre. Es la conducta hasta cerrar `BLK-ECO-01` y `BLK-ECO-02`.

## 4. Escenarios E2E

Datos ficticios. Nombres de comercio inventados. Teléfonos `+54911000000xx`. Sin cobro real ni SMTP fuera de Inbucket.

### E2E-01 Captación orgánica

- Precondiciones: fase 02, cero leads con ese teléfono, usuario comercial de prueba.
- Pasos: POST del formulario sin `promoter_ref` (nombre, comercio, WhatsApp, rubro). Repetir con la misma idempotency key.
- Esperado: un `commercial_businesses` canal `organic`, una interacción `demo_request` con ese origen, una oportunidad `new`, un outbox `demo.submitted`, la segunda llamada no duplica. Sin claim.
- Fallo: dos leads, una atribución, o el POST aceptado sin rubro.
- Evidencia: ids en `PROGRESS.md` y salida del test `supabase/tests/commercial/e2e_01.sql`.

### E2E-02 Captación por promotor

- Precondiciones: promotor `active` con `public_code`, fase 03.
- Pasos: demo con `promoter_ref` válido e interés (el propio formulario).
- Esperado: oportunidad, claim que puede confirmarse por la regla automática de referido, `opportunity_attributions.method = automatic_referral`. Ganar exige después un interno y un `businesses` real de prueba. La comisión no aparece.
- Fallo: confirmación sin demo referida, o comisión al ganar.

### E2E-03 Founder completo

- Precondiciones: fases 04 y 05, promotor activo, atribución confirmada, programa semilla.
- Pasos: interno marca `won` contra un `businesses` local; snapshot; cobranza setup nominal; completar onboarding; avanzar el reloj de prueba 15 días (columna `posted_at` fijada en el fixture, no `pg_sleep` de 15 días); preparar liquidación del mes en que queda `available`; otro usuario finance la aprueba; promotor carga factura por el total; finance la acepta; un tercer registro de pago `recorded` con clave nueva.
- Esperado: comisión setup 12_000_000 `paid` solo después del pago. Liquidación no queda `paid` antes. Factura distinta del total no habilita pago.
- Fallo: pago con la misma persona que aprobó, sin excepción auditada.

### E2E-04 Recurrencia

- Doce collections nominales de mensualidad y, intercalados, dos `failed` de obligaciones distintas que luego se reintentan con `posted`.
- Esperado: 12 slots, 12 comisiones de 2_200_000, los fallos no ocupan número, la obligación reintentada ocupa un solo slot. Suma recurrente 26_400_000. Más setup, 38_400_000. Una mensualidad 13 no comisiona.

### E2E-05 Reversa

- Cobranza nominal → comisión → reversa dentro de la ventana → comisión no queda `available`.
- Segundo caso: comisión ya `paid` → ajuste negativo, liquidación histórica intacta, ítem de ajuste en un período posterior.

### E2E-06 Desvinculación

- Promotor con oportunidad abierta, atribución confirmada e interacción `meeting` previa.
- Separar. Esperado: status `separated`, claim nuevo rechazado, grant revocado, oportunidades abiertas reasignadas, comisiones ya creadas siguen, fila `opportunity_protections` de 90 días.
- Otra oportunidad con solo claim `provisional`: sin fila de protección.

### E2E-07 Reactivación

- Cinco slots, `ended_at`, reactivar a los 100 días: slot siguiente 6, mismo terms.
- Otro cliente a los 200 días: la RPC de reactivación protegida no reabre terms. Nueva oportunidad posible, sin copiar el contador.

### E2E-08 Seguridad

- Los casos de la sección 6 de [SECURITY_MATRIX.md](SECURITY_MATRIX.md).
- Incluye promotor que adivina uuid de liquidación ajena.

### E2E-09 Duplicados

- Dos POST simultáneos (dos transacciones) con mismo teléfono y mismo nombre normalizado: un solo lead, dos interacciones o una submission duplicada rechazada por idempotency, orígenes conservados en interacciones.
- Mismo nombre y teléfono distinto: dos leads, ninguno fusionado.
- Mismo teléfono y nombre distinto: estado probable, sin fusión, el promotor no lee la ficha ajena.
- Fusión manual posterior: interacciones del absorbido cuelgan del survivor; `opportunity_attributions` de cada oportunidad conservan su `promoter_id`.

### E2E-10 Onboarding

- Grant aprobado por owner del `businesses` de prueba, `ends_at` a 30 días.
- Promotor edita descripción: persiste.
- Promotor envía precio: rechazo y valor anterior intacto.
- Owner revoca: la siguiente edición de descripción falla.
- Fixture con `ends_at` en el pasado: falla aunque `status` se fuerce. La RPC debe tratar vencido como no activo aunque un update directo haya mentido; el check de tiempo es `now() < ends_at` además del status. Un job puede marcar `expired`, pero la autorización no depende solo del job.

## 5. Trazabilidad CC-01..CC-39

| Decisión | Requisito corto | Módulo | Fase | Tarea | Prueba |
| --- | --- | --- | --- | --- | --- |
| CC-01 | Lead = comercio | CRM | 02 | P02-T01 | E2E-01, E2E-09 |
| CC-02 | Claim ≠ atribución | Atribuciones | 03 | P03-T03 | SQL claim no inserta attribution |
| CC-03 | Confirmación híbrida | Atribuciones | 03 | P03-T04 | E2E-02 y confirmación manual |
| CC-04 | Orgánico y claim tardío | Atribuciones | 03 | P03-T04 | Test: orgánico sin evidencia no confirma |
| CC-05 | Conflictos formales | Disputas | 03 | P03-T05 | Expediente + retención acotada |
| CC-06 | 30 días y extensión no automática | Claims | 03 | P03-T03 | Job/RPC de vencimiento; extensión sin interacción sustantiva falla |
| CC-07 | Atribución en oportunidad | Atribuciones | 03 | P03-T04 | Confirmación sin oportunidad falla |
| CC-08 | Oportunidad por intención | CRM | 02 | P02-T03 | Lead solo no crea oportunidad; demo sí |
| CC-09 | Pipeline flexible auditado | CRM | 02 | P02-T03 | `opportunity_stage_events`; `won`/`lost` reglas |
| CC-10 | Ganada = organización real | Conversión | 04 | P04-T01 | Check SQL y E2E-03 |
| CC-11 | Promotor activo en el proceso | Promotores | 03 | P03-T07 | Panel cubre las secciones de la spec en lectura mínima |
| CC-12 | Permisos delimitados | Seguridad | 03, 04 | P03-T07, P04-T03 | E2E-08 |
| CC-13 | Asistencia con autorización | Onboarding | 04 | P04-T02 | Sin grant no escribe catálogo |
| CC-14 | Solo contenido no sensible | Onboarding | 04 | P04-T03 | E2E-10 precio |
| CC-15 | Aprueba el comercio | Onboarding | 04 | P04-T02 | Owner aprueba; promotor no |
| CC-16 | Hasta 30 días | Onboarding | 04 | P04-T02 | Check `ends_at` y E2E-10 |
| CC-17 | Luego no queda acceso | Onboarding | 04 | P04-T04 | `completed` y `revoked` niegan |
| CC-18 | Comisión nace de cobranza | Comisiones | 05 | P05-T02 | Ganar sin collection no crea comisión |
| CC-19 | Recurrente limitada | Comisiones | 05 | P05-T04 | G-08 |
| CC-20 | 12 exitosas, no 12 meses | Comisiones | 05 | P05-T04 | E2E-04 |
| CC-21 | Porcentaje sobre base elegible | Comisiones | 05 | P05-T02 | G-05 y G-09 |
| CC-22 | Un porcentaje global por programa | Programas | 01 | P01-T02 | Semilla única founder v1 |
| CC-23 | Condiciones Founder | Programas | 01, 04 | P01-T02, P04-T01 | Snapshot inmutable G-01 |
| CC-24 | Setup con cobro, ventana y onboarding | Comisiones | 05 | P05-T03 | G-01..G-04 |
| CC-25 | 15 días y reversas auditadas | Comisiones | 05 | P05-T05 | G-03, G-10, G-11, E2E-05 |
| CC-26 | Cierre mensual AR, pago en 10 días | Liquidaciones | 05 | P05-T06 | Período en `America/Argentina/Buenos_Aires`; comisión que libera el día 2 del mes siguiente no entra en el mes anterior. El «dentro de 10 días» es fecha prevista `due_on` informativa, no un pago automático |
| CC-27 | Transferencia manual | Pagos | 05 | P05-T08 | E2E-03, parcial, fallida, reintento |
| CC-28 | Contrato, monotributo, factura previa | Promotores y facturas | 03, 05 | P03-T02, P05-T07 | Activación sin verificación falla; pago sin factura falla |
| CC-29 | Derechos tras desvincular | Promotores | 03, 05 | P03-T06 | E2E-06; canal de factura sobrevive |
| CC-30 | 90 días si confirmada y actividad | Atribuciones | 03 | P03-T06 | E2E-06 ambos ramos |
| CC-31 | 180 días de reactivación | Suscripción de servicio | 05 | P05-T04 | G-16, G-17, E2E-07 |
| CC-32 | Ajustes, no sobrescritura | Disputas y ajustes | 03, 05 | P03-T05, P05-T05 | E2E-05 |
| CC-33 | Roles múltiples y granulares | Auth | 01 | P01-T02, P01-T03 | Dos roles en una cuenta; SoD |
| CC-34 | Bandeja y correo | Notificaciones | 01 esqueleto, 06 envío | P01-T02, P06-T01 | Outbox en la misma tx; fallo de correo no revierte; E2E-01 evento |
| CC-35 | Formulario breve | Captación | 02 | P02-T04 | E2E-01 campos obligatorios y privacidad visible |
| CC-36 | Dedup híbrida | CRM | 02 | P02-T02 | E2E-09 |
| CC-37 | Tareas | CRM | 02 | P02-T03 | Cierre de oportunidad con tarea `open` falla; vistas hoy/vencidas en panel |
| CC-38 | Archivo y privacidad | Admin | 01 tabla, 06 procedimiento | P01-T02, P06-T02 | DELETE de comisión revocado; anonimización no borra ids económicos |
| CC-39 | V1 por fases | Este paquete | todas | todas | `PROGRESS.md` y definición de hecho |

## 6. Regresión mínima por fase

- Fase 01: `lib/admin` verify existente si hay uno de permisos; si no, un `authorization.verify.ts` nuevo que importe `hasAdminPermission` y fije el mapa actual.
- Fase 04: verify de que `requireAdminPermission("manageProducts")` sigue siendo el camino del owner. Test manual o de action con fixture local de un producto de prueba: el precio del owner cambia; el del promotor no.
- Fase 05: ningún import de `lib/commercial/commissions` hacia `lib/orders` ni hacia tablas `finance_`. Un verify de texto del archivo puede afirmar que el módulo puro no referencia esos símbolos.
- Fase 06: repetir E2E-08 y G-01..G-17.

## 7. Evidencia

Cada tarea done en `PROGRESS.md` copia:

- comando
- código de salida
- fecha
- si usó base local, el host (solo host y puerto, nunca claves)

Sin eso, la tarea sigue `in_progress` o `pending`.
