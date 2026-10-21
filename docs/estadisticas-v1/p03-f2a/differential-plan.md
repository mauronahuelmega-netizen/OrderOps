# Pruebas preparadas para aplicación aislada posterior

differential.sql es un runner preparado, **no ejecutado**, sin DDL propio. Debe concatenarse dentro de una transacción de fixtures sintéticos autorizada, tras gate y preparación como rol de setup. Nunca ejecutarlo sobre pedidos existentes/reales ni generar contextos desde claims del cliente. Requiere cohort no vacío y candidate instalado. Mantener token privado en runtime, no documentos.

El setup debe fijar statistics.f2a.synthetic_actor_ids como uuid[] de la lista explícita de credenciales sintéticas ya verificada contra el proyecto; el runner no descubre todos los super_admin del entorno. Este contexto es del arnés psql autorizado, nunca un mecanismo de autorización de aplicación. p03-f2a-decode.verify.ts está preparado para validar pares exportados y rechazar diferencias/tenant incorrecto; en F.2A se ejecutó solo --fixtures, que no prueba SQL candidato.

Para cada fixture, compara una sola SELECT de original public RPC, candidate, original base y base_candidate. Exige JSONB completo exacto, incluyendo arrays, cifras textuales, metadatos, series, calidad/cobertura y cursores. Mismo STABLE snapshot y statement_timestamp; no excluir asOf ni ordenar arrays para simular igualdad. El cursor se toma del original y se usa en ambos; requestKey debe mantenerse. Configuración requerida y errores se comparan aparte. El runner cubre ocho períodos, dos sorts, first/next page, actores de ambos negocios y permisos de los nuevos helpers. Espera 42501 en roles denegados y falta de perfil; un timeout u otro error no cuenta como denegación correcta.

| Cohorte/estado | Preparación sintética futura | Evidencia exigida |
|---|---|---|
| Exacta y vacía | F.1 DML fijo con N=50 primero; cohort vacío en runner separado autorizado | Igualdad completa; cifras/JSON/cursor/decoders. |
| Reconciliación parcial | Shapes F.1: evidencia faltante en fracción, agreed_total conocido | NULL, razones y cobertura iguales; no distribuir diferencia ni usar gross como ventas. |
| Descuento/ajuste/envío | Escritores financieros existentes autorizados para fixtures, ajustes explícitos y cambio post-completion | Igualdad de calidad y pendingAgreedTotal, no reinterpretar unsupported breakdown. |
| Composición | Main/upsells/modifiers, identidad conocida/desconocida/reemplazada, parent inválido solo si schema admite | Unidades principales, net_amount y digest iguales; errores admitidos y motivos preservados. |
| Ciclos | Captura real completed→pending→completed; cancel; duplicación | Un ciclo activo; mismas invalidaciones/facts; writer intacto. |
| Jornadas/series | Sesiones nocturnas/varias por día, parcial current/previous, fuera de sesión, exactitud micros | Mismas claves, slices, inclusividad, ≤200 y pertenencia única. |
| DST/zonas | Fábrica temporal sintética explícita basada en pruebas P03-B, nunca backfill inferido | Fold/gap neutralidad, duración y motivos iguales. |
| Históricos sin fecha | Fixtures declarados sin evidencia fiable, sin fabricar asociaciones | Coverage global idéntica y comparación excluida. |
| Cursor/calidad | Sort units/amount, tie labels/identidades, page offsets, revisión cambiada, invalid/future asOf | Igualdad exacta de arrays y SQLSTATE; stale cursor no pasa. |
| Seguridad | Seis roles/ambos tenants, helpers directos, p_cursor manipulado, perfil ausente | 42501/no datos extranjeros; ACL no se interpreta como rol autorizado. |
| NULL/desconocidos | Verificar primero NOT NULL/check reales del perfil; prueba lógica del guard en variable | No quitar constraints ni insertar estados prohibidos para conseguir prueba live. Si el destino admite esos estados, revisión del delta de seguridad obligatoria. |

## Concurrencia preparada

En F.2B, tras pruebas seriales: lector repeatable-read con SELECT pareado mientras un escritor sintético de otra conexión completa/reabre/cancela/ajusta. Ambos resultados deben pertenecer al mismo snapshot; no esperar que una transacción repeatable-read vea un commit nuevo. Caso READ COMMITTED: comparar dentro de la misma sentencia, después nueva sentencia para comprobar cambio. lock_timeout 3s y statement_timeout 15s, dos lectores como máximo inicialmente, sin generador de estrés. Verificar rollback, cardinalidad activa y deadlocks sin tocar contenedores/recursos ajenos. Preparar agenda exacta de escritor/lector antes de pedir su ejecución; no se ejecutó concurrencia en F.2A.

## Decoders y salida

Tras una SELECT pareada exitosa, exportar solo respuesta original/candidate sintética desde esa misma sentencia y ejecutar decodeStatisticsResponse/decodeStatisticsSeriesResponse existentes para el businessId verificado. No modificar decoders para admitir campos cambiados. Errores SQL abortan/rollback; el wrapper humano no debe ocultarlos. Capturar diferencias por JSON path sin ignorar campos y conservar el par para revisión.

Runner y matriz no constituyen cobertura ejecutada de todos los escenarios. El futuro gate exige ejecutar cada cohorte y el runner después de cada transición, además de regresión temporal autorizada. Las fixtures históricas P03-B contienen DDL temporal; no ejecutarlas automáticamente como parte de instalar esta migración. Su adaptación/revisión y autorización de tests será concreta en F.2B.
