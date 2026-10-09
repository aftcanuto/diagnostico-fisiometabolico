// Isolated browser fixture: actual component, mocked persistence, no patient data or live API.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const puppeteer = require('puppeteer');
const { execFileSync } = require('node:child_process');
const Module = require('node:module');
const ts = require('typescript');
async function main() {
  const dir = path.resolve('tmp/jump-test');
  const build = await esbuild.build({
    stdin: { contents: `import React, {Suspense} from 'react'; import {createRoot} from 'react-dom/client'; import Page from './src/app/(app)/avaliacoes/[id]/jump-test/page'; const params=Promise.resolve({id:'00000000-0000-0000-0000-000000000001'}); createRoot(document.getElementById('root')).render(<Suspense fallback="Carregando"><Page params={params}/></Suspense>);`, loader: 'tsx', resolveDir: process.cwd() },
    bundle: true, write: false, platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'mock-supabase', setup(build) {
      build.onResolve({ filter: /^@\/lib\/supabase\/client$/ }, () => ({ path: 'mock-client', namespace: 'fixture' }));
      build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: `export function createClient(){return {from(){return {select(){return this},eq(){return this},async single(){return {data:{clinica_id:'fixture-clinic'},error:null}}}}}}` }));
    } }],
  });
  execFileSync(process.execPath, ['node_modules/tailwindcss/lib/cli.js', '-i', 'src/app/globals.css', '-o', path.join(dir, 'styles.css')], { stdio: 'pipe' });
  let saved = null, saves = 0;
  const server = http.createServer(async (req, res) => {
    if (req.url === '/bundle.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(build.outputFiles[0].text); }
    if (req.url === '/styles.css') { res.setHeader('Content-Type', 'text/css'); return res.end(fs.readFileSync(path.join(dir, 'styles.css'))); }
    if (req.url.startsWith('/api/modulos')) {
      res.setHeader('Content-Type', 'application/json');
      if (req.method === 'POST') { let body = ''; for await (const chunk of req) body += chunk; saved = JSON.parse(body).payload; saves++; return res.end('{"ok":true}'); }
      return res.end(JSON.stringify({ data: saved }));
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><main id="root" style="padding:20px;max-width:1200px;margin:auto"></main><script src="/bundle.js"></script>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = `http://127.0.0.1:${server.address().port}`;
  const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, executablePath });
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(address, { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    await page.evaluate(() => { const label = [...document.querySelectorAll('label')].find(l => l.textContent === 'Countermovement Jump (CMJ)'); label.querySelector('input').click(); });
    await page.evaluate(() => { const label = [...document.querySelectorAll('label')].find(l => l.textContent === 'Vertical Jump (VJ)'); label.querySelector('input').click(); });
    assert.equal(await page.$$eval('select[aria-label^="Status cmj"]', els => els.length), 3);
    assert.equal(await page.$$eval('select[aria-label^="Status vj"]', els => els.length), 3);
    assert.equal(await page.$eval('input[disabled][value*="VJ na cintura"]', el => el.value), 'Definida por protocolo: VJ na cintura; CMJ livres');
    assert.match(await page.$eval('body', el => el.innerText), /ciclo alongamento-encurtamento/);
    await page.type('[aria-label="cmj salto 1 altura_cm"]', '242');
    await page.select('[aria-label="Status cmj salto 1"]', 'valida');
    assert.match(await page.$eval('body', el => el.innerText), /muito elevados/);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Salvar Jump Test')).click());
    await page.waitForFunction(() => document.body.innerText.includes('Jump Test salvo.'));
    assert.equal(saves, 1); assert.equal(saved.tentativas[0].altura_cm, 242);
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await page.$eval('[aria-label="cmj salto 1 altura_cm"]', el => el.value), '242');
    await page.screenshot({ path: path.join(dir, 'desktop.png'), fullPage: true });
    for (const width of [320, 390, 768]) {
      await page.setViewport({ width, height: 844 });
      const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth && !e.closest('.overflow-x-auto')).map(e => e.tagName + '.' + e.className).slice(0, 8));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow at ${width}: ${overflow.join(',')}`);
      await page.screenshot({ path: path.join(dir, `mobile-${width}.png`), fullPage: true });
    }
    assert.deepEqual(errors, []);
    await page.setViewport({ width: 794, height: 1123 });
    await page.goto(`file:///${path.join(dir, 'laudo.html').replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
    const pagination = new Module('jump-pagination');
    pagination._compile(ts.transpileModule(fs.readFileSync('src/lib/pdf/pagination.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, 'jump-pagination.js');
    await pagination.exports.prepararPaginacaoLaudo(page);
    const overflowPages = await page.$$eval('.page.module', pages => pages.filter(p => [...p.children].filter(c => !c.classList.contains('pdf-footer')).some(c => c.getBoundingClientRect().bottom - p.getBoundingClientRect().top > 1066)).map(p => p.querySelector('h2')?.textContent));
    assert.deepEqual(overflowPages, [], 'Conteudo do Jump Test deve respeitar o rodape');
    const summaryPage = await page.$('.page.module');
    if (summaryPage) await summaryPage.screenshot({ path: path.join(dir, 'resumo-pdf.png') });
    await page.pdf({ path: path.join(dir, 'laudo.pdf'), format: 'A4', printBackground: true });
    await page.screenshot({ path: path.join(dir, 'laudo.png'), fullPage: true });
    assert.ok(await page.$$eval('.jump-trials', blocks => blocks.length >= 6));
    await page.goto(`file:///${path.join(dir, 'compact.html').replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
    await pagination.exports.prepararPaginacaoLaudo(page);
    const compactLayout = await page.$$eval('.jump-trials', blocks => ({ count: blocks.length, pages: new Set(blocks.map(block => [...document.querySelectorAll('.page')].indexOf(block.closest('.page')))).size }));
    assert.deepEqual(compactLayout, { count: 4, pages: 1 }, 'SJ, VJ, CMJ e DJ devem caber juntos em uma pagina');
    const compactSection = await page.$('.jump-trials');
    const compactPage = await compactSection.evaluateHandle(el => el.closest('.page'));
    await compactPage.asElement().screenshot({ path: path.join(dir, 'compact.png') });
    console.log('Jump Test browser: coleta, alerta, salvar/recarregar simulado, 320/390/768/1280 px e PDF aprovados.');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
