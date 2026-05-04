'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';
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

  async function salvar() {
    setSaving(true);
    setSalvo(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('avaliadores').update(form).eq('id', user.id);
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Nome no relatório">
            <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </Field>
          <Field label="Registro profissional">
            <Input value={form.crefito_crm} onChange={e => setForm(f => ({ ...f, crefito_crm: e.target.value }))} placeholder="CREF 000000-G/UF" />
          </Field>
          <Field label="Especialidade">
            <Input value={form.especialidade} onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))} placeholder="Ex: Fisiologia do Exercício" />
          </Field>
        </div>
        <div className="flex justify-end items-center gap-3">
          {salvo && <span className="text-sm text-emerald-600 inline-flex items-center gap-1"><Check className="w-4 h-4" /> Salvo</span>}
          <Button onClick={salvar} disabled={saving || !form.nome}>
            <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar perfil'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
