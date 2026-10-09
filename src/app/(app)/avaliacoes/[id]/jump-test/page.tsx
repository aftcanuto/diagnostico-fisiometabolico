'use client';
import { use, useEffect, useMemo, useState } from 'react';
import { Plus, Save, Upload, FileDown, ArrowRight, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { buscarModulo, upsertModulo } from '@/lib/modulos';
import { buildSteps } from '@/lib/steps';
import { JUMP_PROTOCOLS, JUMP_REFERENCES, jumpProtocolTechnique, newJumpData, newJumpTrial, trialMetrics, trialWarnings, jumpSchema, type JumpData, type JumpProtocol } from '@/lib/jump-test';
import { JumpTestSummary, jumpFormat } from '@/components/JumpTestSummary';
import { validateEnteredJump } from '@/lib/jump-test';

export default function JumpTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params), sb = useMemo(() => createClient(), []);
  const [form, setForm] = useState<JumpData>(newJumpData), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(''), [dirty, setDirty] = useState(false), [clinic, setClinic] = useState('');
  const [modules, setModules] = useState<any>({});
  useEffect(() => { let active = true; (async () => {
    try {
      const { data: av, error } = await sb.from('avaliacoes').select('clinica_id,modulos_selecionados').eq('id', id).single();
      if (error) throw error;
      const row = await buscarModulo('jump_test', id);
      if (active) { setClinic(av.clinica_id); setModules(av.modulos_selecionados ?? {}); if (row) setForm(jumpSchema.parse(row)); setLoading(false); }
    } catch (e: any) { if (active) setMessage(`Nao foi possivel carregar Jump Test. Confira a migration. ${e.message}`); }
  })(); return () => { active = false; }; }, [id, sb]);
  useEffect(() => { const handler = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler); }, [dirty]);
  function change(patch: Partial<JumpData>) { setForm(f => ({ ...f, ...patch })); setDirty(true); setMessage(''); }
  function selectProtocol(p: JumpProtocol, enabled: boolean) {
    if (!enabled && form.tentativas.some(t => t.protocolo === p && (t.altura_cm != null || t.voo_ms != null || t.potencia_w != null || t.contato_ms != null))) { setMessage('Este protocolo possui dados. Preserve o registro e justifique as tentativas excluidas.'); return; }
    change({ protocolos: enabled ? [...form.protocolos, p] : form.protocolos.filter(x => x !== p), tentativas: enabled ? [...form.tentativas, ...Array.from({ length: p === 'repetidos' ? 1 : 3 }, () => newJumpTrial(p, crypto.randomUUID()))] : form.tentativas.filter(t => t.protocolo !== p) });
  }
  async function save() {
    setSaving(true); setMessage('');
    try { const payload = jumpSchema.parse(form); await upsertModulo('jump_test', id, payload); setDirty(false); setMessage('Jump Test salvo.'); return true; }
    catch (e: any) { setMessage(e.issues?.[0]?.message ?? e.message); return false; }
    finally { setSaving(false); }
  }
  async function upload(file?: File) {
    if (!file || !clinic) return;
    if (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024) { setMessage('Envie um PDF de ate 10 MB.'); return; }
    setSaving(true);
    try {
      const path = `${id}/${crypto.randomUUID()}.pdf`;
      const { error } = await sb.storage.from('jump-test').upload(path, file, { contentType: 'application/pdf' });
      if (error) throw error;
      const next = jumpSchema.parse({ ...form, documento_path: path });
      await upsertModulo('jump_test', id, next); setForm(next); setDirty(false); setMessage('Relatorio original anexado.');
    } catch (e: any) { setMessage(e.message); } finally { setSaving(false); }
  }
  async function openDocument() {
    if (!form.documento_path) return;
    const { data, error } = await sb.storage.from('jump-test').createSignedUrl(form.documento_path, 60);
    if (error) { setMessage(error.message); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }
  if (loading) return <p role="status">{message || 'Carregando Jump Test...'}</p>;
  return <div className="max-w-6xl space-y-6 pb-20">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Jump Test</h1><Button onClick={save} disabled={saving || !dirty}><Save size={16}/>{saving ? 'Salvando...' : dirty ? 'Salvar alteracoes' : 'Salvo'}</Button></header>
    {message && <p role="status" className="rounded border p-3 text-sm">{message}</p>}
    <fieldset disabled={saving} className="space-y-6 min-w-0">
      <section className="space-y-4 border-b pb-5"><h2 className="font-semibold">Condicoes da avaliacao</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Massa corporal (kg)"><Input type="number" min="1" step="0.1" value={form.peso_kg ?? ''} onChange={e => change({ peso_kg: e.target.value === '' ? null : Number(e.target.value) })}/></Field>
          {(['esporte', 'nivel', 'equipamento', 'software', 'metodo_potencia'] as const).map((k, i) => <Field key={k} label={['Esporte', 'Nivel de pratica', 'Equipamento', 'Software / versao', 'Metodo da potencia'][i]}><Input value={form[k]} onChange={e => change({ [k]: e.target.value })}/></Field>)}
          <div className="sm:col-span-2"><Field label="Tecnica dos bracos"><Input value="Definida por protocolo: VJ na cintura; CMJ livres" disabled/></Field></div>
          <Field label="Descanso entre tentativas (s)"><Input type="number" min="0" max="600" value={form.descanso_s} onChange={e => change({ descanso_s: Number(e.target.value) })}/></Field>
          <Field label="Altura de queda DJ (cm)"><Input type="number" min="5" max="100" step="1" value={form.altura_queda_cm} onChange={e => change({ altura_queda_cm: Number(e.target.value) })}/></Field>
          <Field label="Serie de saltos repetidos"><Input value="15 segundos" disabled/></Field>
        </div>
        <div className="flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={form.apto} onChange={e => change({ apto: e.target.checked })}/> Aptidao confirmada pelo avaliador</label><label><input type="checkbox" checked={form.familiarizacao} onChange={e => change({ familiarizacao: e.target.checked })}/> Familiarizacao realizada</label></div>
        <Field label="Condicoes, dor atual, limitacoes e observacoes"><Textarea value={form.observacoes} onChange={e => change({ observacoes: e.target.value })}/></Field>
      </section>
      <section className="space-y-3"><h2 className="font-semibold">Protocolos</h2><div className="grid gap-3 sm:grid-cols-2">{Object.entries(JUMP_PROTOCOLS).map(([key, name]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.protocolos.includes(key as JumpProtocol)} onChange={e => selectProtocol(key as JumpProtocol, e.target.checked)}/>{name}</label>)}</div></section>
      {form.protocolos.map(p => <section key={p} className="space-y-3 border-t pt-5"><div><h2 className="font-semibold">{JUMP_PROTOCOLS[p]}</h2><p className="text-sm text-gray-600">Tecnica: {jumpProtocolTechnique(form, p)}.</p></div>
        {p === 'repetidos' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.repetidos_serie_completa} onChange={e => change({ repetidos_serie_completa: e.target.checked })}/>Serie continua de 15 s concluida e integralmente transcrita</label>}
        <div className="space-y-3">{form.tentativas.filter(t => t.protocolo === p).map((t, index) => {
          const update = (patch: Partial<typeof t>) => change({ tentativas: form.tentativas.map(row => row.id === t.id ? { ...row, ...patch } : row) });
          const m = trialMetrics(t, form.peso_kg), warnings = trialWarnings(t);
          return <div key={t.id} className="rounded-lg border p-3 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">Salto {index + 1}</strong><Select aria-label={`Status ${p} salto ${index + 1}`} value={t.status} onChange={e => update({ status: e.target.value as typeof t.status })} className="sm:max-w-48"><option value="pendente">Pendente</option><option value="valida">Valida</option><option value="excluida">Excluida</option></Select></div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{(['altura_cm', 'voo_ms', 'contato_ms', 'potencia_w'] as const).map((k, i) => <Field key={k} label={['Altura (cm)', 'Tempo de voo (ms)', 'Contato (ms)', 'Pico de potencia (W)'][i]}><Input aria-label={`${p} salto ${index + 1} ${k}`} type="number" min="0" step="0.1" value={t[k] ?? ''} onChange={e => update(validateEnteredJump({ ...t, [k]: e.target.value === '' ? null : Number(e.target.value) }))}/></Field>)}</div>
            <p className="text-xs text-gray-600">Altura: {jumpFormat(m.altura_mm)} mm ({m.origem_altura}) · Pico: {jumpFormat(m.potencia_w_kg)} W/kg{p === 'dj' ? ` · RSI: ${jumpFormat(m.rsi)} m/s` : ''}</p>
            {warnings.length > 0 && <p className="text-sm text-amber-800">{warnings.join(' ')}</p>}
            <Field label="Justificativa de exclusao / revisao"><Input value={t.justificativa} onChange={e => update({ justificativa: e.target.value })}/></Field>
          </div>;
        })}</div>
        <Button variant="secondary" onClick={() => change({ tentativas: [...form.tentativas, newJumpTrial(p, crypto.randomUUID())] })}><Plus size={16}/>{p === 'repetidos' ? 'Adicionar salto da serie' : 'Adicionar tentativa substituta'}</Button>
      </section>)}
      <section className="space-y-3 border-t pt-5"><h2 className="font-semibold">Referencia cientifica contextual</h2><Select aria-label="Referencia cientifica" value={form.referencia} onChange={e => change({ referencia: e.target.value as JumpData['referencia'] })}><option value="nenhuma">Sem referencia compativel selecionada</option>{Object.entries(JUMP_REFERENCES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}</Select>
        {form.referencia !== 'nenhuma' && <Field label="Compatibilidade da populacao e diferencas de protocolo"><Textarea value={form.referencia_justificativa} onChange={e => change({ referencia_justificativa: e.target.value })}/></Field>}
      </section>
      {form.tentativas.some(t => t.status === 'pendente' && validateEnteredJump(t).status === 'valida') &&
        <Button variant="secondary" onClick={() => change({ tentativas: form.tentativas.map(t => t.status === 'pendente' ? validateEnteredJump(t) : t) })}><CheckCheck size={16}/>Confirmar saltos preenchidos</Button>}
      <JumpTestSummary data={form}/>
      <Field label="Conclusao profissional"><Textarea value={form.conclusao} onChange={e => change({ conclusao: e.target.value })}/></Field>
      <div className="flex flex-wrap items-center gap-3"><label className="block w-full max-w-sm cursor-pointer text-sm"><span className="flex items-center gap-2 mb-2"><Upload size={16}/>Relatorio original (PDF)</span><input type="file" accept="application/pdf" className="block w-full min-w-0" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }}/></label>{form.documento_path && <Button variant="secondary" onClick={openDocument}><FileDown size={16}/>Abrir original</Button>}</div>
    </fieldset>
    <div className="flex flex-wrap justify-between gap-3"><Button onClick={save} disabled={saving || !dirty}><Save size={16}/>Salvar Jump Test</Button><Button disabled={saving} onClick={async () => {
      if (dirty && !await save()) return;
      const steps = buildSteps(id, modules);
      const next = steps.slice(steps.findIndex(s => s.key === 'jump-test') + 1).find(s => s.enabled);
      window.location.assign(next?.href ?? `/avaliacoes/${id}/revisao`);
    }}>Continuar<ArrowRight size={16}/></Button></div>
  </div>;
}
