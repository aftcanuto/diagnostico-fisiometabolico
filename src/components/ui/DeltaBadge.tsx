import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

type Direcao = 'subir_bom' | 'descer_bom'; // o que é "melhora"

interface Props {
  atual: number | null | undefined;
  anterior: number | null | undefined;
  direcao: Direcao;
  unidade?: string;
  casas?: number;
  /** Limiar absoluto para considerar "estável" */
  limiarEstavel?: number;
}

/**
 * Indica evolução em relação à avaliação anterior.
 * - direcao: 'subir_bom' → subir é verde (ex: VO2max, força, scores)
 *            'descer_bom' → descer é verde (ex: %gordura, PA)
 */
export function DeltaBadge({
  atual, anterior, direcao, unidade = '', casas = 1, limiarEstavel = 0.5,
}: Props) {
  if (atual == null || anterior == null) return null;
  const delta = atual - anterior;
  const abs = Math.abs(delta);
  const estavel = abs < limiarEstavel;

  let status: 'melhor' | 'pior' | 'estavel';
  if (estavel) status = 'estavel';
  else if (direcao === 'subir_bom') status = delta > 0 ? 'melhor' : 'pior';
  else status = delta < 0 ? 'melhor' : 'pior';

  const sinal = delta > 0 ? '+' : '';
  const classes = status === 'melhor'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : status === 'pior'
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-slate-50 text-slate-600 border-slate-200';

  const Icon = status === 'melhor' ? TrendingUp : status === 'pior' ? TrendingDown : Minus;

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2 py-0.5', classes)}>
      <Icon className="w-3 h-3" />
      {sinal}{delta.toFixed(casas)}{unidade}
    </span>
  );
}
