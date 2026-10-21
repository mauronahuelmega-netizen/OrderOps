# Estadísticas V1 — Cierre P03-D

**Veredicto: PASS_WITH_LIMITATIONS.** Resumen implementado en `/admin/statistics`, dentro del shell administrativo existente y sin entrada en el menú. El recorrido real con cookies y sesiones Auth sintéticas pasó. La limitación de rendimiento P03-B.1 y la ausencia de un dataset no vacío persistente para E2E siguen impidiendo certificar lanzamiento.

Worktree `OrderOps-Estadisticas`, rama `codex/estadisticas-v1`, HEAD `923300265323d411c5c91b7935472d5423d228d2`. Cero commits nuevos. Todos los archivos de esta entrega son nuevos; permanecen sin seguimiento. Los 1.941 archivos preexistentes conservan sus hashes, incluidos contratos P03-C, SQL, documentos anteriores y cambios sin confirmar del usuario.

## Archivos propios

| Archivo | Función |
|---|---|
| `app/admin/(protected)/statistics/page.tsx` | Ruta dinámica con comprobación propia de acceso, dentro del layout real. |
| `app/admin/(protected)/statistics/query/route.ts` | GET autenticado, `private, no-store`, `Vary: Cookie`; delega íntegramente a P03-C. |
| `app/admin/(protected)/statistics/loading.tsx` | Skeleton SSR sin ceros ficticios. |
| `app/admin/(protected)/statistics/error.tsx` | Error de renderizado con reintento. |
| `components/admin/statistics/statistics-summary.tsx` | Filtros URL, estados, integración del controller y sincronización. |
| `components/admin/statistics/summary-panels.tsx` | KPI, lectura determinista, cobertura y expansión de detalles. |
| `components/admin/statistics/summary-chart.tsx` | SVG comparativo, tooltip, selección y detalle persistente. |
| `components/admin/statistics/statistics.module.css` | Estilos locales, responsive y violeta; consume tokens existentes. |
| `lib/statistics/summary-route-server.ts` | Gate de usuario/perfil original, sin RPC ni normalización de rol. |
| `lib/statistics/summary-chart.ts` | Geometría visual acotada; no agregación financiera. |
| `lib/statistics/summary-ui.verify.ts` | Pruebas propias de geometría y generación de fixture monetario extremo. |
| `lib/statistics/fixtures/p03-d-responses.json` | Fixture estrictamente sintético, usado solo en pruebas. |
| `scripts/statistics-v1/p03-d-*.mjs` | Launcher QA, E2E, sesiones reales Auth, lint y preservación/inventario. |
| `docs/estadisticas-v1/p03-d/*` | Baseline, resultados, este informe, manifiesto de hashes y 16 capturas. |

No se modificaron `permissions.ts`, `admin-nav-config.ts`, `admin-nav-list.tsx`, Commercial Core, Promotores, Cursor ni el shell. No hubo migraciones, índices, optimizaciones SQL, merge, rebase, push o deploy.

## Comportamiento y contratos

La página obtiene el usuario verificado y su perfil con el cliente SSR existente; permite solamente roles originales `owner`, `manager` y `admin`. Un error transitorio de Auth no se interpreta como falta de sesión en el gate propio. Cada consulta vuelve a verificar identidad, negocio y permisos mediante P03-C. El cliente nunca elige un negocio para la RPC; el intento de `businessId` extranjero en URL devolvió el negocio autenticado.

El controller P03-C conserva el período en la URL y su clave canónica. Los ocho presets y el rango personalizado están implementados. Cambios de período neutralizan las cifras anteriores inmediatamente; la presentación también coteja la clave URL durante navegación atrás/adelante antes de aceptar un resultado. Respuestas tardías y duplicadas siguen bajo los controles P03-C. Reintento y actualización son manuales; no hay polling ni caché entre usuarios o negocios.

Una consulta efectiva usa una sola RPC extendida. KPI y punto seleccionados solo actualizan estado local. No se llama adicionalmente a la RPC legacy, no hay consultas por bucket ni lectura financiera cruda desde el navegador. Los decoders y contratos originales permanecen intactos.

Las parejas comparativas son las entregadas explícitamente por el backend. No se emparejan arrays por índice. La geometría posiciona la secuencia de buckets recibida y usa sus claves para selección; no pretende reconstruir un reloj civil continuo entre sesiones. Los intervalos y sus fechas comerciales se conservan para el detalle. La línea actual es continua con marcadores llenos; la anterior es discontinua con marcadores abiertos. Cada comparación inválida produce un hueco, y un indicador sin valores conocidos no dibuja un gráfico de ceros.

Importes, cantidades y diferencias mostrados usan P03-C y strings exactos. Solo la razón acotada para coordenadas SVG se convierte a Number; no se convierte el importe financiero completo. Los importes largos admiten saltos en separadores de miles, sin elipsis. La lectura tiene observación, evidencia, significado y sugerencia, con fallback neutral; no hay motor de Oportunidades.

Productos y Oportunidades son etiquetas «Próximamente» sin enlaces. Los avisos distinguen período en curso, calidad por indicador, históricos sin fecha, pedidos fuera de sesión y comparación no válida. «Ver detalle» expande una explicación real.

## Fidelidad visual y accesibilidad

- Ventas ocupa aproximadamente la mitad del bloque KPI y supera ampliamente la superficie de cada secundario; el E2E exigió una relación mayor que 2.
- Con ancho útil de al menos 800 px, gráfico y lectura usan `2fr / 1fr`; el E2E verificó relación entre 1,8 y 2,2. Ese corte pertenece al contenedor propio, porque el shell reduce el ancho útil respecto del viewport.
- En móvil de 390 px hay dos columnas secundarias y el tercer indicador ocupa la fila siguiente. Por debajo de 300 px útiles se apilan; no se comprimen tres secundarios en una fila.
- Los temas consumen `data-dashboard-theme` y tokens del shell. El acento violeta se limita al módulo. Selección incorpora borde, check, texto/estado accesible y `aria-pressed`, además del color.
- Controles nativos con etiquetas, foco visible de 3 px, botones con nombres y detalle `aria-live="polite"`. El selector y los botones anterior/siguiente son la alternativa completa por teclado a las zonas táctiles del SVG. Se verificó foco e interacción de teclado en ambos temas.
- SVG con nombre accesible; las cifras exactas están disponibles fuera del dibujo. Error/carga/vacío tienen mensajes anunciables. No hay dependencia de hover en móvil, animaciones indispensables ni enlaces inertes.
- No hubo scroll horizontal en escritorio, móvil, paisaje ni con importe extremo y texto al 125 %. Revisión visual de capturas y lint JSX/ARIA completados. Esto no constituye certificación WCAG ni prueba exhaustiva con lectores de pantalla; el zoom al 200 % queda pendiente.

## Pruebas ejecutadas

| Comando / evidencia | Resultado |
|---|---|
| `tsx lib/statistics/summary-ui.verify.ts` | PASS: 7 aserciones, fixture extremo validado por los decoders, geometría finita, huecos y cero conocido. |
| `tsc --noEmit --incremental false` | PASS en el proyecto completo. |
| ESLint P03-D con Next, React Hooks, JSX accesible y TypeScript | PASS en todos los archivos de aplicación propios. |
| ESLint propio sobre scripts QA | PASS. |
| `node scripts/statistics-v1/p03-d-e2e.mjs` | PASS: 90 aserciones; `e2e.json`. |
| `node scripts/statistics-v1/p03-d-auth-session.mjs` | PASS: owner A / manager B con sesiones emitidas por Auth, cookies SSR canónicas, página y RPC reales; `auth-sessions.json`. |
| `node scripts/statistics-v1/p03-d-verify.mjs` | PASS: preservación, fuentes QA idénticas, gate live, ledger e inventario; `verification.json`. |

E2E: ocho períodos reales, permisos por seis roles/dos negocios, anónimo denegado, intento de negocio extranjero ignorado, una consulta por selección efectiva, sincronización KPI/gráfico/lectura, teclado, punto persistente, dominancia de Ventas, proporción de paneles, responsive, importes largos, parcialidad, gráfico desconocido, sin comparación, configuración, timeout, reintento, carga y respuesta tardía descartada. Cero excepciones de navegador y cero orígenes externos en esa prueba.

Correcciones propias: umbral móvil que inicialmente apilaba secundarios en 390 px; regla SVG demasiado amplia que también ampliaba iconos del tooltip; etiquetas de eje en extremos; saltos de miles; representación neutral de indicadores sin valores. Una aserción de test se corrigió para aceptar que React omita el atributo de un path vacío. Hubo demoras y una carga transitoria fallida durante recompilación dev; se diagnosticó y la ejecución final pasó completa. Ninguna corrección exigió cambios compartidos.

## Evidencia live, fixtures y aislamiento

El verificador adversarial y el gate live confirmaron proyecto `orderops-statistics-v1-test-74718de66a41`, cinco contenedores saludables, red exclusiva y dos volúmenes DB/Storage, API `127.0.0.1:56321` y DB `127.0.0.1:56322`. Se repitieron los gates antes/después de E2E y Auth. El ledger conserva 123 migraciones; el SQL comparativo aprobado conserva su SHA-256 `b10c330adff70b803d9d25165f07830e90d4cd092aa4ba2cf3d0120a43f95219`.

Ya había un servidor Next en este worktree usando 3001. No se detuvo ni se alteró su configuración. QA utilizó 3037 y una copia privada de fuentes dentro de `.runtime/p03-d-app`, con lock, tipos y archivos generados propios. Los archivos de aplicación de esa copia se cotejan byte a byte con la entrega. No se cargó `.env` ni service role; las variables Supabase fueron proporcionadas explícitamente por el estado del proyecto aislado. No se reinició ni modificó ningún contenedor Docker.

La ruta SSR/API y los ocho períodos se probaron contra los datasets sintéticos vacíos existentes. Las doce identidades de roles usaron cookies sintéticas del firmante exclusivo. Además, dos usuarios existentes iniciaron sesión por Auth y cerraron su sesión local en `finally`; después de borrar sus cookies el endpoint devolvió 401. El inventario final exige cero pedidos, sesiones comerciales, items y completados, además del ledger intacto. Se conservaron 24 sesiones Auth preexistentes de 12 usuarios, creadas el 12/10 antes de esta fase: la primera expectativa global de cero era incorrecta. Se verificaron fecha, cantidad y fingerprint de sus filas antes/después de repetir el ciclo Auth; ninguna sesión creada por esta fase permanece. No se borraron sesiones ajenas.

Los estados con cifras no vacías se probaron interceptando **solo en Playwright** la respuesta del endpoint propio con fixtures sintéticos estrictos. Ningún fixture, selector QA ni fallback ficticio forma parte de la ruta o de la interfaz de producción. No se insertaron pedidos para estas pruebas. Las capturas llevan sufijo `fixture` o `live` para distinguir su procedencia.

## Capturas

Directorio: `docs/estadisticas-v1/p03-d/screenshots/`.

| Grupo | Archivos |
|---|---|
| Resumen completo sintético | `desktop-light-complete-fixture.png`, `desktop-dark-complete-fixture.png`, `mobile-light-complete-fixture.png`, `mobile-dark-complete-fixture.png` |
| Vacío real aislado | `desktop-light-empty-live.png`, `desktop-dark-empty-live.png`, `mobile-light-empty-live.png`, `mobile-dark-empty-live.png` |
| Importes largos y texto 125 % | `mobile-dark-long-amount-125text-fixture.png`, `landscape-dark-long-amount-125text-fixture.png` |
| Estados alternativos | `desktop-light-error-fixture.png`, `mobile-dark-error-fixture.png`, `desktop-light-loading-fixture.png`, `mobile-dark-partial-fixture.png`, `mobile-dark-no-comparison-fixture.png`, `mobile-dark-configuration-fixture.png` |

## Pendientes y detención

El rendimiento heredado sigue pendiente: alrededor de 2 segundos con 200 pedidos en P03-B.1 y timeout diagnóstico de 15 segundos con 500. El cliente tiene timeout explícito de 30 segundos y error con reintento manual; no oculta ese riesgo con ceros, polling o caché. No se midió un SLA ni se ejecutó carga masiva en esta fase.

Quedan pendientes E2E con cohortes no vacías confirmadas y persistidas en una fixture aislada aprobada, captura/reapertura/cancelación concurrente con pantalla abierta, expiración/refresh de sesión, zoom 200 % y lectores de pantalla. Los contratos de esos datos se consumen sin cambios, pero los fixtures visuales no sustituyen esas verificaciones.

La ejecución fue Next dev con webpack, no un build o despliegue de producción. La entrada al menú y cualquier coordinación/integración con Cursor pertenecen a P03-E y requieren autorización. Tampoco se implementaron Productos u Oportunidades. El servidor propio de QA se cierra selectivamente al terminar; Supabase y el servidor preexistente quedan intactos.

**P03-D detenido para revisión; no se inicia P03-E.**
