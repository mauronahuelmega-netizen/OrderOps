const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = process.cwd();
const baseHtml = fs.readFileSync(path.join(root, '.next/server/app/index.html'), 'utf8');
const types = { '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const metricsScript = `<script>window.__landingQa={cls:0};new PerformanceObserver(function(list){for(const e of list.getEntries()){if(e.entryType==='largest-contentful-paint')document.documentElement.dataset.qaLcp=String(e.startTime);if(e.entryType==='layout-shift'&&!e.hadRecentInput){window.__landingQa.cls+=e.value;document.documentElement.dataset.qaCls=String(window.__landingQa.cls)}}}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(function(list){for(const e of list.getEntries()){if(!e.hadRecentInput){window.__landingQa.cls+=e.value;document.documentElement.dataset.qaCls=String(window.__landingQa.cls)}}}).observe({type:'layout-shift',buffered:true});addEventListener('load',function(){document.documentElement.dataset.qaTtfb=String(performance.getEntriesByType('navigation')[0].responseStart);document.documentElement.dataset.qaCls=String(window.__landingQa.cls)});</script>`;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:3011');
  if (url.pathname === '/') {
    let html = baseHtml;
    if (url.searchParams.has('nojs')) html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<link\b[^>]*as="script"[^>]*>/gi, '');
    if (url.searchParams.has('metrics')) html = html.replace('<head>', '<head>' + metricsScript);
    if (url.searchParams.has('dark')) html = html.replace('<html ', '<html data-dashboard-theme="dark" data-catalog-theme="dark" ');
    if (url.searchParams.has('reduced')) html = html.replace(/href="([^\"]+\.css)"/g, 'href="$1?reduced=1"');
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); res.end(html); return;
  }
  const pathname = decodeURIComponent(url.pathname);
  const base = pathname.startsWith('/_next/static/') ? path.join(root, '.next/static') : path.join(root, 'public');
  const relative = pathname.startsWith('/_next/static/') ? pathname.slice('/_next/static/'.length) : pathname.slice(1);
  const file = path.resolve(base, relative);
  if (!file.startsWith(base + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);res.end();return;}
  res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
  if (path.extname(file) === '.css' && url.searchParams.has('reduced')) {
    res.end(fs.readFileSync(file, 'utf8').replace(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/g, '@media all'));
  } else fs.createReadStream(file).pipe(res);
});
server.listen(3011, '127.0.0.1', () => console.log('Local production-snapshot QA: http://127.0.0.1:3011/?nojs=1 or ?metrics=1'));
