'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';

export function DeleteAvaliacaoButton({ avaliacaoId, compact = false }: { avaliacaoId: string; compact?: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function excluir() {
    if (!confirm('Excluir esta avaliação? Todos os módulos, fotos vinculadas no banco e análises desta avaliação serão removidos.')) return;
    setLoading(true);
    const { error } = await supabase.from('avaliacoes').delete().eq('id', avaliacaoId);
    setLoading(false);
    if (error) {
      alert('Não foi possível excluir: ' + error.message);
      return;
    }
    router.refresh();
  }

  return (
    <Button size="sm" variant="danger" onClick={excluir} disabled={loading}>
      <Trash2 className="w-3.5 h-3.5" /> {compact ? '' : loading ? 'Excluindo...' : 'Excluir'}
    </Button>
  );
}
