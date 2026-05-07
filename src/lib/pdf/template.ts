/**
 * PDF Template v4 â€” Baseado no design v0.dev
 * Gauges com gradiente completo + triÃ¢ngulo indicador
 * Layout: capa Â· resumo dark Â· mÃ³dulos white
 */

export interface ClinicaBranding {
  nome?: string; logo_url?: string | null; cor_primaria?: string;
  cor_gradient_1?: string; cor_gradient_2?: string; cor_gradient_3?: string;
  telefone?: string | null; email?: string | null;
  endereco?: string | null; site?: string | null; cnpj?: string | null;
}
export interface AnaliseIA {
  achados?: string[]; interpretacao?: string; riscos?: string[];
  beneficios?: string[]; recomendacoes?: string[]; alertas?: string[]; resumo_executivo?: string;
  pontos_fortes?: string[]; pontos_criticos?: string[];
  prioridades?: { titulo: string; acao: string; prazo: string }[];
  mensagem_paciente?: string; tendencias?: string[]; progressos?: string[];
  regressoes?: string[]; proximos_passos?: string[];
  texto_editado?: string | null;
}
export interface LaudoData {
  clinica?: ClinicaBranding | null;
  paciente: { nome: string; sexo: 'M' | 'F'; data_nascimento: string; idade: number; cpf?: string | null };
  avaliador: { nome: string; conselho?: string | null; especialidade?: string | null };
  avaliacao: { data: string; tipo: string };
  modulos: { anamnese?: boolean; sinais_vitais?: boolean; posturografia?: boolean; bioimpedancia?: boolean; antropometria?: boolean; forca?: boolean; flexibilidade?: boolean; cardiorrespiratorio?: boolean; rml?: boolean; biomecanica_corrida?: boolean };
  dados: { anamnese?: any; sinais_vitais?: any; posturografia?: any; bioimpedancia?: any; antropometria?: any; forca?: any; flexibilidade?: any; cardiorrespiratorio?: any; biomecanica_corrida?: any; rml?: any };
  scores: { global: number | null; postura: number | null; composicao_corporal: number | null; forca: number | null; flexibilidade?: number | null; cardiorrespiratorio: number | null; rml?: number | null };
  analisesIA?: Record<string, AnaliseIA & { texto_editado?: string | null }>;
  pdfConfig?: {
    protocolos?: { id: string; label: string; texto: string }[];
    referencias?: { id: string; texto: string }[];
    texto_legal?: string;
    nota_equipamentos?: string | null;
  } | null;
}

// â”€â”€â”€ Utils â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const x = (s: any) => s == null ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const xa = (s: any) => x(s).replace(/"/g,'&quot;');
const fd = (iso: string) => { try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return iso; } };
function limparTextoHTML(html: string): string {
  const pares: [string, string][] = [
    ['ÃƒÂ¡','á'], ['ÃƒÂ ','à'], ['ÃƒÂ¢','â'], ['ÃƒÂ£','ã'], ['ÃƒÂ©','é'], ['ÃƒÂª','ê'], ['ÃƒÂ­','í'], ['ÃƒÂ³','ó'], ['ÃƒÂ´','ô'], ['ÃƒÂµ','õ'], ['ÃƒÂº','ú'], ['ÃƒÂ§','ç'],
    ['Ã¡','á'], ['Ã ','à'], ['Ã¢','â'], ['Ã£','ã'], ['Ã©','é'], ['Ãª','ê'], ['Ã­','í'], ['Ã³','ó'], ['Ã´','ô'], ['Ãµ','õ'], ['Ã¶','ö'], ['Ãº','ú'], ['Ã§','ç'],
    ['Ã','Á'], ['Ã‰','É'], ['Ã','Í'], ['Ã“','Ó'], ['Ãš','Ú'], ['Ã‡','Ç'], ['Ã§','ç'],
    ['Â·','·'], ['Â°','°'], ['Âª','ª'], ['â€”','—'], ['â€“','–'], ['â‰¥','≥'], ['â†’','→'], ['âœ“','✓'], ['âš ',''], ['â±','Prazo:'], ['â‚‚','2'], ['â—€',''], ['â–¶',''],
    ['â¤ï¸',''], ['ðŸ§',''], ['âš–ï¸',''], ['ðŸ’ª',''], ['ðŸ¤¸',''], ['ðŸ’¬',''], ['ðŸ“‹',''], ['ðŸ”„',''],
    ['Ã¢â‚¬â€','—'], ['Ã¢â‚¬â€œ','–'], ['Ã‚Â·','·'], ['Ã‚Â°','°'],
  ];
  const limpo = pares.reduce((acc, [a, b]) => acc.split(a).join(b), html);
  return limpo.replace(/<!--[\s\S]*?-->/g, '');
}

function zoneColor(v: number | null) {
  if (v == null) return '#6b7280';
  if (v <= 40)   return '#ef4444';
  if (v <= 70)   return '#f59e0b';
  return '#10b981';
}
function zoneLabel(v: number | null) {
  if (v == null) return 'â€”';
  if (v <= 40)   return 'CrÃ­tico';
  if (v <= 70)   return 'AtenÃ§Ã£o';
  return 'Ã“timo';
}

// â”€â”€â”€ Gauge SVG â€” gradiente completo + triÃ¢ngulo indicador â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// FÃ³rmula do triÃ¢ngulo: rotation = (V - 100) * 1.8 graus em torno de (cx, cy)
// 0% â†’ -180Â°(esquerda), 50% â†’ -90Â°(topo), 100% â†’ 0Â°(direita)

function gauge(value: number | null, label: string, size: 'lg' | 'sm'): string {
  const isLg = size === 'lg';
  const vw = isLg ? 200 : 160;           // viewBox width
  const vh = isLg ? 170 : 142;           // viewBox height
  const W  = isLg ? '100%' : '100%';
  const cx = vw / 2, cy = isLg ? 104 : 84;
  const r  = isLg ? 80 : 64;
  const sw = isLg ? 14 : 11;             // stroke-width arco
  const tw = isLg ? 9  : 7;             // half-width triÃ¢ngulo
  const tl = isLg ? 14 : 11;            // comprimento triÃ¢ngulo
  const gid = `gg${isLg?'L':'S'}${value??'N'}`;

  const pct = Math.max(0, Math.min(100, value ?? 0));
  // TriÃ¢ngulo base na posiÃ§Ã£o das 3h (right), rotacionado para o valor
  const rot = (pct - 100) * 1.8;
  // Base do triÃ¢ngulo: borda externa do arco â†’ aponta para fora
  const rOuter = r + sw / 2 + 3;
  // VÃ©rtices do triÃ¢ngulo apontando para direita (antes da rotaÃ§Ã£o)
  const t1 = `${(cx + rOuter + tl).toFixed(1)},${cy}`;
  const t2 = `${(cx + rOuter).toFixed(1)},${(cy - tw).toFixed(1)}`;
  const t3 = `${(cx + rOuter).toFixed(1)},${(cy + tw).toFixed(1)}`;

  const col   = zoneColor(value);
  const lbl   = zoneLabel(value);
  const fsize = isLg ? 36 : 27;
  const lfsize = isLg ? 11 : 9;
  const needleLen = r - sw / 2 - 6;
  const needleRad = Math.PI * (1 - pct / 100);
  const nx = (cx + needleLen * Math.cos(needleRad)).toFixed(1);
  const ny = (cy - needleLen * Math.sin(needleRad)).toFixed(1);
  const bx1 = (cx + (isLg ? 7 : 5) * Math.cos(needleRad + Math.PI / 2)).toFixed(1);
  const by1 = (cy - (isLg ? 7 : 5) * Math.sin(needleRad + Math.PI / 2)).toFixed(1);
  const bx2 = (cx + (isLg ? 7 : 5) * Math.cos(needleRad - Math.PI / 2)).toFixed(1);
  const by2 = (cy - (isLg ? 7 : 5) * Math.sin(needleRad - Math.PI / 2)).toFixed(1);

  return `<div style="text-align:center">
<svg viewBox="0 0 ${vw} ${vh}" style="width:${W};display:block" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#ef4444"/>
      <stop offset="25%"  stop-color="#f97316"/>
      <stop offset="50%"  stop-color="#eab308"/>
      <stop offset="75%"  stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <filter id="${gid}sh" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0f172a" flood-opacity=".18"/>
    </filter>
  </defs>
  <!-- trilho -->
  <path d="M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}" fill="none" stroke="#0f172a" stroke-width="${sw+5}" stroke-linecap="round" opacity=".9"/>
  <path d="M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}" fill="none" stroke="#e2e8f0" stroke-width="${sw+1}" stroke-linecap="round"/>
  <!-- arco colorido completo -->
  <path d="M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}" fill="none" stroke="url(#${gid})" stroke-width="${sw}" stroke-linecap="round" filter="url(#${gid}sh)"/>
  <path d="M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}" fill="none" stroke="#ffffff" stroke-width="${Math.max(2, sw*.28)}" stroke-linecap="round" opacity=".48"/>
  <!-- ticks 0 25 50 75 100 -->
  ${[0,25,50,75,100].map(t => {
    const rad = Math.PI * (1 - t/100);
    const xi = (cx + (r+sw/2+3) * Math.cos(rad)).toFixed(1);
    const yi = (cy - (r+sw/2+3) * Math.sin(rad)).toFixed(1);
    return `<line x1="${xi}" y1="${yi}" x2="${(cx+(r+sw/2+8)*Math.cos(rad)).toFixed(1)}" y2="${(cy-(r+sw/2+8)*Math.sin(rad)).toFixed(1)}" stroke="#374151" stroke-width="1.5"/>
`;
  }).join('')}
  <!-- triÃ¢ngulo indicador -->
  ${value != null ? `<polygon points="${bx1},${by1} ${bx2},${by2} ${nx},${ny}" fill="#0f172a" filter="url(#${gid}sh)"/>
  <polygon points="${t1} ${t2} ${t3}" fill="${col}" transform="rotate(${rot.toFixed(2)},${cx},${cy})" filter="url(#${gid}sh)"/>
  <circle cx="${cx}" cy="${cy}" r="${isLg?9:7}" fill="#fff" stroke="#cbd5e1" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="${isLg?4:3}" fill="#0f172a"/>` : ''}
</svg>
<div style="font-size:${fsize}px;font-weight:900;line-height:1;color:${col};margin-top:${isLg?'-10px':'-8px'}">${value ?? 'â€”'}</div>
<div style="font-size:${isLg?11:10}px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:2px">${x(label)}</div>
<div style="display:inline-block;margin-top:5px;padding:3px 12px;border-radius:100px;font-size:${isLg?11:10}px;font-weight:600;background:${col}22;color:${col}">${lbl}</div>
</div>`;
}

// â”€â”€â”€ Silhueta (estilo v0 â€” gradient fill, clean proportions) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


// â”€â”€â”€ Silhuetas prÃ©-renderizadas (PNG base64, geradas por IA) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SIL_M: Record<number,string> = {
  0: 'data:image/png;base64,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',
  1: 'data:image/png;base64,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',
  2: 'data:image/png;base64,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',
  3: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAb4AAAKxCAYAAAAsM8mhAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAABHb0lEQVR4nO3df3RV5b3v+08FLhASQzwMvW69bL3cOjz1eOpx1O2tx9seWkmgVmultt22CritNWARCD/8scEttaKA/Q20EFASi2CwRSBoE90ce9z2cO3h0OtxHze9DB0M3Q4dXANFU0Ig8/6xEg0xP9ac65nzO+cz368xMiRkrTk/hmR91zPn83wfCQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQziesAyBfuu6770ZJEyUdkTRB0icljZN0hqQRfR5+VNL7kt6T9M+SXjjt/vtXJZcWgI8ofIhV13331Uq6QdKnJJ3l8NCHJO2RtO20+++vd3hcAJ6j8CEWXUuWbJU0NcFTNkvadNrSpZsSPCeADKLwwZmuJUtuk3SRpNskjTKKsV/SwdOWLp1kdH4AKUfhgxNdS5b8VtIxSddaZ+m2T9Kzpy1derd1EADpQuFDSbqWLLlHhVHejdZZBvCCpEdPW7p0o3UQAOlA4UNkXUuWLJN0l3WOIu0+benSL1iHAGCPwofQupYsqZY0Tekd5Q2kUdK7py1dOt86CAA7FD6E0l301kkab50lov2S/iCp/rSlS3dbhwGQvOHWAZAdXUuWPCDpXuscJbqg+6NMEoUPyCFGfChK15IlrZKuUKFg+OLgaUuX/rV1CADJOs06ANKva8mSxZKulF9FT5LGdy1ZstM6BIBkMeLDoLqWLLlG0mMq9NL01b7Tli79D9YhACSDER8GFwR3KQjOUBDI449LuhYvfsL6Ww0gGRQ+DKhr8eJ/UuG+Xh58s2vx4lnWIQDEj8KHfnUtXvxb5afo9VhoHQBA/Ch8+JiuxYuvk3S5dQ4D47sWL37AOgSAeFH40J9vSKq0DmHkKusAAOJF4cMpuhYv/kdJF1rnMHR51+LF11iHABAfCh/6ek3SJdYhjGWl8TaACCh8+FDX4sU/U6H5dN7lbVIPkCsUPvTmW0uyyLoWL55jnQFAPCh8kCR1LV48TVK5dY4UmWgdAEA8KHzoUavCrgUouNg6AIB4UPjQg0ucpzqf2Z2An9iPD+r6+7+/T0FwpnWOFLpI0g7rEADcYsQHnfbAA/dL2mOdI4U+bR0AgHsUPqjr7//+BkmXWudIoTwv5Ae8ReGDVNhk9lzrECl0iXUAAO5R+CAx2gOQIxQ+SNI46wAAkBQKHyR+DgDkCC94kKT3rQMAQFIofJCk96wDpNRR6wAA3GMBOxQwuWUgI6wDAHCPER8kFq8PpMs6AAD3GPFBCoJO6wgpRf9SwEOM+CBJB6wDpNRe6wAA3KPwQcN+8IN51hlS6vvWAQC4R+FDj0brACl0g3UAAO5R+KCT9967UtJN1jlS6MaT9967yzoEALc+YR0Atk7ee+9PJM22zpFyzw37wQ8mWYcA4AYjvhw7ee+9E0XRK0bFyXvv5fsEeILCl2+/tQ6QEZdL+gnFD/ADhS+nTt5779WiM0lYd3WPkgFkGIUvvx6wDpBBZ0v6hXUIAKWh8OXXJdYBMuqCk/feW20dAkB0FL4cOnnvvbXWGTKO7x+QYfTqzKMg4D5VaT5rHQBAdIz48uk86wAZd9bJe+5ZaR0CQDQUvnxiN4bSnWcdAEA0FL58OsM6gAcmWAcAEA2FL2dO3nPPNZKqrHN44JKT99xDE2sggyh8+TNMLFx35WzrAADCo/DlT7ukI9YhPDHSOgCA8Ch8OTPswQdbJL1lncMT7dYBAIRH4cunt60DeOKQdQAA4VH48olLnW68bx0AQHgUvnwaZx3AA+8Me/DBZusQAMKjZVkeBcEeSddZx8i4P1gHABANI74cGrZs2UOS3rHOkXHbrAMAiIbCl19d1gEy7LVhy5bVW4cAEA2FL792WwfIsL3WAQBER+HLr3pJ71mHyKDXJLVYhwAQHYUvp4YtW7Zb0h7rHFk0bNmyjdYZAERH4cu3gyqMYFCcvWI7IiDzKHw5NmzZstsl7RcL2ovxkqTXhy1bNto6CIDSUPhybtiyZV9RYeSHgW1XoS8nMzkBD3zCOgDS4eTddz8t6VrrHCl0QNILw5Yt+zvrIADcYMQHSR+O/J6yzpFCeyh6gF8ofPjQsGXLvibpGescKbPNOgAAt+jViVMFwfOSpljHSJFK6wAA3GLEBwzuausAANyi8KGvS60DpAztyQDPUPjQ1yetA6QMexcCnqHwoa9O6wApU2UdAIBbFD70RReXU51lHQCAW8zqxCkC6V3rDClTbh0AgFuM+NDX69YBUmaUdQAAblH40NcB6wApM8I6AAC3KHw4xfCHHnpc3OcD4DEKH/rDbg0fYZYr4Bkmt+AUJxYt+raC4AVJF1tnSQku/QKeYcSHUwx/+OHHJQ2zzpEi9OoEPEPhQ3/OtA6QImXWAQC4ReFDf2jT9RHeBACeofChP29bB0iRC6wDAHCLwof+NFsHAIC4UPjwMd0TXFjSUPCadQAAblH4MBBalxXsP7Fo0X+2DgHAHQofPubEokW3ih6VPa6VdOTEokUPWAcB4MYnrAMgnU4sWvTfxG7sfW2TdHT4ww/fbB0EQHQUPpzixKJFyyRdJ+lC4yhpdlTSP0t6ZPjDDzdZhwEQDoUPkqQTixb9qwo7ERwSRS+Mk5L2Sto2/OGHH7QOA2BoFL4cO7Fw4dWSGiS1SPqmcRxfvCTpRUnvDl++/BHrMAA+jsKXMycWLvyipFslXSnpd5JutE3ktU5J2yXtGL58+UbrMAAKKHw5cWLhwscknSdpvKTzTcPk0zYVLovuHr58+SrjLECuUfg8dmLhwsWSZovem2myT4WWcE3Dly9/1DgLkEsUPo+cWLjwGkk3qNBfcpykCbaJUIRfSnp2+PLl26yDAHlB4fPAiYULn5Z0hQp7x40wjoNoDqowO3Tv8OXLv28dBvAZhS+jTixc+IAKI7sJYqG5b/ZIOlvS9uHLl3/POgzgGwpfhpxYuPDbKszGPEuFRebw35uShknaM3z58q9ahwF8QOFLuRMLF06UVKfChqijJF1smwiG2lWYHHNk+PLlXzLOAmQWhS+lTixc2KrCO/1PqTDCA/o6Junx4cuXf8c6CJAlFL6U6F5YfrkKk1QmiLZhCOc1FTrGbB++fPkO6zBAmlH4jJ1YsOCHki5RYYuoz9umgScOqDBBpmn4ihXbjLMAqUPhM3BiwYLZkr4t6VwVZu8BcTkg6YXhK1b8nXUQIC0ofAk6sWDBL1SYlXmRdRbkzosq3BP84/AVK+ZbhwEsUfhidmLBgmskTVVhksplxnEAqdA4+43hK1bcaR0EsEDhi8GJBQv+SYWNSq8WlzKRXi9J6pK0efiKFTTORm5Q+BzpHtndIumzYvkBsqVT0nOSdg9fsWKFdRggbhS+Ep1YsOAnkj6nwn07+mQiy96T9HtJrwxfseJu6zBAXCh8EZxYsOC/qzBbbphoHQY/HZX04PAVKx6yDgK4RuEL4cSCBTtV2AFhfPcH4LuXJTUPX7HifusggCsUviKcWLBgvQqLy9nfDnn0pqRXJK0avmJFs3UYoFQUvkGcWLDgf0pqVqFJNJB3LZLeGb5ixc3WQYBSUPj6cWLBglslXSPpKkllxnGAtPnR8BUr5lmHAKKi8PVxYv78/yE6qwBD2Sxp9/CVK9daBwHCovB1OzF//ixJ94oF50AY24avXMkGucgUCp+kE/Pnr5M0Q4XlCQDCeW74ypWTrEMAxcp94evk0ibgwjMjVq5kV3hkQq4LX+f8+b+VVG2dA/DEgRErV/4f1iGAoeS28HXOn/+ACvf0ALizUVLTiJUrWe+H1Mpl4eucP3+GpA3WOQBP7Za0YcTKlY9bBwH6k7vCx0gPSMzyEStXLrIOAfSVq8LXOX/+zyTdYZ0DyJEvjFi5crd1CKC306wDJKVz/vydougBSVtpHQDoKxeFr3P+/PUq7IYOIFmXds6fv8s6BNCb95c6O+vq/lHSROscQM49N+KRR1jkjlTwuvB11tX9F0lXWucAIEl6acQjj/xH6xCAt5c6O+vqfivpM9Y5AHzois66un+yDgF4Wfg66+qmqdBsepR1FgCnuKKzru4n1iGQb94Vvs66uqslzZZ0sXUWAP2a3f3mFDDhXeGTdJukS61DABjUzzrr6q6xDoF88qrwddbV7ZR0rXUOAEOqkDTXOgTyyZvC1130WKsHZMdE7vfBgheFr7Ou7h5R9IAsmtFZV/eYdQjkixeFT1KtdQAAkVRIarcOgXzJfOHrrKv7haRzrXMAiKy2s67uX6xDID8yXfg66+r+s6TvGscAULoLOuvqVluHQD4Mtw4QVee8eV9UEFRa5wDgTLV1AORDlkd810m6xDgDAHcmdM6b94/WIeC/TBa+znnzHhZ76wE+mtg5b94y6xDwW+YKX+e8edMkXWSdA0Bs2FEFscpc4ZP0WbFmD/DZlZ3z5q23DgF/Zarwdc6b999UuLcHwG/Xds6bRy9PxCJThU/SHklnWYcAELtxkljegFhkZgf2znnzjksaYZ0DQKJuGfHDHz5qHQJ+ydKI7ynrAAASRztCOJeJwtc5b97Tkr5pnQNA4i7rnDdvqXUI+CX1ha9z3ry7JE20zgHADJNc4FT6W5YFwZUqdHAHkE+XdM6dO2fEj370Y+sg8EOqR3ydc+c+IdbsAZAutg4Af6S68El61zoAgFS4pXPu3IetQ8APqS18nXPnTpY02zoHgNRg1AcnUlv4JNVZBwCQKlM65869zzoEsi+Vha9z7tzHJF1lnQNA6vC6gJKlsvBJOsc6AIBUurxz7tzrrUMg21JX+Drnzm0V7+oA9G+EpB9Zh0C2pa7wSaq0DgAg1To7585lmRMiS1Xh65w7d53YZBbA4CZIWmcdAtmVqsKnwlYkZdYhAKQeO7UgsrQVPia1ACjGuM65cx+wDoFsSk2vzuNz5vwiCILLrHMAyIwrrQMgm9I04htvHQBAppx7fM6cydYhkD2pKHzH58xZJmmKdQ4AmTJBtDVEBKkofGK0ByCaM6wDIHvSUvjoxAAgisuPz5nzmHUIZIt54Ts+Z84uSaOscwDIrM9ZB0C2mBc+sbs6gNK8fXzOHDq5oGimhe/4nDnrJV1umQFA5l0h6YfWIZAd1iO+y0UHBgCle8s6ALLDuvAxmxOACxOPz5nzbesQyAazwnd8zpxacX8PgDvftA6AbLBrWRYEy8zODcBHx6wDIBssL3Wy7x4Al648fued91mHQPqZFL7jd9650uK8ALx2lqRrrUMg/axGfKy5ARCHQ9YBkH5Wha/c6LwA/FZ9/M4777IOgXSzKnxHjM4LwH9ftA6AdEu88B2/884HJF2U9HkB5Mal1gGQbhYjvisMzgkgP844fued7NOHAVkUPutuMQD8d411AKSXRRGiNyeAuE2wDoD0SrTwHb/zzlniUieA+J1//M47b7UOgXRKesR3VcLnA5BfXO5Ev5Lt1RkEJxM9H4A847YK+pX0iI/+nACSMuX47NnV1iGQPkkXvvMTPh+AfJtsHQDpk1jhOz579jViphWAZPGag49JcsRHtxYASbvYOgDSJ8nCd3aC5wIASTr/+OzZbIOGUyRZ+JhhBcDCZ6wDIF1oHwbAd+zRh1MkWfhYygDAAhtf4xRJFj5mVwGwMMo6ANIlkcJ3fPbs2yRdnsS5AKCv47Nn11pnQHok07IsCC5L5DwA0L9qSWusQyAdkrrUeV5C5wGA/nDFCR9KqvBxjR2AJdYR40NJFb7OhM4DAMCgkip87QmdBwD6dfx736uzzoB0oPAByAuWVEFScoWvPKHzAMBAaF0GSckVPrq2ALDG6xAkMasTQH7wOgRJCS1gD2iGDcDeeOsASIekCtKwhM4DAMCgkip87MUHwFzH9743xzoD7MV+qbPjjjuuVhCMjPs8AFAEWpchkRHfeLGOD0A6sJYPiRS+SjGNGEA6lFkHgL0kCt85ks5N4DxJesk6AIBIKHxIpPCdn8A5kvaadQAAkbCWD4kUPh+3AzlgHQBAJOOsA8BeEoWvKoFzJO2QdQAAkbC0CokUvjMSOEfSfPx/AoBcSGpWp298/H8CgFxIovAdTOAcSbtS0jvWIQCE9nLHHXdUW4eArVgLX8cddyyQn41h90jqsg4BILTLxBWb3Iu3ZVkQ+PrOap+kOusQACJZLKnJOgTsxH2p87KYj2/hTbEIFvni2+2Kqo5Zs75oHQJ2Yit8HbNm3SU/Lym8r0InmoNiWQPywbef83Ml3WEdAnbiHPEtiPHYlnpGfPPl3zthoD+d1gFiMNE6AOzEUvg6Zs26T/6uddsjqXLkqlVNYjEs8uFy+demr7Jj1izu0+dUXCM+ny8jvKaPZqqyzyB89173f39umiIe37YOABtxFb7NMR03Da6VdKxj1qzDktqMswBxGyXpdUkdklqMs7h2SffVKeSM88LXMWvWf1WhOPhq5MhVq74iaZOki63DADHrlNQyctWqevnZ4HmKdQAkL44R33vyc9G6VFj707OU4dtiWQP8Vynpu91/fkj+Tei6vGPWrB9ah0CynBa+jlmzlkl6y+UxU2b8yFWrJnXfFK+wDgMkpWPWrOu6J3T5+Kb2OusASJbrEd9nJd3q+Jhp8aoKHVskaaX8e+cLDOY33f99xDRFPGg/mDPOCl/HrFnXS9rt6ngp9P7IVatu75g165ruz3185wsMqGPWrLqRq1bNt84Rgwkds2Y1WIdActz16gyCH0i60Nnx0qVF0lOSpCDweakGMJg6SY8oCL6qj0aAvvB5Qh76cHmp802Hx0qTFknNkt7omDnzRkm+Nt4GhnJ2x8yZ3xi5evU2FWY1+2REx8yZ/G7nhJPC1zFz5jT5e5388pGrV/905OrVLZJ+ZR0GMHZTx8yZ00auXv0tSS9Yh3GoTFKtdQgkw9WIz9uR0MjVq8dKUsfMmXNskwCpcLWkG7r/vMIySAyusw6AZLgqfFWOjpM223v9+UdmKYB0uVqSRq5e3ayee9+e6Jg5k04uOVBy4euYOXOZpEsdZEmTJkktI1ev/ookdcycebVxHiBVOmbO/BdJGrl69desszj23aEfgqxzMeK7UdIwB8dJk7NHrl5d0+vz1WZJgHS6oGPmzOskaeTq1Z8wzuLS2dYBED8Xhe91B8dIkyZJr/R80jFz5sNizR7Qn5/1+vO3zFI41jFz5izrDIhXSYWvY+bMu1TYq8sn40auXj2z1+cLzZIA6XZuT5EYuXr1Jkm3GOdx5R+sAyBepY74blNh2xJfPDVy9eov9HzSMXPmB5ZhgAz48P73yNWrH5W0xjCLKz7uQoFeSi18f3KSIoU6Zs5crMKWLAAGNqVj5swP2311Xy2ZapjHiY6ZM9md3WORW5Z11NZWKwh8emd0VFL9h58FwVK7KECmVPb+ZOTq1b/uqK3tlDTCKI8Ln7UOgPiUMuK7Vf4sY2iX9OORa9Y8K0kdtbXXG+cBsuTajtravl1P7jVJ4s6V1gEQn1IK32ecpbA3YuSaNUt6fc6uzEA4p2xHNnLNmhWS9htlceEs6wCITymFr91ZCnt9G2yfZxECyLCRHbW1N/b5u7ckHbMI40JHbe1t1hkQj0iFr6O29lZl+/p9Xx+t26ut/aGkqwyzAFl0kaR7+vzdy8r2rO/MT9JB/6KO+KolXeAyiKWRa9Z8pdennzcLAmRb39eEQyYp3DnTOgDiEWlWZyBd7DqIoWd6fxJI51gFATKu/Vht7b+OWrPmryQpyH77ryPWARCPqCM+n3ZjGHWstvYXknSscI8iy5dmAEuVkjb2+jzrhePCY7W19On1UNTC95bTFPZ6fkE/qz5rkgCE4lNf27MkfdI6BNwLXfiO1dYuUPYvYfRWKWlv958nWgYBPNB7/VuZWQp3fNt5Boo24rtSfhW+c0atWbOl+88XmSYBsm/8sdrantmdPtw2yPoEHfQjSuHL+nX7vkZJ0rHa2musgwCeuK77v+9ZhnDkwmOF5VvwSPhZnUFwIIYclgq/nEFwvnEOwBeF+3xB8IZtDCcuVmH5Vv1QD0R2RBnxTXCewlbPfYi+vQYBRHPWsdtvv17+XCZkPZ9nQhW+Y7fffpt67b/liZ6efBeapgD8Uit/tvXy5f8D3cKO+K6Q9G4cQSwdu/32ausMgGeuGvWLX7TIj56+51oHgFthC99I+TcyOiTpG9YhAN8cu/322fJjMtw5x26//QbrEHAnbOHzYXpyXxsl8UMNuDdb0tvWIRyoEBvTeqWUbYl8sU+FH2wAbk2Q9Lp1CEd86k+ce2ELX2b31hrEGdYBAI/5MOKTeJ3wStjC52P7HnrxAfHxZd9Oro55JOw/po/rWVi4DsTHlzaAvhRwKEThO3b77VfLrx6dPXz8fwLS4lPWARzxoeE2uhXfsiwIyuXRruu9XGodAPDYGZL2K/uvHecf++53/8eoX/7y31kHQenCXOr05ZJFb0etAwA54EvnE5/2Gsy1MIXPx5GRL70EgTTzpfMJy548Eabw+XgvzMdZqkDaVFoHAHoLU/h8XMPHpQsgGb+0DuCAL5dscy9M4WuLLQUA3/mwANyHvqNQuMLn2z+6L62UgCzwYY7AyWPf/S47uXggTOE7GVsKG69ZBwBy5B3rAA5UitsjXghT+N6IK4SRrK8rArLkCkmvWIco0SixS4MXwhQ+31r28M4NSJYPv3M+3KvMvTCFb2RsKWz4VsiBtPNhnoCPy7pyJ0zh86lXnQ9Tq4Gs2WwdwIFy6wAoXZhenT4Vvj2SvmsdAsiTUWvXLjp22213KNtvojusA6B0YUZ8o2JLkbxx1gGAvDl2223XSFpunaNE71kHQOnyeo+PtThA8i6V9KJ1iBLR39cDYQqfT30tr7QOAOTQOBWuHGW59df71gFQujCF75zYUiTrBfl12RbIiomj1q5tlnTAOkgJuNTpgTyu4zugbL/jBLKqZ3uiJaYpSsPWRB7I26XOV0etXft38qeIA1kyQpJGrV3bZB2kBGdaB0DpwhS+MI9Nqx9bBwByrPfWZi1mKUpzlnUAlC5MMcv85cFRa9fWH7vttlutcwA5NaLn92/U2rU11mEi8mWuQ66FKXxZX7j5Qvd/LzRNAeRXhaRP9fr8ZasgJTh36Icg7cIUvvbYUiTjD93/9eGSLZBVvXtdLjJLER3zAzwQpmXZsaEflFqHRq1bN1+SFAS8YwPsfDhJbtTatbuPfec7llkiOfad71SPWrcuq/cooXCjn67YUsTvYK8/32CWAsCn+nz+pkkK5FpedmDPen9AwBenXCoctW7d/ybpbaMsUXG5M+OKvtQZxJkiXq+OXrduS88nQeFeZZa7wwNZ9rEF4EGh/2WW9rnj9SPj8jDR490+n2f5XiWQdf3tZ5e138lK6wAoTR62JdrY5/PMr0cEMuxjo6XR69b9jbJV/HzaqSaXwhS+LO48fHD0unV9C98bFkEASBq49WGW3lhnfU1z7oUpfFm8rr2hn7/L2o10IA+esw4QwhHrACiNz5c6O0evW3d/P3/PjCwgZUavWzfJOkMIFL6MC1P4fhpbini8M8Df911HBCA5gxWNzYmliO690Sxez7wwhe+gsnWZcKDNLrO8EB/IusEml22UdDSpIMivogvf6HXrtik7OycfklQ/wNfysIQDSKsBZ2+OXrfuWUl/TDBLFMwK90DxvTolKQjeiymHa+2j6+sf7/crQcCID7AzeLP7IPilpM8qvRtfU/g8EHb0k5Wisds6AIB+DVo4ut+w9m06kSYsZfCAj5f9To6ur58+yNd9/H8GsqKYEdPrsaeILuvbs0Hhi0AWuiu8P8TX+cEF7Az1+ylJf6/0/p4y+cYDYQtfMT+01l4Z4utpvowC+G7Igja6vn630rsbDJc6PRC28F0cSwp39kt6ZIjHHFR2ZqcCvrmwyMe9FWuK6F60DoDShS18ad808u3R9fXbhnjM68pm+zXAB0WtBR5dX/9v4w4SUVovwSKEsIVvbywp3Ckm315ls+E24IODIR471G0LC4esA6B0YQvfnlhSuLNjqAeMrq/fofSuEQJ8F6Zw/IPCFcokpP2qF4oQqvCNrq9/Xun9h9/ffVO8GLxrA2wUfX99dH39r5WuWZRvj66vf9Y6BEoXZU1bWq9xh5lttS+uEAAGtS/k49PUKSVLvYoxiHAtyyQpCNpiyOFC8fcDguD3kq6NLwqAfpwcvX7986GeEQSrJN0gqTqWROGwHZEnooz40vquJ8w041djSwFgIFEKxwGlZxZ2Fhp4oAhRCt9Jpe9y50uj169fU+yDR69fv0MD79cHIB5nhH3C6PXrd0uqjCFLFOOtA8CNKIXvd0rfkP9PEZ7zhusQAAYVdVLZU0rH0oa0ve4hotCFb/T69T+VNDKGLFEdUrTdGGhWDSTr5ShPGr1+/f1KR9eoKG+wkUJRX/xDX7KI0euj16/fGOF5Weg7Cvik1O3CrEd9+4zPD0d8GPWMiPi8bS5DABhSKZ2fFsq+8FgXXjgStfBlfm1N9yXbtC7GB7wTeinDqc9dIekyh3GiZIicH+kStfA94zRFdO0qbeRGBxcgO16X3XIqZoF7JGrhS8s7nz2j169fW8Lz09YHEMAARq9f/yXZXe5kToBHoha+tCzk/FSJzy+laAIo3k2OjmO1li7tDfoRQqTCV+Ioy6WSfhhHr1/fLG5YA3E7Mnr9+scdHctqScE5RudFDML36uwRBG9KOtddlEhK/2UKgteUjjVCgK/c3R8LgpckXefseMV5SenrVoUSlLKcwfqa977RGzY0OTjOBtG7E4iTyzfIf1DyReiACh2r4IlSCt9JZykMjd6w4VmF2CMMQGjORnyjN2zYLWm7q+MVacToDRseSviciFEphe8NVyEicrk9UouY4QnEpd7lwUZv2PC3Lo9XhDStW4YDpRS+UtsPlcrlWsKDkjY5PB6AbqM3bHjQOkOJuqwDwK3IhW/0hg2PqHDT18ToDRtWODzWDkmTXR0PgFfSsh8gHCm1V2eFkxTpwJYjAPrzyb/ccssc6xBwp9TCZ9by6y+33PJtx4cc5/h4AGLwl1tumaxk36iOU/Rm+EihzBY+SdWG5wZQnKMxHPMflOyu7OfKfs0yHMpy4XP2Duwvt9xyo+xnqQI+qvjLLbc87Opgf7nllutlM8tygsE5EZNSC9/rTlJEU/mXW275vx0d6y5xqROIy2yHx3pK0qcdHq9YVQbnREyityyTFATBW66CRDBF0vT2GTOuLnv00eZSDhQEwXgle+kEQEjtM2YsDYKgUe4aXodBW0OPlDrisy4Wj0mqdXAcGlUD8RnVPmPGbQ6Os1g2RU+SKtpnzJhjdG44VmrhO89FiBJd3T5jxvESj7HfSRIAA7m3lCe3z5ixWlKjoyxRXWJ8fjiS9RFfjxHtM2bcEOWJ7TNmTBQ/0EDcSp2Qcr3sRns9Sn29REqU+g95mZMUbnwm4vOul3SpyyAAPqayfcaMSN2R2mfM+Ibs9uHrjSUNnvDhUmePhe0zZlwT4XnXOk8CoK9xku6I+NzNkq50mCWqi9tnzLjaOgRKV2rhO8NJCne+GeE5ZzpPAaA/5RGfl5Z2guPE1SEvRC583Zcf0oYiBqTXH9pnzLgxzBPaZ8y4VS53cC/dhdYBULpSRnxpXPB9WfuMGXUhnzMqliQA+poh6b6Qz5kj6QL3USLjzbUHSil8abzRWymp6HeU7TNmuOwoAWBwZ0g6K+Rz/hhHkBKwRZEHSil8n3WWwq32EI/9VGwpAPQnbJelqLO148IuDR6I3rIsCN52mMOlV4t+ZBD4tJ8gkAUj2qdPX1r22GNLhnpg+/Tpv1AQpOkyp0Th80IpI760DvnD3Dw/J7YUAPpzg4pfmvD5OINExJwAD5RS+NL6A1DRPn16sTNOw95vAFC68UU+Lo0zKKMuyUCKlFL4RjpL4V6xa22K/QUE4E6Y+/Bpk5Y2jSiBj5c6JemqoR7QPn36HKX7/wHw1Sfbp0/P6ozqivbp06N0iEKKlFL40jwx5NL26dMnDvGYNN4/APJglKRvD/aAlBfGNL/2oQilFL6TzlLEY6jlFlyrB+wM1eC+OpEU0aT5Ng+KUErhe99ZinhcNMTXOxJJASCKNDeDZklDxpVS+NI+YhpqWQNLGQBD7dOnLx3ky68kFiScVyS9ax0CpSml8L3hKkSRDjo+HjM6AVufG+RrUSaePRc1SAiHyh57bFsC50GMSil8x5ylKM7Pwz6hffr0Hw7y5bRtqQTkzWBvPqM0g3b95rg/adkiCSUodT++JHVGeM6tzlMASEKUmZNDTZhxgYktHiilV+fvJU11F2VI50d4zsC/PEEQPQkAFwb+nQ7/+/mKpItLCVMkJrZ4IPKIr2zjxkdcBilClFle/Tasbp82bdA1RACS0T5t2sfW67VPmzYtwqE2OIhTjLROukEIpV7q3OskRXEmRHhO5wC/RFGOBcC9/ia4ROmMksS+fUfKNm6cl8B5ELNSC98eJymK93rIx18i6Z4YcgBwo78JLlG6KlWVGqQIuxM4BxJQUuEr27hxpqsgRbo/wnMuaJ82rbbP30WZKAPAvf6uGkUpYkn8Tr+TwDmQABezOpPckPZQxOf1vdzJUgYgHbr6+bsoRWzIxvQl2le2cePtMZ8DCXFR+DY7OEaxor6ru7zP50xJBtLhlIXq7dOmDdVcfiBxN7VO8g0+YlZy4Uv4Zq+rNmlp3UQXyJsv9vN3YX8/455rsE/StpjPgQS5WsAeuqtKRFF3ZO678SV9OoF0OLd92rQPZ3GWbdwYZQLJcod5+tNVtnHj2pjPgQQ5KXxlGzd+z8VxinCLBlibN4S+l0jPcpAFgBtRL29Kkso2bvy1qyAD+GXMx0fCXLYse8rhsQYyQdGmFLPTOpBefTuuhLqX3z5t2k8cZunrZUZ7/onesqyvIGhRMi3MojSiPbXNUBCwnAFIj1OvwATBAYW7rRHXxJaXJTXHdGwYcjbiK2toWKtk2vlc6+AY3OMD0qPviO9AiOfe6TJIHxvLGhqirB1GyrnenSHum8ySdKWk70R9cvvNN88Wu68DqVXW0PDlEA/vb1aoC5vKGhpWxXRsGHNa+MoaGh6X9KLLYw7g0pCP/3C6c1lDw0+VTHsjANEV0wR/jdxcAeprn5Jreg0DzvfjK2to+L8kveD6uH3UqrhfDElSWUPD/9nz5/abb54saVgcoQC4UdbQML+Ih10fw6l3S/p+WUPD8zEcGykR10a0V8R03N7qJG0c4jGvS5re5++GKfnm2gDCq9Hgs8VdL0vaK+mnZQ0NcS+PgLFYCl9ZQ8P/omjr7cKapsGXN/y6rKHhlOJY1tDQLJY3AKlX1tDQUtbQ8DVJP5X0o15feimmU75c1tCwLaZjI0XcLWf4uB+rcC+u784IrvW3+PXlsoaGvxnkOfTdA7KjWYVJLHO7P1xfUTok6bSyhgaaUOdEXJc6VdbQUK/CTeKhLke69oKkoS5VuOr5CcCB9ptvHvANcvfIb5EKs7H3OT71EUnjyhoa/o3j4yLF4hzxqayhYe0HN988SoUCe1Oc5+rl890fDw30gKCwJAJAegy5tjaQVjs+53OSrhrT0PAJx8dFysU24usxprB84GIl2928cYiv921aDcBW0ntkvieKXm7FXvgkaUxDw39Qoc9m0UsQSvTHIb7+fiIpABSrcrAvfnDzzd+Wu85QL0k6g6KXX7Fe6uxtTEPDv//gppt+Juk1FUZcYRehhzH4jNIgYMQHpMvgb8KDoFKFq0Z925tFsXZMY+N/dHAcZFQiI74eYxobv6dCW7NLJT0T43meHeIhx+I6N4BIimkj+OkSjv+SCg3uvzqmsTHpCXdImcRGfD3GNDY+KulRSfrgppuCGE6xqYjHHIrhvACiG+rN6GuKtjRqvwrbHG0Z09j40wjPh4cSHfH1Naax8RMqTEQ5onAd2QdTzDYirOMD0mXQrcLGNDY+L+lBSZuLPN5BFd7g3j6msfHfUfTQW+Ijvr7GNDbeLEkf3HTTv0p6U9JbKvzQ3hDxkO8U8Zi2iMcGEI8h98gc09i46YObbqob5CFHVXgTPWJMY+NfO0sG75gXvh5jGhv/qufPH9x005PdfzwqqSLEYfZ3vzMcCpc6gXQptnH8QhV2ZDhHhQ4uZ/f62p8krRnT2FjvOBs8k5rC19uYxsavS9IHN910g6SHJZ0/xFNaJP1yTGNjsc1lmdwCpMuQIz7pw0ue7JyAkqSy8PUY09jYJKmp5/MPbrrpRknfUOEd3y9VGA0eHdPYGLbHXpsKl0Rdd3cHEA1LjJCYVBe+vsY0Nm5ScbM2h/KOChNcKHxAOhyxDoD8MJ3VaaV7nV+XdQ4AH+K+OxKTy8LXbZx1AAAfKmY2NuBEpi51OhUEVdYRAEiSDo15/PGhui0BzuR5xAcgHbjMiUTlufCVWQcAIInCh4TlufC9ax0AgKTC3nhAYvJc+PZZBwAgiREfEpbnwveieKcJpEExWxIBzuS58O1VYasTALby/DoEA7n9geuePk23CMBesQ2qASdyW/i6cYkFsFdUg2rAlbwXPn7hAHv8HiJReS9851kHAEDhQ7LyXvhYywfYG2kdAPmS316dkhQEb1tHAMDkFiQr7yO+g5LetA4B5Byzq5GovBe+/SoUPwA23pF0wDoE8iXXhW/Mr361RdxYByz9YcyvflVvHQL5kuvC1421fIAd7rMjcRQ++nUClo5ZB0D+UPiki6wDADl2tnUA5A+Fj+8BYKnCOgDyhxd96X3rAECOjbAOgPyh8LE1EWDpqHUA5A+Fr7AhLTPLABu0DUTi8t2yTNKYX/2q/oMbb7xN3GQHLOy3DoD8YcRX0GYdAMipvdYBkD8UvoJ26wBAHo3ZtOl56wzIHwpfwTjrACjZy9YBENp26wDIJwpfAd1bgOSVWQdAPlH4Cv5gHQAlo9l49pxlHQD5ROGTNGbTpu8H0muBJD4y+9Geggx8hPs4U4ABCt9HWMuXbV3WAQBkA4UPvuBSZ/bQNQkmKHwfedM6AEqyzzoAQtttHQD5ROH7CO8+s+vnklgPlj1MKoMJCt9H/iRpk3UIhHZEUnv5pk2MHrLlvfJNm5qtQyCfct+rs0f5pk1N7//t337KOgdC21v+xBOLJElBcEg0IwAwBEZ8p2KCRPYc6/XnDZKesQqCUDqsAyC/KHynutA6AEI7t+cP3SO/3xtmQfEOWQdAflH4TnWGdQCE1vcF9ByTFAiL7YhghsJ3qr2SGq1DIJS+jY4nmKRAWH+0DoD8ovD1Uv7EE0skvWWdA0U7Wf7EEz/u83d04MmGV6wDIL8ofB830joAitbSz9/tSTwFwjpZ/sQT26xDIL8ofB831zoAinZxP3/3mqTnkg6CUA5aB0C+Ufg+7iVJm61DoChtff+i/Ikn6OCSfszohCkK38fVSzpgHQJFGWgD4QsSTYGw9loHQL5R+Poof+KJRyVNtM6Bogy0Zu9IoikQ1u+sAyDfaFnWnyA43zoChnSwfPPmu/v9ShDUS5osaUqiiVCMlvLNm+mJC1OM+PrXZB0AQzo20BfKN2/+qej8n1avWwcAKHz9KN+8+U5JJ61zYFBD9VXl3y+dyqwDABS+gf3JOgAGNVTnj65EUiCsSusAAIVvYMw8S7ehpsSfo0Euh8IMuzLAHIVvYK9KYqPM9HppsC+Wb958u6QtCWVB8frrtgMkisI3gPLNmx8U0+LT6mj55s3FFDUWSqfL3vLNm+utQwAUvsF91joA+lXsBInz4gyB0HgjiVSg8A3uDdHtP42KHcnRgSddeL1BKvCDOIjyzZu/IOlN6xz4mKL2civfvHmRpHdizoLiMVMaqUDhG9o46wA4RafCNREfar0fkkNjCKQChW9oo6wD4BRHyzdvfjTE49tjS4IwjpRv3syMTqQCvTqHUL5581+9/41v/EbSddZZIEk6I9Sjg2CJpFpJn48lDYr1snUAoAcjvuLwfUqPbWEeXL5lyxZJ78cTBSGwtASpwQt6cZiGnQ5Hyrds+WqE55U7T4Kw2HUdqUHhK87vRReXNDga8XmMNuwxoxOpQeErQvmWLWtEt/80iDpRpUm8cbH0SvmWLXRsQWpQ+IrH5rT2Im1g2n2fj33g7NAEAqlC4Stek6R91iFy7JXyLVvuL+H57ANnh7WUSBUKX5HKt2z5vrhXZOm9Ep9/toNjAPAAhS+cK6wD5NgFpTy5fMuWL0n6naMsCGekdQCgNwpfON+UtNs6RE65WFJC+zkbbdYBgN4ofCGUb9myQ9Ie6xw5tE3SnQ6O86KDYyCcY6LRO1KGlmVhBcGgO38jFiPKn3yy5D6P5Vu23P3+179+uaSJDjKhOK+IWZ1IGUZ8IZU/+eQOFd7FIjkXOjxW1EXwiKZNTApDylD4onnDOkDObHR4LKbWJ6tc9EpFynCpM4KgsLmpy1EIBra34sknv+/qYIH0vKQpYl1fUs4WV0iQMoz4ornYOkCOOO24UvHkk2skverymBjUODHKRspQ+EI6+vWvV4tLnUm6KIZjcs8pOa9UPPnks9YhgN4ofOGdFO9gkxTH93pHDMdE/6I2FgdiQ+ELr0vcs0jK65Iecn3Q7sudrMdMBhNbkDoUvpAqnnxytxjxJaWl4sknI+3IUAQ2F04GIz6kDoUvmi7rADlxdozHpvVcMniTiNSh8EUzwjpATvwhrgNXPPnkQ+JyJ5BLFL5oKHzxO+Jy/d4A2Jw2fuzMgNRhAXsUQUDhi1/8b8qC4I3YzwF+V5A6jPiiYQF0/OKa1NLbq5L2JnCePKuwDgD0ReGLZph1AM+9oATW2lU0NT0utsyJG7M6kToUvmi4fBOvjoqmpuaEzlWZ0HnyilmdSB0KXzT8MsfrYILnejTh8+UNrzFIHX4oo2Hxc3w2VTQ1fSepk1U0NW2UtC+p8+UQV0eQOhS+aN6xDuAxi+2euGcbH94kInUofNG8bR3AY68ZnHOTpP0G582DN6wDAH1R+KI5ImYDxuGnFU1N30r6pBVNTZvE7MO48HuC1KHwRVDR1PRr6wyeOml47mfFJBfXXqhoalprHQLoi8IX3RvWATxkdj+ooqnpbrGYHcgFWpZFFQRl1hE881TF1q33myYIggMqTFw6yzQHgFgx4ovuPOsAnknD7L/nxI4NLrVZBwD6Q+GL7oB1AM+0WAeo2Lr1WRU6uTDRpXQvizcRSCkKX3RrxLIGV96s2Lp1i3UISarYuvU/qdArFKVpq9i69SHrEEB/KHwRVWzd+qikV6xzeGKbdYA+zrUO4IFy6wDAQCh8paGDiwMVW7d+zzpDbxVbt/572Syk9wn9bJFaFL7S0OqqdPXWAQbwjFjeUIqLrAMAA6HwlcZywbUXKrZuTawhdRgVW7fOk3TIOkeGcf8bqUXhKw0jvtJstw4wmIqtW2sk/dw6R0ZdfPRrX7vOOgTQHwpfaaqsA2TcRusARbjBOkCGTbQOAPSHwlea8dYBMmxPxdatqe95WrF16/+q9M06zYozrQMA/aHwleYC6wAZtsQ6QAhvS2q0DpFBU45+7WvXWIcA+vqEdYCsOjp16q2S1lnnyKiTFU89lak+sUenTt0laYp1jgx6puKpp75kHQLojRFfdJ+zDpBhWdz+54+ilVkUNPxG6lD4ojvfOkCGjbMOEFbFU0/dLanZOkcWHZ06lcudSBUKX3RXWgfIsIqMvhiebR0ggy6VdJ11CKA3Ch+sZOqNw9GpU2+Q9GnrHBmVqX9r+I/CF8HRqVPvss7ggTOsA4R0paQK6xAZxUgZqULhi+Yz1gE8cI51gJAutg6QYRVHp06ttQ4B9KDwRZO10UoaTTk6deos6xAhsBi7NHRxQWpQ+KKhVZkbF1oHCIG+rKX5pHUAoAeFL6Tu2YgsZXCj0jpACOzEUZos/VvDcxS+8M4Sv8SudFgHCIEtikpz/tGpUx+zDgFIUqbaRqVBEASXW2fwyKesAxQrCALe7JSON9pIBX4Qw6PwuXPFn6+/PvXb/vz5+usnitZbLnRZBwAkCl8UZdYBPHOedYAinCPWornQaR0AkCh8Uey3DuCZLBSUc60DeOK8P19//VLrEAD3+MI7YB3AM1loWJ2FjFlwlVgWghRgxBcel2vcykIzANZtusOtApij8IVHv0a3svBCOMo6gEeOWAcAKHzhMa3drSxsSjveOoBHXrMOAFD4wuN75tZI6wBFOGYdwCM0+4Y5XsRhLQsj6PetA3jkc93rIgEzFL4Q/nz99deIWWmuZeGeKfel3BkmaYR1COQbhS+cM8T3zLUsvAi+Zx3AM1nbixGeYR1fGEEwTtl4oc6S9O96EASM+Ny6XNKj1iGQX4xewqkUlzpdy8IODdzjc2uCdQDkG4UvnCysOcuaLDQEyELGLGFdJExR+MIpF98z16r+/NWv3mYdYgjnWQfwDL9DMMUPYDjvi0udrrVJess6xBAOSHrHOoRHLrUOgHyj8IVzVNlYcJ0lx07/zW+arUMM4TVJb1iH8MioP3/1q9dYh0B+UfjC6RD3J1xL/X3T03/zm+fFkgbXLrIOgPyi8IWT/qn32cMbiXxiZifMUPjCGaHC5U64k5UZk1nYPilLWMQOMxS+cColtVuH8ExWFodnoadolvD9hBkKXzgVys4IJSv4fuYTl7hhhpZlYQRBpaQLrWN4JhuFLwg2SVpqHcMjqZ/UBH8x4gvngKR3rUN4ptw6QJEOSHrZOoRHeO2BGX74wnlVLGR27SzrAMU4fdu2TZL2WufwCJc6YYbCF8Lp27ZtEQ2LXaMhQD7x7w4zFL7wsnFPKjsOWAcI4VzrAB7hHh/MUPjCYx2fWy3WAUJgKYs7FD6YofCFx4ufQ6dv27bWOkMILyg76w7TjmbvMEPhC4/C506mRs+nb9u2StIm6xwASkPhC48tVdz5nXWACN60DuCJQ9YBkF8UvvCY3OJOFttW0cDADa6cwAyFLzzuTbhzzDoAzPDaAzP88IXHiM+dLF7uel7SPusQHqiwDoD8oldnWEHwmnUEj7xtHSCs07dt2/jnr3zlGkmXWGfJuBHWAZBfjPhCOv3pp78v7k+4sts6QERZvDeZNlzmhhkKXzT7rQN44MjpTz+9wzpERG9YB/AA98phhsIXDSO+0mW5V2NWR6ppQucWmKHwRcOlrtL9s3WAqE5/+ml2aijd69YBkF8Uvmjesg7ggaxPEnrVOkDGscsJzFD4otkn6T3rEBn2tqQm6xAlYjp+aTLVrg5+ofBFs0fZH7FYevn0p5/eZh2iRK9YB8i4LusAyC8KXwSnP/30rwNJfET/yLrTn356SSC9YP19zPAHyxlghsIXHdOxo/NlVuxB6wAZxn1ymKHwRcc9iuiyuCtDf9qsA2TYPusAyC9alkUVBLzoRdNUuX37GusQTgTBSRXW9E20jpJB3COHGUZ8EVVu3/51MaU9ikrrAK5Ubt8+T/5ctk3a560DIL8ofKU5wzpABvn2M3eldYCM4v4ozPj2IpS0cdYBMqZZ0lrrEI7tldRoHSJj3qzcvr3eOgTyi8JXGi51hjOicvv2rC9cP0Xl9u1fEF1IwmJPS5ii8JXGj0kayTnPOkBMZlgHyBi63sAUha8Eldu3r1U2dxG3ssk6QEx2i9F/GFnemQMeoPCVjp2ki/Nm5fbt91uHiEPl9u1fEnv0hXHEOgDyjcJXOqazF8f3WXxXWwfIENbAwhSFr3RvWwfIgP2SfmwdImZTJD1lHSIjmNEJUxS+0r1kHSADfu3bbM6+Krdvf1Zc9i4WbxZhisJXuh2SXrQOkXJ5KQijrANkwBHf3wQh/Sh8Jarcvr1FQTBCQSA+Bvzwpk3ZoIKgXkHQlILvd5o/Xrb+ZwIofG7QwWVg9fJ3GcMpKnfsaBKX8YbyrnUAgMLnxh7rACl2ZuWOHbutQyTo09YBUi4vl72RYhQ+N+rFjL6BnG0dIGGblJMRbkS85sAcP4QOdI9o2qxzpNAxSbmayFC5Y8daSeXWOVKMda8wR+Fzh81IP+7Fyh07VliHMHC+dYAU+711AIDC5w5b03xcPmZzftxCSS3WIVLoaOWOHTR2hzkKnyOVO3bcL+lH1jlSxvc2Zf2q3LHjWTHTtz9/sA4ASBQ+19iR/SOvKGf39/o4Imb79sVSD6QChc+tvF7a689plTt2bLEOYaVyx44vSDpgnSNl2IAWqUDhc+s50b6sB5uNSpdaB0iZY9YBAEkabh3AJ5U7dqw68uUvXybpSussxo5K2mYdwlwQbFdhacO51lFSIpf3fJE+jPjc+6R1gBR4pXLnzjutQ1ir3LlzkZi+3+OApD9ZhwAkCl8cuMTHCKe3C60DpMT+yp078zzZCSlC4XPvB8r3pIZDkjZYh0iR5u6PvOMNIVKDwudY5c6dWySVWecw1Fy5c+f91iHSonLnzrtVWNqQd29aBwB6UPjikefC9znrACk03jpACmyzDgD0oPDFY6Ok/dYhDLwtZu7150eStluHMPR695UQIBUofDHI8YzGlyU9aB0ibSp37vy18t3CjM1nkSoUvvh0WAcwcHHlzp00Z+7fQUmvWYcwwjZNSBUKX3ye6/7Ii9etA6RZ5c6df6tC/9I8Ytd1pAqFLyaVO3fOs86QsObKnTv/d+sQKXemdQADb0paax0C6I3CF688daO/yjpA2lXu3PmflK+fCUl6rXLnzkesQwC90aszTkGwQ9Jl8r97x2uSXrIOkQlBsEfSddYxEtRuHQDoixFfjCqbm5uUj61YXqxsbv476xAZwRsEwBiFL3556FjBovUiVTY3r1C+Lnf+0ToA0BeFL2aVzc1fkvSqdY6Y0XU/nN3WARKUp/9XZASFLxlvWAeI0auVzc1ftg6RMZuVjzV9L1Q2N1P4kDoUvgQE0v6g8F8fP9iCKKTK5uYdgbQ9Bf92cX/kdd0iUo7Cl4Cxzc3z5O8ln3+wDpBReXjDkOdm7UgxCl9yfFy8/OrY5uYfW4fIorHNzd+S/519nrUOAPSHwpecFZJ+bh3CsS7rABnn8+zOV8cWlvMAqUPhS8jY5uaNKuxO7otXVdh+CdHttQ4Qo7esAwADofAla6L8Wdd3aGxzM62oStB9mdjX3Sx8X8KDDKNlWZKC4BFJF0laZh3FgQnWAbwQBEesI8Rgn6Qd1iGAgTDiS9DYXbt2SJpsncOB/ZK+bx3CE2vk3ySXt8fu2uXrLGZ4gMKXvGZJ71iHKNHbY3ftYqsZB7oLhG/3wyqtAwCDofAlbOyuXSuU/UkuZ1kH8Ixvszt9vW8JT1D4bGS5ce8BST+wDuGTsbt23S1pj3UOR/aO3bXrfusQwGAofDa2Wwcowetjd+163DqEh16wDuDIy9YBgKFQ+AyM3bVri7J7n+986wCe+qOkp6xDOMDGs0g9Cp+dX1sHiGCjpJ9ah/DR2F27Nkm6wDqHA3nYeBkZR+EzMnbXrpnK3n2dqrG7dlH44rNfhXuoAGJE4bOVtcudF1oH8NnYXbu+pmzfI3tF0rvWIYChUPhsPW8dIITtkmhRFr+zrQOUYJ/Ygw8ZQOEz1H3ZcLN1jiK1s2g9EauU3Rmew8bu2sUaPqQehc9aELQrCJSBjzOsv1V5MHbXriYFwVsp+PeO8vFJ6+8fUAwKn72D1gGK5Ft3kTTL6s7l3ANGJlD47L1vHaAIeyRtsw6RI6+rMMMzayqsAwDFoPDZG2kdoAhvj33mmW3WIfJi7DPPzFNGZ0cenjLli9YZgKFQ+Ox1WAcownvWAXIoqwvBL7UOAAyFwodiZOFyrG/etA4Q0eXWAYChUPjsnWkdAKmU1clEF1kHAIZC4bOXhReKrL4IZ9bYZ55ZpGwuBj9mHQAYCoXP3jjrAEVYdnjKlOutQ+TQEesAEVxyeMqUG61DAIOh8Nn7jHWAInHvJkGHp0ypllRpnSMi3iQh1Sh8hg5PmXKXpGHWOYp0rnWAnCmX9CnrEBFNtQ4ADIbCZykIJqagzVSxHzcenjz5v1h/y3IjCLoUBMNS8O8e6ePw5Mms50NqUfhsZeUyZ4/yw5Mn32YdIieyOtrrcbF1AGAgFD4jhydPvkdS1ho/Py9prnWInLjEOkCJrrAOAAyEwmfnm9YBIrhV2Zxin0UjrAOUqPrw5MnXWYcA+kPhs9NuHSCCyrHPPvt16xA5kcUm1b1VSppgHQLoD4XPwOHJk+9SNpcHHDg8efID1iFy4mrrAA5k7R42coLCZ2OZdYCI9oi+nUlpUvY75pxtHQDoD4UPYRwa++yzD1mHyIOxzz57v3UGB84/PHnyAusQQF8UPhtZvL8nSZWsz0pUuXWAEo2XNMU6BNAXhS9hhydPflpSmXWOiG6UtNg6RI60WAdwoPzw5MmzrUMAvVH4kpflaeojJFVYh8iRTO7C3sdlkq6xDgH0RuFL0OHJk2+V1Gado0SN1gFyJAs7dxSj/fDkyXXWIYAew60D5EoQ1Em60DpGiZipl5Qg6LSO4Mi1kt49XFNz/djf/vbX1mEARnwJOVxT8z8lHbTO4cCFh2tquHSVjDOtAzh0qwqXPQFzFL6EBNLRQKoOCn/O8se1AX0YY9dWU3NPIE1Mwb+3y4+72mpq7nL8rQJCo/AloK2m5rD8ereb1VmpWXKpsrNXYxjL2mpqtlqHQL5R+GLWVlPzF2V3J+2BvGMdIAd8mdjSn6ltNTW72mpqZlgHQT5R+GLUVlOzWtIo6xwx8K2Qp5Hv3+MpkqrbampWWgdB/lD4YtJWUzNHUq11jphc3VZT823rEJ47yzpAAr4paWRbTc0s6yDIFwpfDNpqan4m6QfWOWJ0UfcH4uPTjM7B3CHpxraamhutgyA/KHyOdY/0psr/CSBZ3FYpE7qLgA9LX4p1haSfMPJDUih8DrXV1CyTtFT5WORdZR3AY0fl573hwYyTdGVbTU21dRD4j8LnSFtNTYOkBcpPL0sfp9qnQtVvf7tD2e7pGtU3Jd1jHQL+o2VZidqqq6+XdIeCYKJ1loSdtA7gtSDI6tZVpfp8W3X1/ytpQlVLyyesw8BPjPhK0FZd/Q1JP5KUt6InZb/Zdtrlea3kBEkvtlVXB9ZB4CcKX0Rt1dXXqDAjbbx1FgMHJG23DuE5H7YkKsWVkpraqqv/Yh0E/uFSZwRt1dXXSVqpwjvTPHq1qqXlx9YhPPeedYAUuEFSs3UI+IcRX0ht1dW3qnADPq9FT/JjZ/C067AOkBJXt1VXf9BWXb3AOgj8QeELoa26erakH8qvhtNhPVLV0rLKOkQO5Gkd31DKJF3b/aYTKBmFL5xa5We5Qn9OKt+TLhJT1dLyfUlrrHOkyJWS7rMOAT8wXbhIbdXVf1a+i54kvVzV0vI31iHypK26+mkVdjBHAT+DKBkjviK0VVf/d1H09vGCY+LH1gFS5rK26ur/r3spERAJI74htFVX75R0tXUOQ89IaqtqafmWdZA8Y03bx2yramn5qnUIZBMjvkG0VVfPUb6L3quS6il69rq7mOS1m0t/rmurrv6ZdQhkE+v4BtBWXX2D/N1PbyAvq9Ajcm9VS8vfWYfBqapaWsa0VVf/V0mflHSGdZ4UyEMzeMSAS50DaJs06f+RdLF1jpjtU6H12JmSVlW1tjKLMAPaJk2aXNXa+mzbpElz1L2TuXEkSwurWltXWIdAtlD4+tH9grJU/k5o+ZGkCyVtqmptfdw6DErXNmnSTknnSTqkwpZGedkv8ftVra1LrEMgW7jU2b/x8rfovSppR1Vr6zzrIHCnqrX1yz1/bps0aZkKo/mLJO2XdL78baROazeERuHr37nWAWK0qaq1dbd1CMSnqrX17t6ft02aVCepXNJbkq6zyBSjqWLJB0Ki8PXviHWAmBysam190DoEklXV2vqIpEekDy+J+jRTmZmuCI3lDP3bax0gDlWtrX9tnQG2el8S9cBuSUetQyB7KHz96J7duM06h2P11gGQGpusAzjQKWliVWvr16yDIHuY1TmItkmTvOmWUdXayr81PtQ2adJvld1lEG9LermqtfUr1kGQTYz4BvctZX/W2B5JN1mHQLpUtbbWSLp7yAeW7pDDYx2QdGdVa+tfUfRQCkYBQ2ibNGmlpHMkfdM6S0i7JbVUtbY+ZB0E6dU2adK/SLrAOkc/XlFhT8K9kvZUtbayEzucofAVqW3SpFslLVBhFtkISe9L+rQKi4XTYp8Ku6PfIenLLFtAMdomTbpPha2PJkiqjOk0L6qwPnZ89+f7Vfg9kgrdg/ZJer6qtdWH+49IOQpfCdquuqpO0iwVFgi/KeldFXaL7lRhlFihj365pcJGrge7H9e7s8aLKrRHK/VFZ0PVc8/RYxORtV111T+p8ObuqghPf13SP0uqknSFCsuCfi7p9yr8vJ8maXfVc8897yYtEA2FLwXarrqqVoWFxRNVuCfygga+tHpEhV3QL5D0D1XPPXd/EhmRL21XXXW9Cj+Pl6nwRu6ACj97I1V4czdehUkmR1QYKXZI2l713HNrTQIDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAk7f8HT9tXzNgvau8AAAAASUVORK5CYII=',
};
const SIL_F: Record<number,string> = {
  0: 'data:image/png;base64,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',
  1: 'data:image/png;base64,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',
  2: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAREAAAKbCAYAAADSV76tAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAABD70lEQVR4nO3de5RU1Z0v8K/dfbpYLLleuVygBy9LL1ckOk4IyjBCqyEiYhDt6BgNQohGUSOY8BTUMZGHjwg+MA4PiYggaghMTwwRSRiWSjRIAh0RJDoERAxphsHL1cu16Ko6949TLUVRj/Pcv73P+X7WqgV0V9f+UV31q33247cBIiIiIiIiIiIiIiIiIiIiIiIiIiKiKJ0kHQCpl1v9jWsB9ADQCcCpABryt/35u+wFsLHm6n95WSZCMgmTSMzlVn9jMICLAJyb/1JPAL0AdK7wY58COACgDUAWwEE4iWVLzdX/8nhkwZKRmERiJreqaTiAwQAGALgAQG3ITewD8AGApTXXNC8N+bHJQEwiMZBb1TQJTm+jA4ChCpveByeZ3KuwTdIMk4jBcquaRgG4HUBfAB1lo8EVNdc0rxGOgQQwiRgqt6rpKABLOo4CuwG8XHNN8/elAyG1mEQMk1vV9AKcgdH+0rGU8QqAR2quad4gHQipwSRikNyqpp8CuEk6DhdeBLCWA6/JwCRiiNyqplehdtA0qF0ANtdc0/wt6UAoWjXSAVB1BiYQwLnk6plb1TRLOhCKFpOI5nKrmv4DzqpSEw0EMDS3quk66UAoOkwiGsutanoWwAboO4jqRn8AU6WDoOgwieitF4BrpYMIQb/cqqbnpYOgaHBgVVO5n1/1BoBG6ThCNrvmH/+Vq1tjhj0RDeV+ftXdiF8CAYBrcj+/arB0EBQuJhE9jZYOICJ9AIyRDoLCxSSimdzPr3oVzpstrk7N/fyqOIzzUF6ddAB0TO7nV/0Ax+p+xNWVcIohrZQOhMLBnoheroRTYSzueuR+ftXN0kFQOJhENJH7+VXXId6XMYV6A3hUOggKB5OIPkYjGb2QdgelA6BwMIno48vSASjWLd/7IsMxiWggPz5wmnQcinVEfKeyE4VJRA9JHWQ8WToACo5JRAe2XQPbRgJvF+dWXskVrIZjEhGWW3nlUJi9Szco9kYMxyQi7yLpAIR1kQ6AgmESkRf3FarVJG1AOXaYROT1lA5AWA/pACgYJhF5SU8iSVpgF0tMIoLyMxOVDtZOgqT//43HJCKrl3QAGkhJB0DBMInIOls6AA0keXo7FphEZCV9PAQADksHQMEwicjqLR2ABphEDMfKZpJsmzMTQJt0ABQMeyKyLOkANMDXoOH4C5R1RDoADbAnYjgmEVmt0gFogBXODMckIusT6QA0wOfAcEwispqlA9DAAOkAKBgmEVkcWGUpAOMxicjiSXAAcj8bcTT3sxFJLRFpvJOkA0iq3M9G/Ce4+azYkJpvvrxeOgjyhj0RAbmfjfgITCClTJMOgLxjEpHBal6lDcn9bMTd0kGQN1z2rljupSv+L2xbOgydDQHwgHQQ5B57IgrlXrri/8E5tInK+3LupSt4jIRBmETUeks6AAN0BsBLGoMwiajFXbvuDJEOgNxjElHrVOkAiMLGJKJWWjoAQ2SlAyD3mETU+lw6AEPU5l66okk6CHKHSUStnHQABuGhVoZgElHrU+kADMLaq4ZgElGLBXjc43NlCCYRtXjGiks11/1yrXQM5A6TiEI11/3yv8O2wVvV2yHp3xW5xySiHq/1KVaYRNQ7AiaSahZJB0DusSiRgNyLw/8AoJ90HJpqrbl+TXfpIMg99kRkHALPnClnuXQA5A17IkJyLw7/GVhjtdjhmuvX/FfpIMgb9kSE1Fy/5pvgWohCOwF8XzoI8o5JRNZNcN48SXcEwLia69cslQ6EvOPljAZyLw7/NZJdQ+ObNdevWSkdBPnDGqt6eABOwaJeADoIx6LKQQAHa65f8yXpQCgY9kQ0kntx+I0ArgEwXDqWiDUD2FBz/Zp50oFQcEwimsm98PUxAJ6VjiNCq2q+9at/lA6CwsOBVc3UfOtXcR9cPCAdAIWLSYRUe1M6AAoXk4hmci98/U7Ee28Nl/vHDMdENJR74etHAVjScUSh5lu/4msuZtgT0VMsEwiANukAKHxMInqagHguiZ8tHQCFj11LTeVe+Pp/wjlSMi6213zrV38rHQSFjz0RfTVLBxCyOA8WJxqTiKZqvvWr70rHELKB0gFQNJhESIV1nJWJL27A05ltbwIwQDqMEFwgHQBFhz0Rvc0GsEs6iBB8LB0ARYdJRGM1I195GcA+6TgCeh/AY9JBUHSYRPRn+qf4WzUjX+EREDHGJKK/3TB7erSrdAAULSYR/f0ewCrpIIjKYRLRXM3IV5ph9hJ40y/HqAomETN0kg4gAJMvxcgFJhEzpKQDICqHSURzuRWXD4bZPZEzpQOgaDGJaK5m5CsbAJwiHUcAXaQDoGgxiWgut+LykQCGSscRQFLO0UksJhHd2fZI2DYMvlm554cNk34aKTpMIhrLPT9sMMw/yOpcAE3SQVB0mET0FpdP8Gtzzw/7J+kgKBpMIprKPT/sEgCjpeMISWcAP5AOgqLBJKKv38A55DsuOueeH/ahdBAUPlab0lDu+WH/G2ZP61azsOaGtbdJB0HhYBLRSO75YdcBeFE6DkWaa25Y+w3pICg4JhFN5HsfuwH0lY1EqW0AVtXcsPZ+6UDIPyYRYbnnhz0IYAqAWulYBO0GsJTJxExMIkJyzw+bAeA6OIOnJu+NCdNhANsBLK65Ye0S6WDIHSYRxXLPD3sYwK1wduZySXhlS2tuWPsd6SCoMiYRRbLLL/sd4nH8g4RNAB6rHfXqS9KB0ImYRCKUXX7ZHAB3gD2OsOwD8DqAVbWjXl0tHQw5mERCll1+2U8BjAHQBiaPqHwO4DM44ydra0e9+pBwPInGJBKC7PLLHoZzqXKxdCwJtQvOdHGX2lGvXigdTNIwifiQXX7ZtQDG5v/5GbhLVSdH8n9uB7CodtSriyWDSQImEZeyyy8bAeAeAPsBfBnAGbIRkQstOLb+ZlvtqFdvEIwltphEKsgnjtFwkkYOQB/ZiCigfQB2AlhdO+rV+dLBxAWTSJHs8stuhlPHoxuAXojXTlo6XguAjXCSygbhWIzFJAIgu/yykQBmALAA9BQOh2SsAtAfTm9lZe2oVx+XDccciU0i2eWXjQHwMJweB1GhTwEcANBSO+rVf5QORneJSSLZ5ZeNgvNJ0wTnGIOOogGRSVrhrJrdWzvq1fHSwegmEUkku2zoVgDnwLlcIfLrMIDNAHK1o9ddJh2MLmKdRLLLhr4K4CJw5SiFrxlADwAP1Y5el+gl+LFMItllQ9+G0+voKxwKxd8qANfUjl4Xy/eSG7H7j2eXDX0PXM9B6m2vHb3ub6WDkBCbJJJdNvRfAfQDcJp0LJRY2wD8KGmXN7FIItllQ58GcLN0HERwtkV8Xjt63f+UDkQV45NIdtnQXwMYIh0HUbGkjJMY+5/MLhs6AsBIANdLx0JUxtLa0eu+Ix1E1Ew+Ae9OMIGQ3sZklw19VzqIqBmZRHgJQwY5J7ts6O+kg4iScZcz+cx+jnQcRB5trB29LpZV14xKItnnLn0BvIQhMx0GML/227+eLh1I2IxJItnnLv1XAFdKx0EUwOcAxtd++9exKtloxJhI9rlLfwsmEDJfBwBjss9dOlg6kDAZkUTAYyYpPhoBPCsdRJi0TyLZ5y79dwDnSsdBFKL92ecuHVv9bmbQOolkn7v0d3DOrCWKkwEAhksHERatkwic+LihjuKor3QAYdE2iWSfu/Q9OOUMieKoZ/a5S/9NOogwaJlEss9deglYA5Xib3Acxka0TCIAfgMe3UDJcKd0AEFpl0TyvZDD0nEQKXJK9rlLr5UOIog66QBOYNvLAJwiHQaRIqcBeBTASulA/NKuJwJnaTBRkmySDiAIrZJIdumQRwGcIR0HkWLXZJcOuVs6CL+0SiLgDl1KrsulA/BLmySSXTpkODSKh0ixAdmlQ4ZKB+GHTm/aSeDh2pRcFoAx0kH4oVMS6SEdABF5p0USyS4dMgpAZ+k4iIQ15i/rjaJFEgHwEwBdpIMgEtYTBh7CpksS2SkdAJEm3pQOwCtdkghrhhA5jBtcFS/UnH32kmdh4BNHFKFbar+z3phizjr0RC6QDoBIM8OkA/BChySyRToAIs0MkA7AC9Ekkn32kuvASu5ExU7LPnuJMVO90j2RyxGjgrVEIbpaOgC3pJOIJdw+ka6MObBeOomcLdw+ka72SwfglnQSSQu3T6SrrtIBuCWWRLLPXvIDAKdKtU+kuTOyz14yUjoINyR7ItcC6C3YPpHujBhclUwiPNmOqDIjDm+Tq/Zu2zwWgqgyI049kOyJGDNwRCSESaSc7JKvPQmWQiSqKrvka9OkY6hGqifSR6hdItM8KB1ANVJJhKUQidzRftGZVBLpKNQukWkOSgdQjVQSYT1VIne6ZJd87XbpICpRnkSyS762AEwiRG41ABghHUQlEj2RKwXaJDLZOdIBVCKRRBoE2iQy2cnSAVQikUSyAm0SUUSUV3vPPjPYVt0mUQzMr71pw/ekgyhFoifSJtAmkelOlw6gHKVJJPvM4CfBkohEfvSSDqAc1T2RaxW3RxQX2m7GU51EOihujygutN0qojqJ6LKEt0U6ACKPrOwzg7VcuaosiWSfGXwn9Bkc0rZrSFqT3gx3nXD7JansiYwAUKuwvUrOkA6AjHRIuP1G4fZLUplEBipsiygK0svPdwm3X5LKJKLLeAiRqbSsBqgyiXyqsK1KtksHQOTTKdlnBt8tHUQxddXebbuTsrYq2wL5bimZax9kjzvRblhASU8k+9Ov3gGgp4q2XPhEOgAy2hbh9rWrT6zqcqafonbc4Hk3FIT0h5B2R8+qSiI6HZd5RDoAMpp0bQ/t1jipSiI6ZU/uIqYgpJef12Z/+tU7hWM4jqokIv3EF9LumpKMsk86AGi26ExVEtFlepcoKB16sqdLB1BIVRL5TFE7bqSkAyCj6bBUQatxEVVJRKdCRFqu+iNj6FAcSKvJgciTSPanXx0LPZ74dudLB0BG02G5Qlo6gEIqeiJ9odexmToN8hL50ZD96Ve1qRKoIol0VdCGV5ulAyAjbZIOIK8ngEukg2gX/d4Z29ZpPKTdTgD9pYMg47RKB1BAm2leFT0RrUaS83RMbKS/NdIBFNDmPGsVSUTHvSo6TNOReUZKB1BAlyqBSpKI9IalUoZLB0DG2QzgYukgdKQiiei6WvUn0gGQUZqlAyiizZnWKpKIDsuES2FhIvLiJukAimgzrpfUgVUAGCwdABljPvRaMAkAnbOLLx4hHQSgJomcq6ANv2ZKB0BG0GYmpIgWR59EmkSyiy++FnpfNoyAft1U0ssy6HuGtBbJLeqeyDDoteS9WF8AewG8D65ipdJ0Xg4wSjoAIPokout4SLu22ptfWw/gIehVwpH0sBdAk3QQFWiR4KJd9m7buicRCwBqb35tSfbpi4YDuEY4HtLHTgCrANwjHUgF0vVeAUTfE9H5UqbYfACvSQdB4tprdeytveX1e8GTG6uKOoloM5ddxhcLdmpveX09gKcALJULhzTQ/sH3WPbpiy6BJoOXZWixpSTqJKJVBaYSivcfNECjLdYkqjb/waKzRCQRnWqrllJ8ynpHyB6RSPo4Pf9n8WtEJ1pUOIs6iWizvr+M2YX/qL3l9YekAiHt7M//qfOYSDb79EXDpIOIOonoXBT5F7W3vL6k8AvZpy+aJRUMaae9aNV0yJ+/W85eaHDAd5J7IqUGfdugyXUmiZsGALW3vL4B6k5F8KoBGrxeo35yOkT8+EGUWsNyBMe6sUTttkkHUEYDNCi1EXUS0bFIc7tSq/1y0PdTh+SshHPpoJsO0GDVapLHREr1OLLgkRJUpPaW118GcEg6jhI6AughHUSky95tPSu9t9tQ/AXbtg9D/7UtpEhm0YXX1o19YyUA2LbdDGfDpk46QoM6J5H1RDKLLtR6pqNu7BulpnPT4JgIHfPFuFnd2DfulwykAvGaIlFezlwf4WMHVe76NgUNBqpIG8Wvk1dEoqhMfFl+JEkks+jC66BBN6uCUzOLLry6xNf3gmMidMzNRf/W8fL8TekAouqJTIvoccPy+7qxb6wu/mLd2DfWg2MidEzxPqoHRKKorEtm0YXPSwYQVRLReVYGqNwF1HlamtQ6rudRN/aNDdBvqvdiAGdKBhB6EsksuvAOOItgjJNZdOG10OAak7TxcYmv6TjwLrrRNYqeyIMRPGaYdsMph1jKydDoeEISV2pcbyH025Q3OLPown+WajzUJJJZdOFw6L/9/4y6sW+sKPO9njCrGhtF64SB1LqxbywpdUcNnJJZdKHIjt6wF5s9Cf0vZXZX+F4D9ByBJ73shn6Xve2Hja9V3XDYlzMmfIrPq/C9I9BgVyTpI7PowqElvjwXlT+MpIgMsIaWRDILG++AbW+BbUPj2+d1Y994vOx/wrbXwrZP0SBO3vS5jSx+mdSNfeMl2PZBDWIrvvXPLGx8Lqz3tFth9kTGAbg8xMeLQsXSBHW3blynKhAywvsAVmUWNg4v/kbdrRv/HvpN9wKAlVnYOFZlg2EmEd1GrIu1wNnSTeRK3a0bzwLwWd2tG9eUuYv4DtoSroczg6RMKEkks7DxBQCNYTxWhLrU3brxm5XukFnYOCb/100K4iHNZRY2zqq7deOGCndZCz1LJ76WWdg4QlVjYfVE+ob0OFE6xcV92jffDYgyEDLGPZmFjWUP8667deMV0LPOyMUAXlTVWFhJZGNIjxOVpQBO2CtTwsUAfhFxLGSWwVW+L14ouYxVqhoKnEQyCxt/BWBM1TvKOrvu1o3fcXG/UQCujDgWMktTZmHjryt8fyGcAVjdjMwsbPydiobC6Il0ht4LtNpwrPx/WfmpMZ3/HySjAZUPidoFPVdp10LRpVYYSaQ1hMeI0jqU3ytTaDQ0KHpLWhqcWdj4y1LfqLt141MA+imOx62h+SuFSAVKIpmFjQ9C/2Mne9bdunF6pTtkFjb+HwDlpvGIOgLomFnY+G6Z7z8DPT9Ma+FuQiGQoD2RMdA3C7erWO4ws7Dxajjd0RMWFBEVGIwy1frqbt34XTjHjego8kp9wZKIbe/WYKlvpdsK2PbSKv+HVeBSd97c3TpkFgz69zKvoyMaxFfq1iezYNCTgd7nVfhOIpkFg66D3iemA8CZdbf9dlG5b+b/D6tgxsZB0kOvzIJB/1Hi67uh7yVxpFcLQXoikwCU2uGok2rJ4UUA16gIhOIls2DQgqIvvQx9Z/d6ZxYMGhPVgwdJIr2gdy3VZlQorJtZMOjB/H2IvOoC4NbCL9Td9tt5AM6WCaeqLgBuj+rBgySRD0KLIhoX1d3223IVzABnaXuTolgoft7MLBhUPFvTDcAyiWBciKyIUpAkontV9A2ZBYNKLlnOLBj0DoBzFcdD8dIHJy4yuwz6XuIfzCwYFEn5xCBJRPfByIa62367ofiL+SeyI/Qrb0dm6YyiD6L8603HavCA0/OOZEuHrySSWTBoBvQeDwGcT4pSbofep/OROTpmFgz6P0Vfe0skEnci+eD32xPRfYHZTpT4RMgsGDQCwBD14VCMfZZZMOiHBf9uhr7nOUdSP9hvEjk11CjC9ylKz7w8CP0vw8gsDQB+1P6Putt+uw7AJ2LRVDYmvzYqVH6TiK7z4e0Ow+mNfCGzYNCdAM6RCYdi7kjRAjRd3x+nAOgd9oP6O3fGtnX/NO8M4MBxX7HtyObJKfE6AjiYmT9wVN3tby6HbW/AsXNgdBP6eKDnnkhm/sCxULCpJ6B+dbe/+UXl9sz8gZeAlzEUrZ4A7sz/fQX0rAQPRLC0wc/lzAEAqbADiUpm/sA7APwYzi+ZKEr9M/MH3ll3+5troO/rrV9m/sA/hPmAfpJIP+jfEynUCP1nkyg+nsj/qesMDeCc9BgaP0nk/DADiEDxE3S9SBSUWJn5A58H8LF0HBWEekaUnySiazet3UEA0wEgM3/gX4RjoWQaCeAV6SAqSGXmDyx7FIZXfpKI7gOUPetuf/Oh/FiI7utZKL5Cn0oN0WCEWMkvjkmkvZLZj1Dl7F2iCOlcbrMDQixb4CmJZOYPHAqn+KvONmTmD/wpgO3SgRAlgdfFZj3gnOOisy5wqpWdIh0IkcZCm6HxejkzAM5eAV2NBjAHTCCkD2XHWXqUzswf+C9hPJC3noht6/7mnArn1C+T1rFQvOl6LtNQAK+F8UBeeyI690IAZ18AEwjpZACA+dJBlBHKiY9ek4jub1AOppKOwjiuNgqhjIt4/c+dHEajEdkFFwd3Ewm4FXoesxnKJInXJKLzGpGsdABEFbwsHUAJvTL/fEHg9Sxek4iui7c2Q+8VgkQ3SwdQQk8AFwV9EK9JxJgSAEQa0vFMmsD1RXQd8PFK9wFfIsBZx6SbwFPQrpNI5p8vGAEgHbTBCLwCHgFB5tgtHUCRwPVgvfREekLPwctQayMQRWybdABFAg9ReEki3aDf5rsN0LOLSFROJKfQBRC4J+J+2btT4V23gVUd596JqlkDfUoFKL2c6Qi9pnj3g6UPyUyN0gEUCHwcrpckottq1Y3SARD5dAo02t2beeofAp2R4yWJhLJZJ0S613olqkSnzaynB/lhL0kk1DLzAc2DszuSyFQDAeyTDiIv0JEqXpKIToOqfaQDIArBHukA8gKNdXodWNXBYjgFVYhMp0tvOtCpCCYuez8sHQBRSCwAv5AOAgHLiZo4JqLjqlkiv3Q44jXQdhYvSWR/kIZC8hj03L9D5JcONVgDnRtsUhLZXnfH7yZC/7OAibzaKdy+soHVT4I0FIIP8n/qtNqPKKjDcHaiS35IBxpY9bJ3RnJG5DEAGzM/GTAKtp2GfgvfiPw6COfAtXsALEQIe1l8SGd+MqCpbtymZj8/7KUnEui6KYAWAI114zathrPOv4tQHERROAjgcN24TUvgvNYlnIIAMzReDq/aDyeRqO4FbAPQnP/76YrbJopaCsfqA/eBszM98KY4j3ogwDJ8Lz2RvZBZozE63wsBWAaR4qcL8tO8deM2/RfI1OyphaIksgfqD/PeBeB7Bf/Waek9URgsHD8O0gUya6GiTyJ14zatgfoFZ73qxm0qPIJQYtCJKEqdUFBcq27cppMgs6fG9wyN12XvKqd5D+LEEvuclaG4ScHpcRfqBfW1g30PrHpNIof8NuRDTd24Td8u+poumwCJwnIYJy42ewzqz5X2veDMaxJRWQioVK9DZRIjUuEzFM3G1I3bNBHqB1h7+P1Br0nkM78NedQK4IYSX+e+GYqbNpT+cPwcatdmKeuJqJqd+bhu3KaVJb7OkogUNzUoMWFRN27TpXCORFHF98ynl8Vm7cdGqPB+mfYVNU+kTPnLFttW1fMHgJzfH/TaE1Exf72hbvzb3yrzPd2OICQKKosyb+C68W/fAGCzojh8L9/wmkQO+G3Ig0qJirMzFEeV3oeqVokrSyL7Ef2pc2uqtL834vaJVOqCyqtFX4ea83t9j3d6TSKfAvjYb2Nu1I1/+/EK314BDq5SvHQCcEa5b9aNf3sm9DsE/Dhek8geRLf0fDuAZ6rcR7fDkInCUK3QlopZmi1+f9BrEtmH6PbPnFM3/u3vVrnPbuhz4A9RWCoOEdSNf3sxon/d+5408ZRE6sa//TKiWyvi5nHPBcsBUPy4mbB4CtFugFU2JgJEczmzF86hVNXcBM7QUPz0yjz591Mq3aFu/NsPodz6qXAoWyfi92eq2V03/u3vVb8bUSx1BHCOi/v1jTAG350DPwnBd8aqoOrZupkn/34WnP0ERHHkZgPcGkRXIsB3D9/bsncAsO0oVq1Wrylp22MQ8HwMIo0NqXaHuvFvX5GZ1/89RFOs/GS/P+inJxL2FuWDcNfD4FgIxVpmXv+7Xdwtqp29ynbxAuEPrO7D8XVUT5CZ1/9mRLzIjUgDo13c5wFEO8DqmQ4Dq5/U3bl5SZX7XACnZBxRnPXJzOv/QqU71N25uRnRXM4oHVgN+7LCzdx3YwTtEunIzarsKDbCdvX7g36SSNiLvdysxOOpd5QUbsY8ShXsCuo0vz/oJ4n4HsUtw83mIolDs4gkpDPz+o+tdIe6OzffhwiWwWfm9b/Wz89FsXDMKzfHQEicCkYkoSeASS7utyOCtquu1yrFTxIJe/3+8ErfzMzr/wNw+z8lS+/qd4lk+4mviu9+kkiYG/CyqL4NenCI7RGZoGIZ0My8/jcimtlKX5MXfpJImCPDtag+kFS2YAtRTB3MzOtf6cPzGUTTO6++crwEP8vew96/8lbmifNH1H3/9y+XaU/1IeJE0voCaEKJYkSZJ86/Gba9Ez7HL6rwNVShw8DqUFR+QlQfIk4kzYLzvihlBqJJIIDPDa6ekkjmifNHIJpDtSutA2FPhJKo3OKvSkWdg+qWeeL8YV5/yGtPpBvCXycClM+6REl1wuxL5onzL0G0Zz8NhlM90BOvSaQrolk92jfzxPnl9gxwtSolUaldtWcg+jVTni+VvCaRMxBdTY9y3bQzI2qPSGdW5onzi2doVCx38Pyh7TWJnO61AQ9OmPfOj8GwEBEl1alF/x6poE3Pi9h0OkbztMwT5z9Z9DVu/6ckK652puJcXs/71LwmkbO9NuBR8cIyX4tfiGKi+BJfRTmMc/MDuK55TSJRD3IWT+dGMRNEZIov3m+ZJ86/EWqSyDnwOPbiNYl85vH+XhVfj3E8hJKs8P0wBNGctFCKpyX1npa927ad8haLZ8PbHj9vmvWDPzyUb489EUqyL5KIbdt9EO0akZLtuuFnijdqhbt6uVqVkuyUgr9ni/4dJU/vc9dJpO3x80Z5j8WXwnEX7puhJCscA/kE6iYaBrQ9ft6Nbu/spSfieTmsT4Vz46xoRuSI6ryZclyvXPWSRC73EYgfHdseP+93+b+7qb9KFFcNbY+ft6Dt8fPGANgIYJfCtl1vtPWSRFQt/DoNxy5pDilqk0hXneD0QnoimpKI5bieTvaSRFSe+9I+gPSJwjaJdHSy9YM/rIbzIe77bBg/7bq9ow5FiSoJu4oakWnaP7y7QO26qYa2x8+rWES9nZckctBnML5ZP/jDeqibGyfSUXsSiaIYWCX9AVzk5o5ekojK8YkubY+fd3P+71wrQknW/vr3c9WwJUC7FlzO0LgKLL9GJEgmPKHgrAuD2x4/byi49J2SbW/+Tz+nQAa9enD1nne37N22eyHY5js/WbQRwJoAbRLFgZNEbNtPGQ4lizXdvrmPINgc9cXwnkkta8KWFXDmx4mS6nDbY/1Gwd+O9qaAbYd3OQNgP06ssuRVq8f7t9dS2BmwXSKTdYSz1MHrGpGgExKfAhjt5o5uk8gBBF+37/f6bBO46IySq4M1YcsaeN8CEnQ8ZIs1Yct6N3d0lUSsCVvWBYsHgM8xFWvClsXgHhpKrvYehdfFnkEXhza7vaOXAc8Wz2Ecrzc8Lh5re6zf2PxfVW2BJtJNeyGi0z3+XJDZ1EPWhC2Pu72zlyQyz3ssJ/A6XRvlaV9EJmifkOjs42f8Wu3lzq6TiDVhyxJ4HxwtZZ+H+7ZnYa5apaTa7eNnAlUgtCZsucXL/b2u33jK4/1L8XRp0vZYvxvBMRFJowF8D8BlYJEo5awJWzz1CvKCLNB80+sPeE0i7yN4r2CPy8fYB+DsfA8IcKaZSSFrwpaTrAlbllsTtszPD66r3MlNwOa2x/p5Or4BAddVWRO2DPL6M56SiDVhy0sAllS9Y2Xnwl2xodNwrN7qXnAPjXJtj/W7XTqGhGsrmGZ1+/oPcinzCz8/5KnaO+BcL7U9+pUz4axC9asvnF5Nb1f3tu1NAK4N0B75cyOA+V/8y7blIkmm9Bd/s+3tcN431fT32dZeAI/7+UFf9USsiVu/imMbg/zqjerX2O0L3BYHbIv8+eIF2fboV66TDCShCi/7N0XYzk4A37MmbvWzUTZQUaIJcHoTQVRbN2IBgDVxaxiL3ciHtke/8nT+r40V70hRSBf8/a2I2ngfQKs1cavvza6+k4g1cetqAK6WxVbQGd56NKx0pt7NbY9+5ZcAxkkHkkBfLKmwJm5dGtHj985fWfgWqDyiNXHr9wAsQ7D1I5WO7Cs8Bf1TAB8EaIf8c1Umj0K3p+jfM8vcr8Xn43ezJm49yefPfiFwjVVr4tZvw6mg5GdRTDmvAVhoTdz69wVfWw5O81JyfIqi17s1cet9AJ4B8A0Aswu+1dfH4+8G8Jjf4AqFUqjZmrj163Cu2cLYtr8LwO+tiVtva3v0K00FX98EXpdL2lz9LhSi31sTt5aaUGgC8C8A7sn/u8XHY28AsNaauHWiv9COF1q1d2vi1hvgTAcGLSLUC8Ck/GM2A0Dbo1+5JH9NyLUictLV70JRsyZu/W/WxK0n5S9DpsJ7L2Q7gC35oYhQhHpkhDVx6zxr4tYL4VyOBBkE3db26FfuLHjc9gFc7uaVo/vxInHjZnXwjz0+5jYAr1sTt072EU9Zkbww8qO9G+C/Ruq5AAaU+Do34slRfWRB0oX93vwcwMYweyDtIvt0yY+TbIZzieNn49bItke/8nbR1zaAVc6ksCeilp/CzJWsiCKBAD6WvXthTdx6PwC0ze3bCKcrNdLjQxx/+WLbywGcE0pw5BXHo9SqWBi9bW7fqz1sQ5hgTWp5PHBEZSj5dLEmtfwdnF7Ednjb5HNb0eMsBQsVSWE5BnU+R5VNqtakltWoPFywBUCrNanlpCgTCKCwi2pNallsTWr5WwBr4Sy1ba7yIy+i8kI0UotlANTZZk1qcbNfrBdOXOjZCue986Y1qaV76JGVoPw615rUMt+a1HKWNanlG3DWfpTbF3M9gDva5vZ9tOjrU8FFZxK2SweQIG5f34cA/D7/98/hlEV8HcBya1LL+CgCKyXwktcwtM3t+09wtvofgjMI2wHAbmtSy3fL3P/XAIaoi5AAvALgcukgEqI5/yHrStvcvrcDOGxNalkRYUxlRTqw6pY1qWUmgJltc/s+CScLf2JNaplf4Uc4yKceL2fU8XRQXJX3SuS0SCLtPHTBmETU4zoRdYKce62cqXP/a+GtajwF5+csWPInaMEvpYxMIvnum5s6rRQeXs6ocQQeTp/TgZFJJC9IWXzyjs+3GrusSS2LpIPwwuQkEuiAHvLM66n05E8YB8QppdXAqie2/RKcYyW4IE2NVnAXtQpnSAfglbE9EWvyH+ehyv4CCtVn0gEkRJRV3SNhbBLJ6yodQIIcAqfWo7YXwYt6KWd6Egl6+jm5dxgswxC1z63JfxRdOOaH6UlkPpzdwRS9NrAnEjUjp9GNTiLW5D8uB2cNVLEA5KSDiDkjB66NTiJ5nJ1RoxNYnjJqe6QD8CMOSWQjgIPSQSQA1+VE6zCcndLGiUMSyYJTvSocgIFrGAyyzJr8x7ukg/AjDklkCbg5TIWOYI8vSkbt3C1kfBKxJv9xA/gJqUINODsTJWMnCIxPInlGbZ02VEcEO5CMKgv7iAhlzN07U8i25wG4EUB/6VBirBec8gvs9UXD2A/CWPRErCnvzIezGY+icxo4gB2VvTC4yFYskkiesZncIJ8A2C0dRAztsqa8s1w6CL/ilETmg9fsUXofzloGY6/dNWb0ESixSSLWlHeWglOQUWmFk0BaAPSTDSWWTpcOIIjYJJE8ViSPxicAPrOmvLMe3MkbBT8H3msjbklkGVgeIAp7cWws5BPJQGIoC+fcXGPFKolYU94ZDx73GIXDAHbk/2709buGVltT3jFyuXu7WCWRPGOXD2vsVByb/doO9vaoQByTyB7pAGLoDGvKOyvzf98BJpEwNUgHEFQck8hisMsdti+K5eQX9lF43pcOIKh4LHsvYE15Z2Xbj88dixhkeI0cX4zItrkRLxwHAayXDiKoOPZEAI6LhK1b0b93ikQRP7sQg9dqXJPITnDbepS4ViQk1tRt86RjCCquSWQRgJnSQcRIcdI4CFbZD8Op0gGEIZZJxJq6bQOAC6TjiImDAF4v+tpOOEvgKZhYzHLFMonknQHgU+kgYmAfigoIW1O3LQLQQSac2GgFsFo6iDDEOYnMBLBCOogYsPJJo9jZyiOJl73W1G0PSQcRhtgmEWvqthUw9EQxzZQr9tRLaRTxE5vnL7ZJJK8TuJcmqHKnsnUAsEZlIDHTWTqAsMQ6iVhTt30DXAYfVLlCT98DyyX69SmAddJBhCXWSSSvh3QAhiu5hcCaum0lYjJFKWALgGekgwhL7Ja9n8C218BZAl+86pLc+aDsd2ybz6k/bdZd774kHURYYt8Tse56916wiLNfWTjHRJRzGHxu/ThHOoAwxT6J5LEalz/bUDmJbABXrvoRq8PRk5JEXoTB53oI+ti6692l5b5p3fUuK+x7tw/AWukgwpSIJGLd9e4ScOepH25W/Bq/C1WxndZd794gHUSYEpFE8oyuqC0k7eI+rLDvzWfSAYQtMUnEuuvdqxCjuXlFyi00K7QLwGtRBxIjp0sHELb4T/Ee71zpAAzjZh3IRgAnRx1ITBwC8JZ0EGFLTE8k703wlDwvqpaYtO56dwVi2EWPyOuI4VaBRCUR6653/xGcpfHCzeUMEMMuekSOWHe9yyQSA7HZ+BSxVrjvYfA5dSeWM1lJGxMBbPs1AI1wihZReTvg9tLPtjfl7zs8yoBiIJaX0onriVjTtn8blVdhkmM/XK5GtaZt/z6cnguVtw0xHA8BEphE8vpJB2CAT61p270cVMVzfirbZk3bHstKe0lNIo/AOSmPyvNaQ/UguA6nEks6gKgkMolY07bPA+uMVNPT4/2bAXSNII64iG1N2kQmkTwee1CZpxe9NW37agC9I4rFdHsR47U0iU0i1rTtExHD1YMh8lNwiOUSS2sGsEw6iKgkNonksftdnp8ze34MYFPYgcTAEWva9qekg4hK0pPIBwBWSgehod1w6oB6Yk3bvhw8A7mUM6UDiFKik4g1bft0OCUA6Xg74b9iWSwXVAVwCMAA6SCilOgkktcXzsY8OuYg/C/I2wQWgCq0AeUPAIuF5C17L2bb98H5pBgoHYpGelnTd/g7J9a2dwHYDKBPqBGZq4M1fcdJ0kFEKfE9EWv6jpXgC76Y741i+eeTx5ceE9tFZu0Sn0TydoGrLQt5XWhWjEn5mNiPuTGJALCm7/g+EvCJ4YHXJe/FdsGpeEbAAekAosYkcsw+OCPpFJA1fcdVYPGndiWPIY0TJpE8a/qObwP4WDoOTbSE8BgcqHZmuGI/5c0kcrxYVp7y6CAAfzMzx9sJLoM/jARMdzOJHG8xePzBQWv6jplBH8SavuMyANtDiMdkJ1vTd8SyEFEhJpEC1vQd94HLtsO8ho/tzlWXEnHYOZPIiV6XDkBYmGs8+sDfRr64cFst32hMIkXC6MobLsxxoR8BWBLi45kmEcsGuOy9BNu2N8KpCJ9EoX16WtN3vHz0gS89GNbjGeiwdAAqsCdCxcJ+4e8B8JOQH9MUiRgTYhIpLfYLhCoItahQ/d3vXYHkrhlJxPsrEf9JHzYCeF86CAFtAH4TweN+OYLHNEEixkSYREqov/u9eUjmQqmD9Xe/F8VA6Ew45QGSZBeAnHQQKjCJlJfEJfCfR/Gg9Xe/dz+St7N3NxKyCZFJpLyUdAAxk7TK+jkkZGyNSaS8RFzPFolySvIxJKC2RoEaMIkkXhIvZyI76Lz+7vfWIiFvqjyr/u73/Ba7NgqTSHkbAfxCOgiFDsN/hXe3miN+fBLAJFJG/d3vNcM5lyYptkc0M/OF+rvfGw/gSJRt6OToA18aLB2DClz2XoltS0egkpoxINveDqC/krZkWeAGPKJIPAVn+jPuLAAnSwehApNIZadLB6CQkmMe6u/ZuRTJ+ITOgYvNCMB66QAUyULtbNRtAF5U2J6EFBJS4IpJpIL6e3bORzJK/L0EhTMn9ffsXAmgk6r2hDQgAUWaASYRN5JQ4q41nzBV2gBgnuI2VeqGZFy2MYm48Il0AAr0Vt1g/T075wK4WnW7il0iHYAKTCLVxf26dieAXkJtNyPeu3uHSgegApNIdXHf7/EKgJUSDdffs3M84r1mJBEHm3OxWXVx74kMqL9n5yDB9sfBKRMwTjCGqCThUpg9EReUjxco9CaEB47r79n5FJwEEsfNaucend0n7uM+TCJV2fZ22PYR2DZieNtVf8/Ob0k/xfX37DwJtt0Vtr1Rg+ck7Ns10s9v1JhEqvs94ruFXacpyHUABkgHEYHYHz3CJFJF/b1/Wop4nh+yExodNl1/758mwpmpaREOJWw9pQOIGpOIO3E8CvL9+nv/dJd0EIXq7/3TIIR7Ap8Wjs4665+lY4gSk0gVR2edNRjxHGXXta7HEgBrpIMI2SjpAKLEJFJdT0RUBV1YZ+kASqm/90/3ARguHUfIOh2dddad0kFEhUmkugbEs2izzpdo9yHkk/g0ME06gKgwiVQ3AvEcWE1LB1BO/b1/mikdQwQajs4662HpIKLAJFJdDsBN0kFEQPcBzDgmbp2m1EPDJFJdXPfO6Hw5A+if5Py46eiss66VDiJsTCLVdZAOICJdjs466wnpICo4WzqACFgApkgHETYmkQqOzjprCoAe0nFE5GIATdJBVBDX5N1NOoCwMYlUYtsjYdunabD/IqqbvlPXtr1Lg+cnilvPozN7/1D66Q0Tk0hlcbwuL6RlndOjM3vfjnjXJx0tHUCYmEQqi+NK1UINR2f2vkM6iBJGwKmWHlf7js7sHZuqZ0wilW2UDkCBc6UDKOFjxHOBX7uLAcySDiIsTCJlHJ3ZexiAM6XjUECqvmol/QCcIx1ExFSe8xMpJpHyhgMYIh2EAjoeOv1l6QAU6Hp0Zu8R0kGEgUmkvDOkA1Ck9ujM3ndLB1GkVjoABQYCuF06iDAwiZQX9wLNhXQb5EvCgWFATAoWMYmUF8t9DmWcJh1AkV3SASjSKQ6zNEwiJeR/sbGvjVlAt1W5cdx8V0pPAJOkgwiKSaS0sxHvKcZiHY7O7D1GOgjgiwQe102PpfSTDiAoJpFSbLtRg+XRqm9abAyr/6f318G2cxo8H6puLdLPeVBMIqXFfbl7KQekAygQ59WqxYYcnXHmg9JBBMEkUlqSBlXbHZIOoEBcd/CWc4l0AEEwiZSWkw5AwClHZ5ypSzHhJI2JAIYPJDOJlKbTp7IqA6HPepEkrdEBDD9hkUmkNKM/GXzqCH32CiVpZgwABh+dcaaxG/KYRIocnXHmCCTzckYnSRuTOg0Gr0tiEjlRNyTvk7DdZ9IB5CUtiQAG7xdiEilSf98Hi5GMXaSl6PLm1fZMnAgZewnNJFJaEl/EgHPanw70rf0ana7SAfjFJFLk6Iwzr5aOQVDHozPObJIOAvpcVqnU5+iMM3UsVVlVnXQA2rHtzgBOlg5DkHylM9s2tmsfQCcA1wB4SjoQr9gTOVEN9OnWS9BhmrdVOgAhRl7SMImc6BMYPFIeAh0qusWm/qhHRv6/mUSK1P/w31dKxyBMh82HexHvc2fKOSIdgB9MIlRMhzUyh5Cc6maFeDkTIxukAxC0WzoAOGNSidy/dPT+/6Vb0eyqmERK+1Q6AEHiR2vW//Dfl8DQrn0IjDvwm0mktCSuU2iny/R2Un8Hxs0MMomUlrR6FoV0mZnSZQm+arokcdeYRErTYXBRii6vCR3PCFZBlyTumi4vGN2IjwsI0uVFnKQ6q4WM+wDjsvdSbFuHtRLJZttrAAwA0Fc4EtU6SgfgFXsipZ0qHYAgLXbQ1v9o123QqwK9KhwTiYmkVRsv9Il0AAWMe0OFwLhFdkwipSWtUHAhnXbQJjGZGzcmwiRSWiuAfdJBCNFpajWJr0/jEmcSf0lu/BHAW9JBCNFp/8ZGADulg1DMuFkpJpHSNsDws0AC0KY7Xf+jXeMBbJaOQzFtnn+3mERKqP/RrpUw8JcZks7SARTpLR0AVcYkUp5OYwMq6fb/TupGPGMwiZSXxOlFQK/ZGQBYmr+RpphEykvisRGtAF6UDqJQ/Y92LQXwvnQcChlX0Y3L3sux7e1wDrjWrXsfpYPQcZWobZ8mHYJCnOKNkY1I3szAHui5YjJJe5m4dyYu6u//83ro+KkcrX319/9Zx0LV25CchM4kEjNJG1zVsppY/f1/ngkDxwp84mKzmNGltoYqOr+AjRsrSAomkcq2SAegmG4LzQptAPCmdBAK5KQD8IpJpIL6+/98H4Bm6TgU0vbyLX9Jk4SjPIyr78skUl2SniPdl5gPkA5AgR3SAXiVpDeIX8aV8PcpC83rqNTf/+dLoecUdJi0/h2UwiRS3S44a0bibiOAFukgXEjKVK8xmESqW4xkDOh9DDPGf+K+glinei6uMIlUUX//n9fDtvvAthHzW6r+/j+vln6+q7Ltt2DbqzR4vqK69ZR+ir1iEnEnCXs3+kgH4Eb9jN0zEe9aL8adecQk4s5rcJZex5kRSSSvFwwcgHTJuPopTCIu1M/YPRFOIomrNpi1OvcAgO9LBxGBLPSr51IVk4h7F0sHEKF1AB6TDsKt+hm7vwagUTqOCNQC+Il0EF4xibgX5yMkWvO9LZNcJB1ABD6HgTvHmUTcewvxXaNg3GAegPn5W5zsqZ+xe410EF4xibiUnxWI605SkwZVAQD1M3Y/AKBJOo6QfSodgB9MIt7EtaaFqa+DBgDPSAcRIuMKEgHmvnikrISBo+dV7AKwSToIn+6DgVOiFehciqEsJhEP6mfsno/4rRd5E8AK6SD8yF9ijpOOI0Q6F4Uqi9XevbLtQ9IhhOxw/cw966WD8M22AadHMkM4kjAYeUwJeyLeLZcOIGT9pAMI6DLEY83IIRha5oBJxKP6mXtWIl67eo0+uLx+5p51cM4HMr2HeASGlpxgEvFnp3QAIWkFYO6lzDGb4Ax6m+xg/cw906WD8INJxJ+4VDtbWz9zj/ELtupn7vkHAJdLxxGQsT1CJhF/1sDcadFCRs4GlNETZq9gNXZXMpOID/Uz9zyFeOyl6SYdQIhuAnCqdBABGFsjhUkkuT6HobMBpdTP3LMEZleD3ysdgF9MIv5tg6Gj6XmvIx6XZIX2w8wB1kMw+HfBJOLfBzDzBdtub/3MPYulgwhT/cw9g2DmupfV4JhI8tTP3LMCwAjpOAI4WzqAiJg4c/Z5/cw9xi5i5LL3AGzb7gznmIUm2Ug824eY7ki2bXsugC4AbpeOxQMjN961Y08kmPkA3pcOwoeliN/yfQBAataH98G81/W50gEEYdqTrZXUrA8Xw8CCPgC6pGZ9aPJ4TjUdYFZhbePOminEJBJcRwC/kA7CozOkA4hYM5yBbxMcgeFrjphEgnsZ5rxg28W1ViwAIDXrw2aY00PcAOc1ZCwmkYBSsz6cB7NWG85NzfrwXukgFNgAYIt0EC7sh9nrjZhEQnIBzBlg7SIdgAr5AdasdBwutKVmfWhchfdCTCLhmA5nU54JTpEOQCETzlA2fhMkk0gIUrM+XA9zrsGT9DufCWCudBBVGL1GBEjWCypqtXCOo9TZMjh7ZhIhNevD+dB/Za7x70Hj/wO6SM368DLo/3weSc36UPdP5rB9BmfKV0eHEYMqebq/6M1i24Btt+b/1PF2jvRTpFpq1offhG2/r8FzX+q2Dbb9lvRzFBSTSLhWwDmzV1dxO3jLreHSAZTxaWr23mbpIIJiEglRavbeJQC+LB1HGftgzgxS2D4D8BPpIEowdvt/ISaR8OlacPet1Oy9Jtcg9S01e+8/QM+qZ7GYbmcSCVlq9t5BAF6RjqOEHtIBCOsJ/fY4xeIcYSaRaOj4CWPkEY0hug3ONLxOPpYOIAxMItHoBP0GMU0/IS4QDQcwWwG0SAcRBiaRaDwEPS9pEi01e+8V0GfNyJbU7L1PSQcRBiaRCKRm710BoJd0HAV2Qt8BX9V02ZSnW0/VNyaR6HwAfXb2boZ5NU+ishrOmTvSctIBhIVJJCKp2XtvALBDOo68zwB8Kh2EDvK9RB3OeNGlRxQYk0i0GqUDyNuVXwhHDh2OlYjNbBmPjIiSba+EU/XsZuFIzhRuXy+2vQhOIalrBKPQ4ZIqFOyJRCj1wEffg1PIWZoptU6USD3w0VzID2x+Itx+aJhEovdlANulg6ATSFa83wV9Bt0DYxKJ3mTIfup9Ds7MlPIMgNlCbe9MPfBRbA4PYxKJWOqBj9ZCdhBtF2KyMjJM+TfxQKHmY7Fnph2TiBpLIbfsfAeAvUJt6+4UyAxwMomQN6kHPloKuQOKdsNZJ0Inmg5gvEC7sdrHxCSijtR5qx1SD3y0QahtraUe+GgdgBECTfcVaDMyTCLqbIazc1M14881idjHUL+ClZcz5MtaAL8XaLebQJsmWQdgseI2Y7UFgUlEkfwlhUR1sa4CbRoj9cBHzQAuUdxsrHZUc9m7SrbdDKAD1K4g1WHFrN5sW+VzlIUz7R4b7IkolHpw3/1QPzIfi4riUUo9uO8qqFsQuB/AAUVtKcEkEn+61RXVlapB7xw4sEoBqT6vl7Mz+mESIf/ylzS7FTaZmAO8A9oINZd+ryBmiZ1JRMZBhW1xYNWdZqiZNemEGJVGBJhEpKg8CT42ZfiilHpw38tQs8eoC9gToRCoXCF5Snr6adcpbM9kKpLI2XASSWwwiQhIPbjvKajbWXsNZMsAmmSbgjZOg2xBpNAxichpkQ6ATrAJanqJsToXmUlEjsppPo6LuJB6cN8GqEnuOp7V7BuTiBTbtmDbUHS7Pj2tx7PS/2Uj2PZhBb+PDtL/zTAxichRfV0sUYbARCqOP+2SntbjUQXtKMEkIkflgjMAuDI9rccPFbdpIhVV4AYoaEMZJhE5qhcc9QFwseI2TaRqg6RUpbvQMYnIGSrQ5uD0tB5PC7RrhPS0HsMUNndNelqPJoXtRYZJREB6Wo8bITdCH5vjGyPQH2prvUjUdw0dk4iMywXbHpie1uMFwfZ11gtqfzeSr4PQMInIkBxY6weezVuO6gJODXG4pGESkdEg3L7q6uamkDgPRnV919AxichoEW6/k3D7upK4vDC+Gj+TiAzJs3mBmO3dCJHqtTtADMoCsNq7BNuWLp58mnD7erJtiSrs0h8ogbEnQnSMxMHnqqrMR4ZJRIZ0od59wu3rSuLgc+PX7TCJyJA+vOgt4fZ1JdErsATaDBWTiIzNkOsNrEk9/JfpQm1rLfXwX1ZCTXWzQsbvoWESEZB6+C/LobbieyGuEalM9QxNr/Rdf2P0WhEmkeS5VjoAzakeF+kNw38nTCJydgi1u12oXVMsg/rBTqMX/zGJyJG6nFkv1K4RUg//ZS3UH3U6Mn3X38xQ3GZomEQEpO/6mzsAiJwFk3r4L4sl2jWMxAIwY1cRM4nI6IkY7JmIMYmZs5vSd/3NbwXaDYxJRIJt91FY6f34G1Vn2xtg268I/H4Gpqc2GDfIyiSiWHpqw3UArhRsf5RU26ZI/Xj/ywA+EGp+jlC7vjGJqHe9cPudhdvXXnpqwzAAHYWa75me2mBUHVwmEYXSUxt+BqBJOIxYHVcQkW6QPXR7eHpqw/OC7XvCJKJIemrDUOixqOhk6QAMcBGAcwXbbwDQJT21YYxgDK4xiajzpHQAeedIB2CA/lBzEl4lQwGcLxyDK0wiCqSnNvwbnOXNOuiVntpg7MImRaTGQ4qNM+F3xSQSsXyXVLeaEUZ8wgnS6fc1OD214VnpICphecToPQnD90YkkOojTitphPryBJ6wJxKh9NQGG3omEOkar9pKT22QPJ2wnNvTUxtelQ6iHCaRiOQTyJvScZRhfDWtCJ0LoKt0ECUMzY+taYdJJALpKd1t2PZh2PZAseXtlW/ct1OObTfBtjto8DsqdRucntJ9gfRTVIxJJGTpKd3/N4Cd0K9LXMj4knwRklxk5sat6Sndn5UOohCTSIjSU7o/D2cQTPezbnV/o0gy4QiHMekp3X+bntJ9mHQgAJNIaNJTus+AM5LeKB2LC0fSU7pfLR2EpvZLB+DSQACT0lO63ygdCJNICPLdywEw5zJhP2Jw8lpETHpehgAYnJ7S/QnJIJhEAkpP6f40gMFwlimboi31yF/XSAehKdP2Fo0GcDg9pfsb6SndRarGM4kEkJ7SfQ6As2FOD6Sd9Al8OvsjzHt+/gnOa/Cm9JTuTaobZxLxKT2l+wsAhsG5NjWNKdf9yqUe+et34BwuZpqeAEYCGKt6wJXL3n1IT+n+BswYQC3l/dQjf71COgjNmbyO5vL87SRVDbIn4lF6SvcnYW4CaQHwsnQQuks98tcvAVgpHUcQ6Sndf6mqLWXZKg7yYyBNkK814ccrADqlHvnrhdKBmCI9pft7cHb09hUOxY9dAPar+H2zJ+JSenK3G2HbY2DbvTRY/uzl1gbbng3bXs8E4k3qkb9+Cba9NP887tLgd+nl1gu2vTM9udt/RP08sSfiUnpyt+fhDFyZ5CcAeqXmtH5dOhDTpSd3mwRnFmQLnCl9UywEsCs1p/WRqBpgT8S9L0sH4ME2OAcwfVyYQNKTuxl9+ryk1JzWuak5rf81Naf1awDa19gsk4zJpSYAN0fZAHsiLqUnd/sQZqwH2Qhn4Pfy1JzWtdLBxFl6crc/AXgdEb9JQ7AiNaf1hqgenFO87mWlA3ChBUBjak4rPxzUmAjgX+EMWl8uHEslkW4q5OWMew8BeE06iCpqmUDUSc1pXQPg6wB2wOkB6irSs4b4gvMgPbnb03C20TcJh1LKvtSc1v8hHURSpSd3exbAGOk4ivwGwN7UnNbvRtkIeyIepOa03gJnjYhuZQ8/ZwIRtw3A+9JB5C2Gc4n1SNQJBGBPxJf05G5PwDnNrkE6FgC/SM1pvUo6CALSk7u9AeAQ5A5sb581+kVqTusiVY0yifiUntztdgAj4JRC7AigA5wdvf0VhfAigM8ArEvNaTV6iXacpCd3+yGcg8qCrilqg7uC2tvgrE4FgDejXA9SDpNIQOnJ3UbA+eQ5FU7PpA+AziXuugZOkjkjhGZ/A6Bbak7r34XwWBSB9ORu/w9AM5zxsw4efvQQjr1+9sNJJJsA9MOJPd+9AFam5rRODhJrUEwiEUhP6nojjt+kdxjAltTcA8vTk7oOAzABwAXwdybNQQC3puYeWB08UopS/nd9PZyxx05wfueA83rYD+eQrK5wkkYNnNWw6wAcSM09sKLosaal5h54SFHonjCJCElP6voonLUF++C8wFJwNnplAeyBs/GrDc6nzUY4SWi9RKwUjvSkrjfDmd2z4PQ4PgHwaWruAe6sJiIiIiIiIiIiIiIiIiIiIiIionj7/wMQIzZfeB9oAAAAAElFTkSuQmCC',
  3: 'data:image/png;base64,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',
};

function silhueta(sexo: 'M' | 'F', pctG?: number | null): string {
  const cor = pctG == null ? '#10b981'
    : sexo === 'M'
      ? pctG <= 15 ? '#10b981' : pctG <= 22 ? '#f59e0b' : pctG <= 29 ? '#f97316' : '#ef4444'
      : pctG <= 21 ? '#10b981' : pctG <= 29 ? '#f59e0b' : pctG <= 32 ? '#f97316' : '#ef4444';

  const nivel = pctG == null ? 1
    : sexo === 'M'
      ? pctG <= 15 ? 0 : pctG <= 22 ? 1 : pctG <= 29 ? 2 : 3
      : pctG <= 21 ? 0 : pctG <= 29 ? 1 : pctG <= 32 ? 2 : 3;

  const src = sexo === 'M' ? SIL_M[nivel] : SIL_F[nivel];
  return `<img src="${src}" style="width:90px;height:auto;max-height:180px;object-fit:contain;filter:drop-shadow(0 4px 16px ${cor}66)"/>`;
}

// â”€â”€â”€ CSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CSS = (pri: string) => `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 210mm; min-height: 297mm; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; min-height: 297mm; position: relative; page-break-after: always; break-after: page; display: block; overflow: hidden; }
.page:last-child { page-break-after: auto; }

/* Cover */
.cover { min-height: 297mm; height: 297mm; color: white; padding: 34px 38px; display: flex; flex-direction: column; position: relative; overflow: hidden; }
.cover::before { content:''; position:absolute; inset:0; background:
  radial-gradient(circle at 18% 14%, rgba(255,255,255,.22), transparent 28%),
  radial-gradient(circle at 84% 12%, rgba(255,255,255,.14), transparent 24%),
  radial-gradient(circle at 78% 82%, rgba(255,255,255,.12), transparent 30%);
  pointer-events:none;
}
.cover::after { content:''; position:absolute; right:-90px; top:120px; width:430px; height:430px; border-radius:50%; border:1px solid rgba(255,255,255,.18); box-shadow: inset 0 0 0 34px rgba(255,255,255,.035), inset 0 0 0 92px rgba(255,255,255,.028); pointer-events:none; }
.cover-shell { position:relative; z-index:1; height:100%; display:flex; flex-direction:column; }
.cover-top { display:flex; align-items:center; justify-content:space-between; gap:20px; padding-bottom:26px; border-bottom:1px solid rgba(255,255,255,.16); }
.cover-brand { display:flex; align-items:center; gap:14px; min-width:0; }
.cover-logo { width: 58px; height: 58px; background:rgba(255,255,255,.96); border-radius: 16px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.5); flex-shrink: 0; box-shadow:0 18px 45px rgba(15,23,42,.18); overflow:hidden; }
.cover-main { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 48px 0 42px; max-width: 690px; }
.cover-badge { width:max-content; background:rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.34); padding: 8px 18px; border-radius: 100px; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #ffffff; margin-bottom: 28px; backdrop-filter: blur(8px); }
.cover-name { font-weight: 850; letter-spacing: -1.2px; color:#ffffff; text-transform: uppercase; margin-bottom: 18px; text-wrap: nowrap; white-space: nowrap; max-width: 100%; }
.cover-subtitle { font-size: 15px; line-height: 1.55; color: rgba(255,255,255,.76); max-width: 610px; margin-bottom: 34px; }
.cover-chip-grid { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:12px; max-width: 650px; }
.cover-signature { display:flex; align-items:stretch; padding-top:22px; border-top:1px solid rgba(255,255,255,.16); }
.cover-sign-card { border:1px solid rgba(255,255,255,.22); background:rgba(255,255,255,.11); border-radius:18px; padding:16px 18px; backdrop-filter: blur(10px); }
.cover-label { font-size:8.5px; font-weight:800; color:rgba(255,255,255,.58); text-transform:uppercase; letter-spacing:1.6px; margin-bottom:7px; }
.cover-value { font-size:14px; font-weight:650; color:#ffffff; line-height:1.35; }
.chip { background:rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.35); padding: 12px 22px; border-radius: 12px; text-align: center; min-width: 95px; }
.chip-label { font-size: 9px; font-weight: 500; color: rgba(255,255,255,0.75); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.chip-val { font-size: 15px; font-weight: 700; color: #ffffff; }

.page:not(.cover) { min-height: 297mm; height: 297mm; padding-bottom: 70px !important; }
.pdf-footer {
  position:absolute;
  left:36px;
  right:36px;
  bottom:14px;
  height:30px;
  display:flex;
  align-items:center;
  justify-content:center;
  border:1px solid #e2e8f0;
  border-radius:999px;
  background:rgba(255,255,255,.96);
  color:#64748b;
  box-shadow:0 10px 24px rgba(15,23,42,.05);
  font-size:7.5px;
  line-height:1;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  padding:0 16px;
}
.pdf-footer-main { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:center; opacity:.78; }
.pdf-footer-page { flex:0 0 auto; margin-left:12px; padding:4px 10px; border-radius:999px; background:${pri}10; border:1px solid ${pri}33; color:${pri}; font-weight:800; }

/* Summary */
.summary { background: #ffffff; color: #0f172a; padding: 30px 36px 28px; }
.sum-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 22px; border-bottom: 1px solid #e2e8f0; margin-bottom: 26px; }
.metric-chip { text-align: center; padding: 12px 18px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; min-width: 88px; }
.metric-chip-val { font-size: 22px; font-weight: 700; }
.metric-chip-unit { font-size: 11px; color: #94a3b8; }
.metric-chip-label { font-size: 9px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; margin-top: 4px; }
.sum-body { display: flex; gap: 28px; align-items: flex-start; }
.silhouette-card { flex-shrink: 0; width: 130px; display: flex; flex-direction: column; align-items: center; padding: 18px 14px; background:#f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; }
.sil-label { font-size: 9px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
.sil-status { margin-top: 12px; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 600; }
.gauges-wrap { flex: 1; }
.gauges-grid { display: grid; grid-template-columns: 1.35fr 1fr 1fr; gap: 14px; }
.gauge-card { background:#f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; padding: 18px 14px; display: flex; flex-direction: column; align-items: center; }
.gauge-card.main { grid-row: span 2; padding: 22px 18px; }
.gauge-legend { display: flex; justify-content: center; gap: 20px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
.leg-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; margin-right: 6px; }

/* Modules */
.module { background: #ffffff; color: #111827; padding: 30px 36px 70px; position: relative; overflow: hidden; }
.module::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: linear-gradient(to bottom, ${pri}, ${pri}aa); }
.mod-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; border-bottom: 1px solid #e5e7eb; margin-bottom: 22px; break-after: avoid; page-break-after: avoid; }
.mod-title { font-size: 26px; font-weight: 700; color: #111827; }
.score-pill { padding: 9px 18px; background: linear-gradient(135deg, ${pri}, ${pri}cc); border-radius: 100px; color: #fff; font-weight: 700; font-size: 17px; box-shadow: 0 4px 12px ${pri}44; display: flex; align-items: center; gap: 8px; }
.score-pill-lbl { font-size: 10px; font-weight: 500; opacity: .85; text-transform: uppercase; letter-spacing: .5px; }
.data-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 26px; }
.data-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; color: #0f172a; break-inside: avoid; page-break-inside: avoid; }
.dc-label { font-size: 10px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 6px; }
.dc-val { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1; }
.dc-unit { font-size: 13px; font-weight: 400; color: #94a3b8; margin-left: 3px; }
.dc-status { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; padding: 3px 10px; border-radius: 100px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
.st-good { background: rgba(16,185,129,.2); color: #10b981; }
.st-warn { background: rgba(245,158,11,.2); color: #f59e0b; }
.st-bad  { background: rgba(239,68,68,.2); color: #ef4444; }
.kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 22px; }
.kpi { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; break-inside: avoid; page-break-inside: avoid; }
.kpi-label { font-size: 9px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 5px; }
.kpi-val { font-size: 15px; font-weight: 750; color: #111827; line-height: 1.18; letter-spacing: 0; overflow-wrap: normal; word-break: normal; hyphens: none; }
.kpi-unit { font-size: 10px; color: #9ca3af; font-weight: 400; }
.anam-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 22px; }
.anam-card { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:12px 14px; min-height:64px; break-inside: avoid; page-break-inside: avoid; }
.anam-card.wide { grid-column:1/-1; min-height:56px; }
.anam-value { font-size:13px; font-weight:500; color:#111827; line-height:1.45; letter-spacing:0; }
.anam-card.wide .anam-value { font-size:13px; font-weight:500; }
.sec-sub { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin: 18px 0 12px; }
.pdf-keep-group { break-inside: avoid; page-break-inside: avoid; }
table { width: 100%; border-collapse: collapse; font-size: 13px; break-inside: auto; page-break-inside: auto; }
th { text-align: left; padding: 10px 14px; background: #f3f4f6; color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
td { padding: 10px 14px; color: #374151; border-bottom: 1px solid #f3f4f6; }
tr { break-inside: avoid; page-break-inside: avoid; }
tr:last-child td { border-bottom: none; }
.ai-box { background: #f0fdf4; border-left: 4px solid ${pri}; border-radius: 0 12px 12px 0; padding: 18px 22px; margin-top: 20px; break-inside: auto; page-break-inside: auto; }
.ai-title { font-size: 11px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.ai-text { font-size: 13px; line-height: 1.7; color: #374151; }
.dark-block { background: #f1f5f9; border-radius: 12px; padding: 18px 22px; color: white; margin-bottom: 18px; break-inside: avoid; page-break-inside: avoid; }
.dark-label { font-size: 8px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
.prog-bar { background: #1f2937; border-radius: 999px; height: 8px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#10b981,#06b6d4); }
.tag { display: inline-block; padding: 2px 8px; background: #e5e7eb; border-radius: 4px; font-size: 10px; color: #6b7280; }
.asym-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 100px; font-size: 10px; font-weight: 700; }
.side-d { border: 1.5px solid #3b82f620; border-radius: 10px; padding: 14px; background: #3b82f605; break-inside: avoid; page-break-inside: avoid; }
.side-e { border: 1.5px solid #8b5cf620; border-radius: 10px; padding: 14px; background: #8b5cf605; break-inside: avoid; page-break-inside: avoid; }
img, svg { break-inside: avoid; page-break-inside: avoid; }
.data-grid, .kpi-grid, .anam-grid { break-inside: auto; page-break-inside: auto; }
.mod-head, .score-pill, .metric-chip, .gauge-card, .silhouette-card { break-inside: avoid; page-break-inside: avoid; }
.module div[style*="border-radius:8px"],
.module div[style*="border-radius:10px"],
.module div[style*="border-radius:12px"],
.module div[style*="border-radius:14px"],
.module div[style*="border:1px solid"],
.summary div[style*="border-radius:8px"],
.summary div[style*="border-radius:10px"],
.summary div[style*="border-radius:12px"],
.summary div[style*="border-radius:14px"],
.summary div[style*="border:1px solid"] {
  break-inside: avoid;
  page-break-inside: avoid;
}
p, li { orphans: 3; widows: 3; }
.side-title-d { font-size: 10px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 10px; }
.side-title-e { font-size: 10px; font-weight: 700; color: #8b5cf6; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 10px; }
.ref-section { padding: 28px 36px; background: white; }
.footer-note { margin-top: 16px; font-size: 8.5px; color: #9ca3af; line-height: 1.6; border-top: 1px solid #e5e7eb; padding-top: 14px; }
`;

// â”€â”€â”€ IA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function aiBlock(a: (AnaliseIA & {texto_editado?:string|null}) | undefined): string {
  if (!a) return '';
  const body = a.texto_editado
    ? `<p class="ai-text">${x(a.texto_editado)}</p>`
    : [
        a.interpretacao ? `<p class="ai-text" style="margin-bottom:8px">${x(a.interpretacao)}</p>` : '',
        a.achados?.length    ? mkList('Achados', a.achados, '#374151') : '',
        a.riscos?.length     ? mkList('âš  Riscos', a.riscos, '#b91c1c') : '',
        a.recomendacoes?.length ? mkList('RecomendaÃ§Ãµes', a.recomendacoes, '#374151') : '',
      ].join('');
  if (!body.trim()) return '';
  return `<div class="ai-box">
  <div class="ai-title">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#059669" style="flex-shrink:0"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>
    AnÃ¡lise clÃ­nica
  </div>
  ${body}
</div>`;
}

function mkList(t: string, items: string[], col: string): string {
  return `<div style="margin-bottom:8px"><div style="font-size:10px;font-weight:700;color:${col};margin-bottom:4px">${t}</div>
  <ul style="padding-left:16px;font-size:12px;color:#374151">${items.map(i=>`<li style="margin-bottom:2px">${x(i)}</li>`).join('')}</ul></div>`;
}

// â”€â”€â”€ SeÃ§Ãµes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


// Rodape de identificacao usado pelo Puppeteer como footer real do PDF.
// Ele fica fora do fluxo do HTML para nao ser empurrado por modulos longos.
export function renderLaudoFooterHTML(d: LaudoData): string {
  const c = d.clinica;
  const empresa = c?.nome ?? '';
  const pri = c?.cor_primaria ?? '#0f766e';
  const avNome  = d.avaliador.nome;
  const avCons  = d.avaliador.conselho ?? '';
  const avEsp   = d.avaliador.especialidade ?? '';
  const pacNome = d.paciente.nome;
  const pacCpf  = d.paciente.cpf ?? '';

  const cpfFmt = pacCpf.replace(/\D/g,'').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4');
  const centro = `${avNome}${avCons ? ` · ${avCons}` : ''}${avEsp ? ` · ${avEsp}` : ''}`;
  const paciente = `${pacNome}${cpfFmt ? ` · CPF: ${cpfFmt}` : ''}`;

  return limparTextoHTML(`<div style="
    width:100%;
    height:42px;
    padding:0 11mm 5px;
    box-sizing:border-box;
    font-family:Arial,Helvetica,sans-serif;
    color:#64748b;
    background:linear-gradient(180deg,rgba(255,255,255,.96),#ffffff);
  ">
    <div style="height:3px;border-radius:999px;background:linear-gradient(90deg,${x(pri)},#38bdf8,rgba(226,232,240,.35));margin:0 0 6px;"></div>
    <div style="
      height:28px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      border:1px solid #e2e8f0;
      border-radius:999px;
      padding:0 10px;
      box-shadow:0 8px 18px rgba(15,23,42,.05);
      background:#ffffff;
      font-size:7.5px;
      line-height:1;
    ">
      <div style="width:28%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700;color:#0f172a">${x(empresa || 'Diagnóstico Fisiometabólico')}</div>
      <div style="width:38%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;color:#475569">${x(centro)}</div>
      <div style="width:27%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right;color:#475569">${x(paciente)}</div>
      <div style="
        min-width:42px;
        margin-left:8px;
        padding:5px 8px;
        border-radius:999px;
        background:${x(pri)}12;
        border:1px solid ${x(pri)}33;
        color:${x(pri)};
        font-weight:700;
        text-align:center;
      "><span class="pageNumber"></span>/<span class="totalPages"></span></div>
    </div>
  </div>`);
}

function pgCapa(d: LaudoData): string {
  const c = d.clinica;
  const g1 = c?.cor_gradient_1 ?? '#052e16', g2 = c?.cor_gradient_2 ?? '#065f46', g3 = c?.cor_gradient_3 ?? '#059669';
  const nomeLen = (d.paciente.nome ?? '').length;
  const nomeFont = nomeLen > 58 ? 28 : nomeLen > 50 ? 31 : nomeLen > 44 ? 34 : nomeLen > 38 ? 37 : nomeLen > 32 ? 40 : nomeLen > 27 ? 43 : 50;
  const logoInner = c?.logo_url
    ? `<img src="${x(c.logo_url)}" style="width:48px;height:48px;object-fit:contain;display:block"/>`
    : `<span style="font-size:22px;font-weight:900;color:${x(c?.cor_primaria ?? '#059669')}">${x((c?.nome??'D').charAt(0))}</span>`;
  const clinicaNome = c?.nome ?? 'Diagnóstico Fisiometabólico';
  const contato = [c?.telefone, c?.email, c?.site].filter(Boolean).join(' · ');
  const avaliadorLinha = [d.avaliador.conselho, d.avaliador.especialidade].filter(Boolean).join(' · ');
  return `<section class="page cover" style="background:linear-gradient(135deg,${g1} 0%,${g2} 52%,${g3} 100%)">
  <div class="cover-shell">
    <div class="cover-top">
      <div class="cover-brand">
        <div class="cover-logo">${logoInner}</div>
        <div style="min-width:0">
          <div style="font-size:16px;font-weight:750;color:rgba(255,255,255,.96);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:420px">${x(clinicaNome)}</div>
          ${contato ? `<div style="font-size:9.5px;color:rgba(255,255,255,.62);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:500px">${x(contato)}</div>` : ''}
        </div>
      </div>
      <div style="text-align:right">
        <div class="cover-label" style="margin-bottom:5px">Emissão</div>
        <div style="font-size:13px;font-weight:700;color:#ffffff">${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
    </div>

    <div class="cover-main">
      <div class="cover-badge">Avaliação fisiometabólica</div>
      <h1 class="cover-name" style="font-size:${nomeFont}px;line-height:1.02;overflow:hidden;text-overflow:clip">${x(d.paciente.nome)}</h1>
      <div class="cover-subtitle">Relatório técnico de composição corporal, capacidades funcionais e indicadores fisiometabólicos.</div>
      <div class="cover-chip-grid">
        ${[
          ['Paciente', d.paciente.sexo==='M'?'Masculino':'Feminino'],
          ['Idade', `${d.paciente.idade} anos`],
          ['Avaliação', fd(d.avaliacao.data)],
          ['Tipo', d.avaliacao.tipo],
        ].map(([l,v])=>`<div class="chip" style="min-width:0;padding:13px 14px;text-align:left;border-radius:16px;background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.26)"><div class="chip-label">${x(l)}</div><div class="chip-val" style="font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${x(v)}</div></div>`).join('')}
      </div>
    </div>

    <div class="cover-signature">
      <div class="cover-sign-card" style="width:100%">
        <div class="cover-label">Avaliador responsável</div>
        <div class="cover-value">${x(d.avaliador.nome)}</div>
        ${avaliadorLinha ? `<div style="font-size:10.5px;color:rgba(255,255,255,.66);margin-top:4px">${x(avaliadorLinha)}</div>` : ''}
      </div>
    </div>
  </div>
</section>`;
}

function pgResumo(d: LaudoData): string {
  const ant = d.dados.antropometria, bio = d.dados.bioimpedancia;
  const peso   = ant?.peso ?? bio?.peso_kg;
  const pctG   = ant?.percentual_gordura ?? bio?.percentual_gordura;
  const mlg    = ant?.massa_magra ?? bio?.massa_livre_gordura_kg;
  const imc    = ant?.imc ?? bio?.imc;
  const tmb    = bio?.taxa_metabolica_basal_kcal;
  const gordV  = bio?.gordura_visceral_nivel;
  const soma   = ant?.somatotipo;
  const somaClass = soma?.classificacao;
  const somaTrio = soma?.endomorfia != null
    ? `${x(soma.endomorfia)}-${x(soma.mesomorfia ?? 'â€”')}-${x(soma.ectomorfia ?? 'â€”')}`
    : '';
  const msg    = d.analisesIA?.conclusao_global?.texto_editado ?? d.analisesIA?.conclusao_global?.mensagem_paciente ?? '';

  const gorCor = pctG == null ? '#10b981' : d.paciente.sexo === 'M'
    ? pctG <= 15 ? '#10b981' : pctG <= 22 ? '#f59e0b' : pctG <= 29 ? '#f97316' : '#ef4444'
    : pctG <= 21 ? '#10b981' : pctG <= 29 ? '#f59e0b' : pctG <= 32 ? '#f97316' : '#ef4444';

  const statusLbl = pctG == null ? 'â€”' : d.paciente.sexo === 'M'
    ? pctG <= 10 ? 'Essencial' : pctG <= 17 ? 'AtlÃ©tico' : pctG <= 25 ? 'Fitness' : pctG <= 29 ? 'AceitÃ¡vel' : 'Obeso'
    : pctG <= 14 ? 'Essencial' : pctG <= 21 ? 'AtlÃ©tica' : pctG <= 29 ? 'Fitness' : pctG <= 32 ? 'AceitÃ¡vel' : 'Obesa';

  // Barra de escala de gordura (tipo termÃ´metro horizontal)
  const escalaM = [{l:'Essencial',max:10},{l:'AtlÃ©tico',max:17},{l:'Fitness',max:25},{l:'AceitÃ¡vel',max:29},{l:'Obeso',max:50}];
  const escalaF = [{l:'Essencial',max:14},{l:'AtlÃ©tica',max:21},{l:'Fitness',max:29},{l:'AceitÃ¡vel',max:32},{l:'Obesa',max:50}];
  const escala  = d.paciente.sexo === 'M' ? escalaM : escalaF;
  const escCores= ['#06b6d4','#10b981','#f59e0b','#f97316','#ef4444'];
  const escTotal = 50;
  const indicadorPct = pctG != null ? Math.min(100, (pctG / escTotal) * 100) : null;

  const barraEscala = `
  <div style="margin-top:14px">
    <div style="font-size:9px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Escala % Gordura Corporal</div>
    <div style="position:relative;height:14px;border-radius:7px;overflow:hidden;display:flex">
      ${escala.map((z,i) => {
        const prev = i===0 ? 0 : escala[i-1].max;
        const w = ((z.max - prev) / escTotal * 100).toFixed(1);
        return `<div style="width:${w}%;background:${escCores[i]}"></div>`;
      }).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr;gap:3px;margin-top:8px">
      ${escala.map((z,i) => `<div style="display:flex;align-items:center;gap:5px;min-width:0">
        <span style="width:7px;height:7px;border-radius:2px;background:${escCores[i]};flex-shrink:0"></span>
        <span style="font-size:8px;font-weight:700;color:#475569;white-space:nowrap;line-height:1.15">${z.l}</span>
      </div>`).join('')}
    </div>
    ${indicadorPct != null ? `
    <div style="position:relative;height:16px;margin-top:0">
      <div style="position:absolute;left:${indicadorPct.toFixed(1)}%;top:-10px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center">
        <div style="width:2px;height:10px;background:${gorCor};border-radius:2px"></div>
        <div style="font-size:9px;font-weight:800;color:${gorCor};white-space:nowrap;margin-top:1px">${pctG}%</div>
      </div>
    </div>` : ''}
  </div>`;

  const scoreItems = [
    {label:'Postura',v:d.scores.postura,icon:''},
    {label:'Composição',v:d.scores.composicao_corporal,icon:''},
    {label:'Força',v:d.scores.forca,icon:''},
    ...(d.scores.flexibilidade!=null?[{label:'Flexibilidade',v:d.scores.flexibilidade,icon:''}]:[]),
    {label:'Cardio',v:d.scores.cardiorrespiratorio,icon:''},
  ];
  const scoreInfo: Record<string, { escopo: string; leitura: string }> = {
    Postura: {
      escopo: 'Achados posturais e alinhamento',
      leitura: 'Score 0-100 da posturografia.',
    },
    'Composição': {
      escopo: 'Gordura, massa magra, IMC e RCQ',
      leitura: 'Score composto; não é apenas % de gordura.',
    },
    'Força': {
      escopo: 'Preensão, dinamometria e assimetria',
      leitura: 'Score 0-100; kgf/kg ficam no módulo.',
    },
    'Flexibilidade': {
      escopo: 'Banco de Wells e classificação',
      leitura: 'Score 0-100 da mobilidade avaliada.',
    },
    Cardio: {
      escopo: 'VO2máx, FC e zonas de treino',
      leitura: 'Score 0-100; não é BPM isolado.',
    },
  };
  const miniVelocimetro = (valor: number | null) => {
    const pct = Math.max(0, Math.min(100, valor ?? 0));
    const ang = Math.PI * (1 - pct / 100);
    const cx = 45, cy = 42, r = 31;
    const nx = (cx + (r - 7) * Math.cos(ang)).toFixed(1);
    const ny = (cy - (r - 7) * Math.sin(ang)).toFixed(1);
    const cor = zoneColor(valor);
    return `<div style="display:flex;flex-direction:column;align-items:center;line-height:1">
    <svg width="96" height="64" viewBox="0 0 90 64" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;display:block">
      <defs>
        <filter id="miniGaugeShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity=".16"/>
        </filter>
      </defs>
      <path d="M14 42 A31 31 0 0 1 76 42" fill="none" stroke="#0f172a" stroke-width="11" stroke-linecap="round" opacity=".9"/>
      <path d="M14 42 A31 31 0 0 1 76 42" fill="none" stroke="#e2e8f0" stroke-width="8" stroke-linecap="round"/>
      <path d="M14 42 A31 31 0 0 1 76 42" fill="none" stroke="url(#miniScoreGrad)" stroke-width="8" stroke-linecap="round" filter="url(#miniGaugeShadow)"/>
      <path d="M14 42 A31 31 0 0 1 76 42" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".45"/>
      <line x1="14" y1="42" x2="18" y2="42" stroke="#475569" stroke-width="1.2"/>
      <line x1="45" y1="11" x2="45" y2="15" stroke="#475569" stroke-width="1.2"/>
      <line x1="76" y1="42" x2="72" y2="42" stroke="#475569" stroke-width="1.2"/>
      ${valor != null ? `<line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="#0f172a" stroke-width="3" stroke-linecap="round" filter="url(#miniGaugeShadow)"/><circle cx="${cx}" cy="${cy}" r="5.5" fill="#fff" stroke="#cbd5e1"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="#0f172a"/>` : ''}
    </svg>
    <div style="font-size:14px;font-weight:900;color:${cor};margin-top:-2px">${valor ?? '—'}</div>
    </div>`;
  };

  return `<section class="page summary" style="display:flex;flex-direction:column">

  <!-- â”€â”€ HEADER â”€â”€ -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:1px solid #e2e8f0;margin-bottom:20px">
    <div>
      <div style="font-size:10px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px">Resumo da AvaliaÃ§Ã£o</div>
      <div style="font-size:28px;font-weight:800;letter-spacing:-.5px;color:#0f172a">${x(d.paciente.nome)}</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:4px">
        ${d.paciente.sexo==='M'?'Masculino':'Feminino'} Â· ${d.paciente.idade} anos Â· ${fd(d.avaliacao.data)} Â· ${x(d.avaliacao.tipo)}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:9px;color:rgba(255,255,255,.65);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Avaliador</div>
      <div style="font-size:14px;font-weight:600;color:#0f172a;font-weight:600">${x(d.avaliador.nome)}</div>
    </div>
  </div>

  <!-- â”€â”€ CORPO PRINCIPAL: score + capacidades â”€â”€ -->
  <div style="display:grid;grid-template-columns:180px 1fr;gap:20px;align-items:start">

    <!-- COLUNA ESQUERDA: score global -->
    <div style="display:flex;flex-direction:column;align-items:center;gap:12px">

      <!-- Score global grande -->
      <div style="text-align:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:14px 20px;width:100%">
        <div style="font-size:9px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Score Global</div>
        ${gauge(d.scores.global, '', 'sm')}
      </div>

    </div>

    <!-- COLUNA DIREITA: gauges dos mÃ³dulos -->
    <div style="display:flex;flex-direction:column;gap:10px">
      <svg width="0" height="0" style="position:absolute">
        <defs><linearGradient id="miniScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="48%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#10b981"/></linearGradient></defs>
      </svg>
      <div style="font-size:9px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Capacidades avaliadas</div>
      ${scoreItems.map(s => {
        const sc = s.v;
        const cor = zoneColor(sc);
        const lbl = zoneLabel(sc);
        const pct = sc != null ? sc : 0;
        const info = scoreInfo[s.label] ?? { escopo: 'Domínio avaliado', leitura: 'Score 0-100.' };
        return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:14px">
          <div style="flex-shrink:0;width:96px;height:82px;position:relative">${miniVelocimetro(sc)}</div>
          <!-- label + barra -->
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="font-size:13px;font-weight:700;color:#0f172a">${s.label}</div>
              <div style="font-size:10px;font-weight:600;padding:2px 10px;border-radius:100px;background:${cor}20;color:${cor}">${lbl}</div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:7px">
              <span style="font-size:8px;font-weight:800;color:#334155;background:#ffffff;border:1px solid #e2e8f0;border-radius:999px;padding:2px 7px">Score 0-100</span>
              <span style="font-size:8px;font-weight:700;color:#64748b;background:#ffffff;border:1px solid #e2e8f0;border-radius:999px;padding:2px 7px">${x(info.escopo)}</span>
            </div>
            <div style="font-size:9px;color:#64748b;line-height:1.35;margin-bottom:7px">${x(info.leitura)}</div>
            <div style="background:#e2e8f0;border-radius:999px;height:6px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,${cor}88,${cor});border-radius:999px;transition:width .3s"></div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>

  </div>

  <!-- â”€â”€ MENSAGEM DO PACIENTE â”€â”€ -->
  ${msg ? `
  <div style="margin-top:18px;padding:16px 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;display:flex;gap:12px;align-items:flex-start">
    <div style="font-size:18px;flex-shrink:0">ðŸ’¬</div>
    <div style="font-size:12px;color:#166534;font-style:italic;line-height:1.65">${x(msg)}</div>
  </div>` : ''}

</section>`;
}

function pgModulo(titulo: string, score: number | null, content: string, ia?: AnaliseIA & {texto_editado?:string|null}, _rodape = ''): string {
  return `<section class="page module">
  <div class="mod-head">
    <h2 class="mod-title">${x(titulo)}</h2>
    ${score!=null?`<div class="score-pill"><span class="score-pill-lbl">Score</span>${score}</div>`:''}
  </div>
  ${content}
  ${aiBlock(ia)}
  ${_rodape}
</section>`;
}

function kpi(label: string, val: any, unit = '') {
  return `<div class="kpi"><div class="kpi-label">${x(label)}</div><div class="kpi-val">${val??'â€”'}<span class="kpi-unit">${unit?' '+unit:''}</span></div></div>`;
}

function pgAnamnese(a: any, ia?: any): string {
  if (!a) return '';

  // â”€â”€ Modo dinÃ¢mico: quando hÃ¡ respostas + template â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (a.respostas && typeof a.respostas === 'object' && Object.keys(a.respostas).length > 0) {
    const resps = a.respostas;
    const campos: Array<{id:string;tipo:string;label:string;unidade?:string}> =
      Array.isArray(a._campos) ? a._campos : [];

    if (campos.length > 0) {
      // Agrupar por seÃ§Ã£o
      type Grupo = { titulo: string|null; items: Array<{label:string;valor:any;tipo:string;unidade?:string}> };
      const grupos: Grupo[] = [];
      let cur: Grupo = { titulo: null, items: [] };

      for (const c of campos) {
        if (c.tipo === 'secao') {
          if (cur.items.length > 0 || cur.titulo) grupos.push(cur);
          cur = { titulo: c.label, items: [] };
        } else {
          const val = resps[c.id];
          if (val !== null && val !== undefined && val !== '') {
            let display = val;
            if (c.tipo === 'boolean') display = val ? 'Sim' : 'NÃ£o';
            if (c.tipo === 'escala') display = `${val}/10`;
            cur.items.push({ label: c.label, valor: display, tipo: c.tipo, unidade: c.unidade });
          }
        }
      }
      if (cur.items.length > 0 || cur.titulo) grupos.push(cur);

      return grupos.map(g => `
        ${g.titulo ? `<div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin:12px 0 6px">${x(g.titulo)}</div>` : ''}
        <div class="anam-grid">
          ${g.items.map(it => {
            const labelNorm = it.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const destaque = it.tipo === 'texto_longo' || /objetivo|queixa|historico|lesao|sono/.test(labelNorm);
            return destaque
              ? `<div class="anam-card wide"><div class="kpi-label">${x(it.label)}</div><div class="anam-value">${x(String(it.valor))}${it.unidade ? ` <span class="kpi-unit">${x(it.unidade)}</span>` : ''}</div></div>`
              : `<div class="anam-card"><div class="kpi-label">${x(it.label)}</div><div class="anam-value">${x(String(it.valor))}${it.unidade ? ` <span class="kpi-unit">${x(it.unidade)}</span>` : ''}</div></div>`;
          }).join('')}
        </div>`
      ).join('') + aiBlock(ia);
    }

    // template sem campos mapeados: exibir respostas como chave-valor
    const entries = Object.entries(resps).filter(([,v]) => v !== null && v !== undefined && v !== '');
    return `<div class="kpi-grid">
      ${entries.map(([k, v]) => kpi(k.replace(/_/g,' '), String(v))).join('')}
    </div>${aiBlock(ia)}`;
  }

  // â”€â”€ Modo legado: campos diretos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const hist = a.historico_medico ?? {};
  const pos  = Object.entries(hist).filter(([,v])=>v).map(([k])=>k.replace(/_/g,' ')).join(', ')||'Nenhum';
  const af   = a.atividade_fisica ?? {};
  return `
    ${a.queixa_principal?`<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;margin-bottom:14px"><div class="kpi-label">Queixa principal</div><div style="font-size:13px;color:#111827;margin-top:4px;font-weight:500;line-height:1.5">${x(a.queixa_principal)}</div></div>`:''}
    <div class="kpi-grid">
      ${a.historico_medico?kpi('HistÃ³rico mÃ©dico',pos):''}
      ${a.medicamentos?kpi('Medicamentos',a.medicamentos):''}
      ${af.tipo?kpi('Atividade fÃ­sica',`${af.tipo} Â· ${af.frequencia??0}Ã—/sem`):''}
      ${kpi('Objetivos',a.objetivos)}
    </div>
    ${aiBlock(ia)}`;
}

function pgSinais(s: any, ia?: any): string {
  if (!s) return '';
  const pa = s.pa_sistolica&&s.pa_diastolica?`${s.pa_sistolica}/${s.pa_diastolica}`:null;
  // Retorna apenas conteÃºdo interno
  return `<div class="kpi-grid">
    ${pa?kpi('PressÃ£o arterial',pa,'mmHg'):''}
    ${kpi('FC repouso',s.fc_repouso,'bpm')}
    ${kpi('SpOâ‚‚',s.spo2,'%')}
    ${kpi('Temperatura',s.temperatura,'Â°C')}
    ${kpi('Freq. resp.',s.freq_respiratoria,'irpm')}
  </div>
  ${aiBlock(ia)}`;
}

// PÃ¡gina combinada: Anamnese (metade sup) + Sinais Vitais (metade inf)
function pgSinaisAnamnese(a: any, s: any, iaA: any, iaS: any, pri = '#059669'): string {
  if (!a && !s) return '';
  const pri2 = '#059669'; // fallback â€” serÃ¡ sobrescrito pelo pri do caller
  return `<section class="page module" style="display:flex;flex-direction:column">
  <div class="mod-head" style="margin-bottom:0;padding-bottom:16px">
    <h2 class="mod-title">Anamnese &amp; Sinais Vitais</h2>
  </div>

  <!-- â”€â”€ METADE SUPERIOR: Anamnese â”€â”€ -->
  <div style="padding:20px 0 18px;border-bottom:2px dashed #e5e7eb">
    <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:14px;display:flex;align-items:center;gap:8px">
      <span style="width:3px;height:18px;background:${pri};border-radius:2px;display:inline-block"></span>
      Anamnese
    </div>
    ${a ? pgAnamnese(a, iaA) : '<p style="color:#9ca3af;font-size:13px">NÃ£o realizada</p>'}
  </div>

  <!-- â”€â”€ METADE INFERIOR: Sinais Vitais â”€â”€ -->
  <div style="padding:20px 0 0">
    <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:14px;display:flex;align-items:center;gap:8px">
      <span style="width:3px;height:18px;background:${pri};border-radius:2px;display:inline-block"></span>
      Sinais Vitais
    </div>
    ${s ? pgSinais(s, iaS) : '<p style="color:#9ca3af;font-size:13px">NÃ£o realizado</p>'}
  </div>
</section>`;
}

function pgPostura(p: any, score: number | null, ia?: any): string {
  if (!p) return '';
  const alin = p.alinhamentos??{};
  const desv = Object.entries(alin).filter(([,v])=>v).map(([k])=>k.replace(/_/g,' '));
  const fotos = ['foto_anterior','foto_posterior','foto_lateral_dir','foto_lateral_esq']
    .map((k,i)=>p[k]?`<div style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb"><img src="${x(p[k])}" style="width:100%;height:200px;object-fit:contain;display:block;background:#f8fafc"/><div style="font-size:10px;color:#6b7280;text-align:center;padding:5px">${['Anterior','Posterior','Lateral D','Lateral E'][i]}</div></div>`:'').join('');
  // Retorna apenas conteÃºdo interno
  return `
    ${fotos?`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">${fotos}</div>`:''}
    <div class="sec-sub" style="margin-top:0">Achados posturais</div>
    ${desv.length?`<div style="display:flex;flex-wrap:wrap;gap:6px">${desv.map(d=>`<span style="background:#fef2f2;color:#991b1b;font-size:11px;padding:4px 12px;border-radius:20px">${x(d)}</span>`).join('')}</div>`:'<span style="color:#10b981;font-size:13px;font-weight:500">âœ“ Sem desvios relevantes</span>'}
    ${p.observacoes?`<p style="font-size:12px;color:#4b5563;margin-top:10px;line-height:1.6">${x(p.observacoes)}</p>`:''}
    ${score!=null?`<div style="display:inline-block;margin-top:12px;padding:5px 14px;background:linear-gradient(135deg,#059669,#059669cc);border-radius:100px;color:#0f172a;font-weight:700;font-size:13px">Score Postura: ${score}</div>`:''}
    ${aiBlock(ia)}`;
}

// PÃ¡gina combinada: Posturografia (metade sup) + Flexibilidade (metade inf)
function pgPosturaFlex(p: any, scoreP: number|null, f: any, scoreF: number|null, iaP: any, iaF: any, pri = '#059669'): string {
  if (!p && !f) return '';
  const corF = f?.classificacao==='Excelente'?'#16a34a':f?.classificacao==='Bom'?'#10b981':f?.classificacao==='MÃ©dio'?'#f59e0b':f?.classificacao==='Regular'?'#f97316':'#ef4444';
  return `<section class="page module" style="display:flex;flex-direction:column">
  <div class="mod-head" style="margin-bottom:0;padding-bottom:16px">
    <h2 class="mod-title">Posturografia &amp; Flexibilidade</h2>
  </div>

  <!-- â”€â”€ METADE SUPERIOR: Posturografia â”€â”€ -->
  <div style="padding:20px 0 18px;border-bottom:2px dashed #e5e7eb">
    <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:14px;display:flex;align-items:center;gap:8px">
      <span style="width:3px;height:18px;background:${pri};border-radius:2px;display:inline-block"></span>
      Posturografia
    </div>
    ${p ? pgPostura(p, scoreP, iaP) : '<p style="color:#9ca3af;font-size:13px">NÃ£o realizada</p>'}
  </div>

  <!-- â”€â”€ METADE INFERIOR: Flexibilidade â”€â”€ -->
  <div style="padding:20px 0 0">
    <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:14px;display:flex;align-items:center;gap:8px">
      <span style="width:3px;height:18px;background:${pri};border-radius:2px;display:inline-block"></span>
      Flexibilidade ${scoreF!=null?`<span style="margin-left:auto;padding:4px 12px;background:linear-gradient(135deg,${pri},${pri}cc);border-radius:100px;color:#0f172a;font-weight:700;font-size:12px">Score: ${scoreF}</span>`:''}
    </div>
    ${f ? `<div class="kpi-grid">
      ${kpi('Tentativa 1',f.tentativa_1,'cm')}${kpi('Tentativa 2',f.tentativa_2,'cm')}${kpi('Tentativa 3',f.tentativa_3,'cm')}
      ${f.melhor_resultado!=null?`<div class="kpi" style="border-color:${corF}"><div class="kpi-label">Melhor resultado</div><div class="kpi-val" style="color:${corF}">${f.melhor_resultado}<span class="kpi-unit"> cm</span></div><div style="font-size:11px;font-weight:700;color:${corF};margin-top:4px">${x(f.classificacao??'')}</div></div>`:''}
    </div>
    <p style="font-size:11px;color:#9ca3af;margin-top:4px">Protocolo: Banco de Wells â€” Sit and Reach (ACSM)</p>
    ${f.observacoes?`<p style="font-size:12px;color:#374151;margin-top:10px;line-height:1.6">${x(f.observacoes)}</p>`:''}
    ${aiBlock(iaF)}` : '<p style="color:#9ca3af;font-size:13px">NÃ£o realizada</p>'}
  </div>
</section>`;
}

function pgBio(b: any, ia?: any): string {
  if (!b) return '';
  const sm=b.segmentar_magra??{}, sg=b.segmentar_gordura??{};
  const segs=[{k:'braco_dir',l:'BraÃ§o D',c:'bd'},{k:'braco_esq',l:'BraÃ§o E',c:'be'},{k:'tronco',l:'Tronco',c:'tr'},{k:'perna_dir',l:'Perna D',c:'pd'},{k:'perna_esq',l:'Perna E',c:'pe'}];
  const temSeg=Object.keys(sm).length>0;
  return pgModulo('BioimpedÃ¢ncia', null, `
  <div class="dark-block">
    <div class="dark-label">${x(b.aparelho??'Avabio 380')}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">
      ${b.peso_kg!=null?`<div><div style="font-size:20px;font-weight:800;color:#0f172a;line-height:1">${b.peso_kg}</div><div style="font-size:8px;color:#6b7280;margin-top:3px">Peso (kg)</div></div>`:''}
      ${b.percentual_gordura!=null?`<div><div style="font-size:20px;font-weight:800;color:#f87171;line-height:1">${b.percentual_gordura}%</div><div style="font-size:8px;color:#6b7280;margin-top:3px">% Gordura</div></div>`:''}
      ${b.massa_livre_gordura_kg!=null?`<div><div style="font-size:20px;font-weight:800;color:#16a34a;line-height:1">${b.massa_livre_gordura_kg}</div><div style="font-size:8px;color:#6b7280;margin-top:3px">MLG (kg)</div></div>`:''}
      ${b.agua_corporal_kg!=null?`<div><div style="font-size:20px;font-weight:800;color:#2563eb;line-height:1">${b.agua_corporal_kg}</div><div style="font-size:8px;color:#6b7280;margin-top:3px">Ãgua (kg)</div></div>`:''}
    </div>
  </div>
  <div class="kpi-grid">
    ${b.imc!=null?kpi('IMC',b.imc):''}
    ${b.taxa_metabolica_basal_kcal!=null?kpi('TMB',b.taxa_metabolica_basal_kcal,'kcal/dia'):''}
    ${b.indice_apendicular!=null?kpi('Ãndice apendicular',b.indice_apendicular):''}
    ${b.idade_metabolica!=null?kpi('Idade metabÃ³lica',b.idade_metabolica,'anos'):''}
    ${b.gordura_visceral_nivel!=null?kpi('Gordura visceral',b.gordura_visceral_nivel,'nÃ­vel'):''}
  </div>
  ${temSeg?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">
    <div><div class="sec-sub">Massa magra por segmento</div><table><thead><tr><th>Segmento</th><th>kg</th><th>%</th></tr></thead><tbody>${segs.filter(s=>sm[s.k]).map(s=>`<tr><td>${s.l}</td><td style="font-weight:700">${sm[s.k]?.kg??'â€”'}</td><td>${sm[s.k]?.pct??'â€”'}%</td></tr>`).join('')}</tbody></table></div>
    <div><div class="sec-sub">Gordura por segmento</div><table><thead><tr><th>Segmento</th><th>kg</th><th>%</th></tr></thead><tbody>${segs.filter(s=>sg[s.k]).map(s=>`<tr><td>${s.l}</td><td style="font-weight:700">${sg[s.k]?.kg??'â€”'}</td><td>${sg[s.k]?.pct??'â€”'}%</td></tr>`).join('')}</tbody></table></div>
  </div>`:''}
  `, ia);
}

function pgAntro(a: any, score: number | null, ia?: any): string {
  if (!a) return '';
  const dobras=a.dobras??{}, soma=a.somatotipo;
  const ord=['triceps','subescapular','peitoral','axilar_media','supra_iliaca','abdominal','coxa'];
  const rot:Record<string,string>={triceps:'TrÃ­ceps',subescapular:'Subescapular',peitoral:'Peitoral',axilar_media:'Axilar mÃ©dia',supra_iliaca:'Supra-ilÃ­aca',abdominal:'Abdominal',coxa:'Coxa'};
  const estM=a.estatura?a.estatura/100:null;
  const ffmi=a.massa_magra&&estM?+(a.massa_magra/(estM*estM)).toFixed(1):null;
  const sexo=a._sexo??'M';
  const limMax=a.estatura?(sexo==='M'?a.estatura-100:(a.estatura-100)*0.85):null;
  const pctPot=a.massa_magra&&limMax?+((a.massa_magra/limMax)*100).toFixed(1):null;
  const dobraValidada = (v:any) => v?.media ?? v?.média ?? v?.['mÃ©dia'] ?? v?.validada ?? v?.validado ?? v?.valor ?? v?.resultado ?? v?.m3 ?? v?.m2 ?? v?.m1 ?? v;
  return pgModulo('Antropometria', score, `
  <div class="data-grid">
    <div class="data-card"><div class="dc-label">Peso</div><div class="dc-val">${a.peso??'â€”'}<span class="dc-unit">kg</span></div></div>
    <div class="data-card"><div class="dc-label">% Gordura</div><div class="dc-val">${a.percentual_gordura??'â€”'}<span class="dc-unit">%</span></div></div>
    <div class="data-card"><div class="dc-label">Massa magra</div><div class="dc-val">${a.massa_magra??'â€”'}<span class="dc-unit">kg</span></div></div>
    <div class="data-card"><div class="dc-label">Estatura</div><div class="dc-val">${a.estatura??'â€”'}<span class="dc-unit">cm</span></div></div>
    <div class="data-card"><div class="dc-label">IMC</div><div class="dc-val">${a.imc??'â€”'}</div></div>
    <div class="data-card"><div class="dc-label">Massa Ã³ssea</div><div class="dc-val">${a.massa_ossea??'â€”'}<span class="dc-unit">kg</span></div></div>
  </div>
  ${ffmi!=null?`<div class="dark-block">
    <div class="dark-label">Potencial genÃ©tico muscular</div>
    <div style="display:flex;align-items:center;gap:20px">
      <div><div style="font-size:28px;font-weight:800;color:#16a34a;line-height:1">${ffmi}</div><div style="font-size:9px;color:#6b7280;margin-top:3px">FFMI</div></div>
      <div style="flex:1"><div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-bottom:5px"><span>${a.massa_magra} kg atual</span><span>${pctPot}% do potencial</span>${limMax?`<span>${limMax.toFixed(1)} kg mÃ¡x.</span>`:''}</div>
      <div class="prog-bar"><div class="prog-fill" style="width:${Math.min(100,pctPot??0)}%"></div></div></div>
    </div>
  </div>`:''}
  ${Object.keys(dobras).length?`<div class="sec-sub">Dobras cutÃ¢neas (mm)</div>
  <table><thead><tr><th>Dobra</th><th>Medida validada</th></tr></thead><tbody>
    ${ord.filter(k=>dobras[k]).map(k=>{const v=dobraValidada(dobras[k]);return `<tr><td>${rot[k]??k}</td><td style="font-weight:600">${v??'â€”'} mm</td></tr>`;}).join('')}
  </tbody></table>`:''}
  ${soma?`<div class="kpi-grid" style="margin-top:18px">${kpi('Endomorfia',soma.endomorfia)}${kpi('Mesomorfia',soma.mesomorfia)}${kpi('Ectomorfia',soma.ectomorfia)}${kpi('ClassificaÃ§Ã£o',soma.classificacao)}</div>`:''}
  ${(() => {
    const c=a.circunferencias??{};
    const pares=[
      {l:'BraÃ§o relaxado', d:c.braco_dir_relaxado??c.braco_relaxado, e:c.braco_esq_relaxado},
      {l:'BraÃ§o contraÃ­do', d:c.braco_dir_contraido??c.braco_contraido, e:c.braco_esq_contraido},
      {l:'AntebraÃ§o', d:c.antebraco_dir??c.antebraco, e:c.antebraco_esq},
      {l:'Coxa proximal', d:c.coxa_dir_proximal??c.coxa_proximal, e:c.coxa_esq_proximal},
      {l:'Coxa medial', d:c.coxa_dir_medial??c.coxa_medial, e:c.coxa_esq_medial},
      {l:'Panturrilha', d:c.panturrilha_dir??c.panturrilha, e:c.panturrilha_esq},
    ];
    const unilateras=[
      {l:'PescoÃ§o', v:c.pescoco},{l:'Ombro', v:c.ombro},{l:'TÃ³rax', v:c.torax},
      {l:'Cintura', v:c.cintura},{l:'Abdome', v:c.abdome},{l:'Quadril', v:c.quadril},
    ];
    const temPares = pares.some(p=>p.d||p.e);
    const temUni = unilateras.some(u=>u.v);
    if(!temPares && !temUni) return '';
    return `<div class="sec-sub" style="margin-top:18px">CircunferÃªncias (cm)</div>
    ${temPares?`<table><thead><tr><th>Segmento</th><th style="text-align:center;color:#3b82f6">Dir</th><th style="text-align:center;color:#8b5cf6">Esq</th></tr></thead><tbody>
      ${pares.filter(p=>p.d||p.e).map(p=>`<tr><td>${p.l}</td><td style="text-align:center;font-weight:600;color:#3b82f6">${p.d??'â€”'}</td><td style="text-align:center;font-weight:600;color:#8b5cf6">${p.e??'â€”'}</td></tr>`).join('')}
    </tbody></table>`:''}
    ${temUni?`<table style="margin-top:10px"><thead><tr>${unilateras.filter(u=>u.v).map(u=>`<th>${u.l}</th>`).join('')}</tr></thead><tbody><tr>${unilateras.filter(u=>u.v).map(u=>`<td style="font-weight:600">${u.v}</td>`).join('')}</tr></tbody></table>`:''}`;
  })()}
  `, ia);
}

// pgFlex incorporada em pgPosturaFlex

function pgForca(f: any, score: number | null, ia?: any): string {
  if (!f) return '';
  const spT:any[]=f.sptech_testes??[], spR:any[]=f.sptech_relacoes??[], trT:any[]=f.tracao_testes??[], tst:any[]=f.testes??[];
  const corA=(c:string)=>c==='Leve'?'#10b981':c==='Moderada'?'#f59e0b':'#ef4444';
  const corLado = (cls:string) => cls.includes('side-d') ? '#3b82f6' : '#8b5cf6';
  const ladoCard=(lado:any,cls:string,tit:string)=>{
    if(!lado) return '';
    const car=lado.cargas??{};
    const cor = corLado(cls);
    const temCar = Object.keys(car).some(k=>car[k]);
    // Linha de carga: label | mÃ­n: X kg | mÃ¡x: X kg
    const linhasCarga = [
      ['resistencia','ResistÃªncia'],
      ['forca','ForÃ§a'],
      ['potencia','PotÃªncia'],
      ['hipertrofia','Hipertrofia'],
      ['velocidade','Velocidade'],
    ].map(([k,l])=>{
      const mn = car[`${k}_min`], mx = car[`${k}_max`];
      if(!mn && !mx) return '';
      const minPart = mn ? `<span style="color:#6b7280;font-size:9px">mÃ­n:</span> <b>${mn} Kg</b>` : '';
      const maxPart = mx ? `<span style="color:#6b7280;font-size:9px">mÃ¡x:</span> <b>${mx} Kg</b>` : '';
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f3f4f6;font-size:11px;color:#374151">
        <span style="color:#6b7280;min-width:70px">${l}</span>
        <div style="display:flex;gap:14px">${minPart}${maxPart ? ' &nbsp; ' + maxPart : ''}</div>
      </div>`;
    }).filter(Boolean);

    return `<div class="${cls}">
      <!-- TÃ­tulo do lado -->
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;color:${cor}">${tit}</div>

      <!-- Torque + 1RM em destaque -->
      <div style="display:flex;gap:10px;margin-bottom:${temCar?'14px':'0'}">
        ${lado.torque_nm!=null?`<div style="flex:1;background:#f8faff;border:1px solid ${cor}22;border-radius:8px;padding:8px 12px">
          <div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Torque</div>
          <div style="font-size:16px;font-weight:800;color:#111827">${lado.torque_nm} <span style="font-size:10px;font-weight:400;color:#6b7280">Nm</span></div>
        </div>`:''}
        ${lado.rm1_kg!=null?`<div style="flex:1;background:#f8faff;border:1px solid ${cor}22;border-radius:8px;padding:8px 12px">
          <div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">1RM pred.</div>
          <div style="font-size:16px;font-weight:800;color:#111827">${lado.rm1_kg} <span style="font-size:10px;font-weight:400;color:#6b7280">kg</span></div>
        </div>`:''}
      </div>

      <!-- Cargas de treinamento -->
      ${temCar?`<div style="font-size:9px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Cargas de treinamento</div>
      <div>${linhasCarga.join('')}</div>`:''}
    </div>`;
  };
  return pgModulo('ForÃ§a', score, `
  ${(f.preensao_dir_kgf||f.preensao_esq_kgf)?`<div class="kpi-grid" style="margin-bottom:18px">
    ${kpi('MÃ£o direita',f.preensao_dir_kgf,'kgf')}${kpi('MÃ£o esquerda',f.preensao_esq_kgf,'kgf')}
    ${kpi('ForÃ§a rel. D',f.forca_relativa_dir,'kgf/kg')}${kpi('Assimetria',f.assimetria_percent,'%')}
  </div>`:''}
  ${spR.length?`<div style="background:#f9fafb;border-radius:10px;padding:14px 18px;margin-bottom:18px">
    <div class="sec-sub" style="margin-top:0">RelaÃ§Ãµes musculares</div>
    ${spR.map((r:any)=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e5e7eb;font-size:12px"><span style="color:#4b5563">${x(r.descricao)}</span><span style="font-weight:700">${r.percentual}%</span></div>`).join('')}
  </div>`:''}
  ${spT.map((t:any)=>{const ap=parseFloat(t.assimetria_pct);return `<div style="margin-bottom:20px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="font-size:14px;font-weight:700;color:#111827">${x(t.articulacao)} â€” ${x(t.movimento)}</div>
      ${!isNaN(ap)?`<span class="asym-badge" style="background:${corA(t.classificacao_assimetria)}18;color:${corA(t.classificacao_assimetria)}">Assimetria ${ap.toFixed(1)}% Â· ${x(t.classificacao_assimetria)}</span>`:''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      ${ladoCard(t.lado_d,'side-d','â—€ Lado Direito')}
      ${ladoCard(t.lado_e,'side-e','Lado Esquerdo â–¶')}
    </div>
  </div>`;}).join('')}
  ${trT.length?`<div class="sec-sub">Dinamometria por tração</div>
  ${trT.map((t:any)=>{const ap=parseFloat(t.assimetria_pct);return `<div style="margin-bottom:18px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">
      <div style="font-size:14px;font-weight:700;color:#111827">${x(t.musculo||'Teste de tração')}</div>
      ${t.exercicio_ref?`<span style="font-size:11px;color:#6b7280">${x(t.exercicio_ref)}</span>`:''}
      ${t.fator?`<span class="asym-badge" style="background:#eef2ff;color:#4338ca">Fator ${x(t.fator)}</span>`:''}
      ${!isNaN(ap)?`<span class="asym-badge" style="background:${corA(t.classificacao_assimetria)}18;color:${corA(t.classificacao_assimetria)}">Assimetria ${ap.toFixed(1)}% · ${x(t.classificacao_assimetria)}</span>`:''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      ${['lado_d','lado_e'].map((ladoKey,idx)=>{
        const lado=t[ladoKey]??{};
        const cor=idx===0?'#3b82f6':'#8b5cf6';
        const tit=idx===0?'◀ Lado Direito':'Lado Esquerdo ▶';
        return `<div style="border:1px solid ${cor}25;border-radius:10px;background:#f8fafc;padding:12px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;color:${cor}">${tit}</div>
          <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);gap:8px;margin:0">
            ${kpi('FIM',lado.fim_kgf,'kgf')}
            ${kpi('1RM estimado',lado.rm1_kg,'kg')}
            ${kpi('RFD',lado.rfd_kgf_s,'kgf/s')}
          </div>
        </div>`;
      }).join('')}
    </div>
    ${t.observacoes?`<div style="font-size:11px;color:#4b5563;margin-top:8px">${x(t.observacoes)}</div>`:''}
  </div>`;}).join('')}`:''}
  ${tst.length?`<div class="sec-sub">Outros testes</div><table><thead><tr><th>Teste</th><th>Valor</th><th>Un.</th></tr></thead><tbody>${tst.map((t:any)=>`<tr><td>${x(t.nome)}</td><td style="font-weight:700">${t.valor}</td><td>${x(t.unidade)}</td></tr>`).join('')}</tbody></table>`:''}
  ${(()=>{
    const alg:any[] = f.algometria??[];
    if(!f.tem_algometria || !alg.length) return '';
    const ladoLbl = (l:string) => l==='direito'?'D':l==='esquerdo'?'E':'â€”';
    return `<div class="sec-sub">Algometria â€” Limiar de dor Ã  pressÃ£o (PPT)</div>
    <table><thead><tr><th>Segmento</th><th style="text-align:center">Lado</th><th style="text-align:right">kgf</th><th>Obs.</th></tr></thead>
    <tbody>${alg.map((p:any)=>`<tr>
      <td style="font-weight:500">${x(p.segmento)}</td>
      <td style="text-align:center;color:#6b7280">${ladoLbl(p.lado)}</td>
      <td style="text-align:right;font-weight:700">${p.valor_kgf??'â€”'}</td>
      <td style="color:#6b7280;font-size:11px">${x(p.observacao??'')}</td>
    </tr>`).join('')}</tbody></table>`;
  })()}
  `, ia);
}

// â”€â”€â”€ pgRML â€” ResistÃªncia Muscular Localizada â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function pgRML(r: any, score: number | null, sexo: 'M'|'F', idade: number, ia?: any, pri = '#059669'): string {
  if (!r) return '';
  const cat: 'jovem_ativo'|'idoso' = r.categoria ?? 'jovem_ativo';
  const COR_CLASSE: Record<string,string> = {
    'Excelente':'#10b981','Bom':'#3b82f6','Regular':'#f59e0b','Fraco':'#f97316','Muito fraco':'#ef4444',
  };

  // Gauge SVG pequeno (igual ao padrÃ£o do sistema)
  const miniGauge = (val: number | null, lbl: string, cls?: string | null) => {
    const cor = cls ? (COR_CLASSE[cls] ?? '#6b7280') : '#6b7280';
    const unit = lbl.toLowerCase().includes('seg') ? 'seg' : 'reps';
    return `<div style="flex:1 1 120px;min-width:118px;background:#fff;border:1px solid ${cor}33;border-radius:12px;padding:12px 10px;text-align:center">
      <div style="font-size:26px;font-weight:900;color:${cor};line-height:1">${val??'â€”'}</div>
      <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin:3px 0 5px">${unit}</div>
      <div style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.35px;text-align:center;line-height:1.25;white-space:normal">${x(lbl).replace(/\n/g,'<br/>')}</div>
      ${cls?`<span style="display:inline-block;margin-top:7px;padding:2px 9px;border-radius:100px;font-size:8px;font-weight:700;background:${cor}22;color:${cor}">${cls}</span>`:''}
    </div>`;
  };

  // Linha de resultado
  const linha = (lbl: string, val: any, unit: string, cls?: string | null) => {
    if (val == null) return '';
    const cor = cls ? (COR_CLASSE[cls] ?? '#6b7280') : '#6b7280';
    return `<tr>
      <td style="padding:8px 12px;font-size:12px;color:#374151;font-weight:500">${x(lbl)}</td>
      <td style="padding:8px 12px;font-size:14px;font-weight:800;color:#111827">${val} <span style="font-size:10px;color:#9ca3af;font-weight:400">${unit}</span></td>
      <td style="padding:8px 12px">${cls?`<span style="padding:3px 10px;border-radius:100px;font-size:9px;font-weight:700;background:${cor}22;color:${cor}">${cls}</span>`:''}</td>
    </tr>`;
  };

  // â”€â”€ Gauges conforme categoria â”€â”€
  let gaugesHTML = '';
  let tabelaHTML = '';
  let tituloSecao = '';

  if (cat === 'jovem_ativo') {
    tituloSecao = 'Jovem / Ativo';
    // Gauges
    const gauges = [
      r.mmss_reps != null       ? miniGauge(r.mmss_reps, r.mmss_modalidade === 'modificada' ? 'FlexÃ£o\nmodificada' : 'FlexÃ£o\ntradicional', r.mmss_classificacao) : '',
      r.abd_1min_reps != null   ? miniGauge(r.abd_1min_reps, 'Abdominal\n1 min', r.abd_1min_classificacao) : '',
      r.abd_prancha_seg != null ? miniGauge(r.abd_prancha_seg, 'Prancha\n(seg)', r.abd_prancha_classificacao) : '',
      r.mmii_agach_reps != null ? miniGauge(r.mmii_agach_reps, 'Agachamento\n1 min', r.mmii_agach_classificacao) : '',
      r.mmii_wallsit_seg != null? miniGauge(r.mmii_wallsit_seg, 'Wall Sit\n(seg)', r.mmii_wallsit_classificacao) : '',
    ].filter(Boolean);
    gaugesHTML = gauges.join('');

    // Tabela detalhada
    tabelaHTML = `<table style="width:100%;border-collapse:collapse">
      <thead><tr>
        <th style="text-align:left;padding:8px 12px;background:#f3f4f6;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Teste</th>
        <th style="text-align:left;padding:8px 12px;background:#f3f4f6;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Resultado</th>
        <th style="text-align:left;padding:8px 12px;background:#f3f4f6;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">ClassificaÃ§Ã£o</th>
      </tr></thead>
      <tbody>
        ${linha(`FlexÃ£o de braÃ§o â€” ${r.mmss_modalidade === 'modificada' ? 'modificada' : 'tradicional'}`, r.mmss_reps, 'reps', r.mmss_classificacao)}
        ${linha('Abdominal 1 minuto', r.abd_1min_reps, 'reps', r.abd_1min_classificacao)}
        ${linha('Prancha ventral', r.abd_prancha_seg, 'seg', r.abd_prancha_classificacao)}
        ${linha('Agachamento livre 1 min', r.mmii_agach_reps, 'reps', r.mmii_agach_classificacao)}
        ${r.mmii_wallsit_seg != null ? linha('Wall sit', r.mmii_wallsit_seg, 'seg', r.mmii_wallsit_classificacao) : ''}
      </tbody>
    </table>`;
  } else {
    tituloSecao = 'Idoso (â‰¥ 60 anos)';
    const gauges = [
      r.idoso_sl_reps != null      ? miniGauge(r.idoso_sl_reps, 'Sentar &\nLevantar 30s', r.idoso_sl_classificacao) : '',
      r.idoso_armcurl_reps != null ? miniGauge(r.idoso_armcurl_reps, 'Arm Curl\n30s', r.idoso_armcurl_classificacao) : '',
    ].filter(Boolean);
    gaugesHTML = gauges.join('');

    tabelaHTML = `<table style="width:100%;border-collapse:collapse">
      <thead><tr>
        <th style="text-align:left;padding:8px 12px;background:#f3f4f6;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Teste</th>
        <th style="text-align:left;padding:8px 12px;background:#f3f4f6;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Resultado</th>
        <th style="text-align:left;padding:8px 12px;background:#f3f4f6;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">ClassificaÃ§Ã£o</th>
      </tr></thead>
      <tbody>
        ${linha('Sentar e Levantar 30s', r.idoso_sl_reps, 'reps', r.idoso_sl_classificacao)}
        ${linha('Arm Curl Test 30s', r.idoso_armcurl_reps, 'reps', r.idoso_armcurl_classificacao)}
      </tbody>
    </table>`;
  }

  // InterpretaÃ§Ã£o padrÃ£o
  const interpretacao = `A avaliaÃ§Ã£o de resistÃªncia muscular localizada demonstrou o desempenho do paciente em testes dinÃ¢micos e/ou isomÃ©tricos, permitindo estimar a capacidade de sustentar contraÃ§Ãµes repetidas ou prolongadas com seguranÃ§a tÃ©cnica. Resultados reduzidos podem estar associados a menor tolerÃ¢ncia ao esforÃ§o, fadiga precoce, pior estabilidade articular, maior risco de compensaÃ§Ãµes biomecÃ¢nicas e menor eficiÃªncia em atividades esportivas ou funcionais. A melhora desses indicadores tende a favorecer desempenho fÃ­sico, controle postural, estabilidade do core, proteÃ§Ã£o articular e maior capacidade de sustentar esforÃ§os repetidos.`;

  const aiHTML = ia?.texto_editado
    ? `<div class="ai-box"><div class="ai-title">ðŸ”„ AnÃ¡lise clÃ­nica</div><div class="ai-text">${x(ia.texto_editado)}</div></div>`
    : `<div class="ai-box"><div class="ai-title">ðŸ“‹ InterpretaÃ§Ã£o</div><div class="ai-text">${x(interpretacao)}</div></div>`;

  return pgModulo('ResistÃªncia Muscular (RML)', score, `
  <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px">
    Categoria: ${x(tituloSecao)} Â· Sexo: ${sexo === 'M' ? 'Masculino' : 'Feminino'} Â· ${idade} anos
  </div>

  <!-- Gauges -->
  <div style="display:flex;gap:16px;justify-content:flex-start;align-items:flex-start;flex-wrap:wrap;margin-bottom:22px;padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
    ${gaugesHTML || '<span style="color:#9ca3af;font-size:12px">Nenhum teste registrado</span>'}
  </div>

  <!-- Tabela detalhada -->
  <div style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:16px">
    ${tabelaHTML}
  </div>

  ${r.observacoes ? `<div style="font-size:11px;color:#6b7280;background:#f9fafb;border-radius:8px;padding:10px 14px;margin-bottom:14px;border-left:3px solid #e5e7eb"><b style="color:#374151">ObservaÃ§Ãµes:</b> ${x(r.observacoes)}</div>` : ''}
  `, ia);
}

function pgCardio(c: any, score: number | null, ia?: any): string {
  if (!c) return '';
  const zonas=c.zonas??{}, zPct:any[]=c.zonas_percentual??[], vel:any[]=c.velocidades_treino??[];
  const recFC:Record<string,number>=c.rec_fc??{}, zLim:any[]=c.zonas_limiar??[];
  const zCores=['#6ee7b7','#34d399','#fbbf24','#f97316','#ef4444'];
  const rec60=recFC['60'];
  const recCor=rec60!=null?(rec60<=-20?'#10b981':rec60<=-12?'#f59e0b':'#ef4444'):'#6b7280';
  const limCores:Record<string,string>={'SaÃºde Cardiovascular':'#3b82f6','Emagrecimento':'#f59e0b','Performance':'#10b981','EsforÃ§o mÃ¡ximo':'#ef4444'};
  return pgModulo('CardiorrespiratÃ³rio', score, `
  <div class="dark-block">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">
      ${c.vo2max!=null?`<div><div style="font-size:8px;color:#6b7280;margin-bottom:4px">VOâ‚‚mÃ¡x</div><div style="font-size:20px;font-weight:800;color:#16a34a;line-height:1">${c.vo2max}</div><div style="font-size:8px;color:#4b5563">ml/kg/min</div></div>`:''}
      ${c.fc_limiar!=null?`<div><div style="font-size:8px;color:#6b7280;margin-bottom:4px">FC Limiar</div><div style="font-size:20px;font-weight:800;color:#2563eb;line-height:1">${c.fc_limiar}</div><div style="font-size:8px;color:#4b5563">bpm</div></div>`:''}
      ${c.fc_max!=null?`<div><div style="font-size:8px;color:#6b7280;margin-bottom:4px">FC MÃ¡x</div><div style="font-size:20px;font-weight:800;color:#f87171;line-height:1">${c.fc_max}</div><div style="font-size:8px;color:#4b5563">bpm</div></div>`:''}
      ${c.vam!=null?`<div><div style="font-size:8px;color:#6b7280;margin-bottom:4px">VAM</div><div style="font-size:20px;font-weight:800;color:#7c3aed;line-height:1">${c.vam}</div><div style="font-size:8px;color:#4b5563">km/h</div></div>`:''}
      ${c.ve_max!=null?`<div><div style="font-size:8px;color:#6b7280;margin-bottom:4px">VE MÃ¡x</div><div style="font-size:20px;font-weight:800;color:#fbbf24;line-height:1">${c.ve_max}</div><div style="font-size:8px;color:#4b5563">l/min</div></div>`:''}
      ${c.carga_limiar!=null?`<div><div style="font-size:8px;color:#6b7280;margin-bottom:4px">Carga limiar</div><div style="font-size:20px;font-weight:800;color:#34d399;line-height:1">${c.carga_limiar}</div><div style="font-size:8px;color:#4b5563">km/h</div></div>`:''}
      ${c.carga_max!=null?`<div><div style="font-size:8px;color:#6b7280;margin-bottom:4px">Carga mÃ¡x</div><div style="font-size:20px;font-weight:800;color:#f97316;line-height:1">${c.carga_max}</div><div style="font-size:8px;color:#4b5563">km/h</div></div>`:''}
      ${c.fc_repouso!=null?`<div><div style="font-size:8px;color:#6b7280;margin-bottom:4px">FC repouso</div><div style="font-size:20px;font-weight:800;color:#0f172a;line-height:1">${c.fc_repouso}</div><div style="font-size:8px;color:#4b5563">bpm</div></div>`:''}
    </div>
    ${c.classificacao_vo2?`<div style="margin-top:12px;padding-top:12px;border-top:1px solid #1f2937;font-size:10px;color:#6b7280">ClassificaÃ§Ã£o: <b style="color:#16a34a">${x(c.classificacao_vo2)}</b>${c.protocolo?` Â· ${x(c.protocolo)}`:''}${c.ponto_limiar_tempo?` Â· Limiar em ${x(c.ponto_limiar_tempo)}`:''}</div>`:''}
  </div>
  ${Object.keys(recFC).length?`<div class="sec-sub">RecuperaÃ§Ã£o da FC</div>
  <table><thead><tr><th>Segundos</th>${[10,30,60].map(s=>`<th style="text-align:center">${s}s</th>`).join('')}</tr></thead>
  <tbody><tr><td style="font-weight:600">Î” bpm</td>${[10,30,60].map(s=>{const v=recFC[s];const cor=v!=null?(v<=-20?'#10b981':v<=-6?'#f59e0b':'#ef4444'):'#9ca3af';return `<td style="text-align:center;font-weight:600;color:${cor}">${v??'â€”'}</td>`;}).join('')}</tr></tbody></table>
  ${rec60!=null?`<div style="margin-top:8px;font-size:11px;font-weight:600;color:${recCor}">Rec. 60s: ${rec60} bpm Â· ${rec60<=-20?'Boa':rec60<=-12?'Mediana':'Ruim'}</div>`:''}
  `:''}
  ${zLim.length?`<div class="sec-sub">Zonas por limiar ventilatÃ³rio</div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px">
    ${zLim.map((z:any)=>{const cor=limCores[z.nome]??'#6b7280';return `<div style="background:${cor}0e;border:1px solid ${cor}30;border-radius:10px;padding:12px 16px"><div style="font-size:10px;font-weight:700;color:${cor};margin-bottom:3px">${x(z.nome)}</div><div style="font-size:10px;color:#4b5563">${z.pct_min}% â€“ ${z.pct_max}%</div>${(z.bpm_min||z.bpm_max)?`<div style="font-size:14px;font-weight:800;color:#111827;margin-top:3px">${z.bpm_min??'â€”'} â€“ ${z.bpm_max??'â€”'} bpm</div>`:''}</div>`;}).join('')}
  </div>`:''}
  ${Object.keys(zonas).length?`<div class="sec-sub">Zonas de treinamento Z1â€“Z5</div>
  <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
    ${['z1','z2','z3','z4','z5'].map((k,i)=>{const z=zonas[k];if(!z)return '';const pct=Math.round(z.max/(c.fc_max||200)*100);return `<div style="display:flex;align-items:center;gap:10px"><div style="width:80px;font-size:10px;font-weight:600;color:#374151">${['Z1 Regen.','Z2 Base','Z3 AerÃ³bico','Z4 Limiar','Z5 VOâ‚‚mÃ¡x'][i]}</div><div style="flex:1;background:#f3f4f6;border-radius:999px;height:10px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${zCores[i]};border-radius:999px"></div></div><div style="width:88px;font-size:10px;color:#6b7280;text-align:right">${z.min}â€“${z.max} bpm</div></div>`;}).join('')}
  </div>`:''}
  ${vel.length?`<div class="sec-sub">Velocidades por intensidade</div>
  <table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f8fafc"><th style="text-align:left;padding:6px 10px;font-size:9px;color:#94a3b8;text-transform:uppercase">Zona</th><th style="text-align:center;padding:6px 10px;font-size:9px;color:#94a3b8;text-transform:uppercase">km/h mÃ­n</th><th style="text-align:center;padding:6px 10px;font-size:9px;color:#94a3b8;text-transform:uppercase">km/h mÃ¡x</th><th style="text-align:center;padding:6px 10px;font-size:9px;color:#94a3b8;text-transform:uppercase">Pace mÃ­n</th></tr></thead>
  <tbody>${vel.map((v:any,i:number)=>{const cor=['#6ee7b7','#34d399','#fbbf24','#f97316','#ef4444'][i]??'#94a3b8';function pace(kmh:number){if(!kmh)return'â€”';const ms=60/kmh;const m=Math.floor(ms);const s=Math.round((ms-m)*60);return m+':'+String(s).padStart(2,'0');} return `<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 10px;font-size:11px;font-weight:600;color:${cor}">${v.tipo??v.intensidade??''}</td><td style="text-align:center;padding:8px 10px;font-size:11px;font-weight:700">${v.velocidade_min??v.velocidade??'â€”'}</td><td style="text-align:center;padding:8px 10px;font-size:11px;font-weight:700">${v.velocidade_max??'â€”'}</td><td style="text-align:center;padding:8px 10px;font-size:11px;color:#6b7280">${v.velocidade_min?pace(v.velocidade_min):'â€”'}</td></tr>`;}).join('')}
  </tbody></table>`:''}
  `, ia);
}

function pgConclusao(d: LaudoData, pri: string): string {
  const c = d.analisesIA?.conclusao_global; if(!c) return '';
  return pgModulo('ConclusÃ£o clÃ­nica', null, `
  ${c.texto_editado?`<p style="font-size:13px;color:#374151;line-height:1.7">${x(c.texto_editado)}</p>`:`
    ${c.resumo_executivo?`<p style="font-size:13px;color:#374151;line-height:1.7;margin-bottom:16px">${x(c.resumo_executivo)}</p>`:''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
      ${c.pontos_fortes?.length?`<div style="background:#f0fdf4;border-radius:10px;padding:14px"><div style="font-size:10px;font-weight:700;color:#166534;margin-bottom:8px">âœ“ Pontos fortes</div><ul style="padding-left:16px;font-size:12px;color:#166534">${c.pontos_fortes.map(p=>`<li style="margin-bottom:3px">${x(p)}</li>`).join('')}</ul></div>`:''}
      ${c.pontos_criticos?.length?`<div style="background:#fef2f2;border-radius:10px;padding:14px"><div style="font-size:10px;font-weight:700;color:#991b1b;margin-bottom:8px">âš  Pontos crÃ­ticos</div><ul style="padding-left:16px;font-size:12px;color:#991b1b">${c.pontos_criticos.map(p=>`<li style="margin-bottom:3px">${x(p)}</li>`).join('')}</ul></div>`:''}
    </div>
    ${c.prioridades?.length?`<div>${c.prioridades.map((p,i)=>`<div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start"><div style="min-width:28px;height:28px;border-radius:50%;background:${pri};color:#0f172a;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0">${i+1}</div><div><div style="font-weight:700;font-size:13px;color:#111827">${x(p.titulo)}</div><div style="color:#4b5563;font-size:12px">${x(p.acao)}</div><div style="color:#9ca3af;font-size:11px;margin-top:2px">â± ${x(p.prazo)}</div></div></div>`).join('')}</div>`:''}
    ${c.mensagem_paciente?`<div style="background:#eff6ff;border-left:4px solid ${pri};padding:14px 18px;border-radius:0 10px 10px 0;font-style:italic;color:#1e40af;font-size:13px;margin-top:10px">${x(c.mensagem_paciente)}</div>`:''}
  `}`);
}

function pgBiomecanica(b: any, ia: any, pri = '#059669'): string {
  if (!b) return '';
  const met: any = b.metricas ?? {};
  const ang: any = b.angulos ?? {};
  const achados: any = b.achados ?? {};
  const rec: any = b.recomendacoes ?? {};
  const graf: any = b.graficos ?? {};
  const comentGraf: any = b.comentarios_graficos ?? {};
  const comentAng: any = b.comentarios_angulos ?? {};
  const videoUrl = b.link_video ?? b.linkVideo ?? b.video_url ?? b.videoUrl ?? b.link_cinematica ?? b.link_video_cinematica ?? '';

  const metaAngs: Record<string, string> = {
    cabeca: 'Alinhamento da cabeça',
    tronco: 'Posicionamento do tronco',
    aterrissagem_passada: 'Aterrissagem (passada)',
    joelho_frente_contato: 'Joelho da frente ao bater o pé',
    joelho_posterior_contato: 'Joelho posterior ao bater o pé',
    bracos: 'Posição dos braços',
    queda_pelve_esq: 'Queda da pelve - pé esquerdo',
    queda_pelve_dir: 'Queda da pelve - pé direito',
    alinhamento_joelho_esq: 'Alinhamento joelho esquerdo',
    alinhamento_joelho_dir: 'Alinhamento joelho direito',
    pronacao_supinacao_esq: 'Pronação/Supinação pé esquerdo',
    pronacao_supinacao_dir: 'Pronação/Supinação pé direito',
    cotovelo: 'Cotovelo (MMSS)', joelho_posterior: 'Joelho posterior',
    joelho_impacto: 'Joelho no impacto', overstride: 'Overstride',
  };

  const corCls = (cls: string) => cls === 'ideal' ? '#10b981' : cls === 'atencao' ? '#f59e0b' : '#ef4444';
  const lbCls  = (cls: string) => cls === 'ideal' ? 'Ideal âœ“' : cls === 'atencao' ? 'AtenÃ§Ã£o' : 'Fora do ideal';

  const metricaCard = (titulo: string, valor: any, unidade: string) =>
    valor != null ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;text-align:center">
      <div style="font-size:9px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${titulo}</div>
      <div style="font-size:22px;font-weight:800;color:#0f172a">${valor}</div>
      <div style="font-size:10px;color:#94a3b8;margin-top:2px">${unidade}</div>
    </div>` : '';

  const angleRuler = (key: string, v: any) => {
    const min = Number(v.ideal_min ?? 0);
    const max = Number(v.ideal_max ?? 180);
    const val = Number(v.valor ?? 0);
    const scaleMin = Math.min(0, min, val);
    const scaleMax = Math.max(180, max, val);
    const span = Math.max(1, scaleMax - scaleMin);
    const i0 = Math.max(0, Math.min(100, ((min - scaleMin) / span) * 100));
    const i1 = Math.max(0, Math.min(100, ((max - scaleMin) / span) * 100));
    const idealW = Math.max(4, i1 - i0);
    const pos = Math.max(0, Math.min(100, ((val - scaleMin) / span) * 100));
    const cor = corCls(v.classificacao ?? 'fora');
    const status = v.classificacao === 'ideal' ? 'Dentro do ideal' : v.classificacao === 'atencao' ? 'Atenção' : 'Fora do ideal';
    return `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:8px">
        <div style="font-size:11px;font-weight:800;color:#334155;line-height:1.2">${x(metaAngs[key] ?? key)}</div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:16px;font-weight:900;color:${cor};line-height:1">${val}°</div>
          <div style="font-size:8px;font-weight:800;color:${cor};text-transform:uppercase;letter-spacing:.4px;margin-top:2px">${status}</div>
        </div>
      </div>
      <div style="position:relative;height:18px;background:#edf2f7;border-radius:999px;box-shadow:inset 0 1px 2px #0f172a18">
        <div style="position:absolute;left:${i0}%;width:${idealW}%;top:4px;height:10px;background:linear-gradient(90deg,#86efac,#10b981);border-radius:999px;box-shadow:0 0 0 1px #10b98133"></div>
        <div style="position:absolute;left:${pos}%;top:50%;transform:translate(-50%,-50%);width:3px;height:24px;background:${cor};border-radius:2px;box-shadow:0 1px 5px ${cor}55"></div>
        <div style="position:absolute;left:${pos}%;top:50%;transform:translate(-50%,-50%);width:11px;height:11px;background:#fff;border:3px solid ${cor};border-radius:50%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:8px;color:#94a3b8;margin-top:5px">
        <span>${scaleMin}°</span><span style="color:#059669;font-weight:800">ideal ${min}°-${max}°</span><span>${scaleMax}°</span>
      </div>
    </div>`;
  };

  const comparativoRunner = () => {
    const principais = [
      'cabeca','tronco','aterrissagem_passada','joelho_frente_contato','joelho_posterior_contato','bracos',
      'queda_pelve_esq','queda_pelve_dir','alinhamento_joelho_esq','alinhamento_joelho_dir','pronacao_supinacao_esq','pronacao_supinacao_dir',
    ].filter(k => ang[k]);
    if (!principais.length) return '';
    const sagital = principais.slice(0, 6);
    const posterior = principais.slice(6);
    return `<div style="margin:4px 0 18px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:#f8fafc">
      <div style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.7px">Régua angular - valor medido x faixa ideal</div>
      ${sagital.length ? `<div style="padding:12px 14px 4px;font-size:10px;font-weight:900;color:#0f172a;text-transform:uppercase;letter-spacing:.7px">Plano sagital</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:0 14px 12px">${sagital.map(k => angleRuler(k, ang[k])).join('')}</div>` : ''}
      ${posterior.length ? `<div style="padding:4px 14px;font-size:10px;font-weight:900;color:#0f172a;text-transform:uppercase;letter-spacing:.7px">Plano posterior</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:0 14px 14px">${posterior.map(k => angleRuler(k, ang[k])).join('')}</div>` : ''}
      </div>
    </div>`;
  };

  // PÃ¡gina 1: Frame anotado + mÃ©tricas
  const pg1 = `<section class="page module" style="display:flex;flex-direction:column">
  <div class="mod-head">
    <div>
      <h2 class="mod-title">BiomecÃ¢nica da corrida</h2>
      <div style="font-size:12px;color:#64748b;margin-top:4px">
        CinemÃ¡tica 2D â€” ${x(b.movimento ?? 'Corrida')} Â· ${b.velocidade_kmh ?? 'â€”'} km/h
      </div>
    </div>
    ${videoUrl ? `<a href="${x(videoUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#fff;background:${pri};text-decoration:none;font-weight:800;padding:8px 14px;border-radius:999px;box-shadow:0 6px 14px ${pri}33">Ver video da cinematica</a>` : ''}
  </div>
  <div style="display:grid;grid-template-columns:${b.foto_frame_url ? '1fr 1fr' : '1fr'};gap:20px;margin-bottom:18px">
    ${b.foto_frame_url ? `<div>
      <img src="${x(b.foto_frame_url)}" alt="Frame" style="width:100%;max-height:330px;object-fit:contain;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0"/>
    </div>` : ''}
    <div>
      <div class="sec-sub" style="margin-top:0">MÃ©tricas da passada</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${metricaCard('Tempo de voo', met.tempo_voo_s, 'segundos')}
        ${metricaCard('Contato solo', met.tempo_contato_solo_s, 'segundos')}
        ${metricaCard('Freq. de passos', met.frequencia_passos_ppm, 'por minuto')}
        ${metricaCard('Comp. do passo', met.comprimento_passo_m, 'metros')}
        ${metricaCard('Comp. da passada', met.comprimento_passada_m, 'metros')}
        ${metricaCard('Fator de esforÃ§o', met.fator_esforco_pct, `% ${met.fator_esforco_tipo ?? 'aÃ©reo'}`)}
      </div>
    </div>
  </div>
  ${comparativoRunner()}
  ${aiBlock(ia)}
</section>`;

  // PÃ¡gina 2: AnÃ¡lise cinemÃ¡tica + achados + recomendaÃ§Ãµes
  const angItems = Object.entries(ang).map(([key, v]: any) => {
    const cor = corCls(v.classificacao ?? 'fora');
    const lb  = lbCls(v.classificacao ?? 'fora');
    const label = metaAngs[key] ?? key;
    const comentario = comentAng[key];
    return `<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <span style="font-size:13px;font-weight:700;color:#111827">${label}</span>
        <span style="font-size:11px;font-weight:700;color:${cor};padding:2px 10px;background:${cor}15;border-radius:20px">${lb}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:20px;font-weight:800;color:${cor};min-width:56px">${v.valor}Â°</div>
        <div style="flex:1">
          <div style="height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${Math.min(100, Math.abs(v.valor) / (v.ideal_max || 180) * 100)}%;background:${cor};border-radius:99px"></div>
          </div>
          <div style="font-size:10px;color:#94a3b8;margin-top:3px">Faixa ideal: ${v.ideal_min}Â° a ${v.ideal_max}Â°</div>
        </div>
      </div>
      ${comentario ? `<div style="margin-top:7px;margin-left:66px;padding:8px 10px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0">
        <p style="font-size:11.5px;line-height:1.55;color:#334155;margin:0;white-space:pre-line">${x(comentario)}</p>
      </div>` : ''}
    </div>`;
  }).join('');

  const achadosList = [
    achados.mecanica_frenagem      && 'MecÃ¢nica de frenagem (overstride)',
    achados.sobrecarga_articular   && 'Sobrecarga articular e muscular',
    achados.deslocamento_cg        && 'Deslocamento do centro de gravidade',
    achados.ineficiencia_propulsiva&& 'IneficiÃªncia propulsiva',
  ].filter(Boolean);

  const recItems = [
    rec.correcao_postura     && ['CorreÃ§Ã£o de postura', rec.correcao_postura],
    rec.ajuste_passada       && ['Ajuste de passada', rec.ajuste_passada],
    rec.exercicios_dinamicos && ['ExercÃ­cios dinÃ¢micos', rec.exercicios_dinamicos],
    rec.complementos         && ['Complementos', rec.complementos],
  ].filter(Boolean) as [string,string][];

  const temPg2 = Boolean(achadosList.length || achados.comentarios_risco || achados.observacoes || recItems.length);
  const pg2 = temPg2 ? `<section class="page module" style="display:flex;flex-direction:column">
  <div class="mod-head"><h2 class="mod-title">Achados e recomendações da corrida</h2></div>
  ${achadosList.length || achados.comentarios_risco ? `<div class="sec-sub">Pontos de atenÃ§Ã£o e risco</div>
    ${achadosList.length ? `<div style="margin-bottom:16px">${achadosList.map(a =>
      `<div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start">
        <div style="width:6px;height:6px;background:#ef4444;border-radius:50%;margin-top:5px;flex-shrink:0"></div>
        <span style="font-size:13px;color:#374151;font-weight:600">${a}</span>
      </div>`).join('')}
    </div>` : ''}
    ${achados.comentarios_risco ? `<div style="margin:-4px 0 16px;padding:11px 12px;border-radius:8px;background:#fff7ed;border:1px solid #fed7aa">
    <p style="font-size:12px;color:#7c2d12;margin:0;line-height:1.6;white-space:pre-line">${x(achados.comentarios_risco)}</p>
  </div>` : ''}` : ''}
  ${achados.observacoes ? `<p style="font-size:12px;color:#4b5563;margin-bottom:16px;line-height:1.6">${x(achados.observacoes)}</p>` : ''}
  ${recItems.length ? `<div class="sec-sub">RecomendaÃ§Ãµes</div>
    <div>${recItems.map(([titulo, texto]: [string,string]) =>
      `<div style="margin-bottom:12px">
        <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px">${titulo}</div>
        <p style="font-size:12px;color:#4b5563;line-height:1.6">${x(texto)}</p>
      </div>`).join('')}
    </div>` : ''}
</section>` : '';

  // PÃ¡gina 3: GrÃ¡ficos cinemÃ¡ticos
  const grafUrls = [
    ['joelho_url',   'joelho',   'Joelho'],
    ['quadril_url',  'quadril',  'Quadril'],
    ['cotovelo_url', 'cotovelo', 'Cotovelo'],
  ].filter(([k]) => graf[k]);

  const pg3 = grafUrls.length ? `<section class="page module" style="display:flex;flex-direction:column">
  <div class="mod-head"><h2 class="mod-title">GrÃ¡ficos cinemÃ¡ticos</h2></div>
  <div class="sec-sub" style="margin-top:0">GrÃ¡ficos cinemÃ¡ticos</div>
  <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:start">
    ${grafUrls.map(([k, ck, lbl]) => `<div style="width:100%;min-width:0">
      <div style="font-size:11px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${lbl}</div>
      <div style="width:100%;aspect-ratio:544/443;background:#050505;border-radius:8px;border:1px solid #1f2937;overflow:hidden">
        <img src="${x(graf[k])}" alt="${lbl}" style="width:100%;height:100%;object-fit:contain;display:block"/>
      </div>
    </div>`).join('')}
    ${comentGraf.geral ? `<div style="grid-column:1/-1;padding:11px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc">
      <div style="font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Comentário geral dos gráficos</div>
      <p style="font-size:12px;line-height:1.55;color:#334155;margin:0;white-space:pre-line">${x(comentGraf.geral)}</p>
    </div>` : ''}
  </div>
</section>` : '';

  return [pg1, pg2, pg3].filter(Boolean).join('\n');
}


function pgRodape(d: LaudoData, pri: string): string {
  const c = d.clinica;
  const cfg = d.pdfConfig;
  const contato = c?[c.cnpj&&`CNPJ: ${c.cnpj}`,c.telefone,c.email,c.site,c.endereco].filter(Boolean).join(' Â· '):'';
  const textoLegal = cfg?.texto_legal ?? 'Este documento Ã© um relatÃ³rio tÃ©cnico e nÃ£o substitui diagnÃ³stico ou prescriÃ§Ã£o mÃ©dica.';
  const notaEquip = cfg?.nota_equipamentos;

  // Protocolos â€” usar config do banco se disponÃ­vel, senÃ£o fallback
  const protos = cfg?.protocolos ?? [
    {label:'Antropometria',texto:'PadrÃ£o ISAK'},
    {label:'% Gordura',texto:'Jackson & Pollock 7 dobras + Siri'},
    {label:'Massa Ã³ssea',texto:'Von DÃ¶beln (Rocha, 1974)'},
    {label:'Somatotipo',texto:'Heath-Carter'},
    {label:'PreensÃ£o palmar',texto:'DinamÃ´metro Medeor (Massy-Westropp, 2011)'},
    {label:'Dinamometria isomÃ©trica',texto:'SP Tech (protocolo interno)'},
    {label:'Flexibilidade',texto:'Banco de Wells (ACSM)'},
    {label:'AerÃ³bico',texto:'Zonas % FCmÃ¡x (Tanaka, 2001)'},
    {label:'FFMI',texto:'Schutz 2002; limite: Berkhan/McDonald'},
    {label:'RML â€” FlexÃ£o de braÃ§o',texto:'ACSM Guidelines, 11Âª ed. (2022)'},
    {label:'RML â€” Abdominal 1 min',texto:'Pollock & Wilmore (1990) / ACSM (2022)'},
    {label:'RML â€” Prancha ventral',texto:'McGill SM. Low Back Disorders, 2Âª ed. (2007)'},
    {label:'RML â€” Agachamento 1 min',texto:'Matsudo SMM (2001) / ACSM (2022)'},
    {label:'RML â€” Sentar e Levantar 30s',texto:'Rikli & Jones. Senior Fitness Test, 2Âª ed. (2013)'},
    {label:'RML â€” Arm Curl Test 30s',texto:'Rikli & Jones. Senior Fitness Test, 2Âª ed. (2013)'},
  ];

  // ReferÃªncias â€” usar config do banco se disponÃ­vel
  const refs = cfg?.referencias ?? [
    {texto:'Jackson & Pollock. Br J Nutr. 1978;40(3):497â€“504.'},
    {texto:'Siri WE. Univ. of California; 1961.'},
    {texto:'Carter & Heath. Somatotyping. Cambridge; 1990.'},
    {texto:'Tanaka et al. J Am Coll Cardiol. 2001;37(1):153â€“6.'},
    {texto:'Stewart et al. ISAK Standards; 2011.'},
    {texto:'Leong et al. Lancet. 2015;386:266â€“273.'},
    {texto:'Medeor Ltda. Manual tÃ©cnico do dinamÃ´metro isomÃ©trico Medeor. SÃ£o Paulo; 2019.'},
    {texto:'Massy-Westropp NM et al. Hand Grip Strength normative data. BMC Res Notes. 2011;4:127.'},
    {texto:'ACSM\'s Guidelines for Exercise Testing and Prescription, 11Âª ed. (2022).'},
    {texto:'Pollock ML, Wilmore JH. Exercise in Health and Disease, 2Âª ed. (1990).'},
    {texto:'McGill SM. Low Back Disorders: Evidence-Based Prevention and Rehabilitation, 2Âª ed. (2007).'},
    {texto:'Rikli RE, Jones CJ. Senior Fitness Test Manual, 2Âª ed. (2013).'},
    {texto:'Matsudo SMM. Envelhecimento & Atividade FÃ­sica. Midiograf (2001).'},
    {texto:'Matsudo VKR et al. Tabelas de referÃªncia para aptidÃ£o fÃ­sica. Rev Bras Ativ FÃ­s SaÃºde (1997).'},
  ];

  return `<section class="ref-section page module" style="page-break-after:auto">
  <div style="border-top:2px solid ${pri};padding-top:20px">
    <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:16px">Protocolos e referÃªncias</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div>
        <div style="font-size:10px;font-weight:700;color:#374151;margin-bottom:8px">Protocolos utilizados</div>
        <ul style="padding-left:16px;font-size:11px;color:#4b5563;line-height:1.8">
          ${protos.filter((p: any)=>p.label&&p.texto).map((p: any)=>`<li>${x(p.label)} â€” ${x(p.texto)}</li>`).join('')}
        </ul>
        ${notaEquip ? `<div style="margin-top:10px;font-size:10px;color:#6b7280;font-style:italic;padding:8px 10px;background:#f9fafb;border-radius:6px;border-left:2px solid ${pri}">${x(notaEquip)}</div>` : ''}
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:#374151;margin-bottom:8px">ReferÃªncias bibliogrÃ¡ficas</div>
        <ol style="padding-left:16px;font-size:10px;color:#6b7280;line-height:1.8">
          ${refs.filter((r: any)=>r.texto).map((r: any)=>`<li>${x(r.texto)}</li>`).join('')}
        </ol>
      </div>
    </div>
    <div class="footer-note">${x(textoLegal)}
    ${contato?`<br/><b style="color:#6b7280">${x(c?.nome??'')}</b> Â· ${x(contato)}`:''}</div>
  </div>
</section>`;
}

// â”€â”€â”€ Render principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function renderLaudoHTML(d: LaudoData): string {
  const m = d.modulos, ia = d.analisesIA??{};
  const pri = d.clinica?.cor_primaria ?? '#059669';
  const footerLeft = d.clinica?.nome || 'Diagnóstico Fisiometabólico';
  const footerCenter = [d.avaliador.nome, d.avaliador.conselho, d.avaliador.especialidade].filter(Boolean).join(' · ');
  const footerRight = `${d.paciente.nome}${d.paciente.cpf ? ` · CPF: ${d.paciente.cpf}` : ''}`;

  const pages = [
    pgCapa(d),
    pgResumo(d),
    ia.conclusao_global ? pgConclusao(d, pri) : '',
    m.bioimpedancia       ? pgBio(d.dados.bioimpedancia, ia.bioimpedancia) : '',
    m.antropometria       ? pgAntro({...d.dados.antropometria,_sexo:d.paciente.sexo}, d.scores.composicao_corporal, ia.antropometria) : '',
    // Anamnese + Sinais Vitais â€” pÃ¡gina combinada
    (m.anamnese || m.sinais_vitais)
      ? pgSinaisAnamnese(
          m.anamnese      ? d.dados.anamnese      : null,
          m.sinais_vitais ? d.dados.sinais_vitais : null,
          ia.anamnese, ia.sinais_vitais, pri)
      : '',
    // Posturografia + Flexibilidade — página combinada única
    (m.posturografia || m.flexibilidade)
      ? pgPosturaFlex(
          m.posturografia  ? d.dados.posturografia : null, m.posturografia ? d.scores.postura : null,
          m.flexibilidade ? d.dados.flexibilidade : null, m.flexibilidade ? d.scores.flexibilidade??null : null,
          m.posturografia ? ia.posturografia : null, m.flexibilidade ? ia.flexibilidade : null, pri)
      : '',
    m.forca               ? pgForca(d.dados.forca, d.scores.forca, ia.forca) : '',
    m.rml                 ? pgRML(d.dados.rml, d.scores.rml??null, d.paciente.sexo, d.paciente.idade, ia.rml, pri) : '',
    m.cardiorrespiratorio ? pgCardio(d.dados.cardiorrespiratorio, d.scores.cardiorrespiratorio, ia.cardiorrespiratorio) : '',
    m.biomecanica_corrida ? pgBiomecanica(d.dados.biomecanica_corrida, ia.biomecanica_corrida, pri) : '',
    ia.evolucao           ? pgModulo('Evolução longitudinal', null,
      '<p style="font-size:13px;color:#64748b;line-height:1.7;margin-bottom:16px">Análise comparativa entre avaliações finalizadas do paciente, considerando tendências, progressos, regressões e próximos passos.</p>',
      ia.evolucao) : '',
    pgRodape(d, pri),
  ].filter(Boolean).join('\n');

  return limparTextoHTML(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"/>
<title>${x(d.paciente.nome)} â€” DiagnÃ³stico FisiometabÃ³lico</title>
<style>${CSS(pri)}</style>
</head><body data-footer-left="${xa(footerLeft)}" data-footer-center="${xa(footerCenter)}" data-footer-right="${xa(footerRight)}">${pages}</body></html>`);
}
