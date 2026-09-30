import type { Method, MeasurementId, Reference } from './catalog';
import type { MeasurementInput } from './schema';
export type Status = 'available'|'missing'|'review'|'invalid';
export interface CalculationContext { date:string; birthDate:string; sex:'M'|'F' }
export interface MeasurementQuality extends MeasurementInput {
  id:MeasurementId; label:string; unit:string; value:number|null; status:Status; reason:string;
  count:number; discrepancyPercent:number|null; requiresThird:boolean;
  consolidation:'none'|'single'|'mean'|'median';
}
export interface Result {
  id:string; label:string; value:number|null; unit:string; status:Status; reason:string;
  methodId:string; methodVersion:string; referenceIds:string[];
  inputs:Record<string,number|string|boolean|null>; selected:boolean; classification:string|null;
}
export interface Somatotype {
  endomorphy:number|null; mesomorphy:number|null; ectomorphy:number|null;
  x:number|null; y:number|null; classification:string|null; status:Status; reason:string;
}
export interface AnthropometryResults {
  version:2; engineVersion:string; catalogVersion:string; calculatedAt:string;
  context:CalculationContext; age:number|null;
  collection:{protocol:string;manualEdition:string};
  measurements:Record<MeasurementId,MeasurementQuality>;
  results:Result[]; phantom:Result[]; somatotype:Somatotype;
  methodMeta:Method[]; references:Reference[];
}
