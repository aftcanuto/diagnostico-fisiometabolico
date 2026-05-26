import type { Sexo } from '@/types';
import { numeroClinico } from '@/lib/forcaPreensao';

export type FonteGorduraRelatorio = 'antropometria' | 'bioimpedancia';

export function resolverPercentualGordura(avaliacao: any, antropometria: any, bioimpedancia: any) {
  const ant = numeroClinico(antropometria?.percentual_gordura);
  const bio = numeroClinico(bioimpedancia?.percentual_gordura);
  const fonte = avaliacao?.fonte_gordura_relatorio as FonteGorduraRelatorio | null | undefined;
  const salvo = numeroClinico(avaliacao?.percentual_gordura_relatorio);
  const fonteDefinida = fonte === 'antropometria' || fonte === 'bioimpedancia';
  const valor =
    fonte === 'antropometria' ? ant :
    fonte === 'bioimpedancia' ? bio :
    salvo ?? ant ?? bio ?? null;

  return {
    valor,
    fonte: fonteDefinida ? fonte : salvo != null ? 'manual' : ant != null ? 'antropometria' : bio != null ? 'bioimpedancia' : null,
    fonteDefinida,
    antropometria: ant,
    bioimpedancia: bio,
    conflito: ant != null && bio != null && Math.abs(ant - bio) >= 0.5 && !fonteDefinida,
  };
}

export function classificarComposicaoCorporal(opts: {
  sexo: Sexo;
  pctGordura?: number | null;
  imc?: number | null;
}) {
  const pct = numeroClinico(opts.pctGordura);
  const imc = numeroClinico(opts.imc);
  let nivel = 1;
  let label = 'Fitness';
  let cor = '#10b981';

  if (pct == null) {
    if (imc != null && imc >= 30) {
      nivel = 3; label = 'Obesidade'; cor = '#ef4444';
    } else if (imc != null && imc >= 25) {
      nivel = 2; label = 'Atencao'; cor = '#f59e0b';
    }
  } else if (opts.sexo === 'M') {
    if (pct <= 10) { nivel = 0; label = 'Essencial'; cor = '#06b6d4'; }
    else if (pct <= 17) { nivel = 0; label = 'Atletico'; cor = '#10b981'; }
    else if (pct <= 25) { nivel = 1; label = 'Fitness'; cor = '#f59e0b'; }
    else if (pct <= 29) { nivel = 2; label = 'Aceitavel'; cor = '#f97316'; }
    else { nivel = 3; label = 'Obesidade'; cor = '#ef4444'; }
  } else {
    if (pct <= 14) { nivel = 0; label = 'Essencial'; cor = '#06b6d4'; }
    else if (pct <= 21) { nivel = 0; label = 'Atletica'; cor = '#10b981'; }
    else if (pct <= 29) { nivel = 1; label = 'Fitness'; cor = '#f59e0b'; }
    else if (pct <= 32) { nivel = 2; label = 'Aceitavel'; cor = '#f97316'; }
    else { nivel = 3; label = 'Obesidade'; cor = '#ef4444'; }
  }

  if (imc != null) {
    if (imc >= 30) {
      nivel = Math.max(nivel, 3);
      if (pct == null || ['Atletico', 'Atletica', 'Fitness', 'Aceitavel'].includes(label)) {
        label = 'Obesidade';
        cor = '#ef4444';
      }
    } else if (imc >= 25) {
      nivel = Math.max(nivel, 2);
      if (pct == null || ['Atletico', 'Atletica', 'Fitness'].includes(label)) {
        label = 'Atencao';
        cor = '#f59e0b';
      }
    }
  }

  return { nivel, label, cor };
}
