// Public metadata/hash pins only; no secret contents.
export const APPROVED = {
  "projectId": "orderops-statistics-v1-test-74718de66a41",
  "targets": {
    "db": {
      "kind": "db",
      "id": "592f44984962a26c6552ccb02937d56385a8db008eb8e7a27e8be2d932f77bd1",
      "name": "/supabase_db_orderops-statistics-v1-test-74718de66a41",
      "image": "sha256:4255b662ba3d774105cb34f623e410a3d7a860b68408ac6810f7e7e4b9781d5a",
      "payloadSha256": "8ae80d0a2a32ff16da6ae10edc869e9f01b435d6ae336a06c1c04664d77f1a60",
      "configHash": "725d8325e92cf268d062b14c1fe4d109d8fdec02f05517bc598350a8ee9cdbb5",
      "hostHash": "430a68d71715d3191e9837d68efe1f9873774a20304f65917e5726462de95bff"
    },
    "kong": {
      "kind": "kong",
      "id": "313f159d75515e52b874369ace5b6f540a9bac833d2f5d644a8639e1a5b34e63",
      "name": "/supabase_kong_orderops-statistics-v1-test-74718de66a41",
      "image": "sha256:1b53405d8680a09d6f44494b7990bf7da2ea43f84a258c59717d4539abf09f6d",
      "payloadSha256": "8c1bdda35730b04c3aa01318670754157792a4ac770f8c683d899285d3d930f6",
      "configHash": "5179614679dee6d4663bbbf9f13674309cf440e216055ae230bbc7582fb269d1",
      "hostHash": "a49e0db8965b760f09c812533310c1b9b761cabbfea7f9d4a0b2f8090020f375"
    }
  },
  "files": {
    "db": [
      {
        "path": "/etc/postgresql-custom/pgsodium_root.key",
        "uid": 0,
        "gid": 0,
        "mode": 420,
        "contentHash": "0f0a54e1402112b4e6435af6b243389d3e93898760492b904c9e25d1f467946c",
        "archiveHash": "3c491b98b46917319e4eff0d40764a7b7d5b70275d75af235912bc442a1baab6"
      },
      {
        "path": "/etc/postgresql.schema.sql",
        "uid": 0,
        "gid": 0,
        "mode": 420,
        "contentHash": "6a733d0e55a1fefdaf87d782d461d8e697289de21133f6cf22d0a3af44b8fbd9",
        "archiveHash": "7a28789e48c4ff609614cea0fa0b4a6986d6a70a1d81a5c739249680cce3afe3"
      },
      {
        "path": "/tmp/orderops-estadisticas-recovered.dump",
        "uid": 0,
        "gid": 0,
        "mode": 420,
        "contentHash": "b48f1ed8f4f6a6a75f946a2a55b388f88f20c6d05cc48fecf42cd166af1eecdc",
        "archiveHash": "650c0c17d3f1abeb46f4f344a458539705705fe7e8a869e90cc5b288a29d2d32"
      },
      {
        "path": "/etc/postgresql/postgresql.conf",
        "uid": 101,
        "gid": 102,
        "mode": 420,
        "contentHash": "b2b55146de9e4050ea39016b89aaba133a0235b2fb6303096c3bba27d1e5b444",
        "archiveHash": "72a1cef12368bdc0c484307e3e26e3bbb843026923d58a2c086d8bfd302c8e6f"
      }
    ],
    "kong": [
      {
        "path": "/home/kong/custom_nginx.template",
        "uid": 100,
        "gid": 65533,
        "mode": 420,
        "contentHash": "9bfdd671361d40816ea8c7a98d27a8ec4ff6d993ffd3f83ed39259e543bff1db",
        "archiveHash": "1cd21826c8851db4e2a690b991ab81c08038740ace1e70ecc2ea5b1e6d69314e"
      },
      {
        "path": "/home/kong/kong.yml",
        "uid": 100,
        "gid": 65533,
        "mode": 420,
        "contentHash": "04889a9a284f7923062f06ddc3e64509e100d11adfc44aee29adb3d7b65a47f9",
        "archiveHash": "6b18e851555282ba1d58461eac684fe81da480405f7fe21759b307e47099b8ad"
      },
      {
        "path": "/home/kong/localhost.crt",
        "uid": 100,
        "gid": 65533,
        "mode": 420,
        "contentHash": "9149c59a707da42289d9a0c7cf574194c92efbb449a3b4c840dc0f966acf7152",
        "archiveHash": "9170b613a3e478a86bcdcca2264d7d9e7decebfe2f8c5d05d7a53a48c031cb6a"
      },
      {
        "path": "/home/kong/localhost.key",
        "uid": 100,
        "gid": 65533,
        "mode": 420,
        "contentHash": "9629d3cc8e377aa58ac8b5cc5192a166d1944448718b9a3847bdb553e4fc3b23",
        "archiveHash": "de5c9764f49722d9cbcadd611bfe6c02caa1d245beb63abd32b3951254f79863"
      },
      {
        "path": "/usr/local/kong/.kong_env",
        "uid": 100,
        "gid": 65533,
        "mode": 416,
        "contentHash": "fe55d1fe3541cf7792378f843c8cc1a7edc6153c049538267a895a45963c6269",
        "archiveHash": "9b478b4cec2aa6994ffed261a438fc2d5f8734481a1df77115902cb68f7b8893"
      },
      {
        "path": "/usr/local/kong/nginx-kong-stream.conf",
        "uid": 100,
        "gid": 65533,
        "mode": 420,
        "contentHash": "ea926f8e51531e85d643f3dd3ef0d103e9af2b0ec2e6a2be65cf6b57dcf4b3bc",
        "archiveHash": "0cf1b69f52aed468375a262dc7f4daf2356254f6603cee6f966db62e3a89c7c9"
      },
      {
        "path": "/usr/local/kong/nginx-kong.conf",
        "uid": 100,
        "gid": 65533,
        "mode": 420,
        "contentHash": "1c99fd6c9bafdafd430de2f80accd5984e78db5860478fb6feee9c9be9453dcd",
        "archiveHash": "647583fca91b9b5de18f3c94384f3f318d5c3063842440596aeb1f3d473299c1"
      },
      {
        "path": "/usr/local/kong/nginx.conf",
        "uid": 100,
        "gid": 65533,
        "mode": 420,
        "contentHash": "db105998f00d13ad375abe0be01256558820f525f35f08edb00d38791f8e205c",
        "archiveHash": "b0c9d19ba7554504829bd0ff4315c675e246419e9ef938797c12f3ae56cc9be4"
      },
      {
        "path": "/usr/local/kong/ssl/admin-kong-default-ecdsa.crt",
        "uid": 100,
        "gid": 65533,
        "mode": 420,
        "contentHash": "054030998636298392a79e0c21d34d1ff3e9bb2c69c9a9b4431b347f9644e090",
        "archiveHash": "8eca2db7f464c0aa23a40800f71e257c6f755a6091b1426689086a5bf9e45dae"
      },
      {
        "path": "/usr/local/kong/ssl/admin-kong-default-ecdsa.key",
        "uid": 100,
        "gid": 65533,
        "mode": 384,
        "contentHash": "524fdf9f78c884de1290f79bdf3ce3ac4542eb5953dc9796cd9d54b7aaa5a501",
        "archiveHash": "d232dad09b86cba9270e16421239eb653a0e39f0a1774827d5b151752eb88f59"
      },
      {
        "path": "/usr/local/kong/ssl/admin-kong-default.crt",
        "uid": 100,
        "gid": 65533,
        "mode": 420,
        "contentHash": "ade5be24c5d8d3e585248b3267e857db20f09e958f503cb7c6c7c78d59ae4b69",
        "archiveHash": "0de96744779eeb88869875bc63d670615938e837a78c46c8dda130872801a763"
      },
      {
        "path": "/usr/local/kong/ssl/admin-kong-default.key",
        "uid": 100,
        "gid": 65533,
        "mode": 384,
        "contentHash": "73b742e346d850c695de0b09309e5fba270c3ce42a740e0588b778e27d569167",
        "archiveHash": "2fd8dc8d3df45586b4ea5b6905b86aab8a8553d1d2ef6c127ef6d22bde4108c5"
      },
      {
        "path": "/usr/local/kong/ssl/ffdhe2048.pem",
        "uid": 100,
        "gid": 65533,
        "mode": 420,
        "contentHash": "268df7ee0f876785aff68dcb1c1e5bbe1a753cc0c76eb338cf163f6819ff8944",
        "archiveHash": "f10be7cb4f649ff52262226e78be3ec74820fda779bc5a34f33d00ce939c472b"
      }
    ]
  },
  "directories": {
    "db": [
      {
        "path": "/etc",
        "uid": 0,
        "gid": 0,
        "mode": 493
      },
      {
        "path": "/etc/postgresql",
        "uid": 101,
        "gid": 102,
        "mode": 493
      },
      {
        "path": "/etc/postgresql-custom",
        "uid": 101,
        "gid": 102,
        "mode": 493
      },
      {
        "path": "/run",
        "uid": 0,
        "gid": 0,
        "mode": 493
      },
      {
        "path": "/run/postgresql",
        "uid": 101,
        "gid": 102,
        "mode": 2045
      },
      {
        "path": "/tmp",
        "uid": 0,
        "gid": 0,
        "mode": 1023
      },
      {
        "path": "/var",
        "uid": 0,
        "gid": 0,
        "mode": 493
      },
      {
        "path": "/var/lib",
        "uid": 0,
        "gid": 0,
        "mode": 493
      },
      {
        "path": "/var/lib/postgresql",
        "uid": 101,
        "gid": 102,
        "mode": 493
      }
    ],
    "kong": [
      {
        "path": "/usr/local/kong/client_body_temp",
        "uid": 100,
        "gid": 65533,
        "mode": 448
      },
      {
        "path": "/usr/local/kong/fastcgi_temp",
        "uid": 100,
        "gid": 65533,
        "mode": 448
      },
      {
        "path": "/usr/local/kong/logs",
        "uid": 100,
        "gid": 65533,
        "mode": 493
      },
      {
        "path": "/usr/local/kong/pids",
        "uid": 100,
        "gid": 65533,
        "mode": 493
      },
      {
        "path": "/usr/local/kong/proxy_temp",
        "uid": 100,
        "gid": 65533,
        "mode": 448
      },
      {
        "path": "/usr/local/kong/scgi_temp",
        "uid": 100,
        "gid": 65533,
        "mode": 448
      },
      {
        "path": "/usr/local/kong/ssl",
        "uid": 100,
        "gid": 65533,
        "mode": 493
      },
      {
        "path": "/usr/local/kong/uwsgi_temp",
        "uid": 100,
        "gid": 65533,
        "mode": 448
      },
      {
        "path": "/home",
        "uid": 0,
        "gid": 0,
        "mode": 493
      },
      {
        "path": "/home/kong",
        "uid": 100,
        "gid": 65533,
        "mode": 1517
      },
      {
        "path": "/usr",
        "uid": 0,
        "gid": 0,
        "mode": 493
      },
      {
        "path": "/usr/local",
        "uid": 0,
        "gid": 0,
        "mode": 493
      },
      {
        "path": "/usr/local/kong",
        "uid": 100,
        "gid": 0,
        "mode": 509
      }
    ]
  }
};

const freezeTree = x => { if (x && typeof x === "object") { for (const child of Object.values(x)) freezeTree(child); Object.freeze(x); } };
freezeTree(APPROVED);
