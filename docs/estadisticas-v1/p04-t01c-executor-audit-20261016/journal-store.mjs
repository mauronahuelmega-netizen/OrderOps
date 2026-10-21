// Local durable intent log. Metadata/hash-only; no Docker connection, subprocess or automatic recovery.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {randomBytes} from 'node:crypto';import assert from 'node:assert/strict';
import {assertIssuedRequest} from './request-codec.mjs';import {sha} from './filesystem.mjs';import {verifyJournal} from './journal.mjs';
const PROJECT='orderops-statistics-v1-test-74718de66a41';const tickets=new WeakMap();
const requestHash=r=>sha(Buffer.from(JSON.stringify({method:r.method,path:r.path,bodyHash:r.bodyHash,expectedStatus:r.expectedStatus})));
export class DurableIntentStore {
 #fd;#records=[];#broken=false;#simulation;#fault;#file;
 constructor({simulation=true,fault=null}={}){
  assert.equal(typeof simulation,'boolean');assert.ok([null,'before_write','after_write','after_fsync'].includes(fault));assert.ok(simulation||fault===null);this.#simulation=simulation;this.#fault=fault;
  const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');assert.equal(path.basename(repo),'OrderOps-Estadisticas');
  const parent=simulation?path.join(repo,'docs/estadisticas-v1/p04-t01c-executor-audit-20261016/journal-fixtures'):path.join(repo,'supabase/statistics-v1-test/.runtime/loopback-bundles');
  for(let p=path.dirname(parent);;p=path.dirname(p)){if(fs.existsSync(p))assert.ok(!fs.lstatSync(p).isSymbolicLink());if(p===repo)break;}
  fs.mkdirSync(parent,{recursive:true});assert.ok(!fs.lstatSync(parent).isSymbolicLink());
  this.#file=path.join(parent,'intent-'+Date.now()+'-'+randomBytes(6).toString('hex')+'.jsonl');this.#fd=fs.openSync(this.#file,'wx');
 }
 intent(request,stage){assert.ok(!this.#broken);assertIssuedRequest(request,{allowSimulation:this.#simulation});assert.ok(/^(preflight|stop_(db|kong)|recapture_(db|kong)|rename_(db|kong)|detach_(db|kong)|create_(db|kong)|restore_(db|kong)|start_(db|kong)|postcheck|rollback_stop_(db|kong))$/.test(stage));
  const event={seq:this.#records.length,at:new Date().toISOString(),projectId:PROJECT,simulation:this.#simulation,stage,status:'INTENT',previousHash:this.#records.at(-1)?.hash??null,requestHash:requestHash(request)};event.hash=sha(Buffer.from(JSON.stringify(event)));
  try{verifyJournal([...this.#records,event]);if(this.#fault==='before_write')throw Error();const data=Buffer.from(JSON.stringify(event)+'\n');let written=0;while(written<data.length){const n=fs.writeSync(this.#fd,data,written,data.length-written);assert.ok(n>0);written+=n;}if(this.#fault==='after_write')throw Error();fs.fsyncSync(this.#fd);if(this.#fault==='after_fsync')throw Error();this.#records.push(event);const ticket=Object.freeze({seq:event.seq,headHash:event.hash});tickets.set(ticket,{requestHash:event.requestHash,consumed:false,simulation:this.#simulation,durable:true});return {ticket,receipt:{headHash:event.hash,seq:event.seq,fsyncCompleted:true,simulation:this.#simulation}};
  }catch{this.#broken=true;throw new Error('DURABLE_INTENT_FAILED_HALT_NO_ENGINE_REQUEST');}
 }
 close(){if(this.#fd!==null){fs.closeSync(this.#fd);this.#fd=null;}return {path:this.#file,records:this.#records.length,headHash:this.#records.at(-1)?.hash??null,broken:this.#broken,simulation:this.#simulation};}
}
export function consumeIntentTicket(ticket,request,{allowSimulation=false}={}){const t=tickets.get(ticket);assert.ok(t&&t.durable&&!t.consumed);assert.ok(allowSimulation||!t.simulation);assert.equal(t.requestHash,requestHash(request));t.consumed=true;return true;}
