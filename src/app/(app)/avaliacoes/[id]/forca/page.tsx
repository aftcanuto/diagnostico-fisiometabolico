'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { buscarModulo, upsertModulo } from '@/lib/modulos';
import { useAutoSave } from '@/lib/useAutoSave';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, ChevronDown, ChevronUp, Crosshair } from 'lucide-react';
import { buildSteps } from '@/lib/steps';
import { buscarDadosCorporaisBase } from '@/lib/avaliacaoBase';

/* ══ TIPOS ══════════════════════════════════════════════ */
interface LadoData {
  kgf: string; torque_nm: string; rm1_kg: string;
  cargas: {
    resistencia_min: string; resistencia_max: string;
    forca_min: string; forca_max: string;
    potencia_min: string; potencia_max: string;
    hipertrofia_min: string; hipertrofia_max: string;
    velocidade_min: string;
  };
}
interface SPTechTeste {
  articulacao: string;
  nome_outra: string;
  movimento: string;
  movimento_outra: string;
  lateralidade: 'bilateral' | 'direito' | 'esquerdo';
  lado_d: LadoData;
  lado_e: LadoData;
  assimetria_pct: string;
  classificacao_assimetria: string;
}
interface AlgometriaPonto {
  segmento: string;
  lado: 'direito' | 'esquerdo' | 'sem_lado';
  valor_kgf: string;
  observacao: string;
}
interface SPTechRelacao { descricao: string; percentual: string; }
interface TesteSimplesItem { nome: string; valor: string; unidade: string; }
interface SPTechRelacaoCalculada {
  nome: string;
  lado: 'Direito' | 'Esquerdo';
  percentual: number;
  numerador: string;
  denominador: string;
  unidade: 'kgf' | 'Nm';
  descricao: string;
}
interface TracaoLado {
  fim_kgf: string;
  fim_n: string;
  forca_inicial_kgf: string;
  tempo_ms: string;
  forca_50ms_kgf: string;
  forca_100ms_kgf: string;
  forca_200ms_kgf: string;
  rm1_kg: string;
  forca_relativa_kgf_kg: string;
  rfd_kgf_s: string;
  rfd_50_kgf_s: string;
  rfd_100_kgf_s: string;
  rfd_200_kgf_s: string;
  impulso_kgf_s: string;
  sustentacao_80_s: string;
  duracao_s: string;
}
interface TracaoTeste {
  modo_coleta: 'manual' | 'bluetooth';
  teste: string;
  musculo: string;
  exercicio_ref: string;
  fator: string;
  peso_corporal_kg: string;
  numero_tentativas: string;
  tentativas_fim_kgf: string;
  lado_d: TracaoLado;
  lado_e: TracaoLado;
  media_tentativas_kgf: string;
  indice_fadiga_pct: string;
  lsi_pct: string;
  diferenca_abs_kgf: string;
  assimetria_pct: string;
  classificacao_assimetria: string;
  observacoes: string;
}
interface TracaoRelacaoCalculada {
  nome: string;
  lado: 'Direito' | 'Esquerdo';
  percentual: number;
  numerador: string;
  denominador: string;
  descricao: string;
}

/* ══ CONSTANTES ══════════════════════════════════════════ */
const ARTICULACOES = [
  'Joelho','Quadril','Ombro','Cotovelo',
  'Peitoral','Punho','Lombar','Cervical','Coluna',
  'Tornozelo','Outra',
];

const MOVIMENTOS: Record<string, string[]> = {
  Joelho:    ['Extensão','Flexão'],
  Quadril:   ['Flexão','Extensão','Hip Sit','Abdução','Adução','Rotação interna','Rotação externa'],
  Ombro:     ['Flexão','Extensão','Abdução','Adução','Rotação interna','Rotação externa'],
  Cotovelo:  ['Flexão','Extensão'],
  Peitoral:  ['Flexão','Extensão','Adução horizontal'],
  Punho:     ['Flexão','Extensão','Desvio radial','Desvio ulnar'],
  Lombar:    ['Flexão','Extensão','Inclinação D','Inclinação E'],
  Cervical:  ['Flexão','Extensão','Inclinação D','Inclinação E','Rotação D','Rotação E'],
  Coluna:    ['Flexão','Extensão','Flexão lateral D','Flexão lateral E'],
  Tornozelo: ['Dorsiflexão','Flexão plantar','Inversão','Eversão'],
  Outra:     [],
};

// Articulações axiais: resultado único, sem separação D/E
const AXIAIS = new Set(['Coluna','Cervical','Lombar']);

const TRACAO_REFERENCIAS = [
  { key:'biceps_90', musculo:'Bíceps 90°', exercicio:'Rosca direta / rosca unilateral', fator:0.70 },
  { key:'triceps_90', musculo:'Tríceps 90°', exercicio:'Tríceps pulley / extensão unilateral', fator:0.70 },
  { key:'peitoral_maior', musculo:'Peitoral maior', exercicio:'Supino / chest press / crucifixo adaptado', fator:0.60 },
  { key:'latissimo_dorso', musculo:'Latíssimo do dorso', exercicio:'Remada unilateral / puxada', fator:0.75 },
  { key:'quadriceps_90', musculo:'Quadríceps 90°', exercicio:'Cadeira extensora / extensão de joelho', fator:0.65 },
  { key:'isquiotibiais_30_45', musculo:'Isquiotibiais 30°-45°', exercicio:'Mesa flexora / flexão de joelho', fator:0.60 },
  { key:'imtp_130_140', musculo:'IMTP 130°-140°', exercicio:'Deadlift / puxada / força global', fator:0.50 },
  { key:'outro', musculo:'Outro', exercicio:'', fator:1 },
];

TRACAO_REFERENCIAS.splice(4, 0,
  { key:'ombro_rotacao_interna', musculo:'Ombro - rotacao interna', exercicio:'Rotacao interna com cabo/elastico', fator:1 },
  { key:'ombro_rotacao_externa', musculo:'Ombro - rotacao externa', exercicio:'Rotacao externa com cabo/elastico', fator:1 },
  { key:'ombro_flexao', musculo:'Ombro - flexao', exercicio:'Elevacao frontal / flexao de ombro', fator:1 },
  { key:'ombro_extensao', musculo:'Ombro - extensao', exercicio:'Extensao de ombro no cabo', fator:1 },
  { key:'ombro_abducao', musculo:'Ombro - abducao', exercicio:'Elevacao lateral / abducao de ombro', fator:1 },
  { key:'ombro_aducao', musculo:'Ombro - aducao', exercicio:'Aducao de ombro no cabo', fator:1 },
);

const TRACAO_RELACOES = [
  {
    nome: 'Isquiotibiais / Quadríceps',
    numerador: 'isquiotibiais_30_45',
    denominador: 'quadriceps_90',
    descricao: 'Relação H/Q pela força isométrica máxima',
  },
  {
    nome: 'Tríceps / Bíceps',
    numerador: 'triceps_90',
    denominador: 'biceps_90',
    descricao: 'Equilíbrio flexores/extensores do cotovelo',
  },
  {
    nome: 'Puxar / empurrar',
    numerador: 'latissimo_dorso',
    denominador: 'peitoral_maior',
    descricao: 'Equilíbrio entre cadeia de puxada e empurrar',
  },
] as const;

const TRACAO_RELACOES_EXTRA = [
  {
    nome: 'Rotacao externa / interna do ombro',
    numerador: 'ombro_rotacao_externa',
    denominador: 'ombro_rotacao_interna',
    descricao: 'Relacao RE/RI do ombro',
  },
  {
    nome: 'Flexao / extensao do ombro',
    numerador: 'ombro_flexao',
    denominador: 'ombro_extensao',
    descricao: 'Referencia operacional: 85-100%',
  },
  {
    nome: 'Abducao / aducao do ombro',
    numerador: 'ombro_abducao',
    denominador: 'ombro_aducao',
    descricao: 'Referencia operacional: 80-95%',
  },
] as const;

const ESPORTES_FORCA = [
  ['saude_geral', 'Saúde geral'],
  ['corrida', 'Corrida'],
  ['musculacao', 'Musculação'],
  ['beach_tennis', 'Beach tennis'],
  ['tenis', 'Tênis'],
  ['tenis_mesa', 'Tênis de mesa'],
  ['volei', 'Vôlei'],
  ['natacao', 'Natação'],
  ['lutas', 'Lutas'],
  ['futebol', 'Futebol'],
  ['ciclismo', 'Ciclismo'],
  ['outro', 'Outro'],
] as const;

const FINALIDADES_FORCA = [
  ['triagem', 'Triagem funcional'],
  ['performance', 'Performance'],
  ['retorno_esporte', 'Retorno ao esporte'],
  ['prevencao', 'Prevenção de lesões'],
  ['dor', 'Dor / limitação funcional'],
  ['reabilitacao', 'Reabilitação'],
  ['hipertrofia', 'Hipertrofia'],
  ['emagrecimento', 'Emagrecimento'],
] as const;

const LADOS_DOMINANTES = [
  ['direito', 'Direito'],
  ['esquerdo', 'Esquerdo'],
  ['ambidestro', 'Ambidestro'],
] as const;

/* ══ HELPERS ════════════════════════════════════════════ */
const ladoVazio = (): LadoData => ({
  kgf:'', torque_nm:'', rm1_kg:'',
  cargas:{
    resistencia_min:'', resistencia_max:'',
    forca_min:'', forca_max:'',
    potencia_min:'', potencia_max:'',
    hipertrofia_min:'', hipertrofia_max:'',
    velocidade_min:'',
  },
});

const testeVazio = (): SPTechTeste => ({
  articulacao:'Joelho', nome_outra:'',
  movimento:'Extensão', movimento_outra:'',
  lateralidade:'bilateral',
  lado_d: ladoVazio(), lado_e: ladoVazio(),
  assimetria_pct:'', classificacao_assimetria:'Leve',
});

const testesPredefinidos = (): SPTechTeste[] =>
  ['Joelho', 'Quadril', 'Ombro', 'Cotovelo', 'Punho', 'Tornozelo', 'Coluna', 'Cervical', 'Lombar']
    .map(articulacao => {
      const movs = MOVIMENTOS[articulacao] ?? [];
      return { ...testeVazio(), articulacao, movimento: movs[0] ?? '' };
    });

function temMedidaSPTech(t: SPTechTeste) {
  return !!(
    t.lado_d.kgf || t.lado_d.torque_nm || t.lado_d.rm1_kg ||
    t.lado_e.kgf || t.lado_e.torque_nm || t.lado_e.rm1_kg
  );
}

const algVazio = (): AlgometriaPonto => ({
  segmento:'', lado:'sem_lado', valor_kgf:'', observacao:'',
});

const tracaoLadoVazio = (): TracaoLado => ({
  fim_kgf:'',
  fim_n:'',
  forca_inicial_kgf:'',
  tempo_ms:'',
  forca_50ms_kgf:'',
  forca_100ms_kgf:'',
  forca_200ms_kgf:'',
  rm1_kg:'',
  forca_relativa_kgf_kg:'',
  rfd_kgf_s:'',
  rfd_50_kgf_s:'',
  rfd_100_kgf_s:'',
  rfd_200_kgf_s:'',
  impulso_kgf_s:'',
  sustentacao_80_s:'',
  duracao_s:'',
});

const tracaoVazio = (): TracaoTeste => {
  const ref = TRACAO_REFERENCIAS[0];
  return {
    modo_coleta: 'manual',
    teste: ref.key,
    musculo: ref.musculo,
    exercicio_ref: ref.exercicio,
    fator: ref.fator.toString(),
    peso_corporal_kg:'',
    numero_tentativas:'',
    tentativas_fim_kgf:'',
    lado_d: tracaoLadoVazio(),
    lado_e: tracaoLadoVazio(),
    media_tentativas_kgf:'',
    indice_fadiga_pct:'',
    lsi_pct:'',
    diferenca_abs_kgf:'',
    assimetria_pct:'',
    classificacao_assimetria:'Leve',
    observacoes:'',
  };
};

function classAssimetria(p: number) {
  if (p < 10) return 'Leve';
  if (p < 15) return 'Moderada';
  if (p < 20) return 'Alta';
  return 'Muito alta';
}

function tempoPicoEmSegundos(valor: string) {
  const t = parseFloat(valor);
  if (!Number.isFinite(t) || t <= 0) return 0;
  // Valores pequenos sao interpretados como segundos para evitar confundir 3 s com 3 ms.
  return t < 20 ? t : t / 1000;
}

function recalcTracao(t: TracaoTeste): TracaoTeste {
  const fator = parseFloat(t.fator) || 0;
  const peso = parseFloat(t.peso_corporal_kg) || 0;
  const calcLado = (lado: TracaoLado): TracaoLado => {
    const fim = parseFloat(lado.fim_kgf) || 0;
    const forcaInicial = parseFloat(lado.forca_inicial_kgf) || 0;
    const tempoS = tempoPicoEmSegundos(lado.tempo_ms);
    const f50 = parseFloat(lado.forca_50ms_kgf) || 0;
    const f100 = parseFloat(lado.forca_100ms_kgf) || 0;
    const f200 = parseFloat(lado.forca_200ms_kgf) || 0;
    return {
      ...lado,
      fim_n: fim ? (fim * 9.80665).toFixed(1) : '',
      rm1_kg: fim && fator ? (fim * fator).toFixed(1) : '',
      forca_relativa_kgf_kg: fim && peso ? (fim / peso).toFixed(3) : '',
      rfd_kgf_s: fim && tempoS ? ((fim - forcaInicial) / tempoS).toFixed(1) : '',
      rfd_50_kgf_s: f50 ? (f50 / 0.05).toFixed(1) : '',
      rfd_100_kgf_s: f100 ? (f100 / 0.10).toFixed(1) : '',
      rfd_200_kgf_s: f200 ? (f200 / 0.20).toFixed(1) : '',
    };
  };
  const lado_d = calcLado(t.lado_d);
  const lado_e = calcLado(t.lado_e);
  const d = parseFloat(lado_d.fim_kgf) || 0;
  const e = parseFloat(lado_e.fim_kgf) || 0;
  const assim = d && e ? (Math.abs(d - e) / Math.max(d, e)) * 100 : null;
  const lsi = d && e ? (Math.min(d, e) / Math.max(d, e)) * 100 : null;
  const difAbs = d && e ? Math.abs(d - e) : null;
  const tentativas = (t.tentativas_fim_kgf || '')
    .split(/[;,\s]+/)
    .map(v => parseFloat(v.replace(',', '.')))
    .filter(v => Number.isFinite(v) && v > 0);
  const media = tentativas.length
    ? tentativas.reduce((acc, v) => acc + v, 0) / tentativas.length
    : null;
  const melhor = tentativas.length ? Math.max(...tentativas) : null;
  const pior = tentativas.length ? Math.min(...tentativas) : null;
  const fadiga = melhor && pior ? ((melhor - pior) / melhor) * 100 : null;
  return {
    ...t,
    modo_coleta: t.modo_coleta ?? 'manual',
    peso_corporal_kg: t.peso_corporal_kg ?? '',
    numero_tentativas: t.numero_tentativas || (tentativas.length ? String(tentativas.length) : ''),
    tentativas_fim_kgf: t.tentativas_fim_kgf ?? '',
    lado_d,
    lado_e,
    media_tentativas_kgf: media == null ? '' : media.toFixed(1),
    indice_fadiga_pct: fadiga == null ? '' : fadiga.toFixed(1),
    lsi_pct: lsi == null ? '' : lsi.toFixed(1),
    diferenca_abs_kgf: difAbs == null ? '' : difAbs.toFixed(1),
    assimetria_pct: assim == null ? '' : assim.toFixed(1),
    classificacao_assimetria: assim == null ? 'Leve' : classAssimetria(assim),
  };
}

function fimTracao(teste: TracaoTeste | undefined, lado: 'lado_d' | 'lado_e') {
  if (!teste) return 0;
  return parseFloat(teste[lado]?.fim_kgf ?? '') || 0;
}

function relacoesTracaoCalculadas(testes: TracaoTeste[]): TracaoRelacaoCalculada[] {
  const porTeste = new Map<string, TracaoTeste>();
  for (const teste of testes) {
    if (teste.teste && teste.teste !== 'outro' && !porTeste.has(teste.teste)) {
      porTeste.set(teste.teste, teste);
    }
  }

  return [...TRACAO_RELACOES, ...TRACAO_RELACOES_EXTRA].flatMap(relacao => {
    const numerador = porTeste.get(relacao.numerador);
    const denominador = porTeste.get(relacao.denominador);

    return ([
      ['lado_d', 'Direito'],
      ['lado_e', 'Esquerdo'],
    ] as const).flatMap(([ladoKey, ladoLabel]) => {
      const valorNumerador = fimTracao(numerador, ladoKey);
      const valorDenominador = fimTracao(denominador, ladoKey);
      if (!valorNumerador || !valorDenominador) return [];

      return [{
        nome: relacao.nome,
        lado: ladoLabel,
        percentual: Number(((valorNumerador / valorDenominador) * 100).toFixed(1)),
        numerador: numerador?.musculo || TRACAO_REFERENCIAS.find(r => r.key === relacao.numerador)?.musculo || relacao.numerador,
        denominador: denominador?.musculo || TRACAO_REFERENCIAS.find(r => r.key === relacao.denominador)?.musculo || relacao.denominador,
        descricao: relacao.descricao,
      }];
    });
  });
}

function normalizarTextoBusca(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function movimentoSPTech(teste: SPTechTeste) {
  return normalizarTextoBusca(teste.articulacao === 'Outra' ? teste.movimento_outra : teste.movimento);
}

function valorSPTech(teste: SPTechTeste | undefined, lado: 'lado_d' | 'lado_e') {
  if (!teste) return { valor: 0, unidade: 'kgf' as const };
  const kgf = parseFloat(teste[lado]?.kgf ?? '') || 0;
  if (kgf) return { valor: kgf, unidade: 'kgf' as const };
  const torque = parseFloat(teste[lado]?.torque_nm ?? '') || 0;
  return { valor: torque, unidade: 'Nm' as const };
}

function relacoesSPTechCalculadas(testes: SPTechTeste[]): SPTechRelacaoCalculada[] {
  const ombroInterna = testes.find(t => t.articulacao === 'Ombro' && movimentoSPTech(t) === 'rotacao interna');
  const ombroExterna = testes.find(t => t.articulacao === 'Ombro' && movimentoSPTech(t) === 'rotacao externa');

  if (!ombroInterna || !ombroExterna) return [];

  return ([
    ['lado_d', 'Direito'],
    ['lado_e', 'Esquerdo'],
  ] as const).flatMap(([ladoKey, ladoLabel]) => {
    const externa = valorSPTech(ombroExterna, ladoKey);
    const interna = valorSPTech(ombroInterna, ladoKey);
    if (!externa.valor || !interna.valor || externa.unidade !== interna.unidade) return [];

    return [{
      nome: 'Rotação externa / interna do ombro',
      lado: ladoLabel,
      percentual: Number(((externa.valor / interna.valor) * 100).toFixed(1)),
      numerador: 'Rotação externa',
      denominador: 'Rotação interna',
      unidade: externa.unidade,
      descricao: 'Equilíbrio entre rotadores externos e internos do ombro',
    }];
  });
}

function rotuloTracao(t: TracaoTeste) {
  return t.musculo || TRACAO_REFERENCIAS.find(r=>r.key===t.teste)?.musculo || 'Teste de tração';
}

function rotuloTeste(t: SPTechTeste): string {
  const art = t.articulacao === 'Outra' ? (t.nome_outra || 'Outra') : t.articulacao;
  const mov = t.articulacao === 'Outra' ? (t.movimento_outra || '-') : t.movimento;
  const lat = t.articulacao === 'Outra'
    ? ({bilateral:'Bilateral',direito:'Direito',esquerdo:'Esquerdo'} as any)[t.lateralidade]
    : AXIAIS.has(t.articulacao) ? 'Bilateral' : '';
  return `${art} - ${mov}${lat ? ` (${lat})` : ''}`;
}

/* ══ SUBCOMPONENTE: painel de um lado ════════════════════ */
function PainelLado({ lado, dados, cor, titulo, onChange, onCarga }: {
  lado: 'lado_d'|'lado_e'; dados: LadoData;
  cor: string; titulo: string;
  onChange: (f:string,v:string)=>void;
  onCarga:  (c:string,v:string)=>void;
}) {
  const CARGAS:[string,string,string][] = [
    ['resistencia_min','resistencia_max','Resistência'],
    ['forca_min','forca_max','Força'],
    ['potencia_min','potencia_max','Potência'],
    ['hipertrofia_min','hipertrofia_max','Hipertrofia'],
  ];
  return (
    <div className={`rounded-lg p-3 border ${cor}`}>
      <div className={`text-xs font-semibold mb-3 ${lado==='lado_d'?'text-blue-700':'text-purple-700'}`}>
        {titulo}
      </div>
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[['kgf','kgf'],['torque_nm','Torque (Nm)'],['rm1_kg','1RM pred. (kg)']].map(([f,l])=>(
          <Field key={f} label={l}>
            <Input type="number" step="0.01" value={(dados as any)[f]}
              onChange={e=>onChange(f,e.target.value)} />
          </Field>
        ))}
      </div>
      <div className="text-xs font-medium text-slate-600 mb-1.5">Cargas de treinamento (kg)</div>
      <div className="space-y-1.5">
        {CARGAS.map(([mn,mx,lbl])=>(
          <div key={lbl} className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-20 flex-shrink-0">{lbl}</span>
            <Input type="number" step="0.01" placeholder="mín" className="text-xs"
              value={(dados.cargas as any)[mn]} onChange={e=>onCarga(mn,e.target.value)} />
            <Input type="number" step="0.01" placeholder="máx" className="text-xs"
              value={(dados.cargas as any)[mx]} onChange={e=>onCarga(mx,e.target.value)} />
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-20 flex-shrink-0">Velocidade</span>
          <Input type="number" step="0.01" placeholder="mín" className="text-xs"
            value={dados.cargas.velocidade_min} onChange={e=>onCarga('velocidade_min',e.target.value)} />
        </div>
      </div>
    </div>
  );
}

/* ══ PÁGINA PRINCIPAL ════════════════════════════════════ */
export default function ForcaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [aval, setAval] = useState<any>(null);
  const [pesoCorporalBase, setPesoCorporalBase] = useState<number | null>(null);

  // Preensão
  const [tipo_avaliacao, setTipoAval] = useState('clinica');
  const [populacao_ref, setPopRef]    = useState('geral');
  const [esporte_contexto, setEsporteContexto] = useState('saude_geral');
  const [finalidade_teste, setFinalidadeTeste] = useState('triagem');
  const [lado_dominante, setLadoDominante] = useState('direito');
  const [preensao_dir, setPreDir]     = useState('');
  const [preensao_esq, setPreEsq]     = useState('');

  // Dinamometria
  const [modeloDinamometria, setModeloDinamometria] = useState<'medeor'|'tracao'>('medeor');
  const [spTestes,    setSPTestes]    = useState<SPTechTeste[]>([]);
  const [spRelacoes,  setSPRelacoes]  = useState<SPTechRelacao[]>([]);
  const [tracaoTestes, setTracaoTestes] = useState<TracaoTeste[]>([]);
  const [expandidos,  setExpandidos]  = useState<Record<number,boolean>>({});

  // Algometria
  const [temAlgometria, setTemAlgometria] = useState(false);
  const [algPontos, setAlgPontos]         = useState<AlgometriaPonto[]>([]);

  // Outros testes
  const [testes, setTestes] = useState<TesteSimplesItem[]>([]);

  useEffect(()=>{(async()=>{
    const { data: av } = await supabase.from('avaliacoes')
      .select('*, pacientes(*)').eq('id', params.id).single();
    setAval(av);
    const base = await buscarDadosCorporaisBase(params.id, av?.pacientes as any);
    setPesoCorporalBase(base.pesoKg);
    const d = await buscarModulo('forca', params.id);
    if (d) {
      setTipoAval(d.tipo_avaliacao ?? 'clinica');
      setPopRef(d.populacao_ref ?? 'geral');
      setEsporteContexto(d.esporte_contexto ?? 'saude_geral');
      setFinalidadeTeste(d.finalidade_teste ?? 'triagem');
      setLadoDominante(d.lado_dominante ?? 'direito');
      setPreDir(d.preensao_dir_kgf?.toString() ?? '');
      setPreEsq(d.preensao_esq_kgf?.toString() ?? '');
      setModeloDinamometria(d.modelo_dinamometria ?? 'medeor');
      setSPTestes((d.sptech_testes?.length ? d.sptech_testes : testesPredefinidos()));
      setSPRelacoes(d.sptech_relacoes ?? []);
      setTracaoTestes((d.tracao_testes ?? []).map((t:TracaoTeste)=>recalcTracao({
        ...t,
        peso_corporal_kg: t.peso_corporal_kg || (base.pesoKg?.toString() ?? ''),
      })));
      setTemAlgometria(d.tem_algometria ?? false);
      setAlgPontos(d.algometria ?? []);
      setTestes(d.testes ?? []);
    } else {
      setSPTestes(testesPredefinidos());
    }
  })();}, [params.id, supabase]);

  const autoSaveValue = {
    tipo_avaliacao, populacao_ref, esporte_contexto, finalidade_teste, lado_dominante, preensao_dir, preensao_esq,
    modeloDinamometria, spTestes, spRelacoes, tracaoTestes, temAlgometria, algPontos, testes,
  };

  const saving = useAutoSave(autoSaveValue, async (v)=>{
    const dir = parseFloat(v.preensao_dir)||null;
    const esq = parseFloat(v.preensao_esq)||null;
    const peso = pesoCorporalBase ?? 75;
    return upsertModulo('forca', params.id, {
      tipo_avaliacao: v.tipo_avaliacao, populacao_ref: v.populacao_ref,
      esporte_contexto: v.esporte_contexto,
      finalidade_teste: v.finalidade_teste,
      lado_dominante: v.lado_dominante,
      preensao_dir_kgf: dir, preensao_esq_kgf: esq,
      forca_relativa_dir: dir&&peso ? +(dir/peso).toFixed(3) : null,
      forca_relativa_esq: esq&&peso ? +(esq/peso).toFixed(3) : null,
      assimetria_percent: dir&&esq
        ? +((Math.abs(dir-esq)/Math.max(dir,esq))*100).toFixed(2) : null,
      modelo_dinamometria: v.modeloDinamometria,
      sptech_testes: v.spTestes.filter(temMedidaSPTech),
      sptech_relacoes: v.spRelacoes,
      tracao_testes: v.tracaoTestes,
      tem_algometria: v.temAlgometria,
      algometria: v.algPontos,
      testes: v.testes.filter(t=>t.nome),
    });
  }, 2000);

  const tracaoRelacoesAuto = modeloDinamometria === 'tracao'
    ? relacoesTracaoCalculadas(tracaoTestes)
    : [];
  const spTechRelacoesAuto = modeloDinamometria === 'medeor'
    ? relacoesSPTechCalculadas(spTestes)
    : [];

  /* ── helpers dinamometria ── */
  function addTeste() {
    setSPTestes(t=>[...t, testeVazio()]);
    setExpandidos(e=>({...e, [spTestes.length]: true}));
  }
  function rmTeste(i:number) {
    setSPTestes(t=>t.filter((_,j)=>j!==i));
    setExpandidos(e=>{ const n={...e}; delete n[i]; return n; });
  }
  function updTeste(i:number, field:string, val:any) {
    setSPTestes(ts=>ts.map((t,j)=>{
      if(j!==i) return t;
      const novo = {...t, [field]: val};
      if(field==='articulacao'){
        const movs = MOVIMENTOS[val as string]??[];
        novo.movimento = movs[0]??'';
        novo.movimento_outra = '';
        novo.nome_outra = '';
      }
      return novo;
    }));
  }
  function updLado(i:number, lado:'lado_d'|'lado_e', field:string, val:string) {
    setSPTestes(ts=>ts.map((t,j)=>{
      if(j!==i) return t;
      const novoLado = {...t[lado], [field]: val};
      const novo = {...t, [lado]: novoLado};
      if(field==='kgf'){
        const d=parseFloat(lado==='lado_d'?val:t.lado_d.kgf)||0;
        const e=parseFloat(lado==='lado_e'?val:t.lado_e.kgf)||0;
        if(d&&e){
          const pct=Math.abs(d-e)/Math.max(d,e)*100;
          novo.assimetria_pct=pct.toFixed(1);
          novo.classificacao_assimetria=classAssimetria(pct);
        }
      }
      return novo;
    }));
  }
  function updCarga(i:number, lado:'lado_d'|'lado_e', campo:string, val:string) {
    setSPTestes(ts=>ts.map((t,j)=>j!==i?t:{
      ...t, [lado]:{...t[lado], cargas:{...t[lado].cargas, [campo]:val}},
    }));
  }

  function temDoisLados(t:SPTechTeste):boolean {
    if(t.articulacao==='Outra') return t.lateralidade==='bilateral';
    if(AXIAIS.has(t.articulacao)) return false;
    return true;
  }
  function ladoPrincipal(t:SPTechTeste):'lado_d'|'lado_e' {
    return t.articulacao==='Outra'&&t.lateralidade==='esquerdo' ? 'lado_e' : 'lado_d';
  }
  function corPainelUnico(t:SPTechTeste):string {
    if(AXIAIS.has(t.articulacao)) return 'border-slate-200 bg-slate-50/40';
    if(t.articulacao==='Outra'&&t.lateralidade==='esquerdo') return 'border-purple-200 bg-purple-50/40';
    return 'border-blue-200 bg-blue-50/40';
  }
  function tituloPainelUnico(t:SPTechTeste):string {
    if(AXIAIS.has(t.articulacao)) return 'Resultado';
    if(t.articulacao==='Outra'){
      if(t.lateralidade==='esquerdo') return 'Lado Esquerdo ▶';
      if(t.lateralidade==='direito')  return '◀ Lado Direito';
    }
    return 'Resultado';
  }

  function addTracaoTeste() {
    const novo = tracaoVazio();
    novo.peso_corporal_kg = pesoCorporalBase?.toString() ?? '';
    setTracaoTestes(t=>[...t, novo]);
  }
  function rmTracaoTeste(i:number) {
    setTracaoTestes(t=>t.filter((_,j)=>j!==i));
  }
  function updTracaoTeste(i:number, field:keyof TracaoTeste, val:string) {
    setTracaoTestes(ts=>ts.map((t,j)=>{
      if(j!==i) return t;
      if(field === 'teste'){
        const ref = TRACAO_REFERENCIAS.find(r=>r.key===val) ?? TRACAO_REFERENCIAS[0];
        return recalcTracao({
          ...t,
          teste: ref.key,
          musculo: ref.key === 'outro' ? '' : ref.musculo,
          exercicio_ref: ref.exercicio,
          fator: ref.fator.toString(),
        });
      }
      return recalcTracao({...t, [field]: val} as TracaoTeste);
    }));
  }
  function updTracaoLado(i:number, lado:'lado_d'|'lado_e', field:keyof TracaoLado, val:string) {
    setTracaoTestes(ts=>ts.map((t,j)=>j===i
      ? recalcTracao({...t, [lado]:{...t[lado], [field]:val}})
      : t
    ));
  }

  const corBadge = (c:string) =>
    c==='Leve'     ? 'bg-emerald-50 text-emerald-700' :
    c==='Moderada' ? 'bg-amber-50 text-amber-700'     : 'bg-red-50 text-red-700';

  if(!aval) return <p className="text-slate-500">Carregando…</p>;
  const steps = buildSteps(params.id, aval.modulos_selecionados);

  return (
    <div>
      <div className="max-w-4xl space-y-5 mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Força</h2>
          <SaveIndicator state={saving} />
        </div>

        {/* ══ PREENSÃO ══ */}
        <Card>
          <CardHeader><CardTitle>Preensão palmar (Jamar / Medeor)</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo de avaliação">
                <Select value={tipo_avaliacao} onChange={e=>setTipoAval(e.target.value)}>
                  <option value="clinica">Clínica</option>
                  <option value="esportiva">Esportiva</option>
                </Select>
              </Field>
              <Field label="Pop. referência">
                <Select value={populacao_ref} onChange={e=>setPopRef(e.target.value)}>
                  <option value="geral">Geral</option>
                  <option value="ativa">Ativa</option>
                  <option value="atleta">Atleta</option>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Esporte / contexto">
                <Select value={esporte_contexto} onChange={e=>setEsporteContexto(e.target.value)}>
                  {ESPORTES_FORCA.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Finalidade do teste">
                <Select value={finalidade_teste} onChange={e=>setFinalidadeTeste(e.target.value)}>
                  {FINALIDADES_FORCA.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Lado dominante">
                <Select value={lado_dominante} onChange={e=>setLadoDominante(e.target.value)}>
                  {LADOS_DOMINANTES.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Mão direita (kgf)">
                <Input type="number" step="0.1" value={preensao_dir}
                  onChange={e=>setPreDir(e.target.value)} />
              </Field>
              <Field label="Mão esquerda (kgf)">
                <Input type="number" step="0.1" value={preensao_esq}
                  onChange={e=>setPreEsq(e.target.value)} />
              </Field>
            </div>
            {preensao_dir && preensao_esq && (()=>{
              const d=parseFloat(preensao_dir), e=parseFloat(preensao_esq);
              return (
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  Assimetria: <b className="text-slate-800">
                    {(Math.abs(d-e)/Math.max(d,e)*100).toFixed(1)}%
                  </b>
                </div>
              );
            })()}
          </CardBody>
        </Card>

        {/* ══ DINAMOMETRIA ISOMÉTRICA ══ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dinamometria isométrica manual</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escolha o aparelho utilizado. O Medeor mantém articulações e movimentos; a tração calcula 1RM estimado, assimetria e RFD.
                </p>
              </div>
              {modeloDinamometria === 'medeor' ? (
                <Button size="sm" onClick={addTeste}>
                  <Plus className="w-3 h-3" /> Adicionar teste
                </Button>
              ) : (
                <Button size="sm" onClick={addTracaoTeste}>
                  <Plus className="w-3 h-3" /> Adicionar teste de tração
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {[
                ['medeor','Medeor / SPTech'],
                ['tracao','Tração'],
              ].map(([key,label])=>(
                <button key={key} type="button"
                  onClick={()=>setModeloDinamometria(key as 'medeor'|'tracao')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                    modeloDinamometria===key
                      ? 'bg-white text-brand-700 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {modeloDinamometria === 'medeor' && spTestes.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">
                Clique em &quot;Adicionar teste&quot; para selecionar articulação e movimento.
              </p>
            )}

            {modeloDinamometria === 'medeor' && spTestes.map((t,i)=>{
              const doisLados  = temDoisLados(t);
              const isOutra    = t.articulacao === 'Outra';
              const isAxial    = AXIAIS.has(t.articulacao);
              const ladoPrinc  = ladoPrincipal(t);

              return (
                <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">

                  {/* Header colapsável */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer select-none"
                    onClick={()=>setExpandidos(e=>({...e,[i]:!e[i]}))}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm">{rotuloTeste(t)}</span>
                      {t.assimetria_pct && doisLados && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${corBadge(t.classificacao_assimetria)}`}>
                          {t.assimetria_pct}% · {t.classificacao_assimetria}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost"
                        onClick={e=>{e.stopPropagation();rmTeste(i);}} title="Remover">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                      {expandidos[i]
                        ? <ChevronUp className="w-4 h-4 text-slate-400"/>
                        : <ChevronDown className="w-4 h-4 text-slate-400"/>}
                    </div>
                  </div>

                  {expandidos[i] && (
                    <div className="p-4 space-y-4">

                      {/* Seleção articulação + movimento */}
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Articulação">
                          <Select value={t.articulacao}
                            onChange={e=>updTeste(i,'articulacao',e.target.value)}>
                            {ARTICULACOES.map(a=>(
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </Select>
                        </Field>

                        {isOutra ? (
                          <Field label="Nome da articulação">
                            <Input value={t.nome_outra}
                              placeholder="Ex: Escalenos, Iliopsoas…"
                              onChange={e=>updTeste(i,'nome_outra',e.target.value)}/>
                          </Field>
                        ) : (
                          <Field label="Movimento">
                            <Select value={t.movimento}
                              onChange={e=>updTeste(i,'movimento',e.target.value)}>
                              {(MOVIMENTOS[t.articulacao]??[]).map(m=>(
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </Select>
                          </Field>
                        )}
                      </div>

                      {/* Campos extras para "Outra" */}
                      {isOutra && (
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Movimento / descrição">
                            <Input value={t.movimento_outra}
                              placeholder="Ex: Rotação, Abdução…"
                              onChange={e=>updTeste(i,'movimento_outra',e.target.value)}/>
                          </Field>
                          <Field label="Lateralidade">
                            <Select value={t.lateralidade}
                              onChange={e=>updTeste(i,'lateralidade',e.target.value as any)}>
                              <option value="bilateral">Bilateral</option>
                              <option value="direito">Apenas Direito</option>
                              <option value="esquerdo">Apenas Esquerdo</option>
                            </Select>
                          </Field>
                        </div>
                      )}

                      {/* Informativo para articulações axiais */}
                      {isAxial && (
                        <p className="text-xs text-slate-400 italic">
                          Articulação axial - resultado único (bilateral).
                        </p>
                      )}

                      {/* Painéis D + E ou único */}
                      {doisLados ? (
                        <div className="grid grid-cols-2 gap-4">
                          <PainelLado lado="lado_d" dados={t.lado_d}
                            cor="border-blue-200 bg-blue-50/40" titulo="◀ Lado Direito"
                            onChange={(f,v)=>updLado(i,'lado_d',f,v)}
                            onCarga={(c,v)=>updCarga(i,'lado_d',c,v)} />
                          <PainelLado lado="lado_e" dados={t.lado_e}
                            cor="border-purple-200 bg-purple-50/40" titulo="Lado Esquerdo ▶"
                            onChange={(f,v)=>updLado(i,'lado_e',f,v)}
                            onCarga={(c,v)=>updCarga(i,'lado_e',c,v)} />
                        </div>
                      ) : (
                        <PainelLado
                          lado={ladoPrinc} dados={t[ladoPrinc]}
                          cor={corPainelUnico(t)} titulo={tituloPainelUnico(t)}
                          onChange={(f,v)=>updLado(i,ladoPrinc,f,v)}
                          onCarga={(c,v)=>updCarga(i,ladoPrinc,c,v)} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {modeloDinamometria === 'tracao' && tracaoTestes.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                <p className="text-sm text-slate-500">Adicione os testes de tração que serão avaliados.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Formula usada: 1RM estimado = FIM (kgf) x fator. RFD = (FIM - forca inicial) / tempo ate pico.
                </p>
              </div>
            )}

            {modeloDinamometria === 'tracao' && tracaoTestes.map((t,i)=>(
              <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-slate-50">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{rotuloTracao(t)}</span>
                    {t.assimetria_pct && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${corBadge(t.classificacao_assimetria)}`}>
                        Assimetria {t.assimetria_pct}% · {t.classificacao_assimetria}
                      </span>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={()=>rmTracaoTeste(i)} title="Remover">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <Field label="Modo de coleta">
                      <Select value={t.modo_coleta ?? 'manual'} onChange={e=>updTracaoTeste(i,'modo_coleta',e.target.value as any)}>
                        <option value="manual">Manual</option>
                        <option value="bluetooth">Bluetooth WHC-06</option>
                      </Select>
                    </Field>
                    <Field label="Teste DIM">
                      <Select value={t.teste} onChange={e=>updTracaoTeste(i,'teste',e.target.value)}>
                        {TRACAO_REFERENCIAS.map(r=><option key={r.key} value={r.key}>{r.musculo}</option>)}
                      </Select>
                    </Field>
                    <Field label="Músculo / teste">
                      <Input value={t.musculo} onChange={e=>updTracaoTeste(i,'musculo',e.target.value)} />
                    </Field>
                    <Field label="Exercício dinâmico de referência">
                      <Input value={t.exercicio_ref} onChange={e=>updTracaoTeste(i,'exercicio_ref',e.target.value)} />
                    </Field>
                    <Field label="Fator operacional">
                      <Input type="number" step="0.01" min="0" value={t.fator}
                        onChange={e=>updTracaoTeste(i,'fator',e.target.value)} />
                    </Field>
                    <Field label="Peso corporal (kg)">
                      <Input type="number" step="0.1" value={t.peso_corporal_kg ?? ''}
                        onChange={e=>updTracaoTeste(i,'peso_corporal_kg',e.target.value)} />
                    </Field>
                    <Field label="Numero de tentativas">
                      <Input type="number" step="1" min="0" value={t.numero_tentativas ?? ''}
                        onChange={e=>updTracaoTeste(i,'numero_tentativas',e.target.value)} />
                    </Field>
                    <Field label="FIM das tentativas (kgf)">
                      <Input value={t.tentativas_fim_kgf ?? ''} placeholder="Ex: 42, 44, 43"
                        onChange={e=>updTracaoTeste(i,'tentativas_fim_kgf',e.target.value)} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ['lado_d','◀ Lado Direito','#2563eb'],
                      ['lado_e','Lado Esquerdo ▶','#7c3aed'],
                    ].map(([lado,titulo,cor])=>{
                      const dados = t[lado as 'lado_d'|'lado_e'];
                      return (
                        <div key={lado} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                          <div className="text-xs font-semibold mb-3" style={{color:cor}}>{titulo}</div>
                          <div className="grid grid-cols-2 gap-2">
                            <Field label="FIM (kgf)">
                              <Input type="number" step="0.1" value={dados.fim_kgf}
                                onChange={e=>updTracaoLado(i,lado as 'lado_d'|'lado_e','fim_kgf',e.target.value)} />
                            </Field>
                            <Field label="Forca inicial (kgf)">
                              <Input type="number" step="0.1" value={dados.forca_inicial_kgf ?? ''}
                                onChange={e=>updTracaoLado(i,lado as 'lado_d'|'lado_e','forca_inicial_kgf',e.target.value)} />
                            </Field>
                            <Field label="Tempo ate pico (ms ou s)">
                              <Input type="number" step="0.01" placeholder="Ex: 300 ms ou 0.3 s" value={dados.tempo_ms}
                                onChange={e=>updTracaoLado(i,lado as 'lado_d'|'lado_e','tempo_ms',e.target.value)} />
                              <p className="mt-1 text-[10px] leading-tight text-slate-400">
                                Menor que 20 = segundos. 20 ou mais = milissegundos.
                              </p>
                            </Field>
                            <Field label="Forca aos 50 ms (kgf)">
                              <Input type="number" step="0.1" value={dados.forca_50ms_kgf ?? ''}
                                onChange={e=>updTracaoLado(i,lado as 'lado_d'|'lado_e','forca_50ms_kgf',e.target.value)} />
                            </Field>
                            <Field label="Forca aos 100 ms (kgf)">
                              <Input type="number" step="0.1" value={dados.forca_100ms_kgf ?? ''}
                                onChange={e=>updTracaoLado(i,lado as 'lado_d'|'lado_e','forca_100ms_kgf',e.target.value)} />
                            </Field>
                            <Field label="Forca aos 200 ms (kgf)">
                              <Input type="number" step="0.1" value={dados.forca_200ms_kgf ?? ''}
                                onChange={e=>updTracaoLado(i,lado as 'lado_d'|'lado_e','forca_200ms_kgf',e.target.value)} />
                            </Field>
                            <Field label="Impulso (kgf.s)">
                              <Input type="number" step="0.01" value={dados.impulso_kgf_s ?? ''}
                                onChange={e=>updTracaoLado(i,lado as 'lado_d'|'lado_e','impulso_kgf_s',e.target.value)} />
                            </Field>
                            <Field label="Sustentacao >=80% FIM (s)">
                              <Input type="number" step="0.01" value={dados.sustentacao_80_s ?? ''}
                                onChange={e=>updTracaoLado(i,lado as 'lado_d'|'lado_e','sustentacao_80_s',e.target.value)} />
                            </Field>
                            <Field label="Duracao da contracao (s)">
                              <Input type="number" step="0.01" value={dados.duracao_s ?? ''}
                                onChange={e=>updTracaoLado(i,lado as 'lado_d'|'lado_e','duracao_s',e.target.value)} />
                            </Field>
                            <div className="rounded-lg bg-white border border-slate-200 p-3">
                              <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">FIM em Newton</div>
                              <div className="text-lg font-bold text-slate-800">{dados.fim_n || '-'} <span className="text-xs text-slate-400">N</span></div>
                            </div>
                            <div className="rounded-lg bg-white border border-slate-200 p-3">
                              <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">1RM estimado</div>
                              <div className="text-lg font-bold text-slate-800">{dados.rm1_kg || '-'} <span className="text-xs text-slate-400">kg</span></div>
                            </div>
                            <div className="rounded-lg bg-white border border-slate-200 p-3">
                              <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Forca relativa</div>
                              <div className="text-lg font-bold text-slate-800">{dados.forca_relativa_kgf_kg || '-'} <span className="text-xs text-slate-400">kgf/kg</span></div>
                            </div>
                            <div className="rounded-lg bg-white border border-slate-200 p-3">
                              <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">RFD global</div>
                              <div className="text-lg font-bold text-slate-800 whitespace-nowrap">{dados.rfd_kgf_s || '-'} <span className="text-xs text-slate-400">kgf/s</span></div>
                            </div>
                            <div className="rounded-lg bg-white border border-slate-200 p-3 col-span-2">
                              <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-2">RFD por janela</div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="whitespace-nowrap"><span className="text-slate-400">0-50 ms</span><br/><b>{dados.rfd_50_kgf_s || '-'}</b> kgf/s</div>
                                <div className="whitespace-nowrap"><span className="text-slate-400">0-100 ms</span><br/><b>{dados.rfd_100_kgf_s || '-'}</b> kgf/s</div>
                                <div className="whitespace-nowrap"><span className="text-slate-400">0-200 ms</span><br/><b>{dados.rfd_200_kgf_s || '-'}</b> kgf/s</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {[
                      ['Media tentativas', t.media_tentativas_kgf, 'kgf'],
                      ['Fadiga', t.indice_fadiga_pct, '%'],
                      ['LSI', t.lsi_pct, '%'],
                      ['Assimetria', t.assimetria_pct, '%'],
                      ['Delta absoluto', t.diferenca_abs_kgf, 'kgf'],
                    ].map(([label, valor, unidade]) => (
                      <div key={label} className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                        <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
                        <div className="text-lg font-bold text-slate-800">
                          {valor || '-'} <span className="text-xs text-slate-400">{unidade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Field label="Observações">
                    <Input value={t.observacoes} placeholder="Comentário clínico sobre este teste"
                      onChange={e=>updTracaoTeste(i,'observacoes',e.target.value)} />
                  </Field>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* ══ RELAÇÕES MUSCULARES ══ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Relações musculares</CardTitle>
              <Button size="sm" variant="secondary"
                onClick={()=>setSPRelacoes(r=>[...r,{descricao:'',percentual:''}])}>
                <Plus className="w-3 h-3"/> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            <p className="text-xs text-slate-500">
              Relações agonista/antagonista - ex: Flexão/Extensão joelho E
            </p>
            {modeloDinamometria === 'medeor' && spTechRelacoesAuto.length > 0 && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                  Relacoes calculadas automaticamente pelo Medeor/SPTech
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {spTechRelacoesAuto.map((relacao, i) => (
                    <div key={`${relacao.nome}-${relacao.lado}-${i}`} className="rounded-lg border border-blue-200 bg-white px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{relacao.nome}</div>
                          <div className="text-[11px] text-slate-500">{relacao.lado} - {relacao.descricao}</div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            {relacao.numerador} / {relacao.denominador}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{relacao.percentual}%</div>
                          <div className="text-[10px] uppercase tracking-wide text-slate-400">{relacao.unidade}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {modeloDinamometria === 'tracao' && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  Relações calculadas automaticamente pela tração
                </div>
                {tracaoRelacoesAuto.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Preencha os testes equivalentes para calcular automaticamente as relações: isquiotibiais/quadríceps,
                    tríceps/bíceps, puxar/empurrar, RE/RI de ombro, flexão/extensão de ombro e abdução/adução de ombro.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {tracaoRelacoesAuto.map((relacao, i) => (
                      <div key={`${relacao.nome}-${relacao.lado}-${i}`} className="rounded-lg border border-emerald-200 bg-white px-3 py-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{relacao.nome}</div>
                            <div className="text-[11px] text-slate-500">{relacao.lado} · {relacao.descricao}</div>
                            <div className="mt-1 text-[11px] text-slate-400">
                              {relacao.numerador} ÷ {relacao.denominador}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-600">{relacao.percentual}%</div>
                            <div className="text-[10px] uppercase tracking-wide text-slate-400">FIM kgf</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {spRelacoes.length===0 && (
              <p className="text-xs text-slate-400">
                {modeloDinamometria === 'tracao'
                  ? 'Nenhuma relação manual cadastrada.'
                  : 'Nenhuma relação cadastrada.'}
              </p>
            )}
            {spRelacoes.map((r,i)=>(
              <div key={i} className="flex gap-2 items-center">
                <Input value={r.descricao}
                  placeholder="Descrição"
                  onChange={e=>setSPRelacoes(rs=>rs.map((x,j)=>j===i?{...x,descricao:e.target.value}:x))}
                  className="flex-1"/>
                <Input type="number" step="0.1" value={r.percentual} placeholder="%"
                  onChange={e=>setSPRelacoes(rs=>rs.map((x,j)=>j===i?{...x,percentual:e.target.value}:x))}
                  className="w-20"/>
                <span className="text-slate-400 text-sm">%</span>
                <Button size="sm" variant="ghost"
                  onClick={()=>setSPRelacoes(rs=>rs.filter((_,j)=>j!==i))}>
                  <Trash2 className="w-3 h-3 text-red-400"/>
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* ══ ALGOMETRIA (opcional) ══ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-brand-600"/>
                  Algometria (SP Tech)
                </CardTitle>
                <span className="text-xs text-slate-400 italic">opcional</span>
              </div>
              {/* Toggle */}
              <button type="button"
                onClick={()=>{
                  setTemAlgometria(v=>!v);
                  if(!temAlgometria && algPontos.length===0) setAlgPontos([algVazio()]);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${temAlgometria?'bg-brand-600':'bg-slate-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                  ${temAlgometria?'translate-x-6':'translate-x-1'}`}/>
              </button>
            </div>
          </CardHeader>

          {temAlgometria && (
            <CardBody className="space-y-3">
              <p className="text-xs text-slate-500">
                Limiar de dor à pressão (PPT) por segmento. Cada ponto pode ser editado ou removido.
              </p>
              {algPontos.map((p,i)=>(
                <div key={i} className="flex items-center gap-2 group">
                  <span className="text-xs text-slate-400 w-5 text-right font-mono flex-shrink-0">{i+1}.</span>
                  <Input value={p.segmento}
                    placeholder="Segmento (ex: Trapézio superior, L4–L5, Masseter…)"
                    onChange={e=>setAlgPontos(ap=>ap.map((x,j)=>j===i?{...x,segmento:e.target.value}:x))}
                    className="flex-1"/>
                  <Select value={p.lado}
                    onChange={e=>setAlgPontos(ap=>ap.map((x,j)=>j===i?{...x,lado:e.target.value as any}:x))}
                    className="w-32 flex-shrink-0">
                    <option value="sem_lado">Sem lado</option>
                    <option value="direito">Direito</option>
                    <option value="esquerdo">Esquerdo</option>
                  </Select>
                  <div className="flex items-center gap-1 flex-shrink-0 w-28">
                    <Input type="number" step="0.1" value={p.valor_kgf}
                      placeholder="kgf"
                      onChange={e=>setAlgPontos(ap=>ap.map((x,j)=>j===i?{...x,valor_kgf:e.target.value}:x))}
                      className="text-sm"/>
                    <span className="text-xs text-slate-400 flex-shrink-0">kgf</span>
                  </div>
                  <Input value={p.observacao}
                    placeholder="Obs."
                    onChange={e=>setAlgPontos(ap=>ap.map((x,j)=>j===i?{...x,observacao:e.target.value}:x))}
                    className="w-36"/>
                  <button onClick={()=>setAlgPontos(ap=>ap.filter((_,j)=>j!==i))}
                    className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              ))}
              <Button size="sm" variant="secondary" onClick={()=>setAlgPontos(p=>[...p,algVazio()])}>
                <Plus className="w-3 h-3"/> Adicionar ponto
              </Button>
            </CardBody>
          )}
        </Card>

        {/* ══ OUTROS TESTES ══ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Outros testes</CardTitle>
              <Button size="sm" variant="secondary"
                onClick={()=>setTestes(t=>[...t,{nome:'',valor:'',unidade:'rep'}])}>
                <Plus className="w-3 h-3"/> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            {testes.length===0 && (
              <p className="text-xs text-slate-400">Nenhum teste adicional cadastrado.</p>
            )}
            {testes.map((t,i)=>(
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <Input value={t.nome} placeholder="Nome do teste"
                    onChange={e=>setTestes(ts=>ts.map((x,j)=>j===i?{...x,nome:e.target.value}:x))}/>
                </div>
                <div className="col-span-3">
                  <Input type="number" value={t.valor}
                    onChange={e=>setTestes(ts=>ts.map((x,j)=>j===i?{...x,valor:e.target.value}:x))}/>
                </div>
                <div className="col-span-3">
                  <Select value={t.unidade}
                    onChange={e=>setTestes(ts=>ts.map((x,j)=>j===i?{...x,unidade:e.target.value}:x))}>
                    <option value="rep">rep</option>
                    <option value="kg">kg</option>
                    <option value="kgf">kgf</option>
                    <option value="seg">seg</option>
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Button size="sm" variant="ghost"
                    onClick={()=>setTestes(ts=>ts.filter((_,j)=>j!==i))}>
                    <Trash2 className="w-3 h-3 text-red-400"/>
                  </Button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Navegação */}
        <div className="flex justify-end">
          <Button onClick={()=>{
            const st = buildSteps(params.id, aval.modulos_selecionados);
            const nx = st.find(s=>s.key==='rml')
              ?? st.find(s=>s.key==='cardiorrespiratorio')
              ?? st.find(s=>s.key==='biomecanica');
            router.push(nx?.href ?? `/avaliacoes/${params.id}/revisao`);
          }}>
            Continuar →
          </Button>
        </div>
      </div>
    </div>
  );
}
