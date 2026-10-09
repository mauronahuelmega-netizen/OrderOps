const fs=require('fs'),postcss=require('postcss');
let p='components/marketing/marketing-landing.tsx',s=fs.readFileSync(p,'utf8');s=s.replace('Tus pedidos pueden llegar<br /><span>','Tus pedidos pueden llegar<br /> <span>');fs.writeFileSync(p,s);
p='components/marketing/marketing-landing.module.css';let ast=postcss.parse(fs.readFileSync(p,'utf8'));
ast.walkRules(r=>{if(r.selector==='.pricingGrid > div > p')r.selector='.pricingGrid > div > p:not(.eyebrow)';if(r.selector==='.faqGrid > div > p')r.selector='.faqGrid > div > p:not(.eyebrow)'});
ast.append(postcss.parse('@media(max-width:1199px) and (min-width:1024px) { .problemGrid { grid-template-columns:1fr; gap:32px; } .comparison { width:100%; max-width:760px; margin-inline:auto; } }').nodes);
fs.writeFileSync(p,ast.toString());
// Canonicalize base rules and each breakpoint instead of retaining V1/V1.1 override blocks.
for(const file of ['marketing-landing.module.css','product-preview.module.css','product-story.module.css']){
 p='components/marketing/'+file;ast=postcss.parse(fs.readFileSync(p,'utf8'));const media=new Map();
 ast.walkAtRules('media',m=>{const key=m.params.replace(/\s+/g,'');if(media.has(key)){media.get(key).append(m.nodes);m.remove()}else media.set(key,m)});
 for(const m of media.values()){const rules=new Map();m.walkRules(r=>{if(rules.has(r.selector)){const prior=rules.get(r.selector);const decls=new Map();for(const d of [...prior.nodes,...r.nodes])if(d.type==='decl')decls.set(d.prop,d.clone());prior.remove();r.removeAll();for(const d of decls.values())r.append(d)}rules.set(r.selector,r)})}
 const sorted=[...media.values()].sort((a,b)=>{const na=Number((a.params.match(/max-width:\s*(\d+)/)||[])[1]||0),nb=Number((b.params.match(/max-width:\s*(\d+)/)||[])[1]||0);return nb-na});for(const m of sorted){m.remove();ast.append(m)}
 function format(node,depth=0){const ind='  '.repeat(depth);if(node.type==='decl')return ind+node.prop+': '+node.value+(node.important?' !important':'')+';';if(node.type==='comment')return ind+'/* '+node.text+' */';if(node.type==='rule'||node.type==='atrule'){const head=node.type==='rule'?node.selector:'@'+node.name+' '+node.params;if(!node.nodes)return ind+head+';';return ind+head+' {\n'+node.nodes.map(n=>format(n,depth+1)).join('\n')+'\n'+ind+'}'}return node.nodes.map(n=>format(n,depth)).join('\n\n')}
 fs.writeFileSync(p,format(ast)+'\n');
}
