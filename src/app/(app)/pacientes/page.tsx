import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Plus, User, ChevronRight, Calendar, FileText } from 'lucide-react';
import { calcIdade } from '@/lib/calculations/antropometria';
import { EditarPacienteModal } from '@/components/EditarPacienteModal';
import { DeletePacienteButton } from '@/components/DeletePacienteButton';

export default async function PacientesPage() {
  const supabase = createClient();

  const { data: pacientes } = await supabase
    .from('pacientes')
    .select(`
      *,
      avaliacoes(id, data, status, scores(global))
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pacientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            {pacientes?.length ?? 0} paciente{(pacientes?.length ?? 0) !== 1 ? 's' : ''} cadastrado{(pacientes?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/pacientes/novo">
          <Button><Plus className="w-4 h-4" /> Novo paciente</Button>
        </Link>
      </div>

      {!pacientes?.length ? (
        <div className="text-center py-16 text-slate-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum paciente cadastrado.</p>
          <Link href="/pacientes/novo" className="inline-block mt-4">
            <Button>Cadastrar primeiro paciente</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {pacientes.map((p: any) => {
            const avals = (Array.isArray(p.avaliacoes) ? p.avaliacoes : [])
              .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime());
            const ultima = avals[0];
            const totalFin = avals.filter((a: any) => a.status === 'finalizada').length;
            const score = Array.isArray(ultima?.scores) ? ultima.scores[0]?.global : ultima?.scores?.global;
            const scoreColor = score == null ? '#94a3b8' : score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

            return (
              <div key={p.id} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-300 hover:shadow-sm transition">
                <div className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-semibold text-base flex-shrink-0">
                  {p.nome.charAt(0).toUpperCase()}
                </div>

                <Link href={`/pacientes/${p.id}`} className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800">{p.nome}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {p.sexo === 'M' ? 'Masculino' : 'Feminino'} · {calcIdade(p.data_nascimento)} anos
                    {p.email && <span className="ml-2">· {p.email}</span>}
                  </div>
                </Link>

                {ultima ? (
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3"/>
                      {new Date(ultima.data).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                      <FileText className="w-3 h-3"/>
                      {totalFin} avaliação{totalFin !== 1 ? 'ões' : ''} finalizada{totalFin !== 1 ? 's' : ''}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 hidden sm:block">Sem avaliações</div>
                )}

                {score != null && (
                  <div className="text-center flex-shrink-0 w-12">
                    <div className="text-lg font-bold" style={{ color: scoreColor }}>{score}</div>
                    <div className="text-xs text-slate-400">score</div>
                  </div>
                )}

                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  <EditarPacienteModal paciente={p} />
                  <DeletePacienteButton pacienteId={p.id} nome={p.nome} />
                </div>

                <Link href={`/pacientes/${p.id}`} className="p-2 rounded-lg hover:bg-slate-50">
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
