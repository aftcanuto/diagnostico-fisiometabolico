import type { Sexo } from '@/types';
import { scoreForcaPorPreensao } from '@/lib/scores';
import type { PopulacaoRef } from '@/lib/calculations/forca';

export function numeroClinico(valor: unknown): number | null {
  if (valor == null || valor === '') return null;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  const normalizado = String(valor).replace(',', '.').replace(/[^\d.-]/g, '');
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

function valorEmCaminho(obj: any, caminho: string): unknown {
  return caminho.split('.').reduce((acc, parte) => acc?.[parte], obj);
}

function primeiroNumero(obj: any, caminhos: string[]): number | null {
  for (const caminho of caminhos) {
    const n = numeroClinico(valorEmCaminho(obj, caminho));
    if (n != null && n > 0) return n;
  }
  return null;
}

export function extrairPreensaoPalmar(dados: any) {
  const direita = primeiroNumero(dados, [
    'preensao_dir_kgf',
    'preensao_direita_kgf',
    'preensao_dir',
    'preensao_direita',
    'preensao_palmar_dir_kgf',
    'preensao_palmar_direita_kgf',
    'handgrip_dir_kgf',
    'handgrip_direita_kgf',
    'preensao.dir',
    'preensao.direita',
    'preensao_palmar.dir',
    'preensao_palmar.direita',
    'handgrip.dir',
    'handgrip.direita',
  ]);

  const esquerda = primeiroNumero(dados, [
    'preensao_esq_kgf',
    'preensao_esquerda_kgf',
    'preensao_esq',
    'preensao_esquerda',
    'preensao_palmar_esq_kgf',
    'preensao_palmar_esquerda_kgf',
    'handgrip_esq_kgf',
    'handgrip_esquerda_kgf',
    'preensao.esq',
    'preensao.esquerda',
    'preensao_palmar.esq',
    'preensao_palmar.esquerda',
    'handgrip.esq',
    'handgrip.esquerda',
  ]);

  return { direita, esquerda };
}

export function scoreForcaPorDadosPreensao(dados: any, sexo: Sexo, idade: number): number | null {
  const { direita, esquerda } = extrairPreensaoPalmar(dados);
  return scoreForcaPorPreensao({
    preensaoDir: direita,
    preensaoEsq: esquerda,
    sexo,
    idade,
    populacao: (dados?.populacao_ref ?? 'geral') as PopulacaoRef,
  });
}
