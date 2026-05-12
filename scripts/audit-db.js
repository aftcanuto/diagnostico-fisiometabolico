const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const migrationsDir = path.join(root, 'supabase', 'migrations');

const expectedTables = [
  'clinicas',
  'clinica_membros',
  'avaliadores',
  'pacientes',
  'avaliacoes',
  'produtos',
  'anamnese',
  'anamnese_templates',
  'sinais_vitais',
  'posturografia',
  'bioimpedancia',
  'antropometria',
  'flexibilidade',
  'forca',
  'rml',
  'cardiorrespiratorio',
  'biomecanica_corrida',
  'scores',
  'analises_ia',
  'ia_uso',
  'paciente_tokens',
  'pdf_config',
  'consentimento_modelos',
  'consentimento_links',
  'consentimento_aceites',
  'protocolo_recomendacoes',
  'protocolo_envios',
  'paciente_anamnese_links',
  'paciente_anamnese_respostas',
];

const expectedAiTypes = [
  'anamnese',
  'sinais_vitais',
  'posturografia',
  'antropometria',
  'bioimpedancia',
  'forca',
  'flexibilidade',
  'rml',
  'cardiorrespiratorio',
  'biomecanica_corrida',
  'conclusao_global',
  'evolucao',
];

function fail(message) {
  throw new Error(message);
}

function unique(values) {
  return [...new Set(values)];
}

function readMigrations() {
  if (!fs.existsSync(migrationsDir)) fail('Pasta supabase/migrations nao encontrada');
  const files = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql')).sort();
  if (files.length === 0) fail('Nenhuma migration SQL encontrada');
  const sql = files.map(file => `\n-- ${file}\n${fs.readFileSync(path.join(migrationsDir, file), 'utf8')}`).join('\n');
  return { files, sql };
}

function audit() {
  const { files, sql } = readMigrations();

  const createdTables = unique(
    [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi)]
      .map(match => match[1])
  );

  const rlsTables = unique(
    [...sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s+enable\s+row\s+level\s+security/gi)]
      .map(match => match[1])
  );

  const missingTables = expectedTables.filter(table => !createdTables.includes(table));
  const missingRls = expectedTables.filter(table => !rlsTables.includes(table));

  const createPolicies = [...sql.matchAll(/create\s+policy\s+(?:"[^"]+"|\S+)\s+on\s+([^\s;]+)/gi)]
    .map(match => ({ index: match.index ?? 0, statement: match[0] }));

  const policiesMissingDrop = createPolicies.filter(policy => {
    const before = sql.slice(Math.max(0, policy.index - 600), policy.index).toLowerCase();
    return !before.includes('drop policy if exists');
  });

  const hasCurrentClinicaId = /create\s+or\s+replace\s+function\s+public\.current_clinica_id\s*\(/i.test(sql);
  const hasCurrentPapel = /create\s+or\s+replace\s+function\s+public\.current_papel\s*\(/i.test(sql);
  const hasPortalRpc = /paciente_dashboard_por_token|get_portal_avaliacao/i.test(sql);

  const hasPosturaBucket = /['"]posturografia['"]/i.test(sql);
  const hasBrandingBucket = /['"]branding['"]/i.test(sql);
  const hasBiomecanicaBucket = /['"]biomecanica['"]/i.test(sql);
  const hasProdutoImagensBucket = /['"]produto-imagens['"]/i.test(sql);

  const hasTracao = /tracao_testes/i.test(sql);
  const hasModeloDinamometria = /modelo_dinamometria/i.test(sql);
  const hasSptech = /sptech_testes/i.test(sql) && /sptech_relacoes/i.test(sql);
  const hasBiomecanicaComentarios = /comentarios_graficos/i.test(sql) && /comentarios_angulos/i.test(sql);
  const hasAnamneseSingleUse = /paciente_anamnese_links[\s\S]*respondido_em/i.test(sql);
  const hasConsentimentoSingleUse = /consentimento_links[\s\S]*aceito_em/i.test(sql);
  const hasProtocolosStatus = /protocolo_envios[\s\S]*status/i.test(sql);

  const hasBioZRemoval = /drop\s+column\s+if\s+exists\s+impedancias/i.test(sql)
    && /drop\s+column\s+if\s+exists\s+impedancia_z/i.test(sql)
    && /drop\s+column\s+if\s+exists\s+z/i.test(sql);
  const hasForbiddenBioZCreate = /create\s+table[\s\S]*bioimpedancia[\s\S]*\b(impedancia_z|impedancias|z_)/i.test(sql)
    && !hasBioZRemoval;

  const sqlLower = sql.toLowerCase();
  const missingAiTypes = expectedAiTypes.filter(type => !sqlLower.includes(`'${type}'`));

  const errors = [
    ...missingTables.map(table => `Tabela esperada nao encontrada nas migrations: ${table}`),
    ...missingRls.map(table => `RLS nao habilitado nas migrations para: ${table}`),
    ...policiesMissingDrop.map(policy => `Policy sem DROP POLICY IF EXISTS antes: ${policy.statement}`),
    !hasCurrentClinicaId && 'Funcao current_clinica_id nao encontrada',
    !hasCurrentPapel && 'Funcao current_papel nao encontrada',
    !hasPortalRpc && 'RPC get_portal_avaliacao nao encontrada',
    !hasPosturaBucket && 'Bucket posturografia nao encontrado nas migrations',
    !hasBrandingBucket && 'Bucket branding nao encontrado nas migrations',
    !hasBiomecanicaBucket && 'Bucket biomecanica nao encontrado nas migrations',
    !hasProdutoImagensBucket && 'Bucket produto-imagens nao encontrado nas migrations',
    !hasSptech && 'Campos SPTech nao encontrados nas migrations',
    !hasModeloDinamometria && 'Campo modelo_dinamometria nao encontrado nas migrations',
    !hasTracao && 'Campo tracao_testes nao encontrado nas migrations',
    !hasBiomecanicaComentarios && 'Campos de comentarios da biomecanica nao encontrados nas migrations',
    !hasAnamneseSingleUse && 'Controle de resposta unica da anamnese publica nao encontrado nas migrations',
    !hasConsentimentoSingleUse && 'Controle de aceite unico de consentimento nao encontrado nas migrations',
    !hasProtocolosStatus && 'Status de envios de protocolo nao encontrado nas migrations',
    hasForbiddenBioZCreate && 'Bioimpedancia parece manter campos de impedancia Z',
    ...missingAiTypes.map(type => `Tipo de IA ausente no check: ${type}`),
  ].filter(Boolean);

  const result = {
    ok: errors.length === 0,
    migrationFiles: files.length,
    tables: createdTables.length,
    rlsEnabled: rlsTables.length,
    policies: createPolicies.length,
    buckets: {
      posturografia: hasPosturaBucket,
      branding: hasBrandingBucket,
      biomecanica: hasBiomecanicaBucket,
      produto_imagens: hasProdutoImagensBucket,
    },
    criticalFields: {
      sptech_testes: hasSptech,
      modelo_dinamometria: hasModeloDinamometria,
      tracao_testes: hasTracao,
      comentarios_biomecanica: hasBiomecanicaComentarios,
      bioimpedancia_z_removida: hasBioZRemoval,
      anamnese_publica_resposta_unica: hasAnamneseSingleUse,
      consentimento_publico_aceite_unico: hasConsentimentoSingleUse,
      protocolo_envio_status: hasProtocolosStatus,
    },
    aiTypes: expectedAiTypes.length - missingAiTypes.length,
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

audit();
