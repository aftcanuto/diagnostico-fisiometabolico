import { z } from 'zod';
import { MEASUREMENTS, METHODS, type MeasurementId } from './catalog';

export const nullableNumberSchema = z.preprocess(value => {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!text) return null;
  return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text) ? Number(text.replace(',', '.')) : value;
}, z.number().finite().nullable());
const readingSchema = z.object({
  readings: z.tuple([nullableNumberSchema, nullableNumberSchema, nullableNumberSchema]).default([null,null,null]),
  side: z.enum(['D','E']).default('D'),
  exception: z.string().max(4000).default(''),
}).strict();
const shape = Object.fromEntries(MEASUREMENTS.map(m => [m.id,readingSchema.default({})])) as Record<MeasurementId,z.ZodDefault<typeof readingSchema>>;
export const anthropometrySchema = z.object({
  version: z.literal(2),
  measurements: z.object(shape).strict().default({}),
  methods: z.array(z.string().refine(id => METHODS.some(m => m.id === id), 'Metodo desconhecido')).transform(ids => [...new Set(ids)]).default([]),
  instruments: z.array(z.object({name:z.string().max(300),resolution:nullableNumberSchema.refine(n => n === null || n > 0,'Resolucao deve ser positiva').default(null),unit:z.string().max(30)}).strict()).max(30).default([]),
  conditions: z.string().max(10000).default(''),
  collectionProtocol: z.string().max(2000).default('ISAK - conjunto estrito de 26 medidas'),
  manualEdition: z.string().max(300).default('unknown'),
  notes: z.string().max(20000).default(''),
  populationCategory: z.enum(['asian','africanAmerican','whiteHispanic']).nullable().default(null),
  pregnant: z.boolean().nullable().default(null),
  activityFactor: nullableNumberSchema.default(null),
  activityJustification: z.string().max(4000).default(''),
  targets: z.object({
    fatPercent:nullableNumberSchema.default(null), muscleBoneRatio:nullableNumberSchema.default(null), bmi:nullableNumberSchema.default(null),
    muscleMethod:z.enum(['martin1990','lee2000','kerrMuscle1988']).nullable().default(null),
    boneMethod:z.enum(['martinBone1991','rocha1975']).nullable().default(null),
  }).strict().default({}),
  reportSections: z.array(z.enum(['measurements','results','phantom','somatotype','context','conclusion'])).optional(),
  professionalConclusion:z.string().max(20000).default(''),
}).strict();
export type AnthropometryInput = z.output<typeof anthropometrySchema>;
export type MeasurementInput = AnthropometryInput['measurements'][MeasurementId];
export function newAnthropometry(): AnthropometryInput { return anthropometrySchema.parse({version:2}); }
