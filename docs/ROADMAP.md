# Roadmap Actual

## Estado

`V.6 -- Operational Windows` sigue implementada hasta:

- `V.6.4a -- Noise Reduction Pass`
- `V.6.4b.1 -- KPI Compression & Empty State Tightening`
- `V.6.4b.1a -- Encoding / Copy Repair`
- `V.6.4b.1b -- Encoding Root Cause Repair`
- `V.6.4c.1 -- KPI Operational Snapshot`
- `V.6.4c.1a -- Snapshot Density Recovery`
- `V.6.4c.1b -- KPI Icon Semantics & Consistency`
- `V.6.4c.1b.a -- KPI Icon Micro Polish`

## Auditoria y fixes tecnicos mobile

Quedan registrados:

- `V.6.4c.RA -- Mobile Rendering Artifact Audit`
- `V.6.4c.RF1 -- Mobile Compositing Safe Drawer Fix`
- `V.6.4c.RF2 -- Mobile Chrome Blur Fallback`
- `V.6.4c.RA3 -- Modal / Overlay Compositing Root Cause Audit`
- `V.6.4c.RF4 -- Mobile Overlay Compositing Fallback`
- `V.6.4c.RA4 -- KPI Layer Promotion Audit`
- `V.6.4c.RF3a -- Snapshot Clamp & Snap Fallback`
- `V.6.4c.RA5 -- Overview Container Compositing Audit`
- `V.6.4c.RF5 -- Mobile Overview Surface Flattening`
- `V.6.4c.RF6 -- Scroll Compositor Isolation Pass`
- `V.6.4c.RA8 -- Chrome Android Rendering Path Audit`
- `V.6.4c.RF6a -- Revert Forced GPU Layer Promotion`
- `V.6.4c.RA9 -- Overview Grid Layout Audit`
- `V.6.4c.RF9 -- Mobile Overview Grid Fallback`
- `V.6.4c.RA10 -- GPU Raster Trigger Audit`
- `V.6.4c.RF11 -- Mobile Overview Raster Simplification Pass`
- `V.6.4c.RF13 -- Mobile Safe Overview Renderer`

`RF13` deja intacto desktop y monta un overview alternativo solo para mobile usando los mismos datos existentes.

## Pendiente

- QA real Android Chrome con scroll largo
- sanity check Opera Mini manteniendo render sano
- validar desktop sanity check arriba de `768px`
- si persiste el bug, evaluar una segunda pasada aun mas simple sobre el renderer mobile nuevo
- mantener `V.6.4c.2` pausada hasta cerrar estabilidad mobile
