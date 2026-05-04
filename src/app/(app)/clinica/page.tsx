import { createClient } from '@/lib/supabase/server';
import { ClinicaBrandingForm } from '@/components/forms/ClinicaBrandingForm';
import { ClinicaMembrosPanel } from '@/components/ClinicaMembrosPanel';

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

      <ClinicaMembrosPanel clinicaId={clinicaId} podeGerenciar={papel === 'owner' || papel === 'admin'} />
    </div>
  );
}
