/**
 * Consolida o histórico de avaliações de um paciente em séries temporais
 * prontas para alimentar os gráficos do dashboard.
 *
 * Recebe uma lista de avaliações já hidratadas com scores/antropometria/etc
 * (mesmo formato retornado pela RPC paciente_dashboard_por_token).
 */

export interface AvaliacaoHidratada {
  id: string;
  data: string;
  tipo: string;
  status: string;
  scores?: any;
  antropometria?: any;
  bioimpedancia?: any;
  forca?: any;
  flexibilidade?: any;
  cardiorrespiratorio?: any;
  posturografia?: any;
  sinais_vitais?: any;
  anamnese?: any;
  rml?: any;
  analises_ia?: any;
  biomecanica_corrida?: any;
  modulos_selecionados?: any;
}

export interface HistoricoConsolidado {
  ordenadas: AvaliacaoHidratada[]; // asc por data
  ultima: AvaliacaoHidratada | null;
  penultima: AvaliacaoHidratada | null;
  series: {
    peso: { x: string; y: number | null }[];
    pctGordura: { x: string; y: number | null }[];
    massaMagra: { x: string; y: number | null }[];
    imc: { x: string; y: number | null }[];
    vo2max: { x: string; y: number | null }[];
    preensaoDir: { x: string; y: number | null }[];
    preensaoEsq: { x: string; y: number | null }[];
    scoreGlobal: { x: string; y: number | null }[];
    scorePostura: { x: string; y: number | null }[];
    scoreComposicao: { x: string; y: number | null }[];
    scoreForca: { x: string; y: number | null }[];
    scoreCardio: { x: string; y: number | null }[];
    scoreFlexibilidade: { x: string; y: number | null }[];
    pctGorduraBio: { x: string; y: number | null }[];
  };
}

export function consolidarHistorico(avaliacoes: AvaliacaoHidratada[]): HistoricoConsolidado {
  const ordenadas = [...avaliacoes].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const serie = <T,>(fn: (a: AvaliacaoHidratada) => T | null | undefined) =>
    ordenadas.map(a => ({ x: a.data, y: (fn(a) ?? null) as any }));

  return {
    ordenadas,
    ultima: ordenadas[ordenadas.length - 1] ?? null,
    penultima: ordenadas.length > 1 ? ordenadas[ordenadas.length - 2] : null,
    series: {
      peso:            serie(a => numeric(a.antropometria?.peso) ?? numeric((a as any).bioimpedancia?.peso_kg)),
      pctGordura:      serie(a => numeric(a.antropometria?.percentual_gordura)),
      massaMagra:      serie(a => numeric(a.antropometria?.massa_magra)),
      imc:             serie(a => numeric(a.antropometria?.imc)),
      vo2max:          serie(a => numeric(a.cardiorrespiratorio?.vo2max)),
      preensaoDir:     serie(a => numeric(a.forca?.preensao_dir_kgf)),
      preensaoEsq:     serie(a => numeric(a.forca?.preensao_esq_kgf)),
      scoreGlobal:     serie(a => numeric(a.scores?.global)),
      scorePostura:    serie(a => numeric(a.scores?.postura)),
      scoreComposicao:    serie(a => numeric(a.scores?.composicao_corporal)),
      scoreForca:         serie(a => numeric(a.scores?.forca)),
      scoreCardio:        serie(a => numeric(a.scores?.cardiorrespiratorio)),
      scoreFlexibilidade: serie(a => numeric(a.scores?.flexibilidade)),
      pctGorduraBio:      serie(a => numeric(a.bioimpedancia?.percentual_gordura)),
    },
  };
}

function numeric(v: any): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
