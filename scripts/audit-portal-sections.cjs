const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require('puppeteer');

async function main() {
  const outputDir = path.resolve('tmp/jump-test');
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 900 });
    await page.goto(`file:///${path.resolve('preview-dashboard-cliente.html').replace(/\\/g, '/')}`, {
      waitUntil: 'networkidle0',
    });

    const labels = ['Termografia funcional', 'Antropometria', 'Jump Test', 'Referências'];
    for (const label of labels) {
      const found = await page.evaluate((text) => {
        const heading = [...document.querySelectorAll('h1,h2,h3,h4')]
          .find((element) => element.textContent?.trim() === text);
        heading?.scrollIntoView({ block: 'start' });
        return Boolean(heading);
      }, label);
      if (!found) throw new Error(`Seção não encontrada no portal: ${label}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const slug = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
      await page.screenshot({ path: path.join(outputDir, `portal-mobile-${slug}.png`) });
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
