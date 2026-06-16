# UX Principles

## Principio central

OrderOps no es un panel financiero ni un ERP pesado.

Es una consola operacional para negocios pequenos que viven entre:

- pedidos
- tiempos
- WhatsApp
- cocina / produccion / entrega

## Principios visuales actuales

- sobrio antes que espectacular
- orientado a escaneo rapido
- prioridad a densidad util
- feedback claro y liviano
- nada de modales innecesarios para confirmar acciones simples

## Operations UX

El usuario debe sentir:

- que el sistema recibio la accion
- que el tablero esta vivo
- que los pedidos se auto-organizan
- que lo urgente se vuelve visible sin gritar

## Densidad operativa

Preferir:

- cards compactas
- labels breves
- tiras de resumen / analytics livianas
- acciones de un click

Evitar:

- bloques enormes
- secciones demasiado aireadas en mobile
- toolbars gigantes
- paneles enterprise de baja frecuencia

## Jerarquia visual

Orden deseado en dashboard:

1. titulo / contexto
2. estado vivo del panel
3. resumen principal
4. analytics / queue pressure como contexto secundario
5. filtros
6. grupos de pedidos

Nunca hacer que analytics o senales secundarias compitan con la lista de trabajo principal.

## Mobile / responsive

Mobile es prioridad real.

Reglas:

- no tapar acciones criticas con toasts
- no empujar media pantalla con indicadores secundarios
- usar scroll horizontal en tiras si hace falta
- evitar layout shifts violentos

## Modal vs detalle profundo

- modal = tactico, rapido, multitarea
- `/admin/orders/[id]` = lectura larga, mas calma, expediente del pedido

No volver a fusionarlos visualmente como si fueran la misma cosa.

## Feedback y side effects

Buenas practicas ya elegidas:

- toasts pequenos
- sonido corto solo para nuevo pedido
- highlight temporal sutil
- health indicator discreto

Evitar:

- banners rojos enormes
- overlays de loading
- animaciones fuertes

## Que evitar al tocar UI

- reintroducir dependencia del router para abrir modal
- hacer cards mas grandes sin necesidad
- meter acciones nuevas en dashboard card hasta volverla toolbar
- usar colores saturados o enterprise
- mezclar UX de catalogo publico con UX del admin
- romper densidad mobile por agregar widgets
