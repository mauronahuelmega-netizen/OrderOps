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

La prueba de conectividad pide el token y consulta `GET /customers/?user_id=`. No crea clientes, CVU ni pagos. No imprime el token ni el prefijo. `GET /users/{user_id}/account` es un endpoint de partner. Con esta credencial directa responde 403. Ese 403 no dice si `alias_prefix` está configurado: el prefijo queda `NOT_VERIFIED`.

Comando: `npx tsx scripts/commercial-core/talo-sandbox-connection.ts`.

## Customers API y CVU persistente

Disponible en sandbox como `POST /customers/`. Antes hace falta `alias_prefix` en la cuenta. Sin ese prefijo, Talo responde `user.alias.prefix.not.set`. Se configura en el panel, Settings, Alias, o con un PATCH posterior. La documentación de Customers pide 3 a 8 caracteres alfanuméricos. El alta de un cliente pide `user_id`, `alias`, `customer_id` y `name`, y devuelve un CVU y un alias que se reutilizan. La lista es `GET /customers/?user_id=`. Esta preparación no llama a `customers.create` ni al simulador.

## Resultado de esta ejecución

`COMMERCIAL_V1_T06A_TALO_CONNECTION: PASS`

La autenticación en sandbox quedó comprobada. El listado de clientes respondió y hay 0 clientes. `alias_prefix` sigue `NOT_VERIFIED`. El 403 de `GET /users/{user_id}/account` no demuestra que el prefijo falte ni que exista.

Un CVU persistente sigue exigiendo, según la documentación de Customers API, un `alias_prefix` configurado. Esta ejecución no lo leyó y no creó clientes ni CVU.
