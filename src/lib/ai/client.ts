/**
 * Cliente de IA unificado. Detecta automaticamente qual provedor usar
 * com base nas variáveis de ambiente:
 *   - ANTHROPIC_API_KEY  → usa Claude
 *   - OPENAI_API_KEY     → usa GPT
 * Se nenhum estiver configurado, lança erro claro.
 */

export interface LLMOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
}

export interface LLMResponse {
  text: string;
  modelo: string;
  tokensIn: number;
  tokensOut: number;
  custoUsd: number;
}

const PRICING = {
  'claude-sonnet-4-20250514': { in: 3 / 1e6, out: 15 / 1e6 },
  'claude-3-7-sonnet-20250219': { in: 3 / 1e6, out: 15 / 1e6 },
  'claude-3-5-sonnet-20241022': { in: 3 / 1e6, out: 15 / 1e6 },
  'claude-3-5-haiku-20241022': { in: 0.8 / 1e6, out: 4 / 1e6 },
  'gpt-4o': { in: 2.5 / 1e6, out: 10 / 1e6 },
  'gpt-4o-mini': { in: 0.15 / 1e6, out: 0.6 / 1e6 },
};

const CLAUDE_DEFAULT = 'claude-sonnet-4-20250514';
const CLAUDE_FALLBACKS = [
  CLAUDE_DEFAULT,
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
];

function normalizarModeloClaude(modelo?: string) {
  if (!modelo || modelo === 'claude-sonnet-4-5') return CLAUDE_DEFAULT;
  return modelo;
}

export async function llmCall(opts: LLMOptions): Promise<LLMResponse> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await callClaude(opts);
    } catch (error: any) {
      if (process.env.OPENAI_API_KEY && error?.code === 'CLAUDE_MODEL_UNAVAILABLE') {
        return callOpenAI(opts);
      }
      throw error;
    }
  }
  if (process.env.OPENAI_API_KEY) {
    return callOpenAI(opts);
  }
  throw new Error(
    'Nenhuma chave de IA configurada. Preencha ANTHROPIC_API_KEY no .env.local para usar Claude ou OPENAI_API_KEY para usar OpenAI.'
  );
}

async function callClaude(opts: LLMOptions): Promise<LLMResponse> {
  const preferido = normalizarModeloClaude(process.env.ANTHROPIC_MODEL);
  const modelos = [preferido, ...CLAUDE_FALLBACKS].filter((m, i, arr) => arr.indexOf(m) === i);
  const erros: string[] = [];

  for (const modelo of modelos) {
    try {
      return await callClaudeComModelo(opts, modelo);
    } catch (error: any) {
      if (error?.code !== 'CLAUDE_MODEL_UNAVAILABLE') throw error;
      erros.push(`${modelo}: ${error.message}`);
    }
  }

  const error: any = new Error(
    'Nenhum modelo Claude configurado esta disponivel para esta chave Anthropic. ' +
    'Na Vercel, remova ANTHROPIC_MODEL ou defina um modelo liberado para sua conta. ' +
    'Tambem e possivel configurar OPENAI_API_KEY para usar OpenAI como fallback.'
  );
  error.code = 'CLAUDE_MODEL_UNAVAILABLE';
  error.details = erros;
  throw error;
}

async function callClaudeComModelo(opts: LLMOptions, modelo: string): Promise<LLMResponse> {
  const body: any = {
    model: modelo,
    max_tokens: opts.maxTokens ?? 1500,
    temperature: opts.temperature ?? 0.4,
    system: opts.system + (opts.json ? '\n\nResponda APENAS com JSON válido, sem markdown, sem explicações.' : ''),
    messages: [{ role: 'user', content: opts.user }],
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const erro = await res.text();
    if (res.status === 404) {
      const error: any = new Error(`modelo indisponivel (${res.status})`);
      error.code = 'CLAUDE_MODEL_UNAVAILABLE';
      error.raw = erro;
      throw error;
    }
    throw new Error(`Claude API: ${res.status} ${erro}`);
  }
  const data = await res.json();

  const text = data.content?.[0]?.text ?? '';
  const tokensIn = data.usage?.input_tokens ?? 0;
  const tokensOut = data.usage?.output_tokens ?? 0;
  const price = (PRICING as any)[modelo] ?? PRICING[CLAUDE_DEFAULT];
  const custoUsd = tokensIn * price.in + tokensOut * price.out;

  return { text, modelo, tokensIn, tokensOut, custoUsd };
}

async function callOpenAI(opts: LLMOptions): Promise<LLMResponse> {
  const modelo = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const body: any = {
    model: modelo,
    max_tokens: opts.maxTokens ?? 1500,
    temperature: opts.temperature ?? 0.4,
    messages: [
      { role: 'system', content: opts.system + (opts.json ? '\n\nResponda APENAS com JSON válido.' : '') },
      { role: 'user', content: opts.user },
    ],
    ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY!}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI API: ${res.status} ${await res.text()}`);
  const data = await res.json();

  const text = data.choices?.[0]?.message?.content ?? '';
  const tokensIn = data.usage?.prompt_tokens ?? 0;
  const tokensOut = data.usage?.completion_tokens ?? 0;
  const price = (PRICING as any)[modelo] ?? PRICING['gpt-4o-mini'];
  const custoUsd = tokensIn * price.in + tokensOut * price.out;

  return { text, modelo, tokensIn, tokensOut, custoUsd };
}

/** Extrai JSON do texto retornado (lida com possíveis fences markdown). */
export function parseJSON(txt: string): any {
  const clean = txt.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  try { return JSON.parse(clean); }
  catch { 
    // tenta achar o primeiro { ... } válido
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Resposta da IA não é JSON válido');
  }
}
