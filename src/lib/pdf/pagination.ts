export async function prepararPaginacaoLaudo(page: any) {
  await page.evaluate(() => {
    const PX_POR_MM = 96 / 25.4;
    const ALTURA_PAGINA = Math.floor(297 * PX_POR_MM);
    const LIMITE_CONTEUDO = ALTURA_PAGINA - 58;

    function alturaConteudo(el: HTMLElement) {
      return Array.from(el.children).reduce((max, child) => {
        const item = child as HTMLElement;
        if (item.classList.contains('pdf-footer')) return max;
        const st = window.getComputedStyle(item);
        const mb = Number.parseFloat(st.marginBottom || '0') || 0;
        return Math.max(max, item.offsetTop + item.offsetHeight + mb);
      }, 0);
    }

    function ehModuloPaginavel(section: Element) {
      return section.classList.contains('module')
        && !section.classList.contains('cover')
        && !section.classList.contains('ref-section');
    }

    function prepararCabecalho(header: Element, continuacao: boolean) {
      const clone = header.cloneNode(true) as HTMLElement;
      clone.style.breakAfter = 'avoid';
      clone.style.pageBreakAfter = 'avoid';
      clone.style.marginBottom = continuacao ? '18px' : clone.style.marginBottom;

      if (continuacao) {
        clone.style.opacity = '0.78';
        clone.style.background = 'linear-gradient(90deg, rgba(248,250,252,.92), rgba(255,255,255,0))';
        clone.style.borderRadius = '10px';
        clone.style.paddingLeft = '12px';
        clone.style.boxShadow = '0 10px 28px rgba(15,23,42,.05)';

        const titulo = clone.querySelector('.mod-title') as HTMLElement | null;
        if (titulo) {
          titulo.style.color = '#334155';
          titulo.style.textShadow = '0 1px 0 #fff';
        }

        if (!clone.querySelector('[data-continuacao="true"]')) {
          const tag = document.createElement('span');
          tag.dataset.continuacao = 'true';
          tag.textContent = 'continuação';
          tag.style.cssText = [
            'margin-left:10px',
            'padding:2px 8px',
            'border-radius:999px',
            'background:#f8fafc',
            'border:1px solid #edf2f7',
            'color:#64748b',
            'font-size:8.5px',
            'font-weight:600',
            'font-style:italic',
            'letter-spacing:.3px',
            'text-transform:none',
            'opacity:.68',
          ].join(';');
          titulo?.appendChild(tag);
        }
      }

      return clone;
    }

    function novaPagina(base: HTMLElement, header: Element, continuacao: boolean) {
      const pageSection = document.createElement('section');
      pageSection.className = base.className;
      pageSection.setAttribute('style', base.getAttribute('style') ?? '');
      pageSection.classList.add('pdf-page-fragment');
      pageSection.style.minHeight = '297mm';
      pageSection.style.height = '297mm';
      pageSection.style.overflow = 'hidden';
      pageSection.style.paddingBottom = '70px';
      pageSection.appendChild(prepararCabecalho(header, continuacao));
      return pageSection;
    }

    function montarBlocos(section: HTMLElement, header: Element) {
      const filhos = Array.from(section.children).filter(child => child !== header && !(child as HTMLElement).classList.contains('pdf-footer'));
      const blocos: HTMLElement[] = [];
      let i = 0;

      while (i < filhos.length) {
        const child = filhos[i] as HTMLElement;

        if (child.classList.contains('sec-sub')) {
          const grupo = document.createElement('div');
          grupo.className = 'pdf-keep-group';
          grupo.style.cssText = [
            'break-inside:avoid',
            'page-break-inside:avoid',
            'margin:0 0 14px',
          ].join(';');
          grupo.appendChild(child);
          i += 1;

          while (i < filhos.length) {
            const prox = filhos[i] as HTMLElement;
            if (prox.classList.contains('sec-sub') || prox.classList.contains('ai-box')) break;
            grupo.appendChild(prox);
            i += 1;
          }

          blocos.push(grupo);
          continue;
        }

        blocos.push(child);
        i += 1;
      }

      return blocos;
    }

    const secoes = Array.from(document.querySelectorAll('section.page')).filter(ehModuloPaginavel) as HTMLElement[];

    for (const section of secoes) {
      if (alturaConteudo(section) <= LIMITE_CONTEUDO) continue;

      const header = section.querySelector(':scope > .mod-head');
      if (!header) continue;

      const filhos = montarBlocos(section, header);
      let atual = novaPagina(section, header, false);
      section.parentNode?.insertBefore(atual, section);

      for (const child of filhos) {
        atual.appendChild(child);
        if (alturaConteudo(atual) > LIMITE_CONTEUDO && atual.children.length > 2) {
          atual.removeChild(child);
          atual = novaPagina(section, header, true);
          section.parentNode?.insertBefore(atual, section);
          atual.appendChild(child);
        }
      }

      section.remove();
    }

    const footerLeft = document.body.getAttribute('data-footer-left') ?? '';
    const footerCenter = document.body.getAttribute('data-footer-center') ?? '';
    const footerRight = document.body.getAttribute('data-footer-right') ?? '';
    const paginasComRodape = Array.from(document.querySelectorAll('section.page:not(.cover)')) as HTMLElement[];
    const total = paginasComRodape.length;

    paginasComRodape.forEach((sec, index) => {
      sec.querySelectorAll(':scope > .pdf-footer').forEach((old) => old.remove());

      const footer = document.createElement('div');
      footer.className = 'pdf-footer';

      const main = document.createElement('div');
      main.className = 'pdf-footer-main';
      main.textContent = [footerLeft, footerCenter, footerRight].filter(Boolean).join('   •   ');

      const pagina = document.createElement('div');
      pagina.className = 'pdf-footer-page';
      pagina.textContent = `${index + 1}/${total}`;

      footer.appendChild(main);
      footer.appendChild(pagina);
      sec.appendChild(footer);
    });
  });
}
