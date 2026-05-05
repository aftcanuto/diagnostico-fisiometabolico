import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { PortalPaciente } from '@/components/PortalPaciente';
import { Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PortalPacientePage({ params }: { params: { token: string } }) {
  const supabase = createAdminClient();
  const { data: tok, error: tokenError } = await supabase
    .from('paciente_tokens')
    .select('token, paciente_id, avaliador_id, expira_em, revogado')
    .eq('token', params.token)
    .maybeSingle();

  if (tokenError || !tok || tok.revogado || new Date(tok.expira_em).getTime() < Date.now()) return notFound();

  const [{ data: paciente }, { data: avaliador }, { data: avaliacoes }] = await Promise.all([
    supabase.from('pacientes').select('*').eq('id', tok.paciente_id).single(),
    supabase.from('avaliadores').select('nome, crefito_crm, especialidade').eq('id', tok.avaliador_id).maybeSingle(),
    supabase
      .from('avaliacoes')
      .select(`
        id, data, tipo, status, modulos_selecionados,
        scores(*),
        antropometria(*),
        bioimpedancia(*),
        forca(*),
        flexibilidade(*),
        rml(*),
        cardiorrespiratorio(*),
        posturografia(*),
        sinais_vitais(*),
        anamnese(*),
        biomecanica_corrida(*),
        analises_ia(tipo, conteudo, texto_editado, gerado_em)
      `)
      .eq('paciente_id', tok.paciente_id)
      .eq('status', 'finalizada')
      .order('data', { ascending: true }),
  ]);

  if (!paciente) return notFound();

  const { data: clinica } = paciente.clinica_id
    ? await supabase
      .from('clinicas')
      .select('nome, logo_url, telefone, email, endereco, site')
      .eq('id', paciente.clinica_id)
      .maybeSingle()
    : { data: null };

  const normalizadas = (avaliacoes ?? []).map((a: any) => {
    const um = (v: any) => Array.isArray(v) ? (v[0] ?? null) : v;
    const analises = Array.isArray(a.analises_ia)
      ? Object.fromEntries(a.analises_ia.map((ia: any) => [
          ia.tipo,
          { conteudo: ia.conteudo, texto_editado: ia.texto_editado, gerado_em: ia.gerado_em },
        ]))
      : {};

    return {
      ...a,
      scores: um(a.scores),
      antropometria: um(a.antropometria),
      bioimpedancia: um(a.bioimpedancia),
      forca: um(a.forca),
      flexibilidade: um(a.flexibilidade),
      rml: um(a.rml),
      cardiorrespiratorio: um(a.cardiorrespiratorio),
      posturografia: um(a.posturografia),
      sinais_vitais: um(a.sinais_vitais),
      anamnese: um(a.anamnese),
      biomecanica_corrida: um(a.biomecanica_corrida),
      analises_ia: analises,
    };
  });

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header fixo simples */}
      <header style={{
        background: 'white', borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px',
          height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          {clinica?.logo_url ? (
            <img src={clinica.logo_url} alt="Logo da clinica" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', background: 'white', border: '1px solid #e2e8f0' }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={16} color="white"/>
            </div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
              Meu Diagnóstico Fisiometabólico
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Portal exclusivo do paciente</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
            {clinica?.nome ?? 'Diagnóstico Fisiometabólico'}
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <PortalPaciente
          paciente={paciente}
          avaliador={avaliador ? { nome: avaliador.nome, conselho: avaliador.crefito_crm, especialidade: avaliador.especialidade } : null}
          clinica={clinica}
          avaliacoes={normalizadas}
        />
      </main>
    </div>
  );
}
