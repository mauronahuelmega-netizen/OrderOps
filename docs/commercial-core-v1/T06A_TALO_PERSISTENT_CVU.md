# T06-A — CVU persistente de prueba en Talo Sandbox

Fecha: 17 de octubre de 2026.

Todas las solicitudes usan `https://sandbox-api.talo.com.ar`. No se crearon pagos, transferencias ni movimientos. No se tocó la base de OrderOps.

## Cliente

Un solo cliente ficticio: `Burger House QA`, identificador `orderops-qa-burger-house`, sufijo de alias `burgerqa`. Sin contacto ni datos personales.

La primera sonda creó ese cliente. Customers API no respondió `user.alias.prefix.not.set`. La cuenta no se modificó desde OrderOps.

## Resultado

`COMMERCIAL_V1_T06A_TALO_PERSISTENT_CVU: PASS`

La alta devolvió CVU y alias. Dos ejecuciones posteriores no crearon otro cliente. En cada una, una segunda lectura del listado `GET /customers/?user_id=` devolvió el mismo CVU y el mismo alias, y el listado contiene un solo cliente con ese identificador.

`GET /customers/{customer_id}` responde 404 en este sandbox. Esa ausencia no cambia el CVU leído por el listado. El CVU completo no se registra en el repositorio ni en los logs.

## Transferencia simulada

La transferencia ficticia posterior está en [T06B_TALO_TRANSFER.md](T06B_TALO_TRANSFER.md). Esta prueba no la simuló ni configuró `webhook_url`.
