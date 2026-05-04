import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: perfil }, { data: clinicaId }] = await Promise.all([
    supabase.from('avaliadores').select('nome').eq('id', user.id).single(),
    supabase.rpc('current_clinica_id'),
  ]);
  const { data: clinica } = clinicaId
    ? await supabase.from('clinicas').select('nome, logo_url').eq('id', clinicaId).single()
    : { data: null };

  return (
    <AppShell
      user={{ nome: perfil?.nome ?? user.email!.split('@')[0], email: user.email! }}
      clinica={clinica}
    >
      {children}
    </AppShell>
  );
}
