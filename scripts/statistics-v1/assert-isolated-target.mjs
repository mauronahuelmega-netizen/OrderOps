/** Read-only identity gate. Does not start, migrate, seed, stop or reset anything. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('./isolated-environment.mjs', import.meta.url));
const result = spawnSync(process.execPath, [script, 'verify'], { stdio: 'inherit', timeout: 180000 });
process.exit(result.status ?? 1);
