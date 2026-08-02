'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileChartColumn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function GerarEvolucaoButton({ avaliacaoId }: { avaliacaoId: string }) {
  const router = useRouter();
  const [gerando, setGerando] = useState(false);

  async function gerar() {
    setGerando(true);
    try {
      const response = await fetch('/api/ia/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avaliacaoId, tipo: 'evolucao' }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'Não foi possível gerar a evolução.');
      router.push(`/avaliacoes/${avaliacaoId}/revisao#analises-ia`);
    } catch (error: any) {
      alert(error?.message ?? 'Não foi possível gerar a evolução.');
      setGerando(false);
    }
  }

  return (
    <Button variant="secondary" onClick={gerar} disabled={gerando}>
      {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileChartColumn className="w-4 h-4" />}
      {gerando ? 'Gerando evolução...' : 'Gerar evolução'}
    </Button>
  );
}
