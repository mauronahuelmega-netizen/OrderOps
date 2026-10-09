const fs=require('fs'), postcss=require('postcss');
const root='components/marketing/';
function revise(file, selectors, css){
 const ast=postcss.parse(fs.readFileSync(root+file,'utf8'));
 ast.walkRules(r=>{if(selectors.some(s=>r.selector===s))r.remove()});
 ast.walkComments(c=>{if(c.text.includes('LANDING-V1.1'))c.remove()});
 ast.walkAtRules(a=>{if(a.nodes&&a.nodes.length===0)a.remove()});
 ast.append(postcss.parse(css).nodes);
 // Consolidate identical selectors within identical media scopes, preserving last declaration wins.
 const groups=new Map();
 ast.walkRules(r=>{if(r.parent.type==='atrule'&&r.parent.name==='keyframes')return;const scope=r.parent.type==='root'?'':r.parent.name+':'+r.parent.params.replace(/\s+/g,'');const key=scope+'|'+r.selector;const prior=groups.get(key);if(prior){const merged=new Map();for(const d of [...prior.nodes,...r.nodes])if(d.type==='decl')merged.set(d.prop,d.clone());prior.remove();r.removeAll();for(const d of merged.values())r.append(d)}groups.set(key,r)});
 fs.writeFileSync(root+file,ast.toString().replace(/\r\n/g,'\n').trim()+'\n');
}
revise('marketing-landing.module.css',[
'.steps','.steps article','.stepHead','.stepHead > span','.steps h3','.steps p','.desktopBreak','.operationDetails p strong','.commission > div',
'.stepsSection','.benefitsSection','.faqSection','.faqGrid .eyebrow','.faqGrid h2','.faqGrid > div > p','.faqList summary','.faqList details > p',
'.sectionCopy h2','.page h2','.comparison','.comparisonCaption','.chat','.chatHeading','.bubble','.chat > p','.comparisonArrow','.comparisonArrow>span','.comparisonArrow>svg','.structured','.structuredLabel','.structuredNote',
'.communicationGrid','.sectionCopy .eyebrow','.productNotes','.productNotes > span','.benefits','.benefits article','.benefits article:nth-child(2)','.benefits article>span','.benefits article > span','.benefits h3','.benefits p','.selectionVisual,.referenceVisual,.statesVisual','.selectionVisual>span','.selectionVisual svg','.referenceVisual>strong','.referenceVisual>div','.referenceVisual span','.statesVisual','.statesVisual>span','.statesVisual>span:before','.statesVisual>span:nth-child(2):before','.statesVisual>span:nth-child(3):before','.statesVisual>span:nth-child(4):before',
'.pricingGrid','.pricingSection h2','.commission','.commission > strong','.commission > strong > span','.demoSection h2','.demoSection h2 br','.demoSection .shell > p:not(.eyebrow):not(.contactNote)','.demoActions','.demoRule','.compactAction','.compactAction svg'
],`
/* Section roles: explanation, demonstration, statement. Hero retains its own scale. */
.page h2 { font-family:var(--font-display),sans-serif; font-size:clamp(40px,3.35vw,48px); font-weight:700; letter-spacing:-.045em; line-height:1.13; }
.stepsSection { padding:72px 0; background:var(--marketing-white); }
.stepsSection h2,.faqGrid h2 { font-size:36px; max-width:20ch; }
.sectionCopy .eyebrow { color:var(--marketing-muted); margin-bottom:18px; }
.sectionCopy h2 { font-size:clamp(40px,3.35vw,48px); max-width:18ch; }
.comparison { display:grid; grid-template-columns:.85fr 64px 1.15fr; align-items:center; gap:12px; }
.comparisonCaption { grid-column:1/-1; color:var(--marketing-muted); font-size:12px; line-height:1.6; margin-bottom:10px!important; }
.chat { padding:18px 12px; background:var(--marketing-chat); border-radius:8px; }
.chatHeading { display:flex; align-items:center; gap:7px; font-size:11px; color:var(--marketing-muted); padding-bottom:12px; margin-bottom:12px; line-height:1.5; }
.bubble { background:var(--marketing-white); border-radius:8px 8px 8px 2px; padding:8px 9px; font-size:12px; line-height:1.45; max-width:95%; margin-bottom:6px; }
.chat > p { font-size:11px; line-height:1.5; color:var(--marketing-muted); margin-top:14px; }
.comparisonArrow { display:grid; place-items:center; color:var(--marketing-blue); gap:10px; }
.comparisonArrow>span { font-size:10px; line-height:1.6; text-align:center; color:var(--marketing-muted); }
.structured { display:grid; gap:16px; min-width:0; }
.structuredLabel { display:flex; gap:7px; align-items:center; font-size:12px; line-height:1.6; color:var(--marketing-blue); font-weight:600; }
.structuredNote { font-size:12px; line-height:1.7; color:var(--marketing-muted); }
.productNotes { display:flex; gap:12px 24px; flex-wrap:wrap; justify-content:center; margin-top:24px; }
.productNotes > span { display:flex; align-items:center; gap:7px; font-size:11px; color:var(--marketing-muted); }
.communicationGrid { display:grid; grid-template-columns:.9fr 1.1fr; gap:80px; align-items:center; }
.benefitsSection { background:var(--marketing-white); padding:80px 0; }
.benefitsSection h2 { font-size:60px; }
.benefits { display:grid; grid-template-columns:1fr 1.15fr 1fr; gap:40px; margin-top:44px; }
.benefits article { min-width:0; display:flex; flex-direction:column; }
.benefits article+article { border-left:1px solid var(--marketing-border); padding-left:32px; }
.benefits article>span { font-size:12px; color:var(--marketing-blue); font-family:var(--font-display),sans-serif; }
.benefits h3 { font-size:20px; letter-spacing:-.5px; margin-top:12px; }
.benefits p { font-size:13px; margin-top:20px; line-height:1.7; color:var(--marketing-muted); max-width:28ch; }
.selectionVisual { display:flex; flex-direction:column; align-items:start; gap:9px; margin-top:25px; }
.selectionVisual>span { display:flex; align-items:center; gap:8px; font-size:12px; border:1px solid var(--marketing-border); border-radius:24px; padding:10px 13px; background:var(--marketing-paper); }
.selectionVisual>span+span { margin-left:18px; }
.selectionVisual svg { color:var(--marketing-blue); }
.referenceVisual { margin-top:25px; padding:4px 0 4px 15px; border-left:3px solid var(--marketing-blue); }
.referenceVisual>strong { color:var(--marketing-blue-strong); font-size:32px; letter-spacing:-1px; font-family:var(--font-display),sans-serif; }
.referenceVisual>div { display:grid; grid-template-columns:1fr 1fr; gap:10px 16px; margin-top:16px; }
.referenceVisual span { font-size:12px; color:var(--marketing-muted); }
.statesVisual { display:grid; grid-template-columns:1fr 1fr; gap:25px 16px; margin-top:34px; position:relative; }
.statesVisual>span { font-size:12px; display:flex; align-items:center; gap:7px; }
.statesVisual>span:before { content:''; width:8px; height:8px; border-radius:50%; background:var(--marketing-pending); flex-shrink:0; }
.statesVisual>span:nth-child(2):before { background:var(--marketing-preparing); }
.statesVisual>span:nth-child(3):before { background:var(--marketing-ready); }
.statesVisual>span:nth-child(4):before { background:var(--marketing-muted); }
.pricingGrid { display:grid; grid-template-columns:1fr 1.15fr; gap:64px; align-items:center; }
.pricingSection h2 { font-size:56px; max-width:18ch; }
.commission { justify-self:end; padding-right:24px; }
.commission > strong { font-size:280px; line-height:1; letter-spacing:-.08em; font-weight:600; font-family:var(--font-display),sans-serif; display:block; margin:8px 0 16px; }
.commission > strong > span { font-size:.43em; letter-spacing:-.06em; }
.faqSection { padding:56px 0; }
.faqGrid .eyebrow { color:var(--marketing-muted); margin-bottom:14px; }
.faqGrid > div > p { font-size:13px; color:var(--marketing-muted); line-height:1.9; margin-top:12px; }
.faqList summary { display:flex; align-items:center; justify-content:space-between; gap:18px; padding:16px 0; min-height:44px; cursor:pointer; font-size:13px; font-weight:550; list-style:none; }
.faqList details > p { font-size:12px; color:var(--marketing-muted); line-height:1.85; padding:0 25px 18px 0; animation:intro .18s; }
.demoSection h2 { font-size:64px; max-width:850px; margin-inline:auto; }
.demoSection .shell > p:not(.eyebrow):not(.contactNote) { color:var(--marketing-dark-muted); font-size:14px; line-height:1.8; margin-top:18px; }
.demoActions { display:flex; justify-content:center; gap:13px; margin-top:24px; }
.demoRule { display:flex; align-items:center; gap:26px; margin-top:48px; color:var(--marketing-dark-muted); }
.compactAction { min-height:44px; padding:9px 13px; font-size:12px; gap:10px; }
@media(max-width:1199px) {
 .benefitsSection h2 { font-size:48px; } .pricingSection h2 { font-size:46px; } .commission>strong { font-size:220px; }
 .benefits { gap:24px; } .benefits article+article { padding-left:20px; } .statesVisual { gap:25px 9px; } .referenceVisual>strong { font-size:28px; }
 .demoSection h2 { font-size:52px; } .communicationGrid { gap:40px; }
 .stepsSection h2,.faqGrid h2 { font-size:34px; }
}
@media(max-width:1023px) {
 .page h2,.sectionCopy h2 { font-size:36px; } .stepsSection h2,.faqGrid h2 { font-size:32px; }
 .benefitsSection h2,.demoSection h2,.pricingSection h2 { font-size:40px; }
 .comparison { max-width:640px; width:100%; margin-inline:auto; grid-template-columns:.85fr 76px 1.15fr; }
 .benefits { gap:20px; } .benefits h3 { font-size:18px; } .benefits article+article { padding-left:16px; }
 .statesVisual { grid-template-columns:1fr; gap:14px; margin-top:25px; } .referenceVisual>strong { font-size:26px; }
 .selectionVisual>span { padding:9px; } .selectionVisual>span+span { margin-left:0; }
 .commission { padding-right:0; } .commission>strong { font-size:190px; }
 .pricingGrid { gap:32px; } .communicationGrid { gap:32px; }
}
@media(max-width:767px) {
 .headerInner { min-height:64px; } .compactAction { padding:8px 8px; font-size:11px; font-weight:550; gap:5px; min-height:44px; white-space:nowrap; } .compactAction svg { width:13px; }
 .page h2,.sectionCopy h2 { font-size:34px; } .stepsSection h2,.faqGrid h2 { font-size:30px; }
 .stepsSection { padding:48px 0; } .benefitsSection { padding:56px 0; }
 .benefitsSection h2,.demoSection h2 { font-size:40px; } .pricingSection h2 { font-size:38px; }
 .comparison { grid-template-columns:1fr; gap:10px; } .comparisonCaption { margin-bottom:4px!important; }
 .chat { max-width:330px; width:84%; justify-self:start; padding:16px 12px; }
 .comparisonArrow { margin-block:6px; gap:7px; } .comparisonArrow>svg { transform:rotate(90deg); } .comparisonArrow>span { font-size:12px; }
 .structured { width:100%; max-width:400px; justify-self:end; gap:12px; }
 .communicationGrid { display:flex; flex-direction:column; gap:30px; align-items:stretch; }
 .productNotes { justify-content:start; gap:10px 16px; } .productNotes>span { font-size:11px; }
 .benefits { grid-template-columns:1fr; gap:28px; margin-top:34px; }
 .benefits article+article { border-left:0; padding-left:0; border-top:1px solid var(--marketing-border); padding-top:26px; }
 .benefits h3 { font-size:22px; } .benefits p { max-width:100%; margin-top:16px; }
 .selectionVisual { margin-top:18px; } .selectionVisual>span { padding:10px 13px; } .selectionVisual>span+span { margin-left:24px; }
 .referenceVisual { align-self:end; width:85%; margin-top:20px; padding:4px 0 4px 18px; } .referenceVisual>strong { font-size:36px; }
 .statesVisual { grid-template-columns:1fr 1fr; gap:24px; margin-top:24px; padding-block:8px; }
 .pricingGrid { grid-template-columns:1fr; gap:28px; } .commission { justify-self:end; width:100%; display:flex; flex-direction:column; align-items:end; }
 .commission>strong { font-size:160px; } .commission>p { max-width:100%; }
 .faqSection { padding:40px 0; } .faqGrid { gap:24px; } .faqList summary { font-size:12px; }
 .demoSection h2 br { display:none; } .demoActions { flex-direction:column; align-items:center; gap:12px; } .demoRule { margin-top:36px; }
}
`);
revise('product-preview.module.css',[],``);
// Reserve space for the illustrative cart FAB; remove selectors superseded by MarketingOrderCard.
{
 const p=root+'product-preview.module.css',a=postcss.parse(fs.readFileSync(p,'utf8'));
 const dead=/\.(ticket(?:Head|Products|Foot)?|orderRef|pending|customer|catalogBar)(?![\w-])/;
 a.walkRules(r=>{if(dead.test(r.selector))r.remove()});
 a.walkRules(r=>{if(r.selector==='.catalogCard')r.append({prop:'margin-bottom',value:'48px'})});
 fs.writeFileSync(p,a.toString().trim()+'\n');
}
revise('product-story.module.css',[
'.story','.product','.options','.productImage','.productImage img','.productImage:hover img','.product > p','.brandNote','.optionsHeading p','.optionGroup','.optionGroup:first-of-type','.optionGroup summary','.optionRows','.optionRows > div','.selected strong','.complementGroup','.upsell span','.total','.total > span'
],`
.story { display:grid; grid-template-columns:1fr 1fr; gap:48px; margin-top:40px; align-items:start; }
.product { padding:24px; border:1px solid var(--marketing-border); border-radius:14px; background:var(--marketing-paper); }
.productImage { background:var(--marketing-food-cream); border-radius:10px; height:280px; position:relative; display:grid; place-items:center; overflow:hidden; }
.productImage img { width:100%; max-width:380px; height:auto; }
.product > p { font-size:12px; color:var(--marketing-muted); margin-top:9px; line-height:1.8; }
.brandNote { margin-top:22px; padding-top:16px; border-top:1px solid var(--marketing-border); display:flex; align-items:center; gap:10px; font-size:12px; color:var(--marketing-muted); }
.options { padding:6px 0; }
.optionsHeading p { font-size:12px; color:var(--marketing-muted); margin-top:9px; }
.optionGroup { margin-top:0; border-bottom:1px solid var(--marketing-border); }
.optionGroup:first-of-type { margin-top:20px; border-top:1px solid var(--marketing-border); }
.optionGroup summary { display:flex; align-items:center; flex-wrap:wrap; gap:7px; font-size:12px; font-weight:600; padding:10px 0; min-height:48px; list-style:none; cursor:pointer; }
.optionRows { padding:0 0 10px; display:grid; gap:3px; }
.optionRows > div { display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:12px; padding:10px; border-radius:5px; }
.selected strong { font-size:12px; }
.complementGroup { margin-top:18px; background:var(--marketing-food-cream); border:0; border-radius:8px; padding-inline:12px; }
.complementGroup:first-of-type { border-top:0; }
.upsell span { display:block; font-size:12px; color:var(--marketing-muted); margin-top:4px; line-height:1.5; }
.total { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-top:20px; border-top:1px solid var(--marketing-border); padding-top:16px; }
.total > span { font-size:12px; color:var(--marketing-muted); line-height:1.6; }
@media(max-width:1023px) { .story { gap:28px; } .product { padding:18px; } .productImage { height:220px; } .total { flex-wrap:wrap; gap:8px; } }
@media(max-width:767px) { .story { grid-template-columns:1fr; margin-top:28px; gap:26px; } .product { padding:16px; } .productImage { height:180px; } .productImage img { width:260px; } .brandNote { margin-top:16px; padding-top:14px; } .options { padding:0; } .optionsHeading h3 { font-size:22px; } .total { flex-wrap:nowrap; } .total>span { max-width:150px; } }
`);
