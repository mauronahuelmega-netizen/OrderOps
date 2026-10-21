# Landing recovery — validation

Fecha: 2026-10-11. Resultado: recuperación local completa; validación técnica PASS; nueva revisión visual/interactiva pendiente.

## Causa y fuente

La rama actual `cursor/commercial-core-v1-integration` conservaba la página inicial antigua. La landing recreada quedó guardada en `5a068aaec8ed8e38301e6e52b327644c775f82a8`, dentro de `cursor/cloud-agent-1791515001926-p4cht`, y también en `stash@{1}`. El reflog registra el traslado de cambios locales a un agente Cursor, un reset de main y posterior cambio de rama el 9 de octubre. La secuencia explica por qué esos archivos dejaron de estar presentes en este checkout; no prueba quién eligió cada operación.

Se recuperaron selectivamente los archivos de marketing de ese commit, sin aplicar el stash completo ni cambiar de rama. Incluyen las iteraciones V1–V1.2.1 y la reserva de altura desktop V1.2.2 (`.board`, desde 1024 px, `min-height:508px`). Se conserva la integración posterior que agrega el enlace «Completar formulario» a `/demo`.

## Alcance y protección

- 35 archivos recuperados: página raíz, sitemap, 23 archivos de componentes/marketing, cuatro assets, cuatro informes, runner de verifies y cambio de idioma del layout.
- `app/layout.tsx`: únicamente `lang="en"` → `lang="es-AR"`; el resto del layout se conserva.
- Los dos componentes preexistentes `demo-request-form.tsx` y `demo-request-form.module.css` se preservaron byte por byte. `/demo`, su server action y las rutas comerciales no se modificaron.
- Backups de archivos reemplazados, listado exacto, baseline de hashes y resultados: `tmp/landing-recovery-2026-10-11/`.
- HEAD permanece en `ba0cf7ed91e1ba7b2f7a4aa5bdbad2bcf0685bd0`.
- Sin diferencias staged (`git diff --cached --quiet` PASS). El hash binario del índice cambió durante las inspecciones de Git; su contenido staged está intacto. No se afirma preservación byte por byte de sus metadatos internos.
- Auditoría de todos los archivos tracked: solo cambiaron `app/page.tsx` y `app/layout.tsx`. Los demás archivos recuperados no existían en el árbol actual y permanecen untracked. Ningún archivo operacional tracked cambió.
- Sin staging, commit, push, deploy, aplicación de stash, reset ni operaciones hosted.

## Checks ejecutados

| Comprobación | Resultado |
| --- | --- |
| `npx --no-install tsc --noEmit --incremental false` | PASS |
| `npm run build` | PASS con acceso de red para Google Fonts; 38 páginas estáticas |
| `node scripts/landing-v1/verify.cjs` | PASS, siete verifies existentes |
| `node scripts/landing-v1/verify.cjs components/marketing/marketing-presentation.verify.ts` | PASS |
| ESLint acotado usando API instalada y configuraciones flat existentes, sin escribir configuración | PASS, 18 archivos, cero errores y warnings |
| `npm run lint` | Bloqueado por FlatCompat preexistente |
| `git -c core.safecrlf=false diff --check` | PASS |
| `git diff --cached --quiet` | PASS |

El primer build dentro del sandbox falló al descargar Inter y Plus Jakarta Sans. La repetición con acceso de red pasó; no se modificaron fuentes ni dependencias. Persiste la advertencia preexistente de Next sobre `middleware` deprecado.

Lint general: `TypeError: Converting circular structure to JSON`, ciclo `configs.flat.plugins.react`, en `@eslint/eslintrc/lib/shared/config-validator.js:308:45`. No se reparó ESLint ni se modificó su configuración.

## Validación HTTP y render de servidor

HTTP 200 en `/`, `/demo`, `/admin/login`, `/sitemap.xml`, `/marketing/burger.svg`, `/marketing/lemonade.svg` y `/marketing/orderops-social.png`.

El HTML servido de `/` contiene diez secciones, headline «Dejá de tomar pedidos…», cuerpo aprobado, referencia J3E54J, enlaces `/demo` y `/admin/login`, disclosures nativos, assets de marketing y `lang="es-AR"`. El HTML de `/demo` contiene el formulario existente. No se enviaron solicitudes de demo ni se escribieron datos comerciales.

La regla V1.2.2 se comprobó en el archivo recuperado. Eso conserva el fix, pero no sustituye una nueva medición interactiva del Kanban.

## Limitaciones reales

Computer Use no pudo acceder a Edge: la autorización de acceso a la aplicación venció. No se completó una nueva pasada visual de 360/390/768/1024/1440 ni se ejecutaron interacciones de menú, FAQ o Kanban en esta sesión. Los informes recuperados documentan el QA histórico; no se presentan como QA nuevo.

La landing está disponible en `http://localhost:3000/` para revisión local. Recargar una pestaña que todavía conserve la página anterior.

Los archivos recuperados siguen sin commit. Esta recuperación no los incorpora a HEAD: otro reset/limpieza del working tree podría volver a retirar esos cambios.
