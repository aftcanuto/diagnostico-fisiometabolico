const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const Module = require('node:module');
const ts = require('typescript');

const root = process.cwd();
const previewPath = path.join(root, 'preview-laudo-full-smoke.html');

function localBrowserPath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function fail(message, details = {}) {
  console.error(JSON.stringify({ ok: false, message, ...details }, null, 2));
  process.exit(1);
}

async function main() {
  if (!fs.existsSync(previewPath)) {
    fail('Preview completo do laudo nao encontrado. Rode npm run test:full antes do teste visual.', {
      file: previewPath,
    });
  }

  const executablePath = localBrowserPath();
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.goto(`file://${previewPath.replace(/\\/g, '/')}`, {
      waitUntil: 'networkidle0',
      timeout: 45000,
    });

    const pagination = new Module('pagination');
    pagination._compile(ts.transpileModule(fs.readFileSync(path.join(root, 'src/lib/pdf/pagination.ts'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText, 'pagination.js');
    await pagination.exports.prepararPaginacaoLaudo(page);

    const result = await page.evaluate(() => {
      const PAGE_HEIGHT = 1123;
      const FOOTER_SAFE_TOP = PAGE_HEIGHT - 72;
      const badImages = Array.from(document.images)
        .filter((img) => {
          const src = img.getAttribute('src') || '';
          if (!src || src.startsWith('#')) return false;
          return !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0;
        })
        .map((img) => ({
          alt: img.getAttribute('alt') || '',
          src: (img.currentSrc || img.getAttribute('src') || '').slice(0, 160),
        }));

      const hasFooterData =
        Boolean(document.body.dataset.footerLeft) ||
        Boolean(document.body.dataset.footerCenter) ||
        Boolean(document.body.dataset.footerRight) ||
        document.querySelectorAll('.pdf-footer').length > 0;

      const selectors = [
        '.pdf-keep-group',
        '.data-card',
        '.anam-card',
        '.kpi',
        '.section-card',
        '.photo-card',
        '.chart-card',
      ];

      const cutCards = Array.from(document.querySelectorAll(selectors.join(',')))
        .map((el) => {
          const rect = el.getBoundingClientRect();
          const section = el.closest('.page');
          const bounds = section?.getBoundingClientRect();
          const footer = section?.querySelector('.pdf-footer')?.getBoundingClientRect();
          const top = rect.top - (bounds?.top || 0);
          const bottom = rect.bottom - (bounds?.top || 0);
          const topPage = Math.floor(top / PAGE_HEIGHT);
          const bottomPage = Math.floor((bottom - 1) / PAGE_HEIGHT);
          const localBottom = bottom - topPage * PAGE_HEIGHT;
          return {
            tag: el.tagName.toLowerCase(),
            className: String(el.getAttribute('class') || '').slice(0, 140),
            height: Math.round(rect.height),
            top: Math.round(top),
            bottom: Math.round(bottom),
            topPage,
            bottomPage,
            localBottom: Math.round(localBottom),
            overlapsFooter: rect.bottom > (footer?.top ?? bounds?.bottom ?? Infinity) + 1,
            text: String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          };
        })
        .filter((item) => item.height > 24 && item.height < PAGE_HEIGHT * 0.85)
        .filter((item) => item.overlapsFooter)
        .slice(0, 12);

      const pageAudit = Array.from(document.querySelectorAll('.page')).map((el, index) => {
        const bounds = el.getBoundingClientRect();
        const footer = el.querySelector(':scope > .pdf-footer')?.getBoundingClientRect();
        const limit = footer?.top ?? bounds.bottom;
        const content = Array.from(el.children).filter(child => !child.classList.contains('pdf-footer'));
        const overflowing = content.filter(child => child.getBoundingClientRect().bottom > limit + 1);
        const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
        return {
          index:index + 1,
          title:el.querySelector('h1,h2,.mod-title')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100) ?? '',
          textLength:text.length,
          scrollHeight:el.scrollHeight,
          clientHeight:el.clientHeight,
          overflow:overflowing.map(child => ({ className:String(child.className).slice(0, 120), excess:Math.round(child.getBoundingClientRect().bottom - limit) })),
        };
      });
      const overflowPages = pageAudit.filter(item => item.overflow.length > 0);
      const emptyPages = pageAudit.filter(item => item.textLength < 20);
      const heightMismatches = pageAudit
        .filter(item => item.scrollHeight > item.clientHeight + 4)
        .map(({index,title,scrollHeight,clientHeight}) => ({index,title,scrollHeight,clientHeight}));
      const tractionCards = Array.from(document.querySelectorAll('.traction-test-card'));
      const tractionPages = new Set(tractionCards.map(card => card.closest('.page'))).size;

      return {
        badImages,
        hasFooterData,
        cutCards,
        overflowPages,
        pages:pageAudit.length,
        emptyPages,
        heightMismatches,
        tractionCards:tractionCards.length,
        tractionPages,
      };
    });

    const errors = [];
    if (result.badImages.length) errors.push('Imagem quebrada no preview do PDF');
    if (!result.hasFooterData) errors.push('Dados de rodape do PDF ausentes');
    if (result.cutCards.length) errors.push('Cards ou blocos atravessando area de quebra/rodape');
    if (result.overflowPages.length) errors.push('Conteudo direto ultrapassando o rodape');
    if (result.emptyPages.length) errors.push('Pagina vazia ou sem conteudo util');
    if (result.tractionCards >= 4 && result.tractionPages > Math.ceil(result.tractionCards / 2)) {
      errors.push('Dinamometria por tracao ocupa paginas demais para a quantidade de testes');
    }

    if (errors.length) {
      fail('Teste visual do PDF encontrou problemas', {
        errors,
        badImages: result.badImages,
        cutCards: result.cutCards,
        overflowPages: result.overflowPages,
        emptyPages: result.emptyPages,
      });
    }

    console.log(JSON.stringify({
      ok: true,
      pages: result.pages,
      badImages: 0,
      cutCards: 0,
      overflowPages: result.overflowPages,
      emptyPages: result.emptyPages,
      heightMismatches: result.heightMismatches,
      tractionCards: result.tractionCards,
      tractionPages: result.tractionPages,
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => fail(error?.message || 'Falha no teste visual do PDF'));
