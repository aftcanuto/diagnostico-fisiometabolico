const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const puppeteer = require('puppeteer');

const root = process.cwd();
const input = path.join(root, 'preview-laudo-full-smoke.html');
const outputDir = path.join(root, 'output', 'pdf');
const output = path.join(outputDir, 'relatorio-teste-completo-medfit.pdf');

function localBrowserPath() {
  return [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].filter(Boolean).find((candidate) => fs.existsSync(candidate));
}

async function main() {
  if (!fs.existsSync(input)) throw new Error('Preview completo ausente. Rode npm run test:full antes do export.');
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: localBrowserPath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.goto(`file:///${input.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0', timeout: 45000 });

    const pagination = new Module('pagination');
    pagination._compile(ts.transpileModule(
      fs.readFileSync(path.join(root, 'src', 'lib', 'pdf', 'pagination.ts'), 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
    ).outputText, 'pagination.js');
    await pagination.exports.prepararPaginacaoLaudo(page);

    const pages = await page.$$eval('.page', (elements) => elements.length);
    await page.pdf({
      path: output,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    const bytes = fs.statSync(output).size;
    if (bytes < 100000) throw new Error(`PDF gerado com tamanho inesperado: ${bytes} bytes`);
    console.log(JSON.stringify({ ok: true, output, pages, bytes }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
