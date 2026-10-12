/** Offline grammar/surface checks. Does NOT connect to a database or execute SQL. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { parse } = require('../../supabase/statistics-v1-test/.runtime/sql-tools/node_modules/pgsql-parser');
const dir = resolve('supabase/migrations');
export const names = readdirSync(dir).filter(x => /^2026101300[123]000_statistics_v1_.*[.]sql$/.test(x)).sort();
assert.equal(names.length, 3);
const expected = ['business_statistics_state', 'store_session_statistics_snapshots', 'order_item_statistics_snapshots', 'order_statistics_completions', 'order_statistics_completion_items'];
const tables = [], triggers = [];
let sqlBodies = 0, proceduralBodies = 0;
for (const name of names) {
  const source = readFileSync(resolve(dir, name), 'utf8');
  assert.ok(!/create\s+or\s+replace|disable\s+trigger|session_replication_role|truncate|drop\s+(table|function)/i.test(source), 'Shared replacement/destructive statement');
  const ast = await parse(source);
  for (const { stmt } of ast.stmts) {
    const kind = Object.keys(stmt)[0], value = stmt[kind];
    assert.ok(!['InsertStmt','UpdateStmt','DeleteStmt','DoStmt'].includes(kind), 'Top-level DML/backfill is forbidden');
    if (kind === 'CreateStmt') tables.push(value.relation.relname);
    if (kind === 'AlterTableStmt') assert.ok(expected.includes(value.relation.relname), 'Shared table alteration');
    if (kind === 'CreateTrigStmt') {
      assert.ok(['orders','order_items','store_sessions','order_financials'].includes(value.relation.relname));
      assert.ok(value.trigname.startsWith('statistics_v1_'));
      triggers.push(value.trigname);
    }
    if (kind === 'CreateFunctionStmt') {
      const path = value.funcname.map(x => x.String.sval);
      assert.ok(path.at(-1).startsWith('statistics_'), 'Shared function');
      const options = Object.fromEntries(value.options.map(x => [x.DefElem.defname, x.DefElem.arg]));
      const language = options.language.String.sval;
      const body = options.as.List.items[0].String.sval;
      assert.ok(!/(?:insert\s+into|update|delete\s+from)\s+public[.](?:orders|order_items|order_financials|store_sessions|products|categories|finance_audit_events)\b/i.test(body), 'Capture must never rewrite its operational sources');
      if (language === 'sql') { await parse(body); sqlBodies++; }
      else { assert.equal(language, 'plpgsql'); proceduralBodies++; }
    }
  }
  console.log(`PASS grammar/surfaces: ${name} (${ast.stmts.length} statements)`);
}
assert.deepEqual(tables, expected);
assert.equal(triggers.length, 8);
const capture = readFileSync(resolve(dir, names[1]), 'utf8');
assert.equal((capture.match(/deferrable initially deferred for each row/g) ?? []).length, 4);
assert.ok(!/for update/i.test(capture.replace(/--[^\n]*/g, '')), 'Do not add financial/item row locks');
assert.ok(capture.includes("v_agreed=v_gross and v_gross=new.total_price"));
for (const name of readdirSync('supabase/tests/statistics-v1').filter(x => x.endsWith('.sql'))) {
  const source = readFileSync(resolve('supabase/tests/statistics-v1', name), 'utf8');
  await parse(source);
  assert.ok(source.includes('statistics_test_environment.identity'), 'Each test must guard its destination');
  console.log(`PASS grammar: test ${name}`);
}
console.log(`PASS: five owned tables, eight new triggers, ${sqlBodies} SQL bodies. ${proceduralBodies} PL/pgSQL bodies NOT compiled/typechecked. No DB calls.`);
