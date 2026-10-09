# OrderOps — Commercial Core V1

Especificación Funcional Maestra · Versión 1.0 · 8 de octubre de 2026

39 decisiones funcionales confirmadas

## 1. Propósito del documento

Este documento consolida las decisiones CC-01 a CC-39 y establece el alcance funcional del Commercial Core V1 de OrderOps, conforme a la opción B aprobada en CC-39: una primera versión integral, implementada por fases.

Su propósito es servir como referencia para:

- Diseñar e implementar el backoffice comercial interno de OrderOps.
- Construir el Panel de Promotores.
- Integrar el formulario público «Solicitar demo» de la landing.
- Administrar leads, oportunidades, atribuciones, onboarding, comisiones y pagos.
- Definir permisos, trazabilidad, estados y reglas económicas.
- Planificar el trabajo de Cursor con entregables verificables.
- Elaborar posteriormente el Manual Operativo y Comercial de OrderOps.

Estado: especificación funcional consolidada. No representa una implementación realizada, una migración aprobada ni una certificación legal. Las reglas acordadas se identifican como decisiones confirmadas; donde todavía faltan parámetros técnicos o criterios exactos, se señala expresamente.

## 2. Visión general del producto

El Commercial Core será el sistema central que conectará la adquisición de nuevos comercios con su conversión en clientes de OrderOps y con las obligaciones económicas derivadas de esa adquisición.

El flujo principal será:

Captación del comercio

Landing, promotor, campaña o registro interno

Lead y oportunidad comercial

Identificación, deduplicación, pipeline y seguimiento

Atribución y conversión

Validación del origen y vinculación con la organización real

Onboarding y cobranzas

Asistencia autorizada y pagos efectivos del cliente

Comisiones y liquidaciones

Devengamiento, facturas, transferencias y auditoría

### Principios estructurales

1. Una única fuente de verdad: el estado real de oportunidades, atribuciones, cobranzas y comisiones reside en el Commercial Core, no en correos, planillas ni notificaciones.
2. Separación de conceptos: comercio, lead, oportunidad, promotor, atribución, organización cliente y comisión son entidades diferentes.
3. Derechos económicos verificables: las comisiones dependen de atribuciones válidas y cobranzas elegibles efectivamente realizadas.
4. Trazabilidad histórica: las decisiones comerciales y financieras relevantes no se sobrescriben silenciosamente.
5. Permisos mínimos: cada usuario accede únicamente a las operaciones y datos autorizados.
6. Implementación incremental: la V1 abarca el circuito completo, pero se construye y habilita por fases.
7. Arquitectura extensible: se evitan funcionalidades avanzadas innecesarias en V1 sin cerrar la puerta a futuras versiones.

## 3. Alcance funcional aprobado — CC-39

| Módulo         | Incluido en V1                                                                    |
| -------------- | --------------------------------------------------------------------------------- |
| Captación      | Formulario de demo, origen de leads, protección antispam                          |
| CRM comercial  | Comercios potenciales, contactos, oportunidades, pipeline, notas, tareas y demos  |
| Deduplicación  | Coincidencias automáticas confiables y revisión de casos ambiguos                 |
| Promotores     | Registro, verificación, contrato, activación, panel y desvinculación              |
| Atribuciones   | Reclamaciones, confirmaciones, vencimientos, conflictos y protecciones temporales |
| Conversión     | Vinculación de oportunidad ganada con organización real                           |
| Onboarding     | Autorizaciones temporales para asistencia limitada                                |
| Comisiones     | Programa Founder, comisiones fijas y recurrentes, ajustes y reversas              |
| Finanzas       | Cierre mensual, liquidaciones, facturas, pagos manuales y comprobantes            |
| Administración | Roles, permisos, auditoría, notificaciones y conservación de datos                |

### Fuera del alcance inicial

No se implementarán en V1 automatizaciones comerciales avanzadas, WhatsApp automatizado, notificaciones push, transferencias bancarias automáticas, facturación electrónica integrada con ARCA, editor de roles personalizados, constructor visual de programas de comisiones, analítica predictiva con IA ni integraciones con CRM externos.

La ausencia de esas funcionalidades no impide diseñar interfaces y modelos de datos compatibles con su incorporación futura.

# Parte I — Modelo comercial

## 4. Comercios potenciales, leads e interacciones

Decisiones CC-01, CC-04, CC-08, CC-35 y CC-36

### 4.1. Definición de lead

Un lead representa un comercio potencial identificado por OrderOps. No representa un formulario, una llamada ni una conversación individual.

Un mismo comercio podrá tener:

- Múltiples contactos.
- Diferentes solicitudes de demo.
- Interacciones originadas en distintos canales.
- Reclamaciones comerciales de uno o varios promotores.
- Varias oportunidades comerciales sucesivas.
- Eventualmente, una vinculación con una organización cliente real.

La recepción de una nueva solicitud no implica crear un nuevo lead cuando ya existe un comercio identificado con suficiente confianza.

### 4.2. Información funcional del comercio

El registro comercial debe poder almacenar, como mínimo:

| Campo                                | Propósito                                                 |
| ------------------------------------ | --------------------------------------------------------- |
| Identificador interno                | Referencia estable y única                                |
| Nombre comercial                     | Identificación visible                                    |
| Nombre normalizado                   | Búsqueda y detección de duplicados                        |
| Rubro                                | Clasificación comercial                                   |
| Teléfonos normalizados               | Contacto y coincidencias                                  |
| Correo electrónico                   | Comunicación y búsqueda                                   |
| Contactos asociados                  | Personas vinculadas al comercio                           |
| Marca o sucursal                     | Diferenciación cuando corresponda                         |
| Identificadores fiscales disponibles | Identificación adicional, cuando sea legítimo utilizarlos |
| Origen inicial                       | Primer canal de captación registrado                      |
| Fecha de creación                    | Trazabilidad                                              |
| Estado de archivo                    | Visibilidad operativa                                     |
| Organización vinculada               | Relación con cliente real, cuando exista                  |

Los datos personales deben recolectarse únicamente cuando exista una finalidad legítima y se apliquen los controles de privacidad correspondientes.

### 4.3. Interacciones

Cada acción comercial relevante se registrará como una interacción vinculada al comercio y, cuando corresponda, a una oportunidad.

Tipos previstos:

- Solicitud de demo.
- Llamada o contacto por WhatsApp.
- Correo comercial.
- Reunión.
- Demo realizada.
- Nota comercial.
- Registro de promotor.
- Seguimiento.
- Recepción de información o documentación.
- Otro evento comercial autorizado.

Cada interacción conservará actor, fecha, canal, origen y referencia a su contexto.

Una interacción histórica no podrá perder su origen porque posteriormente se haya confirmado una atribución diferente.

## 5. Formulario público «Solicitar demo»

CC-35 — Opción B

La landing de OrderOps incorporará un formulario breve, optimizado para dispositivos móviles.

### 5.1. Campos

| Campo                      | Obligatorio |
| -------------------------- | ----------- |
| Nombre del responsable     | Sí          |
| Nombre del comercio        | Sí          |
| WhatsApp de contacto       | Sí          |
| Rubro del comercio         | Sí          |
| Correo electrónico         | No          |
| Descripción de necesidades | No          |

El formulario mostrará información clara sobre el tratamiento de datos personales y enlazará la política de privacidad correspondiente.

### 5.2. Procesamiento

Al enviarse una solicitud:

1. Se validan los datos en el servidor.
2. Se normalizan los campos relevantes.
3. Se aplican controles antispam y limitación de frecuencia.
4. Se registra el origen comercial y, si existe, la referencia del promotor o campaña.
5. Se buscan posibles comercios existentes.
6. Se crea o vincula la interacción.
7. Se crea o actualiza una oportunidad, según su situación.
8. Se notifica al equipo comercial.
9. Se muestra una confirmación al solicitante.

El envío del formulario no reserva automáticamente una atribución para un promotor.

No se incluye en V1 una agenda pública con reservas automáticas de demos. La coordinación la realizará el responsable comercial.

## 6. Detección de duplicados

CC-36 — Opción C

El sistema utilizará una estrategia híbrida de identificación.

| Nivel                      | Tratamiento                                                  |
| -------------------------- | ------------------------------------------------------------ |
| Alta confianza             | Vinculación automática si no existen señales contradictorias |
| Coincidencia probable      | Revisión administrativa sin fusión automática                |
| Sin coincidencia confiable | Creación de nuevo comercio potencial                         |

Se considerarán teléfonos normalizados, nombres comerciales, correos, identificadores verificables y relaciones entre marcas o sucursales.

Restricciones obligatorias:

- Compartir nombre o teléfono no demuestra por sí solo que dos registros representan el mismo comercio.
- Una fusión no modifica automáticamente atribuciones confirmadas.
- No se pierden interacciones, oportunidades ni referencias económicas.
- La fusión administrativa requiere autorización y auditoría.
- Un promotor no podrá consultar información privada de otro promotor mediante búsquedas de duplicados.
- Las solicitudes simultáneas deberán manejarse sin crear duplicados por condiciones de carrera.

El umbral exacto de coincidencia y las reglas de resolución de concurrencia se concretarán en el contrato técnico.

# Parte II — Oportunidades y seguimiento comercial

## 7. Creación de oportunidades

CC-07, CC-08 y CC-10

Una oportunidad representa un intento comercial concreto de convertir un comercio en cliente.

No se creará automáticamente por la mera existencia de un lead o de una reclamación provisional de un promotor.

Se creará cuando exista intención comercial calificada, por ejemplo:

- Solicitud de demo.
- Referencia verificada que exprese interés real.
- Alta manual justificada por un integrante autorizado de OrderOps.

Un comercio podrá tener varias oportunidades a lo largo del tiempo, pero el sistema evitará mantener oportunidades paralelas innecesarias para el mismo proceso comercial.

La atribución de un promotor se asociará a una oportunidad específica, no a la propiedad perpetua del comercio.

## 8. Pipeline comercial

CC-09

01

Nueva

02

Contactando

03

Calificada

04

Demo agendada

05

Demo realizada

06

Seguimiento

Resultados terminales

Ganada

Perdida

Las transiciones serán flexibles, no necesariamente lineales, pero quedarán auditadas.

### Reglas de cierre

Ganada:

- Solo podrá confirmarla OrderOps mediante un usuario autorizado.
- Exige vinculación con una organización o cuenta cliente real.
- No significa necesariamente que se haya cobrado el setup o la suscripción.
- No genera por sí sola una comisión.

Perdida:

- Requiere un motivo de pérdida.
- Puede registrarla un promotor sobre oportunidades legítimamente asignadas.
- Conserva historial.
- No elimina reclamaciones ni registros económicos anteriores.

## 9. Tareas y actividad comercial

CC-06 y CC-37 — Opción B

Cada oportunidad admitirá múltiples tareas.

Campos funcionales:

- Tipo de tarea.
- Título y descripción.
- Responsable.
- Fecha y hora de vencimiento.
- Prioridad.
- Estado.
- Fecha de finalización.
- Referencia a oportunidad.
- Actor creador y modificaciones relevantes.

### Vistas

El Panel de Promotores y el backoffice comercial mostrarán:

- Tareas de hoy.
- Próximas tareas.
- Tareas vencidas.
- Oportunidades sin actividad reciente.
- Próxima acción principal de cada oportunidad.

Las tareas completadas permanecerán en el historial. Las tareas abiertas deberán resolverse o cancelarse justificadamente cuando la oportunidad se cierre.

### Actividad comercial calificada

Debe distinguirse entre:

Actividad administrativa: crear una tarea, editar una nota, cambiar una fecha o abrir una ficha.

Actividad comercial sustantiva: interacción verificable que representa un avance real del proceso comercial.

La primera no justifica extender automáticamente una reclamación provisional.

La definición exacta de evidencias aceptables, frecuencia y autoridad de validación se cerrará en el contrato técnico, manteniendo el principio aprobado en CC-06.

# Parte III — Promotores y atribuciones

## 10. Naturaleza del promotor

CC-11, CC-12, CC-17 y CC-28

El promotor de OrderOps no será un simple afiliado que comparte enlaces.

Será un colaborador comercial independiente que podrá participar en:

- Captación de comercios.
- Presentación del producto.
- Seguimiento de oportunidades.
- Coordinación de demos.
- Asistencia comercial durante la conversión.
- Onboarding autorizado.
- Preparación de contenido de catálogo dentro de los permisos concedidos.

No será administrador de los comercios que consiga ni tendrá acceso automático a sus organizaciones.

## 11. Registro, contrato y activación

CC-28

El modelo contractual aprobado es contrato de agencia comercial independiente, sujeto a validación jurídica argentina.

Para activar comercialmente a un promotor se requerirá:

1. Registro de identidad y datos de contacto.
2. CUIT y datos fiscales necesarios.
3. Monotributo vigente y verificado.
4. Aceptación o formalización del contrato aplicable.
5. Registro de versión y fecha contractual.
6. Aprobación interna de activación.

El usuario podrá completar un registro preliminar, pero no podrá operar comercialmente ni generar nuevas comisiones antes de su activación.

La pérdida posterior de condiciones fiscales o contractuales podrá provocar suspensión operativa conforme al contrato, sin borrar derechos económicos ya adquiridos.

### Estados funcionales sugeridos

`Registrado → Pendiente de verificación → Activo → Suspendido / Desvinculado`

Estos nombres son una propuesta de implementación; las condiciones de activación y suspensión son las reglas confirmadas.

## 12. Panel de Promotores

CC-11, CC-12, CC-17, CC-29 y CC-37

El panel incluirá las siguientes áreas.

| Sección        | Funcionalidad                                |
| -------------- | -------------------------------------------- |
| Inicio         | Resumen de oportunidades, tareas y actividad |
| Comercios      | Registros y contactos que puede gestionar    |
| Oportunidades  | Pipeline, seguimiento, notas y demos         |
| Reclamaciones  | Solicitudes de atribución y sus estados      |
| Tareas         | Pendientes, próximas y vencidas              |
| Onboarding     | Asistencias temporales autorizadas           |
| Comisiones     | Pendientes, disponibles y ajustadas          |
| Liquidaciones  | Cierres mensuales, facturas y pagos          |
| Perfil         | Datos contractuales, fiscales y bancarios    |
| Notificaciones | Eventos comerciales y administrativos        |

### Operaciones permitidas

Un promotor activo podrá, dentro de su ámbito autorizado:

- Registrar comercios potenciales.
- Gestionar oportunidades asignadas.
- Editar datos comerciales no sensibles.
- Registrar interacciones y notas.
- Crear y completar tareas.
- Coordinar demos.
- Modificar etapas comerciales permitidas.
- Marcar oportunidades como perdidas con motivo.
- Solicitar autorizaciones de onboarding.
- Consultar sus atribuciones y comisiones.

### Operaciones prohibidas

No podrá:

- Marcar oportunidades como ganadas.
- Confirmar atribuciones definitivas.
- Resolver disputas.
- Modificar porcentajes o programas económicos.
- Generar pagos o aprobar liquidaciones.
- Acceder a organizaciones de clientes sin autorización específica.
- Consultar información privada de otros promotores.

## 13. Reclamaciones y atribución comercial

CC-02 a CC-07

### 13.1. Reclamación provisional

Cuando un promotor registra un comercio, puede generar una reclamación provisional de origen comercial.

Esta reclamación:

- No equivale a una atribución confirmada.
- No reserva indefinidamente el comercio.
- No impide que el cliente llegue por otro canal.
- No garantiza futuras comisiones.

### 13.2. Confirmación

La atribución podrá confirmarse:

- Automáticamente cuando exista una acción inequívoca del cliente, por ejemplo una solicitud válida de demo desde un enlace referido, conforme a las reglas de validación.
- Manualmente por OrderOps, con justificación y auditoría.

Una atribución confirmada queda asociada a una oportunidad determinada.

La responsabilidad operativa de gestionar una oportunidad puede asignarse a una persona diferente del promotor al que corresponde su atribución.

### 13.3. Reclamaciones orgánicas y tardías

Un lead orgánico podrá no tener promotor atribuido.

Una reclamación posterior solo podrá reconocerse cuando exista evidencia válida de una relación comercial originada anteriormente por el promotor. No se admitirá apropiarse de un lead orgánico por haberlo contactado después sin fundamento suficiente.

### 13.4. Vigencia provisional

PLAZO INICIAL

# 30 días

Desde la creación de la reclamación provisional.

La reclamación vence al cumplirse el plazo salvo extensión autorizada por actividad comercial calificada.

Las reclamaciones vencidas conservan historial y evidencia, pero dejan de otorgar la protección provisional correspondiente.

### 13.5. Conflictos entre promotores

La regla general será respetar la primera atribución válidamente confirmada.

Cuando existan pruebas materiales contradictorias, OrderOps abrirá una revisión formal.

Las reclamaciones provisionales no bloquearán automáticamente nuevas oportunidades ni convertirán al primer registrante en titular definitivo.

## 14. Disputas de atribución

CC-05 y CC-32

Las disputas se tramitarán mediante expedientes administrativos auditables.

Cada expediente deberá permitir registrar:

- Oportunidad afectada.
- Promotores involucrados.
- Motivo.
- Evidencias.
- Estado del expediente.
- Responsable autorizado.
- Decisión.
- Justificación.
- Fechas.
- Efectos económicos.

Una disputa podrá retener solo las comisiones impagas directamente afectadas, no todas las comisiones del promotor.

Los cambios excepcionales de atribución no modificarán silenciosamente cobranzas, comisiones, liquidaciones ni pagos históricos.

Cuando corresponda corregir importes se utilizarán ajustes económicos separados y auditables.

## 15. Desvinculación del promotor

CC-29 y CC-30

Al desvincularse un promotor:

- Se revocará su acceso comercial y operativo.
- Se reasignarán las oportunidades abiertas.
- Se conservarán sus contratos y antecedentes.
- Se mantendrán las comisiones legítimamente adquiridas.
- Podrá conservar un canal administrativo restringido para consultar liquidaciones, emitir facturas y gestionar cobros pendientes, conforme a las condiciones aplicables.

### Protección de oportunidades abiertas

PROTECCIÓN POSTERIOR A LA DESVINCULACIÓN

# 90 días

Desde la fecha efectiva de desvinculación.

La protección se aplicará a oportunidades abiertas con atribución confirmada y actividad comercial legítima.

Si la conversión ocurre dentro del período protegido, se reconocerán las comisiones del programa aplicable, sujeto a sus condiciones.

No se protegerán automáticamente reclamaciones meramente provisionales o registros sin actividad suficiente.

Las excepciones deberán justificarse y auditarse.

# Parte IV — Conversión y onboarding

## 16. Conversión a cliente real

CC-10

Una oportunidad `Ganada` deberá vincularse con una organización real de OrderOps.

El sistema distinguirá al menos cuatro acontecimientos:

1. Aceptación comercial.
2. Creación o vinculación de la organización.
3. Cobro efectivo del cliente.
4. Generación de comisión elegible.

No se considerarán equivalentes.

Esta separación evita, por ejemplo, generar una comisión por un cliente que aceptó contratar pero nunca pagó.

## 17. Asistencia de onboarding

CC-13 a CC-17

El promotor podrá ayudar a preparar el catálogo de un cliente solamente cuando exista autorización expresa y vigente.

### Otorgamiento

La autorización podrá ser solicitada por el promotor o por OrderOps.

Deberá aprobarla un representante autorizado del comercio.

Una excepción administrativa de OrderOps requerirá motivo y auditoría.

### Alcance permitido

- Crear o editar nombres de productos.
- Editar descripciones.
- Gestionar categorías.
- Incorporar o modificar imágenes.
- Editar información descriptiva no sensible de variantes.

### Alcance prohibido

- Cambiar precios.
- Gestionar pedidos.
- Modificar datos financieros.
- Cambiar permisos administrativos.
- Alterar configuraciones sensibles de seguridad.
- Acceder a funciones ajenas al propósito autorizado.

### Duración

AUTORIZACIÓN DE ONBOARDING

# Hasta 30 días

Expira antes si termina el onboarding, el cliente la revoca o existe una revocación administrativa justificada.

La renovación requerirá autorización explícita.

Al finalizar el onboarding, el promotor podrá continuar siendo contacto comercial, pero perderá los permisos de edición salvo nueva autorización temporal.

# Parte V — Programa económico Founder

## 18. Modelo de precios y comisiones

CC-18 a CC-24

El Commercial Core V1 incorporará el programa comercial Founder con las condiciones económicas aprobadas.

## Programa Founder — Condiciones confirmadas

Implementación inicial

# $290.000

ARS · Cobro al cliente

Suscripción mensual

# $55.000

ARS · Precio Founder

Comisión por implementación

# $120.000

ARS · Promotor

Comisión recurrente

# 40%

Primeras 12 mensualidades elegibles cobradas

Comisión nominal máxima por cliente Founder

# $384.000 ARS

Importe nominal suponiendo doce mensualidades de $55.000 íntegramente elegibles, sin descuentos, reversas ni cambios en la base comisionable.

### 18.1. Distribución económica nominal

| Concepto                               | Cliente paga | Promotor recibe | OrderOps conserva |
| -------------------------------------- | ------------ | --------------- | ----------------- |
| Implementación                         | $290.000     | $120.000        | $170.000          |
| Cada mensualidad elegible, primeras 12 | $55.000      | $22.000         | $33.000           |
| Mensualidades posteriores              | $55.000      | $0              | $55.000           |

Los importes conservados por OrderOps son antes de impuestos, comisiones de procesamiento, infraestructura, soporte y otros costos.

La comisión del promotor no es un porcentaje del precio de lista cuando el cobro real elegible difiere de ese precio: se calcula sobre la base económica elegible efectivamente cobrada.

## 19. Regla de las doce mensualidades exitosas

CC-20 — Regla revisada y definitiva

La comisión recurrente Founder se aplica a las primeras doce cobranzas mensuales exitosas y elegibles.

No significa doce meses calendario desde el alta.

### Ejemplo

| Mes     | Resultado de cobranza | ¿Cuenta para las 12? |
| ------- | --------------------- | -------------------- |
| Enero   | Cobro exitoso         | Sí, pago 1           |
| Febrero | Cobro exitoso         | Sí, pago 2           |
| Marzo   | Pago fallido          | No                   |
| Abril   | Cobro exitoso         | Sí, pago 3           |
| Mayo    | Cobro exitoso         | Sí, pago 4           |

Si un cliente tiene interrupciones de pago, el contador no avanza durante los períodos sin una cobranza exitosa elegible.

Un pago que posteriormente resulte revertido o deje de ser elegible deberá corregirse mediante el mecanismo económico auditado correspondiente.

### Reglas del contador

- El contador pertenece al derecho recurrente originado por una oportunidad atribuida y convertida.
- Cada mensualidad elegible se contabiliza una sola vez.
- Un reintento de cobro no constituye una nueva mensualidad si corresponde a la misma obligación.
- Una cobranza de implementación no consume una de las doce mensualidades.
- Los pagos fallidos no consumen posiciones.
- Una vez consumidas doce posiciones válidas, no se generan nuevas comisiones recurrentes bajo ese programa.
- Las condiciones comerciales se congelan históricamente al momento de la conversión.

El tratamiento exacto de pagos parciales, múltiples transacciones para una misma mensualidad y ajustes posteriores se formalizará en las reglas de cálculo.

## 20. Versionado de programas comerciales

CC-21, CC-22 y CC-23

V1 tendrá un porcentaje recurrente global por programa comercial, sin niveles de promotores ni bonificaciones personalizadas.

No obstante, el sistema deberá permitir conservar programas versionados.

Cada conversión atribuida almacenará una referencia o snapshot inmutable de las condiciones aplicables:

- Identificador y versión del programa.
- Precio de implementación aplicable.
- Precio mensual de referencia.
- Comisión fija.
- Porcentaje recurrente.
- Cantidad máxima de mensualidades elegibles.
- Fecha de entrada en vigencia.
- Condiciones económicas adicionales necesarias para reproducir el cálculo.

Modificar un programa para nuevos clientes no recalculará automáticamente los derechos económicos de clientes convertidos anteriormente.

El snapshot deberá conservar las condiciones suficientes para auditar el cálculo aun si el programa original deja de comercializarse.

## 21. Generación de comisiones

CC-18 y CC-24

Las comisiones nacen de cobranzas reales y elegibles.

### Comisión por implementación

Se genera cuando concurren:

1. Oportunidad ganada y vinculada a organización real.
2. Atribución válida.
3. Programa económico aplicable.
4. Cobro efectivo y confirmado de implementación.

La comisión permanece pendiente hasta cumplirse:

- La ventana de seguridad de 15 días calendario.
- La finalización del onboarding.

Cuando el onboarding se demore por circunstancias ajenas al promotor, OrderOps podrá autorizar una liberación excepcional, justificada y auditada.

### Comisión recurrente

Se genera por cada cobranza mensual exitosa y elegible, mientras queden posiciones dentro del límite de doce.

La finalización del onboarding no es condición para liberar comisiones recurrentes.

Sí se aplicará la ventana de seguridad correspondiente.

## 22. Estados económicos

El sistema debe distinguir claramente entre comisión, liquidación y pago.

Pendiente

Cobranza elegible registrada; condiciones de liberación aún no cumplidas

Devengada / Disponible

Condiciones satisfechas y monto habilitado para liquidación

Incluida en liquidación

Agrupada en el período económico correspondiente

Pagada

Transferencia correspondiente confirmada y registrada

Los nombres exactos de los estados técnicos podrán ser más granulares para representar retenciones, ajustes, anulaciones, pagos parciales y disputas.

Regla fundamental: una comisión incluida en una liquidación no se considera pagada hasta que exista confirmación del pago correspondiente.

## 23. Ventana de seguridad y reversas

CC-25

VENTANA DE SEGURIDAD

# 15 días calendario

Contados desde la cobranza efectivamente confirmada.

Durante este período la comisión no estará disponible para liquidación.

El sistema deberá contemplar:

- Reembolsos.
- Contracargos.
- Anulaciones.
- Cobranzas duplicadas.
- Correcciones de importes.
- Disputas económicas.
- Reversiones posteriores al pago al promotor.

Una reversa no borrará la cobranza original ni la comisión histórica. Generará un movimiento correctivo vinculado.

Si el ajuste afecta una comisión ya pagada, se deberá registrar la diferencia y su tratamiento posterior según las condiciones contractuales aplicables.

No se realizarán compensaciones silenciosas.

## 24. Cancelación y reactivación del cliente

CC-31

La cancelación del servicio no extingue automáticamente las comisiones previamente adquiridas.

### Protección de reactivación

PROTECCIÓN POSTERIOR A LA BAJA EFECTIVA

# 180 días

Reactivaciones dentro del plazo conservan la atribución y continúan el contador de mensualidades elegibles.

Ejemplo: un cliente Founder acumuló cinco mensualidades elegibles y luego canceló.

Si reactiva dentro de los 180 días posteriores a la baja efectiva, su próxima cobranza mensual elegible ocupará la posición seis.

Si reactiva después de los 180 días, la atribución anterior no se restablece automáticamente. El nuevo proceso se tratará como una oportunidad comercial independiente, conforme a las reglas vigentes.

El sistema deberá distinguir fecha de solicitud de cancelación y fecha efectiva de terminación del servicio.

# Parte VI — Liquidaciones, facturación y pagos

## 25. Cierre mensual

CC-26

Las liquidaciones se organizarán por mes calendario, utilizando la zona horaria argentina `America/Argentina/Buenos_Aires`.

### Calendario

| Hito               | Regla                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Cierre del período | Último día calendario del mes                                                                      |
| Preparación        | Comisiones disponibles y ajustes correspondientes                                                  |
| Aprobación         | Revisión por usuario autorizado                                                                    |
| Facturación        | El promotor emite factura por el total aprobado                                                    |
| Pago               | Dentro de los primeros 10 días calendario del mes siguiente, conforme a las condiciones aplicables |

Una comisión que no haya cumplido la ventana de seguridad al cierre no se anticipará. Pasará a un período posterior cuando esté disponible.

Cada promotor tendrá una liquidación identificable por período, con su detalle económico y trazabilidad.

## 26. Estructura de una liquidación

Una liquidación deberá contener:

- Promotor.
- Período.
- Fecha de cierre.
- Estado.
- Comisiones de implementación.
- Comisiones recurrentes.
- Ajustes positivos.
- Ajustes negativos.
- Total aprobado.
- Responsable de preparación.
- Responsable de aprobación.
- Factura asociada.
- Pagos asociados.
- Comprobantes.
- Historial de modificaciones y decisiones.

La liquidación deberá permitir reconstruir el origen de cada importe hasta la cobranza del cliente que lo generó.

### Ejemplo ilustrativo

| Concepto                       | Importe  |
| ------------------------------ | -------- |
| Comisión setup — Casa Burger   | $120.000 |
| Comisión mensual — Casa Burger | $22.000  |
| Comisión mensual — Pizza Norte | $22.000  |
| Ajuste por reversa             | -$10.000 |
| Total a liquidar               | $154.000 |

Este ejemplo es ilustrativo, no una liquidación real.

## 27. Facturación del promotor

CC-28

La factura del promotor es un requisito previo a la transferencia de una liquidación aprobada.

Flujo:

1. Finanzas prepara la liquidación.
2. Un usuario autorizado la aprueba.
3. El promotor recibe la notificación.
4. El promotor emite su factura por el importe aprobado.
5. Adjunta o presenta el comprobante.
6. Finanzas verifica la documentación.
7. Se habilita el pago.
8. Se registra la transferencia y su comprobante.

La factura deberá conservarse vinculada a la liquidación correspondiente.

No se incluirá en V1 una integración automática de emisión de facturas con ARCA.

Los requisitos fiscales específicos, el tipo de comprobante y las condiciones de validez deberán verificarse con asesoramiento contable.

## 28. Transferencias bancarias

CC-27

V1 utilizará transferencias manuales a las cuentas bancarias o virtuales declaradas por los promotores.

El sistema registrará:

- CBU o CVU.
- Titular de la cuenta.
- Información de verificación.
- Liquidación asociada.
- Importe.
- Fecha.
- Estado del pago.
- Referencia bancaria.
- Comprobante.
- Usuario responsable.

Las modificaciones de datos bancarios requerirán controles de seguridad y auditoría.

Se contemplarán pagos parciales, transferencias fallidas y reintentos, sin duplicar importes efectivamente abonados.

La liquidación y sus pagos serán entidades separadas.

# Parte VII — Administración, seguridad y notificaciones

## 29. Roles internos

CC-33 — Opción C

El backoffice tendrá cuatro roles predefinidos, respaldados por permisos granulares.

| Rol                | Responsabilidad                                                                 |
| ------------------ | ------------------------------------------------------------------------------- |
| Superadministrador | Configuración, programas, autorizaciones excepcionales y resolución de disputas |
| Comercial          | Leads, oportunidades, promotores y seguimiento                                  |
| Finanzas           | Comisiones, liquidaciones, facturas y pagos                                     |
| Soporte            | Onboarding y asistencia autorizada                                              |

Un usuario interno podrá tener más de un rol.

### Matriz funcional inicial

| Operación                       | Comercial          | Finanzas | Soporte  | Superadmin    |
| ------------------------------- | ------------------ | -------- | -------- | ------------- |
| Gestionar leads y oportunidades | Sí                 | —        | Limitado | Sí            |
| Asignar seguimiento comercial   | Sí                 | —        | —        | Sí            |
| Confirmar atribuciones          | Según autorización | —        | —        | Sí            |
| Resolver disputas               | —                  | —        | —        | Sí            |
| Gestionar onboarding            | Sí                 | —        | Sí       | Sí            |
| Preparar liquidaciones          | —                  | Sí       | —        | Según permiso |
| Aprobar liquidaciones           | —                  | Sí\*     | —        | Sí\*          |
| Registrar transferencias        | —                  | Sí       | —        | Según permiso |
| Administrar roles internos      | —                  | —        | —        | Sí            |

\*Las aprobaciones y ajustes sensibles estarán sujetos a controles adicionales. La matriz exacta se formalizará en permisos individuales, no únicamente en nombres de roles.

### Controles obligatorios

- Verificación de permisos en servidor.
- Políticas de acceso a datos acordes con la arquitectura existente.
- Separación entre roles internos y roles de organizaciones clientes.
- Auditoría de cambios sensibles.
- Revocación efectiva de accesos.
- Protección de información económica y bancaria.
- Autorización adicional para operaciones excepcionales.

La arquitectura podrá admitir roles personalizados en el futuro, pero V1 no incluirá un editor avanzado.

## 30. Notificaciones

CC-34 — Opción B

V1 utilizará dos canales:

- Centro de notificaciones dentro de los paneles.
- Correo electrónico para eventos relevantes.

### Eventos mínimos

| Evento                            | Destinatario                   |
| --------------------------------- | ------------------------------ |
| Nueva solicitud de demo           | Equipo comercial               |
| Oportunidad asignada              | Responsable o promotor         |
| Tarea próxima o vencida           | Responsable                    |
| Atribución confirmada o rechazada | Promotor                       |
| Disputa que requiere revisión     | Administrador autorizado       |
| Autorización de onboarding        | Participantes correspondientes |
| Liquidación aprobada              | Promotor                       |
| Factura observada                 | Promotor                       |
| Pago registrado y confirmado      | Promotor                       |

El sistema tendrá preferencias para comunicaciones no críticas y avisos obligatorios cuando sean necesarios por razones operativas, de seguridad o cumplimiento.

Los fallos de entrega no alterarán estados comerciales o económicos.

Se contemplarán reintentos, protección contra duplicados y registro de resultados de entrega.

## 31. Auditoría

La auditoría será transversal a todo el Commercial Core.

Deberá cubrir, como mínimo:

- Cambios de etapa comercial.
- Confirmaciones y modificaciones de atribución.
- Resolución de disputas.
- Asignaciones y desvinculaciones.
- Activación y suspensión de promotores.
- Autorizaciones de onboarding.
- Cambios de programas comerciales.
- Cálculos y ajustes de comisiones.
- Aprobaciones de liquidaciones.
- Registro y modificación de pagos.
- Cambios de datos bancarios.
- Operaciones de archivado y privacidad.

Cada evento relevante deberá identificar actor, fecha, entidad, operación, motivo cuando corresponda y evidencia suficiente para reconstruir el cambio.

La auditoría no debe depender de que el usuario complete voluntariamente una nota.

## 32. Archivado y conservación de datos

CC-38 — Opción C

Se aplicarán políticas diferenciadas:

| Información                     | Tratamiento                                  |
| ------------------------------- | -------------------------------------------- |
| Leads y oportunidades inactivos | Archivado controlado                         |
| Reclamaciones y atribuciones    | Historial protegido                          |
| Contratos                       | Conservación según obligaciones aplicables   |
| Comisiones y liquidaciones      | Conservación económica y auditabilidad       |
| Datos personales innecesarios   | Supresión o anonimización cuando corresponda |
| Solicitudes de privacidad       | Procedimiento documentado y auditado         |

No existirá eliminación física libre de registros económicos desde las interfaces administrativas habituales.

El sistema deberá permitir tramitar solicitudes de acceso, rectificación y supresión conforme a las obligaciones aplicables, sin confundir la conservación legal con autorización para utilizar datos en campañas comerciales.

Los plazos concretos se documentarán por categoría y deberán revisarse jurídicamente.

# Parte VIII — Arquitectura funcional y modelo de datos

## 33. Entidades principales

La siguiente estructura es un modelo lógico propuesto, no un esquema SQL definitivo. Los nombres de tablas, claves y relaciones deberán adaptarse a la base de datos y convenciones existentes de OrderOps.

| Entidad lógica              | Responsabilidad                               |
| --------------------------- | --------------------------------------------- |
| `commercial_businesses`     | Identidad comercial del negocio potencial     |
| `commercial_contacts`       | Personas de contacto                          |
| `commercial_interactions`   | Historial de acciones y comunicaciones        |
| `commercial_opportunities`  | Procesos de venta                             |
| `commercial_tasks`          | Seguimientos y acciones pendientes            |
| `promoters`                 | Identidad y estado comercial del promotor     |
| `promoter_contracts`        | Contratos, versiones y formalización          |
| `promoter_verifications`    | Verificaciones fiscales y de activación       |
| `attribution_claims`        | Reclamaciones provisionales                   |
| `opportunity_attributions`  | Atribuciones confirmadas                      |
| `attribution_disputes`      | Expedientes de conflicto                      |
| `commercial_programs`       | Programas económicos versionados              |
| `conversion_terms`          | Condiciones congeladas al convertir           |
| `onboarding_grants`         | Autorizaciones temporales de asistencia       |
| `eligible_collections`      | Referencias a cobranzas elegibles verificadas |
| `promoter_commissions`      | Derechos económicos generados                 |
| `commission_adjustments`    | Correcciones y reversas                       |
| `promoter_settlements`      | Liquidaciones mensuales                       |
| `settlement_items`          | Detalle económico de liquidaciones            |
| `promoter_invoices`         | Facturas presentadas                          |
| `settlement_payments`       | Transferencias y comprobantes                 |
| `internal_role_assignments` | Roles internos                                |
| `notifications`             | Avisos internos                               |
| `audit_events`              | Registro de operaciones sensibles             |
| `privacy_requests`          | Solicitudes de privacidad                     |

No necesariamente cada entidad lógica requiere una tabla independiente. Algunas podrán implementarse mediante relaciones, vistas o estructuras existentes.

### Relaciones esenciales

Comercio potencial

Contactos e interacciones

Oportunidades

Oportunidad atribuida y convertida

Organización cliente

Condiciones económicas

Cobranzas elegibles y comisiones

Liquidaciones, facturas y pagos

Las atribuciones se relacionarán con oportunidades y promotores; las autorizaciones de onboarding, con promotores y organizaciones. No se deberá confundir ninguna de esas relaciones.

## 34. Integración con la aplicación existente

La implementación deberá integrarse con los servicios actuales de OrderOps, sin crear sistemas paralelos innecesarios.

### Identidad y autenticación

Reutilizar la autenticación existente cuando resulte compatible, incorporando los permisos internos y de promotores mediante mecanismos autorizados.

### Organizaciones

La conversión comercial deberá vincularse a las organizaciones reales de OrderOps, evitando crear una segunda representación de clientes que no pueda reconciliarse con el producto.

### Catálogo

Las autorizaciones de onboarding deberán restringir las operaciones reales de edición del catálogo, no simplemente ocultar botones.

### Suscripciones y cobranzas

Las comisiones deberán vincularse con registros verificables de pagos efectivamente recibidos. La fuente de verdad de cobranzas se determinará al inspeccionar la arquitectura existente.

### Seguridad de base de datos

Las políticas de acceso, incluida RLS donde corresponda, deberán verificarse sobre las tablas y operaciones reales. No se permitirá que un usuario eluda las restricciones del Commercial Core mediante consultas directas a otras entidades.

### Eventos e idempotencia

Las operaciones económicas y los eventos externos deberán tolerar reintentos sin duplicar:

- Leads.
- Oportunidades.
- Conversiones.
- Cobranzas elegibles.
- Comisiones.
- Liquidaciones.
- Pagos.

Los identificadores de origen y las restricciones de unicidad se definirán durante el diseño técnico.

# Parte IX — Reglas de integridad y casos límite

## 35. Invariantes del sistema

Estas reglas deben mantenerse verdaderas independientemente de la interfaz desde la que se ejecute una operación.

| ID     | Invariante                                                                                      |
| ------ | ----------------------------------------------------------------------------------------------- |
| INV-01 | Una reclamación provisional no equivale a una atribución confirmada.                            |
| INV-02 | Una oportunidad ganada requiere una organización cliente real vinculada.                        |
| INV-03 | Una oportunidad ganada no genera comisión sin cobranza elegible.                                |
| INV-04 | Una cobranza no puede generar dos veces la misma comisión por el mismo derecho económico.       |
| INV-05 | El contador Founder no puede superar doce mensualidades elegibles.                              |
| INV-06 | Un pago fallido no consume una posición del contador.                                           |
| INV-07 | Los términos económicos históricos no se alteran por cambios futuros de programa.               |
| INV-08 | Una comisión pendiente no se liquida antes de cumplir sus condiciones de disponibilidad.        |
| INV-09 | Una liquidación aprobada requiere factura válida antes de la transferencia.                     |
| INV-10 | Registrar una transferencia no debe duplicar pagos ante reintentos.                             |
| INV-11 | Una disputa no puede modificar silenciosamente registros económicos históricos.                 |
| INV-12 | La atribución no concede permisos dentro de la organización cliente.                            |
| INV-13 | El acceso de onboarding exige autorización vigente y alcance permitido.                         |
| INV-14 | La desvinculación del promotor no elimina automáticamente derechos adquiridos.                  |
| INV-15 | Una fusión de comercios no transfiere automáticamente atribuciones.                             |
| INV-16 | Los usuarios no pueden acceder a datos ajenos mediante identificadores conocidos o manipulados. |
| INV-17 | Una notificación fallida no revierte la operación que la originó.                               |
| INV-18 | Toda operación sensible debe ser autorizada y auditada.                                         |

## 36. Casos límite obligatorios para pruebas

La implementación deberá probar, como mínimo, los siguientes escenarios.

Captación: dos solicitudes simultáneas del mismo comercio; números telefónicos en formatos diferentes; dos sucursales con la misma marca; una solicitud que coincide parcialmente con un lead existente.

Atribución: dos promotores reclaman el mismo comercio; una reclamación vence; se solicita una extensión sin actividad real; llega un lead orgánico después de una atribución confirmada; una disputa afecta una comisión ya liquidada.

Conversión: se marca una oportunidad como ganada sin organización; el comercio ya posee una organización; un cliente acepta la propuesta pero nunca paga.

Onboarding: vence una autorización mientras el promotor está trabajando; el cliente revoca permisos; el promotor intenta cambiar precios; un administrador autoriza excepcionalmente un acceso.

Comisiones: cobranza duplicada; pago fallido y posterior reintento; reversa dentro de quince días; contracargo después de pagar al promotor; duodécima mensualidad elegible; cancelación y reactivación dentro o fuera de los 180 días.

Liquidaciones: comisión liberada después del cierre; factura con importe incorrecto; transferencia parcial; transferencia fallida; cambio de CBU previo al pago; reintento de registrar una transferencia.

Seguridad: un promotor intenta consultar otro promotor; un usuario de Soporte intenta aprobar una liquidación; un promotor desvinculado intenta editar un catálogo; un usuario revocado conserva una sesión abierta.

Todos estos casos deberán tener resultados esperados explícitos en los criterios de aceptación técnicos.

# Parte X — Plan de implementación por fases

## 37. Estrategia aprobada

CC-39 — Opción B

El Commercial Core V1 será integral en su alcance, pero incremental en su implementación.

Cada fase deberá tener:

- Contrato funcional y técnico.
- Dependencias identificadas.
- Migraciones controladas.
- Permisos y seguridad.
- Pruebas automatizadas pertinentes.
- Evidencia de funcionamiento.
- Criterios de aceptación.
- Procedimiento de reversión cuando corresponda.

## 01

Fundaciones, modelo de datos y seguridad

Revisión del repositorio, autenticación, organizaciones, permisos, auditoría, migraciones, programas comerciales y contratos entre módulos.

Criterio de salida: modelo coherente, migraciones verificadas y controles de acceso probados.

## 02

Captación y CRM comercial

Formulario público, comercios, contactos, deduplicación, oportunidades, pipeline, tareas, demos y vistas internas.

Criterio de salida: una solicitud real puede convertirse en una oportunidad gestionable sin duplicaciones indebidas.

## 03

Promotores y atribuciones

Registro, verificaciones, contratos, activación, panel, reclamaciones, confirmaciones, conflictos y desvinculación.

Criterio de salida: el origen comercial y sus derechos pueden determinarse y auditarse sin acceso indebido entre promotores.

## 04

Conversión y onboarding

Vinculación con organizaciones, estados de conversión, solicitudes de asistencia y autorizaciones temporales de catálogo.

Criterio de salida: el promotor solo puede modificar recursos expresamente autorizados y durante el plazo concedido.

## 05

Comisiones y circuito financiero

Cobranzas verificadas, programa Founder, contador de doce pagos, ventana de seguridad, ajustes, liquidaciones, facturas y transferencias.

Criterio de salida: un caso económico completo puede reproducirse desde la cobranza del cliente hasta el pago al promotor.

## 06

Consolidación y puesta en producción

Notificaciones, políticas de conservación, pruebas de integración, seguridad, escenarios excepcionales, observabilidad y documentación.

Criterio de salida: módulos integrados, pruebas satisfactorias y autorización explícita de despliegue.

El orden concreto podrá ajustarse por dependencias técnicas descubiertas durante la inspección del código.

## 38. Condiciones para considerar terminada V1

No bastará con que las pantallas estén construidas.

Commercial Core V1 se considerará funcionalmente completo cuando:

1. Una solicitud de demo pueda captarse, identificarse y gestionarse.
2. Un promotor pueda registrarse y activarse cumpliendo los requisitos aprobados.
3. Las oportunidades y atribuciones puedan administrarse con seguridad.
4. El proceso de conversión se vincule con organizaciones reales.
5. Las autorizaciones de onboarding funcionen con límites efectivos.
6. Las cobranzas elegibles generen correctamente las comisiones Founder.
7. Las liquidaciones, facturas y pagos puedan administrarse sin planillas externas como fuente de verdad.
8. Las disputas y reversas conserven trazabilidad económica.
9. Los permisos impidan accesos y operaciones no autorizados.
10. Los casos críticos estén cubiertos por pruebas y documentación.

La habilitación de cada módulo en producción deberá realizarse de forma controlada. En particular, ninguna automatización económica debe operar sobre dinero real sin validación previa y autorización explícita.

# Parte XI — Definiciones técnicas todavía pendientes

## 39. Puntos que requieren precisión antes de programar

Las 39 decisiones comerciales están cerradas. Sin embargo, una especificación funcional aprobada no sustituye todos los contratos técnicos.

Para evitar que Cursor invente reglas, estos puntos deben resolverse durante la preparación de la especificación implementable.

| Tema                 | Precisión necesaria                                                                 |
| -------------------- | ----------------------------------------------------------------------------------- |
| Base comisionable    | Tratamiento exacto de IVA, descuentos, devoluciones parciales y cargos no elegibles |
| Pagos parciales      | Cuándo una mensualidad se considera exitosa y cuándo consume una posición           |
| Actividad calificada | Evidencias concretas y reglas de extensión de reclamaciones                         |
| Deduplicación        | Criterios de confianza, umbrales y comportamiento ante concurrencia                 |
| Disputas             | Estados internos, responsables y procedimiento de apelación o revisión              |
| Liquidaciones        | Manejo de ajustes tardíos, facturas corregidas y aprobaciones excepcionales         |
| Seguridad financiera | Separación de funciones cuando una misma persona posee varios roles                 |
| Privacidad           | Plazos concretos por categoría y procedimientos de supresión                        |
| Integración          | Fuente real de cobranzas, organizaciones, catálogo y autenticación                  |
| Operación            | Monitoreo, alertas técnicas, recuperación y procedimientos ante fallos              |

Estos puntos no reabren las decisiones CC-01 a CC-39. Son precisiones necesarias para implementar correctamente lo ya aprobado.

En especial, la base comisionable y el tratamiento de pagos parciales deben definirse antes de habilitar el motor económico, porque afectan directamente el dinero que corresponde a cada parte.

## 40. Validación legal y contable

Antes de operar comercialmente deberán revisarse, con profesionales argentinos competentes:

- Contrato de agencia comercial.
- Condición de independencia del promotor.
- Requisitos de monotributo y verificación fiscal.
- Facturación de comisiones.
- Impuestos y retenciones aplicables.
- Tratamiento de reversas y compensaciones.
- Conservación documental.
- Protección de datos personales.
- Condiciones de cancelación y desvinculación.

El Commercial Core debe permitir cumplir los acuerdos aprobados, pero la documentación funcional no reemplaza el asesoramiento jurídico y contable.

# Parte XII — Documentación complementaria

## 41. Manual Operativo y Comercial de OrderOps

Tal como acordamos, después de consolidar la especificación técnica prepararemos un manual separado.

No será una copia de esta especificación.

La especificación explica qué debe hacer el sistema y bajo qué reglas. El manual explicará cómo debe trabajar una persona con OrderOps.

Su estructura propuesta será:

| Capítulo                   | Contenido                                                |
| -------------------------- | -------------------------------------------------------- |
| 1. Modelo comercial        | Cómo funciona la adquisición de clientes                 |
| 2. Programa Founder        | Precios, condiciones y ejemplos económicos               |
| 3. Promotores              | Incorporación, contratos, activación y responsabilidades |
| 4. Captación               | Cómo registrar comercios y solicitar demos               |
| 5. CRM                     | Gestión de oportunidades, tareas y seguimiento           |
| 6. Atribuciones            | Reclamaciones, conflictos y protección comercial         |
| 7. Conversión              | Cómo convertir oportunidades en clientes                 |
| 8. Onboarding              | Procedimientos de asistencia autorizada                  |
| 9. Comisiones              | Cómo se generan y calculan                               |
| 10. Finanzas               | Liquidaciones, facturación y transferencias              |
| 11. Situaciones especiales | Bajas, reactivaciones, reversas y disputas               |
| 12. Administración         | Roles, permisos, auditoría y privacidad                  |
| 13. Procedimientos diarios | Rutinas de comerciales, promotores y Finanzas            |
| 14. Casos prácticos        | Ejemplos completos desde la captación hasta el pago      |

Podremos convertirlo posteriormente en material de capacitación para nuevos integrantes y promotores.

## 42. Registro consolidado de decisiones

Esta matriz sirve como índice de trazabilidad entre el cuestionario y la especificación.

| Decisión | Definición aprobada                                  |
| -------- | ---------------------------------------------------- |
| CC-01    | Lead centrado en el comercio                         |
| CC-02    | Reclamación provisional, sin atribución automática   |
| CC-03    | Confirmación híbrida de atribuciones                 |
| CC-04    | Leads orgánicos y reclamaciones tardías justificadas |
| CC-05    | Resolución controlada de conflictos                  |
| CC-06    | Reclamaciones provisionales de 30 días               |
| CC-07    | Atribución asociada a oportunidad                    |
| CC-08    | Oportunidades por intención comercial calificada     |
| CC-09    | Pipeline comercial flexible y auditado               |
| CC-10    | Conversión vinculada a organización real             |
| CC-11    | Promotor como agente comercial activo                |
| CC-12    | Permisos comerciales delimitados del promotor        |
| CC-13    | Asistencia a clientes mediante autorización          |
| CC-14    | Edición limitada de contenido del catálogo           |
| CC-15    | Aprobación de asistencia por cliente autorizado      |
| CC-16    | Autorizaciones de onboarding de hasta 30 días        |
| CC-17    | Contacto comercial posterior sin acceso automático   |
| CC-18    | Comisiones generadas por cobranzas elegibles         |
| CC-19    | Comisiones recurrentes limitadas                     |
| CC-20    | Primeras 12 mensualidades exitosas elegibles         |
| CC-21    | Porcentaje sobre cobranza real elegible              |
| CC-22    | Porcentaje global por programa en V1                 |
| CC-23    | Condiciones económicas Founder                       |
| CC-24    | Comisión de setup sujeta a cobro y onboarding        |
| CC-25    | Ventana de seguridad de 15 días                      |
| CC-26    | Liquidaciones mensuales y pago en primeros 10 días   |
| CC-27    | Transferencias manuales auditadas                    |
| CC-28    | Contrato de agencia, monotributo y facturación       |
| CC-29    | Conservación de derechos tras desvinculación         |
| CC-30    | Protección de oportunidades abiertas por 90 días     |
| CC-31    | Protección de reactivación por 180 días              |
| CC-32    | Disputas formales y ajustes económicos auditados     |
| CC-33    | Roles internos y permisos granulares                 |
| CC-34    | Notificaciones internas y por correo                 |
| CC-35    | Formulario breve de solicitud de demo                |
| CC-36    | Deduplicación híbrida                                |
| CC-37    | Tareas comerciales integradas                        |
| CC-38    | Archivado, conservación y privacidad                 |
| CC-39    | V1 integral implementada por fases                   |

## 43. Cierre de la especificación funcional

Con la aprobación de CC-39 queda cerrado el cuestionario de definición funcional del Commercial Core V1.

El alcance aprobado es un sistema que acompaña el ciclo completo de adquisición comercial:

Captación → Oportunidad → Atribución → Conversión → Onboarding → Cobranza → Comisión → Liquidación → Factura → Pago.

El siguiente trabajo ya no debería consistir en continuar indefinidamente el cuestionario, sino en transformar esta especificación en una especificación técnica ejecutable por Cursor.

Para eso propongo tomar este documento como base, inspeccionar el estado real del repositorio de OrderOps, identificar componentes reutilizables, resolver las precisiones técnicas pendientes y producir contratos de implementación por fase.

De esa manera, podremos trabajar sobre una única definición del producto, con trazabilidad entre lo que decidimos, lo que Cursor implemente y lo que finalmente quede funcionando.

Commercial Core OrderOps V1 — Especificación funcional consolidada.