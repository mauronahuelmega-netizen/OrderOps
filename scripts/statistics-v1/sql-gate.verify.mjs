/** Test the fail-closed entry point without Docker or a database connection. */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
assert.equal(existsSync(fileURLToPath(new URL('../../supabase/statistics-v1-test/.runtime/sql-review-approval.local.json',import.meta.url))),false,'Do not run this negative test after approval is recorded');
const result=spawnSync(process.execPath,[fileURLToPath(new URL('./sql-approved-tests.mjs',import.meta.url)),'unit'],{encoding:'utf8',timeout:10000});
assert.ok(result.status!==0);
assert.ok(result.stderr.includes('ENOENT') && result.stderr.includes('sql-review-approval.local.json'));
assert.ok(!result.stdout.includes('verified'));
console.log('PASS: write-test entry point rejects missing approval before the Docker gate or SQL. No database calls.');
