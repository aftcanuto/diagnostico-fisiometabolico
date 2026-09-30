import { z } from 'zod';

function validDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const qualificationSchema = z.object({
  status: z.enum(['none', 'pending', 'confirmed']),
  level: z.number().int().min(1).max(4).optional(),
  number: z.string().trim().min(1).max(100).optional(),
  expiry: z.string().refine(validDay, 'Informe uma data de validade real (AAAA-MM-DD).').optional(),
  selfAttested: z.boolean().optional(),
}).superRefine((value, ctx) => {
  if (value.status === 'confirmed' && value.selfAttested !== true) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['selfAttested'], message: 'Confirme explicitamente que a certificacao foi emitida.' });
  }
});

export type IsakQualification = z.infer<typeof qualificationSchema>;

// Pass the report's calendar date as YYYY-MM-DD. Date objects use UTC.
export function qualificationLabel(value: unknown, date: string | Date = new Date()): string {
  const result = qualificationSchema.safeParse(value);
  if (!result.success || !result.data.level) return '';
  const qualification = result.data;
  if (qualification.status === 'pending') {
    return `ISAK Nível ${qualification.level}`;
  }
  if (qualification.status !== 'confirmed' || !qualification.expiry) return '';
  const day = date instanceof Date
    ? (Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '')
    : date;
  if (!validDay(day) || qualification.expiry < day) return '';
  return `Antropometrista ISAK Nível ${qualification.level}`;
}
