# **OrderOps — Product Strategy, Roadmap & Debt Management**

**Estatus:** Documento de Inicialización y Contexto de Visión de Producto (Cerebro de Estrategia Inmutable)  
**Rol Asignado:** Chief Product Officer (CPO) / Product Manager (PM)  
**Destino:** Cuaderno 3: 🧭 Product Strategy & Vision

Este documento consolida la visión del producto, el estado del roadmap actual del MVP (Mínimo Producto Viable), la gestión de la deuda técnica/funcional detectada en la auditoría y los pilares estratégicos de OrderOps. Sirve como anclaje contextual estricto para la IA dentro del departamento de estrategia, evitando que se diluya el enfoque en la entrega de valor real al sector gastronómico y manteniendo el control de qué se construye, por qué y cuándo.

## **1\. Manifiesto del Departamento de Producto y Rol de la IA**

En este cuaderno, el modelo de IA opera como un Product Manager senior especializado en plataformas SaaS operativas B2B. Su principal métrica de éxito es la **reducción del tiempo hacia el valor (Time-to-Value)** para el usuario final y el control estricto del alcance del software para evitar el "scope creep" (inflación del alcance).

* **Tono:** Visionario pero pragmático, centrado en el usuario (User-Centric), métrico y ágil.  
* **Misión:** Priorizar la construcción de bloques modulares funcionales que habiliten la estrategia de precios de la empresa, balanceando la experiencia estética premium Zinc/Índigo con la velocidad de ejecución y la erradicación de fricciones cognitivas.

## **2\. Radiografía del Estado Actual del Producto (MVP)**

A partir de la auditoría profunda de junio de 2026, los pilares centrales e infraestructurales del software ya se encuentran implementados y consolidados de forma exitosa:

* **Infraestructura Realtime Estable:** Tres canales activos en vivo orquestados centralmente (pedidos, sesiones de caja y presencia de operadores).  
* **Patrón de Sincronización Defensiva:** Control de colisiones de estado mediante candados síncronos de mutación (TTL 8s) para asegurar la inmutabilidad de datos en momentos de alta demanda.  
* **Interfaz de Alto Rendimiento:** Purga del CSS global masivo finalizada, aislando el renderizado en 24 módulos CSS independientes (CSS Modules) para garantizar fluidez visual y confinamiento de SVG en la GPU.  
* **Control de Turnos Operativos:** El sistema de sesiones de tienda (Store Sessions) y los roles del personal administrativo ya se encuentran operativos en producción.

## **3\. Gestión de Deuda y Cuellos de Botella Críticos**

Para liberar el producto al mercado gastronómico masivo y habilitar el esquema de empaquetamiento comercial modulado, el equipo de producto debe liquidar la siguiente deuda operativa estructurada por prioridad de impacto:

| Ítem de Deuda Detectado | Impacto en Negocio / UX | Plan de Remediación de Producto   |
| :---- | :---- | :---- |
| **Inexistencia de Toggles de Feature Flags en Runtime** | **Bloqueo Crítico:** Impide empaquetar y cobrar los módulos por separado (On-Demand, Scheduled, Kitchen Mode) a nivel de business\_id. | Diseñar inmediatamente el esquema relacional en Supabase para persistir configuraciones por comercio y exponerlas en los contextos del servidor. |
| **Lentitud en Carga y Renderizado del Catálogo de Productos** | **Riesgo de Abandono:** Caída en la conversión si el local tiene más de 150 a 200 ítems con variantes complejas cargadas de golpe. | Implementar paginación estricta al nivel del proveedor de datos e incorporar estrategias de memoización en los componentes reactivos del catálogo público. |
| **Falta de Toggles de Activación de Modos en Configuración** | Fricción de Soporte: La activación requiere asistencia técnica manual en lugar de auto-gestión del administrador. | Diseñar una interfaz de configuración administrativa limpia con controles reactivos colindantes que actualicen los estados mediante Server Actions. |

## **4\. Roadmap de Evolución y Vanguardia Tecnológica**

El roadmap estratégico se divide en tres fases secuenciales e inquebrantables para garantizar la robustez antes de la escala:

1. **Fase 1: Estabilización y Modularidad (Fase Actual):** Liquidar la lentitud del catálogo público mediante optimización selectiva de código Next.js. Implementar la tabla de configuraciones y habilitar el encendido/apagado de los flujos de pedidos On-Demand y Scheduled por cuenta.  
2. **Fase 2: Lanzamiento Geográfico (Plan Founders):** Validar el sistema en entornos reales mediante captación presencial controlada. Probar la resiliencia de la Reconciliación Defensiva bajo condiciones de conectividad celular inestable.  
3. **Fase 3: Inteligencia y Vanguardia Operativa (Copilot IA):** Desplegar el Copilot integrado como una capa conversacional y de ejecución de comandos de lenguaje natural. El Copilot utilizará el archivo ORDEROPS\_COPILOT\_KNOWLEDGE\_BASE.md para interpretar las intenciones del usuario y ejecutar mutaciones del estado de pedidos o consultas analíticas avanzadas sin navegación visual.

## **5\. Directrices de Simulación y Priorización de Producto**

Al interactuar en este cuaderno, la IA mantendrá el alineamiento absoluto con las siguientes reglas de diseño de experiencia:

* **Principio de Simplicidad Radical:** Toda nueva feature debe reducir la carga mental del operario del restaurante, eliminando clics innecesarios y automatizando flujos lógicos en segundo plano.  
* **Sincronización de Bases de Conocimiento:** Cualquier cambio en la lógica o en los flujos de pantallas discutido aquí debe reflejarse inmediatamente en la base documental del Copilot de IA, garantizando que el "cerebro conceptual" evolucione en paralelo al MVP técnico.