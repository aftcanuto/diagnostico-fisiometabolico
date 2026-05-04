'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { useAutoSave } from '@/lib/useAutoSave';
import { upsertModulo, buscarModulo } from '@/lib/modulos';
import { createClient } from '@/lib/supabase/client';
import { buildSteps } from '@/lib/steps';

export default function SinaisVitaisPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [aval, setAval] = useState<any>(null);
  const [form, setForm] = useState<any>({
    pa_sistolica: '', pa_diastolica: '', fc_repouso: '',
    spo2: '', temperatura: '', freq_respiratoria: ''
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { (async () => {
    const { data: av } = await supabase.from('avaliacoes').select('modulos_selecionados').eq('id', params.id).single();
    setAval(av);
    const d = await buscarModulo('sinais_vitais', params.id);
    if (d) setForm(d);
    setLoaded(true);
  })(); }, [params.id, supabase]);

  const saveState = useAutoSave(form, async v => {
    if (!loaded) return;
    const payload: any = {};
    for (const [k, val] of Object.entries(v)) {
      if (k === 'avaliacao_id' || k === 'updated_at') continue;
      payload[k] = val === '' ? null : Number(val);
    }
    await upsertModulo('sinais_vitais', params.id, payload);
  });

  const upd = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const paClass = (() => {
    const s = Number(form.pa_sistolica), d = Number(form.pa_diastolica);
    if (!s || !d) return null;
    if (s >= 180 || d >= 120) return { label: 'Crise hipertensiva', color: 'text-red-700 font-semibold' };
    if (s >= 140 || d >= 90) return { label: 'Hipertensão estágio 2', color: 'text-red-600' };
    if ((s >= 130 && s <= 139) || (d >= 80 && d <= 89)) return { label: 'Hipertensão estágio 1', color: 'text-orange-600' };
    if (s >= 120 && s <= 129 && d < 80) return { label: 'PA elevada', color: 'text-amber-600' };
    return { label: 'Normal', color: 'text-emerald-600' };
  })();
  const steps = aval ? buildSteps(params.id, aval.modulos_selecionados) : [];
  const prevStep = steps.find(s => s.key === 'anamnese');
  const nextStep = steps.find(s => s.key === 'posturografia')
    ?? steps.find(s => s.key === 'bioimpedancia')
    ?? steps.find(s => s.key === 'antropometria')
    ?? steps.find(s => s.key === 'revisao');

  return (
    <div className="space-y-5 max-w-3xl">
      <Card>
        <CardHeader><CardTitle>Pressão arterial</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sistólica (mmHg)"><Input type="number" value={form.pa_sistolica ?? ''} onChange={upd('pa_sistolica')} /></Field>
            <Field label="Diastólica (mmHg)"><Input type="number" value={form.pa_diastolica ?? ''} onChange={upd('pa_diastolica')} /></Field>
          </div>
          {paClass && <p className={`mt-3 text-sm ${paClass.color}`}>Classificação: {paClass.label}</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Outros sinais</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="FC repouso (bpm)"><Input type="number" value={form.fc_repouso ?? ''} onChange={upd('fc_repouso')} /></Field>
          <Field label="SpO₂ (%)"><Input type="number" step="0.1" value={form.spo2 ?? ''} onChange={upd('spo2')} /></Field>
          <Field label="Temperatura (°C)"><Input type="number" step="0.1" value={form.temperatura ?? ''} onChange={upd('temperatura')} /></Field>
          <Field label="FR (irpm)"><Input type="number" value={form.freq_respiratoria ?? ''} onChange={upd('freq_respiratoria')} /></Field>
        </CardBody>
      </Card>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => router.push(prevStep?.href ?? `/avaliacoes/${params.id}/anamnese`)}>← Voltar</Button>
        <Button onClick={() => router.push(nextStep?.href ?? `/avaliacoes/${params.id}/revisao`)}>Continuar →</Button>
      </div>
      <SaveIndicator state={saveState} />
    </div>
  );
}
