# Escala Z-Index (OrderOps)

Referencia estándar para capas visuales del panel de administración y modales de dominio.

| Z-index | Capa | Ejemplos |
|---------|------|----------|
| **10** | Elementos elevados dentro del flujo | Dropdowns locales, sticky headers de tabla |
| **40** | Navegación principal | Sidebar, Topbar |
| **50** | Overlays de fondo | Fondos oscuros de modales/drawers |
| **60** | Modales, Drawers y Flyouts | `FlyoutPanel`, `ImageCropModal`, `<dialog>` |
| **100** | Tooltips, Toasts y notificaciones globales | Notificaciones, tooltips persistentes |

## Notas de implementación

- Un modal de recorte dentro de un flyout comparte la capa **60**; el flyout debe cerrarse o el crop debe renderizarse en portal a `document.body` (como hoy) para evitar recorte por `overflow: hidden` del panel.
- No usar valores arbitrarios (`99999`, `9999`) fuera de esta escala.
- Al añadir una nueva capa, actualizar este documento y los módulos afectados.

## Referencias actuales (Fase 1)

| Componente | Archivo | Z-index |
|------------|---------|---------|
| Flyout panel | `flyout-panel.module.css` | 40–41 |
| Image crop overlay | `image-crop-modal.module.css` | 60 |
