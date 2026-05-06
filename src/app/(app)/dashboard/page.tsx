import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, ClipboardList, TrendingUp, Plus } from 'lucide-react';

function textoSeguro(valor: any, fallback = '-'): string {
  if (valor == null || valor === '') return fallback;
  if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') return String(valor);
  if (Array.isArray(valor)) return textoSeguro(valor[0], fallback);
  if (typeof valor === 'object') {
    return textoSeguro(valor.nome ?? valor.label ?? valor.tipo ?? valor.status ?? valor.id, fallback);
  }
  return fallback;
}

function pacienteDaAvaliacao(avaliacao: any) {
  const rel = avaliacao?.pacientes;
  return Array.isArray(rel) ? rel[0] : rel;
}

export default async function DashboardPage() {
  const supabase = createClient();
  await supabase.auth.getUser();

  const [{ count: totalPacientes }, { count: totalAval }, { data: ultimas }] = await Promise.all([
    supabase.from('pacientes').select('*', { count: 'exact', head: true }),
    supabase.from('avaliacoes').select('*', { count: 'exact', head: true }),
    supabase.from('avaliacoes')
      .select('id,data,status,tipo,paciente_id,pacientes(id,nome)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const emAndamento = (ultimas || []).filter((a: any) => textoSeguro(a.status) === 'em_andamento').length;

  const stats = [
    { label: 'Pacientes', value: totalPacientes ?? 0, icon: Users, color: 'bg-brand-100 text-brand-700' },
    { label: 'Avaliacoes', value: totalAval ?? 0, icon: ClipboardList, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Em andamento', value: emAndamento, icon: TrendingUp, color: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bem-vindo</h1>
          <p className="text-sm text-slate-500">Visao geral das suas avaliacoes</p>
        </div>
        <Link href="/pacientes/novo">
          <Button><Plus className="w-4 h-4" /> Novo paciente</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardBody className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl grid place-items-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                  <div className="text-sm text-slate-500">{s.label}</div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Ultimas avaliacoes</h2>
            <Link href="/pacientes" className="text-sm text-brand-600 hover:underline">Ver todos</Link>
          </div>
          {!ultimas?.length ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Nenhuma avaliacao ainda. Cadastre um paciente para comecar.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {ultimas.map((a: any) => {
                const paciente = pacienteDaAvaliacao(a);
                const status = textoSeguro(a.status, 'em_andamento');
                const data = a.data ? new Date(a.data).toLocaleDateString('pt-BR') : '-';

                return (
                  <Link
                    key={a.id}
                    href={`/pacientes/${paciente?.id ?? a.paciente_id}`}
                    className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 -mx-2 rounded"
                  >
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{textoSeguro(paciente?.nome, 'Paciente')}</div>
                      <div className="text-xs text-slate-500">{data} - {textoSeguro(a.tipo, 'avaliacao')}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      status === 'finalizada' ? 'bg-emerald-100 text-emerald-700' :
                      status === 'em_andamento' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{status.replace('_', ' ')}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
