'use client';

import { use, useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import LegacyAnthropometryForm from '@/components/LegacyAnthropometryForm';
import AnthropometryForm from '@/components/AnthropometryForm';
import { Button } from '@/components/ui/Button';
import { buscarModulo } from '@/lib/modulos';
import { hasLegacyAnthropometryData } from '@/lib/anthropometry-record';

export default function AntropometriaPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [state, setState] = useState<{ id: string; row: any } | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    setState(null);
    buscarModulo('antropometria', id).then(row => {
      if (active) setState({ id, row });
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Nao foi possivel carregar a antropometria.');
    });
    return () => { active = false; };
  }, [id, attempt]);

  if (error) return <div role="alert" className="space-y-3 text-red-800">
    <p className="flex items-center gap-2"><AlertTriangle size={18} />{error}</p>
    <Button variant="secondary" onClick={() => setAttempt(value => value + 1)}><RotateCcw size={16} /> Tentar novamente</Button>
  </div>;
  if (!state || state.id !== id) return <p role="status">Carregando antropometria...</p>;

  if (hasLegacyAnthropometryData(state.row)) return <div className="space-y-4">
    <p className="border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-900">Avaliacao historica: coleta e metodos legados preservados.</p>
    <LegacyAnthropometryForm {...props} />
  </div>;
  return <AnthropometryForm key={id} avaliacaoId={id} initialRow={state.row?.registro_v2 ? state.row : null} />;
}
