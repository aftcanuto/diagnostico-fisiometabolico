const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
const puppeteer = require('puppeteer');

async function main() {
  const bundle = await esbuild.build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {AdicionarModulos} from './src/components/AdicionarModulos';
      createRoot(document.getElementById('root')).render(<AdicionarModulos avaliacaoId="fixture" modulos={{anamnese:true}} status={window.testStatus || 'em_andamento'}/>);`,
      loader: 'tsx', resolveDir: process.cwd() },
    bundle: true, write: false, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [{ name: 'router-fixture', setup(build) {
      build.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: 'router', namespace: 'fixture' }));
      build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const useRouter=()=>({push:url=>window.destination=url,refresh:()=>{}});' }));
    } }],
  });
  const cssDir = '.next/static/css';
  const css = fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).map(f => fs.readFileSync(path.join(cssDir, f), 'utf8')).join('\n');
  fs.mkdirSync('tmp/add-modules', { recursive: true });
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    async function render(status = 'em_andamento', failure = false) {
      await page.goto('about:blank');
      await page.setContent(`<style>${css}</style><main style="padding:16px;max-width:1100px;margin:auto"><div id="root"></div></main>`);
      await page.evaluate((status, failure) => {
        window.testStatus = status; window.destination = ''; window.requests = [];
        window.fetch = async (url, options) => {
          window.requests.push({ url, body: JSON.parse(options.body) });
          return { ok: !failure, json: async () => failure ? { error: 'Falha de teste' } : { ok: true } };
        };
      }, status, failure);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
    }
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewport({ width, height: 900 });
      await render();
      await page.waitForSelector('[aria-controls="adicionar-modulos"]');
      await page.click('[aria-controls="adicionar-modulos"]');
      await page.waitForSelector('input[type=checkbox]');
      assert.equal(await page.$$eval('input[type=checkbox]', els => els.length), 11);
      assert(await page.$eval('#adicionar-modulos button', el => el.disabled));
      await page.evaluate(() => [...document.querySelectorAll('label')].find(e => e.textContent.includes('Jump Test')).querySelector('input').click());
      await page.screenshot({ path: `tmp/add-modules/${width}.png`, fullPage: true });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.click('#adicionar-modulos button');
      await page.waitForFunction(() => window.destination.endsWith('/jump-test'));
      assert.deepEqual(await page.evaluate(() => window.requests[0].body), { modulos: ['jump_test'] });
    }
    await render('em_andamento', true);
    await page.waitForSelector('[aria-controls]'); await page.click('[aria-controls]');
    await page.click('input[type=checkbox]'); await page.click('#adicionar-modulos button');
    await page.waitForSelector('[role=alert]');
    assert.equal(await page.evaluate(() => window.destination), '');
    await render('finalizada');
    await page.waitForSelector('[aria-controls]'); await page.click('[aria-controls]');
    assert.equal(await page.$('input[type=checkbox]'), null);
    assert(await page.$('form[action="/api/avaliacoes/fixture/reabrir"]'));
    assert.deepEqual(errors, []);
    console.log('Browser OK: 320/390/768/1280, selection, disabled empty action, save/open, error and finalized state. Isolated fixtures only.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
