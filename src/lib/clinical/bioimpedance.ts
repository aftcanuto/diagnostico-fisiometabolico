export interface BioimpedanceAsymmetry {
  componente: 'Massa magra' | 'Gordura';
  segmento: 'Braços' | 'Pernas';
  unidade: 'kg' | '%';
  direita: number;
  esquerda: number;
  diferenca_absoluta: number;
  assimetria_percentual: number;
  maior_lado: 'direito' | 'esquerdo' | 'iguais';
}

export interface BioimpedanceSummary {
  agua_corporal_kg: number | null;
  agua_corporal_percentual_peso: number | null;
  peso_kg: number | null;
  assimetrias: BioimpedanceAsymmetry[];
}

function numero(valor: unknown): number | null {
  if (valor == null || valor === '') return null;
  const parsed = Number(String(valor).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function valorSegmentar(valor: unknown, campo: 'kg' | 'pct'): number | null {
  if (valor && typeof valor === 'object') return numero((valor as Record<string, unknown>)[campo]);
  return campo === 'kg' ? numero(valor) : null;
}

function assimetria(
  componente: BioimpedanceAsymmetry['componente'],
  segmento: BioimpedanceAsymmetry['segmento'],
  direitaRaw: unknown,
  esquerdaRaw: unknown,
): BioimpedanceAsymmetry | null {
  const campo = valorSegmentar(direitaRaw, 'kg') != null && valorSegmentar(esquerdaRaw, 'kg') != null ? 'kg' : 'pct';
  const direita = valorSegmentar(direitaRaw, campo);
  const esquerda = valorSegmentar(esquerdaRaw, campo);
  if (direita == null || esquerda == null) return null;
  const maior = Math.max(Math.abs(direita), Math.abs(esquerda));
  const diferenca = Math.abs(direita - esquerda);
  return {
    componente,
    segmento,
    unidade: campo === 'kg' ? 'kg' : '%',
    direita,
    esquerda,
    diferenca_absoluta: Number(diferenca.toFixed(2)),
    assimetria_percentual: maior > 0 ? Number((diferenca / maior * 100).toFixed(1)) : 0,
    maior_lado: direita === esquerda ? 'iguais' : direita > esquerda ? 'direito' : 'esquerdo',
  };
}

export function resumoInterpretativoBioimpedancia(dados: any): BioimpedanceSummary {
  const peso = numero(dados?.peso_kg);
  const agua = numero(dados?.agua_corporal_kg);
  const aguaPercentualInformada = numero(dados?.agua_corporal_pct);
  const magra = dados?.segmentar_magra ?? dados?.segmentar_massa_magra ?? {};
  const gordura = dados?.segmentar_gordura ?? {};
  const assimetrias = [
    assimetria('Massa magra', 'Braços', magra.braco_dir, magra.braco_esq),
    assimetria('Massa magra', 'Pernas', magra.perna_dir, magra.perna_esq),
    assimetria('Gordura', 'Braços', gordura.braco_dir ?? gordura.braco_d, gordura.braco_esq ?? gordura.braco_e),
    assimetria('Gordura', 'Pernas', gordura.perna_dir ?? gordura.perna_d, gordura.perna_esq ?? gordura.perna_e),
  ].filter((item): item is BioimpedanceAsymmetry => item != null);

  return {
    agua_corporal_kg: agua,
    agua_corporal_percentual_peso: aguaPercentualInformada ?? (agua != null && peso != null && peso > 0
      ? Number((agua / peso * 100).toFixed(1))
      : null),
    peso_kg: peso,
    assimetrias,
  };
}
