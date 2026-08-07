# PUBLIC-CATALOG-HERO-COPY-HIERARCHY-POLISH-1
## Restore Business Identity While Reducing Mobile Hero Copy Dominance

## Estado

PARTIAL — HERO COPY HIERARCHY QA INCOMPLETE

## Contrato preservado

- Headline: `business.catalog_hero_headline?.trim() || "Listo para pedir."` como `h1`.
- Copy fijo: `Personalizá tu pedido y te lo confirmamos por WhatsApp.`
- Sin cambios a preview, datos, fallback, rail, media `16 / 9` ni contratos funcionales.

## Ajustes aplicados

- Se removieron `line-clamp` y `overflow: hidden` del headline para preservar todo el texto configurable.
- Headline: `22px`, peso `600`, line-height `1.1`, `text-wrap: balance`; desktop `clamp(26px, 2vw, 30px)`.
- Copy secundario: `15px`, peso regular, line-height `1.38`.
- Gap media-copy: `12px`; gap interno: `6px`; margen inferior del Hero: `12px`.

## Validación

- TypeScript: PASS.
- Build: PASS (`npm.cmd run build`, 133.7s).
- Browser integrado: no medible mediante las herramientas expuestas en esta corrida; pendiente validar viewports y overflow visual.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-BURGER-MENU-FLAT-A11Y-POLISH-1 = BLOCKED
```
