'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';

export function DeletePacienteButton({ pacienteId, nome, compact = false }: { pacienteId: string; nome: string; compact?: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function excluir() {
    if (!confirm(`Excluir ${nome}? Todas as avaliações e dados vinculados a este paciente também serão removidos.`)) return;
    setLoading(true);
    const { error } = await supabase.from('pacientes').delete().eq('id', pacienteId);
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
