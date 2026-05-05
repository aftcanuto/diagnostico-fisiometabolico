export async function prepararPaginacaoLaudo(page: any) {
  await page.evaluate(() => {
    const PX_POR_MM = 96 / 25.4;
    const ALTURA_UTIL = Math.floor(286 * PX_POR_MM) - 6;

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
            'padding:4px 10px',
            'border-radius:999px',
            'background:#f1f5f9',
            'border:1px solid #e2e8f0',
            'color:#64748b',
            'font-size:10px',
            'font-weight:800',
            'letter-spacing:.6px',
            'text-transform:uppercase',
          ].join(';');
          const titulo = clone.querySelector('.mod-title');
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
      pageSection.appendChild(prepararCabecalho(header, continuacao));
      return pageSection;
    }

    const secoes = Array.from(document.querySelectorAll('section.page')).filter(ehModuloPaginavel) as HTMLElement[];

    for (const section of secoes) {
      if (section.scrollHeight <= ALTURA_UTIL) continue;

      const header = section.querySelector(':scope > .mod-head');
      if (!header) continue;

      const filhos = Array.from(section.children).filter(child => child !== header);
      const paginas: HTMLElement[] = [];
      let atual = novaPagina(section, header, false);
      section.parentNode?.insertBefore(atual, section);
      paginas.push(atual);

      for (const child of filhos) {
        atual.appendChild(child);
        if (atual.scrollHeight > ALTURA_UTIL && atual.children.length > 2) {
          atual.removeChild(child);
          atual = novaPagina(section, header, true);
          section.parentNode?.insertBefore(atual, section);
          paginas.push(atual);
          atual.appendChild(child);
        }
      }

      section.remove();
    }
  });
}
