// Proposed local named-pipe adapter. Public entrypoints ALWAYS throw before loading HTTP.
// No flag, approval JSON, environment variable or constructor argument can enable this build.
import assert from 'node:assert/strict';import {assertIssuedRequest,decodeResponse} from './request-codec.mjs';
import {StoppedExportScanner} from './stopped-export.mjs';
import {sha} from './filesystem.mjs';
import {consumeIntentTicket} from './journal-store.mjs';
function interventionNotAuthorized(){throw new Error('NATIVE_ENGINE_HARD_LOCKED_REQUIRES_NEW_REVIEWED_BUILD');}
function safeFailure(code,uncertain){const e=new Error(code);e.uncertain=uncertain;return e;}
export class ProposedNativeAdapter {
 async send(request,ticket){
  interventionNotAuthorized();
  try{assertIssuedRequest(request,{allowSimulation:false});consumeIntentTicket(ticket,request);assert.ok(!request.path.endsWith('/export'));const response=await this.#exchange(request,null);return {...response,decoded:decodeResponse(request,response)};}catch{throw safeFailure('ENGINE_VALIDATION_OR_RESPONSE_HALT',true);}
 }
 async scanStoppedExport(request,scanner,ticket){
  interventionNotAuthorized();
  try{assertIssuedRequest(request,{allowSimulation:false});consumeIntentTicket(ticket,request);assert.equal(request.method,'GET');assert.ok(request.path.endsWith('/export'));assert.ok(scanner instanceof StoppedExportScanner);await this.#exchange(request,scanner);return scanner.finish();}catch{throw safeFailure('EXPORT_VALIDATION_OR_RESPONSE_HALT',false);}
 }
 async #exchange(descriptor,scanner){
  // Unreachable in this build. Wire implementation retained for review, NOT released by tests.
  const {request}=await import('node:http');
  const body=descriptor.body===null?null:Buffer.isBuffer(descriptor.body)?Buffer.from(descriptor.body):Buffer.from(JSON.stringify(descriptor.body));
  if(body!==null)assert.equal(sha(body),descriptor.bodyHash,'Body changed while being copied');
  const mutating=descriptor.method!=='GET'&&descriptor.method!=='HEAD';
  return new Promise((resolve,reject)=>{
   let finished=false,sent=false;const chunks=[];let bytes=0;
   const done=(error,result)=>{if(finished)return;finished=true;clearTimeout(deadline);if(error)reject(error);else resolve(result);};
   const req=request({socketPath:'\\\\.\\pipe\\docker_engine',method:descriptor.method,path:descriptor.path,headers:{'Accept-Encoding':'identity',...(body?{'Content-Type':Buffer.isBuffer(descriptor.body)?'application/x-tar':'application/json','Content-Length':body.length}:{})}},async res=>{
    if(res.statusCode!==descriptor.expectedStatus){res.destroy();done(safeFailure('UNEXPECTED_ENGINE_STATUS_HALT',mutating&&sent));return;}
    try{for await(const chunk of res){bytes+=chunk.length;const max=scanner?1024*1024*1024:descriptor.path.includes('/archive?')?34*1024*1024:4*1024*1024;if(bytes>max)throw Error();if(scanner)scanner.feed(chunk);else chunks.push(Buffer.from(chunk));}
     if(!res.complete)throw Error();done(null,{status:res.statusCode,body:Buffer.concat(chunks),complete:true});
    }catch{res.destroy();done(safeFailure('INCOMPLETE_OR_UNSUPPORTED_ENGINE_RESPONSE_HALT',mutating&&sent));}
   });
   const deadline=setTimeout(()=>{req.destroy();done(safeFailure('ENGINE_CLIENT_TIMEOUT_HALT',mutating&&sent));},60000);
   req.once('error',()=>done(safeFailure('ENGINE_CONNECTION_ERROR_HALT',mutating&&sent)));
   // No retry, redirect, host lookup, proxy, service restart or error recovery request.
   sent=true;req.end(body??undefined);
  });
 }
}
