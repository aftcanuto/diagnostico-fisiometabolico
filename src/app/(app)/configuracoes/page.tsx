import { createClient } from '@/lib/supabase/server';
import { PdfConfigForm } from '@/components/forms/PdfConfigForm';
import { Card, CardBody } from '@/components/ui/Card';
import { BookOpen, Shield } from 'lucide-react';
import { AvaliadorPerfilForm } from '@/components/forms/AvaliadorPerfilForm';
import { ConsentimentosConfigPanel } from '@/components/forms/ConsentimentosConfigPanel';
import { ProtocolosConfigPanel } from '@/components/forms/ProtocolosConfigPanel';

export default async function ConfiguracoesPage() {
  const supabase = createClient();
  const { data: clinicaId } = await supabase.rpc('current_clinica_id');
  const { data: { user } } = await supabase.auth.getUser();
  const { data: perfil } = await supabase
    .from('avaliadores')
    .select('nome, crefito_crm, especialidade')
    .eq('id', user!.id)
    .single();

  let config = null;
  try {
    const { data } = await supabase
      .from('pdf_config')
      .select('*')
      .eq('clinica_id', clinicaId)
      .maybeSingle();
    config = data;
  } catch {}

  const { data: papel } = await supabase.rpc('current_papel');
  const isAdmin = papel === 'admin' || papel === 'owner';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
        <p className="text-sm text-slate-500 mt-1">
          Perfil do avaliador, formulários e textos usados no relatório.
        </p>
      </div>

      <AvaliadorPerfilForm perfil={perfil} />

      {!isAdmin && (
        <Card>
          <CardBody className="py-8 text-center text-slate-500">
            <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            Apenas administradores podem editar as configurações do laudo.
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">Formulários de anamnese</div>
                <p className="text-sm text-slate-500">
                  Crie e gerencie formulários personalizados para diferentes perfis de pacientes.
                </p>
              </div>
            </div>
            <a href="/configuracoes/anamnese-templates"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
              Gerenciar templates
            </a>
          </div>
        </CardBody>
      </Card>

      {isAdmin && (
        <>
          <ConsentimentosConfigPanel clinicaId={clinicaId} />
          <ProtocolosConfigPanel clinicaId={clinicaId} />
          <PdfConfigForm
            clinicaId={clinicaId}
            config={config ?? null}
          />
        </>
      )}
    </div>
  );
}
