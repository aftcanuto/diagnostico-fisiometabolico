import type { Sexo } from '@/types';
import { numeroClinico } from '@/lib/forcaPreensao';

export type FonteGorduraRelatorio = 'antropometria' | 'bioimpedancia' | 'maior' | 'menor' | 'manual';

export function percentualGorduraAntropometria(antropometria: any): number | null {
  const projetado = numeroClinico(antropometria?.percentual_gordura);
  if (projetado != null) return projetado;
  if (antropometria?.registro_v2?.version !== 2) return null;
  const resultado = antropometria?.resultados_v2?.results?.find((item: any) =>
    item?.id === 'fatPercent' && item?.selected === true && item?.status === 'available'
  );
  return numeroClinico(resultado?.value);
}

export function composicaoOficialParaIA(antropometria: any, bioimpedancia?: any) {
  const percentual = percentualGorduraAntropometria(antropometria);
  return {
    percentual_gordura: percentual,
    fonte: percentual != null ? 'antropometria' as const : 'indisponivel' as const,
    metodo: antropometria?.resultados_v2?.results?.find((item: any) =>
      item?.id === 'fatPercent' && item?.selected === true && item?.status === 'available'
    )?.label ?? null,
    percentual_bioimpedancia_excluido: numeroClinico(bioimpedancia?.percentual_gordura) != null,
    regra: 'O percentual de gordura global da IA vem exclusivamente da antropometria. Nao substituir pela bioimpedancia.',
  };
}

export function resolverPercentualGordura(avaliacao: any, antropometria: any, bioimpedancia: any) {
  const ant = percentualGorduraAntropometria(antropometria);
  const bio = numeroClinico(bioimpedancia?.percentual_gordura);
  if (antropometria?.registro_v2?.version === 2) return {
    valor: ant, fonte: 'antropometria' as const, fonteDefinida: true,
    antropometria: ant, bioimpedancia: bio, maior: null, menor: null, conflito: false,
  };
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

  // IMC so determina a faixa visual quando nao ha percentual de gordura.
  // Quando ha composicao medida/estimada, o IMC permanece um marcador separado.
  if (imc != null && pct == null) {
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
