import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import CatalogoPageComClinica from './[clinicaId]/page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CatalogoPage() {
  const clinicaId = await resolverClinicaDoCatalogo();
  if (!clinicaId) notFound();

  return <CatalogoPageComClinica params={Promise.resolve({ clinicaId })} />;
}

async function resolverClinicaDoCatalogo() {
  const envClinicaId = process.env.CATALOGO_CLINICA_ID || process.env.NEXT_PUBLIC_CATALOGO_CLINICA_ID;
  if (envClinicaId) return envClinicaId;

  const admin = createAdminClient();
  const { data } = await admin
    .from('clinicas')
    .select('id')
    .eq('ativa', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}
