# Validación de reconciliación Cloud OrderOps — 2026-10-16

Veredicto: `READY_WITH_LIMITATIONS`.

CLI usada: Supabase **2.120.0** (`npx --yes supabase@2.120.0`). No se cambió de versión. Cloud `pkrsedmwxekbhlohhqds` no recibió `db push`, `migration repair` ni SQL. Las pruebas de escritura usaron solo el contenedor desechable `orderops-recon-validate-disposable` (`postgres:17`, `127.0.0.1:56942`), creado para esta tarea y ya detenido y eliminado. Siguen en marcha las bases de OrderOps principal, QA, Estadísticas y Ledger.

## 1. Integridad del respaldo

Se leyeron los cinco archivos del manifiesto y se recalculó SHA-256 y tamaño. Los cinco coinciden. No se regeneró el respaldo.

| Archivo | Bytes | SHA-256 | Resultado |
|---|---:|---|---|
| `OrderOps-cloud-pkrsedmwxekbhlohhqds-20261016T192500Z-schema.sql` | 125380 | `89BD9B449A8988DA6F7183736A1FFB4C559E533AE9C5CFCEA7F09529915FF546` | coincide |
| `OrderOps-cloud-pkrsedmwxekbhlohhqds-20261016T192500Z-data.sql` | 338416 | `C2CB9C13ADFFB7708BA2CDEB16EF2120C95623E18BBD6BF23F5BB7841A70D787` | coincide |
| `OrderOps-cloud-pkrsedmwxekbhlohhqds-20261016T192500Z-managed-schema.sql` | 245397 | `2D7FA28AE11D63161A4DEE349D707D6E976FA9F8FB32B1B9382E9DA28FD1A598` | coincide |
| `OrderOps-cloud-pkrsedmwxekbhlohhqds-20261016T192500Z-managed-data.sql` | 129150 | `8B2B8DAC12C4115D4D5EEB01734859D0AF69FBD1E1F25EE64CE46229027155F8` | coincide |
| `OrderOps-cloud-pkrsedmwxekbhlohhqds-20261016T192500Z-roles.sql` | 358 | `4350A72B5EC109888E740C17F3EB4DA2FCD95AB73AF26499538ED0BF615DB543` | coincide |

`git check-ignore` sobre el manifiesto termina con `fatal` porque la ruta está fuera del repositorio `OrderOps`. El respaldo no está en Git.

Exclusiones que siguen vigentes:

- Binarios de Storage. Hay metadatos en `storage.objects`, no los archivos.
- `vault` y la extensión `supabase_vault`.
- Configuración administrada: dashboard, URLs de Auth, SMTP, secretos de API y PITR.
- Roles completos. `roles.sql` solo cambia `statement_timeout` de cuatro roles.

La restauración de esta tarea volvió a cargar el respaldo en la instancia desechable: 4 negocios, 78 pedidos, 60 políticas `public` y 14 filas de ledger antes de cualquier reparación. Errores de carga, sin efecto sobre esos conteos: `supabase_vault` no existe en PostgreSQL 17 genérico, la publicación `supabase_realtime` no existe, y seis sentencias del esquema administrado referencian `public.profiles` antes de que esa tabla exista.

## 2. Historial: qué hace la CLI

`migration list` y `migration repair` emparejan por la cadena `version`, no por `name`. Contra la copia desechable, las 136 versiones locales aparecen con remoto vacío y las 14 versiones remotas aparecen con local vacío.

`db push --help` no tiene un flag de intervalo. Los flags relevantes son `--dry-run`, `--include-all`, `--skip-vault` y `--db-url`.

Pruebas sobre la copia, con `--db-url` apuntando a `127.0.0.1:56942` y sin `--linked`:

| Acción | Efecto observado |
|---|---|
| `db push --dry-run` con las 14 versiones remotas todavía en el ledger | Falla con `DbPushMissingLocalError`: `Remote migration versions not found in local migrations directory`. La propia CLI propone `migration repair --status reverted` y lista las 14 versiones. No aplica SQL. |
| `migration repair --status reverted` de una versión remota | Borra esa fila de `supabase_migrations.schema_migrations`. No ejecuta un down. Negocios y pedidos siguen en 4 y 78. |
| `migration repair --status applied` de una versión local | Inserta la fila. Copia `name` desde el archivo y guarda el SQL en `statements`. No lo ejecuta. `created_by` queda nulo. Los conteos no cambian. |
| Reparar como `applied` las 52 versiones de los grupos A, B y C, y como `reverted` las 14 remotas | El ledger desechable queda en 52 filas. Negocios 4, pedidos 78. |
| `db push --dry-run` después de eso, sobre el repositorio completo | Lista las 84 migraciones desde `20260926010000_shared_core_expand.sql` hasta `20261016182000_commercial_phase06_privacy_open_unique.sql`. Una sola ejecución las aplicaría todas. |

Conclusión probada: las 14 versiones remotas tienen que marcarse `reverted` para que la CLI acepte el historial. Conservarlas bloquea `db push` antes de cualquier migración nueva. `reverted` en 2.120.0 es un borrado de la fila del ledger, no un rollback del esquema. Las 52 versiones locales se registran con `applied` sin reejecutar su SQL.

Grupos cubiertos por esa prueba: A 14, B 3, C 35, y las 14 remotas de timestamp distinto.

## 3. Migración de adaptación

Archivo nuevo, sin commit y sin aplicar en Cloud:

`supabase/migrations/20260917210151_cloud_rls_search_path_alignment.sql`

El timestamp queda entre `20260917210150` y `20260926010000`. `supabase migration new` habría usado la hora actual y la habría ordenado después de PHASE-06. Ninguna de las 84 migraciones posteriores vuelve a definir estas políticas ni `create_default_business_settings()`.

En la copia restaurada, antes de finanzas, el archivo terminó con código 0. Estado final:

- Políticas de `business_settings`: `business_settings_select_own_business` (`authenticated`, SELECT), `business_settings_select_active_business_public` (`anon, authenticated`, SELECT) y la política de actualización `business_settings_update_owner_manager`, que ya coincidía y se conservó.
- Desaparecen `Permitir lectura a miembros del negocio` y `Permitir actualización a owners y managers`.
- `order_events_select_own_business` queda en USING y `order_events_insert_own_business` en WITH CHECK, ambas con la forma `business_id = (SELECT p.business_id ...)`.
- `create_default_business_settings()` queda `SECURITY DEFINER` con `search_path=public`. `anon` y `authenticated` conservan `EXECUTE`.
- Negocios 4 y pedidos 78, antes y después.

Luego se registró `20260917210151` como `applied` solo en el ledger desechable.

## 4. Compatibilidad de los datos actuales

Agregados sobre la copia, antes de las 84 migraciones: 78 pedidos, 0 con `total_price` nulo, 0 con teléfono nulo, 0 con fecha nula, 0 con método nulo, 70 `completed`, 8 `cancelled`, 2 filas de `business_settings`, 0 tablas `finance%`.

Esos agregados cumplen las comprobaciones de `20260926010000` y `20260926017000` (pedidos itemizados con total) y de `20261004010000` (teléfono, fecha y método presentes, así que el check nativo no rechaza filas históricas).

La cadena se aplicó en la copia desechable:

| Tanda | Resultado en la copia | Conteos |
|---|---|---|
| Finanzas, 33 archivos, `20260926010000`–`20261002103000` | `db push` terminó sin error | 4 negocios, 78 pedidos, 78 `itemized`, 0 `order_financials`, 0 `finance_accounts`, sin esquema `commercial` |
| M2/M3, 4 archivos, `20261003010000`–`20261004010000` | `db push` terminó sin error | 4 y 78. `orders.phone` pasa a nullable. `commercial` sigue ausente |
| Commercial Core, 45 archivos, `20261008215314`–`20261016120000` | `db push` terminó sin error | 4 y 78. El esquema `commercial` existe |
| PHASE-06, `20261016165136` y `20261016182000` | El dry-run de la CLI listó solo esos dos archivos. El SQL se aplicó con `psql` dentro del contenedor y terminó en 0 | 4 y 78. Existe `privacy_requests_one_open_idx`. `commercial.notification_preferences` tiene `FORCE RLS` |

`order_financials` y `finance_accounts` quedan en 0 filas. El esquema acepta los 78 pedidos históricos y no les crea contratos, cuentas ni movimientos. Eso es compatible con la migración y deja la operación financiera vacía hasta un alta posterior.

`20261011022100` reemplaza `categories_assign_append_position` y consulta `commercial.onboarding_grants`. En la copia eso ocurre después de existir el esquema `commercial`. No debe adelantarse a la tanda 3.

`20261009020527_commercial_phase03_separation.sql` sigue vacío. El cuerpo está en `20261009020618` y se aplicó en la misma tanda.

## 5. Ejecución gradual

`db push` y `migration up` no aceptan un rango. Sobre el repositorio completo, después de alinear el ledger, el dry-run lista las 84. La forma probada de cortar una tanda es un directorio de trabajo que contenga todas las versiones ya registradas en el ledger y solo los archivos de la tanda siguiente. Si falta una versión que ya está en el ledger, la CLI repite `DbPushMissingLocalError`.

El directorio de prueba, fuera de Git, fue `legacy-backups\OrderOps\recon-validate-cli`. Cada dry-run listó únicamente la tanda añadida: 33, luego 4, luego 45, luego 2.

Comandos para la etapa autorizada. Sustituir la URL por la de Cloud solo en esa etapa. En la prueba se usó la base desechable y `--skip-vault`.

Preparación, una vez, contra Cloud y solo con autorización:

```text
npx --yes supabase@2.120.0 migration repair --status applied --linked --project-ref pkrsedmwxekbhlohhqds <52 versiones locales hasta 20260917210150>
npx --yes supabase@2.120.0 migration repair --status reverted --linked --project-ref pkrsedmwxekbhlohhqds 20260713125751 20260716224206 20260717010503 20260717020549 20260717034117 20260717043403 20260717162941 20260909070121 20260909190021 20260910014445 20260910040100 20260915215741 20260916195024 20260917212712
```

La adaptación puede ir en el primer `db push` si su archivo está en el directorio y su versión no está marcada `applied`. En la prueba se aplicó y se registró antes de las tandas.

Cada tanda, desde un workdir que ya incluye el historial aplicado y solo el corte nuevo:

```text
npx --yes supabase@2.120.0 db push --dry-run --skip-vault --linked --project-ref pkrsedmwxekbhlohhqds --workdir <directorio-de-la-tanda>
npx --yes supabase@2.120.0 db push --skip-vault --linked --project-ref pkrsedmwxekbhlohhqds --workdir <directorio-de-la-tanda>
```

| Tanda | Archivos | Depende de | Dry-run observado |
|---|---|---|---|
| 1. Finanzas | `20260926010000` … `20261002103000` (33) | Ledger de las 52 y adaptación | Solo esos 33 |
| 2. M2/M3 | `20261003010000`, `20261003011000`, `20261003012000`, `20261004010000` | Tanda 1 | Solo esos 4 |
| 3. Commercial Core | `20261008215314` … `20261016120000` (45) | Tanda 2 para el orden; el esquema `commercial` no existe antes | Solo esos 45 |
| 4. PHASE-06 | `20261016165136`, `20261016182000` | Tanda 3 | Solo esos 2 |

Verificación después de cada tanda: `businesses = 4`, `orders = 78`, y el dry-run de la tanda siguiente no incluye archivos de la anterior. Después de la tanda 1, `commercial` debe seguir ausente y los 78 pedidos en `itemized`. Después de la tanda 3 existe el esquema `commercial`. Después de la tanda 4 existe `privacy_requests_one_open_idx`.

Parar si el dry-run incluye un archivo fuera de la tanda, si el ref no es `pkrsedmwxekbhlohhqds`, si los conteos cambian, si el SHA-256 del manifiesto no coincide, o si una migración falla a mitad de tanda.

Recuperación: no hay down. `migration repair --status reverted` solo borra la fila del ledger y deja el esquema como esté. Si una tanda falla, no lanzar la siguiente. La recuperación del proyecto es restaurar el respaldo verificado en un destino nuevo o, con autorización aparte, sobre una base vacía. No restaurar encima de la QA ni de la base principal local. Los archivos del respaldo permanecen en `legacy-backups\OrderOps`.

## 6. Limitaciones pendientes

- Cloud no se volvió a consultar en esta tarea. La garantía de que el ledger remoto sigue en 14 filas es que ningún comando de escritura usó `--linked` ni `--project-ref`; todos los cambios de ledger ocurrieron en `127.0.0.1:56942`.
- La copia no reproduce Vault, la publicación Realtime, los binarios de Storage ni los roles administrados de Supabase. Esas piezas quedan sin verificar como comportamiento de plataforma.
- PHASE-06 quedó aplicada en la copia por `psql`, después de que el dry-run de la CLI listara solo sus dos archivos. Su fila de ledger no la insertó `db push`.
- Los 78 pedidos no reciben filas financieras. El corte deja las tablas de finanzas vacías.
- `reverted` borra historia. Hay que hacerlo solo después de confirmar el respaldo y solo sobre las 14 versiones remotas.
- La migración de adaptación no está en un commit. Un `db push` contra el repositorio completo, sin workdir de tanda, aplicaría las 84 pendientes de una vez.
- El directorio de tandas `recon-validate-cli` se eliminó al cerrar la prueba. El respaldo de los cinco archivos no se tocó. Para repetir una tanda hay que reconstruir ese directorio con el historial ya aplicado y solo el corte siguiente.
