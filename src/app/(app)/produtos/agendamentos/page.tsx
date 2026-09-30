import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CatalogoAgendamentosPanel } from '@/components/CatalogoAgendamentosPanel';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default async function ProdutosAgendamentosPage() {
  const supabase = await createClient();
  const { data: clinicaId } = await supabase.rpc('current_clinica_id');
  if (!clinicaId) return <p className="text-red-600">Clínica não encontrada.</p>;

  await supabase
    .from('catalogo_agendamentos')
    .update({ status: 'expirado' })
    .eq('clinica_id', clinicaId)
    .eq('status', 'aguardando_pagamento')
    .lt('expires_at', new Date().toISOString());

  const { data: agendamentos } = await supabase
    .from('catalogo_agendamentos')
    .select('*')
    .eq('clinica_id', clinicaId)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/produtos" className="mb-2 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar para produtos
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Agendamentos da vitrine</h1>
          <p className="text-sm text-slate-500">Acompanhe pedidos, pagamentos, horários reservados e contatos pelo WhatsApp.</p>
        </div>
        <Link href="/produtos/vitrine"><Button variant="secondary">Produtos da vitrine</Button></Link>
      </div>
      <CatalogoAgendamentosPanel clinicaId={clinicaId} initialItems={agendamentos ?? []} />
    </div>
  );
}
