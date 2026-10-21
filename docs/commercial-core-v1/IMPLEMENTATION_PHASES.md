# Fases de implementación — Commercial Core V1

Orden obligatorio. Una fase no se declara hecha con pantallas sin las pruebas de su `PHASE-0N.md`.

El detalle de tareas está en [phases/](phases/). Este archivo es el mapa de dependencias.

## Roadmap

| Fase | Nombre | Depende de | Objetivo | Salida |
| --- | --- | --- | --- | --- |
| 01 | Fundaciones y seguridad | Paquete documental | Identidad de plataforma, RLS cerrada, auditoría, outbox, programa Founder, gate local | Un comercio no lee `commercial`. Un interno sin rol no escribe. Gate rechaza host remoto. Pedidos y catálogo siguen sus verify actuales de muestra |
| 02 | Captación y CRM | 01 | Lead, dedup, pipeline, tareas, formulario | Una demo real local crea una oportunidad gestionable. Dos envíos simultáneos no duplican el comercio cuando hay match de alta confianza |
| 03 | Promotores y atribuciones | 02 | Alta, contrato, activación, claims, disputas, desvinculación | El origen se audita. Un promotor no ve a otro. Inactivo no genera claim |
| 04 | Conversión y onboarding | 03 y catálogo actual | Ganada con `businesses`, terms congelados, grant de 30 días | El promotor no cambia precios. El grant vencido no escribe |
| 05 | Economía | 04 para el setup condicionado a onboarding; el libro de cobranzas puede probarse con terms de fixture | Cobranzas manuales, comisiones nominales, liquidación, factura, transferencia simulada | Caso Founder nominal reproducible. Casos con IVA o parcial quedan bloqueados sin consumir slot |
| 06 | Consolidación local | 01–05 | Correo a Inbucket, archivo, semilla, E2E, memoria viva | E2E-01..10 verdes en local. Sin deploy |

Dentro de la fase 05, P05-T02 puede avanzar el caso nominal sin esperar `BLK-ECO-01`. No puede «desbloquear» políticas de IVA por su cuenta.

## Dependencias técnicas que fijan el orden

- Sin cuentas y RLS (01) no hay formulario público seguro (02).
- Sin oportunidades (02) no hay atribución a oportunidad (03, CC-07).
- Sin atribución confirmada no hay `conversion_terms` (04).
- Sin terms no hay obligación ni comisión (05).
- La liberación de la comisión de setup exige grants (04) y ventana (05). La comisión recurrente no espera onboarding, pero sí terms y cobranza.
- El dispatcher (06) puede existir en esqueleto desde 01; el envío a Inbucket se enciende en 06 para no mandar correo antes de tener eventos reales de punta a punta. En 01 el outbox se inserta y un test lee la fila. No hay SMTP.

## Definición de hecho de una fase

1. Tareas del `PHASE-0N.md` en `done` dentro de `PROGRESS.md`, con evidencia (comando y resultado).
2. Los tests listados en esa fase pasan en la base local del gate.
3. No hay regresión conocida sin una línea en `DECISIONS_AND_BLOCKERS.md`.
4. Las RPC nuevas rechazan al actor equivocado. Hay al menos un test que lo demuestra.
5. `DATA_MODEL.md` o `SECURITY_MATRIX.md` actualizados si el SQL se desvió.
6. `ORDEROPS_LIVING_MEMORY.md` se actualiza en la fase 06, o antes si una migración ya se aplicó en local: en ese caso la tarea que aplicó la migración agrega una entrada corta el mismo día.
7. La fase siguiente tiene sus prerrequisitos marcados.

Una afirmación del agente sin comando no cierra la tarea.

## Recuperación

Cada fase tiene un `supabase/rollbacks/commercial_phaseN_down.sql` escrito junto con la migración, no ejecutado salvo fallo de esa fase en local y sin fases posteriores aplicadas.

Si la migración quedó a medias en local: no seguir con la fase siguiente. Inspeccionar `supabase_migrations.schema_migrations`. O recuperar con el down documentado o reparar adelante con una migración nueva. No editar una migración ya registrada.

`db reset --local` borra el stack local entero. Pide confirmación humana explícita en el chat. No es el camino por defecto.

## Fuera de todas las fases

Producción, proyecto Supabase remoto, ARCA, AFIP en vivo, transferencias bancarias reales, correos a dominios que no sean el catcher local, cambios de los montos Founder.
