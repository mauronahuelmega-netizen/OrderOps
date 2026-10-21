// Pure future-launcher policy. No start/restart/CLI command or repair is executed.
import assert from 'node:assert/strict';import {sha} from './filesystem.mjs';
const PROJECT='orderops-statistics-v1-test-74718de66a41';
export function evaluateLifecycle(action,checkpoint,approvedCheckpointHash,containers){
 try{assert.ok(['start-known-id','restart-known-id'].includes(action),'Global CLI/recreate not allowed');assert.equal(sha(Buffer.from(JSON.stringify(checkpoint))),approvedCheckpointHash);assert.equal(checkpoint.projectId,PROJECT);assert.equal(checkpoint.status,'VERIFIED_LOOPBACK_TRANSITION');assert.ok(checkpoint.transition.every(x=>/^[a-f0-9]{64}$/.test(x.newId??'')));assert.equal(checkpoint.transition.length,2);assert.deepEqual(checkpoint.transition.map(x=>x.kind).sort(),['db','kong']);assert.equal(new Set(checkpoint.transition.map(x=>x.newId)).size,2);
  for(const t of checkpoint.transition){assert.ok(['db','kong'].includes(t.kind));const c=containers.find(x=>x.Id===t.newId);assert.ok(c);assert.equal(c.Config.Labels['com.supabase.cli.project'],PROJECT);assert.equal(c.Name,'/supabase_'+t.kind+'_'+PROJECT);assert.equal(c.Image,t.image);const key=t.kind==='db'?'5432/tcp':'8000/tcp';assert.deepEqual(c.HostConfig.PortBindings,{[key]:[{HostIp:'127.0.0.1',HostPort:t.kind==='db'?'56322':'56321'}]});assert.equal(c.HostConfig.PublishAllPorts,false);}
  return {decision:'POLICY_ALLOWS_REVIEWED_EXISTING_IDS_ONLY',executes:false,recreateAllowed:false,repairAllowed:false};
 }catch{return {decision:'DENY_NO_REPAIR',executes:false,recreateAllowed:false,repairAllowed:false};}
}
