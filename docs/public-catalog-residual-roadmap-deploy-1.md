# PUBLIC-CATALOG-RESIDUAL-ROADMAP-DEPLOY-1
## Consolidacion, commit, deploy y smoke de produccion

**Estado inicial:** RELEASE IN PROGRESS

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
RELEASE_COMMIT_SHA = PENDING
RELEASE_COMMIT_PARENT = PENDING
VERCEL_DEPLOYMENT = PENDING
PRODUCTION_ALIAS = https://orderops.vercel.app
ROLLBACK = git revert <RELEASE_COMMIT_SHA> for confirmed P0/P1 or blocking P2
```
