'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function NovoPacientePage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    nome: '', sexo: 'M', data_nascimento: '',
    telefone: '', email: '', cpf: '', observacoes: '',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upd = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: clinicaId } = await supabase.rpc('current_clinica_id');
    if (!clinicaId) { setErr('Sua conta não está vinculada a uma clínica.'); setLoading(false); return; }
    const { data, error } = await supabase.from('pacientes')
      .insert({ ...form, avaliador_id: user.id, clinica_id: clinicaId })
      .select('id').single();
    if (error) { setErr(error.message); setLoading(false); return; }
    router.push(`/pacientes/${data!.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Novo paciente</h1>
      <Card>
        <CardHeader><CardTitle>Dados do paciente</CardTitle></CardHeader>
        <CardBody>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Nome completo"><Input required value={form.nome} onChange={upd('nome')} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Sexo">
                <Select value={form.sexo} onChange={upd('sexo')}>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </Select>
              </Field>
              <Field label="Data de nascimento">
                <Input type="date" required value={form.data_nascimento} onChange={upd('data_nascimento')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Telefone"><Input value={form.telefone} onChange={upd('telefone')} /></Field>
              <Field label="E-mail"><Input type="email" value={form.email} onChange={upd('email')} /></Field>
            </div>
            <Field label="CPF">
              <Input value={form.cpf} onChange={upd('cpf')} placeholder="000.000.000-00" maxLength={14} />
            </Field>
            <Field label="Observações">
              <Textarea value={form.observacoes} onChange={upd('observacoes')} placeholder="Notas adicionais..." />
            </Field>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" type="button" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Salvando…' : 'Cadastrar'}</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
