// This entrypoint has NO apply mode and NEVER creates a real Engine adapter.
import {runSimulation} from './executor.mjs';
if(process.argv.length!==3||process.argv[2]!=='--simulate'){
 console.log(JSON.stringify({result:'DENIED',code:'REAL_MUTATIONS_DISABLED',realEngineRequests:0}));process.exitCode=2;
}else{
 try{const r=runSimulation();console.log(JSON.stringify({result:r.result,stagesVerified:r.events.filter(x=>x.status==='VERIFIED').length,realEngineRequests:0}));}catch{console.log(JSON.stringify({result:'HALTED',rawErrorSuppressed:true,realEngineRequests:0}));process.exitCode=1;}
}
