import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { PortalPaciente } from '@/components/PortalPaciente';
import { Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PortalPacientePage({ params }: { params: { token: string } }) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('paciente_dashboard_por_token', { p_token: params.token });

  if (error || !data) return notFound();

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header fixo simples */}
      <header style={{
        background: 'white', borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px',
          height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#059669',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={16} color="white"/>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
              Meu Diagnóstico Fisiometabólico
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Portal exclusivo do paciente</div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <PortalPaciente
          paciente={data.paciente}
          avaliador={data.avaliador}
          avaliacoes={data.avaliacoes ?? []}
        />
      </main>
    </div>
  );
}
