# PUBLIC-CATALOG-REAL-DEVICE-QA-1 — Real Device QA for Public Catalog V1

## 1. Estado

```txt
BLOCKED — REAL DEVICE UNAVAILABLE
```

Fecha: 2026-07-30  
Branch: `main`  
HEAD: `5dd9b41`  
Deploy base: `fb19a3a`  
Live: `https://orderops.vercel.app`

```txt
Modo: B — Sin hardware real disponible
Emulación usada como PASS: no
Código tocado: no
Pedidos reales: 0
```

## 2. Resumen ejecutivo

No se ejecutó QA en dispositivo físico porque no hubo hardware real operable desde el entorno del agente. Existe evidencia PnP de dispositivos Samsung USB con status Unknown, pero **no hay `adb`/platform-tools**, ni scrcpy, ni tooling iOS. El browser de Cursor es Chromium desktop — no cuenta como Android Chrome ni iOS Safari reales. Per reglas de la fase, **no se reemplazó por emulación como PASS**. Deuda P3 Real device QA permanece abierta.

Para desbloquear: re-run Mode A con al menos **Android Chrome real** (mínimo recomendado), opcionalmente iOS Safari y PWA admin.

## 3. Contexto de entrada

```txt
PUBLIC-CATALOG-FINAL-HANDOFF-1 → FEATURE CLOSED — DEPLOYED WITH NON-BLOCKING QA DEBT
PUBLIC-CATALOG-POST-DEPLOY-MONITOR-1 → PASS WITH NON-BLOCKING QA DEBT
PUBLIC-CATALOG-PREVIEW-AUTH-SMOKE-1 → PASS WITH MINOR PREVIEW QA DEBT
```

Estado conocido (no revalidado en hardware real en esta fase):

```txt
Preview iframe deep (desktop auth browser): PASS
Cart isolation preview/public: PASS
Preview checkout guard: PASS
Public checkout normal: PASS sin submit
Image Transforms: render/image 403 FeatureNotEnabled esperado
Observability prod normal: off/debug-only
```

## 4. Dispositivos / cobertura

| Plataforma      | Navegador/App  | Device real | Resultado |
| --------------- | -------------- | ----------: | --------- |
| Android         | Chrome         |          no | BLOCKED — UNAVAILABLE |
| Android         | Admin PWA      |          no | UNVERIFIED |
| iOS             | Safari         |          no | UNVERIFIED |
| iOS             | Standalone/PWA |          no | UNVERIFIED |
| Desktop control | Cursor Chromium | opcional (no cuenta) | no usado como PASS |

Probe entorno:

```txt
adb: no instalado / no en PATH
scrcpy / idevice / flutter: no encontrados
PnP: SAMSUNG Mobile USB* Status Unknown (no operable sin ADB)
```

## 5. Preflight

```txt
branch: main
HEAD: 5dd9b41
dirty tree: docs previos + residuales out-of-scope + tsbuildinfo
runtime dirty inesperado: no
últimos commits: 5dd9b41 · 55f866f · fb19a3a …
```

## 6. Public catalog smoke

```txt
UNVERIFIED — sin device real
```

URL objetivo (no ejecutada en hardware): `https://orderops.vercel.app/b/demohamburgueseria/catalogo`

## 7. Scroll / jank real device

```txt
UNVERIFIED
clasificación: UNVERIFIED
```

No se clasificó jank por emulación.

## 8. Product Customization real device

```txt
UNVERIFIED
```

## 9. Public cart real device

```txt
UNVERIFIED
```

## 10. Public checkout boundary

```txt
UNVERIFIED en device real
```

Referencia histórica desktop (PREVIEW-AUTH / POST-DEPLOY): Enviar pedido visible · no pedido enviado. **No cuenta como real-device PASS.**

## 11. Image behavior

```txt
UNVERIFIED en device real
```

Deuda conocida transforms: render 403 / object fallback (no re-probed aquí).

## 12. Admin preview real device

```txt
UNVERIFIED — REAL DEVICE UNAVAILABLE
```

Auth admin en desktop browser previo no sustituye device real.

## 13. Preview iframe touch behavior

```txt
UNVERIFIED
```

Touch real / pan mouse-only / cursor artificial en touch: no probados en hardware.

## 14. Preview checkout guard

```txt
UNVERIFIED en device real
```

Source + desktop auth smoke previos: Confirmación deshabilitada. No revalidado en hardware.

## 15. Clear cart preview

```txt
UNVERIFIED
```

## 16. Public vs preview isolation

```txt
UNVERIFIED en device real
```

## 17. PWA admin real device

```txt
PWA real device UNVERIFIED
deuda P3 aceptada
```

## 18. iOS Safari real device

```txt
iOS real device UNVERIFIED
deuda P3
```

## 19. Console / network

```txt
no remote debugging en device (sin ADB)
```

## 20. Cleanup local QA state

```txt
no carts QA creados en esta fase (no hubo sesión device)
no pedidos reales
```

## 21. Seguridad / no-regression

```txt
No DB / RLS / RPC / migrations
No checkout action / create_order
No real orders
No cart schema / pricing / stock / availability
No cache / Product Customization / image / Supabase infra
No Vercel env / CSP / PWA manifest/SW
No code / deploy / commit
```

## 22. Resultado de comandos

```txt
git: main @ 5dd9b41 · docs dirty esperados
adb devices: adb no encontrado
tsc/build: no ejecutado (sin código)
```

## 23. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| P3 | Real device QA unavailable | sin ADB / sin iOS tooling / browser = desktop | Re-run Mode A con Android Chrome real |
| P3 | iOS Safari UNVERIFIED | sin hardware iOS | Incluir en followup si hay iPhone |
| P3 | Admin PWA UNVERIFIED | no instalada/probada en device | Opcional en followup |
| P2 | Image Transforms FeatureNotEnabled | histórico | Mode B transforms con auth |
| — | Emulación no usada como PASS | regla Mode B | Correcto |

## 24. Deuda residual actualizada

```txt
P3 — Real device QA (BLOCKED — UNAVAILABLE) — esta fase
P3 — iOS Safari real device
P3 — Admin PWA real device
P2 — Image Transforms FeatureNotEnabled (auth)
P2 — Observability prod enable (auth)
P2 — Cache mutation runtime (auth)
P2 — previousSlug callers admin
P3 — Preview cookie Application flags (minor, desde PREVIEW-AUTH-SMOKE)
```

Preview iframe deep (desktop auth) permanece PASS de fase previa; **no cierra** real-device debt.

## 25. Rollback recommendation

QA-only sin cambios → no rollback.

## 26. Próximo paso

```txt
PUBLIC-CATALOG-REAL-DEVICE-QA-1-FOLLOWUP
```

Requiere Android Chrome real (mínimo). Alternativas de roadmap no device:

```txt
PUBLIC-CATALOG-PREVIOUS-SLUG-CALLERS-FIX-1
PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1
PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B
PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP
```
