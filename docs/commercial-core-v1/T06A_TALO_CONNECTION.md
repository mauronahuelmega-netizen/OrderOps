# T06-A — Conexión inicial con Talo Sandbox

Fecha: 17 de octubre de 2026.

CC-C19 permanece cerrado. Esta conexión no modifica el calendario, el motor económico ni Mobbex.

## Dónde van las credenciales

En la raíz del repositorio, archivo `.env.local`. Git ya lo ignora. Next.js lo carga solo en el servidor.

```
TALO_CLIENT_ID=
TALO_CLIENT_SECRET=
TALO_USER_ID=
```

No uses el chat, `.env.example` ni una variable `NEXT_PUBLIC_*`. El SDK oficial `talo-pay` lee exactamente esos tres nombres.

## Autenticación

`POST https://sandbox-api.talo.com.ar/users/{user_id}/tokens` con `client_id` y `client_secret`. El token va en `Authorization: Bearer`. El cliente se crea con `environment: "sandbox"`. El código no acepta `baseUrl` ni `production`.

La prueba de conectividad es `GET /users/{user_id}/account` a través de `talo.partners.getAccount`. No crea clientes, CVU ni pagos. No imprime el token ni el prefijo.

Comando: `npx tsx scripts/commercial-core/talo-sandbox-connection.ts`.

## Customers API y CVU persistente

Disponible en sandbox como `POST /customers/`. Antes hace falta `alias_prefix` en la cuenta. Sin ese prefijo, Talo responde `user.alias.prefix.not.set`. Se configura en el panel, Settings, Alias, o con un PATCH posterior. La documentación de Customers pide 3 a 8 caracteres alfanuméricos. El alta de un cliente pide `user_id`, `alias`, `customer_id` y `name`, y devuelve un CVU y un alias que se reutilizan. La lista es `GET /customers/?user_id=`. Esta preparación no llama a `customers.create` ni al simulador.

## Resultado de esta ejecución

`COMMERCIAL_V1_T06A_TALO_CONNECTION: BLOCKED`

`.env.local` no tiene `TALO_CLIENT_ID`, `TALO_CLIENT_SECRET` ni `TALO_USER_ID`. La autenticación no se ejecutó. `alias_prefix` queda `NOT_VERIFIED`.

Para probar el CVU persistente, después de un PASS de esta conexión, falta confirmar que `alias_prefix` está configurado y recién entonces crear un cliente de prueba. Eso no forma parte de este lote.
