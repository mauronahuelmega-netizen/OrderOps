// Test-only preloader: any attempted process/network access fails before I/O.
import net from 'node:net';import http from 'node:http';import https from 'node:https';import dns from 'node:dns';import child from 'node:child_process';import {syncBuiltinESMExports} from 'node:module';
const deny=()=>{throw new Error('OFFLINE_TRIPWIRE');};
net.Socket.prototype.connect=deny;net.connect=deny;net.createConnection=deny;
http.request=deny;http.get=deny;https.request=deny;https.get=deny;dns.lookup=deny;dns.resolve=deny;
for(const key of ['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork'])child[key]=deny;
globalThis.fetch=deny;syncBuiltinESMExports();
