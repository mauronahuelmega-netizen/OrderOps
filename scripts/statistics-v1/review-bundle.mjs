/** Hash the reviewable SQL and test runners, never execute them. */
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
export function reviewBundle() {
  const paths = [
    ...readdirSync(resolve(root,'supabase/migrations')).filter(x=>/^2026101300[123]000_statistics_v1_.*[.]sql$/.test(x)).map(x=>`supabase/migrations/${x}`),
    ...readdirSync(resolve(root,'supabase/tests/statistics-v1')).filter(x=>x.endsWith('.sql')).map(x=>`supabase/tests/statistics-v1/${x}`),
    'scripts/statistics-v1/sql-approved-tests.mjs','scripts/statistics-v1/sql-static.verify.mjs','scripts/statistics-v1/review-bundle.mjs',
  ].sort();
  const files=paths.map(path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')}));
  return {files,bundleHash:createHash('sha256').update(JSON.stringify(files)).digest('hex')};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) console.log(JSON.stringify(reviewBundle(),null,2));
