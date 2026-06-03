# HANDOFF - Diagnostico Fisiometabolico

Documento de continuidade do projeto. Leia este arquivo antes de continuar em outro computador, outra conversa ou outro agente.

## Regras de continuidade

- Toda mudanca deve ser registrada neste arquivo no mesmo ciclo de trabalho.
- Se houver migration nova, informar explicitamente o arquivo SQL e orientar aplicacao no Supabase.
- A cada correcao concluida, entregar o comando de deploy.
- Fazer uma correcao por vez quando o usuario estiver validando em producao.
- Manter dashboards, portal do paciente e PDF na mesma ordem dos modulos.
- Nao mencionar IA no PDF do paciente nem no dashboard do paciente.
- Evitar caracteres corrompidos. Preferir texto ASCII neste arquivo quando possivel.

## Caminhos e repositorio

Projeto local:

`C:\Users\canut\Documents\Codex\2026-04-27\files-mentioned-by-the-user-diagnostico\unzipped\diagnostico-fisiometabolico`

GitHub:

`https://github.com/aftcanuto/diagnostico-fisiometabolico`

Producao:

`https://diagnostico-fisiometabolico.vercel.app`

Supabase:

`https://kjfhhrdfsgvdqygbvmwb.supabase.co`

## Stack

- Next.js 14 App Router
- TypeScript
- Supabase Auth, Postgres, Storage e RLS
- Tailwind CSS
- Puppeteer para PDF
- Anthropic Claude API para analises clinicas

## Comandos uteis

Entrar na pasta:

```powershell
cd "C:\Users\canut\Documents\Codex\2026-04-27\files-mentioned-by-the-user-diagnostico\unzipped\diagnostico-fisiometabolico"
```

Testes principais:

```powershell
npm.cmd run predeploy
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run test:full
```

Deploy via GitHub/Vercel:

```powershell
cd "C:\Users\canut\Documents\Codex\2026-04-27\files-mentioned-by-the-user-diagnostico\unzipped\diagnostico-fisiometabolico"
git add .
git commit -m "Mensagem objetiva da alteracao"
git push
```

## Variaveis de ambiente esperadas

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `NEXT_PUBLIC_APP_URL`

Observacao: `NEXT_PUBLIC_SUPABASE_URL` deve ser a URL base do Supabase, sem `/rest/v1`.

## Ordem oficial dos modulos

1. Anamnese
2. Sinais vitais
3. Posturografia
4. Bioimpedancia
5. Antropometria
6. Flexibilidade
7. Forca
8. RML
9. Cardiorrespiratorio
10. Biomecanica da corrida
11. Revisao e conclusao
12. Plano de acao / orientacao nutricional / evolucao quando aplicavel

## Estado funcional atual

O sistema possui:

- Dashboard clinico do avaliador.
- Dashboard/portal do paciente por link.
- Relatorio PDF com layout premium.
- Anamnese dinamica por template.
- Pre-atendimento com links de anamnese.
- TCLE/consentimento com aceite digital e comprovante.
- Central de documentos do paciente.
- Prontuario longitudinal do paciente.
- Produtos e vitrine publica de produtos.
- Configuracao de clinica, avaliador, PDF, referencias e protocolos.
- Orientacao nutricional aplicada apos avaliacao.
- Plano de acao aplicado apos avaliacao.
- Backup em planilha.
- Painel de saude do sistema.
- Analises por IA por modulo e conclusao global.
- Biblioteca de referencias clinicas.
- Teste visual do PDF em `npm run predeploy`.

## Regras criticas de negocio

- Isolamento por clinica via RLS e `current_clinica_id()`/membership.
- Avaliador/membro so acessa dados da propria clinica.
- Paciente so acessa portal por token valido, ativo e nao expirado.
- Links revogados nao devem continuar visiveis como ativos.
- Dados sensiveis de anamnese so entram no PDF/portal se marcados para exibicao.
- PDF e portal do paciente devem usar texto revisado/versao PDF-paciente, nao texto tecnico bruto.
- Se houver divergencia entre gordura por bioimpedancia e antropometria, o checklist deve pedir a fonte a usar.
- Quando apenas preensao palmar for realizada, o score de forca deve ser calculado pela preensao e mostrar observacao de limitacao.
- RML deve aparecer com score no dashboard e PDF.
- Cardiorrespiratorio deve mostrar apenas Z1-Z5.
- Biomecanica usa as faixas salvas no sistema para cada metrica, nao referencias internas divergentes.
- Nao exibir a palavra IA no PDF do paciente nem no dashboard do paciente.

## Migrations recentes importantes

- `042_normalize_text_integrity.sql`: normalizacao de textos corrompidos e template de anamnese.
- `043_produtos_schema_alignment.sql`: campos de produto livre, imagem, tipo e anamnese obrigatoria.
- `045_fonte_gordura_relatorio.sql`: fonte unica de gordura corporal no relatorio/dashboard.
- `046_catalogo_textos_clinica.sql`: textos configuraveis da vitrine.
- `047_central_evidencias_legais.sql`: comprovante, hash e dados legais do aceite.
- `048_produto_imagens_bucket_hardening.sql`: bucket `produto-imagens`.
- `049_planos_alimentares_templates_padrao.sql`: templates padrao de orientacao nutricional.
- `050_prontuario_paciente.sql`: prontuario longitudinal.
- `051_system_health_and_evidence_pdf.sql`: painel de saude, migrations aplicadas e PDF de comprovante.
- `052_plano_acao_templates_padrao.sql`: modelos padrao de plano de acao.

Sempre conferir se a migration nova foi aplicada em producao no Supabase antes de considerar o deploy validado.

## Buckets esperados

- `posturografia`
- `branding`
- `biomecanica`
- `produto-imagens`

## APIs e rotas importantes

- `/api/modulos`
- `/api/scores`
- `/api/ia/gerar`
- `/api/ia/editar`
- `/api/pdf`
- `/api/pdf/publico`
- `/api/paciente-tokens`
- `/api/anamnese-links`
- `/api/anamnese-publica`
- `/api/consentimento-links`
- `/api/consentimento-comprovante`
- `/api/protocolo-envios`
- `/api/plano-alimentar`
- `/api/prontuario`
- `/api/admin/health`
- `/catalogo/[clinicaId]`
- `/p/[token]`
- `/pre-atendimento/consentimento/[token]`

## Validacoes automatizadas

`npm run predeploy` deve cobrir:

- checagem de integridade de texto;
- auditoria de banco, RLS, buckets e migrations;
- smoke test de relatorio, dashboard clinico e dashboard paciente;
- teste visual do PDF;
- calculos clinicos;
- backup em planilha;
- orientacao nutricional;
- TypeScript;
- lint.

Observacao: em PowerShell, usar `npm.cmd` e `npx.cmd` se scripts forem bloqueados por politica local.

## Pontos corrigidos recentemente

### 2026-06-03 - Painel de saude do sistema

Problema: o painel mostrava `Banco 9/11 tabelas` e erro em `scores` e `paciente_tokens`.

Causa: `/api/admin/health` contava todas as tabelas usando a coluna `id`, mas:

- `scores` usa `avaliacao_id`;
- `paciente_tokens` usa `token`.

Correcao:

- `src/app/api/admin/health/route.ts` passou a usar colunas especificas para essas duas tabelas.
- Sem migration.
- Validado com `npx.cmd tsc --noEmit` e `npm.cmd run predeploy`.

### 2026-06-03 - Cardiorrespiratorio avancado

- Portal do paciente passou a mostrar velocidades e zonas por limiar apenas quando houver dados reais.
- Zonas limitadas a Z1-Z5.
- Sem migration.

### 2026-06-03 - PDF: Dados Vitais e Corporais

- Secao antiga `Anamnese & Sinais Vitais` renomeada para `Dados Vitais e Corporais`.
- Incluidos dados corporais visuais no padrao do portal do paciente.
- Sem migration.

### 2026-06-03 - PDF: score de RML

- RML incluido no bloco de capacidades avaliadas do PDF.
- Composicao corporal ajustada para evitar punicao excessiva em sobrepeso moderado.
- Sem migration.

### 2026-06-03 - Plano de acao

- Criada migration `052_plano_acao_templates_padrao.sql`.
- Revisao permite selecionar modelo, editar e aplicar plano.
- Plano salvo em `analises_ia.plano_acao`.

### 2026-06-02 - Correcoes de texto e PDF

- Removida mencao visual a IA no PDF/portal do paciente.
- Corrigidos textos corrompidos em componentes principais.
- Restauradas versoes estaveis de `template.ts`, `PortalPaciente.tsx` e `PatientDashboard.tsx` em rodadas pontuais.

### 2026-05-29 - Painel administrativo e evidencias legais

- Painel `Saude do sistema`.
- PDF de comprovante de aceite.
- Teste visual automatizado do PDF.
- Migration `051_system_health_and_evidence_pdf.sql`.

### 2026-05-28 - Prontuario e orientacao nutricional

- Prontuario longitudinal por paciente.
- Importacao de avaliacoes finalizadas.
- Registro manual, edicao e exclusao de eventos.
- Orientacao nutricional aplicada na revisao.
- Templates padrao de orientacao nutricional.
- Bucket de imagem de produtos.

### 2026-05-26 - Central de documentos

- Central na pagina do paciente com laudos, termos, anamneses, recomendacoes e links ativos.
- Termos aceitos aparecem mesmo quando o comprovante vem por fallback do link aceito.

### 2026-05-25 - Anamnese pre-atendimento

- Resposta publica de anamnese sincroniza automaticamente com a avaliacao.
- Se a avaliacao abrir sem dados, o sistema importa a resposta mais recente do paciente.

## Pendencias conhecidas / pontos para validar

- Confirmar em producao se o painel de saude mostra Banco OK apos deploy do ajuste de `scores` e `paciente_tokens`.
- Validar se todas as migrations ate `052` estao aplicadas no Supabase.
- Validar cardiorrespiratorio avancado com avaliacao real que tenha zonas/velocidades preenchidas.
- Validar em PDF real:
  - sem mencao a IA;
  - RML com score;
  - dados vitais e corporais no local correto;
  - sem cards cortados;
  - rodape correto fora da capa.
- Validar se produto com imagem usa bucket `produto-imagens`.
- Validar se aceite de TCLE aparece na Central de Documentos e gera PDF do comprovante.
- Validar se preensao palmar recalcula score de forca em avaliacao reaberta/finalizada.
- Validar se a escolha de fonte de gordura aparece no checklist quando bioimpedancia e antropometria divergem.

## Pendencias de melhoria sugeridas

- Melhorar pagina de vendas/catalogo com filtros, destaque por objetivo e CTA por WhatsApp.
- Adicionar relatorio de evolucao comparativo em PDF separado.
- Criar historico de alteracoes por avaliador em campos criticos.
- Criar importacao/exportacao em lote de pacientes.
- Criar dashboard de indicadores da clinica.
- Criar assistente de revisao antes do PDF para detectar dados incoerentes.
- Criar biblioteca visual de exercicios/recomendacoes vinculada ao plano de acao.

## Como continuar em outro local

1. Abrir PowerShell.
2. Rodar:

```powershell
cd "C:\Users\canut\Documents\Codex\2026-04-27\files-mentioned-by-the-user-diagnostico\unzipped\diagnostico-fisiometabolico"
git pull origin main
npm install --cache .npm-cache --prefer-online
npm.cmd run predeploy
```

3. Se houver erro de migration, aplicar o SQL pendente no Supabase.
4. Corrigir uma pendencia por vez.
5. Atualizar este `HANDOFF.md`.
6. Commitar e subir.

## Ultima atualizacao deste handoff

2026-06-03: arquivo reorganizado para continuidade do projeto, removendo duplicacoes e consolidando estado atual, migrations, regras, validacoes e pendencias.
