# V.1.3 -- Visual Rules

## 1. Resumen ejecutivo

Esta fase define las reglas visuales oficiales del dashboard MVP.

No rediseña.
No reestructura.
No compacta cards todavia.

Su trabajo es fijar criterios para que las siguientes fases tomen decisiones consistentes y no vuelvan a inventar estilos o jerarquias por bloque.

## 2. Relacion con V.1.1 y V.1.2

V.1.1 aporto:

- tokens
- aliases legacy
- preparacion de dark mode

V.1.2 aporto:

- surface tokens
- surface classes `.oo-*`
- una gramatica reutilizable de paneles, cards y strips

V.1.3 agrega:

- criterios oficiales de uso
- jerarquia visual
- reglas de densidad
- limites de expansion visual

## 3. Reglas de jerarquia visual

### Nivel 1 -- Critical action / risk / urgent order

Debe dominar:

- riesgo real
- warning operativo relevante
- bloqueo
- urgencia accionable

Puede usar:

- `Surface Critical`
- color `risk` o `danger`
- emphasis puntual, nunca decorativo

### Nivel 2 -- Active workflow / current order state

Debe acompanar con fuerza, sin pelear con el riesgo.

Incluye:

- estado actual
- flujo activo
- ownership activo

Puede usar:

- `Surface Elevated`
- `Surface Interactive`
- color semantico si cambia la decision

### Nivel 3 -- Key operational metric

Debe ser claramente visible, pero no dominante frente a accion o riesgo.

Incluye:

- KPI operacional clave
- conteo o ritmo que cambia lectura

Puede usar:

- `Surface Soft`
- `metric typography`

### Nivel 4 -- Secondary metadata

Debe informar sin competir.

Incluye:

- labels
- timestamps
- notas cortas
- contexto complementario

Puede usar:

- `Surface Muted`
- `caption / label`

### Nivel 5 -- Passive context / narrative

Debe degradarse primero.

Incluye:

- narrativa suave
- contexto no accionable
- explicacion secundaria

En mobile puede ocultarse o diferirse primero.

## 4. Reglas de densidad visual

- una surface no debe intentar resolver identidad, riesgo, metadata, CTA y narrativa al mismo tiempo
- si un bloque necesita demasiadas senales simultaneas, el problema es de jerarquia antes que de styling
- usar `Surface Muted` cuando la informacion acompana pero no cambia decision
- usar `Surface Soft` cuando hay contexto operativo liviano, KPI o summary breve
- evitar nuevas surfaces cuando una clase existente ya puede expresar el nivel de importancia
- agrupar informacion cuando varias piezas cuentan la misma historia
- diferir contexto antes de sumar otra capa visible

Regla orientativa:

- si la metadata empieza a competir con el dato principal, ya deberia compactarse en una fase posterior

## 5. Reglas de color semantico

- `accent-primary` -> marca, foco primario, CTA
- `success` -> completado, operacion sana
- `warning` -> atencion operativa
- `danger` -> error real, bloqueo, problema severo
- `info` -> contexto informativo
- `neutral` -> estado pasivo
- `risk` -> riesgo operacional
- `ownership` -> responsabilidad o assignment
- `congestion` -> presion de cola
- `focus` -> foco visual temporal

Regla central:

**el color no se usa como decoracion gratuita**

Solo debe aparecer cuando:

- cambia lectura
- cambia prioridad
- cambia decision

## 6. Reglas de surface usage

- `Canvas` -> fondo general
- `Surface` -> secciones base
- `Surface Soft` -> KPIs, metadata, summaries ligeros
- `Surface Elevated` -> cards importantes y bloques destacados
- `Surface Interactive` -> clickeables
- `Surface Critical` -> riesgo, warning, demora
- `Surface Muted` -> contexto secundario

Regla:

- si una pieza no necesita mas protagonismo, no subirla de `Muted` o `Soft` a `Elevated`

## 7. Reglas de elevation / borders

- `border-soft` es el default
- `border-strong` solo se usa cuando hace falta separacion mas clara o affordance de control
- `shadow-sm` para strips, elementos chicos o interactivos
- `shadow-md` para surfaces elevadas
- `shadow-surface` para paneles base del admin
- no usar sombra si el bloque ya se separa bien por jerarquia, fondo y espacio
- no agregar borders nuevos para compensar mala jerarquia

Objetivo:

- menos dependencia de "todo con borde"

## 8. Reglas de interaccion

- hover debe sugerir disponibilidad, no cambiar el componente de personalidad
- focus debe ser claro y consistente
- active / pressed debe sentirse breve y controlado
- disabled debe bajar contraste y affordance sin volverse ilegible
- usar motion tokens existentes
- no cambiar comportamiento funcional desde styling

Utilidades agregadas:

- `.oo-focus-ring`
- `.oo-visually-muted`
- `.oo-critical-text`
- `.oo-meta-text`
- `.oo-interactive-reset`

## 9. Reglas responsive

### Desktop

- puede sostener mas capas visibles
- la jerarquia sigue mandando sobre la cantidad

### Tablet

- debe reducir ruido antes de reducir informacion critica
- evitar que demasiadas surfaces se apilen con el mismo peso

### Mobile

- domina lo critico
- se comprime primero lo pasivo
- se oculta primero lo narrativo
- no apilar contexto secundario encima de flujo accionable

Regla:

- si algo no cambia accion inmediata, es candidato a degradarse primero en mobile

## 10. Reglas para dark mode futuro

Dark mode debe conservar:

- la misma jerarquia
- la misma semantica de surfaces
- la misma lectura de riesgo

Debe respetar:

- canvas
- surfaces
- text
- borders
- semantic states

No se activa en esta fase.
No se crea toggle.
No se modifica comportamiento.

## 11. Reglas de anti-expansion

No corresponde crear por default:

- nuevas lanes
- nuevas surfaces funcionales
- nuevas metricas
- nuevos widgets
- nuevas capas verticales
- nuevas gramaticas visuales

Si una fase futura necesita algo nuevo, debe justificar:

- por que no alcanza el sistema actual
- por que no puede resolverse con tokens + surfaces + visual rules

## 12. Preparacion para V.2

V.1 queda cerrada conceptualmente cuando:

- ya existe token system
- ya existe surface system
- ya existen visual rules oficiales

Con eso, `V.2 -- Dashboard Structure Recovery` ya puede discutir estructura sin tener que improvisar:

- color
- surface
- jerarquia
- densidad
- interaccion

## 13. Riesgos y deuda pendiente

- muchas instancias del repo todavia no consumen plenamente la nueva gramatica
- existe riesgo de que fases futuras vuelvan a hardcodear excepciones
- la disciplina de uso ahora importa mas que la creacion de nuevas clases

## 14. Confirmacion de alcance

Esta fase:

- no toco logica
- no toco layout
- no toco cards internas
- no toco lanes internas
- no hizo compactacion real
- no activo dark mode
- no agrego features

## Legacy OX Context

### Que se conserva

- OX como memoria de jerarquia, scanning y operacion viva

### Que se congela

- expansion OX del dashboard como direccion activa

### Que se reemplaza

- la prioridad de expansion operacional por una prioridad de reglas visuales oficiales

### Como convivira OX con el roadmap nuevo

- OX sigue informando contexto
- V.1.3 fija criterios para que V.2 empiece con una base visual compartida
