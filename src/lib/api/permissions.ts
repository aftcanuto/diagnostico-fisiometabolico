import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function getUserId() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getClinicaId() {
  const supabase = createClient();
  const { data } = await supabase.rpc('current_clinica_id');
  return data ?? null;
}

export async function usuarioPodeAcessarPaciente(userId: string, pacienteId: string) {
  const supabase = createClient();
  const { data: pacienteVisivel } = await supabase
    .from('pacientes')
    .select('id')
    .eq('id', pacienteId)
    .maybeSingle();

  if (pacienteVisivel?.id) return true;

  const admin = createAdminClient();
  const { data: paciente, error: erroPaciente } = await admin
    .from('pacientes')
    .select('id, avaliador_id, clinica_id')
    .eq('id', pacienteId)
    .maybeSingle();

  if (erroPaciente || !paciente) return false;
  if (paciente.avaliador_id === userId) return true;
  if (!paciente.clinica_id) return false;

  const { data: membro, error: erroMembro } = await admin
    .from('clinica_membros')
    .select('id')
    .eq('clinica_id', paciente.clinica_id)
    .eq('user_id', userId)
    .eq('ativo', true)
    .maybeSingle();

  return !erroMembro && !!membro;
}

export async function templateAnamneseAtivoDaClinica(templateId: string, clinicaId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('anamnese_templates')
    .select('id, clinica_id, ativo')
    .eq('id', templateId)
    .eq('clinica_id', clinicaId)
    .eq('ativo', true)
    .maybeSingle();

  return data ?? null;
}

export async function recomendacoesAtivasDaClinica(recomendacoesIds: string[], clinicaId: string) {
  const ids = [...new Set(recomendacoesIds.filter(Boolean))];
  if (ids.length === 0) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from('protocolo_recomendacoes')
    .select('id')
    .in('id', ids)
    .eq('clinica_id', clinicaId)
    .eq('ativo', true);

  return data ?? [];
}
