import { z } from 'zod';

export const JUMP_PROTOCOLS = { sj: 'Squat Jump (SJ)', vj: 'Vertical Jump (VJ)', cmj: 'Countermovement Jump (CMJ)', dj: 'Drop Jump (DJ)', unilateral_d: 'CMJ unilateral direito', unilateral_e: 'CMJ unilateral esquerdo', repetidos: 'Saltos repetidos - 15 s' } as const;
export type JumpProtocol = keyof typeof JUMP_PROTOCOLS;
export type JumpArmPosition = 'cintura' | 'livres';
const JUMP_PROTOCOL_IDS = ['sj', 'vj', 'cmj', 'dj', 'unilateral_d', 'unilateral_e', 'repetidos'] as const;
const number = (max: number) => z.number().finite().positive().max(max).nullable();
export const jumpTrialSchema = z.object({
  id: z.string().min(1).max(80), protocolo: z.enum(JUMP_PROTOCOL_IDS),
  tecnica_bracos: z.enum(['cintura', 'livres']).optional(),
  altura_cm: number(500), voo_ms: number(5000), contato_ms: number(10000), potencia_w: number(100000),
  status: z.enum(['pendente', 'valida', 'excluida']), justificativa: z.string().max(1500),
});
export const jumpSchema = z.object({
  versao: z.literal(1), peso_kg: number(500), esporte: z.string().max(120), nivel: z.string().max(120),
  equipamento: z.string().min(1).max(180), software: z.string().max(180), metodo_potencia: z.string().max(300),
  altura_queda_cm: z.number().finite().min(5).max(100), duracao_s: z.literal(15),
  bracos: z.enum(['cintura', 'livres']), descanso_s: z.number().int().min(0).max(600),
  familiarizacao: z.boolean(), apto: z.boolean(), repetidos_serie_completa: z.boolean(),
  protocolos: z.array(z.enum(JUMP_PROTOCOL_IDS)).max(7),
  tentativas: z.array(jumpTrialSchema).max(150),
  observacoes: z.string().max(4000), conclusao: z.string().max(8000),
  referencia: z.enum(['nenhuma', 'futebol_cadete', 'futebol_juvenil']),
  referencia_justificativa: z.string().max(1500),
  documento_path: z.string().max(500).nullable(),
}).superRefine((d, ctx) => {
  if (new Set(d.protocolos).size !== d.protocolos.length || new Set(d.tentativas.map(t => t.id)).size !== d.tentativas.length)
    ctx.addIssue({ code: 'custom', message: 'Protocolos ou identificadores duplicados.' });
  for (const t of d.tentativas) {
    if (!d.protocolos.includes(t.protocolo)) ctx.addIssue({ code: 'custom', message: 'Tentativa fora dos protocolos selecionados.' });
    if (t.status === 'excluida' && !t.justificativa.trim()) ctx.addIssue({ code: 'custom', message: 'Justifique a exclusao da tentativa.' });
    if (t.status === 'valida' && t.altura_cm == null && t.voo_ms == null) ctx.addIssue({ code: 'custom', message: 'Tentativa valida exige altura ou tempo de voo.' });
  }
});
export type JumpTrial = z.infer<typeof jumpTrialSchema>;
export type JumpData = z.infer<typeof jumpSchema>;
export function jumpAnalysisUsable(analysis: any, jump: any) {
  if (!['jump_test', 'conclusao_global', 'evolucao'].includes(analysis?.tipo) || !jump?.updated_at) return true;
  const source = analysis?.conteudo?._jump_updated_at;
  return source ? source === jump.updated_at : Date.parse(analysis?.gerado_em ?? '') >= Date.parse(jump.updated_at);
}
export function newJumpTrial(protocolo: JumpProtocol, id: string): JumpTrial {
  const tecnica_bracos = protocolo === 'vj' ? 'cintura' : protocolo === 'cmj' ? 'livres' : undefined;
  return { id, protocolo, tecnica_bracos, altura_cm: null, voo_ms: null, contato_ms: null, potencia_w: null, status: 'pendente', justificativa: '' };
}
export function newJumpData(): JumpData {
  return { versao: 1, peso_kg: null, esporte: '', nivel: '', equipamento: 'JumpTest - 2 placas', software: '', metodo_potencia: 'Pico de potencia informado pelo equipamento; algoritmo do fabricante', altura_queda_cm: 30, duracao_s: 15, bracos: 'cintura', descanso_s: 60, familiarizacao: false, apto: false, repetidos_serie_completa: false, protocolos: [], tentativas: [], observacoes: '', conclusao: '', referencia: 'nenhuma', referencia_justificativa: '', documento_path: null };
}
export function trialMetrics(t: JumpTrial, peso: number | null) {
  const estimada = t.voo_ms == null ? null : 9.80665 * (t.voo_ms / 1000) ** 2 / 8 * 100;
  const altura = t.altura_cm ?? estimada;
  return { altura_cm: altura, altura_mm: altura == null ? null : altura * 10,
    origem_altura: t.altura_cm == null ? 'estimada pelo tempo de voo' : 'informada pelo equipamento',
    potencia_w: t.potencia_w, potencia_w_kg: peso && t.potencia_w != null ? t.potencia_w / peso : null,
    contato_ms: t.contato_ms, voo_ms: t.voo_ms,
    rsi: t.protocolo === 'dj' && altura != null && t.contato_ms ? altura / 100 / (t.contato_ms / 1000) : null };
}
export function trialWarnings(t: JumpTrial): string[] {
  const m = trialMetrics(t, null), issues: string[] = [];
  // These are review flags, never population norms or automatic exclusions.
  if ((m.altura_cm ?? 0) > 100 || (t.voo_ms ?? 0) > 1000) issues.push('Altura/voo muito elevados: conferir coleta.');
  if (t.altura_cm != null && t.voo_ms != null) {
    const estimated = 9.80665 * (t.voo_ms / 1000) ** 2 / 8 * 100;
    if (Math.abs(t.altura_cm - estimated) > Math.max(2, estimated * 0.1)) issues.push('Altura e tempo de voo inconsistentes.');
  }
  if (t.protocolo === 'dj' && t.status === 'valida' && !t.contato_ms) issues.push('Tempo de contato ausente no DJ.');
  return issues;
}
export function mean(values: (number | null)[]) {
  const valid = values.filter((v): v is number => v != null && Number.isFinite(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}
export function jumpProtocolArmPosition(d: JumpData, protocolo: JumpProtocol): JumpArmPosition | 'mista' {
  const explicit = d.tentativas.filter(t => t.protocolo === protocolo && t.tecnica_bracos).map(t => t.tecnica_bracos!);
  if (!explicit.length) return d.bracos;
  return explicit.every(value => value === explicit[0]) ? explicit[0] : 'mista';
}
export function jumpProtocolTechnique(d: JumpData, protocolo: JumpProtocol) {
  const arms = jumpProtocolArmPosition(d, protocolo);
  const armsLabel = arms === 'cintura' ? 'maos na cintura' : arms === 'livres' ? 'bracos livres' : 'tecnica de bracos mista';
  const explicit = d.tentativas.some(t => t.protocolo === protocolo && t.tecnica_bracos);
  if (protocolo === 'sj') return `sem contramovimento; ${armsLabel}${explicit ? '' : ' (registro geral/legado)'}`;
  if (protocolo === 'vj') return `com contramovimento (ciclo alongamento-encurtamento); ${armsLabel}`;
  if (protocolo === 'cmj') return `com contramovimento; ${armsLabel}${explicit ? '' : ' (registro geral/legado)'}`;
  return `${armsLabel}${explicit ? '' : ' (registro geral/legado)'}`;
}
export function validateEnteredJump(t: JumpTrial): JumpTrial {
  if (t.status === 'excluida') return t;
  const candidate: JumpTrial = { ...t, status: 'valida' };
  const hasHeight = (t.altura_cm ?? 0) > 0 || (t.voo_ms ?? 0) > 0;
  return { ...t, status: hasHeight && jumpTrialSchema.safeParse(candidate).success && !trialWarnings(candidate).length ? 'valida' : 'pendente' };
}
export function jumpSummary(d: JumpData) {
  const groups = d.protocolos.map(protocolo => {
    const all = d.tentativas.filter(t => t.protocolo === protocolo);
    const valid = all.filter(t => t.status === 'valida' && (!trialWarnings(t).length || t.justificativa.trim()));
    const metrics = valid.map(t => ({ id: t.id, ...trialMetrics(t, d.peso_kg) }));
    const alturas = metrics.map(m => m.altura_cm).filter((n): n is number => n != null);
    const average = mean(alturas);
    const bestRsi = metrics.filter(m => m.rsi != null).sort((a, b) => b.rsi! - a.rsi!)[0] ?? null;
    const ready = protocolo === 'repetidos' ? valid.length >= 2 : valid.length === 3;
    return { protocolo, n: valid.length, completo: ready, media_cm: average, melhor_cm: alturas.length ? Math.max(...alturas) : null,
      cv_percent: average && alturas.length > 1 ? Math.sqrt(alturas.reduce((s, h) => s + (h - average) ** 2, 0) / (alturas.length - 1)) / average * 100 : null,
      potencia_media_w: metrics.every(m => m.potencia_w != null) ? mean(metrics.map(m => m.potencia_w)) : null,
      potencia_media_w_kg: metrics.every(m => m.potencia_w_kg != null) ? mean(metrics.map(m => m.potencia_w_kg)) : null,
      rsi_medio: mean(metrics.map(m => m.rsi)), melhor_rsi_tentativa: bestRsi,
      contato_medio_ms: mean(metrics.map(m => m.contato_ms)), voo_medio_ms: mean(metrics.map(m => m.voo_ms)),
      primeira_altura_cm: alturas[0] ?? null, ultima_altura_cm: alturas.at(-1) ?? null };
  });
  const by = (p: JumpProtocol) => groups.find(g => g.protocolo === p && g.completo);
  const sj = by('sj'), vj = by('vj'), cmj = by('cmj'), eccentric = vj ?? cmj;
  const right = by('unilateral_d')?.media_cm, left = by('unilateral_e')?.media_cm;
  const issues: string[] = [];
  if (!d.apto) issues.push('Aptidao para os protocolos nao confirmada pelo avaliador.');
  if (!d.familiarizacao) issues.push('Familiarizacao nao confirmada.');
  if (!d.protocolos.length) issues.push('Nenhum protocolo selecionado.');
  if (d.protocolos.includes('repetidos') && !d.repetidos_serie_completa) issues.push('Confirme a transcricao completa da serie continua de 15 segundos.');
  if (d.referencia !== 'nenhuma' && !d.referencia_justificativa.trim()) issues.push('Registre a compatibilidade e as limitacoes da referencia selecionada.');
  for (const g of groups) if (!g.completo) issues.push(`${JUMP_PROTOCOLS[g.protocolo]}: ${g.protocolo === 'repetidos' ? 'registre os saltos da serie de 15 s' : 'necessarias exatamente 3 tentativas validas'}.`);
  for (const t of d.tentativas) {
    if (t.status === 'valida' && t.protocolo === 'dj' && !t.contato_ms) issues.push('DJ valido exige tempo de contato para RSI.');
    if (t.status === 'pendente' && [t.altura_cm, t.voo_ms, t.contato_ms, t.potencia_w].some(v => v != null)) issues.push(`${JUMP_PROTOCOLS[t.protocolo]}: tentativa pendente de revisao.`);
    if (t.status === 'valida' && trialWarnings(t).length && !t.justificativa.trim()) issues.push(`${JUMP_PROTOCOLS[t.protocolo]}: confira e justifique a tentativa sinalizada.`);
  }
  return { grupos: groups, pendencias: issues, pronto: !issues.length,
    eur_altura: sj?.media_cm && eccentric?.media_cm ? eccentric.media_cm / sj.media_cm : null,
    eur_potencia: sj?.potencia_media_w && eccentric?.potencia_media_w ? eccentric.potencia_media_w / sj.potencia_media_w : null,
    eur_protocolo: vj ? 'vj' as const : cmj ? 'cmj' as const : null,
    assimetria_altura_percent: right && left ? Math.abs(right - left) / Math.max(right, left) * 100 : null,
    lado_maior_altura: right && left ? right === left ? 'iguais' : right > left ? 'direito' : 'esquerdo' : null };
}
export function jumpIsSimulated(d: JumpData): boolean {
  return /simulad|simulac|simulaç|fict[ií]ci|dados de teste/i.test(
    [d.observacoes, d.conclusao, d.software, d.metodo_potencia].join(' '),
  );
}

export function jumpClinicalContext(d: JumpData) {
  if (jumpIsSimulated(d)) return { simulado: true, limitacao: 'Dados simulados para teste de software. Resultados omitidos: nao permitem conclusao clinica ou evolucao real.' };
  const summary = jumpSummary(d);
  return summary.pronto
    ? { resultados: summary, tecnicas: Object.fromEntries(d.protocolos.map(protocolo => [protocolo, jumpProtocolTechnique(d, protocolo)])), observacoes: d.observacoes, conclusao_profissional: d.conclusao, metodo_potencia: d.metodo_potencia }
    : { limitacao: 'Jump Test pendente de revisao; nao interpretar resultados', pendencias: summary.pendencias };
}

export function jumpComparable(a: JumpData, b: JumpData, protocolo: JumpProtocol) {
  return a.versao === b.versao && a.equipamento === b.equipamento && a.software === b.software && jumpProtocolArmPosition(a, protocolo) === jumpProtocolArmPosition(b, protocolo) && a.descanso_s === b.descanso_s &&
    a.protocolos.includes(protocolo) && b.protocolos.includes(protocolo) &&
    (protocolo !== 'dj' || a.altura_queda_cm === b.altura_queda_cm) && (protocolo !== 'repetidos' || a.duracao_s === b.duracao_s);
}
export const JUMP_REFERENCES = {
  futebol_cadete: { label: 'Futebol subelite masculino - cadetes', media_cm: 42, dp_cm: 5, n: 18, idade_media: 14.50, idade_dp: 0.51 },
  futebol_juvenil: { label: 'Futebol subelite masculino - juvenis', media_cm: 45, dp_cm: 4, n: 18, idade_media: 17.05, idade_dp: 0.64 },
};
export const JUMP_REFERENCE_URL = 'https://www.apunts.org/en-analisis-del-rendimiento-salto-vertical-articulo-X0213371714491981';
export function jumpReference(d: JumpData) {
  if (d.referencia === 'nenhuma') return null;
  return { ...JUMP_REFERENCES[d.referencia], fonte: 'Garcia-Pinillos et al., 2014. doi:10.1016/j.apunts.2014.05.002', url: JUMP_REFERENCE_URL,
    protocolo: 'CMJ sem bracos na fonte; tecnicamente correspondente ao VJ com maos na cintura deste equipamento; media de 3; FreePower Jump Sensorize; intervalo 30 s',
    limitacao: 'Referencia descritiva de coorte, nao norma universal. Equipamento e descanso podem diferir. Sem percentis ou classificacao automatica.',
    justificativa: d.referencia_justificativa };
}
