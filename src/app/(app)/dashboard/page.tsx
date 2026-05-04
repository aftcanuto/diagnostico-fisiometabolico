import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, ClipboardList, TrendingUp, Plus } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ count: totalPacientes }, { count: totalAval }, { data: ultimas }] = await Promise.all([
    supabase.from('pacientes').select('*', { count: 'exact', head: true }),
    supabase.from('avaliacoes').select('*', { count: 'exact', head: true }),
    supabase.from('avaliacoes')
      .select('id,data,status,tipo,paciente_id,pacientes(id,nome)')
      .order('created_at', { ascending: false }).limit(5),
  ]);

  const emAndamento = (ultimas || []).filter(a => a.status === 'em_andamento').length;

  const stats = [
    { label: 'Pacientes', value: totalPacientes ?? 0, icon: Users, color: 'bg-brand-100 text-brand-700' },
    { label: 'Avaliações', value: totalAval ?? 0, icon: ClipboardList, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Em andamento', value: emAndamento, icon: TrendingUp, color: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bem-vindo</h1>
          <p className="text-sm text-slate-500">Visão geral das suas avaliações</p>
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
            <h2 className="font-semibold text-slate-800">Últimas avaliações</h2>
            <Link href="/pacientes" className="text-sm text-brand-600 hover:underline">Ver todos</Link>
          </div>
          {!ultimas?.length ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Nenhuma avaliação ainda. Cadastre um paciente para começar.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {ultimas.map((a: any) => (
                <Link key={a.id} href={`/pacientes/${a.pacientes?.id ?? a.paciente_id}`}
                      className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 -mx-2 rounded">
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{a.pacientes?.nome}</div>
                    <div className="text-xs text-slate-500">{new Date(a.data).toLocaleDateString('pt-BR')} · {a.tipo}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    a.status === 'finalizada' ? 'bg-emerald-100 text-emerald-700' :
                    a.status === 'em_andamento' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{a.status.replace('_',' ')}</span>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
