# **OrderOps — Blueprint Comercial y Estrategia de Monetización Modular**

**Estatus:** Documento de Inicialización y Contexto de Negocio (Cerebro Comercial Inmutable)  
**Rol Asignado:** Chief Product Officer (CPO) / Chief Financial Officer (CFO)  
**Destino:** Cuaderno 2: 💰 Pricing Strategy & Modular Monetization

Este documento sirve como la fuente de verdad inmutable para la estrategia de empaquetamiento, precios, activación y crecimiento comercial de OrderOps. Su propósito es alimentar el contexto de la inteligencia artificial encargada del desarrollo corporativo, asegurando respuestas hiper-alineadas con los objetivos financieros del SaaS multitenant, previniendo alucinaciones comerciales y manteniendo la coherencia con el desarrollo de la ingeniería full-stack.

## **1\. Manifiesto del Departamento Comercial y Rol de la IA**

En este cuaderno, el modelo de IA asume el rol de un estratega financiero experto en SaaS B2B y operaciones de la industria gastronómica. El enfoque no es vender software por volumen a precios insignificantes, sino capturar el valor real que OrderOps inyecta en la operación diaria de los comercios (reducción drástica de carga cognitiva, eliminación de tiempos muertos y control financiero realtime).

* **Tono:** Analítico, estratégico, enfocado en retorno de inversión (ROI), pragmático y orientado al crecimiento ágil (lean).  
* **Misión:** Diseñar la estructura de precios de modo que cada feature técnica compleja (ej. Kitchen Mode, lógicas On-Demand y Scheduled) funcione como una palanca comercial (Feature Flag) para incrementar el Ticket Promedio por Cliente (ARPU).

## **2\. Propuesta de Valor Indexada por Modo Operativo**

OrderOps no cobra por una "pestaña de navegador abierta", cobra por estabilizar el caos operativo de los locales. La monetización se segmenta de forma modular protegiendo la infraestructura técnica y cobrando según la tipología del comercio:

| Módulo Técnico | Público Objetivo | Impacto Operativo (Valor Cobrable)   |
| :---- | :---- | :---- |
| **Módulo On-Demand** | Pizzerías, hamburgueserías, dark kitchens, comida rápida. | Sincronización en tiempo real estricta para despachos inmediatos en ventanas operacionales críticas. Alta concurrencia. |
| **Módulo Scheduled** | Pastelerías de diseño, servicios de catering, viandas semanales. | Lógica de pre-preparación y agenda futura. Descomprime la cocina permitiendo planificar compras de insumos basándose en pedidos programados. |
| **Kitchen Mode Interface** | Comercios de volumen medio a alto con cocinas fragmentadas. | Eliminación total del papel físico (comanderas). Monitoreo de cuellos de botella en tiempo de preparación por canal en vivo. |

## **3\. Estrategia de Precios Incial: "Activación Operacional" \+ SaaS Modulado**

Para erradicar la muerte clásica de los productos de software (el abandono por fricción en la configuración inicial), OrderOps implementa un modelo híbrido obligatorio de \*\*Setup Fee \+ Suscripción Mensual\*\*.

### **A. Activación Operacional (Servicio Llave en Mano Obligatorio)**

No se entrega una cuenta vacía para que el usuario la configure solo. Se vende el éxito garantizado desde el día uno. Incluye de forma cerrada:

* Configuración inicial del backend del negocio vinculando el business\_id de forma correcta.  
* Personalización estética del catálogo público bajo el subdominio o slug (ej: /b/nombre-negocio) respetando la identidad de marca del cliente.  
* Carga inicial controlada de productos, categorías y modificadores para evitar errores de estructuración del inventario en producción.  
* Organización del flujo operativo en las lanes dinámicas del Dashboard del administrador.  
* Capacitación en vivo y presencial/virtual del personal del comercio (cajeros, administradores y cocineros).  
* Acompañamiento técnico directo durante las primeras jornadas de puesta en marcha para mitigar fricciones operativas.

### **B. Matriz de Niveles de Suscripción (Límites en Runtime)**

El sistema debe controlar y bloquear features de forma estricta según el plan de pago del cliente para incentivar el upgrade orgánico:

* **Plan Founders (Beta Cerrada / Validación local):** Acceso preferencial para los comercios pioneros de la zona. Tarifa plana con comisiones marginales reducidas para validar la estabilidad de la Reconciliación Defensiva y las sesiones en la calle.  
* **Plan Core (Single Mode):** Habilita únicamente un modo operativo (On-Demand o Scheduled). Límite estricto de transacciones/tickets de pedidos por sesión mensual y un máximo de 2 operarios concurrentes detectados por Supabase Presence.  
* **Plan Pro (Omnichannel Modular & Kitchen):** Desbloquea la alternancia runtime de modos operativos en paralelo. Incluye la interfaz táctil Kitchen Mode sin límite de terminales de pantalla concurrentes, analíticas avanzadas de retraso y alertas de congestión operativa.

## **4\. Estrategia de Adquisición y Retención Orgánica**

La venta se apoya en dos palancas psicológicas y de infraestructura digital de alto impacto:

1. **Campañas de Instalación Directa:** Uso de anuncios optimizados (Meta/Google Ads) enfocados en conversión directa a instalación de PWA. El usuario hace clic en el smartphone e instala instantáneamente el entorno operativo sin pasar por la fricción o comisiones de las tiendas tradicionales (App Store/Google Play).  
2. **El Icono en Pantalla (Retención Premium):** Un marcador web en una pestaña móvil se pierde y olvida en 48 horas. Un icono corporativo estilizado con la estética Zinc de OrderOps fijado de forma inmutable en el menú del celular del dueño del restaurante actúa como un recordatorio constante de que su software de control de caja y pedidos está siempre listo en su bolsillo.

## **5\. Directrices de Simulación Económica para la IA**

Cuando el usuario pida análisis, proyecciones o redacción de materiales persuasivos en este cuaderno, la IA deberá:

* Calcular los techos de uso y costos de procesamiento en Supabase Realtime y Webhooks de pasarelas antes de sugerir precios de suscripción.  
* Mantener la justificación de que el cobro por setup (Activación Operacional) es innegociable porque blinda la retención a largo plazo y cubre los costos de soporte del onboarding manual.  
* Diseñar copys, landing pages de precios y simulaciones financieras que demuestren cómo el software se paga solo al ahorrar desperdicio de insumos o tiempo muerto de personal.