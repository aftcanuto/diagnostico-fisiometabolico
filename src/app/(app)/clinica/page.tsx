import { createClient } from '@/lib/supabase/server';
import { ClinicaBrandingForm } from '@/components/forms/ClinicaBrandingForm';
import { ClinicaMembrosPanel } from '@/components/ClinicaMembrosPanel';
import { BackupAvaliacoesButton } from '@/components/BackupAvaliacoesButton';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';

export default async function ClinicaPage() {
  const supabase = createClient();
  const { data: clinicaId } = await supabase.rpc('current_clinica_id');
  const { data: clinica } = await supabase.from('clinicas').select('*').eq('id', clinicaId).single();
  const { data: papel } = await supabase.rpc('current_papel');

  if (!clinica) return <p>Clínica não encontrada.</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Minha Clínica</h1>
        <p className="text-sm text-slate-500">{clinica.nome}</p>
      </div>

      <ClinicaBrandingForm clinica={clinica} podeEditar={papel === 'owner' || papel === 'admin'} />

      <Card>
        <CardHeader>
          <CardTitle>Backup das avaliacoes</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-700">Baixe localmente uma planilha com pacientes, avaliacoes, scores, modulos e analises registradas.</p>
            <p className="text-xs text-slate-500 mt-1">Disponivel para administradores da clinica.</p>
          </div>
          <BackupAvaliacoesButton podeExportar={papel === 'owner' || papel === 'admin'} />
        </CardBody>
      </Card>

      <ClinicaMembrosPanel clinicaId={clinicaId} podeGerenciar={papel === 'owner' || papel === 'admin'} />
    </div>
  );
}
