# Handoff: Optimización y Estabilización de `/admin/products`

## 📍 Contexto Estratégico
Como parte de la **Fase 1: Estabilización y Modularidad** de OrderOps, hemos detectado una deuda técnica crítica en la sección administrativa de productos (`/admin/products`). Actualmente, la falta de feedback visual y la carga ineficiente de recursos violan nuestro "Principio de Simplicidad Radical", generando carga mental e incertidumbre en el operario durante la gestión del negocio.

**Objetivo Principal:** Auditar, optimizar a nivel arquitectónico y definir la estructura visual definitiva para cerrar esta sección, evitando retrabajos constantes e improvisaciones futuras.

---

## 🛠️ Plan de Ejecución Secuencial

### Etapa 1: Auditoría de Código (Code Audit)
Antes de proponer cambios visuales, debemos entender y aislar la deuda arquitectónica subyacente en el App Router de Next.js.
* **Análisis de Renderizado:** Identificar la proporción de componentes de cliente (`"use client"`) frente a Server Components. Buscar lógicas pesadas que estén bloqueando el hilo principal del navegador.
* **Trazabilidad de Datos:** Auditar cómo y dónde se están obteniendo los datos del catálogo.
* **Detección de Cuellos de Botella:** Localizar modales masivos cargados en memoria, listas no memoizadas y recursos multimedia estáticos sin optimizar.

### Etapa 2: Remediación Técnica y Optimización Estratégica
Aplicar las siguientes resoluciones técnicas acordadas:

1.  **Feedback Visual Inmediato (React Suspense):**
    * Implementar de inmediato un archivo `loading.tsx` en `/admin/products` para servir un *Skeleton Loader*. Esto mitigará la sensación de "falso clic" o sistema colgado mientras el servidor resuelve los datos en segundo plano.
2.  **Desplazamiento del Peso al Servidor (Server Components):**
    * Refactorizar para que la lógica pesada de obtención de datos y filtrado inicial ocurra del lado del servidor, despachando al cliente HTML ligero.
3.  **Optimización Agresiva de Imágenes:**
    * Todas las imágenes de la tabla/grid de productos deben renderizarse mediante el componente nativo `<Image>` de Next.js, implementando obligatoriamente `placeholder="blur"` para una transición fluida.
4.  **Paginación Administrativa Estricta:**
    * Aplicar paginación a nivel de base de datos/proveedor. El backoffice no debe solicitar ni hidratar más de 20-50 ítems por vista, aliviando la carga integral.
5.  **Carga Diferida (Code Splitting / Dynamic Imports):**
    * Implementar `next/dynamic` para los componentes pesados o modales (como editores de variantes o subida de imágenes), asegurando que solo viajen por la red cuando el operario interactúe con ellos.
6.  **Memoización Estratégica:**
    * Emplear `useMemo` y `useCallback` en las listas reactivas para prevenir re-renderizados masivos ante cambios de estado locales.

### Etapa 3: Definición Visual y Cierre de Sección (Lock-in)
Una vez estabilizada la infraestructura de la página:
* **Alineación UX/UI:** Ajustar la interfaz para que refleje la nueva funcionalidad (ubicación de los controles de paginación, fluidez de los estados de carga).
* **Aprobación y Cierre:** Dar por finalizada y "congelada" la vista de `/admin/products` para la Fase 1. El objetivo es obtener una versión altamente funcional y no volver a iterarla en el corto plazo, liberando capacidad de ingeniería para atacar el esquema de Feature Flags en Supabase.
