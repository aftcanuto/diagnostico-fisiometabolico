import { createClient } from '@/lib/supabase/server';
import { ClinicaBrandingForm } from '@/components/forms/ClinicaBrandingForm';
import { ClinicaMembrosPanel } from '@/components/ClinicaMembrosPanel';
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
        <p className="text-sm text-slate-500">{clinica.nome} · Plano: <b className="capitalize">{clinica.plano}</b></p>
      </div>

      <Card>
        <CardHeader><CardTitle>Plano & uso</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Plano" value={clinica.plano.toUpperCase()} />
          <Stat label="Limite avaliações/mês" value={clinica.limite_avaliacoes_mes} />
          <Stat label="Limite avaliadores" value={clinica.limite_avaliadores} />
          <Stat label="IA habilitada" value={clinica.ia_habilitada ? 'Sim' : 'Não'} />
        </CardBody>
      </Card>

      <ClinicaBrandingForm clinica={clinica} podeEditar={papel === 'owner' || papel === 'admin'} />

      <ClinicaMembrosPanel clinicaId={clinicaId} podeGerenciar={papel === 'owner' || papel === 'admin'} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
