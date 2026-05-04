# Diagnostico Fisiometabolico - Continuidade do Projeto

Este arquivo serve para continuar o trabalho em outro computador ou em uma nova conversa.

## Regra obrigatoria de continuidade

Toda e qualquer mudanca feita no projeto deve atualizar este arquivo no mesmo ciclo de trabalho.

Isso inclui:

- alteracoes de codigo;
- novas migrations ou ajustes no banco;
- mudancas visuais em relatorio, dashboard clinico ou dashboard do paciente;
- correcoes de bug;
- novas regras de negocio;
- comandos importantes executados;
- erros encontrados e como foram corrigidos;
- pendencias que ainda precisam ser testadas ou aplicadas em producao.

Ao trabalhar de outro local ou em outra conversa, antes de alterar o projeto:

1. Ler este `HANDOFF.md`.
2. Fazer a alteracao necessaria.
3. Rodar os testes adequados.
4. Atualizar este `HANDOFF.md` com o que mudou.
5. Fazer commit/push incluindo tambem este arquivo.

Nenhuma mudanca deve ficar apenas na conversa ou apenas no codigo sem registro aqui.

## Repositorio e deploy

- GitHub: https://github.com/aftcanuto/diagnostico-fisiometabolico
- Producao Vercel: https://diagnostico-fisiometabolico.vercel.app
- Stack: Next.js 14, TypeScript, Supabase, Tailwind, Puppeteer, Anthropic Claude.

## Banco Supabase

Projeto Supabase em uso:

- URL publica: `https://kjfhhrdfsgvdqygbvmwb.supabase.co`

As chaves ficam fora do Git, em `.env.local` localmente e em Environment Variables na Vercel.

Variaveis esperadas:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
ANTHROPIC_MODEL
NEXT_PUBLIC_APP_URL
```

Observacao importante: `NEXT_PUBLIC_SUPABASE_URL` deve ser sem `/rest/v1`.

## Estado atual

Ja foram aplicadas correcoes visuais e funcionais no relatorio, dashboard clinico e dashboard do paciente.

Principais pontos ja feitos:

- Relatorio PDF premium com velocimetros refinados.
- Dashboard clinico e dashboard paciente com graficos e secoes completas.
- Biomecanica da corrida com graficos de joelho, quadril e cotovelo.
- Campo de link de video da biomecanica.
- Comentarios livres para biomecanica e graficos.
- Dinamometria SPTech e tracao no modulo Forca.
- Analise IA por modulo, conclusao global e evolucao.
- Perfil do avaliador em Configuracoes.
- Edicao/exclusao de pacientes e avaliacoes.
- Produto padrao com todos os modulos.
- Remocao da area Plano & uso da Clinica.
- Link do portal do paciente por escopo da clinica.
- Autosave da anamnese corrigido para salvar antes de trocar de modulo.
- Barra de etapas indica modulos preenchidos com status "Feito".

## Migrations importantes recentes

- `024_schema_alignment_for_deploy.sql`: alinhamento de forca, biomecanica e remocao de impedancia Z.
- `025_internal_access_and_evaluator_profile.sql`: uso interno, convite, perfil do avaliador e produto completo.
- `026_paciente_tokens_clinica_policies.sql`: policies do portal do paciente por clinica.
- `027_clinica_membership_rls_fix.sql`: corrige RLS para gravar modulos e gerar link do portal usando vinculo real de membro ativo da clinica.

Antes de deploy em ambiente novo, aplicar todas as migrations em ordem.

## Pendencia imediata em producao

Em 04/05/2026, o app em producao apresentou erro 403/RLS ao salvar anamnese e ao gerar link do portal:

- `new row violates row-level security policy for table "paciente_tokens"`
- `POST /rest/v1/anamnese?on_conflict=avaliacao_id 403 Forbidden`

A correcao local e a migration `027_clinica_membership_rls_fix.sql` ja existem. Para resolver em producao:

1. Aplicar a migration 027 no SQL Editor do Supabase.
2. Fazer commit/push da migration 027 para o GitHub.
3. Aguardar redeploy da Vercel.
4. Retestar salvamento da anamnese e geracao do link do portal do paciente.

Atualizacao posterior: como os erros persistiram em producao, foi criada uma correcao mais robusta no codigo:

- `src/app/api/modulos/route.ts`: rota interna segura para buscar/salvar modulos usando service role apos validar que o usuario autenticado e membro ativo da clinica da avaliacao.
- `src/lib/modulos.ts`: `buscarModulo` e `upsertModulo` agora chamam `/api/modulos`, evitando gravacao direta do navegador no Supabase.
- `src/app/api/paciente-tokens/route.ts`: rota interna segura para listar, criar e revogar links do portal do paciente.
- `src/components/ShareTokenPanel.tsx`: painel do link do paciente agora usa `/api/paciente-tokens`.

Essa mudanca foi validada localmente com `npm run predeploy` em 04/05/2026. Resultado: auditoria OK, smoke test OK, TypeScript OK e lint sem erros bloqueantes.

Nova descoberta em 04/05/2026: a pagina especifica da anamnese ainda tinha um `supabase.from('anamnese').upsert(...)` proprio, fora de `src/lib/modulos.ts`. Isso mantinha o erro 403 em producao mesmo depois da criacao de `/api/modulos`.

Correcao aplicada:

- `src/app/(app)/avaliacoes/[id]/anamnese/page.tsx` agora importa `buscarModulo` e `upsertModulo` de `src/lib/modulos.ts`.
- A leitura dos dados salvos da anamnese passou por `buscarModulo('anamnese', params.id)`.
- O salvamento da anamnese passou por `upsertModulo('anamnese', params.id, { respostas, template_id })`.
- Busca de avaliacao e templates continua direta no Supabase, pois sao leituras necessarias e nao eram a origem do erro de POST.

Validacao local apos essa correcao: `npm run predeploy` passou novamente.

Nova correcao em 04/05/2026: apos deploy, `/api/modulos?tabela=anamnese...` retornou 403 `Sem permissao para esta avaliacao`. A causa provavel e compatibilidade com dados antigos em que `avaliacoes.clinica_id` ou o vinculo de clinica nao esta consistente, embora o usuario seja o avaliador dono.

Correcao aplicada:

- `src/app/api/modulos/route.ts`: `usuarioPodeAcessarAvaliacao` agora permite acesso quando:
  - `avaliacoes.avaliador_id` e o usuario logado;
  - ou o usuario e membro ativo da clinica da avaliacao;
  - ou o paciente da avaliacao pertence ao avaliador logado;
  - ou o usuario e membro ativo da clinica do paciente.
- `src/app/api/paciente-tokens/route.ts`: `usuarioPodeAcessarPaciente` agora tambem permite quando `pacientes.avaliador_id` e o usuario logado, alem do vinculo por clinica.

Validacao local apos essa correcao: `npm run predeploy` passou novamente.

Nova correcao em 04/05/2026: o erro 403 em `/api/modulos` persistiu para a anamnese em producao. Para evitar incompatibilidade com dados antigos/migrados, a API passou a considerar tambem a visibilidade RLS normal do usuario:

- `src/app/api/modulos/route.ts`: antes das checagens administrativas, a rota tenta ler a avaliacao com o cliente autenticado normal. Se a avaliacao esta visivel para o usuario pela propria RLS, o acesso e permitido.
- `src/app/api/paciente-tokens/route.ts`: antes das checagens administrativas, a rota tenta ler o paciente com o cliente autenticado normal. Se o paciente esta visivel para o usuario pela propria RLS, o acesso e permitido.

Isso mantem seguranca porque a permissao inicial continua sendo a RLS do Supabase; a service role so e usada depois para executar a gravacao que o RLS estava bloqueando em tabelas filhas.

Validacao local apos essa correcao: `npm run predeploy` passou novamente.

Nova correcao em 04/05/2026: anamnese e sinais vitais passaram a salvar, mas as etapas nao eram marcadas como "Feito" na barra de navegacao.

Causa: `src/app/(app)/avaliacoes/[id]/layout.tsx` calculava o `statusMap` lendo tabelas de modulos com o cliente Supabase normal. Como os dados passaram a ser gravados por rotas seguras com service role, a leitura do layout podia nao enxergar as linhas filhas em dados antigos/RLS.

Correcao aplicada:

- `src/app/(app)/avaliacoes/[id]/layout.tsx` continua validando que a avaliacao e visivel pelo usuario logado.
- Depois disso, usa `createAdminClient()` apenas para ler os dados dos modulos e montar `statusMap`.
- Isso permite marcar corretamente Anamnese, Sinais vitais e demais modulos como "Feito" quando houver dados.

Validacao local: `npm run predeploy` passou novamente.

Depois do deploy dessa correcao, retestar:

1. Salvar anamnese em producao e conferir que nao aparece mais erro 403.
2. Trocar de modulo e voltar para confirmar que os campos continuam preenchidos.
3. Gerar link do portal do paciente.
4. Revogar link do portal do paciente.

## Comandos principais

Instalar:

```bash
npm install
```

Rodar local:

```bash
npm run dev
```

Validar antes de subir:

```bash
npm run predeploy
```

Subir alteracoes:

```bash
git add .
git commit -m "mensagem"
git push
```

## Testes obrigatorios apos cada deploy

1. Login/cadastro.
2. Criar paciente.
3. Editar e excluir paciente teste.
4. Criar avaliacao.
5. Preencher anamnese, clicar Continuar, voltar e conferir campos preenchidos.
6. Conferir se etapa aparece como Feito.
7. Preencher modulos principais.
8. Gerar analise IA por modulo.
9. Gerar conclusao global.
10. Gerar PDF.
11. Abrir dashboard clinico.
12. Abrir dashboard do paciente.
13. Gerar link do portal do paciente e abrir em aba anonima.

## Regras de produto

- App esta sendo tratado como uso interno.
- Nao usar fluxo de plano/cobranca agora.
- Novo cadastro deve iniciar em clinica propria vazia.
- Compartilhamento de dados entre usuarios deve acontecer por convite como membro da clinica.
- Anamnese deve permanecer 100% dinamica via templates.
- Bioimpedancia nao deve ter campos de impedancia Z.
- Fotografias da posturografia devem ser em retrato.
- Migrations devem usar `DROP POLICY IF EXISTS` antes de `CREATE POLICY`.

## Observacoes para continuar

Se uma nova conversa assumir o projeto, primeiro ler:

- `HANDOFF.md`
- `README.md`
- `src/lib/steps.ts`
- `src/lib/pdf/template.ts`
- `src/components/PatientDashboard.tsx`
- `src/components/PortalPaciente.tsx`
- `src/app/(app)/avaliacoes/[id]/layout.tsx`
- `src/app/(app)/avaliacoes/[id]/anamnese/page.tsx`

Depois rodar:

```bash
npm run predeploy
```

## Correcao: menu duplicado no RML

Em 04/05/2026 foi corrigida a duplicacao da barra de etapas no modulo RML.

Causa:
- O layout da avaliacao ja renderiza o menu principal com StepNav.
- A pagina RML tambem renderizava outro StepNav.

Arquivo alterado:
- src/app/(app)/avaliacoes/[id]/rml/page.tsx

Alteracao:
- removido o import de StepNav;
- removida a renderizacao <StepNav steps={steps} />;
- mantido o estado steps, porque ele ainda e usado pelos botoes anterior/proximo.

