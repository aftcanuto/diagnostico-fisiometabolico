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
interface TracaoLado {
  fim_kgf: string;
  tempo_ms: string;
  rm1_kg: string;
  rfd_kgf_s: string;
}
interface TracaoTeste {
  teste: string;
  musculo: string;
  exercicio_ref: string;
  fator: string;
  lado_d: TracaoLado;
  lado_e: TracaoLado;
  assimetria_pct: string;
  classificacao_assimetria: string;
  observacoes: string;
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

const algVazio = (): AlgometriaPonto => ({
  segmento:'', lado:'sem_lado', valor_kgf:'', observacao:'',
});

const tracaoLadoVazio = (): TracaoLado => ({
  fim_kgf:'', tempo_ms:'', rm1_kg:'', rfd_kgf_s:'',
});

const tracaoVazio = (): TracaoTeste => {
  const ref = TRACAO_REFERENCIAS[0];
  return {
    teste: ref.key,
    musculo: ref.musculo,
    exercicio_ref: ref.exercicio,
    fator: ref.fator.toString(),
    lado_d: tracaoLadoVazio(),
    lado_e: tracaoLadoVazio(),
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

function recalcTracao(t: TracaoTeste): TracaoTeste {
  const fator = parseFloat(t.fator) || 0;
  const calcLado = (lado: TracaoLado): TracaoLado => {
    const fim = parseFloat(lado.fim_kgf) || 0;
    const tempoS = (parseFloat(lado.tempo_ms) || 0) / 1000;
    return {
      ...lado,
      rm1_kg: fim && fator ? (fim * fator).toFixed(1) : '',
      rfd_kgf_s: fim && tempoS ? (fim / tempoS).toFixed(1) : '',
    };
  };
  const lado_d = calcLado(t.lado_d);
  const lado_e = calcLado(t.lado_e);
  const d = parseFloat(lado_d.fim_kgf) || 0;
  const e = parseFloat(lado_e.fim_kgf) || 0;
  const assim = d && e ? (Math.abs(d - e) / Math.max(d, e)) * 100 : null;
  return {
    ...t,
    lado_d,
    lado_e,
    assimetria_pct: assim == null ? '' : assim.toFixed(1),
    classificacao_assimetria: assim == null ? 'Leve' : classAssimetria(assim),
  };
}

function rotuloTracao(t: TracaoTeste) {
  return t.musculo || TRACAO_REFERENCIAS.find(r=>r.key===t.teste)?.musculo || 'Teste de tração';
}

function rotuloTeste(t: SPTechTeste): string {
  const art = t.articulacao === 'Outra' ? (t.nome_outra || 'Outra') : t.articulacao;
  const mov = t.articulacao === 'Outra' ? (t.movimento_outra || '—') : t.movimento;
  const lat = t.articulacao === 'Outra'
    ? ({bilateral:'Bilateral',direito:'Direito',esquerdo:'Esquerdo'} as any)[t.lateralidade]
    : AXIAIS.has(t.articulacao) ? 'Bilateral' : '';
  return `${art} — ${mov}${lat ? ` (${lat})` : ''}`;
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

  // Preensão
  const [tipo_avaliacao, setTipoAval] = useState('clinica');
  const [populacao_ref, setPopRef]    = useState('geral');
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
    const d = await buscarModulo('forca', params.id);
    if (d) {
      setTipoAval(d.tipo_avaliacao ?? 'clinica');
      setPopRef(d.populacao_ref ?? 'geral');
      setPreDir(d.preensao_dir_kgf?.toString() ?? '');
      setPreEsq(d.preensao_esq_kgf?.toString() ?? '');
      setModeloDinamometria(d.modelo_dinamometria ?? 'medeor');
      setSPTestes(d.sptech_testes ?? []);
      setSPRelacoes(d.sptech_relacoes ?? []);
      setTracaoTestes((d.tracao_testes ?? []).map((t:TracaoTeste)=>recalcTracao(t)));
      setTemAlgometria(d.tem_algometria ?? false);
      setAlgPontos(d.algometria ?? []);
      setTestes(d.testes ?? []);
    }
  })();}, [params.id, supabase]);

  const autoSaveValue = {
    tipo_avaliacao, populacao_ref, preensao_dir, preensao_esq,
    modeloDinamometria, spTestes, spRelacoes, tracaoTestes, temAlgometria, algPontos, testes,
  };

  const saving = useAutoSave(autoSaveValue, async (v)=>{
    const dir = parseFloat(v.preensao_dir)||null;
    const esq = parseFloat(v.preensao_esq)||null;
    const peso = aval?.pacientes?.peso ?? 75;
    return upsertModulo('forca', params.id, {
      tipo_avaliacao: v.tipo_avaliacao, populacao_ref: v.populacao_ref,
      preensao_dir_kgf: dir, preensao_esq_kgf: esq,
      forca_relativa_dir: dir&&peso ? +(dir/peso).toFixed(3) : null,
      forca_relativa_esq: esq&&peso ? +(esq/peso).toFixed(3) : null,
      assimetria_percent: dir&&esq
        ? +((Math.abs(dir-esq)/Math.max(dir,esq))*100).toFixed(2) : null,
      modelo_dinamometria: v.modeloDinamometria,
      sptech_testes: v.spTestes,
      sptech_relacoes: v.spRelacoes,
      tracao_testes: v.tracaoTestes,
      tem_algometria: v.temAlgometria,
      algometria: v.algPontos,
      testes: v.testes.filter(t=>t.nome),
    });
  }, 2000);

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
    setTracaoTestes(t=>[...t, tracaoVazio()]);
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
      return recalcTracao({...t, [field]: val});
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
                          Articulação axial — resultado único (bilateral).
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
                  Fórmula usada: 1RM estimado = FIM (kgf) × fator. RFD = FIM / tempo até pico.
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
                            <Field label="Tempo até pico (ms)">
                              <Input type="number" step="1" value={dados.tempo_ms}
                                onChange={e=>updTracaoLado(i,lado as 'lado_d'|'lado_e','tempo_ms',e.target.value)} />
                            </Field>
                            <div className="rounded-lg bg-white border border-slate-200 p-3">
                              <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">1RM estimado</div>
                              <div className="text-lg font-bold text-slate-800">{dados.rm1_kg || '—'} <span className="text-xs text-slate-400">kg</span></div>
                            </div>
                            <div className="rounded-lg bg-white border border-slate-200 p-3">
                              <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">RFD</div>
                              <div className="text-lg font-bold text-slate-800">{dados.rfd_kgf_s || '—'} <span className="text-xs text-slate-400">kgf/s</span></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
              Relações agonista/antagonista — ex: Flexão/Extensão joelho E
            </p>
            {spRelacoes.length===0 && (
              <p className="text-xs text-slate-400">Nenhuma relação cadastrada.</p>
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
