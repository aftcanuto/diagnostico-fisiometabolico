'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Input';
import { qualificationSchema, type IsakQualification } from '@/lib/isak-qualification';
import { Button } from '@/components/ui/Button';
import { Check, Save, UserRound } from 'lucide-react';

export function AvaliadorPerfilForm({ perfil }: { perfil: any }) {
  const supabase = createClient();
  const [form, setForm] = useState({
    nome: perfil?.nome ?? '',
    crefito_crm: perfil?.crefito_crm ?? '',
    especialidade: perfil?.especialidade ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [error, setError] = useState('');
  const [qualification, setQualification] = useState<IsakQualification>(() => {
    const parsed = qualificationSchema.safeParse(perfil?.qualificacao_isak);
    return parsed.success ? parsed.data : { status: 'none' };
  });
  const [qualificationChanged, setQualificationChanged] = useState(false);

  function changeQualification(patch: Partial<IsakQualification>) {
    setQualification(current => ({ ...current, ...patch }));
    setQualificationChanged(true);
    setSalvo(false);
  }

  async function salvar() {
    if (saving) return;
    setSaving(true);
    setSalvo(false);
    setError('');
    try {
      const parsed = qualificationSchema.safeParse(qualification);
      if (qualificationChanged && !parsed.success) {
        throw new Error(parsed.error.issues[0].message);
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Sessão expirada. Entre novamente para salvar.');
      if (!perfil?.id || perfil.id !== user.id) throw new Error('Perfil indisponível. Recarregue a página.');
      const payload = {
        ...form,
        ...(qualificationChanged && parsed.success ? { qualificacao_isak: parsed.data } : {}),
      };
      const { data, error: saveError } = await supabase.from('avaliadores')
        .update(payload).eq('id', user.id).select('id');
      if (saveError) throw new Error(saveError.message);
      if (data?.length !== 1 || data[0].id !== user.id) {
        throw new Error('Nenhum perfil foi atualizado. Verifique sua sessão e permissão.');
      }
      setSalvo(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o perfil.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle><UserRound className="inline w-4 h-4 mr-1" /> Perfil do avaliador</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm text-slate-500">
          Estes dados aparecem no cabeçalho do relatório e nos dashboards vinculados às suas avaliações.
        </p>
        <fieldset disabled={saving} onChange={() => setSalvo(false)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Nome no relatório">
            <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </Field>
          <Field label="Registro profissional">
            <Input value={form.crefito_crm} onChange={e => setForm(f => ({ ...f, crefito_crm: e.target.value }))} placeholder="CREF 000000-G/UF" />
          </Field>
          <Field label="Especialidade">
            <Input value={form.especialidade} onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))} placeholder="Ex: Fisiologia do Exercício" />
          </Field>
        </fieldset>
        <fieldset disabled={saving} className="space-y-4 border-t border-slate-200 pt-4">
          <legend className="text-sm font-medium text-slate-700">Qualificação ISAK</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Situação">
              <Select aria-label="Situação ISAK" value={qualification.status} onChange={e => {
                changeQualification({ status: e.target.value as IsakQualification['status'], selfAttested: false });
              }}>
                <option value="none">Não informada</option>
                <option value="pending">Nível ISAK informado</option>
                <option value="confirmed">Certificação confirmada</option>
              </Select>
            </Field>
            {qualification.status !== 'none' && <>
              <Field label="Nível (opcional)">
                <Select aria-label="Nível ISAK" value={qualification.level ?? ''} onChange={e => changeQualification({ level: e.target.value ? Number(e.target.value) : undefined, selfAttested: false })}>
                  <option value="">Não informado</option>
                  {[1, 2, 3, 4].map(level => <option key={level} value={level}>Nível {level}</option>)}
                </Select>
              </Field>
              {qualification.status === 'confirmed' && <Field label="Número da certificação (opcional)">
                <Input aria-label="Número da certificação ISAK" maxLength={100} value={qualification.number ?? ''} onChange={e => changeQualification({ number: e.target.value || undefined, selfAttested: false })} />
              </Field>}
              {qualification.status === 'confirmed' && <Field label="Validade (opcional)">
                <Input aria-label="Validade ISAK" type="date" value={qualification.expiry ?? ''} onChange={e => changeQualification({ expiry: e.target.value || undefined, selfAttested: false })} />
              </Field>}
            </>}
          </div>
          {qualification.status === 'confirmed' && <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" checked={qualification.selfAttested === true} onChange={e => changeQualification({ selfAttested: e.target.checked })} />
            Confirmo que minha certificação ISAK foi emitida e que os dados informados correspondem a ela.
          </label>}
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end items-center gap-3">
          {salvo && <span className="text-sm text-emerald-600 inline-flex items-center gap-1"><Check className="w-4 h-4" /> Salvo</span>}
          <Button onClick={salvar} disabled={saving || !form.nome.trim() || !perfil?.id}>
            <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar perfil'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
