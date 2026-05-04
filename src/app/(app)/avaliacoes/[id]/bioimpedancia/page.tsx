'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { buscarModulo, upsertModulo } from '@/lib/modulos';
import { useAutoSave } from '@/lib/useAutoSave';
import { createClient } from '@/lib/supabase/client';
import { buildSteps } from '@/lib/steps';

const APARELHOS = ['Avabio 380','InBody 270','InBody 370s','InBody 570','InBody 770',
  'Tanita MC-780','Tanita BC-601','Omron HBF-514C','Seca mBCA 514','Outro'];

const SEGMENTOS = [
  { k: 'braco_dir', label: 'Braço Direito' },
  { k: 'braco_esq', label: 'Braço Esquerdo' },
  { k: 'tronco',    label: 'Tronco' },
  { k: 'perna_dir', label: 'Perna Direita' },
  { k: 'perna_esq', label: 'Perna Esquerda' },
];



type SegData = { kg?: string; pct?: string };

export default function BioimpedanciaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [aval, setAval] = useState<any>(null);

  const [form, setForm] = useState({
    aparelho: 'Avabio 380',
    data_exame: '',
    peso_kg: '', percentual_gordura: '', massa_gordura_kg: '',
    massa_livre_gordura_kg: '', agua_corporal_kg: '', imc: '',
    taxa_metabolica_basal_kcal: '', indice_apendicular: '',
    idade_metabolica: '', gordura_visceral_nivel: '',
    observacoes: '',
    segmentar_magra:   {} as Record<string, SegData>,
    segmentar_gordura: {} as Record<string, SegData>,

  });

  const upd = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const updSeg = (tipo: 'segmentar_magra' | 'segmentar_gordura', seg: string, campo: 'kg' | 'pct', val: string) =>
    setForm(f => ({ ...f, [tipo]: { ...f[tipo], [seg]: { ...f[tipo][seg], [campo]: val } } }));



  useEffect(() => { (async () => {
    const { data: av } = await supabase.from('avaliacoes').select('*, pacientes(*)').eq('id', params.id).single();
    setAval(av);
    const dados = await buscarModulo('bioimpedancia', params.id);
    if (dados) {
      setForm(f => ({
        ...f,
        aparelho:  dados.aparelho ?? 'Avabio 380',
        data_exame: dados.data_exame ?? '',
        peso_kg:   dados.peso_kg?.toString() ?? '',
        percentual_gordura: dados.percentual_gordura?.toString() ?? '',
        massa_gordura_kg: dados.massa_gordura_kg?.toString() ?? '',
        massa_livre_gordura_kg: dados.massa_livre_gordura_kg?.toString() ?? '',
        agua_corporal_kg: dados.agua_corporal_kg?.toString() ?? '',
        imc: dados.imc?.toString() ?? '',
        taxa_metabolica_basal_kcal: dados.taxa_metabolica_basal_kcal?.toString() ?? '',
        indice_apendicular: dados.indice_apendicular?.toString() ?? '',
        idade_metabolica: dados.idade_metabolica?.toString() ?? '',
        gordura_visceral_nivel: dados.gordura_visceral_nivel?.toString() ?? '',
        observacoes: dados.observacoes ?? '',
        segmentar_magra:   dados.segmentar_magra ?? {},
        segmentar_gordura: dados.segmentar_gordura ?? {},

      }));
    }
  })(); }, [params.id, supabase]);

  const saving = useAutoSave(form, async (v) => {
    const n = (v: string) => v !== '' && v != null ? Number(v) : null;
    return upsertModulo('bioimpedancia', params.id, {
      aparelho: v.aparelho || null,
      data_exame: v.data_exame || null,
      peso_kg: n(v.peso_kg),
      percentual_gordura: n(v.percentual_gordura),
      massa_gordura_kg: n(v.massa_gordura_kg),
      massa_livre_gordura_kg: n(v.massa_livre_gordura_kg),
      agua_corporal_kg: n(v.agua_corporal_kg),
      imc: n(v.imc),
      taxa_metabolica_basal_kcal: n(v.taxa_metabolica_basal_kcal),
      indice_apendicular: n(v.indice_apendicular),
      idade_metabolica: n(v.idade_metabolica),
      gordura_visceral_nivel: n(v.gordura_visceral_nivel),
      observacoes: v.observacoes || null,
      segmentar_magra: v.segmentar_magra,
      segmentar_gordura: v.segmentar_gordura,

    });
  }, 2000);

  if (!aval) return <p className="text-slate-500">Carregando…</p>;
  const steps = buildSteps(params.id, aval.modulos_selecionados);
  const nextStep = steps.find(s => s.key === 'antropometria');

  return (
    <div>
      <div className="max-w-4xl space-y-5 mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Bioimpedância</h2>
          <SaveIndicator state={saving} />
        </div>

        {/* Aparelho */}
        <Card>
          <CardHeader><CardTitle>Aparelho e data</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Aparelho">
              <Select value={form.aparelho} onChange={upd('aparelho')}>
                {APARELHOS.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
            </Field>
            <Field label="Data do exame">
              <Input type="date" value={form.data_exame} onChange={upd('data_exame')} />
            </Field>
          </CardBody>
        </Card>

        {/* Análise Global */}
        <Card>
          <CardHeader><CardTitle>Análise global resumida</CardTitle></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { k: 'peso_kg',               label: 'Peso (kg)' },
                { k: 'percentual_gordura',    label: '% Gordura' },
                { k: 'massa_gordura_kg',      label: 'Massa de Gordura (kg)' },
                { k: 'massa_livre_gordura_kg',label: 'Massa Livre de Gordura (kg)' },
                { k: 'agua_corporal_kg',      label: 'Água Corporal (kg)' },
                { k: 'imc',                   label: 'IMC' },
              ].map(c => (
                <Field key={c.k} label={c.label}>
                  <Input type="number" step="0.01" value={(form as any)[c.k]} onChange={upd(c.k)} />
                </Field>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Dados adicionais */}
        <Card>
          <CardHeader><CardTitle>Dados adicionais</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="TMB (kcal)">
              <Input type="number" value={form.taxa_metabolica_basal_kcal} onChange={upd('taxa_metabolica_basal_kcal')} />
            </Field>
            <Field label="Índice Apendicular">
              <Input type="number" step="0.01" value={form.indice_apendicular} onChange={upd('indice_apendicular')} />
            </Field>
            <Field label="Idade Metabólica">
              <Input type="number" value={form.idade_metabolica} onChange={upd('idade_metabolica')} />
            </Field>
            <Field label="Gordura Visceral (nível)">
              <Input type="number" step="0.1" value={form.gordura_visceral_nivel} onChange={upd('gordura_visceral_nivel')} />
            </Field>
          </CardBody>
        </Card>

        {/* Análise Segmentar Massa Magra */}
        <Card>
          <CardHeader><CardTitle>Análise de massa magra por segmento</CardTitle></CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-3 py-2 text-slate-600">Segmento</th>
                    <th className="text-center px-3 py-2 text-slate-600">kg</th>
                    <th className="text-center px-3 py-2 text-slate-600">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SEGMENTOS.map(s => (
                    <tr key={s.k}>
                      <td className="px-3 py-2 font-medium text-slate-700">{s.label}</td>
                      <td className="px-2 py-1.5">
                        <Input type="number" step="0.01" className="w-24"
                          value={form.segmentar_magra[s.k]?.kg ?? ''}
                          onChange={e => updSeg('segmentar_magra', s.k, 'kg', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input type="number" step="0.1" className="w-24"
                          value={form.segmentar_magra[s.k]?.pct ?? ''}
                          onChange={e => updSeg('segmentar_magra', s.k, 'pct', e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Análise Segmentar Gordura */}
        <Card>
          <CardHeader><CardTitle>Análise de gordura por segmento</CardTitle></CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-3 py-2 text-slate-600">Segmento</th>
                    <th className="text-center px-3 py-2 text-slate-600">kg</th>
                    <th className="text-center px-3 py-2 text-slate-600">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SEGMENTOS.map(s => (
                    <tr key={s.k}>
                      <td className="px-3 py-2 font-medium text-slate-700">{s.label}</td>
                      <td className="px-2 py-1.5">
                        <Input type="number" step="0.01" className="w-24"
                          value={form.segmentar_gordura[s.k]?.kg ?? ''}
                          onChange={e => updSeg('segmentar_gordura', s.k, 'kg', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input type="number" step="0.1" className="w-24"
                          value={form.segmentar_gordura[s.k]?.pct ?? ''}
                          onChange={e => updSeg('segmentar_gordura', s.k, 'pct', e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>



        {/* Observações */}
        <Card>
          <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
          <CardBody>
            <Textarea value={form.observacoes} onChange={upd('observacoes')}
              placeholder="Condições do exame, hidratação prévia, observações…" className="min-h-[70px]" />
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => router.push(nextStep?.href ?? `/avaliacoes/${params.id}/revisao`)}>
            Continuar →
          </Button>
        </div>
      </div>
    </div>
  );
}
