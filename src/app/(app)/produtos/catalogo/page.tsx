import { createClient } from '@/lib/supabase/server';
import { CatalogoConfigForm } from '@/components/forms/CatalogoConfigForm';

export default async function ConfigurarCatalogoPage() {
  const supabase = createClient();
  const { data: clinicaId } = await supabase.rpc('current_clinica_id');
  const { data: clinica } = await supabase
    .from('clinicas')
    .select('id,catalogo_titulo,catalogo_subtitulo,catalogo_rodape_titulo,catalogo_rodape_texto')
    .eq('id', clinicaId)
    .maybeSingle();

  if (!clinica) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Nao foi possivel localizar a clinica atual.
      </div>
    );
  }

  return <CatalogoConfigForm clinica={clinica} catalogoHref={`/catalogo/${clinica.id}`} />;
}
