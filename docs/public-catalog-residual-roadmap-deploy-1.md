# PUBLIC-CATALOG-RESIDUAL-ROADMAP-DEPLOY-1
## Consolidacion, commit, deploy y smoke de produccion

**Estado final:** PASS WITH ACCEPTED REAL-DEVICE AND PROVIDER-ACTIVATION QA DEBT — RESIDUAL ROADMAP DEPLOYED

## Alcance publicado

- Navegacion y busqueda local para catalogos MEDIUM/LARGE, con umbrales `25 productos / 5 categorias` para MEDIUM y `60 productos / 8 categorias / 24 productos por categoria` para LARGE.
- Validacion de telefonos argentinos y normalizacion de pedidos a `+549...`.
- Autocomplete de direccion con Google Maps JavaScript API, carga lazy en envio y fallback manual no bloqueante.
- Correcciones visuales y semanticas acumuladas, incluida navegacion de categorias como landmark.

## Arquitectura y seguridad

La busqueda y los filtros son client-side y no hacen requests, Next Actions ni queries de DB. Direccion conserva el contrato existente de un unico string; no persiste coordenadas, place IDs ni sugerencias. No hay cambios de DB, migraciones, RPC, packages ni creacion de pedidos.

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` es una activacion externa opcional: requiere billing, APIs y restricciones de referrer/API. Si falta, el checkout conserva el input manual.

## Validacion y QA aceptada

- TypeScript y build son gates obligatorios antes del deploy.
- Smoke local y productivo: catalogo y checkout, sin submit.
- Deuda aceptada: Android/Chrome real, flujo MEDIUM/LARGE interactivo, screen reader y Maps real cuando no haya key/billing/APIs o browser compatible.

## Release

```text
RELEASE_COMMIT_SHA = 3bd26ffd7e6e3cd09bf80e926d2e70bc1bf55fc7
RELEASE_COMMIT_PARENT = 598a86d0c7fa3ec78f590ebd3a143b58f48762d9
VERCEL_DEPLOYMENT = dpl_DPv6mEwxE6UsaS5pMec3TZME35V2 (Ready)
PRODUCTION_ALIAS = https://orderops.vercel.app
ROLLBACK = git revert <RELEASE_COMMIT_SHA> for confirmed P0/P1 or blocking P2
```

## Resultado de release

- TypeScript y build pasaron sobre el commit rebasado.
- Smoke local y production: catálogo y checkout respondieron HTTP 200 sin submit ni pedidos reales.
- Vercel reportó deployment production `Ready`; los logs de error read-only no devolvieron entradas.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` no pudo verificarse por la CLI sin exponer valores. Maps real, billing, APIs y restricciones quedan como activación pendiente; el fallback manual permanece disponible.
