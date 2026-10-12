import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BASE_COMMIT, PORTS, sha256, validateManifest, validateConfig, validateSigningKeys, validateResources, validateEndpoints } from './isolation-policy.mjs';

const projectId = 'orderops-statistics-v1-test-012345abcdef';
const m = { phase: '01', baseCommit: BASE_COMMIT, runtime: 'synthetic-root', projectId, token: 'a'.repeat(64), ports: PORTS, migrations: [{ name: '20260426214500_base.sql', sha256: sha256('synthetic') }] };
validateManifest(m, 'synthetic-root');
const signingKey = { kty: 'EC', crv: 'P-256', alg: 'ES256', use: 'sig', kid: '00000000-0000-0000-0000-000000000001', key_ops: ['sign', 'verify'], d: 'synthetic', x: 'synthetic', y: 'synthetic' };
validateSigningKeys([signingKey]);
assert.throws(() => validateSigningKeys([{ ...signingKey, key_ops: ['verify'] }]));
assert.throws(() => validateSigningKeys([{ ...signingKey, d: '' }]));
for (const patch of [{ phase: '02' }, { baseCommit: 'wrong' }, { runtime: 'foreign' }, { projectId: 'OrderOps' }, { token: 'bad' }, { ports: [54321, 54322] }, { migrations: [m.migrations[0], m.migrations[0]] }]) assert.throws(() => validateManifest({ ...m, ...patch }, 'synthetic-root'));

const config = readFileSync(new URL('../../supabase/statistics-v1-test/config.template.toml', import.meta.url), 'utf8').replace('__PROJECT_ID__', projectId);
validateConfig(config, projectId);
for (const [from, to] of [['56321', '54321'], ['56322', '54322'], ['enabled = false\nschema_paths', 'enabled = true\nschema_paths'], ['enabled = false\nsql_paths', 'enabled = true\nsql_paths'], [projectId, 'OrderOps'], ['3037', '3000']]) assert.throws(() => validateConfig(config.replace(from, to), projectId));
assert.throws(() => validateConfig(config + '\n[auth.email.smtp]\nenabled = true\n', projectId));
assert.throws(() => validateConfig(config + '\n[auth.hook.custom_access_token]\nenabled = true\nuri = "https://example.invalid"\n', projectId));
validateEndpoints({ API_URL: 'http://127.0.0.1:56321', DB_URL: 'postgresql://synthetic@127.0.0.1:56322/postgres' });
for (const url of ['http://127.0.0.1:54321', 'https://remote.supabase.co', 'http://localhost:56321']) assert.throws(() => validateEndpoints({ API_URL: url, DB_URL: 'postgresql://synthetic@127.0.0.1:56322/postgres' }));

const labels = { 'com.supabase.cli.project': projectId };
const volume = { Name: `supabase_db_${projectId}`, Labels: labels };
const network = { Id: 'synthetic-network', Name: `supabase_network_${projectId}`, Labels: labels };
const containers = ['db', 'kong', 'auth', 'rest'].map((name, i) => ({ Id: `synthetic-${i}`, Name: `/supabase_${name}_${projectId}`, Config: { Labels: labels }, State: { Running: true, Health: { Status: 'healthy' } }, HostConfig: { PortBindings: name === 'db' ? { '5432/tcp': [{ HostPort: '56322' }] } : name === 'kong' ? { '8000/tcp': [{ HostPort: '56321' }] } : {} }, NetworkSettings: { Networks: { [network.Name]: {} } }, Mounts: name === 'db' ? [{ Type: 'volume', Name: volume.Name }] : [] }));
validateResources(m, containers, [volume], network);
for (const mutate of [
  c => { c[0].Config.Labels = { 'com.supabase.cli.project': 'OrderOps' }; },
  c => { c[0].Mounts[0].Name = 'supabase_db_OrderOps'; },
  c => { c[0].Mounts[0].Type = 'bind'; },
  c => { c[0].HostConfig.PortBindings['5432/tcp'][0].HostPort = '54322'; },
  c => { c[0].NetworkSettings.Networks.foreign = {}; },
  c => { c[0].State.Health.Status = 'unhealthy'; },
  c => { c[0].State.Running = false; },
  c => { c[0].Name = '/supabase_db_OrderOps'; },
]) { const copied = structuredClone(containers); mutate(copied); assert.throws(() => validateResources(m, copied, [volume], network)); }
assert.throws(() => validateResources(m, containers.slice(0, 3), [volume], network));
assert.throws(() => validateResources(m, containers, [{ ...volume, Labels: {} }], network));
console.log('PASS: identity/config/signing/endpoints and adversarial rejection scenarios; no Docker/DB writes.');
