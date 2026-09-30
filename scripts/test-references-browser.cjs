const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const puppeteer = require('puppeteer');
async function main() {
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const page = await browser.newPage();
    const results = [];
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewport({ width, height: 900 });
      await page.goto('file:///' + path.resolve('tmp/references/portal.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
      const bounds = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, references: document.querySelectorAll('[data-reference-id]').length }));
      assert(bounds.scrollWidth <= width + 1, `Portal overflow at ${width}`);
      assert(bounds.references > 0);
      await page.$eval('[data-reference-id]', el => el.scrollIntoView());
      await page.screenshot({ path: `tmp/references/portal-${width}.png` });
      results.push(bounds);
    }
    await page.setViewport({ width: 794, height: 1123 });
    await page.goto('file:///' + path.resolve('tmp/references/all-modules.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    const pagination = new Module('pagination');
    pagination._compile(ts.transpileModule(fs.readFileSync('src/lib/pdf/pagination.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText, 'pagination.js');
    await pagination.exports.prepararPaginacaoLaudo(page);
    const overflow = await page.$$eval('[data-reference-id]', refs => refs.filter(ref => {
      const page = ref.closest('.page');
      const limit = page.querySelector('.pdf-footer')?.getBoundingClientRect().top ?? page.getBoundingClientRect().bottom;
      return ref.getBoundingClientRect().bottom > limit || ref.scrollWidth > ref.clientWidth + 1;
    }).map(ref => ref.dataset.referenceId));
    assert.deepEqual(overflow, [], 'References overlap footer or exceed width');
    const pages = await page.$$('.ref-section');
    let referencesPages = 0;
    for (const section of pages) {
      if (!await section.$('[data-reference-id]')) continue;
      await section.screenshot({ path: `tmp/references/pdf-${++referencesPages}.png` });
    }
    console.log(JSON.stringify({ ok: true, portal: results, referencesPages, overflow }, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
