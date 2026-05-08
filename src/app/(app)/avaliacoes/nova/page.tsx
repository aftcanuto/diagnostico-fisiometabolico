'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

const modulosMeta = [
  { k: 'anamnese',           label: 'Anamnese',             obrig: true, desc: 'Histórico clínico e objetivos' },
  { k: 'sinais_vitais',      label: 'Sinais vitais',        desc: 'PA, FC, SpO₂, temperatura' },
  { k: 'posturografia',      label: 'Posturografia',        desc: '4 fotos + análise de alinhamentos' },
  { k: 'bioimpedancia',      label: 'Bioimpedância',        desc: 'InBody / Tanita — composição, água, célula' },
  { k: 'antropometria',      label: 'Antropometria (ISAK)', desc: 'Dobras, circunferências, somatotipo' },
  { k: 'flexibilidade',      label: 'Flexibilidade',        desc: 'Banco de Wells (sit and reach)' },
  { k: 'forca',              label: 'Força',                desc: 'Preensão palmar + dinamometria isométrica' },
  { k: 'rml',                label: 'Resistência Muscular (RML)', desc: 'Flexão braço, abdominal, prancha, agachamento — ou Senior Fitness Test' },
  { k: 'cardiorrespiratorio',label: 'Cardiorrespiratório',  desc: 'VO₂máx, L2, VAM, zonas' },
  { k: 'biomecanica_corrida',label: 'Biomecânica da corrida', desc: 'Cinemática 2D — análise da passada (opcional)' },
] as const;

const MODULOS_INICIAIS: Record<string, boolean> = {
  anamnese: true, sinais_vitais: true, posturografia: true,
  bioimpedancia: false, antropometria: true, flexibilidade: true,
  forca: true, cardiorrespiratorio: true, rml: false,
  biomecanica_corrida: false,
};

const NENHUM_MODULO = Object.fromEntries(modulosMeta.map(m => [m.k, false])) as Record<string, boolean>;

const ROTAS_MODULOS: Record<string, string> = {
  anamnese: 'anamnese',
  sinais_vitais: 'sinais-vitais',
  posturografia: 'posturografia',
  bioimpedancia: 'bioimpedancia',
  antropometria: 'antropometria',
  flexibilidade: 'flexibilidade',
  forca: 'forca',
  rml: 'rml',
  cardiorrespiratorio: 'cardiorrespiratorio',
  biomecanica_corrida: 'biomecanica',
};

function primeiraRotaSelecionada(modulos: Record<string, boolean>) {
  const primeiro = modulosMeta.find(m => modulos[m.k]);
  return primeiro ? ROTAS_MODULOS[primeiro.k] : 'revisao';
}

export default function NovaAvaliacaoPage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const [pacienteId, setPacienteId] = useState(params.get('pacienteId') ?? '');
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [produtoId, setProdutoId] = useState<string>('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState<'completo' | 'personalizado'>('completo');
  const [modulos, setModulos] = useState<Record<string, boolean>>(MODULOS_INICIAIS);
  const [loading, setLoading] = useState(false);

  useEffect(() => { (async () => {
    const [{ data: pacs }, { data: prods }] = await Promise.all([
      supabase.from('pacientes').select('id,nome').order('nome'),
      supabase.from('produtos').select('*').eq('ativo', true).order('padrao', { ascending: false }),
    ]);
    setPacientes(pacs ?? []);
    setProdutos(prods ?? []);
    const padrao = (prods ?? []).find((p: any) => p.padrao);
    if (padrao) {
      setProdutoId(padrao.id);
      setModulos({ ...NENHUM_MODULO, ...(padrao.modulos ?? {}) });
      setTipo('personalizado');
    }
  })(); }, [supabase]);

  function selecionarProduto(id: string) {
    setProdutoId(id);
    if (!id) return;
    const p = produtos.find(x => x.id === id);
    if (p) {
      setModulos({ ...NENHUM_MODULO, ...(p.modulos ?? {}) });
      setTipo('personalizado');
    }
  }

  function toggleTipo(t: 'completo' | 'personalizado') {
    setTipo(t);
    if (t === 'completo') {
      setModulos(MODULOS_INICIAIS);
      setProdutoId('');
    }
  }

  function toggleMod(k: string) {
    if (tipo === 'completo') return;
    setModulos(m => ({ ...m, [k]: !m[k] }));
  }

  async function submit() {
    if (!pacienteId) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: clinicaId } = await supabase.rpc('current_clinica_id');
    const { data: aval, error } = await supabase.from('avaliacoes').insert({
      paciente_id: pacienteId, avaliador_id: user!.id, clinica_id: clinicaId,
      data, tipo, modulos_selecionados: modulos,
      produto_id: produtoId || null,
    }).select('id').single();
    if (error) { alert(error.message); setLoading(false); return; }
    router.push(`/avaliacoes/${aval!.id}/${primeiraRotaSelecionada(modulos)}`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Nova avaliação</h1>

      <Card>
        <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Paciente">
              <Select value={pacienteId} onChange={e => setPacienteId(e.target.value)}>
                <option value="">Selecione…</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </Select>
            </Field>
            <Field label="Data"><Input type="date" value={data} onChange={e => setData(e.target.value)} /></Field>
          </div>
          {produtos.length > 0 && (
            <Field label="Produto (pré-configura módulos)">
              <Select value={produtoId} onChange={e => selecionarProduto(e.target.value)}>
                <option value="">— sem produto —</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}{p.padrao ? ' (padrão)' : ''}</option>
                ))}
              </Select>
            </Field>
          )}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
            {(['completo', 'personalizado'] as const).map(t => (
              <button key={t} onClick={() => toggleTipo(t)}
                      className={cn('h-8 px-4 text-sm rounded-md',
                        tipo === t ? 'bg-white shadow font-medium text-slate-800' : 'text-slate-500')}>
                {t === 'completo' ? 'Completo' : 'Personalizado'}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Módulos {tipo === 'personalizado' && <span className="text-xs text-slate-500">· selecione o que vai aplicar</span>}</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modulosMeta.map(m => {
              const checked = !!modulos[m.k];
              const obrigatorio = false;
              const locked = tipo === 'completo';
              return (
                <button key={m.k} onClick={() => toggleMod(m.k)} disabled={locked}
                        className={cn(
                          'text-left rounded-lg border p-4 transition',
                          checked ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white',
                          !locked && 'hover:border-brand-300 cursor-pointer',
                          locked && 'cursor-default opacity-90'
                        )}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{m.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{m.desc}</div>
                      {obrigatorio && <span className="inline-block mt-1 text-[10px] uppercase font-semibold text-brand-700">Obrigatório</span>}
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded border-2 grid place-items-center',
                      checked ? 'bg-brand-600 border-brand-600' : 'border-slate-300'
                    )}>
                      {checked && <svg viewBox="0 0 16 16" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="3,8 7,12 13,4"/></svg>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => router.back()}>Cancelar</Button>
        <Button onClick={submit} disabled={!pacienteId || loading}>
          {loading ? 'Criando…' : 'Iniciar avaliação'}
        </Button>
      </div>
    </div>
  );
}
