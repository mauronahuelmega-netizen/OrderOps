# ORDEROPS — Commercial Core + Panel de Promotores V1
## Especificación funcional de decisiones de cierre · CC-C01 a CC-C16 y CC-C18

**Revisión:** 2 · 17 de octubre de 2026. Sustituye el precio diferenciado de la revisión 1.  
**Estado documental:** DECISIONES DE PRODUCTO APROBADAS · **IMPLEMENTACIÓN POR CONTRASTAR CON CÓDIGO**  
**Fecha de consolidación:** 17 de octubre de 2026  
**Ámbito:** Commercial Core V1 y Panel de Promotores V1; facturación de los servicios que OrderOps vende a sus negocios clientes.  
**Destino:** Cursor, modo Plan, auditoría diferencial en solo lectura.  
**No es autorización para:** implementar código, modificar bases de datos, cambiar proveedores, usar credenciales reales, hacer deploy o activar cobros.  
**Documento precedente:** `docs/commercial-core-v1/FUNCTIONAL_SPEC.md`, en especial las decisiones CC-01…CC-38, más las especificaciones existentes del Panel de Promotores y los documentos de auditoría/QA. Esta especificación **complementa y delimita** la V1, no sustituye la revisión del repositorio. Cuando exista conflicto, identificarlo explícitamente; no improvisar una reinterpretación silenciosa.

---

## 0. Propósito y reglas de interpretación

El objetivo es **congelar el alcance funcional** de Commercial Core y del Panel de Promotores en V1 y entregar a Cursor una fuente única de las **16 decisiones de cierre confirmadas por el responsable del producto**. Se requiere una **auditoría diferencial**: contrastar requisitos con implementación actual; identificar lo que ya funciona, el delta indispensable y lo que se posterga a V1.X.

**Distinguir rigurosamente:**

1. **Decisión aprobada:** intención funcional de producto, confirmada en conversación.
2. **Implementado:** código o migraciones comprobadas en el repositorio.
3. **Verificado:** pruebas ejecutadas y evidencia funcional; inspección del código no equivale a E2E.
4. **Dependencia externa:** capacidad contractual o técnica de Mobbex/Talo Pay, homologación o política contable/legal pendiente.
5. **Restricción de seguridad propuesta:** detalle de implementación que debe respetar la decisión de producto, pero cuya viabilidad técnica todavía debe auditarse.

La auditoría previa reportó **43/48 unidades ponderadas (90%) de implementación y 42/48 (88%) de verificación de reglas**, sumando 38 decisiones comerciales y 10 capacidades gastronómicas. **Esos porcentajes corresponden al alcance anterior**, no incorporan los dos procesadores de pagos ni sustituyen pruebas autenticadas de punta a punta. No reutilizarlos como porcentaje actualizado sin nueva metodología.

## 1. Tabla maestra de decisiones aprobadas

| ID | Opción aprobada | Alcance V1 |
|---|---|---|
| CC-C01 | **B** · Panel de promotor propio de consulta | Autenticación; negocios, oportunidades, conversiones, comisiones y pagos visibles según permisos |
| CC-C02 | **A** · Pago externo a promotores con registro manual | OrderOps no transfiere; registra movimiento y trazabilidad |
| CC-C03 | **A + precisión** · Estados en panel; campanita in-app condicional | Sin correos automáticos obligatorios; campanita solo si reutilizable y acotada |
| CC-C04 | **A** · Solo cobros completos en V1 | Sin imputación de cuotas parciales para activación o abonos |
| CC-C05 | **A** · Monotributo inicial; fiscalidad avanzada V1.X | Facturación fiscal externa, sin discriminar IVA; controles económicos conservados |
| CC-C06 | **A** · Reversa registrada; recuperación/compensación manual | Sin netting automático sobre futuras comisiones |
| CC-C07 | **B** · Archivo manual + política mínima de conservación | Revocar acceso; preservar historial; política legal documentada antes de producción |
| CC-C08 | **A** · Un comprobante activo por liquidación | Historial íntegro de reemplazos/rechazos; PDF no obligatorio |
| CC-C09 | **A** · Alta interna administrada de promotores | Sin registro público ni invitación automatizada obligatoria |
| CC-C10 | **A** · Bloqueo seguro y conciliación manual documentada | `reconciliation_required` conserva bloqueos; no saldos ficticios |
| CC-C11 | **A, ampliada** · Mobbex + Talo Pay en V1 comercial | Tarjeta recurrente y transferencia por CVU del negocio para suscripciones de OrderOps |
| CC-C12 | **Revisión 2** · Founder único | Activación ARS 290.000 y abono ARS 55.000, igual en Mobbex y Talo. Sin efectivo. El texto de $65.000 queda sustituido |
| CC-C13 | **A** · Recuperación segura con un solo medio activo | Antes de ofrecer CVU como rescate automático de tarjeta fallida, controlar reintentos |
| CC-C14 | **A** · Siete días de gracia y suspensión operativa | Sin nuevos pedidos al suspender; no destruir datos ni cortar pedidos aceptados |
| CC-C15 | **A** · Fecha de facturación fija después de pago tardío | Sin reinicio de calendario ni prorrateos automáticos |
| CC-C16 | **A** · Pago exacto imputable automáticamente; diferencias a conciliación | Movimiento acreditado inequívoco, exacto e idempotente; anomalías manuales |
| CC-C18 | **A** · Primer mes incluido en la activación | No se cobra ARS 55.000 al empezar. La primera mensualidad es el período siguiente. No genera comisión recurrente ni consume slot |

---

## 2. Requisitos funcionales detallados y ejemplos

### CC-C01 · Panel del promotor de solo consulta (opción B)

- El promotor inicia sesión y consulta **sus** negocios asignados, oportunidades, conversiones, comisiones generadas, pendientes, liquidadas y pagadas, según los estados reales del contrato existente.
- Administración central de OrderOps mantiene la autoridad para aprobar conversiones, liquidaciones, ajustes y pagos; el promotor no puede aprobarse ni pagarse a sí mismo.
- Aislamiento obligatorio por identidad, tenant, rol y asignación.
- **Ejemplo:** un promotor que captó tres locales visualiza sus atribuciones y $120.000 pendientes por una activación, pero no puede marcarla como pagada.

### CC-C02 · Pagos externos a promotores, registrados manualmente (opción A)

- Los pagos al promotor ocurren **fuera** de OrderOps (por ejemplo, transferencia bancaria manual).
- Un operador autorizado registra importe, fecha, medio y referencia opcional, conserva quién hizo el registro y evita duplicados.
- Distinguir **comisión generada**, **aprobada**, **liquidada** y **pago registrado**. El registro no certifica por sí solo una acreditación bancaria.
- La carga de comprobantes bancarios no es requisito de V1.
- **Ejemplo:** se transfiere externamente una liquidación de $240.000 y se registra el pago; el promotor lo ve como registrado/pagado según el contrato vigente.

### CC-C03 · Cambios visibles en el panel y campanita opcional (opción A precisada)

- **Obligatorio:** que los cambios de asignación, conversión, liquidación y pago puedan consultarse en el panel.
- **Condicional para V1:** campanita de notificaciones internas (contador, listado, leído/no leído y navegación al elemento) **solo si** reutiliza infraestructura existente y su implementación es pequeña y segura. Cursor debe estimarla: no introducir un sistema nuevo que retrase el cierre.
- Los correos automáticos y las pruebas de los once eventos mínimos del outbox **no son criterio de cierre** de esta V1 reducida; mantener contratos previos seguros y dejar la entrega avanzada para V1.X.
- **Ejemplo:** se aprueba una comisión y el promotor lo ve al entrar; si la campanita resulta viable, recibe además un aviso in-app.

### CC-C04 · Cobros completos, sin cuotas parciales (opción A)

- Reconocer una activación/abono como íntegramente cancelado solo cuando se ha acreditado el importe total del período u obligación identificada.
- No implementar en V1 planes de pagos parciales, asignaciones automáticas de cuotas ni reconocimiento proporcional de comisiones.
- Si llega una acreditación insuficiente, conservar registro financiero y derivar a conciliación (CC-C16); **nunca ignorar dinero recibido**.
- Esto **limita las modalidades que el motor puede ejecutar**, no modifica silenciosamente precios o promociones previamente definidos. Si la oferta comercial incluye pagos en cuotas, identificar esa incompatibilidad y no prometer su procesamiento hasta resolverla.
- **Ejemplo:** una activación adeuda $290.000; un ingreso de $100.000 no activa el negocio ni reconoce automáticamente la comisión de activación.

### CC-C05 · Monotributo inicial, sin motor fiscal avanzado (opción A)

- Estrategia inicial: prestar servicios de OrderOps como **persona humana bajo monotributo**, siempre que su alta y condiciones se encuentren efectivamente vigentes y validadas con asesoramiento profesional.
- Manejar importes comerciales nominales sin discriminar ni calcular IVA separado para ese encuadre. Facturas fiscales C emitidas mediante sistema externo autorizado, no por Commercial Core V1.
- Conservar guardas que bloqueen operaciones que requieran IVA, bases fiscales distintas o reglas no aprobadas. **No desactivar `BLK-ECO-01` por decreto**; auditar si el camino nominal compatible con monotributo requiere una adaptación explícita de contrato.
- Preparar la futura evolución a régimen general sin acoplamiento irreversible.
- Honorarios/comisiones de promotores y sus obligaciones de facturación se evaluarán según su propio encuadre; la situación tributaria del titular no sustituye obligaciones de terceros.
- **Ejemplo:** activación Founders de ARS 290.000 cobrada por Mobbex o Talo, comisión nominal ARS 120.000, sin inventar IVA discriminado ni afirmar margen neto impositivo. El efectivo no es un medio de Founder V1.

### CC-C06 · Reversa documentada y resolución manual (opción A)

- Si se revierte una comisión ya pagada, registrar movimiento/estado correctivo sin borrar pago original.
- **No** descontar automáticamente deuda de nuevas comisiones; sin *netting*.
- Casos de devolución, compensación o recuperación: revisión humana y resolución autorizada, con documentación y trazabilidad.
- **Ejemplo:** se revierte una comisión ya abonada de $120.000; una nueva comisión de $80.000 **no** se consume automáticamente contra esa deuda.

### CC-C07 · Desvinculación con archivo manual y política mínima (opción B)

- Desactivar cuenta, rol o acceso del promotor sin borrar registros contables, histórico de conversiones y liquidaciones.
- Establecer **antes de operar con personas reales** una política documentada sobre categorías de datos, finalidades, plazos de conservación, restricciones y solicitudes de acceso, rectificación o supresión, conforme a obligaciones legales.
- Conservación/anonimización se ejecutan manualmente por usuarios autorizados y con controles; la automatización de plazos se pospone.
- **Ejemplo:** promotor desvinculado no accede al panel, pero las liquidaciones históricas siguen consultables por administración para auditoría.
- No inventar plazos legales ni confundir un respaldo administrativo con autorización para conservar indefinidamente datos personales.

### CC-C08 · Único comprobante activo por liquidación (opción A)

- Para cada liquidación, puede haber **un solo documento vigente** a efectos del flujo de revisión/pago.
- Mantener historial de presentaciones, rechazo, sustitución y motivo; la carga de PDF/archivo no es obligatoria en V1, sí la referencia y estado documental que requiera el contrato vigente.
- Un documento nuevo no elimina ni invalida fiscalmente al anterior por sí solo; el promotor debe realizar las correcciones fiscales aplicables fuera del sistema.
- Varios documentos nunca provocan doble obligación de pago.
- **Ejemplo:** factura con error sustituida por documento corregido; la primera queda histórica y el administrador valida cuál está vigente.

### CC-C09 · Promotores incorporados por administración interna (opción A)

- Personal autorizado crea/habilita promotores y administra acceso/roles.
- No incluir postulación pública, autoalta ni invitaciones automatizadas como requisitos de cierre.
- **Ejemplo:** OrderOps habilita cinco promotores; cada uno puede ver únicamente sus operaciones comerciales.

### CC-C10 · Conciliación manual con bloqueo seguro (opción A)

- Ante inconsistencias, mantener estado `reconciliation_required` y bloquear pasos económicos que requieran datos íntegros.
- Documentar investigación, evidencia y autorización; no cerrar un caso sin un mecanismo de regularización respaldado por el código/contratos aprobados.
- Sin saldos arbitrarios, cambios manuales destructivos en BD, transacciones ficticias ni conciliación automática nueva en V1.
- **Ejemplo:** discrepancia en liquidación de $240.000 => detener pago duplicable, revisar movimientos, resolver por procedimiento autorizado; si no existe mecanismo seguro, mantener bloqueo y escalar.

### CC-C11 · Dos proveedores de cobro a negocios: Mobbex + Talo Pay (opción A ampliada)

- **Mobbex:** medio de cobro con tarjeta para suscripciones de OrderOps, con autorización recurrente, estado e información verificable de pago.
- **Talo Pay:** transferencias del negocio cliente a un **CVU persistente asignado a ese negocio**; pagos de activación y mensualidades, sujeto a homologación y modalidad comercial del proveedor.
- El comercio puede elegir el medio preferido para su abono y cambiarlo cuando se habilite de modo seguro, sin deuda duplicada.
- Ambos integran **la facturación de servicios vendidos por OrderOps a sus tenants**, no cobran los pedidos gastronómicos de los consumidores finales.
- No almacenar PAN/CVV/datos sensibles de tarjeta en servidores OrderOps; usar UI/tokenización del proveedor.
- Confirmar mediante documentación y entorno de prueba las capacidades de CVU, suscripciones, cambio/cancelación de reintentos, webhooks, autenticación, idempotencia, conciliación y credenciales. No asumir funcionalidades no demostradas.
- **Ejemplo:** pizzería elige débito recurrente por tarjeta para abono y también dispone de alternativa por CVU cuando corresponde; cada pago cancela una única mensualidad.

### CC-C12 · Founder único (Revisión 2)

La opción A de la revisión 1, con abono de ARS 65.000 y efectivo a ARS 55.000, queda **sustituida**. No es política vigente.

- Un solo plan Founder V1.
- Activación / puesta en marcha: **ARS 290.000**.
- Suscripción mensual: **ARS 55.000**.
- El precio es el mismo para Mobbex y para Talo Pay.
- No hay pagos en efectivo.
- Activación y suscripción son conceptos distintos y ambos pueden cobrarse por cualquiera de esos dos medios.
- Las comisiones de procesamiento de Mobbex y Talo son costos de OrderOps. No se suman al precio del cliente.
- La comisión nominal de activación sigue en **ARS 120.000**.
- La comisión recurrente sigue en **ARS 22.000** por mensualidad elegible efectivamente cobrada, el 40 % de ARS 55.000. No se calcula sobre ARS 65.000.
- Se conservan las doce cobranzas recurrentes elegibles de la SPEC. La activación no es una de ellas.
- **Ejemplo:** una mensualidad de ARS 55.000 cobrada por tarjeta o por CVU cancela el mismo nominal. Un ingreso de ARS 65.000 no la cancela.

### CC-C13 · Cobro fallido: un medio activo por deuda, recuperación segura (opción A)

- Tarjeta rechazada: informar el estado al cliente y permitir actualizar tarjeta o solicitar alternativa por CVU.
- Antes de habilitar la recuperación **automática** por transferencia, OrderOps debe tener confirmación técnica de que los reintentos recurrentes vinculados a **esa mensualidad** fueron suspendidos/detenidos o están neutralizados confiablemente.
- Si Mobbex no puede ofrecer esa garantía, no habilitar promesas de alternancia automática; derivar a operador para tratamiento seguro.
- Procesar webhooks duplicados, tardíos, fuera de orden y concurrentes sin doble imputación. Si dos cobros reales ocurren, **registrarlos ambos** y derivar el sobrante a conciliación: idempotencia contable no elimina obligaciones de devolución o regularización.
- **Ejemplo:** falla el cargo de ARS 55.000; el cliente elige CVU; esa vía automática solo se habilita tras desactivar de forma comprobable los reintentos; la acreditación exacta cancela la deuda una vez.

### CC-C14 · Siete días de gracia y suspensión operativa (opción A)

- Al vencer mensualidad sin pago completo, iniciar **7 días de tolerancia**, manteniendo operación.
- Si finaliza el plazo sin cobro confirmado, suspender **nuevos pedidos y funciones dependientes de suscripción activa**. Mantener acceso mínimo a pago/regularización y consulta necesaria.
- Nunca borrar información por impago; no interrumpir bruscamente pedidos ya aceptados ni provocar pérdida de tareas en curso. Definir comportamiento transaccional para el punto de suspensión en la auditoría técnica.
- Confirmación válida de pago reactiva servicio conforme a permisos y estado canónico.
- **Ejemplo:** vencimiento día 10; rechazado y no pagado => operativo durante gracia, suspendido a partir del día 18 según zona horaria/regla precisa a definir; pago confirmado reactiva.

### CC-C15 · Calendario fijo tras pago tardío (opción A)

- Mantener día y calendario nominal de vencimientos aunque un período se pague fuera de fecha.
- No reiniciar ciclo desde reactivación ni reconocer automáticamente créditos/prorrateos por días suspendidos.
- Si existen **varias deudas impagas o asignación ambigua** de un ingreso, no hacer imputaciones arbitrarias: derivar a conciliación.
- La identidad de cada período permanece estable y no se generan comisiones duplicadas por atrasos.
- **Ejemplo:** mensualidad de octubre vence el 10, se paga el 20; siguiente vence el 10 de noviembre.

### CC-C16 · Transferencia exacta y acreditación inequívoca; anomalías manuales (opción A)

- Automático solo si: evento auténtico, acreditación real confirmada, CVU/tenant identificado, deuda/periodo único asociado, importe **exactamente igual** al pendiente, no pagado antes, y operación idempotente/concurrencia protegida.
- Si el monto es menor, mayor, duplicado o no se determina el período, **registrar fielmente la acreditación** y remitir a conciliación administrada, sin activar ni cerrar arbitrariamente.
- No implementar acumulación de cuotas, saldo a favor automático, reembolso automático o netting en V1.
- **Ejemplo:** deuda de ARS 55.000; un ingreso de ARS 50.000 no la salda; ARS 80.000 exige revisión del excedente; dos transferencias reales de ARS 55.000 se conservan ambas y no cancelan el período dos veces.

### CC-C18 · Primer mes incluido en la activación

- La activación incluye el primer período mensual de servicio.
- No corresponde cobrar ARS 55.000 adicionales al comenzar ese período.
- La primera mensualidad exigible es la del período siguiente.
- El período incluido no genera comisión recurrente ni consume una de las doce cobranzas elegibles.
- Ejemplo aprobado, sin regla general de fin de mes: si el servicio inicia el **10 de noviembre**, la primera mensualidad corresponde al período que inicia el **10 de diciembre**.
- El motor actual guarda `period_key` como texto que envía quien abre la obligación. No calcula esa fecha. T02 tiene que usar la fecha de inicio de servicio como ancla de este ejemplo. No se define aquí qué pasa si el inicio cae un 31.

---

## 3. Alcance comprometido de V1 y alcance V1.X

### 3.1 V1 imprescindible (condicionado a prueba)

- Panel del promotor **autenticado, de lectura comercial** y limitado a su propia cartera.
- Incorporación interna, atribuciones, oportunidades, conversiones y Founder nominal bajo reglas existentes.
- Liquidaciones, pagos manuales a promotores y reversas trazables, con un comprobante vigente por liquidación.
- Prevención de pagos duplicados; conciliación segura manual; archivo/desactivación bajo política documentada.
- Suscripciones OrderOps: tarjeta Mobbex y transferencia por CVU persistente Talo, **si sus contratos y APIs efectivamente lo soportan**.
- Una identidad canónica por mensualidad; confirmación real por proveedor; recuperación segura de tarjeta fallida; 7 días de gracia; suspensión/reactivación; calendario fijo.
- Cobros completos y casos con diferencias sometidos a conciliación; no dar por resueltos IVA, cobros parciales o netting.
- Estado actualizado de suscripción visible para los negocios; administración debe poder auditar pagos, medios y excepciones.

### 3.2 V1.X o posterior

- Alta pública o por invitación automática de promotores.
- Ejecución bancaria de pagos a promotores.
- Carga/almacenamiento integrado de PDF de factura y comprobante bancario.
- Once eventos de correo y servicio completo de email automático.
- Campanita interna, **solo si** no puede construirse de manera acotada y segura reutilizando infraestructura.
- IVA discriminado, régimen general y cálculo fiscal avanzado; ARCA integrado.
- Cuotas o cobros parciales y aplicación automática de saldos a favor.
- Netting y recuperación automática sobre futuras comisiones.
- Conciliación automática y pantalla especializada si no es necesaria para V1.
- Política de eliminación/anonimización **automatizada** por plazos.
- Prorrateos y reembolsos automáticos por suspensión.
- Cobros de pedidos gastronómicos de terceros mediante Mobbex/Talo; no es objetivo de este Commercial Core.

### 3.3 Reglas no negociables de integridad

- **No hay producción comercial autorizada por este documento.** Requiere homologación de proveedores, pruebas y validaciones legales/fiscales de las operaciones.
- **Separación de identidades**: negocio cliente de OrderOps ≠ consumidor de la gastronomía; ingresos de plataforma ≠ ventas gastronómicas.
- **No duplicación económica**: evento duplicado no duplica movimiento; si ocurrieron pagos reales múltiples, registrar ambos y conciliar.
- **Permisos y trazabilidad**: responsabilidades separadas entre promotor y operador administrativo, multi-tenant sin fugas.
- **Seguridad de suscripción**: fallo de webhook, reintento o interrupción no concede acceso impago ni suspende injustamente negocios pagados.
- **Pagos incompletos**: dinero recibido siempre auditado aunque no se reconozca cancelación total.
- **No inferir fiscalidad**: preservar `BLK-ECO-01`, `BLK-ECO-02`, `BLK-ECO-03` y `BLK-PRIV-01` hasta resolver cada condición de forma explícita.

---

## 4. Escenarios mínimos de aceptación (a ejecutar, no presuponer PASS)

| ID | Escenario | Resultado exigido |
|---|---|---|
| AC-01 | Admin crea/promueve promotor; promotor entra | Permisos correctos; ve solo negocios y comisiones propios |
| AC-02 | Oportunidad → conversión → Founder nominal | Estados, atribución y registros únicos, sin duplicados |
| AC-03 | Comisión → liquidación → pago manual | Diferencia entre generado, aprobado y pagado; auditoría |
| AC-04 | Reversa posterior a pago | Histórico íntegro; sin netting automático |
| AC-05 | Factura sustituida por factura corregida | Un comprobante vigente; historial y una sola obligación |
| AC-06 | `reconciliation_required` | Bloquea acciones económicas inseguras; procedimiento de revisión |
| AC-07 | Mobbex cobra tarjeta en ambiente de pruebas | Mensualidad correcta cancelada una sola vez y estado observable |
| AC-08 | Talo acredita importe exacto a CVU de tenant en pruebas | Asociación inequívoca de negocio/período y un solo cierre |
| AC-09 | Falla tarjeta; cliente elige CVU | Reintentos neutralizados/verificados antes de alternancia automática |
| AC-10 | Dos webhooks iguales/fuera de orden | Una sola imputación económica, eventos auditados |
| AC-11 | Dos pagos reales, faltante, exceso, o período ambiguo | Movimientos conservados; conciliación; sin saldo automático inventado |
| AC-12 | Siete días de impago y suspensión | Sin nuevos pedidos tras gracia; pedidos aceptados preservados; datos intactos |
| AC-13 | Pago tardío y reactivación | Calendario original conservado; mismo negocio, sin datos perdidos |
| AC-14 | Desvinculación de promotor | Acceso revocado, historial económico preservado, política de datos registrada |
| AC-15 | Dos tenants distintos | CVU, movimientos, panel, saldos y permisos aislados |
| AC-16 | Bloqueos fiscales y cobros parciales | La aplicación no los habilita silenciosamente ni genera comisiones incorrectas |

**Tipos de evidencia requeridos:** código, tests de contrato, QA autenticada en entorno controlado, pruebas oficiales/sandbox de proveedores y revisión operativa. No dar PASS de una integración real por tests con mocks solamente.

---

## 5. Auditoría diferencial pedida a Cursor (sin implementación)

**Rama esperada:** `cursor/commercial-core-v1-integration`.  
**HEAD histórico de referencia al consolidar estas decisiones:** `b2cfa0a630c96f7612fa878a4dbe073eb56a56e7`. Confirmar HEAD real antes de auditar; no asumirlo si cambió.  
**Fuentes principales:** `docs/commercial-core-v1/FUNCTIONAL_SPEC.md`, `docs/commercial-core-v1/PROGRESS.md`, especificación del Panel de Promotores, migraciones y políticas del esquema `commercial`, `lib/commercial/`, `app/commercial/`, `app/promoter/`, verificaciones y QA de PHASE-06.

1. Para cada CC-C01…CC-C16, identificar **COMPLETE / PARTIAL / NOT_BUILT / NOT_VERIFIED / BLOCKED**, con evidencia de archivos, rutas, SQL, contratos y pruebas **realmente ejecutadas**.
2. Separar lo ya logrado del **delta añadido** por Mobbex/Talo y suscripción recurrente.
3. Contrastar específicamente disponibilidad **real y verificable** de CVU persistente por cliente, suscripciones con tarjeta, reintentos cancelables/suspendibles, cobros y webhooks, sandbox, firma de eventos y conciliación. Marcar dependencias de contratación o credenciales.
4. Identificar brechas de políticas de monotributo, privacidad, deduplicación y los bloqueos económicos históricos sin declarar resueltos por esta SPEC.
5. Evaluar viabilidad de notificaciones internas sencillas sin imponerlas al alcance crítico.
6. Recalcular avance del **nuevo contrato** mediante unidades y pesos transparentes, separando implementación de verificación. No copiar el 90% anterior.
7. Preparar un **plan máximo de dos etapas de implementación + una validación final**, sin proyectos laterales. Dar estimaciones y ruta crítica, con diferenciación de dependencias técnicas, contractuales y legales.
8. Proponer primera tarea atómica lista para implementación, pero **no ejecutarla** sin aprobación.

**Formato de salida:**

- Matriz `decisión | estado | evidencia | cambio mínimo | riesgo | dependencia externa | prueba de aceptación`.
- `LO_EXISTENTE` / `DELTA_OBLIGATORIO_V1` / `POSTERGADO_V1X` / `BLOQUEO_PRODUCCION`.
- Dos etapas de implementación máximo y una etapa de aceptación.
- Veredicto `COMMERCIAL_V1_DELTA_AUDIT: READY | READY_WITH_DEPENDENCIES | BLOCKED`.

**Restricciones de la auditoría:** solo lectura; no instalar ni modificar, no tocar Supabase Cloud, `.env.local`, datos, contenedores o credenciales, no crear commits, push, deploy, merge o rebase. Preservar archivos untracked. No modificar el worktree de Estadísticas ni módulos ajenos.

---

## 6. Registro de cambios de alcance frente a la SPEC histórica

- **Permanece en V1 nominal:** CRM comercial, atribución, Founder, slots, liquidaciones y pagos manuales, conforme a implementación existente.
- **Se minimiza para V1:** notificaciones de correo, PDF de comprobantes, alta pública, cobros en cuotas, netting, automatización de retención y fiscalidad de régimen general.
- **Se incorpora explícitamente al alcance V1 comercial:** cobro recurrente con Mobbex, CVU persistente Talo por negocio, elección de medio, recuperación segura de tarjetas fallidas, mensualidades canónicas, tolerancia de siete días, suspensión/reactivación y tratamiento de transferencias anómalas.
- **No implica** que los proveedores hayan sido contratados, que la interfaz esté construida ni que la solución sea apta para producción.
- **Revisión 2, 17 de octubre de 2026:** un solo precio Founder. Activación ARS 290.000, abono ARS 55.000, primer mes incluido, Mobbex y Talo, sin efectivo. La revisión 1, con ARS 65.000 y efectivo a ARS 55.000, queda sustituida y no es política vigente. Las comisiones y las doce cobranzas no cambian. Los adaptadores de pago no están construidos.

**Fin del contrato.**
