# Admin Layout System v1

## Objetivo

Admin Layout System v1 define la estructura visual compartida del admin protegido para que nuevas pantallas mantengan:

- chrome global consistente
- rhythm interno consistente
- ownership claro del CSS
- comportamiento responsive estable

Este sistema no define la logica de negocio. Solo define la capa de layout, chrome y superficies compartidas del admin.

## Capas del sistema

### 1. `AdminShell`

Archivo:
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\admin-shell.tsx`
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\admin-shell.css`

Responsabilidad:
- root del admin protegido
- chrome global
- nav global desktop
- landmark principal (`main`)
- content container base
- spacing base debajo del chrome

No controla:
- page headers internos
- cards
- forms
- subnavs contextuales
- layouts especificos por dominio

Decision congelada:
- el shell usa `grid-template-rows: auto 1fr`
- el shell no debe volver a mezclar page layout con chrome

### 2. `AdminHeader`

Archivo:
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\admin-header.tsx`
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\admin-header.css`

Responsabilidad:
- brand global del negocio
- bloque de sesion desktop/tablet
- disparador del drawer mobile
- integracion visual con la nav global

No controla:
- layout de pagina
- actions locales de pagina
- forms
- contenido del drawer

Decision congelada:
- mobile y desktop comparten el mismo componente
- los ajustes de compactacion desktop/tablet viven en media queries

### 3. `AdminMobileDrawer`

Archivo:
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\admin-mobile-drawer.tsx`
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\admin-mobile-drawer.css`

Responsabilidad:
- overlay mobile global
- panel lateral mobile
- cierre por overlay, `Escape`, cambio de ruta y boton
- scroll lock del documento

No controla:
- layout desktop
- nav horizontal desktop
- page layout interno

Decision congelada:
- el drawer vive portalizado en `document.body`
- no reabrir su comportamiento salvo bug real

### 4. `AdminPageLayout`

Archivo:
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\admin-page-layout.tsx`
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\admin-page-layout.css`

Responsabilidad:
- wrapper comun de pagina interna
- rhythm base entre header interno y contenido
- ancho maximo por variante

Variantes:
- `size="default"`: pantallas de lectura/gestion estandar
- `size="wide"`: workspaces mas anchos con grids, catalogos o dos columnas
- `size="narrow"`: formularios o contenido mas enfocado

No controla:
- chrome global
- nav global
- page header copy
- cards
- forms

Decision congelada:
- nuevas rutas admin deben partir de `AdminPageLayout`

### 5. `AdminPageHeader`

Archivo:
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\admin-page-header.tsx`
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\admin-page-header.css`

Responsabilidad:
- eyebrow opcional
- titulo
- descripcion opcional
- actions locales opcionales

No controla:
- content container
- nav contextual
- cards
- logica

Decision congelada:
- la API actual (`title`, `description`, `eyebrow`, `actions`) es suficiente para v1

### 6. `admin-surfaces.css`

Archivo:
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\admin-surfaces.css`

Responsabilidad:
- cards compartidas
- form surfaces compartidas
- campos
- botones compartidos
- empty states
- feedbacks

Se usa tambien en:
- admin protegido
- login admin
- super-admin

No debe incluir:
- layout de paginas
- grid de productos
- nav contextual
- order cards especificas

### 7. CSS por dominio

#### `public-settings.css`

Archivo:
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\settings\public-settings.css`

Responsabilidad:
- subnav contextual de `settings/public`
- overview cards de settings public
- preview blocks
- uploads y campos visuales propios del dominio

#### `products-admin.css`

Archivo:
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\products\products-admin.css`

Responsabilidad:
- workspace de productos y categorias
- grids de cards de producto
- metrics y catalog sections
- modales/form shells del dominio productos

#### `orders-admin.css`

Archivo:
- `C:\Users\Oasis Desktop\Documents\New project 2\components\admin\orders-admin.css`

Responsabilidad:
- lista de pedidos del dashboard
- detail page del pedido
- order item modal
- responsive polish de la order card

## Rutas migradas

Rutas ya alineadas con v1:

- `/admin/dashboard`
- `/admin/products`
- `/admin/categories`
- `/admin/settings/public`
- `/admin/settings/public/landing`
- `/admin/settings/public/catalogo`
- `/admin/orders/[id]`

Notas:
- `/admin/products` delega la composicion a `ProductsWorkspace`
- `/admin/orders/[id]` ya no usa el header legacy interno anterior

## Reglas de uso para nuevas paginas admin

Nueva pantalla admin protegida:

1. debe renderizar dentro de `AdminShell` via `app/admin/(protected)/layout.tsx`
2. debe empezar con `AdminPageLayout`
3. debe usar `AdminPageHeader`
4. no debe crear wrappers legacy de pagina
5. debe usar `admin-surfaces.css` para cards/forms/buttons si el patron ya existe
6. el CSS especifico del dominio no debe ir a `globals.css`

## Cuando usar cada size

### `AdminPageLayout size="default"`

Usar cuando:
- la pantalla es de lectura/gestion general
- el contenido principal es una lista compacta, cards estandar o formularios moderados
- no hace falta aprovechar todo el ancho del shell

Ejemplos actuales:
- dashboard
- settings public overview
- settings public landing
- settings public catalogo
- order detail

### `AdminPageLayout size="wide"`

Usar cuando:
- la pantalla necesita mas pista horizontal real
- hay grids visuales
- hay dos columnas o workspaces de catalogo
- la densidad util mejora con mas ancho

Ejemplos actuales:
- products
- categories

### `AdminPageLayout size="narrow"`

Usar cuando:
- la pantalla es un form enfocado
- la lectura mejora con ancho controlado
- el contenido debe sentirse mas editorial o mas guiado

En v1 queda disponible pero todavia no es el patron dominante.

## Como usar `AdminPageHeader`

Reglas:
- `eyebrow` para la categoria del espacio
- `title` para la tarea principal
- `description` para contexto operativo breve
- `actions` solo para acciones locales de pagina

Evitar:
- duplicar un segundo header textual debajo
- usarlo para nav contextual
- meter botones de negocio que pertenecen a una card o form interna

## Reglas de CSS

### Que va en `admin-surfaces.css`

- cards compartidas
- form shells
- campos compartidos
- botones compartidos
- empty states
- feedbacks

### Que va en CSS por dominio

- grids
- metrics
- subnavs contextuales
- modales especificos
- previews especificos
- cards especificas del dominio

### Que no debe volver a `globals.css`

- wrappers de pagina admin nuevos
- navs del admin
- layouts de dominio
- spacing especifico de una ruta admin

`globals.css` debe quedar para:
- base global
- login/super-admin compartido si todavia depende de clases legacy
- piezas realmente cross-app

## Breakpoints actuales

Breakpoints relevantes del sistema:

- base mobile
- `720px`: tablet y primeros ajustes de workspace
- `900px`: desktop/tablet ancho, nav horizontal del admin
- `1200px`: desktop ancho para densidad fina
- `1280px`: ajustes anchos del workspace de productos

Regla:
- preferir `720px` y `900px` como puntos de entrada
- abrir breakpoints nuevos solo si el caso lo necesita de verdad

## Reglas de diseno v1

### Header
- debe sentirse como una app bar premium
- mobile compacto
- desktop/tablet integrado con la nav
- no volver a cards gigantes o chrome con altura fantasma

### Nav global
- desktop horizontal
- mobile en drawer
- active state claro
- no separar visualmente la nav del chrome

### Cards
- usar superficies compartidas cuando el patron ya existe
- evitar meter cards dentro de cards salvo necesidad real
- mantener radios y sombras consistentes

### Forms
- heredar de `admin-surfaces.css`
- no reinventar botones/campos si ya existe clase compartida

### Buttons
- primary para accion principal local
- secondary para acciones de soporte
- ghost para acciones de menor peso

### Drawer
- full-screen overlay mobile
- no tocar sin bug real

## Decisiones congeladas

No reabrir sin causa real:

- shell grid del admin
- header mobile/desktop base
- drawer behavior
- API de `AdminPageLayout`
- API de `AdminPageHeader`
- ownership de `admin-surfaces.css`
- ownership de CSS por dominio

## Deuda tecnica y visual pendiente

Pendientes seguros para futuro:

- revisar clases legacy de admin que siguen en `globals.css` porque aun sirven a `super-admin` o `login`
- separar mas claramente algunas clases compartidas entre admin y super-admin
- revisar naming historico como `admin-product-*` usado tambien en formularios de super-admin
- agregar QA real en browser cuando el backend del in-app browser vuelva a estar disponible
- decidir si algunas rutas futuras necesitan `size="narrow"`

## Checklist para una nueva ruta admin

Nueva ruta admin:

- usa `AdminPageLayout`
- usa `AdminPageHeader`
- no crea wrapper legacy
- usa `admin-surfaces.css` para cards/forms/buttons si aplica
- CSS especifico vive en un archivo de dominio
- no agrega CSS admin nuevo a `globals.css`
- revisa mobile
- revisa tablet
- revisa desktop
- evita reabrir shell/header/drawer sin bug real

