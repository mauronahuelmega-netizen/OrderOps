/** Offline arithmetic/predicate model; not PostgreSQL execution or runtime RPC proof. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { elapsedStepHours, inObservation, instantMicros } from './series-temporal';
const H = BigInt(3600000000), one = BigInt(1), zero = BigInt(0);
const ceil = (n: bigint, d: bigint) => (n+d-one)/d;
let cases=0, assertions=0, maximumPoints=0, probes=0;
function check(ok: boolean, label: string) { assertions++; assert.ok(ok,label); }
type Pair = { current: bigint | null; previous: bigint | null };
function plan(pairs: Pair[]) {
  const durations=pairs.map(p=> (p.current??zero)>(p.previous??zero)?p.current!:p.previous!);
  const step=elapsedStepHours(durations);
  cases++;
  if(step===null) { check(pairs.length===0 || pairs.length>=200 || durations.some(d=>d<=zero),'explicit fallback'); return; }
  const width=BigInt(step)*H;
  const count=durations.reduce((n,d)=>n+Number(ceil(d,width)),0);
  maximumPoints=Math.max(maximumPoints,count);
  check(count<=199,'proved stronger bound');
  pairs.forEach((pair,i)=>{
    for(const side of [pair.current,pair.previous]) {
      if(side===null) continue;
      const intervals: {lo: bigint; hi: bigint; inclusive: boolean}[]=[];
      for(let n=zero;n<ceil(durations[i],width);n++) {
        const lo=n*width;
        if(lo>=side) continue; // Absent tail is not an invented observation.
        const hi=(lo+width)<side?lo+width:side;
        intervals.push({lo,hi,inclusive:hi===side});
      }
      check(intervals[0].lo===zero && intervals.at(-1)!.hi===side,'exact observed extent');
      intervals.forEach((b,j)=>{
        check(b.hi>b.lo && (j===0 || intervals[j-1].hi===b.lo),'positive contiguous intervals');
        check(b.inclusive===(j===intervals.length-1),'exclusive internal / inclusive terminal');
      });
      const events=new Set<bigint>([-one,zero,one,side-one,side,side+one]);
      for(const b of intervals) for(const t of [b.lo-one,b.lo,b.lo+one,b.hi-one,b.hi,b.hi+one]) events.add(t);
      // Synthetic fact IDs at each exact boundary; cardinality, not just sum, detects double assignment.
      for(const at of events) {
        const matches=intervals.filter(b=>at>=b.lo && (at<b.hi || b.inclusive && at===b.hi)).length;
        check(matches===(at>=zero && at<=side?1:0),'every admitted fact belongs exactly once');probes++;
      }
    }
  });
}
for(let lanes=1;lanes<=201;lanes++) {
  plan(Array.from({length:lanes},()=>({current:one,previous:one}))); // numerous short sessions
  plan(Array.from({length:lanes},(_,i)=>({current:BigInt(i+1)*H+one,previous:BigInt(lanes-i)*H-one})));
  plan(Array.from({length:lanes},(_,i)=>({current:i===0?BigInt(80000000)*H+one:one,previous:null})));
}
for(const d of [H-one,H,H+one,BigInt(199)*H-one,BigInt(199)*H,BigInt(199)*H+one,BigInt(200)*H]) {
  plan([{current:d,previous:d}]);
  plan([{current:d,previous:d/BigInt(2)},{current:one,previous:H}]); // unequal partial exposure
}
// Deterministic random combinations exercise both cap branches and missing counterparts.
let seed=731;
for(let run=0;run<500;run++) {
  const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
  const lanes=1+next()%199;
  plan(Array.from({length:lanes},()=>({current:BigInt(1+next()%5000)*H+BigInt(next()%1000000),previous:next()%3?BigInt(1+next()%5000)*H-one:null})));
}
check(maximumPoints===199,'199 reached; 200 lanes fall back before generation');
check(elapsedStepHours([zero])===null,'zero exposure falls back');
plan([{current:null,previous:H+one},{current:H-one,previous:H+one}]);
const start='2026-10-13T22:00:00.000001Z', mid='2026-10-13T23:00:00.000001Z', cut='2026-10-14T00:00:00.000002Z';
function iso(us: bigint) { const seconds=us/BigInt(1000000);return new Date(Number(seconds)*1000).toISOString().replace('.000Z',`.${(us%BigInt(1000000)).toString().padStart(6,'0')}Z`); }
for(const t of [start,mid,cut]) for(const offset of [-one,zero,one]) {
  const at=iso(instantMicros(t)+offset);
  const n=Number(inObservation(at,start,mid,false))+Number(inObservation(at,mid,cut,true));
  check(n===(instantMicros(at)>=instantMicros(start)&&instantMicros(at)<=instantMicros(cut)?1:0),'production predicate microseconds / nocturnal asOf');
}
// Same timestamp at close/open is distinct identity: session key is part of SQL membership.
for(const session of ['closing','opening']) {
  const intervals=[{id:'closing',lo:start,hi:mid},{id:'opening',lo:mid,hi:cut}];
  check(intervals.filter(b=>b.id===session && inObservation(mid,b.lo,b.hi,true)).length===1,'touching sessions are disjoint by frozen session identity');
}
check(!inObservation('2026-10-14T00:00:00.000000Z','2026-10-13T00:00:00.000000Z','2026-10-14T00:00:00.000000Z',false),'outside civil midnight excluded');
check(inObservation(cut,start,cut,true) && !inObservation(iso(instantMicros(cut)+one),start,cut,true),'snapshot cutoff includes equality only');
writeFileSync('docs/estadisticas-v1/p03-a-corrective/pure-evidence.json',JSON.stringify({result:'PASS_OFFLINE_MODEL',cases,assertions,maximumPoints,eventProbes:probes,databaseConnections:0,limitations:['SQL planner and interval operators not executed','RPC JSON runtime equality pending']},null,2)+'\n');
console.log(`PASS ${cases} sizing cases, ${assertions} assertions, ${probes} boundary probes; max ${maximumPoints}; zero connections.`);
