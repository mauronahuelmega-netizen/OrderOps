# ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-VISUAL-HIERARCHY-VALIDATION-1

**Date:** 2026-08-27  
**Baseline commit:** 81b1162  
**Gate:** PASS WITH REAL-DEVICE QA DEBT — CONTACT MESSAGING VISUAL HIERARCHY FROZEN

## 1. Objective

Authenticated runtime + visual closeout for **ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-VISUAL-HIERARCHY-POLISH-1**. No redesign — verify workspace Contact messaging hierarchy, detail regression, themes, breakpoints, and functional boundaries.

## 2. Prior implementation state

Workspace `presentation="workspace"`: template → Abrir WhatsApp → Copiar resumen / Compartir → Más acciones (phone/call/address/maps). Detail keeps legacy layout. Structured content + contextual default unchanged.

## 3. Runtime environment

| Field | Value |
|-------|-------|
| Auth | Authenticated admin session (existing) |
| Tenant | La Burguesía |
| Primary order | `#0215` (`c1e031af-762a-429f-abca-4ffd03dd0215`) — pending · delivery · phone · address |
| Browser | Cursor IDE browser @ `localhost:3000` |
| Primary viewport | 390px |
| Theme | dark + light (via `data-dashboard-theme`) |
| Evidence mode | **AGENT EXECUTED** |

## 4. 390 dark

Contacto reads as communication workflow: select → full-width Abrir WhatsApp → compact Copiar resumen → hairline → Más acciones utilities. Blue persistent **Empezar preparación** dominates globally. **PASS**

## 5. Hierarchy assessment

Global: status CTA > WhatsApp > Copy/Share > utilities. WhatsApp contained secondary (not blue-primary). Copy/Share tertiary. Utilities separate block. **PASS**

## 6. Select

Native combobox; custom chevron; 44px height; `Pedido recibido` default on pending; no overflow @360/390. **PASS**

## 7. WhatsApp CTA

Full width (~364px @390); MessageCircle icon; secondary contained styling; not hero-sized. Not clicked to external send. **PASS**

## 8. Copy/Share

Copy present under WhatsApp. **Compartir absent** — `canUseWebShare()` false in Cursor browser (expected unsupported behavior). Solo Copy uses full-width row; no empty cell. **PASS**

## 9. Más acciones

Membership only: Copiar teléfono, Llamar, Copiar dirección, Abrir Maps. Copy/Share not duplicated. **PASS**

## 10. 360

No horizontal overflow; select fits (right edge 346 @360). **PASS**

## 11. 430

Copy grouped under WhatsApp; utilities separate; no spread regression. **PASS**

## 12. 719

Persistent footer present; 1 visible status CTA; scrolled bottom — last utility (Abrir Maps) meets footer top with 0px overlap in geometry check; screenshot confirms fully visible above footer. **PASS**

## 13. 720

Persistent footer `display:none`; 1 visible **Empezar preparación** (inline/persistent class); no duplicate visible CTAs. Contact hierarchy stable. **PASS**

## 14. 768

Not isolated — tablet behavior consistent with 720+ inline CTA contract. **PASS (smoke via 720/1024/1440)**

## 15. 1024

Two-rail layout; Contacto in command/right rail. **PASS (smoke via 1440)**

## 16. 1440 dark

Two-rail; Contacto in right rail; hierarchy clear; not oversized; no card-within-card. **PASS**

## 17. Light theme

390 + detail-route smoke @1440 after `data-dashboard-theme=light`. Contrast/hierarchy preserved. **PASS**

## 18. Dark theme

390 + 1440 validated. **PASS**

## 19. Scroll ownership

`.workspaceGrid` sole scroll owner; `gridOverflowX:false`; no body horizontal scroll. **PASS**

## 20. Bottom reachability

Long order `#0215`; last utility visible above persistent footer @390. **PASS**

## 21. Tab/focus

Semantic DOM order in Contacto region: WhatsApp select → Abrir WhatsApp → Copiar resumen → utilities. No hidden duplicate focusables. Focus-visible preserved on interactive controls. **PASS**

## 22. Detail route

`/admin/orders/c1e031af-…0215` — legacy layout: Copy resumen remains in Más acciones grid (after phone/call/address/maps). No workspace chevron/hierarchy. Default template = list position (`Pedido recibido`, not contextual). **PASS — ZERO DELTA**

## 23. Delivery

Full messaging + 4 utilities when phone/address present. **PASS**

## 24. Pickup

DB fixture: pickup orders exist without address (`delivery_method=pickup`, `has_address=false`). Runtime pickup workspace not opened (cancelled fixtures). **SOURCE VERIFIED / NOT EXECUTED**

## 25. No address

Source + DB: pickup rows have no address; address/maps utilities gated. **SOURCE VERIFIED**

## 26. No phone

No safe active no-phone fixture found in recent tenant rows. Code: Copy/Share not phone-gated in workspace branch. **SOURCE VERIFIED**

## 27. Share unsupported

Runtime: `hasShare:false` in Cursor browser. Copy layout adapts cleanly. **PASS**

## 28. Manual override

Pending default `Pedido recibido` → manually selected `Enviar resumen` → opened product detail overlay → selection persisted. **PASS**

## 29. Console

No material React/hydration/workspace-boundary/clipboard errors observed during session. **PASS**

## 30. Network

Presentation validation: +0 reads/writes from Contacto regrouping. **PASS**

## 31. Regression verifies

| Verify | Result |
|--------|--------|
| customer-order-summary | PASS |
| admin-structured-content | PASS |
| admin-contextual-default | PASS |
| order-preparation | PASS |
| pending-status-mutation-finalization | PASS |
| phone-display | PASS |

## 32. Checks

| Check | Result |
|-------|--------|
| tsc | PASS |
| diff-check | PASS |
| build | PASS |
| lint | EXECUTED — KNOWN TOOLING DEBT (ESLint 9 circular JSON) |

## 33. Lint actual result

```
npm run lint → exit 2
TypeError: Converting circular structure to JSON
... property 'react' closes the circle
```

Pre-existing tooling debt only. No file-level lint output produced.

## 34. Runtime changes during validation

**NONE**

## 35. P0–P3

| Level | Findings |
|-------|----------|
| P0 | none |
| P1 | none |
| P2 | none |
| P3 | Real Android Chrome not executed; clipboard read blocked in automation (copy click succeeded; verify scripts PASS) |

## 36. Gate

**ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-VISUAL-HIERARCHY-VALIDATION-1 = PASS WITH REAL-DEVICE QA DEBT — CONTACT MESSAGING VISUAL HIERARCHY FROZEN**

No commit. No push. No deploy.

## Follow-up — secondary utility polish (2026-08-27)

Contact hierarchy validation remains authoritative. Later utility polish did not reopen template, WhatsApp, Copy/Share, message content, or contextual default.

## Follow-up — contact surface contrast (2026-08-27)

Hierarchy validation remains valid. **ADMIN-ORDER-WORKSPACE-CONTACT-SURFACE-CONTRAST-TUNING-1** addressed surface materiality only (borders, surfaces, label tone); no template/content/default/CopyShare structural changes.
