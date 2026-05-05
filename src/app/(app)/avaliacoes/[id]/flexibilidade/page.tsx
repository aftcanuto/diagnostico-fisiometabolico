'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { buscarModulo, upsertModulo } from '@/lib/modulos';
import { useAutoSave } from '@/lib/useAutoSave';
import { createClient } from '@/lib/supabase/client';
import { classificarWells } from '@/lib/calculations/flexibilidade';
import { calcIdade } from '@/lib/calculations/antropometria';
import { buildSteps } from '@/lib/steps';

export default function FlexibilidadePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [aval, setAval] = useState<any>(null);
  const [form, setForm] = useState({
    tentativa_1: '' as string,
    tentativa_2: '' as string,
    tentativa_3: '' as string,
    melhor_resultado: null as number | null,
    classificacao: '' as string,
    testes_adicionais: [] as any[],
    observacoes: '',
  });

  const upd = (k: string) => (e: any) => {
    const val = e.target.value;
    setForm(f => {
      const nf = { ...f, [k]: val };
      // Recalcular melhor resultado
      const t1 = parseFloat(nf.tentativa_1) || 0;
      const t2 = parseFloat(nf.tentativa_2) || 0;
      const t3 = parseFloat(nf.tentativa_3) || 0;
      const vals = [t1, t2, t3].filter(v => v > 0);
      if (vals.length > 0) {
        nf.melhor_resultado = Math.max(...vals);
      }
      return nf;
    });
  };

  useEffect(() => { (async () => {
    const { data: av } = await supabase.from('avaliacoes').select('*, pacientes(*)').eq('id', params.id).single();
    setAval(av);
    const dados = await buscarModulo('flexibilidade', params.id);
    if (dados) setForm(f => ({
      ...f,
      tentativa_1: dados.tentativa_1?.toString() ?? '',
      tentativa_2: dados.tentativa_2?.toString() ?? '',
      tentativa_3: dados.tentativa_3?.toString() ?? '',
      melhor_resultado: dados.melhor_resultado,
      classificacao: dados.classificacao ?? '',
      testes_adicionais: dados.testes_adicionais ?? [],
      observacoes: dados.observacoes ?? '',
    }));
  })(); }, [params.id, supabase]);

  const salvar = async (v = form) => {
    const t1 = parseFloat(v.tentativa_1) || null;
    const t2 = parseFloat(v.tentativa_2) || null;
    const t3 = parseFloat(v.tentativa_3) || null;
    const vals = [t1, t2, t3].filter(Boolean) as number[];
    const melhor = vals.length ? Math.max(...vals) : null;

    let classificacao = '';
    if (melhor != null && aval?.pacientes) {
      const idade = calcIdade(aval.pacientes.data_nascimento);
      const result = classificarWells(melhor, aval.pacientes.sexo, idade);
      classificacao = result.classificacao;
    }

    return upsertModulo('flexibilidade', params.id, {
      tentativa_1: t1, tentativa_2: t2, tentativa_3: t3,
      melhor_resultado: melhor, classificacao,
      testes_adicionais: v.testes_adicionais,
      observacoes: v.observacoes,
    });
  };

  const saving = useAutoSave(form, salvar, 2000);

  // Classificação em tempo real
  const classificacaoAtual = (() => {
    if (!aval?.pacientes || !form.melhor_resultado) return null;
    const idade = calcIdade(aval.pacientes.data_nascimento);
    return classificarWells(form.melhor_resultado, aval.pacientes.sexo, idade);
  })();

  if (!aval) return <p className="text-slate-500">Carregando…</p>;

  const steps = buildSteps(params.id, aval.modulos_selecionados);

  return (
    <div>
      <div className="max-w-3xl space-y-5 mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Flexibilidade — Banco de Wells</h2>
          <SaveIndicator state={saving} />
        </div>

        <Card>
          <CardHeader><CardTitle>Teste de Sentar e Alcançar (Sit and Reach)</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-slate-500">
              Paciente sentado com pernas estendidas, pés apoiados no banco.
              Flexiona o tronco à frente, empurrando o cursor o mais longe possível.
              3 tentativas, registre o melhor resultado em centímetros.
            </p>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Tentativa 1 (cm)">
                <Input type="number" step="0.1" value={form.tentativa_1} onChange={upd('tentativa_1')} placeholder="ex: 28.5" />
              </Field>
              <Field label="Tentativa 2 (cm)">
                <Input type="number" step="0.1" value={form.tentativa_2} onChange={upd('tentativa_2')} placeholder="ex: 30.0" />
              </Field>
              <Field label="Tentativa 3 (cm)">
                <Input type="number" step="0.1" value={form.tentativa_3} onChange={upd('tentativa_3')} placeholder="ex: 31.2" />
              </Field>
            </div>

            {form.melhor_resultado != null && (
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600">Melhor resultado</div>
                    <div className="text-3xl font-bold text-brand-700">{form.melhor_resultado.toFixed(1)} cm</div>
                  </div>
                  {classificacaoAtual && (
                    <div className="text-right">
                      <div className="text-sm text-slate-600">Classificação</div>
                      <div className={`text-xl font-bold ${
                        classificacaoAtual.classificacao === 'Excelente' ? 'text-emerald-600' :
                        classificacaoAtual.classificacao === 'Bom' ? 'text-green-600' :
                        classificacaoAtual.classificacao === 'Médio' ? 'text-amber-600' :
                        classificacaoAtual.classificacao === 'Regular' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>{classificacaoAtual.classificacao}</div>
                      <div className="text-xs text-slate-500">{classificacaoAtual.percentil}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
          <CardBody>
            <Textarea
              value={form.observacoes}
              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              placeholder="Observações sobre a flexibilidade, limitações articulares, dor durante o teste..."
              className="min-h-[80px]"
            />
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button onClick={async () => {
            try {
              await salvar();
            } catch (error: any) {
              alert(error?.message ?? 'Nao foi possivel salvar a flexibilidade.');
              return;
            }
            const next = steps.find(s => s.key === 'forca')
              ?? steps.find(s => s.key === 'rml')
              ?? steps.find(s => s.key === 'cardiorrespiratorio')
              ?? steps.find(s => s.key === 'biomecanica');
            router.push(next?.href ?? `/avaliacoes/${params.id}/revisao`);
          }}>
            Continuar →
          </Button>
        </div>
      </div>
    </div>
  );
}
