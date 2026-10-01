const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const puppeteer = require('puppeteer');
async function main() {
  const dir=path.resolve('tmp/jump-test');
  fs.mkdirSync(dir,{recursive:true});
  const browser=await puppeteer.launch({headless:true,timeout:120000,protocolTimeout:120000,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    const page=await browser.newPage();
    page.setDefaultTimeout(120000);
    const results=[];
    for (const name of ['preview-dashboard-cliente.html','preview-dashboard-clinico.html']) {
      for (const width of [320,390,768,1280]) {
        console.log(`Auditing ${name} at ${width}px`);
        await page.setViewport({width,height:900});
        await page.goto('file:///'+path.resolve(name).replace(/\\/g,'/'),{waitUntil:'networkidle0'});
        const result=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
          overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+2&&!e.closest('.overflow-x-auto')).slice(0,10).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,80),text:(e.textContent||'').slice(0,55)})),
          badImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length}));
        results.push({name,...result});
        await page.screenshot({path:path.join(dir,`${name}-${width}.png`)});
      }
    }
    await page.setViewport({width:794,height:1123});
    console.log('Auditing paginated report');
    await page.goto('file:///'+path.resolve('preview-laudo-full-smoke.html').replace(/\\/g,'/'),{waitUntil:'networkidle0'});
    const pagination=new Module('pagination');
    pagination._compile(ts.transpileModule(fs.readFileSync('src/lib/pdf/pagination.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,'pagination.js');
    await pagination.exports.prepararPaginacaoLaudo(page);
    const pdf=await page.$$eval('.page',els=>els.flatMap((el,i)=>{
      const bounds=el.getBoundingClientRect();
      const footer=el.querySelector('.pdf-footer')?.getBoundingClientRect();
      const limit=footer?.top??bounds.bottom;
      return [...el.children].filter(child=>!child.classList.contains('pdf-footer'))
        .filter(child=>child.getBoundingClientRect().bottom>limit+1)
        .map(child=>({page:i+1,title:el.querySelector('h1,h2')?.textContent,block:child.className,excess:Math.round(child.getBoundingClientRect().bottom-limit)}));
    }));
    const pdfPages=await page.$$eval('.page',els=>els.map((el,i)=>({
      page:i+1,
      title:(el.querySelector('h1,h2')?.textContent||'').trim(),
      textLength:(el.textContent||'').trim().length,
    })));
    results.push({pdfOverflow:pdf,pdfPages});
    const pages=await page.$$('.page');
    console.log(`Capturing ${pages.length} report pages`);
    for(let i=0;i<pages.length;i++) await pages[i].screenshot({path:path.join(dir,`audit-pdf-${i+1}.png`)});
    fs.writeFileSync(path.join(dir,'layout-audit.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify(results,null,2));
    if(results.some(r=>r.scrollWidth>r.width+1||r.badImages>0)||pdf.length) throw new Error('Layout regression: horizontal overflow, broken images or PDF footer overlap');
  } finally {await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
