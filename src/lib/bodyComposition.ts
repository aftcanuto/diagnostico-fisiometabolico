import type { Sexo } from '@/types';
import { numeroClinico } from '@/lib/forcaPreensao';

export type FonteGorduraRelatorio = 'antropometria' | 'bioimpedancia' | 'maior' | 'menor' | 'manual';

export function resolverPercentualGordura(avaliacao: any, antropometria: any, bioimpedancia: any) {
  const ant = numeroClinico(antropometria?.percentual_gordura);
  const bio = numeroClinico(bioimpedancia?.percentual_gordura);
  const fonte = avaliacao?.fonte_gordura_relatorio as FonteGorduraRelatorio | null | undefined;
  const salvo = numeroClinico(avaliacao?.percentual_gordura_relatorio);
  const valores = [ant, bio].filter((v): v is number => v != null);
  const maior = valores.length ? Math.max(...valores) : null;
  const menor = valores.length ? Math.min(...valores) : null;
  const fonteDefinida = fonte === 'antropometria' || fonte === 'bioimpedancia' || fonte === 'maior' || fonte === 'menor' || fonte === 'manual' || salvo != null;
  const valor =
    fonte === 'antropometria' ? ant :
    fonte === 'bioimpedancia' ? bio :
    fonte === 'maior' ? maior :
    fonte === 'menor' ? menor :
    salvo ?? ant ?? bio ?? null;

  return {
    valor,
    fonte: fonte ?? (salvo != null ? 'manual' : ant != null ? 'antropometria' : bio != null ? 'bioimpedancia' : null),
    fonteDefinida,
    antropometria: ant,
    bioimpedancia: bio,
    maior,
    menor,
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
    if (imc != null && imc >= 35) {
      nivel = 3; label = 'Obesidade'; cor = '#ef4444';
    } else if (imc != null && imc >= 25) {
      nivel = 2; label = 'Sobrepeso'; cor = '#f97316';
    }
  } else if (opts.sexo === 'M') {
    if (pct <= 10) { nivel = 0; label = 'Essencial'; cor = '#06b6d4'; }
    else if (pct <= 17) { nivel = 0; label = 'Atletico'; cor = '#10b981'; }
    else if (pct <= 25) { nivel = 1; label = 'Fitness'; cor = '#f59e0b'; }
    else if (pct <= 29) { nivel = 2; label = 'Sobrepeso'; cor = '#f97316'; }
    else { nivel = 3; label = 'Obesidade'; cor = '#ef4444'; }
  } else {
    if (pct <= 14) { nivel = 0; label = 'Essencial'; cor = '#06b6d4'; }
    else if (pct <= 21) { nivel = 0; label = 'Atletica'; cor = '#10b981'; }
    else if (pct <= 29) { nivel = 1; label = 'Fitness'; cor = '#f59e0b'; }
    else if (pct <= 32) { nivel = 2; label = 'Sobrepeso'; cor = '#f97316'; }
    else { nivel = 3; label = 'Obesidade'; cor = '#ef4444'; }
  }

  if (imc != null) {
    if (imc >= 35 && pct == null) {
      nivel = 3;
      label = 'Obesidade';
      cor = '#ef4444';
    } else if (imc >= 25) {
      nivel = Math.max(nivel, 2);
      if (pct == null || ['Atletico', 'Atletica', 'Fitness'].includes(label)) {
        label = 'Sobrepeso';
        cor = '#f97316';
      }
    }
  }

  return { nivel, label, cor };
}
