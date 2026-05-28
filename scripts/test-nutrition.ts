import { calcularPlanoAlimentar, estimarTmb, listarFontesTmb } from '../src/lib/nutrition/planoAlimentar';

function assert(cond: any, msg: string) {
  if (!cond) throw new Error(msg);
}

const bio = estimarTmb({ sexo: 'M', idade: 35, pesoKg: 76, alturaCm: 170, tmbBioimpedancia: 1650 });
assert(bio.tmbKcal === 1650 && bio.tmbOrigem === 'bioimpedancia', 'TMB em modo automatico deve usar bioimpedancia quando disponivel');

const antroPreferida = estimarTmb({
  sexo: 'M',
  idade: 35,
  pesoKg: 76,
  alturaCm: 170,
  tmbBioimpedancia: 1650,
  tmbAntropometria: 1720,
  tmbFontePreferida: 'antropometria',
});
assert(antroPreferida.tmbKcal === 1720 && antroPreferida.tmbOrigem === 'antropometria', 'Fonte antropometrica escolhida deve prevalecer quando disponivel');

const fallbackSeguro = estimarTmb({
  sexo: 'M',
  idade: 35,
  pesoKg: 76,
  alturaCm: 170,
  tmbFontePreferida: 'bioimpedancia',
});
assert(fallbackSeguro.tmbKcal != null && fallbackSeguro.tmbOrigem === 'mifflin_st_jeor', 'Fonte indisponivel deve cair para estimativa segura');

const mifflin = estimarTmb({ sexo: 'F', idade: 30, pesoKg: 60, alturaCm: 165 });
assert(mifflin.tmbKcal != null && mifflin.tmbOrigem === 'mifflin_st_jeor', 'Fallback Mifflin-St Jeor deve funcionar');

const plano = calcularPlanoAlimentar(
  { sexo: 'M', idade: 35, pesoKg: 76, alturaCm: 170, tmbBioimpedancia: 1650 },
  { fator_atividade: 1.5, ajuste_calorico_kcal: -300, proteina_g_kg: 1.8, gordura_pct: 30, agua_ml_kg: 35, fibras_g: 30 }
);
assert(plano.vetKcal === 2175, 'VET deve considerar fator de atividade e ajuste calorico');
assert(plano.proteinaG === 137, 'Proteina deve ser calculada por g/kg');
assert(plano.carboidratoG != null && plano.carboidratoG > 0, 'Carboidrato deve ser calculado pelo saldo calorico');
assert(plano.aguaMl === 2660, 'Agua deve ser calculada por ml/kg');

const fontes = listarFontesTmb({ sexo: 'M', idade: 35, pesoKg: 76, alturaCm: 170, tmbBioimpedancia: 1650, tmbAntropometria: 1720 });
assert(fontes.some(f => f.id === 'bioimpedancia' && f.disponivel), 'Lista deve informar bioimpedancia disponivel');
assert(fontes.some(f => f.id === 'antropometria' && f.disponivel), 'Lista deve informar antropometria disponivel');

console.log(JSON.stringify({ ok: true, plano }, null, 2));
