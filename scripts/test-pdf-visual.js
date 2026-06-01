const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');

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
          const top = rect.top + window.scrollY;
          const bottom = rect.bottom + window.scrollY;
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
            text: String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          };
        })
        .filter((item) => item.height > 24 && item.height < PAGE_HEIGHT * 0.85)
        .filter((item) => item.topPage !== item.bottomPage || item.localBottom > FOOTER_SAFE_TOP)
        .slice(0, 12);

      const pages = document.querySelectorAll('.page').length;
      const overflowPages = Array.from(document.querySelectorAll('.page'))
        .map((el, index) => ({ index: index + 1, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }))
        .filter((item) => item.scrollHeight > item.clientHeight + 4);

      return {
        badImages,
        hasFooterData,
        cutCards,
        overflowPages,
        pages,
      };
    });

    const errors = [];
    if (result.badImages.length) errors.push('Imagem quebrada no preview do PDF');
    if (!result.hasFooterData) errors.push('Dados de rodape do PDF ausentes');
    if (result.cutCards.length) errors.push('Cards ou blocos atravessando area de quebra/rodape');

    if (errors.length) {
      fail('Teste visual do PDF encontrou problemas', {
        errors,
        badImages: result.badImages,
        cutCards: result.cutCards,
        overflowPages: result.overflowPages,
      });
    }

    console.log(JSON.stringify({
      ok: true,
      pages: result.pages,
      badImages: 0,
      cutCards: 0,
      overflowPages: result.overflowPages.length,
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => fail(error?.message || 'Falha no teste visual do PDF'));
