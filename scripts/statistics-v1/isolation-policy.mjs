import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const BASE_COMMIT = '0e430b08342b638b02392927ed560ea5e0950403';
export const PORTS = [56320, 56321, 56322, 56323, 56324, 56327, 56329, 8087, 3037];
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export function validateSigningKeys(keys) {
  assert.equal(keys.length, 1);
  const key = keys[0];
  assert.equal(key.kty, 'EC');
  assert.equal(key.crv, 'P-256');
  assert.equal(key.alg, 'ES256');
  assert.equal(key.use, 'sig');
  assert.match(key.kid, /^[a-f0-9-]{36}$/);
  assert.deepEqual(key.key_ops, ['sign', 'verify']);
  assert.ok(key.d && key.x && key.y, 'Exclusive private signing key missing');
}

export function validateConfig(config, projectId) {
  const values = {};
  let section = '';
  for (const raw of config.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('[')) { section = line.slice(1, -1); continue; }
    const match = line.match(/^([a-z_]+)\s*=\s*(.+)$/);
    assert.ok(match, 'Unsupported config syntax');
    const key = `${section ? section + '.' : ''}${match[1]}`;
    assert.ok(!(key in values), 'Duplicate config key');
    values[key] = match[2];
  }
  assert.equal(values.project_id, `"${projectId}"`);
  for (const [key, port] of [['api.port', 56321], ['db.port', 56322], ['db.shadow_port', 56320], ['studio.port', 56323], ['inbucket.port', 56324], ['analytics.port', 56327], ['db.pooler.port', 56329], ['edge_runtime.inspector_port', 8087]]) assert.equal(values[key], String(port));
  assert.equal(values['db.major_version'], '17');
  for (const s of ['db.migrations', 'db.seed', 'db.pooler', 'realtime', 'studio', 'inbucket', 'analytics', 'edge_runtime']) assert.equal(values[`${s}.enabled`], 'false');
  assert.ok(['false', 'true'].includes(values['storage.enabled']), 'Storage configuration missing');
  assert.equal(values['db.seed.sql_paths'], '[]');
  assert.equal(values['auth.site_url'], '"http://127.0.0.1:3037"');
  assert.equal(values['auth.signing_keys_path'], '"./signing_keys.json"');
  assert.ok(!Object.keys(values).some(k => /smtp|vault|s3|external|third_party|network_id/.test(k)), 'External configuration is not allowed');
  const allowed = new Set(['project_id', 'api.enabled', 'api.port', 'api.schemas', 'api.extra_search_path', 'api.max_rows', 'db.port', 'db.shadow_port', 'db.major_version', 'db.pooler.enabled', 'db.pooler.port', 'db.migrations.enabled', 'db.migrations.schema_paths', 'db.seed.enabled', 'db.seed.sql_paths', 'realtime.enabled', 'studio.enabled', 'studio.port', 'studio.api_url', 'inbucket.enabled', 'inbucket.port', 'storage.enabled', 'auth.enabled', 'auth.site_url', 'auth.additional_redirect_urls', 'auth.jwt_expiry', 'auth.signing_keys_path', 'auth.enable_signup', 'auth.enable_anonymous_sign_ins', 'auth.minimum_password_length', 'auth.email.enable_signup', 'auth.email.double_confirm_changes', 'auth.email.enable_confirmations', 'edge_runtime.enabled', 'edge_runtime.inspector_port', 'analytics.enabled', 'analytics.port']);
  assert.ok(Object.keys(values).every(k => allowed.has(k)), 'Unknown config keys are not allowed');
  assert.equal(values['auth.additional_redirect_urls'], '[]');
}

export function validateManifest(m, runtime) {
  assert.equal(m.phase, '01');
  assert.equal(m.baseCommit, BASE_COMMIT);
  assert.equal(m.runtime, runtime);
  assert.match(m.projectId, /^orderops-statistics-v1-test-[a-f0-9]{12}$/);
  assert.match(m.token, /^[a-f0-9]{64}$/);
  assert.deepEqual(m.ports, PORTS);
  assert.ok(m.migrations.length > 0);
  const versions = new Set();
  for (const file of m.migrations) {
    assert.match(file.name, /^\d{14}_[a-zA-Z0-9_]+\.sql$/);
    assert.match(file.sha256, /^[a-f0-9]{64}$/);
    const version = file.name.slice(0, 14);
    assert.ok(!versions.has(version), 'Duplicate migration version');
    versions.add(version);
  }
}

export function validateResources(m, containers, volumes, network) {
  assert.ok(containers.length >= 4, 'Incomplete stack');
  const prefix = 'supabase_';
  const ids = new Set(containers.map(c => c.Id));
  assert.equal(ids.size, containers.length);
  assert.equal(network.Name, `supabase_network_${m.projectId}`);
  assert.equal(network.Labels?.['com.supabase.cli.project'], m.projectId);
  const volumeByName = new Map(volumes.map(v => [v.Name, v]));
  for (const c of containers) {
    assert.ok(c.Name.startsWith(`/${prefix}`) && c.Name.endsWith(`_${m.projectId}`));
    assert.equal(c.Config.Labels?.['com.supabase.cli.project'], m.projectId);
    assert.ok(c.State.Running, 'Container not running');
    if (c.State.Health) assert.equal(c.State.Health.Status, 'healthy');
    assert.deepEqual(Object.keys(c.NetworkSettings.Networks), [network.Name]);
    for (const bindings of Object.values(c.HostConfig.PortBindings ?? {})) {
      for (const b of bindings ?? []) {
        assert.ok(m.ports.includes(Number(b.HostPort)), 'Unexpected published port');
      }
    }
    for (const mount of c.Mounts ?? []) {
      assert.equal(mount.Type, 'volume', 'Bind/anonymous resource not permitted');
      assert.ok(mount.Name.endsWith(`_${m.projectId}`));
      assert.equal(volumeByName.get(mount.Name)?.Labels?.['com.supabase.cli.project'], m.projectId);
    }
  }
  const db = containers.find(c => c.Name === `/supabase_db_${m.projectId}`);
  const api = containers.find(c => c.Name === `/supabase_kong_${m.projectId}`);
  assert.ok(db && api, 'DB/API missing');
  assert.ok((db.HostConfig.PortBindings['5432/tcp'] ?? []).some(b => b.HostPort === '56322'));
  assert.ok((api.HostConfig.PortBindings['8000/tcp'] ?? []).some(b => b.HostPort === '56321'));
  assert.ok(containers.some(c => c.Name === `/supabase_auth_${m.projectId}`));
  assert.ok(containers.some(c => c.Name === `/supabase_rest_${m.projectId}`));
  return { containerIds: containers.map(c => c.Id).sort(), volumeNames: volumes.map(v => v.Name).sort(), networkId: network.Id };
}

export function validateEndpoints(status) {
  for (const [key, expected] of [['API_URL', 56321], ['DB_URL', 56322]]) {
    const url = new URL(status[key]);
    assert.equal(url.hostname, '127.0.0.1');
    assert.equal(Number(url.port), expected);
  }
}
