# OX.1.7 - Consolidation Blueprint

## Resumen ejecutivo de OX.1

OX.1 deja una conclusion simple y fuerte: OrderOps ya tiene suficiente inteligencia operacional. El problema principal no es falta de informacion, sino **jerarquia insuficiente entre capas utiles**.

Las auditorias previas muestran un patron consistente:

- hay senales muy valiosas en KPIs, riesgo, feed, resumen y busqueda
- varias de esas senales compiten por el mismo primer segundo de atencion
- cards, riesgo y ownership son la verdad operacional mas accionable
- el contexto comercial sigue siendo valioso, pero no siempre merece el mismo peso
- mobile necesita menos capas, no solo menos ancho

Por eso, OX.1.7 no propone una UI exacta. Propone una filosofia operativa:

- **riesgo domina contexto**
- **cards son la verdad operacional**
- **la narrativa debe sintetizar, no competir**
- **el contexto comercial acompana, no bloquea**
- **la densidad util se conserva; la densidad redundante se degrada**

## Principios operacionales consolidados

1. Operacion antes que administracion.
2. Riesgo domina contexto.
3. Cards son la verdad operacional.
4. Ownership y foco de trabajo importan tanto como el estado del pedido.
5. El contexto comercial acompana, no bloquea.
6. La narrativa debe sintetizar, no competir.
7. La busqueda debe reducir scanning, no agregar friccion.
8. Mobile necesita menos capas, no solo menos ancho.
9. Realtime debe sentirse vivo, no ruidoso.
10. La densidad util se conserva; la densidad redundante se degrada.
11. Una misma senal no deberia gritar desde cuatro capas al mismo tiempo.
12. Owner y operator no deben pelear por el mismo primer segundo de atencion.

## Jerarquia final de capas

### LAYER 1 - Critical Operations

Nombre: Critical Operations  
Proposito: permitir accion inmediata y lectura tactica real  
Debe dominar cuando: hay riesgo, congestionar, ownership ambiguo o carga viva alta  
Debe degradarse cuando: casi nunca; solo parte de su expresion visual en calma  
Debe sobrevivir en mobile: siempre  
Riesgo de abuso: sobredimensionar todo y volver paranoica la consola  
Bloques actuales incluidos:
- cards
- risk indicators V.2
- assignment / ownership visible
- highlights de nuevos pedidos
- foco de navegacion operacional
- `OPERACION EN VIVO` esencial
Recomendacion futura: esta capa debe ocupar el primer segundo de atencion y el camino mas corto hacia accion

### LAYER 2 - Tactical Awareness

Nombre: Tactical Awareness  
Proposito: explicar la friccion y dar evidencia util sin quitar foco a la accion  
Debe dominar cuando: hay senales activas pero no toda la operacion esta en crisis  
Debe degradarse cuando: la Critical Operations ya explica todo lo necesario  
Debe sobrevivir en mobile: parcialmente  
Riesgo de abuso: volverse otra capa principal con voz propia  
Bloques actuales incluidos:
- `INSIGHTS`
- `RESUMEN OPERATIVO`
- `ACTIVIDAD RECIENTE` cuando trae evidencia real
- queue pressure
- health minima
- busqueda / filtros cuando ayudan a foco
Recomendacion futura: una sola voz sintetica fuerte; el resto acompana

### LAYER 3 - Business Context

Nombre: Business Context  
Proposito: dar contexto comercial y lectura del dia sin interrumpir workflow  
Debe dominar cuando: la operacion esta estable o el usuario necesita lectura de negocio  
Debe degradarse cuando: hay riesgo, congestion o ownership urgente  
Debe sobrevivir en mobile: de forma comprimida  
Riesgo de abuso: desplazar pedidos y workflow demasiado abajo  
Bloques actuales incluidos:
- `HOY`
- `INSIGHTS DEL NEGOCIO`
- mix delivery / retiro
- ticket promedio
- ventas
- mas vendido
Recomendacion futura: debe seguir existiendo, pero no siempre en el centro del fold

### LAYER 4 - Passive Narrative

Nombre: Passive Narrative  
Proposito: acompanar con calma, contexto suave o redundancia tolerable  
Debe dominar cuando: nunca  
Debe degradarse cuando: siempre que haya friccion, riesgo o saturacion  
Debe sobrevivir en mobile: casi nunca  
Riesgo de abuso: convertir la consola en pared de frases  
Bloques actuales incluidos:
- `Operacion tranquila`
- `Operacion estable`
- calma repetida
- insights decorativos
- feed contextual sin evidencia fuerte
- summaries redundantes
Recomendacion futura: esta capa debe ser la primera candidata a compresion o silencio

## Matriz domina / acompana / se degrada

### Health / realtime / presence

Bloque actual: Health / realtime / presence  
Domina cuando: hay problema tecnico o perdida de vida realtime  
Acompana cuando: la sesion esta sana  
Se degrada cuando: la operacion tiene riesgo operativo real y el canal esta sano  
Se comprime en: OX.5  
Fase futura afectada: OX.2 / OX.4 / OX.6

### Queue pressure

Bloque actual: Queue pressure  
Domina cuando: hay congestionar o cola anomala  
Acompana cuando: solo agrega awareness tactica  
Se degrada cuando: la cola esta sana y ya hay otras senales prioritarias  
Se comprime en: OX.5  
Fase futura afectada: OX.2 / OX.4

### HOY

Bloque actual: `HOY`  
Domina cuando: lectura de negocio en calma o lectura owner-centric  
Acompana cuando: hay operacion viva pero sin friccion fuerte  
Se degrada cuando: hay riesgo, congestion o foco ownership urgente  
Se comprime en: OX.5  
Fase futura afectada: OX.2 / OX.4 / OX.6

### OPERACION EN VIVO

Bloque actual: `OPERACION EN VIVO`  
Domina cuando: hay carga, riesgo o necesidad de decidir rapido  
Acompana cuando: la operacion esta estable  
Se degrada cuando: nunca del todo; solo puede compactarse en calma  
Se comprime en: OX.5 de forma parcial  
Fase futura afectada: OX.2 / OX.4 / OX.6

### INSIGHTS

Bloque actual: `INSIGHTS`  
Domina cuando: sintetiza la friccion principal  
Acompana cuando: cards y V.2 ya muestran la verdad principal  
Se degrada cuando: repite riesgo ya visible o calma repetida  
Se comprime en: OX.5  
Fase futura afectada: OX.2 / OX.4 / OX.6

### RESUMEN OPERATIVO

Bloque actual: `RESUMEN OPERATIVO`  
Domina cuando: puede resumir el estado en una sola lectura humana  
Acompana cuando: solo sirve de puente entre KPIs y cards  
Se degrada cuando: empieza a repetir `INSIGHTS` o V.2  
Se comprime en: OX.5  
Fase futura afectada: OX.2 / OX.4 / OX.6

### INSIGHTS DEL NEGOCIO

Bloque actual: `INSIGHTS DEL NEGOCIO`  
Domina cuando: owner necesita contexto y la operacion no esta caliente  
Acompana cuando: aporta lectura de negocio suave  
Se degrada cuando: aparece riesgo, congestion o exceso de capas previas  
Se comprime en: OX.5  
Fase futura afectada: OX.2 / OX.4 / OX.6

### ACTIVIDAD RECIENTE

Bloque actual: `ACTIVIDAD RECIENTE`  
Domina cuando: trae evidencia critica o memoria operacional muy util  
Acompana cuando: complementa cards y summaries  
Se degrada cuando: deriva a narrativa contextual o repite insights  
Se comprime en: OX.5  
Fase futura afectada: OX.2 / OX.3 / OX.4 / OX.6

### Busqueda operacional

Bloque actual: Busqueda operacional  
Domina cuando: el operador necesita foco tactico o rescate rapido  
Acompana cuando: la navegacion base ya resuelve el caso  
Se degrada cuando: la operacion esta tranquila y el foco no esta activo  
Se comprime en: OX.5 visual, no funcional  
Fase futura afectada: OX.2 / OX.3 / OX.4 / OX.6

### Chips derivados

Bloque actual: Chips derivados  
Domina cuando: nunca  
Acompana cuando: ayudan a explicar una query o estado compuesto  
Se degrada cuando: suman ruido visual o exceso de longitud  
Se comprime en: OX.5  
Fase futura afectada: OX.5 / OX.6

### Filtros

Bloque actual: Filtros  
Domina cuando: el workflow base depende de ellos  
Acompana cuando: la busqueda ya esta llevando el foco  
Se degrada cuando: lanes futuras o compresion contextual tomen parte de la navegacion  
Se comprime en: OX.5 sin perder acceso  
Fase futura afectada: OX.2 / OX.3 / OX.5 / OX.6

### Cards

Bloque actual: Cards  
Domina cuando: siempre  
Acompana cuando: nunca; son la verdad operacional  
Se degrada cuando: no deberian degradarse, solo ordenarse mejor dentro del flujo  
Se comprime en: OX.5 con cuidado  
Fase futura afectada: OX.2 / OX.3 / OX.4 / OX.5 / OX.6

### Risk indicators

Bloque actual: V.2 risk indicators  
Domina cuando: hay riesgo real  
Acompana cuando: las senales son leves  
Se degrada cuando: no hay riesgo  
Se comprime en: OX.5 solo en calma  
Fase futura afectada: OX.4 / OX.6

### Assignment

Bloque actual: Assignment  
Domina cuando: hay multioperador, ownership ambiguo o sin responsable  
Acompana cuando: el pedido ya tiene responsable claro  
Se degrada cuando: la operacion es individual o la ownership no aporta tension  
Se comprime en: OX.5 con cuidado  
Fase futura afectada: OX.3 / OX.4 / OX.6

### Highlights

Bloque actual: Highlights realtime  
Domina cuando: entra nuevo pedido o hay retorno desde hidden  
Acompana cuando: ya paso el momento de llegada  
Se degrada cuando: expira la senal  
Se comprime en: no aplica fuerte  
Fase futura afectada: OX.6

### Modal / vista profunda

Bloque actual: Modal / vista profunda  
Domina cuando: el operador entra al pedido  
Acompana cuando: el foco sigue en el tablero  
Se degrada cuando: fuera del contexto puntual del pedido  
Se comprime en: no es prioridad OX.1  
Fase futura afectada: OX.6

## Decisiones de redundancia

### Riesgo

Senal: riesgo / demora / regresion  
Donde aparece:
- V.2
- `INSIGHTS`
- `RESUMEN OPERATIVO`
- `ACTIVIDAD RECIENTE`
- cards
Capa dominante recomendada:
- V.2 + cards
Capas que deberian acompanar:
- `INSIGHTS` o `RESUMEN OPERATIVO`, pero no ambos con la misma intensidad
- feed solo como evidencia
Capas que deberian callarse:
- business context
- calma repetida
Fase futura que debe resolverlo:
- OX.4

### Calma / estabilidad

Senal: operacion tranquila / estable  
Donde aparece:
- `INSIGHTS`
- `RESUMEN OPERATIVO`
- feed fallback
- lectura sana de KPIs
Capa dominante recomendada:
- una sola capa sintetica
Capas que deberian acompanar:
- health minima
Capas que deberian callarse:
- resto de fallbacks narrativos
Fase futura que debe resolverlo:
- OX.5 / OX.6

### Delivery / retiro dominante

Senal: mix dominante  
Donde aparece:
- KPI mix
- `INSIGHTS`
- `INSIGHTS DEL NEGOCIO`
- feed
- busqueda / filtros
Capa dominante recomendada:
- business context
Capas que deberian acompanar:
- navegacion cuando el flujo lo requiera
Capas que deberian callarse:
- feed y resumen si no agrega accion
Fase futura que debe resolverlo:
- OX.2 / OX.5

### Ownership

Senal: assignment / sin responsable / mios  
Donde aparece:
- cards
- busqueda
- feed
- presence / assignment
Capa dominante recomendada:
- cards + navegacion
Capas que deberian acompanar:
- feed solo si hay movimiento problematico
Capas que deberian callarse:
- narrativa redundante de ownership leve
Fase futura que debe resolverlo:
- OX.3 / OX.4

### Throughput / completados

Senal: completados / buen movimiento  
Donde aparece:
- KPI `Completados`
- feed
- `INSIGHTS DEL NEGOCIO`
Capa dominante recomendada:
- KPI / business context
Capas que deberian acompanar:
- feed solo agrupado y con valor temporal
Capas que deberian callarse:
- narrativa repetida positiva en riesgo
Fase futura que debe resolverlo:
- OX.5

## Modelo de degradacion contextual

### Operacion tranquila

Permite:

- mas contexto comercial
- mas narrativa suave
- mas insights del negocio
- feed menos tenso

### Operacion activa

Debe:

- reducir narrativa pasiva
- mantener foco en workflow
- dar mas peso a `OPERACION EN VIVO`, busqueda y cards

### Congestion

Debe:

- subir riesgo, ownership y cards
- bajar business context
- comprimir feed contextual
- reducir narrativa larga

### Riesgo activo

Debe:

- hacer dominar V.2, cards y `OPERACION EN VIVO`
- callar calma repetida
- degradar `INSIGHTS DEL NEGOCIO`
- evitar repetir riesgo en cuatro capas

### Mobile

Debe:

- mostrar menos capas
- priorizar foco, riesgo y cards
- degradar negocio y narrativa primero

## Modelo base de prioridad dinamica

### Si hay riesgo activo

- dominar:
  - risk indicators
  - cards
  - `OPERACION EN VIVO`
- acompanar:
  - una sintesis critica
  - feed como evidencia
- degradar:
  - negocio
  - calma
  - feed contextual

### Si hay operacion tranquila

- dominar:
  - salud minima
  - contexto comercial moderado
  - una sintesis suave
- acompanar:
  - feed ligero
- degradar:
  - alertas innecesarias
  - ownership sobredimensionado

### Si hay congestion

- dominar:
  - carga
  - ownership
  - pendientes / preparando / listos
- acompanar:
  - feed de evidencia
  - busqueda de foco
- degradar:
  - negocio secundario
  - narrativa larga

## Modelo base de compresion futura

1. Insights del negocio  
   Por que se comprime: es contexto valioso, pero no primer plano tactico  
   Que no debe perderse: lectura comercial del dia  
   Fase: OX.5

2. Feed contextual  
   Por que se comprime: aporta, pero empuja demasiado abajo cards y foco  
   Que no debe perderse: evidencia realmente util  
   Fase: OX.5

3. Narrativa repetida de calma  
   Por que se comprime: es la redundancia mas clara  
   Que no debe perderse: una unica senal de estabilidad  
   Fase: OX.5 / OX.6

4. Chips derivados largos  
   Por que se comprime: suman carga visual e interactiva  
   Que no debe perderse: comprension del filtro aplicado  
   Fase: OX.5

5. Contexto comercial en estados calientes  
   Por que se comprime: compite con accion  
   Que no debe perderse: acceso facil para owner / manager  
   Fase: OX.4 / OX.5

6. KPIs pasivos  
   Por que se comprime: ocupan espacio premium sin urgencia  
   Que no debe perderse: lectura del negocio en calma  
   Fase: OX.5

7. Summaries redundantes  
   Por que se comprime: varias capas ya sintetizan  
   Que no debe perderse: una sola voz humana clara  
   Fase: OX.5 / OX.6

## Blueprint inicial del fold futuro

### Fold futuro ideal desktop

Debe permitir entender en segundos:

1. salud minima
2. riesgo / carga viva
3. foco de navegacion
4. cards relevantes
5. contexto secundario

Debe bajar o comprimirse:

- insights del negocio
- feed contextual
- narrativa repetida
- KPIs pasivos

### Fold futuro ideal mobile

Debe priorizar:

1. salud minima
2. riesgo / carga
3. busqueda / foco
4. cards
5. contexto colapsado

Debe bajar:

- business insights
- feed contextual
- calma repetida
- partes pasivas de `HOY`

## Relacion con fases futuras

### OX.2 - Fold Re-Architecture

Debe usar este blueprint para:

- mover capas
- ordenar fold
- separar negocio / operacion
- decidir colapsables

### OX.3 - Operational Lanes

Debe usar este blueprint para:

- convertir navegacion, riesgo y ownership en lanes
- reducir scanning manual
- evitar duplicar filtros

### OX.4 - Dynamic Operational Priority

Debe usar este blueprint para:

- aplicar reglas de degradacion
- definir modos operacionales
- evitar contradiccion calma / riesgo

### OX.5 - Smart Compression

Debe usar este blueprint para:

- comprimir narrativa primero
- preservar densidad saludable
- reducir hidden density

### OX.6 - Visual Polish System

Debe usar este blueprint para:

- unificar lenguaje visual
- endurecer jerarquia
- diferenciar critico / tactico / contextual / pasivo

## Decisiones NO tomadas todavia

OX.1.7 no decide todavia:

- layout final exacto
- diseno visual final
- implementacion exacta de lanes
- thresholds finales de riesgo o congestion
- que componentes se eliminan definitivamente
- comportamiento mobile final
- cambios en parser / busqueda
- cambios en realtime
- cambios en DB

## Riesgos futuros

- mover cards demasiado arriba sin contexto puede empobrecer lectura de negocio
- comprimir demasiado puede ocultar senales criticas
- lanes pueden duplicar filtros si se disenan mal
- prioridad dinamica puede sentirse inestable si cambia demasiado
- business context puede desaparecer demasiado para owners
- mobile puede quedar demasiado minimalista si se elimina contexto util
- tocar dashboard sin respetar realtime y side effects puede romper confianza operacional

## Conclusiones

- OX.1 no encontro falta de informacion; encontro falta de jerarquia consolidada
- el futuro del dashboard no pasa por sumar mas bloques, sino por ordenar quien domina, quien acompana y quien se calla
- este blueprint cierra el diagnostico y deja habilitado OX.2 con una filosofia operacional clara
