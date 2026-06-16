Claro. Acá tenés el contenido completo para `docs/context.md`:

````markdown
# OrderOps: Contexto General del Sistema

## 1. Visión del Producto y Problema de Negocio

OrderOps es una plataforma SaaS multi-tenant orientada a operaciones en tiempo real para negocios gastronómicos, dark kitchens, fast food, cafeterías y comercios que gestionan gran parte de sus ventas a través de canales conversacionales como WhatsApp. Su objetivo no es reemplazar el canal de venta existente, sino construir una capa operativa centralizada encima de esos canales para convertir conversaciones dispersas, pedidos manuales, notas internas y coordinación informal en un sistema operacional vivo, medible y sincronizado.

El problema central que resuelve OrderOps es la pérdida de control operativo durante jornadas reales de trabajo. En negocios de alta rotación, los pedidos suelen entrar por múltiples conversaciones, operadores o dispositivos, y la información crítica queda distribuida entre chats, memoria humana, papeles o sistemas desconectados. Esto genera pérdida de contexto, duplicación de tareas, pedidos sin responsable, demoras invisibles, baja trazabilidad, sobrecarga cognitiva y dificultad para entender en tiempo real qué requiere atención inmediata.

OrderOps transforma ese flujo caótico en un panel operacional compartido donde múltiples operadores pueden trabajar simultáneamente sobre el mismo estado del negocio. Cada pedido se convierte en una entidad operativa estructurada, visible, asignable, priorizable y medible. La plataforma permite que equipos de atención, cocina, despacho, administración y ownership operen con una misma verdad sincronizada, reduciendo fricción entre personas y aumentando la capacidad de respuesta.

Desde el punto de vista de producto, OrderOps funciona como un “sistema nervioso operacional” para negocios que todavía venden de forma conversacional, pero necesitan estándares de ejecución similares a herramientas más avanzadas. La plataforma no se limita a mostrar pedidos: interpreta el estado operativo, detecta congestión, identifica riesgo, agrupa tareas por flujo de trabajo, muestra actividad reciente, resume métricas vivas y ayuda a decidir qué acción tomar a continuación.

La propuesta de valor se apoya en tres pilares:

1. Centralización operacional: todos los pedidos, estados, responsables, actividad e indicadores viven en un dashboard único.
2. Sincronización en tiempo real: operadores múltiples ven el mismo estado sin depender de refresh manual o comunicación externa.
3. Reducción de carga cognitiva: la interfaz prioriza riesgo, urgencia, estado, ownership y flujo operativo antes que información secundaria.

OrderOps debe ser entendido como una plataforma de ejecución, no como un simple CRUD de pedidos. Toda decisión técnica y visual debe preservar la idea de un tablero vivo, táctico, colaborativo y resiliente.

## 2. Flujo Operacional y Máquina de Estados (Workflow)

El núcleo funcional de OrderOps es una máquina de estados operativa estricta para pedidos. Cada pedido atraviesa un flujo controlado, donde los estados representan etapas reales de trabajo y no simples etiquetas visuales.

La secuencia base es:

```text
Pending -> Preparing -> Ready -> Completed
                         -> Cancelled
Pending -> Cancelled
Preparing -> Cancelled
Ready -> Cancelled
````

Los estados principales son:

* `Pending`: pedido recibido, aún no iniciado o pendiente de toma de acción. Representa backlog operativo.
* `Preparing`: pedido en ejecución, normalmente asociado a cocina, armado o preparación activa.
* `Ready`: pedido listo para entregar, retirar o despachar. Representa salida pendiente.
* `Completed`: pedido cerrado exitosamente.
* `Cancelled`: pedido cerrado por excepción, error, cancelación del cliente o decisión interna.

La lógica de workflow no debe tratar estos estados como simples filtros. Cada estado impacta en métricas, prioridad, scanning operacional, lanes, insights y lectura de riesgo. Un cambio de estado debe actualizar inmediatamente la representación del pedido, las métricas derivadas, las agrupaciones visibles y cualquier señal operacional relacionada.

OrderOps utiliza lanes dinámicas por workflow. Las lanes no son únicamente columnas visuales; son agrupaciones operativas derivadas del estado, el método de entrega, el riesgo, el ownership y la etapa del pedido. Las lanes permiten al operador leer rápidamente dónde está concentrado el trabajo:

* backlog pendiente;
* pedidos en preparación;
* pedidos listos;
* completados;
* cancelados;
* señales de congestión o excepción.

El ownership colaborativo es otro componente central. Un pedido puede estar sin responsable, asignado a un operador o sujeto a reasignaciones durante la jornada. La asignación debe ser visible, trazable y operacionalmente útil. La plataforma debe diferenciar entre “pedido existente” y “pedido bajo control”. Un pedido sin responsable representa riesgo operacional aunque su estado sea válido.

La actividad operacional debe registrarse como eventos. Cada cambio relevante, como creación del pedido, cambio de estado, asignación, reasignación, cancelación o cierre, forma parte del timeline operativo. Estos eventos alimentan la trazabilidad, los insights y la lectura de actividad reciente.

OrderOps también trabaja con sesiones de negocio vivas y ventanas operacionales diarias. Una sesión representa la apertura operativa del negocio durante una jornada o rango activo. La ventana operacional define qué pedidos pertenecen al scope actual de análisis. Esto evita mezclar pedidos históricos con operación viva y permite métricas coherentes por jornada.

El dashboard debe distinguir entre:

* jornada actual;
* sesión activa;
* pedidos visibles;
* pedidos filtrados;
* pedidos operacionales;
* pedidos históricos.

Las métricas compactas y snapshots KPI deben derivar siempre de fuentes vivas y scopeadas correctamente. No deben recalcularse desde datasets obsoletos ni desde filtros inconsistentes. Las métricas principales incluyen ventas, ticket promedio, pedidos activos, completados, delivery/retiro, producto más vendido, tiempo promedio, preparación, estancados, cancelados, reasignaciones y último movimiento.

El scanning operacional tiene como función detectar el estado del tablero de manera táctica. No debe ser un reporte decorativo, sino una lectura compacta de cola, presión, riesgo y actividad. Debe responder preguntas como:

* ¿Hay pedidos sin responsable?
* ¿Hay pedidos demorados?
* ¿Hay concentración en preparación?
* ¿Hay salida acumulada?
* ¿Hay cancelaciones relevantes?
* ¿El panel está realmente en escucha?
* ¿La operación está tranquila o bajo carga?

La prioridad dinámica surge de la combinación de estado, antigüedad, ownership, método, riesgo y actividad. Un pedido pendiente reciente no tiene el mismo peso que un pedido en preparación sin movimiento hace varios minutos. La interfaz debe ayudar a identificar qué pedido merece atención antes de que el operador tenga que interpretar manualmente todo el tablero.

## 3. Arquitectura Técnica y Estrategia Realtime

OrderOps está construido con una arquitectura frontend moderna basada en Next.js con App Router, React y TypeScript. La aplicación se organiza en rutas protegidas, layouts administrativos, componentes especializados y estilos componentizados. El dashboard principal de pedidos concentra la experiencia operacional, pero debe mantenerse desacoplado por dominios funcionales para permitir crecimiento futuro.

El frontend debe respetar una arquitectura componentizada donde las responsabilidades estén separadas:

* layout administrativo;
* navegación;
* dashboard de pedidos;
* cards de pedidos;
* controles de sesión;
* filtros y búsqueda;
* métricas;
* modales;
* notificaciones;
* componentes de superficie;
* componentes futuros de kitchen/delivery.

TypeScript debe usarse como contrato de seguridad entre datos, UI y operaciones. Las entidades críticas, como pedidos, estados, eventos, sesiones, perfiles, roles y métricas, deben tener tipos explícitos. La aplicación no debe depender de objetos ambiguos ni de estructuras implícitas para flujos críticos.

El backend se apoya en Supabase como plataforma principal. Supabase provee:

* PostgreSQL como base de datos relacional;
* Supabase Auth para autenticación;
* Row Level Security para aislamiento multi-tenant;
* Realtime Channels para sincronización de cambios;
* Presence para detectar operadores conectados;
* APIs seguras para queries y mutaciones.

La estrategia realtime es un elemento crítico del sistema. OrderOps no puede depender únicamente de refresh manual ni de fetch aislado. Los pedidos, sesiones y actividad deben converger hacia el mismo estado en múltiples pestañas, dispositivos y operadores.

La sincronización realtime debe considerar:

* eventos `INSERT`, `UPDATE` y eventualmente `DELETE` sobre pedidos;
* eventos sobre sesiones de negocio;
* eventos asociados a order events;
* presencia de operadores;
* rehidratación defensiva cuando un evento se pierde;
* reconciliación contra el estado real del backend;
* protección contra patches incompletos;
* consistencia entre cards, lanes, métricas, insights y activity feed.

La aplicación debe evitar que un evento parcial deje al dashboard en un estado incoherente. Cuando un pedido cambia por realtime, no basta con parchear superficialmente la card; las derivaciones operativas también deben recibir datos completos. Si el evento realtime no incluye relaciones necesarias, debe existir una estrategia de reconciliación para hidratar el resumen del pedido desde una fuente completa.

La UX optimista se utiliza para minimizar fricción. Cuando un operador realiza una acción, la interfaz puede adelantar visualmente el resultado esperado, siempre que exista una estrategia de rollback o reconciliación. La prioridad es que el tablero se sienta vivo y táctico sin sacrificar consistencia final.

Las derivaciones del dashboard deben estar memoizadas cuando corresponda. Métricas, lanes, insights, scanning y filtros deben derivarse de fuentes vivas claramente definidas. El uso de `useMemo` debe proteger performance y evitar recomputaciones innecesarias, pero nunca debe ocultar dependencias faltantes. Toda derivación operacional debe colgar de la misma cadena de verdad:

```text
orders realtime/hydrated
-> optimisticOrders
-> businessWindowOrders
-> visibleOperationalOrders
-> filteredOrders
-> lanes / metrics / insights / activity
```

La arquitectura debe ser resiliente a pestañas abiertas, conexiones inestables, eventos perdidos y reconexiones. El realtime no debe ser un lujo visual; es parte del contrato funcional de OrderOps.

Los estilos se gestionan mediante CSS componentizado y responsive Mobile-First. La interfaz debe mantener una separación clara entre componentes visuales, layouts y tokens. Los estilos heredados deben evitarse cuando comprometan escalabilidad o generen inconsistencias entre módulos.

La experiencia mobile es crítica porque muchos operadores trabajan desde teléfonos. Cualquier patrón visual debe considerar restricciones reales de Android Chrome, GPU rasterization, scrolling, composición de capas, performance de dispositivos modestos y estabilidad del render. Las decisiones visuales no deben comprometer la operación.

## 4. Multi-Tenancy y Seguridad (Supabase RLS)

OrderOps es una plataforma multi-tenant. Cada negocio debe operar dentro de un espacio lógico completamente aislado. La separación por tenant no puede depender únicamente del frontend. Debe estar garantizada a nivel de base de datos mediante `tenant_id`, políticas de Row Level Security y validaciones consistentes en queries y mutaciones.

Cada entidad crítica debe estar asociada explícitamente a un negocio o tenant:

* pedidos;
* productos;
* clientes;
* sesiones;
* eventos de pedido;
* miembros del equipo;
* perfiles;
* roles;
* configuraciones;
* métricas derivadas cuando correspondan.

La regla de seguridad principal es:

```text
ningún usuario puede leer, modificar, crear o eliminar datos de un tenant al que no pertenece.
```

Supabase RLS debe aplicar esta regla de forma estricta. El frontend puede filtrar por tenant para performance y claridad, pero la seguridad real debe vivir en la base de datos. Toda tabla operacional debe tener políticas explícitas de lectura y escritura vinculadas al usuario autenticado, su pertenencia al negocio y su rol.

La autenticación se realiza mediante Supabase Auth. Luego de autenticarse, el sistema debe resolver el contexto operacional del usuario:

* usuario autenticado;
* perfil;
* negocio asociado;
* rol;
* permisos;
* sesión activa si existe;
* scope operacional visible.

El sistema debe contemplar roles diferenciados, aunque el MVP trabaje inicialmente con un conjunto reducido. La arquitectura debe permitir evolucionar hacia:

* owner;
* manager;
* operador;
* cocina;
* delivery;
* soporte;
* roles especializados futuros.

Las operaciones de escritura deben validar permisos. No todos los roles deberían tener acceso a cerrar sesión, cancelar pedidos, modificar catálogo, reasignar responsables o cambiar configuración del negocio. Aunque algunas restricciones puedan implementarse progresivamente, la arquitectura debe asumir desde el inicio que permisos y roles son parte del dominio.

Las sesiones de negocio también deben respetar tenant isolation. Un usuario no puede abrir, cerrar o consultar sesiones de otro negocio. La sincronización realtime de sesiones debe estar filtrada por tenant y protegida por RLS.

El diseño multi-tenant debe prevenir errores de contexto. Todas las queries del dashboard deben ejecutarse con tenant explícito cuando sea necesario. No deben existir queries globales no filtradas que luego dependan de filtrado en cliente. Las métricas y derivaciones deben calcularse sobre datasets ya scopeados.

La seguridad también incluye consistencia operacional. Un pedido no debe aparecer en un dashboard si no pertenece al negocio actual, aunque la UI o el cache local estén en un estado intermedio. La rehidratación defensiva debe respetar tenant, sesión y ventana operacional.

## 5. Principios de UX/UI y Preparación de Futuros Módulos

La UX de OrderOps debe responder a una premisa principal: reducir carga cognitiva durante operación real. La interfaz debe ayudar al operador a entender el estado del negocio en segundos. No debe obligarlo a leer reportes extensos ni a interpretar tablas densas mientras la operación está en curso.

La jerarquía visual debe priorizar:

1. riesgo operacional;
2. pedidos que requieren acción;
3. estado del flujo;
4. ownership;
5. tiempos y demoras;
6. actividad reciente;
7. métricas de negocio;
8. contexto secundario.

El dashboard debe transmitir una percepción premium, pero sin sacrificar estabilidad ni legibilidad. Los KPIs no deben ser decoración: deben funcionar como snapshot operacional. Cada métrica visible debe responder una pregunta real y derivar de datos confiables. Si una métrica no genera valor operacional, debe revisarse o eliminarse.

El sistema visual debe ser reutilizable y escalable. Los componentes deben poder crecer hacia productos, clientes, equipo, reportes, configuración y módulos especializados sin heredar estilos rotos ni deuda visual. La arquitectura CSS debe evitar parches aislados y favorecer tokens, patrones de superficie, spacing consistente, tipografía estable y estados previsibles.

Los empty states son parte del producto, no placeholders. Un tablero sin pedidos debe explicar qué está ocurriendo y qué acción puede tomar el usuario. Por ejemplo, diferenciar entre:

* no hay pedidos en la jornada actual;
* no hay pedidos en la sesión activa;
* no hay resultados por filtros;
* no hay actividad reciente;
* el panel está escuchando nuevos ingresos;
* falta abrir sesión.

La navegación debe ser adaptativa. Desktop puede privilegiar navegación horizontal o lateral según evolución del producto, mientras que mobile debe ofrecer acceso rápido sin interferir con el flujo operativo. El menú mobile, drawers y overlays deben ser seguros para dispositivos reales, evitando patrones de composición visual costosos cuando comprometan estabilidad.

OrderOps debe estar preparado para futuros módulos:

### Kitchen Mode

Kitchen Mode será una vista especializada para cocina. Debe optimizarse para preparación, tiempos, cola, prioridad y acciones rápidas. No debe mostrar toda la complejidad administrativa. Su foco será responder:

* qué preparar ahora;
* qué está demorado;
* qué está listo para salida;
* qué pedido requiere atención especial;
* qué estación o preparación está congestionada.

### Delivery Mode

Delivery Mode será una vista especializada para repartidores. Debe mostrar solo pedidos asignados o disponibles para reparto, con acciones tácticas:

* abrir mapa;
* contactar por WhatsApp;
* llamar al cliente;
* marcar en camino;
* marcar entregado;
* reportar incidencia.

Este modo debe reducir fricción y no exponer funcionalidades administrativas innecesarias.

### Roles Especializados

La plataforma debe evolucionar hacia permisos y vistas por rol. Un operador de atención, una persona de cocina, un delivery y un manager no necesitan la misma interfaz ni las mismas acciones. La arquitectura debe permitir que cada rol tenga una vista optimizada sin duplicar lógica crítica.

### Dark Theme

El sistema visual debe prepararse para dark theme desde tokens y no desde overrides improvisados. Colores, backgrounds, borders, semantic states, shadows, surfaces y typography deben definirse de manera compatible con temas. Cualquier nuevo componente debe evitar colores hardcoded cuando exista un token disponible.

### Escalabilidad Visual

Toda nueva funcionalidad debe integrarse al sistema visual de OrderOps sin romper consistencia. Las cards, pills, botones, inputs, modales, snapshots, summaries y estados deben compartir reglas comunes. La app debe evitar crecer como una colección de pantallas aisladas.

### Principio Rector

OrderOps es una herramienta de operación en tiempo real. Cada decisión de producto, arquitectura, UI o backend debe responder a esta pregunta:

```text
¿Esto ayuda a que un equipo opere más rápido, con menos errores y con mayor claridad durante una jornada real?
```

Si la respuesta es no, debe revisarse su prioridad, su diseño o su implementación.

```
```
