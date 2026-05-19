'use client';

import { buscarModulo } from '@/lib/modulos';

type PacienteBase = {
  peso_base_kg?: number | string | null;
  altura_cm?: number | string | null;
  peso?: number | string | null;
  peso_kg?: number | string | null;
  altura?: number | string | null;
  estatura?: number | string | null;
  estatura_cm?: number | string | null;
};

export type DadosCorporaisBase = {
  pesoKg: number | null;
  alturaCm: number | null;
  origemPeso: string | null;
  origemAltura: string | null;
};

function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function primeiro(...valores: Array<{ valor: unknown; origem: string }>) {
  for (const item of valores) {
    const valor = num(item.valor);
    if (valor != null) return { valor, origem: item.origem };
  }
  return { valor: null, origem: null };
}

export async function buscarDadosCorporaisBase(
  avaliacaoId: string,
  paciente?: PacienteBase | null
): Promise<DadosCorporaisBase> {
  const [bio, ant] = await Promise.all([
    buscarModulo('bioimpedancia', avaliacaoId).catch(() => null),
    buscarModulo('antropometria', avaliacaoId).catch(() => null),
  ]);

  const peso = primeiro(
    { valor: ant?.peso, origem: 'antropometria' },
    { valor: bio?.peso_kg, origem: 'bioimpedancia' },
    { valor: paciente?.peso_base_kg, origem: 'cadastro do paciente' },
    { valor: paciente?.peso, origem: 'cadastro do paciente' },
    { valor: paciente?.peso_kg, origem: 'cadastro do paciente' }
  );

  const altura = primeiro(
    { valor: ant?.estatura, origem: 'antropometria' },
    { valor: bio?.altura_cm, origem: 'bioimpedancia' },
    { valor: paciente?.altura_cm, origem: 'cadastro do paciente' },
    { valor: paciente?.estatura, origem: 'cadastro do paciente' },
    { valor: paciente?.estatura_cm, origem: 'cadastro do paciente' },
    { valor: paciente?.altura, origem: 'cadastro do paciente' }
  );

  return {
    pesoKg: peso.valor,
    alturaCm: altura.valor,
    origemPeso: peso.origem,
    origemAltura: altura.origem,
  };
}

export function aplicarBaseSeVazio<T extends Record<string, any>>(
  form: T,
  base: DadosCorporaisBase,
  campos: { peso?: keyof T; altura?: keyof T }
): T {
  const proximo = { ...form };
  if (campos.peso && (proximo[campos.peso] == null || proximo[campos.peso] === '') && base.pesoKg != null) {
    proximo[campos.peso] = String(base.pesoKg) as T[keyof T];
  }
  if (campos.altura && (proximo[campos.altura] == null || proximo[campos.altura] === '') && base.alturaCm != null) {
    proximo[campos.altura] = String(base.alturaCm) as T[keyof T];
  }
  return proximo;
}
