# OrderOps — Informe de simulación comercial (demo QA)

Fecha: 2026-10-21. Worktree: `OrderOps-talo-first`. Entorno: QA loopback `orderops-phase06-qa` únicamente.

Credenciales: solo en `ORDEROPS_DEMO_ACCESS.private.md` (gitignored). Este informe no contiene contraseñas.

## A. Pasos del recorrido (1–19)

| # | Paso | Resultado | Evidencia / notas |
|---|---|---|---|
| 1 | Tomás consigue Brasa Norte | PASS | Lead comercial realista cargado |
| 2 | Registra oportunidad | PASS | `register_promoter_business` (UI `/promoter/businesses` disponible; seed usó el mismo RPC) |
| 3 | Atribución confirmada | PASS (con brecha UI) | `confirm_attribution` por superadmin. La UI del promotor solo escribe notas; hace falta una interacción `whatsapp`/`meeting` (seed). **No hay pantalla de confirmación.** |
| 4 | Conversión a cliente | PASS (con brecha UI) | `win_opportunity` por superadmin. Lucía (comercial) **no** tiene `opportunity.win`. **No hay botón de conversión.** |
| 5 | Términos Founder | PASS | `conversion_terms`: setup 290.000 / mensual 55.000 |
| 6 | Talo cliente/CVU | NOT_VERIFIED | Link sintético `demo-synthetic-*` / alias `demo.brasanorte`. No es respuesta de Talo |
| 7 | Acreditación sandbox | NOT_VERIFIED | Cobranza sintética `demo-synth-*` vía RPC interno, no faucet HTTPS |
| 8 | Webhook + worker HTTP | NOT_VERIFIED | Sin credenciales sandbox + URL HTTPS autorizada en este entorno |
| 9 | Activación nominal | PASS (sintético) | Obligación setup satisfecha; comisión alta ARS 120.000 devengada |
| 10 | Inicio de servicio | PASS | `record_founder_service_start` (Brasa −1 mes, Distrito −3 meses) |
| 11 | Valentina administra | PASS | Login OK; negocio `brasa-norte` con catálogo y pedidos |
| 12 | Pedidos | PASS | Pedidos en pending/preparing/ready/completed/cancelled; `create_order` OK en Brasa con gate on |
| 13 | Comisión de activación Tomás | PASS | Dos setup × 12.000.000 centavos + 1 recurring 2.200.000 |
| 14 | Renovación mensual Brasa | PASS (sintético) | `system_record_provider_read` imputó 55.000; slot 1 |
| 15 | Cobertura y devengo | PASS | Brasa `active`; recurrente pending disponible 2026-11-05 |
| 16 | Distrito suspendido | PASS | `business_service_access` → `suspended` |
| 17 | Sin pedidos nuevos; termina previos | PASS | Con gate QA on: `create_order` → `service_access_blocked`. Pedido Elena `DSTR2A` pendiente |
| 18 | Reactivación | NOT_VERIFIED en UI | Camino operativo: Finanzas imputa 55.000 al período. No se ejecutó el click final en esta corrida |
| 19 | Duplicados / ambiguos / aislamiento | PASS parcial | Transferencia 50.000 en `amount_mismatch`; Owner B no ve Brasa (patrón L10). Reversa no recorrida en UI |

## B. Acceso manual

Archivo privado: `ORDEROPS_DEMO_ACCESS.private.md` en la raíz del worktree.

- 8 cuentas, contraseñas individuales, `LOGIN_OK` vía Auth API.
- App: `http://127.0.0.1:3105` con `npx next dev --webpack -p 3105`.
- Restaurar: `node scripts/commercial-core/apply-demo-simulation.mjs`.

## C. Escenarios para capturas

| Pantalla | Estado preparado |
|---|---|
| Admin pedidos Brasa | Columnas con actividad (Julián, Mariana, Facundo, Paula, Ramiro) |
| Productos Brasa | Hamburguesas, acompañamientos, bebidas; punto de carne + extras |
| Facturación Brasa | Activo, CVU/alias sintéticos, historial con activación y mensualidad |
| Facturación Distrito | Suspendido |
| Finanzas | Transferencia 50.000 en revisión |
| Promotor | Brasa + Distrito ganados, Puesto Sur abierto, comisiones |
| Comercial | Oportunidades abiertas/ganadas |
| Catálogo público | **No capturable con webpack** (CSS preview). Usar admin productos o Turbopack cuando funcione |

Imágenes: SVG propios en `/public/demo-catalog/*` (ilustraciones, no fotos de stock de terceros).

## D. Brechas funcionales concretas (V1)

1. **Sin UI** para `confirm_attribution` ni `win_opportunity` (solo superadmin por RPC).
2. **Promotor** no puede registrar interacciones “sustantivas” (`call`/`whatsapp`/`meeting`) desde el panel; solo notas. Sin eso, la confirmación falla.
3. **Talo sandbox E2E** (cliente real, faucet, webhook HTTPS, worker): no verificado aquí.
4. **Catálogo público** roto bajo `next dev --webpack` por CSS preexistente.
5. Login interno aterriza en `/admin/dashboard`; staff sin negocio debe abrir `/commercial/*` o `/super-admin` a mano.

## E. Bloqueantes reales para producción

1. Migraciones comerciales Talo First no aplicadas en producción.
2. Credenciales Talo productivas + URL HTTPS estable del webhook + worker programado.
3. Preflight + exenciones legacy + activación humana del gate (apagado por defecto).
4. UI mínima de conversión/atribución o procedimiento operativo documentado y aceptado.
5. Cerrar el fallo de CSS del catálogo público si se usa webpack en el deploy.

No incluye mejoras V1.X ni rediseños opcionales.

## Marcadores internos de la demo

- UUIDs: `d0d0d0d0-d0d0-40d0-80d0-*`
- Emails: `demo.*@local.test`
- CVU/cliente: `demo-synthetic-*`, alias `demo.brasanorte` / `demo.distrito`
- Referencias de cobranza: `demo-synth-*`
- `raw_user_meta_data.demo_set = orderops-v1-simulation`
