import { calcularPlanoAlimentar, estimarTmb } from '../src/lib/nutrition/planoAlimentar';

function assert(cond: any, msg: string) {
  if (!cond) throw new Error(msg);
}

const bio = estimarTmb({ sexo: 'M', idade: 35, pesoKg: 76, alturaCm: 170, tmbBioimpedancia: 1650 });
assert(bio.tmbKcal === 1650 && bio.tmbOrigem === 'bioimpedancia', 'TMB medido por bioimpedancia deve ter prioridade');

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

console.log(JSON.stringify({ ok: true, plano }, null, 2));
