import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import esbuild from 'esbuild';
import puppeteer from 'puppeteer';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import Module from 'node:module';
import ts from 'typescript';
import { MEASUREMENTS, calculateAnthropometry, legacyProjection, newAnthropometry } from '../src/lib/anthropometry';
import { anthropometryReportHtml } from '../src/lib/pdf/anthropometry';
import { PatientDashboard } from '../src/components/PatientDashboard';

// The app is compiled by Next with the automatic JSX runtime. The standalone
// TSX runner preserves JSX, so expose React for server-side fixture rendering.
(globalThis as any).React = React;
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://127.0.0.1:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'fixture-anon-key';

async function main() {
  const require = createRequire(import.meta.url);
  const root = path.resolve(process.cwd());
  const resolveFile = (base: string) => {
    return [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.cjs`, path.join(base, 'index.ts'), path.join(base, 'index.tsx'), path.join(base, 'index.js')]
      .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? base;
  };
  const resolveLocal = (relative: string) => resolveFile(path.join(root, relative));
  const dir = path.resolve('tmp/anthropometry-v2');
  fs.mkdirSync(dir, { recursive: true });
  const build = await esbuild.build({
    absWorkingDir: root,
    nodePaths: [path.join(root, 'node_modules')],
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Form from './src/components/AnthropometryForm'; createRoot(document.getElementById('root')).render(<Form avaliacaoId="fixture" initialRow={null}/>);`, loader: 'tsx', resolveDir: root },
    bundle: true, write: false, platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'fixture', setup(build) {
      build.onResolve({ filter: /^\.\/src\/components\/AnthropometryForm$/ }, () => ({ path:path.join(root,'src/components/AnthropometryForm.tsx') }));
      build.onResolve({ filter: /^@\/lib\/supabase\/client$/ }, () => ({ path: 'supabase', namespace: 'fixture' }));
      build.onLoad({ filter: /^supabase$/, namespace: 'fixture' }, () => ({ contents: `export function createClient(){return {from(){return {select(){return this},eq(){return this},single:async()=>({data:{id:'fixture',data:'2026-09-28',paciente_id:'patient',modulos_selecionados:{antropometria:true},pacientes:{data_nascimento:'1990-01-01',sexo:'M'}},error:null}),order:async()=>({data:[],error:null})}}}}` }));
      build.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: 'navigation', namespace: 'fixture' }));
      build.onLoad({ filter: /^navigation$/, namespace: 'fixture' }, () => ({ contents: `export function useRouter(){return {push(path){window.__lastRoute=path}}}` }));
      build.onResolve({ filter: /^@\// }, args => ({ path:resolveLocal(path.join('src',args.path.slice(2))) }));
      build.onResolve({ filter: /^[^./].*/ }, args => ({ path:require.resolve(args.path, { paths:[root] }) }));
      build.onResolve({ filter: /^\./ }, args => ({ path:resolveFile(path.resolve(path.dirname(args.importer), args.path)) }));
    }}],
  });
  execFileSync(process.execPath, ['node_modules/tailwindcss/lib/cli.js', '-i', 'src/app/globals.css', '-o', path.join(dir, 'styles.css')]);
  let revision = 0;
  const server = http.createServer(async (req, res) => {
    if (req.url === '/bundle.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(build.outputFiles[0].text); }
    if (req.url === '/styles.css') { res.setHeader('Content-Type', 'text/css'); return res.end(fs.readFileSync(path.join(dir, 'styles.css'))); }
    if (req.url === '/api/modulos' && req.method === 'POST') {
      let body = ''; for await (const chunk of req) body += chunk;
      const parsed = JSON.parse(body); revision++;
      const snapshot = calculateAnthropometry(parsed.payload.registro_v2, { date:'2026-09-28', birthDate:'1990-01-01', sex:'M' });
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok:true, data:{ ...legacyProjection(parsed.payload.registro_v2, snapshot), registro_v2:parsed.payload.registro_v2, resultados_v2:snapshot, revision_v2:revision } }));
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><main id="root" style="padding:20px;max-width:1200px;margin:auto"></main><script src="/bundle.js"></script></body></html>');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as any).port;
  const browserPaths = ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(fs.existsSync);
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  const launchErrors:string[] = [];
  for (const executablePath of browserPaths) {
    try { browser = await puppeteer.launch({ headless:true, executablePath }); break; }
    catch (error) { launchErrors.push(`${path.basename(executablePath)}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  if (!browser) throw new Error(`Nenhum navegador disponivel para o teste. ${launchErrors.join(' | ')}`);
  try {
    const page = await browser.newPage(); const errors:string[] = [];
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width:1280, height:900 });
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil:'domcontentloaded' });
    await page.waitForSelector('[data-anthropometry-v2]');
    assert.equal(await page.$$eval('[data-measurement-id]', nodes => nodes.length), 26);
    for (const id of ['forearm','chest','bimalleolar']) assert.equal(await page.$$eval(`[data-measurement-id="${id}"]`, nodes => nodes.length), 1);
    await page.type('[data-reading="mass-1"]', '84');
    await page.click('[aria-label="Abdomen nao aplicavel"]');
    await page.type('[aria-label="Abdomen motivo nao aplicavel"]', 'Nao relevante para esta avaliacao');
    assert.equal(await page.$eval('[data-reading="abdomen-1"]', element => (element as HTMLInputElement).disabled), true);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent?.includes('Salvar rascunho'))?.click());
    await page.waitForFunction(() => document.body.innerText.includes('Antropometria salva.'));
    assert.equal(revision, 1);
    assert.match(await page.$eval('[data-measurement-id="mass"]', element => element.textContent ?? ''), /Leitura unica/);
    assert.match(await page.$eval('[data-measurement-id="mass"]', element => element.textContent ?? ''), /84 kg/);
    assert.match(await page.$eval('[data-anthropometry-v2]', element => element.textContent ?? ''), /25 medidas com pendencias; 1 confirmada/);
    assert.match(await page.$eval('[data-measurement-id="abdomen"]', element => element.textContent ?? ''), /Nao aplicavel/);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent?.includes('Resultados'))?.click());
    const fatMethodsText = await page.$eval('[data-fat-methods]', element => element.textContent ?? '');
    assert.match(fatMethodsText, /Durnin-Womersley\/Rahaman \+ Siri/);
    assert.match(fatMethodsText, /Petroski/);
    assert.match(fatMethodsText, /Jackson, Pollock e Ward/);
    for (const group of ['muscle','adipose','bone','shape','general','maturity','energy']) assert.equal(await page.$$eval(`[data-method-group="${group}"]`, nodes => nodes.length), 1, `grupo ${group} ausente`);
    const groupedMethodsText = await page.$eval('[data-method-groups]', element => element.textContent ?? '');
    for (const heading of ['Massa muscular','Massa adiposa anatomica','Massa ossea estimada','Somatotipo e proporcionalidade','Medidas e indices gerais','Maturacao','Energia e cenarios profissionais']) assert.match(groupedMethodsText, new RegExp(heading));
    assert.doesNotMatch(groupedMethodsText, /Outros metodos e resultados/);
    await page.click('[aria-label="Selecionar Durnin-Womersley/Rahaman + Siri"]');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent?.includes('Salvar rascunho'))?.click());
    await page.waitForFunction(() => document.body.innerText.includes('Revisao 2 salva'));
    assert.equal(revision, 2);
    await page.screenshot({ path:path.join(dir,'form-desktop.png'), fullPage:true });
    for (const width of [320,390,768]) {
      await page.setViewport({ width, height:844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow horizontal em ${width}px`);
    }
    assert.deepEqual(errors, []);

    const input = newAnthropometry();
    const values:Record<string,number> = {
      mass:78.4,height:178.2,sittingHeight:94.1,armSpan:181.4,
      triceps:11.8,subscapular:14.2,biceps:6.4,iliacCrest:16.8,supraspinale:12.4,abdominal:18.6,thighSkinfold:15.2,calfSkinfold:9.8,
      armRelaxed:33.2,armFlexed:35.6,forearm:28.7,chest:101.4,waist:82.6,abdomen:86.2,hip:99.8,thighMax:59.4,thighMid:55.8,calf:38.7,
      humerus:7.1,femur:9.8,wrist:5.8,bimalleolar:7.4,
    };
    for (const measurement of MEASUREMENTS) {
      const value = values[measurement.id];
      input.measurements[measurement.id].readings = [value, +(value * 1.002).toFixed(2), null];
    }
    input.methods = ['direct','indices','martin1990','lee2000','kerrMuscle1988','kerrAdipose1988','martinBone1991','rocha1975','heathCarter','phantom','durninWomersley1974','siri1961','bmiWHO','dubois1916','harrisBenedict1919','scenarios'];
    input.manualEdition = 'International Standards for Anthropometric Assessment, ISAK 2019';
    input.collectionProtocol = 'ISAK - conjunto estrito de 26 medidas';
    input.conditions = 'Sala reservada, temperatura controlada e avaliacao no periodo da manha.';
    input.notes = 'Coleta completa no lado direito, sem excecoes anatomicas ou tecnicas.';
    input.populationCategory = 'whiteHispanic';
    input.pregnant = false;
    input.activityFactor = 1.55;
    input.activityJustification = 'Pratica regular de treinamento combinado quatro vezes por semana.';
    input.instruments = [
      {name:'Adipometro clinico',resolution:0.1,unit:'mm'},
      {name:'Fita antropometrica inextensivel',resolution:0.1,unit:'cm'},
      {name:'Paquimetro osseo',resolution:0.1,unit:'cm'},
    ];
    input.targets = { fatPercent:null, muscleBoneRatio:4.2, bmi:23.5, muscleMethod:'martin1990', boneMethod:'martinBone1991' };
    input.professionalConclusion = 'Avaliacao antropometrica completa para simulacao visual. Interpretar resultados conforme metodo, populacao de referencia e qualidade registrada, correlacionando-os com os demais modulos da avaliacao.';
    const calculated = calculateAnthropometry(input, { date:'2026-09-28', birthDate:'1990-01-01', sex:'M' });
    const results = { ...structuredClone(calculated), professional:{ name:'Andre Felipe Teixeira Canuto', qualification:{status:'pending',level:1} } };
    const html = `<!doctype html><meta charset="utf-8"><style>@page{size:A4;margin:0}body{margin:0;background:#ddd;font-family:Arial}.page{box-sizing:border-box;width:794px;min-height:1123px;margin:0 auto 12px;background:white;padding:42px;overflow:hidden}.mod-head{border-bottom:1px solid #ddd;margin-bottom:12px}.mod-title{font-size:22px;font-weight:700;padding-bottom:8px}table{break-inside:avoid}h3{break-after:avoid}</style>${anthropometryReportHtml({registro_v2:input,resultados_v2:results,revision_v2:1})}`;
    const reportPath = path.join(dir,'report.html'); fs.writeFileSync(reportPath, html);
    await page.setViewport({ width:900, height:900 });
    await page.goto(`file:///${reportPath.replace(/\\/g,'/')}`, { waitUntil:'networkidle0' });
    const pagination = new Module('anthropometry-pagination') as any;
    pagination._compile(ts.transpileModule(fs.readFileSync('src/lib/pdf/pagination.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText, 'anthropometry-pagination.js');
    await pagination.exports.prepararPaginacaoLaudo(page);
    const pageCount = await page.$$eval('.page', pages => pages.length);
    assert.ok(pageCount >= 4, `relatorio deveria ter ao menos 4 paginas, recebeu ${pageCount}`);
    assert.ok(pageCount <= 30, `relatorio excessivamente fragmentado: ${pageCount} paginas`);
    const overflows = await page.$$eval('.page', pages => pages.map((page, index) => ({ index, scroll:page.scrollHeight, client:page.clientHeight,
      bottom:Math.max(...[...page.children].map(child => child.getBoundingClientRect().bottom - page.getBoundingClientRect().top), 0),
      title:page.querySelector('.mod-title')?.textContent })).filter(item => item.bottom > 1066));
    assert.deepEqual(overflows, []);
    const pageLoads = await page.$$eval('.page', pages => pages.map(item => [...item.children].filter(child => !child.classList.contains('mod-head') && !child.classList.contains('pdf-footer')).length));
    const reportText = await page.$eval('body', element => element.innerText);
    assert.match(reportText, /Diametro bimaleolar/);
    assert.match(reportText, /MARTIN_OSSEO_1991/);
    assert.match(reportText, /Perimetros corrigidos/);
    assert.match(reportText, /Braco relaxado corrigido/);
    const renderedPages = await page.$$('.page');
    for (let index = 0; index < renderedPages.length; index++) {
      await renderedPages[index].screenshot({ path:path.join(dir, `report-page-${String(index + 1).padStart(2, '0')}.png`) });
    }
    for (const [name, index] of [['first', 0], ['middle', Math.floor(pageCount / 2)], ['last', pageCount - 1]] as const) {
      await renderedPages[index].screenshot({ path:path.join(dir, `report-${name}.png`) });
    }
    await page.screenshot({ path:path.join(dir,'report.png'), fullPage:true });

    const row = { ...legacyProjection(input, results), registro_v2:input, resultados_v2:results, revision_v2:3 };
    const evaluation:any = {
      id:'fixture-dashboard',data:'2026-09-28',status:'finalizada',tipo:'Diagnostico completo',antropometria:row,
      modulos_selecionados:{antropometria:true},scores:{global:82,composicao_corporal:80},analises_ia:{},
    };
    const panelMarkup = renderToStaticMarkup(React.createElement(PatientDashboard, {
      paciente:{nome:'Andre Felipe Teixeira Canuto',sexo:'M',data_nascimento:'1990-01-01'},
      avaliador:{nome:'Andre Felipe Teixeira Canuto',conselho:'CREF teste'},avaliacoes:[evaluation],pdfBaseUrl:'/api/pdf?avaliacaoId=',
    }));
    const panelPath = path.join(dir,'panel.html');
    fs.writeFileSync(panelPath, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="styles.css"><style>*{box-sizing:border-box}body{margin:0;background:#f1f5f9;font-family:Arial,sans-serif}</style></head><body>${panelMarkup}</body></html>`);
    for (const width of [1440,768,390,320]) {
      await page.setViewport({width,height:900});
      await page.goto(`file:///${panelPath.replace(/\\/g,'/')}`, {waitUntil:'load'});
      const layout = await page.evaluate(() => ({
        docWidth:document.documentElement.scrollWidth,viewport:innerWidth,
        emptyText:document.body.innerText.trim().length === 0,
        overlay:Boolean(document.querySelector('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay')),
      }));
      assert.equal(layout.emptyText,false,`painel vazio em ${width}px`);
      assert.equal(layout.overlay,false,`overlay de erro em ${width}px`);
      assert.ok(layout.docWidth <= layout.viewport + 1,`overflow horizontal no painel em ${width}px: ${layout.docWidth}/${layout.viewport}`);
      await page.screenshot({path:path.join(dir,`panel-${width}.png`),fullPage:true});
      const anthropometry = await page.$('[aria-label="Resultados de Antropometria"]');
      assert.ok(anthropometry,`resultados antropometricos ausentes em ${width}px`);
      const anthropometryText = await anthropometry!.evaluate(element => element.textContent ?? '');
      assert.match(anthropometryText, /Perimetros corrigidos/);
      assert.match(anthropometryText, /Panturrilha maxima corrigida/);
      await anthropometry!.screenshot({path:path.join(dir,`panel-anthropometry-${width}.png`)});
      if (width === 320) {
        const box = await anthropometry!.boundingBox();
        assert.ok(box, 'dimensoes do painel antropometrico indisponiveis');
        const positions = [box!.y, box!.y + box!.height / 2, Math.max(box!.y, box!.y + box!.height - 900)];
        for (const [index, y] of positions.entries()) {
          await page.evaluate(top => window.scrollTo(0, top), y);
          await page.screenshot({path:path.join(dir,`panel-320-section-${index + 1}.png`)});
        }
      }
    }
    assert.deepEqual(errors, []);
    console.log(`Antropometria browser/PDF: 26 campos, mobile 320/390/768, salvamento e relatorio paginado em ${pageCount} paginas aprovados. Blocos: ${pageLoads.join('/')}.`);
  } finally {
    await browser.close(); await new Promise<void>(resolve => server.close(() => resolve()));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
