/** Phase 01 only: prepare/start/verify/rebuild BASE schema/seed synthetic identities.
 * No Statistics migrations, shared config, remote URLs, reset, stop or cleanup commands.
 */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, realpathSync, lstatSync } from 'node:fs';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, generateKeyPairSync, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import net from 'node:net';
import { BASE_COMMIT, PORTS, sha256, validateManifest, validateConfig, validateSigningKeys, validateResources, validateEndpoints } from './isolation-policy.mjs';

const root = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '../..'));
const parent = resolve(root, 'supabase/statistics-v1-test');
const runtime = resolve(parent, '.runtime');
const statePath = resolve(runtime, 'manifest.json');
const command = process.argv[2];
assert.equal(process.argv.length, 3, 'Usage: node isolated-environment.mjs prepare|start|verify|baseline|seed|smoke|enable-storage');
assert.ok(['prepare', 'start', 'verify', 'baseline', 'seed', 'smoke', 'enable-storage'].includes(command), 'Unsupported operation');
const excluded = 'studio,postgres-meta,imgproxy,edge-runtime,logflare,vector,supavisor,realtime,mailpit';

function safePath(path) {
  const rel = relative(root, resolve(path));
  assert.ok(rel && !rel.startsWith('..') && !isAbsolute(rel));
  let current = resolve(path);
  while (current !== root) {
    if (existsSync(current)) assert.ok(!lstatSync(current).isSymbolicLink(), 'Symlink/junction is not allowed');
    current = dirname(current);
  }
}
safePath(runtime);
function run(bin, args, options = {}) {
  const result = spawnSync(bin, args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 300000, ...options });
  if (result.error || result.status !== 0) {
    // Tool output may contain generated keys. Store locally, never print it.
    if (existsSync(runtime)) writeFileSync(resolve(runtime, `${command}-failure.local.log`), `${result.stdout ?? ''}\n${result.stderr ?? ''}`);
    throw new Error(`${bin} operation failed (exit ${result.status ?? 'spawn error'}); see ignored runtime failure log`);
  }
  return result.stdout;
}
const git = (...args) => run('git', args).trim();
assert.equal(git('branch', '--show-current'), 'codex/estadisticas-v1');
assert.equal(git('rev-parse', '--show-toplevel').replaceAll('\\', '/').toLowerCase(), root.replaceAll('\\', '/').toLowerCase());
const docker = (...args) => run('docker', args);
const jsonLines = value => value.trim() ? value.trim().split(/\r?\n/).map(line => JSON.parse(line)) : [];
const inspect = (kind, names) => names.length ? JSON.parse(docker(kind, 'inspect', ...names)) : [];

function state() {
  const m = JSON.parse(readFileSync(statePath, 'utf8'));
  validateManifest(m, runtime);
  validateConfig(readFileSync(resolve(runtime, 'supabase/config.toml'), 'utf8'), m.projectId);
  assert.equal(sha256(readFileSync(resolve(runtime, 'supabase/config.toml'))), m.configHash);
  assert.equal(sha256(readFileSync(resolve(runtime, 'supabase/signing_keys.json'))), m.signingKeysHash);
  validateSigningKeys(JSON.parse(readFileSync(resolve(runtime, 'supabase/signing_keys.json'), 'utf8')));
  return m;
}
function save(m) { writeFileSync(statePath, JSON.stringify(m, null, 2)); }
function verifyFiles(m) {
  const folder = resolve(runtime, 'supabase/migrations');
  const sourceNames = git('ls-tree', '-r', '--name-only', BASE_COMMIT, '--', 'supabase/migrations').split(/\r?\n/).filter(f => f.endsWith('.sql')).map(f => f.split('/').at(-1)).sort();
  assert.deepEqual(m.migrations.map(f => f.name).sort(), sourceNames, 'Incomplete or expanded approved baseline');
  assert.deepEqual(readdirSync(folder).sort(), m.migrations.map(f => f.name).sort());
  for (const f of m.migrations) {
    safePath(resolve(folder, f.name));
    assert.equal(sha256(readFileSync(resolve(folder, f.name))), f.sha256, `Migration tampered: ${f.name}`);
    const fromGit = Buffer.from(run('git', ['show', `${BASE_COMMIT}:supabase/migrations/${f.name}`]));
    assert.equal(sha256(fromGit), f.sha256, `Migration is not from the approved base: ${f.name}`);
  }
}
async function availablePort(port) {
  await new Promise((accept, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(port, '0.0.0.0', () => server.close(accept));
  });
}
async function preflight(m) {
  const names = docker('ps', '-a', '--format', '{{.Names}}').trim().split(/\r?\n/);
  const volumes = docker('volume', 'ls', '--format', '{{.Name}}').trim().split(/\r?\n/);
  const networks = docker('network', 'ls', '--format', '{{.Name}}').trim().split(/\r?\n/);
  for (const list of [names, volumes, networks]) assert.ok(!list.some(n => n.includes(m.projectId)), 'Project resources already exist; no automatic reuse');
  for (const port of PORTS) await availablePort(port);
  verifyFiles(m);
}
function resources(m) {
  const own = jsonLines(docker('ps', '-a', '--filter', `label=com.supabase.cli.project=${m.projectId}`, '--format', '{{json .}}'));
  const containers = inspect('container', own.map(c => c.Names));
  const vols = jsonLines(docker('volume', 'ls', '--filter', `label=com.supabase.cli.project=${m.projectId}`, '--format', '{{json .}}'));
  const volumes = inspect('volume', vols.map(v => v.Name));
  const network = inspect('network', [`supabase_network_${m.projectId}`])[0];
  const identity = validateResources(m, containers, volumes, network);
  // A foreign container must not share this network or these volumes.
  const allIds = docker('ps', '-aq').trim().split(/\r?\n/).filter(Boolean);
  for (const c of inspect('container', allIds)) {
    if (identity.containerIds.includes(c.Id)) continue;
    assert.ok(!c.NetworkSettings.Networks?.[network.Name], 'Foreign container on exclusive network');
    assert.ok(!(c.Mounts ?? []).some(v => identity.volumeNames.includes(v.Name)), 'Foreign container uses exclusive volume');
  }
  if (m.resources) assert.deepEqual(identity, m.resources, 'Resource identity changed');
  return identity;
}
function sql(m, source) {
  return docker('exec', '-i', `supabase_db_${m.projectId}`, 'psql', '-X', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At', '-c', source).trim();
}
function verify(m, marker = true) {
  verifyFiles(m);
  const identity = resources(m);
  const status = JSON.parse(run('supabase', ['status', '--workdir', runtime, '-o', 'json']));
  validateEndpoints(status);
  if (marker) assert.equal(sql(m, 'BEGIN READ ONLY; SELECT token FROM statistics_test_environment.identity WHERE singleton; COMMIT;').split(/\r?\n/).filter(s => s !== 'BEGIN' && s !== 'COMMIT').join(''), m.token);
  return { identity, status };
}

if (command === 'prepare') {
  assert.ok(!existsSync(runtime), 'Runtime already exists; no overwriting');
  const files = git('ls-tree', '-r', '--name-only', BASE_COMMIT, '--', 'supabase/migrations').split(/\r?\n/).filter(f => f.endsWith('.sql'));
  const m = { phase: '01', baseCommit: BASE_COMMIT, runtime, projectId: `orderops-statistics-v1-test-${randomBytes(6).toString('hex')}`, token: randomBytes(32).toString('hex'), ports: PORTS, preparedAt: new Date().toISOString(), migrations: [] };
  mkdirSync(resolve(runtime, 'supabase/migrations'), { recursive: true });
  for (const path of files) {
    const body = run('git', ['show', `${BASE_COMMIT}:${path}`]);
    const name = path.split('/').at(-1);
    writeFileSync(resolve(runtime, 'supabase/migrations', name), body);
    m.migrations.push({ name, sha256: sha256(body) });
  }
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwk = { ...privateKey.export({ format: 'jwk' }), kid: randomUUID(), alg: 'ES256', use: 'sig', key_ops: ['sign', 'verify'], ext: true };
  validateSigningKeys([jwk]);
  writeFileSync(resolve(runtime, 'supabase/signing_keys.json'), JSON.stringify([jwk]));
  const config = readFileSync(resolve(parent, 'config.template.toml'), 'utf8').replace('__PROJECT_ID__', m.projectId);
  validateConfig(config, m.projectId);
  writeFileSync(resolve(runtime, 'supabase/config.toml'), config);
  m.configHash = sha256(config);
  m.signingKeysHash = sha256(readFileSync(resolve(runtime, 'supabase/signing_keys.json')));
  validateManifest(m, runtime);
  save(m);
  console.log(JSON.stringify({ prepared: true, projectId: m.projectId, baseMigrations: m.migrations.length, migrationsEnabled: false, seedsEnabled: false }));
} else {
  const m = state();
  if (command === 'start') {
    await preflight(m);
    console.log('Preflight passed: exclusive identity, ports free, resource names absent, approved base checksums.');
    const output = run('supabase', ['start', '--workdir', runtime, '--exclude', excluded]);
    writeFileSync(resolve(runtime, 'start.local.log'), output);
    const { identity } = verify(m, false);
    m.resources = identity;
    save(m); // Persist identity before the first custom SQL write.
    sql(m, `BEGIN; CREATE SCHEMA statistics_test_environment; REVOKE ALL ON SCHEMA statistics_test_environment FROM PUBLIC; CREATE TABLE statistics_test_environment.identity(singleton boolean PRIMARY KEY CHECK(singleton), token text NOT NULL); INSERT INTO statistics_test_environment.identity VALUES(true,'${m.token}'); COMMIT;`);
    m.startedAt = new Date().toISOString(); save(m);
    console.log(JSON.stringify({ started: true, projectId: m.projectId, containers: identity.containerIds.length, volumes: identity.volumeNames, apiPort: 56321, dbPort: 56322 }));
  } else if (command === 'enable-storage') {
    verify(m);
    const configFile = resolve(runtime, 'supabase/config.toml');
    const original = readFileSync(configFile, 'utf8');
    const enabled = original.replace('[storage]\nenabled = false', '[storage]\nenabled = true');
    assert.notEqual(enabled, original, 'Storage is already enabled');
    const oldIdentity = m.resources;
    // Stop ONLY this verified project; retain its DB volume and marker. No reset.
    run('supabase', ['stop', '--workdir', runtime]);
    writeFileSync(configFile, enabled);
    m.configHash = sha256(enabled);
    m.resourceHistory = [...(m.resourceHistory ?? []), oldIdentity];
    delete m.resources;
    save(m);
    run('supabase', ['start', '--workdir', runtime, '--exclude', excluded]);
    const { identity } = verify(m);
    for (const oldVolume of oldIdentity.volumeNames) assert.ok(identity.volumeNames.includes(oldVolume), 'Original volume lost');
    m.resources = identity;
    m.storageEnabledAt = new Date().toISOString(); save(m);
    console.log(JSON.stringify({ storageEnabled: true, projectId: m.projectId, containers: identity.containerIds.length, volumes: identity.volumeNames, originalMarkerPreserved: true }));
  } else if (command === 'verify') {
    const { identity } = verify(m);
    console.log(JSON.stringify({ verified: true, projectId: m.projectId, containers: identity.containerIds.length, volumes: identity.volumeNames, baseMigrations: m.migrations.length, startedAt: m.startedAt }));
  } else if (command === 'baseline') {
    verify(m);
    assert.ok(!m.baselineAppliedAt, 'Baseline already applied; no reset or implicit rerun');
    // Enable only the byte-checked historical files while invoking migration up.
    const configFile = resolve(runtime, 'supabase/config.toml');
    const original = readFileSync(configFile, 'utf8');
    const enabled = original.replace('[db.migrations]\nenabled = false', '[db.migrations]\nenabled = true');
    assert.notEqual(enabled, original);
    let output;
    try {
      writeFileSync(configFile, enabled);
      output = run('supabase', ['migration', 'up', '--local', '--workdir', runtime]);
    } finally { writeFileSync(configFile, original); }
    writeFileSync(resolve(runtime, 'baseline.local.log'), output);
    verify(m);
    const ledger = sql(m, 'BEGIN READ ONLY; SELECT version FROM supabase_migrations.schema_migrations ORDER BY version; COMMIT;').split(/\r?\n/).filter(s => /^\d{14}$/.test(s));
    assert.deepEqual(ledger, m.migrations.map(f => f.name.slice(0, 14)).sort());
    assert.equal(sql(m, 'BEGIN READ ONLY; SELECT count(*) FROM public.orders; COMMIT;').split(/\r?\n/)[1], '0');
    m.baselineAppliedAt = new Date().toISOString(); save(m);
    console.log(JSON.stringify({ baselineApplied: true, historicalMigrations: ledger.length, statisticsMigrations: 0 }));
  } else if (command === 'smoke') {
    const { identity, status } = verify(m);
    assert.ok(m.baselineAppliedAt && m.seededAt, 'Synthetic seed required');
    const credentials = JSON.parse(readFileSync(resolve(runtime, 'credentials.local.json'), 'utf8'));
    assert.equal(credentials.projectId, m.projectId);
    const passed = [];
    for (const user of credentials.users) {
      const response = await fetch(new URL('/auth/v1/token?grant_type=password', status.API_URL), { method: 'POST', headers: { apikey: status.ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: user.password }) });
      assert.equal(response.status, 200, 'Synthetic login failed');
      const session = await response.json();
      assert.equal(session.user.id, user.id);
      const jwt = JSON.parse(Buffer.from(session.access_token.split('.')[0], 'base64url').toString('utf8'));
      const signingKey = JSON.parse(readFileSync(resolve(runtime, 'supabase/signing_keys.json'), 'utf8'))[0];
      assert.equal(jwt.alg, 'ES256');
      assert.equal(jwt.kid, signingKey.kid, 'Token does not use exclusive signing key');
      const profileUrl = new URL('/rest/v1/profiles', status.API_URL);
      profileUrl.searchParams.set('select', 'id,business_id,role');
      profileUrl.searchParams.set('id', `eq.${user.id}`);
      const headers = { apikey: status.ANON_KEY, Authorization: `Bearer ${session.access_token}` };
      const profileResponse = await fetch(profileUrl, { headers });
      assert.equal(profileResponse.status, 200);
      const profile = await profileResponse.json();
      assert.equal(profile.length, 1);
      assert.equal(profile[0].business_id, credentials.businesses[user.business]);
      assert.equal(profile[0].role, user.role);
      if (user.role === 'owner') {
        profileUrl.searchParams.delete('id');
        profileUrl.searchParams.set('business_id', `eq.${credentials.businesses[user.business === 'a' ? 'b' : 'a']}`);
        const foreignResponse = await fetch(profileUrl, { headers });
        assert.equal(foreignResponse.status, 200);
        assert.deepEqual(await foreignResponse.json(), [], 'Foreign profiles exposed to owner');
      }
      passed.push(`${user.business}:${user.role}`);
    }
    const counts = sql(m, `BEGIN READ ONLY; SELECT json_build_object('businesses',(SELECT count(*) FROM public.businesses),'profiles',(SELECT count(*) FROM public.profiles),'orders',(SELECT count(*) FROM public.orders),'migrations',(SELECT count(*) FROM supabase_migrations.schema_migrations),'statistics_tables',(SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('order_statistics_completions','order_statistics_completion_items','order_item_statistics_snapshots','store_session_statistics_snapshots','business_statistics_state'))); COMMIT;`).split(/\r?\n/).find(s => s.startsWith('{'));
    const parsed = JSON.parse(counts);
    assert.deepEqual(parsed, { businesses: 2, profiles: 12, orders: 0, migrations: m.migrations.length, statistics_tables: 0 });
    const evidence = { verifiedAt: new Date().toISOString(), projectId: m.projectId, baseCommit: BASE_COMMIT, baseMigrations: m.migrations.length, statisticsMigrations: 0, apiPort: 56321, dbPort: 56322, resources: identity, markersMatch: true, exclusiveJwtSigning: 'ES256', configHash: m.configHash, migrationManifestHash: sha256(JSON.stringify(m.migrations)), counts: parsed, authenticatedSyntheticRoles: passed, crossTenantOwnerProfilesDenied: true, seedsEnabled: false, automaticMigrationsEnabled: false };
    writeFileSync(resolve(root, 'docs/estadisticas-v1/fase-01-evidencia.json'), JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify({ smokePassed: true, syntheticLogins: passed.length, crossTenantOwnerChecks: 2, ...parsed, statisticsMigrations: 0 }));
  } else if (command === 'seed') {
    const { status } = verify(m);
    assert.ok(m.baselineAppliedAt && !m.seededAt, 'Baseline required; fixtures are one-shot');
    const api = new URL(status.API_URL);
    const roles = ['owner', 'manager', 'admin', 'operator', 'viewer', 'super_admin'];
    const users = [];
    for (const business of ['a', 'b']) for (const role of roles) {
      const email = `statistics-${business}-${role}@example.invalid`;
      const password = randomBytes(24).toString('base64url');
      const response = await fetch(new URL('/auth/v1/admin/users', api), { method: 'POST', headers: { apikey: status.SERVICE_ROLE_KEY, Authorization: `Bearer ${status.SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, email_confirm: true }) });
      assert.equal(response.status, 200, `Synthetic Auth creation failed: ${role}`);
      const user = await response.json();
      assert.match(user.id, /^[a-f0-9-]{36}$/);
      users.push({ id: user.id, email, password, role, business });
    }
    // No fixtures for new Statistics tables/triggers are applied in Phase 01.
    const businesses = { a: randomUUID(), b: randomUUID() };
    const values = users.map(u => `('${u.id}','${businesses[u.business]}','${u.role}')`).join(',');
    sql(m, `BEGIN; INSERT INTO public.businesses(id,name,slug,whatsapp_number) VALUES ('${businesses.a}','Statistics Synthetic A','statistics-synthetic-a','0000000000'),('${businesses.b}','Statistics Synthetic B','statistics-synthetic-b','0000000000'); INSERT INTO public.profiles(id,business_id,role) VALUES ${values}; UPDATE public.business_settings SET timezone='America/Argentina/Buenos_Aires' WHERE business_id IN ('${businesses.a}','${businesses.b}'); COMMIT;`);
    writeFileSync(resolve(runtime, 'credentials.local.json'), JSON.stringify({ projectId: m.projectId, apiUrl: status.API_URL, businesses, users }, null, 2));
    m.seededAt = new Date().toISOString(); save(m);
    console.log(JSON.stringify({ seeded: true, syntheticBusinesses: 2, syntheticUsers: users.length, orders: 0, statisticsMigrations: 0 }));
  }
}
