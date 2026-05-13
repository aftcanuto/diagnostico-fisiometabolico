'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { calcularPlanoAlimentar, referenciasNutricionais } from '@/lib/nutrition/planoAlimentar';
import { ClipboardCheck, Plus, Save, Trash2, Utensils } from 'lucide-react';

const OBJETIVOS = [
  ['emagrecimento', 'Emagrecimento'],
  ['recomposicao', 'Recomposicao corporal'],
  ['corrida', 'Corrida'],
  ['hipertrofia', 'Hipertrofia'],
  ['dor', 'Dor'],
  ['performance', 'Performance'],
  ['saude', 'Saude'],
  ['personalizado', 'Personalizado'],
];

const AREAS = [
  ['composicao_corporal', 'Composicao corporal'],
  ['forca', 'Forca'],
  ['flexibilidade', 'Flexibilidade'],
  ['cardiorrespiratorio', 'Cardiorrespiratorio'],
  ['rml', 'RML'],
  ['postura', 'Postura'],
  ['biomecanica', 'Biomecanica'],
];

const ACAO_VAZIO = {
  objetivo: 'personalizado',
  nome: '',
  descricao: '',
  prioridades: '',
  metas_30_dias: '',
  metas_60_dias: '',
  metas_90_dias: '',
  recomendacoes: {},
  alertas_encaminhamento: '',
  ativo: true,
  padrao: false,
};

const ALIMENTAR_VAZIO = {
  objetivo: 'personalizado',
  nome: '',
  descricao: '',
  fator_atividade: 1.4,
  ajuste_calorico_kcal: 0,
  proteina_g_kg: 1.6,
  gordura_pct: 30,
  agua_ml_kg: 35,
  fibras_g: 25,
  refeicoes: [],
  observacoes: '',
  referencias: referenciasNutricionais.join('\n'),
  ativo: true,
  padrao: false,
};

export function PlanosTemplatesPanel({ clinicaId }: { clinicaId: string }) {
  return (
    <div className="space-y-6">
      <PlanoAcaoModelosPanel clinicaId={clinicaId} />
      <PlanoAlimentarModelosPanel clinicaId={clinicaId} />
    </div>
  );
}

function PlanoAcaoModelosPanel({ clinicaId }: { clinicaId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [modelos, setModelos] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<any>(ACAO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('plano_acao_modelos')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('objetivo')
      .order('padrao', { ascending: false })
      .order('nome');
    setErro(error?.message ?? null);
    setModelos(data ?? []);
  }, [clinicaId, supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    const payload = { ...selecionado, clinica_id: clinicaId };
    const query = selecionado.id
      ? supabase.from('plano_acao_modelos').update(payload).eq('id', selecionado.id)
      : supabase.from('plano_acao_modelos').insert(payload);
    const { error } = await query;
    setSalvando(false);
    if (error) return setErro(error.message);
    setSelecionado(ACAO_VAZIO);
    carregar();
  }

  async function excluir() {
    if (!selecionado.id || !confirm('Excluir este modelo de plano de acao?')) return;
    const { error } = await supabase.from('plano_acao_modelos').delete().eq('id', selecionado.id);
    if (error) return setErro(error.message);
    setSelecionado(ACAO_VAZIO);
    carregar();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle><ClipboardCheck className="inline h-4 w-4 mr-1 text-brand-600" /> Modelos de plano de acao</CardTitle>
      </CardHeader>
      <CardBody className="grid gap-5 lg:grid-cols-[280px,1fr]">
        <ListaModelos modelos={modelos} selecionado={selecionado} vazio={ACAO_VAZIO} onNovo={setSelecionado} onSelect={setSelecionado} />
        <div className="space-y-4">
          {erro && <MensagemErro texto={erro} />}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Objetivo">
              <Select value={selecionado.objetivo} onChange={e => setSelecionado((s: any) => ({ ...s, objetivo: e.target.value }))}>
                {OBJETIVOS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </Select>
            </Field>
            <Field label="Nome do modelo">
              <Input value={selecionado.nome ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, nome: e.target.value }))} />
            </Field>
          </div>
          <Field label="Descricao"><Input value={selecionado.descricao ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, descricao: e.target.value }))} /></Field>
          <Field label="Prioridades clinicas"><Textarea value={selecionado.prioridades ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, prioridades: e.target.value }))} /></Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Metas de 30 dias"><Textarea value={selecionado.metas_30_dias ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, metas_30_dias: e.target.value }))} /></Field>
            <Field label="Metas de 60 dias"><Textarea value={selecionado.metas_60_dias ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, metas_60_dias: e.target.value }))} /></Field>
            <Field label="Metas de 90 dias"><Textarea value={selecionado.metas_90_dias ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, metas_90_dias: e.target.value }))} /></Field>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {AREAS.map(([key, label]) => (
              <Field key={key} label={label}>
                <Textarea
                  value={selecionado.recomendacoes?.[key] ?? ''}
                  onChange={e => setSelecionado((s: any) => ({ ...s, recomendacoes: { ...(s.recomendacoes ?? {}), [key]: e.target.value } }))}
                />
              </Field>
            ))}
          </div>
          <Field label="Alertas de encaminhamento"><Textarea value={selecionado.alertas_encaminhamento ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, alertas_encaminhamento: e.target.value }))} /></Field>
          <AcoesFormulario selecionado={selecionado} setSelecionado={setSelecionado} salvando={salvando} salvar={salvar} excluir={excluir} disabled={!selecionado.nome} />
        </div>
      </CardBody>
    </Card>
  );
}

function PlanoAlimentarModelosPanel({ clinicaId }: { clinicaId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [modelos, setModelos] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<any>(ALIMENTAR_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const exemplo = calcularPlanoAlimentar(
    { sexo: 'M', idade: 35, pesoKg: 76, alturaCm: 170, tmbBioimpedancia: 1650 },
    selecionado
  );

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('plano_alimentar_modelos')
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('objetivo')
      .order('padrao', { ascending: false })
      .order('nome');
    setErro(error?.message ?? null);
    setModelos(data ?? []);
  }, [clinicaId, supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    const payload = { ...selecionado, clinica_id: clinicaId };
    const query = selecionado.id
      ? supabase.from('plano_alimentar_modelos').update(payload).eq('id', selecionado.id)
      : supabase.from('plano_alimentar_modelos').insert(payload);
    const { error } = await query;
    setSalvando(false);
    if (error) return setErro(error.message);
    setSelecionado(ALIMENTAR_VAZIO);
    carregar();
  }

  async function excluir() {
    if (!selecionado.id || !confirm('Excluir este modelo de plano alimentar?')) return;
    const { error } = await supabase.from('plano_alimentar_modelos').delete().eq('id', selecionado.id);
    if (error) return setErro(error.message);
    setSelecionado(ALIMENTAR_VAZIO);
    carregar();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle><Utensils className="inline h-4 w-4 mr-1 text-brand-600" /> Templates de plano alimentar</CardTitle>
      </CardHeader>
      <CardBody className="grid gap-5 lg:grid-cols-[280px,1fr]">
        <ListaModelos modelos={modelos} selecionado={selecionado} vazio={ALIMENTAR_VAZIO} onNovo={setSelecionado} onSelect={setSelecionado} />
        <div className="space-y-4">
          {erro && <MensagemErro texto={erro} />}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Objetivo">
              <Select value={selecionado.objetivo} onChange={e => setSelecionado((s: any) => ({ ...s, objetivo: e.target.value }))}>
                {OBJETIVOS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </Select>
            </Field>
            <Field label="Nome do template"><Input value={selecionado.nome ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, nome: e.target.value }))} /></Field>
          </div>
          <Field label="Descricao"><Input value={selecionado.descricao ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, descricao: e.target.value }))} /></Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Fator atividade"><Input type="number" step="0.05" value={selecionado.fator_atividade ?? 1.4} onChange={e => setSelecionado((s: any) => ({ ...s, fator_atividade: Number(e.target.value) }))} /></Field>
            <Field label="Ajuste kcal"><Input type="number" value={selecionado.ajuste_calorico_kcal ?? 0} onChange={e => setSelecionado((s: any) => ({ ...s, ajuste_calorico_kcal: Number(e.target.value) }))} /></Field>
            <Field label="Proteina g/kg"><Input type="number" step="0.1" value={selecionado.proteina_g_kg ?? 1.6} onChange={e => setSelecionado((s: any) => ({ ...s, proteina_g_kg: Number(e.target.value) }))} /></Field>
            <Field label="Gordura %"><Input type="number" value={selecionado.gordura_pct ?? 30} onChange={e => setSelecionado((s: any) => ({ ...s, gordura_pct: Number(e.target.value) }))} /></Field>
            <Field label="Agua ml/kg"><Input type="number" value={selecionado.agua_ml_kg ?? 35} onChange={e => setSelecionado((s: any) => ({ ...s, agua_ml_kg: Number(e.target.value) }))} /></Field>
            <Field label="Fibras g/dia"><Input type="number" value={selecionado.fibras_g ?? 25} onChange={e => setSelecionado((s: any) => ({ ...s, fibras_g: Number(e.target.value) }))} /></Field>
          </div>
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">Previa de calculo com paciente exemplo</div>
            <div className="mt-2 grid gap-2 text-sm md:grid-cols-4">
              <Preview label="TMB" value={`${exemplo.tmbKcal ?? '-'} kcal`} />
              <Preview label="VET" value={`${exemplo.vetKcal ?? '-'} kcal`} />
              <Preview label="Macros" value={`P ${exemplo.proteinaG ?? '-'}g | C ${exemplo.carboidratoG ?? '-'}g | G ${exemplo.gorduraG ?? '-'}g`} />
              <Preview label="Agua" value={`${exemplo.aguaMl ?? '-'} ml`} />
            </div>
          </div>
          <Field label="Refeicoes ou estrutura do plano"><Textarea className="min-h-[120px]" value={textoRefeicoes(selecionado.refeicoes)} onChange={e => setSelecionado((s: any) => ({ ...s, refeicoes: e.target.value.split('\n').filter(Boolean) }))} /></Field>
          <Field label="Observacoes"><Textarea value={selecionado.observacoes ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, observacoes: e.target.value }))} /></Field>
          <Field label="Referencias tecnicas"><Textarea value={selecionado.referencias ?? ''} onChange={e => setSelecionado((s: any) => ({ ...s, referencias: e.target.value }))} /></Field>
          <AcoesFormulario selecionado={selecionado} setSelecionado={setSelecionado} salvando={salvando} salvar={salvar} excluir={excluir} disabled={!selecionado.nome} />
        </div>
      </CardBody>
    </Card>
  );
}

function ListaModelos({ modelos, selecionado, vazio, onNovo, onSelect }: any) {
  return (
    <div className="space-y-2">
      <Button variant="secondary" className="w-full" onClick={() => onNovo(vazio)}>
        <Plus className="h-4 w-4" /> Novo modelo
      </Button>
      {modelos.map((m: any) => (
        <button
          key={m.id}
          onClick={() => onSelect(m)}
          className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${selecionado.id === m.id ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
        >
          <div className="font-medium text-slate-800">{m.nome}</div>
          <div className="mt-0.5 text-xs text-slate-500">{labelObjetivo(m.objetivo)} {m.padrao ? '· padrao' : ''} {!m.ativo ? '· inativo' : ''}</div>
        </button>
      ))}
      {modelos.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">Nenhum modelo cadastrado.</div>}
    </div>
  );
}

function AcoesFormulario({ selecionado, setSelecionado, salvando, salvar, excluir, disabled }: any) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!selecionado.ativo} onChange={e => setSelecionado((s: any) => ({ ...s, ativo: e.target.checked }))} /> Ativo</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!selecionado.padrao} onChange={e => setSelecionado((s: any) => ({ ...s, padrao: e.target.checked }))} /> Padrao</label>
      </div>
      <div className="flex gap-2">
        {selecionado.id && <Button variant="danger" onClick={excluir}><Trash2 className="h-4 w-4" /> Excluir</Button>}
        <Button onClick={salvar} disabled={salvando || disabled}><Save className="h-4 w-4" /> {salvando ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </div>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-white px-3 py-2"><div className="text-[10px] font-semibold uppercase text-slate-400">{label}</div><div className="font-semibold text-slate-800">{value}</div></div>;
}

function MensagemErro({ texto }: { texto: string }) {
  return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{texto}</div>;
}

function labelObjetivo(valor: string) {
  return OBJETIVOS.find(([k]) => k === valor)?.[1] ?? valor;
}

function textoRefeicoes(valor: any) {
  if (Array.isArray(valor)) return valor.join('\n');
  if (typeof valor === 'string') return valor;
  return '';
}
