# ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-2 — Header Alignment & Left Column Width Polish

## 1. Estado

**PASS**

Fecha: 2026-07-28  
Branch: `main` @ `311568b` (dirty tree local; sin commit/push de esta fase)

## 2. Resumen ejecutivo

Se alineó el phone frame con el header moviendo `AdminPageHeader` dentro de la columna izquierda del grid, se limitó el rail izquierdo a **560px**, y se eliminaron paddings superiores que empujaban el teléfono hacia abajo. Sticky, centrado en mitad derecha y alineación frame/viewport se mantienen.

## 3. Bug visual detectado

1. Teléfono arrancaba debajo del header (header fuera del grid, shell debajo).
2. Columna izquierda se estiraba a todo el `1fr` (~619px+) e invadía el centro.
3. Eje del header vs cards podía sentirse desfasado del ritmo del phone.

## 4. Cambios realizados

- `app/admin/(protected)/products/preview/page.tsx`: en modo preview el header ya no es hermano del shell; vive dentro del shell.
- `catalog-preview-shell.tsx`: render de `AdminPageHeader` al tope de `.contentColumn`.
- `catalog-preview-shell.module.css`:
  - `.contentColumn { max-width: 560px; justify-self: start }`
  - `.pageHeader` sin márgenes extra
  - `.phoneColumn { align-self: start }`
  - `.stage` / sticky sin `padding-top` / `margin-top` que bajen el frame
  - sin `justify-self: end` / `flex-end`

## 5. Alineación header / phone

Medido 1440 / 1024:

| Métrica | Valor |
|---------|-------|
| `header.top` vs `frame.top` | Δ **0** |
| sticky ≥1024 | `position: sticky` |

```txt
Phone subió.
Phone alineado visualmente con header.
Sticky conserva comportamiento.
```

## 6. Ancho lateral izquierdo

| Métrica | Valor |
|---------|-------|
| content max-width | 560px |
| content width @1440 | 560 |
| left axis (header/safety/actions/checklist) | left=104, spread **0** |

```txt
Bloque izquierdo limitado.
Header/status/actions/checklist alineados al mismo eje.
Status card no invade el centro.
```

## 7. Balance visual desktop

| Métrica @1440 | Valor |
|---------------|-------|
| phone centered in right col Δ | 0 |
| frame 422 / pad 16/16 | OK |
| gap viewport right | ~146px |
| overflowX | false |

```txt
Pantalla más equilibrada.
Phone centrado en derecha.
Phone no pegado al borde.
```

## 8. Responsive QA

| Viewport | Resultado |
|----------|-----------|
| 1440 | grid; header↔phone Δ0; left 560; sticky |
| 1024 | grid; Δ0; content ≤560; sticky; sin overflowX |
| 390 | flex column; sticky static; sin overflowX |

## 9. Regression funcional

| Check | Resultado |
|-------|-----------|
| Vaciar carrito (toast “Vaciando…”) | PASS |
| Toasts | PASS |
| postMessage / mobile-feel / checkout / público | No tocados (layout-only) |

## 10. Deuda residual

| ID | Sev | Nota |
|----|-----|------|
| FIX-2 aún no en prod | P2 | Deploy previo no incluye este polish; requiere commit/push autorizado |
| Clipboard / device touch / press feedback / lint | P3 | Preexistentes |

## 11. Rollback

Revertir:

- `app/admin/(protected)/products/preview/page.tsx`
- `components/admin/products/catalog-preview-shell.tsx`
- `components/admin/products/catalog-preview-shell.module.css`

al estado post LAYOUT-QA-FIX-1 / pre FIX-2.

## 12. Próximo paso

**ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1** (tras autorizar commit/push de este polish a producción)

---

## CLI

- `npx tsc --noEmit` → PASS
- `npm run build` → PASS
- `npm run lint` → FAIL preexistente (ESLint circular)
