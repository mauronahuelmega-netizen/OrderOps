# Hashes para revisión humana — NO ejecución autorizada

- runner.proposed.mjs: `aebf2d902ac2abf4a841d4d472cafa2f4a6ad6e2e998019c1851ee31d6b25674`
- verification.proposed.psql: `61f076a61c4d4d8316afdcdabbca633b24b6bc353db040c2b1d9a6b93412720d`
- artifact-pins.json: `db9310b204b3dbe41284c778abe66d01685982d20c5246ff7035c392fd6b36fa`
- validation.mjs: `8cbcebb4c02601aa0d8b046c5ac5d9393f4d0b26ca931425f7c0db232995257c`
- trigger-catalog.select.sql: `b1fe48ac21399c6e580fb6ce956333c42100e15de446d568e25c1d0706a3d7c9`
- trigger-gate.select.sql: `34c9b84894ab9011916e46e2624d24179903287030fdfff10b04b2b21a1ddee6`
- cluster-identity.select.sql: `195cd4500b588fa9b3d8997524bbddc2554c7763ef08e26dd0f3b32a90288e37`
- targets.json: `9e9413c03e3ee515ac3e11880b28973c8074842c54b35be58c14c2fdb2704e6c`

El permiso posterior debe identificar runner, template y artifact-pins.json. Este último fija los20 archivos de ejecución/fuentes, incluyendo validator y SQL individuales. Ningún resultado offline autoriza ejecutar el modo real.
