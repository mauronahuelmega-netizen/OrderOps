// Offline candidate generation only. No database client, subprocess SQL or network.
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import path from 'node:path';
const dir='docs/estadisticas-v1/p03-f2a';fs.mkdirSync(dir,{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const git=(...args)=>execFileSync('git',['--no-optional-locks',...args],{encoding:'utf8'}).trim();
assert.equal(git('branch','--show-current'),'codex/estadisticas-v1');
const cursor=path.resolve('../OrderOps');
const cursorHead=execFileSync('git',['-c',`safe.directory=${cursor.replaceAll('\\','/')}`,'--no-optional-locks','-C',cursor,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const ownVersions=fs.readdirSync('supabase/migrations').filter(p=>p.endsWith('.sql'));
const cursorVersions=fs.readdirSync(path.join(cursor,'supabase/migrations')).filter(p=>p.endsWith('.sql'));
const migration='supabase/migrations/20261013005000_statistics_v1_read_core_candidate.sql';
assert.ok(!ownVersions.some(p=>p.startsWith('20261013005000')&&p!==path.basename(migration))&&!cursorVersions.some(p=>p.startsWith('20261013005000')),'Candidate version collision');
if(fs.existsSync(migration)){assert.ok(fs.existsSync(`${dir}/generation.json`));assert.equal(sha(migration),JSON.parse(fs.readFileSync(`${dir}/generation.json`)).sha256,'Existing candidate changed outside generator');}
const prior=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(p=>p&&!p.startsWith(dir+'/')&&p!==migration&&!p.startsWith('scripts/statistics-v1/p03-f2a-')&&fs.existsSync(p));
if(!fs.existsSync(`${dir}/baseline.json`))fs.writeFileSync(`${dir}/baseline.json`,JSON.stringify({at:new Date().toISOString(),head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),status:git('status','--short'),cursorHead,ownVersions,cursorVersions,files:Object.fromEntries(prior.map(p=>[p,sha(p)]))},null,2));
const original=fs.readFileSync('supabase/migrations/20261013004000_statistics_v1_comparative_series.sql','utf8').replaceAll('\r\n','\n');
const viewSource=fs.readFileSync('supabase/migrations/20261013003000_statistics_v1_reads_security.sql','utf8').replaceAll('\r\n','\n');
const extract=name=>{const start=original.indexOf(`create function private.${name}(`);assert.ok(start>=0);const end=original.indexOf('\n$$;',start)+4;return original.slice(start,end);};
const baseOriginal=extract('statistics_v1_summary_base');const seriesOriginal=extract('statistics_v1_series_response');
let core=baseOriginal.replace('statistics_v1_summary_base(','statistics_v1_read_core_candidate(').replace('  v_rules jsonb;','  v_effective jsonb; v_result jsonb;\n  v_rules jsonb;');
// Explicit B4 safety fix; documented non-equivalence for NULL role, pending review.
core=core.replace("v_role not in ('owner','manager','admin')","v_role is null or v_role not in ('owner','manager','admin')");
core=core.replace("return jsonb_build_object('contractVersion','statistics.v1','status','configuration_required','businessId',v_business,'reason','missing_timezone');", "return jsonb_build_object('legacy',jsonb_build_object('contractVersion','statistics.v1','status','configuration_required','businessId',v_business,'reason','missing_timezone'),'effectiveFacts','[]'::jsonb);");
let projection=viewSource.slice(viewSource.indexOf('select c.*,f.agreed_total'),viewSource.indexOf('\nfrom public.order_statistics_completions'));
projection=projection.replaceAll('private.statistics_source_digest(private.statistics_source_items(c.order_id,c.business_id))','d.current_digest').replaceAll('f.agreed_total','c.current_agreement');
const preparation=`
  -- One authorized relational cohort and at most one live digest per eligible non-conflicted completion.
  with eligible as materialized (
    select c.*,f.agreed_total current_agreement
    from public.order_statistics_completions c
    join public.orders o on o.id=c.order_id and o.business_id=c.business_id and o.status='completed'
    left join public.order_financials f on f.order_id=c.order_id and f.business_id=c.business_id
    where c.active and c.business_id=v_business and private.statistics_can_read(c.business_id)
      and c.commercial_date is not null and c.timezone is not null and not c.date_conflict and c.completed_at<=v_now
      and (c.commercial_date between v_start and v_end or
        (v_compare and c.commercial_date between v_ps and v_pe and
          (not v_partial or case when c.date_kind='outside_session' then c.commercial_date<v_pe or c.completed_at<=v_previous_cutoff
            else exists(select 1 from jsonb_array_elements(v_segments) seg where (seg->>'previousSessionId')::uuid=c.session_key and c.completed_at<=(seg->>'previousUntil')::timestamptz) end)))
  ), digests as materialized (
    select id,case when not composition_conflict then
      private.statistics_source_digest(private.statistics_source_items(order_id,business_id)) end current_digest
    from eligible
  ), effective as materialized (
    ${projection.replace('c.*,c.current_agreement current_agreement','c.*')}
    from eligible c join digests d on d.id=c.id
  ) select coalesce(jsonb_agg(to_jsonb(e)),'[]'::jsonb) into v_effective from effective e;
`;
assert.ok(!preparation.includes('c.*,c.current_agreement'),'Duplicate JSON column');
core=core.replace('  -- One top-level RPC statement gives a consistent snapshot.',preparation+'\n  -- One top-level RPC statement gives a consistent snapshot.');
core=core.replaceAll('public.statistics_v1_effective_facts','jsonb_populate_recordset(null::public.statistics_v1_effective_facts,v_effective)');
// Restore the composite type: replacing relation references must not alter its name recursively.
core=core.replaceAll('null::jsonb_populate_recordset(null::public.statistics_v1_effective_facts,v_effective)','null::public.statistics_v1_effective_facts');
core=core.replace("  return jsonb_build_object('contractVersion','statistics.v1','status','ready'","  v_result:=jsonb_build_object('contractVersion','statistics.v1','status','ready'");
core=core.replace('\nend;\n$$;',()=> '\n  return jsonb_build_object(\'legacy\',v_result,\'effectiveFacts\',v_effective);\nend;\n$$;');
let series=seriesOriginal.replace('statistics_v1_series_response(','statistics_v1_summary_candidate(').replace('  v_base jsonb;','  v_bundle jsonb; v_base jsonb;');
series=series.replace("v_role not in ('owner','manager','admin')","v_role is null or v_role not in ('owner','manager','admin')");
series=series.replace('  v_base:=private.statistics_v1_summary_base(p_period,p_start_date,p_end_date,p_product_sort,p_limit,p_cursor);','  v_bundle:=private.statistics_v1_read_core_candidate(p_period,p_start_date,p_end_date,p_product_sort,p_limit,p_cursor);\n  v_base:=v_bundle->\'legacy\';');
series=series.replace('public.statistics_v1_effective_facts f','jsonb_populate_recordset(null::public.statistics_v1_effective_facts,v_bundle->\'effectiveFacts\') f');
const signature=`p_period text,p_start_date date default null,p_end_date date default null,
  p_product_sort text default 'units',p_limit integer default 5,p_cursor jsonb default null`;
const base=`create function private.statistics_v1_summary_base_candidate(
  ${signature}
) returns jsonb language sql stable security invoker set search_path=pg_catalog,private as $$
  select private.statistics_v1_read_core_candidate(p_period,p_start_date,p_end_date,p_product_sort,p_limit,p_cursor)->'legacy';
$$;`;
const names=['statistics_v1_read_core_candidate','statistics_v1_summary_base_candidate','statistics_v1_summary_candidate'];
const permissions=names.map(name=>`revoke all on function private.${name}(text,date,date,text,integer,jsonb) from public,anon,authenticated,service_role;\ngrant execute on function private.${name}(text,date,date,text,integer,jsonb) to authenticated;`).join('\n');
const sql=`-- P03-F.2A CANDIDATE ONLY. NOT APPLIED. Public RPC, original readers, capture, RLS and grants remain intact.
-- New names support same-snapshot differential validation before any routing change.
begin;
set local lock_timeout='3s';
set local statement_timeout='60s';

${core}

${base}

${series}

${permissions}
commit;
`;
fs.writeFileSync(migration,sql);fs.writeFileSync(`${dir}/candidate.sql`,sql);
fs.writeFileSync(`${dir}/original-functions.sql`,baseOriginal+'\n\n'+seriesOriginal+'\n');
fs.writeFileSync(`${dir}/proposed-functions.sql`,core+'\n\n'+base+'\n\n'+series+'\n');
fs.writeFileSync(`${dir}/generation.json`,JSON.stringify({migration,sha256:sha(migration),names,versionCollision:false,securityDelta:'Explicit NULL-role denial; original SQL NOT IN is UNKNOWN for NULL. No database execution. Review required.'},null,2));
console.log('Prepared complete candidate under three new names; no SQL executed');
