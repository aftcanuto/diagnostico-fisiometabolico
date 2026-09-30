import { createClient } from '@/lib/supabase/server';
import { CatalogoProdutosPanel } from '@/components/forms/CatalogoProdutosPanel';

export default async function ProdutosVitrinePage() {
  const supabase = await createClient();
  const { data: clinicaId } = await supabase.rpc('current_clinica_id');
  if (!clinicaId) return <p className="text-red-600">Clínica não encontrada.</p>;
  return <CatalogoProdutosPanel clinicaId={clinicaId} catalogoHref="/catalogo" />;
}
