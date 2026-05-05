const fs = require('fs');

const envPath = '.env.local';

function readEnv() {
  if (!fs.existsSync(envPath)) {
    throw new Error('Arquivo .env.local não encontrado.');
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

function isFilled(value) {
  return !!value && !/^(SUA_|SEU_|sua_chave|https:\/\/SEU_PROJETO)/i.test(value.trim());
}

function mask(value) {
  if (!isFilled(value)) return 'pendente';
  if (value.length <= 12) return 'preenchido';
  return `${value.slice(0, 7)}...${value.slice(-4)}`;
}

async function testSupabase(env) {
  if (!isFilled(env.NEXT_PUBLIC_SUPABASE_URL) || !isFilled(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    return { ok: false, reason: 'URL ou ANON KEY pendente' };
  }
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    });
    return { ok: res.ok, status: res.status, reason: res.ok ? 'conectou' : await res.text() };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

async function testAnthropic(env) {
  if (!isFilled(env.ANTHROPIC_API_KEY)) return { ok: false, reason: 'ANTHROPIC_API_KEY pendente' };
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 20,
        temperature: 0,
        messages: [{ role: 'user', content: 'Responda apenas: ok' }],
      }),
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, reason: res.ok ? 'conectou' : body.slice(0, 280) };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

(async () => {
  const env = readEnv();
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
  ];

  console.log('Configuração local');
  for (const key of required) console.log(`- ${key}: ${mask(env[key] || '')}`);
  console.log(`- ANTHROPIC_MODEL: ${env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'}`);

  const supabase = await testSupabase(env);
  console.log(`\nTeste Supabase: ${supabase.ok ? 'ok' : 'falhou'} (${supabase.reason})`);

  const anthropic = await testAnthropic(env);
  console.log(`Teste Anthropic: ${anthropic.ok ? 'ok' : 'falhou'} (${anthropic.reason})`);

  if (!required.every(key => isFilled(env[key]))) process.exitCode = 1;
})();
