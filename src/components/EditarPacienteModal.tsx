'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Pencil, X, Check, Loader2 } from 'lucide-react';

interface Paciente {
  id: string;
  nome: string;
  sexo: 'M' | 'F';
  data_nascimento: string;
  telefone?: string | null;
  email?: string | null;
  cpf?: string | null;
}

interface Props {
  paciente: Paciente;
  onSaved?: (p: Paciente) => void;
}

export function EditarPacienteModal({ paciente, onSaved }: Props) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: paciente.nome,
    sexo: paciente.sexo,
    data_nascimento: paciente.data_nascimento,
    telefone: paciente.telefone ?? '',
    email: paciente.email ?? '',
    cpf: paciente.cpf ?? '',
  });

  const upd = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Formatar CPF automaticamente enquanto digita
  function handleCpf(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    setForm(f => ({ ...f, cpf: v }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const { error } = await supabase
      .from('pacientes')
      .update({
        nome: form.nome.trim(),
        sexo: form.sexo,
        data_nascimento: form.data_nascimento,
        telefone: form.telefone || null,
        email: form.email || null,
        cpf: form.cpf.replace(/\D/g, '') ? form.cpf : null,
      })
      .eq('id', paciente.id);

    if (error) { setErr(error.message); setLoading(false); return; }
    onSaved?.({ ...paciente, ...form, cpf: form.cpf || null });
    setOpen(false);
    setLoading(false);
    window.location.reload();
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Pencil className="w-3.5 h-3.5" /> Editar paciente
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">Editar paciente</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvar} className="space-y-4">
              <Field label="Nome completo">
                <Input required value={form.nome} onChange={upd('nome')} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
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

              <Field label="CPF">
                <Input
                  value={form.cpf}
                  onChange={handleCpf}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone">
                  <Input value={form.telefone} onChange={upd('telefone')} placeholder="(00) 00000-0000" />
                </Field>
                <Field label="E-mail">
                  <Input type="email" value={form.email} onChange={upd('email')} />
                </Field>
              </div>

              {err && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {err}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando…</>
                    : <><Check className="w-4 h-4" /> Salvar alterações</>
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
