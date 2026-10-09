import { MEASUREMENTS, type MeasurementId } from './catalog';
import type { MeasurementInput } from './schema';
import type { MeasurementQuality } from './types';

/** Operational plausibility flags, not population norms or hard physiological limits. */
function atypical(id:MeasurementId, value:number):boolean {
  const group = MEASUREMENTS.find(m => m.id === id)!.group;
  if (group === 'skinfold') return value < 1 || value > 80;
  if (group === 'breadth') return value < 2 || value > 20;
  if (group === 'girth') return value < 10 || value > 200;
  if (id === 'mass') return value < 10 || value > 300;
  return value < 40 || value > 250;
}
export function consolidateMeasurement(id:MeasurementId, input:MeasurementInput):MeasurementQuality {
  const meta = MEASUREMENTS.find(m => m.id === id)!;
  const readings:[number|null,number|null,number|null] = [...input.readings];
  const values = readings.filter((v):v is number => v !== null);
  const base:MeasurementQuality = {id,label:meta.label,unit:meta.unit,...input,readings,
    value:null,status:'missing',reason:'Sem leituras',count:values.length,discrepancyPercent:null,
    requiresThird:false,consolidation:'none'};
  if (input.notApplicable) return {...base,reason:`Medida nao aplicavel nesta avaliacao${input.notApplicableReason.trim() ? `: ${input.notApplicableReason.trim()}` : ''}`};
  if (!values.length) return base;
  if (values.some(v => !Number.isFinite(v) || v <= 0)) return {...base,status:'invalid',reason:'Leituras devem ser positivas e finitas'};
  const [a,b] = readings;
  // Halving before addition prevents overflow; normalized difference is bounded by 200%.
  const discrepancy = a !== null && b !== null ? Math.abs(a-b)/(a/2+b/2)*100 : null;
  const requiresThird = discrepancy !== null && discrepancy > meta.discrepancyThreshold;
  const sorted = [...values].sort((a,b) => a-b);
  const value = values.length === 3 ? sorted[1] : values.length === 2 ? values[0]/2+values[1]/2 : values[0];
  const warnings:string[] = [];
  if (values.length < 2 || a === null || b === null) warnings.push('Completar primeira e segunda leituras em rodadas');
  if (requiresThird && readings[2] === null) warnings.push('Discrepancia acima da tolerancia; terceira leitura necessaria');
  if (input.side === 'E') warnings.push(input.exception.trim() ? 'Excecao de lado esquerdo documentada' : 'Lado esquerdo exige justificativa da excecao');
  if (input.side === 'D' && input.exception.trim()) warnings.push('Excecao de coleta documentada');
  if (atypical(id,value)) warnings.push('Valor atipico: conferir unidade, landmark e instrumento; faixa operacional, nao norma clinica');
  return {...base,value,status:warnings.length ? 'review':'available',reason:warnings.join('; '),
    discrepancyPercent:discrepancy,requiresThird,consolidation:values.length === 3 ? 'median' : values.length === 2 ? 'mean':'single'};
}

function calendarDay(value:string):number|null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) return null;
  return date.getTime()/86400000;
}
export function decimalAge(date:string,birthDate:string):number|null {
  const d = calendarDay(date), b = calendarDay(birthDate);
  return d === null || b === null || d < b ? null : (d-b)/365.2425;
}
