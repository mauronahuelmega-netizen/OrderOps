const fs=require('fs');const dir='components/marketing/';
fs.writeFileSync(dir+'marketing-journey.module.css',`
.journey { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:42px; margin-top:36px; position:relative; }
.journey::before { content:''; position:absolute; height:1px; top:14px; left:0; right:0; background:var(--marketing-border); }
.journey article { position:relative; display:flex; flex-direction:column; min-width:0; }
.head { display:flex; gap:10px; color:var(--marketing-blue); align-items:center; background:var(--marketing-white); width:fit-content; padding-right:12px; }
.head>span { font-size:11px; color:var(--marketing-muted); }
.journey h3 { font-size:17px; letter-spacing:-.4px; margin-top:17px; }
.journey p { color:var(--marketing-muted); font-size:13px; line-height:1.7; margin-top:10px; margin-bottom:22px; }
.fragment { padding:16px 0; min-height:154px; margin-top:auto; display:flex; flex-direction:column; gap:10px; }
.fragment strong { font-size:15px; }
.fragment>span { display:flex; align-items:center; gap:6px; font-size:12px; }
.fragment small { color:var(--marketing-muted); font-size:12px; line-height:1.5; }
.fragment svg { color:var(--marketing-blue); }
.registered { border-left:3px solid var(--marketing-blue); padding-left:18px; background:linear-gradient(90deg,var(--marketing-blue-soft),transparent); }
.registered>strong { color:var(--marketing-blue-strong); font-family:var(--font-display),sans-serif; font-size:30px; letter-spacing:-.7px; }
.connector { position:absolute; right:-32px; top:3px; color:var(--marketing-blue); background:var(--marketing-white); }
.lane { font-size:12px; display:flex; align-items:center; gap:8px; padding-bottom:12px; border-bottom:1px solid var(--marketing-border); }
.lane>span { width:6px; height:6px; border-radius:50%; background:var(--marketing-pending); }
.lane b { margin-left:auto; }
@media(max-width:1023px) { .journey { gap:24px; } .journey h3 { font-size:15px; } .registered { padding-left:12px; } .registered>strong { font-size:26px; } .connector { right:-22px; width:17px; } }
@media(max-width:767px) {
 .journey { grid-template-columns:1fr; gap:26px; margin-top:28px; padding-left:25px; }
 .journey::before { width:2px; height:auto; top:14px; bottom:36px; left:0; right:auto; background:var(--marketing-border); }
 .head { gap:12px; } .head::before { content:''; position:absolute; width:8px; height:8px; left:-28px; border-radius:50%; background:var(--marketing-blue); box-shadow:0 0 0 5px var(--marketing-white); }
 .journey h3 { font-size:18px; margin-top:12px; } .journey p { margin-bottom:10px; }
 .fragment { min-height:0; padding-block:12px; gap:8px; } .registered { padding-left:16px; } .registered>strong { font-size:32px; }
 .connector { left:-34px; right:auto; top:auto; bottom:-23px; transform:rotate(90deg); background:var(--marketing-white); }
}
`.trim()+'\n');
fs.writeFileSync(dir+'order-flow-demo.module.css',`
.flow { margin-top:36px; padding:24px; border:1px solid var(--marketing-dark-border); border-radius:13px; background:var(--marketing-night-raised); }
.overview { display:flex; justify-content:space-between; gap:16px; color:var(--marketing-dark-muted); font-size:12px; margin-bottom:22px; }
.overview strong { font-weight:500; }
.stageSummary { list-style:none; padding:0; margin:0 0 22px; display:none; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
.stageSummary li { display:flex; align-items:center; gap:9px; padding:12px 0; border-bottom:1px solid var(--marketing-dark-border); font-size:12px; }
.stageSummary li>span { color:var(--marketing-dark-muted); font-size:10px; }
.stageSummary strong { font-weight:500; }
.stageSummary b { margin-left:auto; color:var(--marketing-dark-muted); }
.stageSummary [aria-current] { border-color:var(--marketing-blue-light); }
.board { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
.lane { min-height:285px; border-top:2px solid var(--marketing-pending-light); padding:14px 0; }
.lane[data-stage="preparing"] { border-top-color:var(--marketing-preparing-light); }
.lane[data-stage="ready"] { border-top-color:var(--marketing-ready-light); }
.lane[data-stage="completed"] { border-top-color:var(--marketing-dark-muted); }
.activeLane .laneTitle { color:var(--marketing-white); }
.laneTitle { display:flex; justify-content:space-between; gap:10px; font-size:12px; padding-bottom:14px; }
.laneTitle>span { color:var(--marketing-dark-muted); }
.arrival { animation:cardArrival .18s both; }
.contextCard { border:1px solid var(--marketing-dark-border); border-radius:7px; padding:13px; margin-top:12px; display:grid; gap:10px; }
.contextCard strong,.contextCard b { font-size:12px; font-weight:550; }
.contextCard span,.empty { color:var(--marketing-dark-muted); font-size:12px; line-height:1.6; }
.empty { padding-block:20px; }
.focusedBoard { display:none; }
.interaction { display:flex; justify-content:space-between; align-items:center; gap:20px; margin-top:22px; padding-top:20px; border-top:1px solid var(--marketing-dark-border); }
.interaction p { font-size:12px; line-height:1.7; color:var(--marketing-dark-muted); }
.interaction p>span { display:block; color:var(--marketing-white); }
.interaction button { display:flex; align-items:center; justify-content:center; gap:13px; min-height:46px; padding:11px 16px; background:var(--marketing-night); color:var(--marketing-white); border:1px solid var(--marketing-dark-muted); border-radius:6px; font:inherit; font-size:13px; font-weight:550; cursor:pointer; }
.interaction button:hover:not(:disabled) { background:var(--marketing-night-raised); border-color:var(--marketing-white); }
.interaction button:disabled { color:var(--marketing-dark-muted); border-color:var(--marketing-dark-border); cursor:default; }
.stageDescription { font-size:12px; color:var(--marketing-dark-muted); line-height:1.7; margin-top:16px!important; min-height:42px; }
.manualNote { font-size:12px; line-height:1.7; color:var(--marketing-dark-muted); margin-top:12px!important; }
@keyframes cardArrival { from { opacity:.6; transform:translateY(4px); } to { opacity:1; transform:none; } }
@media(max-width:1199px) and (min-width:1024px) { .flow { padding:16px; } .board { gap:12px; } }
@media(max-width:1023px) {
 .board { display:none; } .stageSummary { display:grid; }
 .focusedBoard { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(0,1fr); gap:0 26px; align-items:start; }
 .focusedBoard>.laneTitle { grid-column:1/-1; max-width:380px; }
 .contextRows { display:grid; gap:14px; }
 .contextRow { display:grid; gap:7px; padding:13px 0; border-top:1px solid var(--marketing-dark-border); font-size:12px; }
 .contextRow small { font-size:12px; color:var(--marketing-dark-muted); line-height:1.5; }
}
@media(max-width:767px) {
 .flow { padding:16px; margin-top:28px; } .overview { flex-direction:column; gap:7px; line-height:1.6; }
 .stageSummary { grid-template-columns:1fr 1fr; gap:5px 16px; } .stageSummary li { gap:6px; padding:10px 0; }
 .focusedBoard { grid-template-columns:1fr; } .focusedBoard>.laneTitle { grid-column:auto; }
 .contextRows { margin-top:16px; gap:0; } .contextRow { grid-template-columns:1fr auto; gap:6px; padding-block:12px; } .contextRow small { grid-column:1/-1; }
 .contextRow:nth-child(n+3) { display:none; }
 .interaction { align-items:stretch; flex-direction:column; gap:13px; } .interaction button { align-self:start; }
 .stageDescription { min-height:62px; }
}
@media(max-width:374px) { .contextRow:nth-child(n+2) { display:none; } }
@media(prefers-reduced-motion:reduce) { .arrival { animation:none; } }
`.trim()+'\n');
fs.writeFileSync(dir+'contact-preview.module.css',`
.contact { min-width:0; padding:0; }
.header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-bottom:16px; border-bottom:1px solid var(--marketing-border); }
.header>span { display:flex; align-items:center; gap:8px; font-size:12px; font-weight:550; }
.header svg { color:var(--marketing-blue); }
.header>strong { font-size:12px; color:var(--marketing-muted); }
.selector { margin-top:20px; }
.selector>span { display:block; font-size:12px; color:var(--marketing-muted); margin-bottom:8px; }
.selector>strong { display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:13px; font-weight:550; }
.message { margin-top:16px; border-radius:10px; background:var(--marketing-chat-reply); padding:26px; }
.message p { font-size:15px; line-height:1.8; }
.message p+p { margin-top:14px; }
.message>span { display:block; font-size:12px; color:var(--marketing-muted); margin-top:24px; }
.openWhatsapp { display:flex; align-items:center; justify-content:center; gap:8px; background:var(--marketing-ink); color:var(--marketing-white); padding:13px; border-radius:6px; font-size:13px; margin-top:14px; }
.utilities { display:flex; flex-wrap:wrap; gap:12px 20px; border-top:1px solid var(--marketing-border); margin-top:20px; padding-top:16px; }
.utilities>span { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--marketing-muted); }
.note { font-size:12px; line-height:1.8; color:var(--marketing-muted); margin-top:16px!important; }
@media(max-width:1023px) { .message { padding:22px; } .header { flex-wrap:wrap; } }
@media(max-width:767px) { .header { flex-wrap:nowrap; } .message { padding:22px; } .message p { font-size:14px; } .utilities { gap:12px 18px; } }
`.trim()+'\n');
let p=dir+'marketing-landing.tsx',s=fs.readFileSync(p,'utf8');
s=s.replace('        <ContactPreview />\r\n','').replace('        <ContactPreview />\n','');
s=s.replace('      </div></section>\r\n\r\n      <section className={styles.benefitsSection}', '        <ContactPreview />\r\n      </div></section>\r\n\r\n      <section className={styles.benefitsSection}');
s=s.replace('<p>Pendiente. Preparando. Listo. Completado.</p>','');fs.writeFileSync(p,s);
p=dir+'order-flow-demo.tsx';s=fs.readFileSync(p,'utf8');s=s.replace("    const context = illustrativeContextOrders.find(o => o.stage === stage.key) ?? illustrativeContextOrders[0];\r\n",'');
s=s.replace('<div className={styles.contextRow}><span>También en el tablero</span><strong>#{context.reference} · {context.customer}</strong><small>{orderStages.find(s => s.key === context.stage)!.label} · {context.method}</small></div>', '<div className={styles.contextRows}>{illustrativeContextOrders.map(context => <div className={styles.contextRow} key={context.reference}><strong>#{context.reference} · {context.customer}</strong><small>{orderStages.find(s => s.key === context.stage)!.label} · {context.method}</small></div>)}</div>');fs.writeFileSync(p,s);
p=dir+'contact-preview.tsx';s=fs.readFileSync(p,'utf8');s=s.replace(/<div className={styles.summaryAction}>(.*?)<\/div>/s,'');s=s.replace('<div className={styles.utilities}>','<div className={styles.utilities}><span><Copy size={13} aria-hidden="true" /> Copiar resumen</span>');fs.writeFileSync(p,s);
