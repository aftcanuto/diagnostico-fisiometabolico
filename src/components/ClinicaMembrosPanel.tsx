'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UserPlus, Copy, Check, Trash2, Shield } from 'lucide-react';

export function ClinicaMembrosPanel({ clinicaId, podeGerenciar }: { clinicaId: string; podeGerenciar: boolean }) {
  const supabase = createClient();
  const [membros, setMembros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState('avaliador');
  const [convitando, setConvitando] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function carregar() {
    const { data } = await supabase.from('clinica_membros')
      .select('id, papel, ativo, user_id, created_at')
      .eq('clinica_id', clinicaId);

    const base = data ?? [];
    const ids = Array.from(new Set(base.map((m: any) => m.user_id).filter(Boolean)));
    const { data: avaliadores } = ids.length
      ? await supabase.from('avaliadores').select('id,nome').in('id', ids)
      : { data: [] as any[] };
    const nomes = new Map((avaliadores ?? []).map((a: any) => [a.id, a.nome]));

    setMembros(base.map((m: any) => ({
      ...m,
      avaliadores: { nome: nomes.get(m.user_id) ?? null },
    })));
    setLoading(false);
  }

  useEffect(() => { carregar(); }, [clinicaId]);

  async function convidar() {
    setConvitando(true);
    try {
      const res = await fetch('/api/clinica/convidar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, papel }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      if (j.url) setInviteLink(j.url);
      setEmail('');
      await carregar();
    } catch (e: any) { alert('Erro: ' + e.message); }
    setConvitando(false);
  }

  async function remover(membroId: string) {
    if (!confirm('Remover este membro da clínica?')) return;
    await supabase.from('clinica_membros').delete().eq('id', membroId);
    await carregar();
  }

  async function atualizarPapel(membroId: string, novoPapel: string) {
    await supabase.from('clinica_membros').update({ papel: novoPapel }).eq('id', membroId);
    await carregar();
  }

  async function copiar(url: string) {
    await navigator.clipboard.writeText(url);
    setCopiado(true); setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle><Shield className="inline w-4 h-4 mr-1" /> Equipe da clínica</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        {podeGerenciar && (
          <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
            <div className="text-sm font-medium text-slate-700 mb-2">Convidar novo membro</div>
            <div className="grid grid-cols-12 gap-2">
              <Input className="col-span-6" type="email" placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
              <Select className="col-span-3" value={papel} onChange={e => setPapel(e.target.value)}>
                <option value="avaliador">Avaliador</option>
                <option value="admin">Admin</option>
              </Select>
              <Button className="col-span-3" onClick={convidar} disabled={!email || convitando}>
                <UserPlus className="w-4 h-4" /> Convidar
              </Button>
            </div>
            {inviteLink && (
              <div className="mt-3 flex items-center gap-2 rounded bg-white border border-slate-200 p-2">
                <code className="flex-1 text-xs text-slate-600 truncate">{inviteLink}</code>
                <Button size="sm" variant="secondary" onClick={() => copiar(inviteLink)}>
                  {copiado ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                </Button>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Se o e-mail já é cadastrado no sistema, o membro é adicionado direto. Caso contrário, envie este link para a pessoa criar conta.
            </p>
          </div>
        )}

        {loading ? <p className="text-slate-500 text-sm">Carregando…</p> : (
          <div className="divide-y divide-slate-100">
            {membros.map(m => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-sm">{m.avaliadores?.nome ?? m.user_id.slice(0, 8)}</div>
                  <div className="text-xs text-slate-500">Desde {new Date(m.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="flex items-center gap-2">
                  {podeGerenciar && m.papel !== 'owner' ? (
                    <Select value={m.papel} onChange={e => atualizarPapel(m.id, e.target.value)} className="h-8 text-xs min-w-[100px]">
                      <option value="avaliador">Avaliador</option>
                      <option value="admin">Admin</option>
                    </Select>
                  ) : (
                    <span className={`text-xs px-2 py-1 rounded-full ${m.papel === 'owner' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {m.papel}
                    </span>
                  )}
                  {podeGerenciar && m.papel !== 'owner' && (
                    <Button size="sm" variant="ghost" onClick={() => remover(m.id)}><Trash2 className="w-3 h-3" /></Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
