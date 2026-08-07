# PUBLIC-CATALOG-HERO-CONTENT-CONTRACT-AUDIT-1
## Configurable Copy, Static Messaging, Fallbacks and Public Data Flow

## 1. Estado

AUDIT COMPLETE — HERO CONTENT CONTRACT MAPPED

## 2. Resumen ejecutivo

El rediseño dejó de consumir tres campos configurables que siguen persistidos, tipados, cargados y editables: `catalog_hero_headline`, `catalog_hero_badge` y `catalog_hero_microcopy`. La recuperación correcta para la próxima fase es solamente el headline; badge, eyebrow, estado duplicado, trust chip y overlay siguen fuera del contrato visual aprobado.

## 3. Baseline

- Baseline Git: `3b6160df0cce010a66db6b90cf008fb0fc546529`.
- Source actual auditado: working tree local; los cambios existentes son preexistentes y no se modificaron en esta fase.
- Comparación: `git show 3b6160d:components/public/catalog/catalog-client.tsx` frente a `git diff -- components/public/catalog/catalog-client.tsx`.

## 4. Hero anterior

El Hero anterior declaraba:

- `heroHeadline = business.catalog_hero_headline?.trim() || "Listo para pedir."`.
- `heroBadge = business.catalog_hero_badge?.trim() || "Te confirmamos por WhatsApp"`.
- `heroMicrocopy = business.catalog_hero_microcopy?.trim() || "Hacé tu pedido y seguimos por WhatsApp."`.
- Eyebrow estático `Pedí online`.
- Estado dinámico desde `business.on_demand_mode_active`: `Estamos tomando pedidos` o `Por ahora no estamos tomando pedidos`.
- Cover `business.cover_image_url`, con `alt={\`Portada de ${business.name}\`}`, skeleton y fallback estático.

## 5. Hero actual

El markup actual conserva cover, fallback y alt; ya no consume los tres campos hero. Renderiza un único párrafo estático: `Personaliza tu pedido y te lo confirmamos por WhatsApp.`

## 6. Inventario de contenido

| Contenido visible | Clasificación | Campo/expresión exacta | Fallback / condición | Estado actual |
| --- | --- | --- | --- | --- |
| Headline comercial | TENANT_CONFIGURABLE | `business.catalog_hero_headline` | `trim() || "Listo para pedir."` | No renderizado |
| Badge WhatsApp | TENANT_CONFIGURABLE | `business.catalog_hero_badge` | `trim() || "Te confirmamos por WhatsApp"` | Eliminado deliberadamente |
| Microcopy | TENANT_CONFIGURABLE | `business.catalog_hero_microcopy` | `trim() || "Hacé tu pedido y seguimos por WhatsApp."` | Reemplazado por copy fijo |
| Copy actual | STATIC_PRODUCT_COPY | Literal en `CatalogClient` | Siempre visible | Renderizado |
| Eyebrow | DECORATIVE | Literal `Pedí online` | Siempre visible antes | Eliminado deliberadamente |
| Estado operativo | DYNAMIC_OPERATIONAL_STATE | `business.on_demand_mode_active` | Dos literales previos | Movido al header |
| Cover | TENANT_CONFIGURABLE | `business.cover_image_url` | Skeleton; fallback si falta/error | Renderizado |
| Alt cover | COMPUTED_FALLBACK | ``Portada de ${business.name}`` | Requiere `business.name` | Renderizado |
| Fallback cover | STATIC_PRODUCT_COPY | `Catálogo listo para pedir` / `Elegí tus productos favoritos y enviá el pedido.` | Sin cover o error | Renderizado |

## 7. Campos persistidos

La migración `supabase/migrations/20260512090000_catalog_hero_copy_fields.sql` agrega como `text` nullable a `public.businesses`:

- `catalog_hero_headline`
- `catalog_hero_badge`
- `catalog_hero_microcopy`

`types/database.ts` los declara `string | null` en Row, Insert y Update. No hay default, límite DB ni validación de longitud en source.

## 8. Admin ownership

Ruta: `/admin/settings/public/catalogo`, Presencia pública > Catálogo público. `PublicCatalogSettingsForm` permite editar los tres campos con permiso `managePublicSettings` y action `updateCatalogHeroSettingsAction`.

- Headline: textarea, helper recomendado 45–60 caracteres; vacío se transforma a `null`.
- Badge: input, recomendado hasta 35 caracteres; vacío se transforma a `null`.
- Microcopy: textarea, recomendado hasta 80 caracteres; vacío se transforma a `null`.

La landing lee los valores para el panel admin/preview, pero `BusinessLandingPage` utiliza `business.description`, no los campos hero. No hay consumidor público de headline/badge/microcopy fuera del catálogo histórico.

## 9. Data flow

`businesses` columns → `loadPublicBusinessStableBySlug` en `lib/catalog/public-cached-data.ts` (select explícito) → `getCachedPublicBusinessStable` (`unstable_cache`, 60s, `public-business:<slug>`) → `getPublicCatalogPageData` superpone el estado operativo fresco → `PublicCatalogPageContent` → prop `business` de `CatalogClient` → Hero.

`/b/[slug]/catalogo?orderopsPreview=1` usa el mismo loader y datos; solo cambia `isCatalogPreview` para interacción/carrito. No existe un pipeline específico de copy para preview.

## 10. Cache e invalidación

`updateCatalogHeroSettingsAction` actualiza `businesses`, ejecuta `revalidatePath` de las rutas admin y llama `revalidatePublicCatalogCache({ businessId, slug, scope: "business" })`. Esto aplica `updateTag(public-business:<slug>)`, `revalidatePath(/b/<slug>/catalogo)` y `revalidatePath(/b/<slug>)`; el TTL de respaldo es 60 segundos.

## 11. Preview y consumidores

- Catálogo público y preview query: reciben el mismo `PublicBusiness` y tienen blast radius HIGH si se cambia loader o contrato.
- Preview admin `PublicPresencePreview`: muestra los tres campos y sus fallbacks históricos, pero es aproximado; no es source de verdad de runtime.
- Landing pública: usa `description`, cover, logo y marca; no renderiza los campos hero.
- Header/checkout/success: reciben `PublicBusiness`, pero no consumen estos campos. El header sí consume el estado operativo fresco.

## 12. Null, empty y fallback

Admin convierte `null`, vacío y solo espacios en `null`. El contrato histórico hacía trim en UI y usaba fallback por campo. Recomendación para headline: `business.catalog_hero_headline?.trim() || "Listo para pedir."`; nunca ocultar el bloque completo por ausencia de dato. Limitar visualmente a dos líneas en la fase de implementación, sin truncar ni mutar el valor persistido.

## 13. Blast radius

Restaurar solo headline en `CatalogClient`: MEDIUM. Comparte payload, cache e invalidador con preview y landing paths, pero no cambia sus renderizados. Restaurar badge/microcopy: MEDIUM visual y contradice la spec cerrada. Cambiar loader, schema o action: HIGH y fuera de alcance.

## 14. Contenido que debe recuperarse

Recuperar únicamente `catalog_hero_headline` como headline comercial configurable. La evidencia confirma que un texto como `Hamburguesas smash, papas y extras a tu gusto.` puede provenir de ese campo, pero no se puede atribuir ese valor concreto sin leer datos productivos. Mantener la cover arriba y headline debajo.

## 15. Contenido que debe permanecer eliminado

- `Pedí online` eyebrow del Hero.
- Badge configurable y trust chip.
- Microcopy configurable como segunda capa del Hero.
- Estado abierto/cerrado dentro del Hero; permanece en header.
- Overlay, texto sobre imagen, pastilla verde y card externa.

## 16. Contrato recomendado

Jerarquía: cover → `h1` configurable `catalog_hero_headline` → párrafo estático secundario `Personaliza tu pedido y te lo confirmamos por WhatsApp.`. El `h1` siempre usa el fallback histórico `Listo para pedir.` cuando el valor es null, vacío, espacios o legacy inválido. El párrafo secundario permanece siempre, sin duplicar badge/microcopy. Mantener dos líneas visuales máximas, mobile/desktop y dark mode en la fase posterior; no cambiar cache, preview ni dato.

## 17. Scope de implementación

`PUBLIC-CATALOG-HERO-CONTENT-HIERARCHY-POLISH-1` debe limitarse a `CatalogClient` y estilos hero estrictamente necesarios. No requiere migration, loader, tipos, action, formulario, cache ni cambio de preview.

## 18. Riesgos

- Restaurar los tres campos recrearía las capas visuales descartadas y duplicaría WhatsApp.
- Un fallback distinto al histórico dejaría admin, preview y público inconsistentes.
- Cambiar `on_demand_mode_active` reintroduciría estado duplicado y rompería la separación header/Hero.

## 19. Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-HERO-CONTENT-HIERARCHY-POLISH-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-BURGER-MENU-FLAT-A11Y-POLISH-1 = BLOCKED
```

## 20. Próximo paso

`PUBLIC-CATALOG-HERO-CONTENT-HIERARCHY-POLISH-1`
