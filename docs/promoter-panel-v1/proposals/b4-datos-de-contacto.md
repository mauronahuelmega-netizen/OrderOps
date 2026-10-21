# B4 — Datos de contacto autorizados

Estado: aplicada en `orderops-promoter-smoke`. No está en remoto. El único cambio de `promoter_overview` es `normalized_phone`. La bienvenida no entra en este RPC.

## 1. Diseño y SQL

`commercial.normalize_ar_phone` deja solo dígitos, quita un prefijo `54` y un `0` inicial. Si quedan 10 dígitos, guarda `+549` más esos dígitos. Si quedan 11 y empiezan en `9`, guarda `+54` más esos 11, que también es `+549` y diez dígitos nacionales. Cualquier otro valor guarda null. `find_or_prepare_business` escribe ese resultado en `commercial.commercial_businesses.normalized_phone`. El WhatsApp crudo del formulario no se conserva.

`commercial_contacts.normalized_phone` no entra: su policy es solo interna. `public.businesses` es el negocio convertido, no esta cartera.

`promoter_overview` es `SECURITY DEFINER`. El único fragmento que cambia es el objeto del comercio. El `WHERE` permanece igual.

```sql
select jsonb_agg(jsonb_build_object(
  'id', business.id,
  'display_name', business.display_name,
  'normalized_phone', business.normalized_phone
) order by business.created_at)
from commercial.commercial_businesses business
where business.id in (
  select claim.commercial_business_id
  from commercial.attribution_claims claim
  where claim.promoter_id = v_promoter
  union
  select opportunity.commercial_business_id
  from commercial.commercial_opportunities opportunity
  where opportunity.owner_account_id = v_account
)
```

No se agregan columnas, grants ni policies. El definer ya leía la tabla; el filtro actual decide qué ids entran. No se suma `email` ni `fiscal_id`.

En la interfaz, el número es usable solo si cumple `^\+549\d{10}$`. Si es null, vacío o no cumple el patrón, no hay WhatsApp, llamada ni copiar.

- `tel:` usa el valor completo, con el más.
- WhatsApp abre `https://wa.me/` más los dígitos, sin el más y sin parámetro `text`.
- Copiar escribe solo ese valor y usa la confirmación de Recursos.
- Ninguna acción envía un mensaje.

## 2. Objetos y permisos

Se reemplaza el cuerpo de `commercial.promoter_overview`, ya ejecutable por `authenticated` mediante `public.promoter_overview`. No cambia el `GRANT`. No se abre `SELECT` de `commercial_contacts` ni de `public.businesses`.

## 3. Pruebas

Positivas:

- A recibe el `normalized_phone` de un comercio que ya estaba en su overview.
- Un valor `+549` y diez dígitos habilita los tres controles.
- El enlace de WhatsApp no lleva texto prellenado.

Negativas:

- B no recibe el teléfono ni el id de un comercio que solo está en el conjunto de A.
- Null o un valor que no cumple el patrón no muestra controles.
- La respuesta no incluye `email` ni `fiscal_id`.
- El alta sigue exigiendo `can_operate`. Ver el teléfono no crea un comercio.

## 4. Riesgos, alternativas y dependencias

El definer publica cualquier clave que se agregue al JSON. El diff queda en `normalized_phone`. Un teléfono compartido por la deduplicación se muestra a cada promotor que ya ve ese comercio; no se crean relaciones para completar la UI.

No hay columna con el teléfono original. Si `normalize_ar_phone` devolvió null, el portal no puede recuperarlo. Ampliar `commercial_contacts` sería otro permiso y no forma parte de este cambio.

Depende de aprobar el reemplazo de `promoter_overview` antes de mostrar los controles.

## 5. Cambios de esta revisión

Se pegó el fragmento exacto del overview. Se documentó el formato real de `normalize_ar_phone`, el patrón de aceptación y la ausencia de controles cuando el dato no sirve. Se dejó explícito que el conjunto de comercios y los grants no cambian, con la prueba A/B.

## 6. Integración con B3

No se consolidan. B3 usa `read_own_welcome_preference` y `set_own_welcome_dismissed`. B4 solo agrega `normalized_phone` dentro de cada objeto de `businesses`.

Contrato actual, verificado en `20261009020811_commercial_phase03_panel.sql` y sin un `create or replace` posterior:

- `ok`
- `businesses[]`: `id`, `display_name`
- `opportunities[]`: `id`, `stage`, `business_id`
- `claims[]`: `id`, `status`, `business_id`
- `tasks[]`: `id`, `title`, `status`, `due_at`, `opportunity_id`

Contrato final de este RPC:

- Los mismos campos.
- En cada comercio, además, `normalized_phone` (`text` o null).
- Sin clave de bienvenida.

Los consumidores actuales tipan solo `id` y `display_name` en `buildPortfolio` y en las páginas de cartera, inicio, oportunidades, ficha, reclamaciones y tareas. Una clave nueva no rompe ese tipado. `types/database.ts` declara el retorno como `Json`. `supabase/tests/commercial/phase03_panel.sql` exige que B no vea el nombre de A y que A tenga una reclamación. Un teléfono dentro del conjunto de A no cambia ese resultado. La regresión futura debe afirmar que el JSON de B no contiene el teléfono de A.

Si `promoter_overview` falla, no se muestran acciones de contacto. No se usa un teléfono de respaldo.

## 7. Acciones

Solo con `^\+549\d{10}$`:

- WhatsApp: `https://wa.me/` y los dígitos, sin `text` y sin registrar una conversación.
- Llamada: `tel:` más el valor, con el más.
- Copiar: solo ese valor. «Copiado» únicamente si la escritura del portapapeles se confirma. Si falla, se explica y queda la alternativa manual.

Null, vacío o cualquier otro formato: los tres controles no se renderizan. No hay enlace a un número parcial.

## 8. Matriz de aceptación

| Caso | Precondición | Acción | Resultado | PASS |
|---|---|---|---|---|
| Válido | Comercio de A con `+549` y diez dígitos | Abrir la ficha o la cartera | Tres controles. El `href` de WhatsApp no tiene `text` | DOM y JSON |
| Nulo | `normalized_phone` null | Abrir el mismo comercio | Cero controles de contacto | DOM |
| Inválido | Valor que no cumple el patrón | Abrir | Cero controles | DOM |
| Autorizado | El comercio ya entra por claim u oportunidad propia | Comparar ids antes y después | El mismo conjunto, más el campo | Diff del array `businesses` |
| Otro promotor | El comercio solo está en A | Entrar como B | B no recibe ese id ni ese teléfono | JSON de B |
| Permisos | Policies y grants | Diff de la migración futura | Sin `commercial_contacts`, sin `UPDATE` de `promoters`, sin policy nueva | Diff |
| `tel:` y WhatsApp | Número válido | Leer los `href` | `tel:+549…` y `https://wa.me/549…` | Atributos |
| Copia ok | Portapapeles concedido | Copiar | Botón «Copiado» y el número exacto | Estado y lectura del portapapeles |
| Copia fallo | Escritura rechazada | Copiar | Sigue «Copiar», alerta, número seleccionado | DOM |
