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

## Correcao em andamento: salvamento, scores, links e revisao

Em 04/05/2026 foi aplicada uma correcao de fluxo apos testes em producao mostrarem:

- modulos preenchidos sem marcar como "Feito";
- antropometria sem salvar ao clicar em continuar;
- erro 403 ao gravar `scores`;
- erro 400 em `/api/modulos` quando a base nao possui alguma coluna nova;
- imagens de biomecanica falhando no upload;
- score global sem graficos;
- finalizacao sem mensagem de sucesso/erro;
- link do portal do paciente falhando por chave estrangeira em `paciente_tokens.avaliador_id`;
- PDF mais sensivel a RLS ao buscar dados dos modulos.

Mudancas aplicadas:

- botoes "Continuar" salvam explicitamente antes de navegar;
- `scores` agora grava por rota server-side com service role, evitando 403 no navegador;
- revisao calcula e mostra scores mesmo se a persistencia falhar;
- finalizacao usa rota server-side e mostra mensagem de sucesso/erro;
- biomecanica envia imagens por rota server-side;
- link do paciente garante o registro em `avaliadores` antes de criar `paciente_tokens`;
- PDF busca modulos com service role depois de validar usuario autenticado;
- barra de etapas usa regras especificas por modulo para marcar "Feito" apenas quando ha dados reais;
- forca SPTech inicia com articulacoes predefinidas na tela, mas salva apenas testes com medida preenchida;
- `/api/modulos` e `/api/scores` tentam ignorar colunas ausentes para evitar quebra quando alguma migration ainda nao foi aplicada.

Arquivos principais alterados:

- `src/lib/modulos.ts`
- `src/app/api/modulos/route.ts`
- `src/app/api/scores/route.ts`
- `src/app/api/avaliacoes/[id]/finalizar/route.ts`
- `src/app/api/uploads/biomecanica/route.ts`
- `src/app/api/paciente-tokens/route.ts`
- `src/app/api/pdf/route.ts`
- paginas dos modulos `bioimpedancia`, `antropometria`, `flexibilidade`, `cardiorrespiratorio`, `biomecanica`, `forca`, `rml`, `revisao`
- `src/app/(app)/avaliacoes/[id]/layout.tsx`

Validacao local:

- `npm install` falhou no Windows por permissao no cache do npm (`EPERM`), entao lint/build nao rodaram neste ciclo.
- Antes de um proximo deploy grande, tentar limpar o cache do npm ou rodar em outro ambiente e executar `npm run predeploy`.

## Correcao: dashboard do cliente e cardio

Em 04/05/2026 foram ajustados pontos do portal do paciente:

- portal publico `/p/[token]` deixou de depender apenas da RPC `paciente_dashboard_por_token` e agora busca os dados pelo servidor com service role apos validar token ativo. Isso inclui fotos da posturografia, que a RPC mais recente removia.
- dashboard do cliente calcula scores de composicao, forca, flexibilidade, cardio e postura como fallback quando a tabela `scores` vem incompleta.
- score global tambem e recalculado no portal quando `scores.global` esta vazio.
- historico familiar na anamnese passa a ocupar linha inteira abaixo dos outros campos.
- potencial muscular natural passa a inferir estatura por peso/IMC quando a estatura direta nao esta disponivel, permitindo calcular limite estimado.
- recuperacao de FC foi reduzida para 10s, 30s e 60s no modulo cardiorrespiratorio e no dashboard do cliente.
- cards de biomecanica do dashboard cliente ficaram maiores e com layout mais resistente a sobreposicao de numero/status/texto.

Arquivos alterados:

- `src/app/p/[token]/page.tsx`
- `src/components/PortalPaciente.tsx`
- `src/app/(app)/avaliacoes/[id]/cardiorrespiratorio/page.tsx`

## Correcao: geracao de PDF no Vercel

Em 04/05/2026, a rota `/api/pdf?avaliacaoId=...` falhou em producao com erro informando que o Chrome do Puppeteer nao foi encontrado no cache do Vercel.

Causa:

- as rotas de PDF usavam `puppeteer` direto;
- no ambiente serverless da Vercel nao ha garantia de Chrome instalado no caminho esperado pelo Puppeteer.

Correcao aplicada:

- adicionadas dependencias `@sparticuz/chromium` e `puppeteer-core`;
- criado `src/lib/pdf/browser.ts` com `launchPdfBrowser()`;
- em producao/Vercel, o PDF passa a usar Chromium serverless via `@sparticuz/chromium`;
- localmente, segue usando `puppeteer` normal;
- atualizadas as rotas:
  - `src/app/api/pdf/route.ts`
  - `src/app/api/pdf/publico/route.ts`
- atualizado `package-lock.json` com `npm install --package-lock-only --cache .npm-cache --prefer-online`.

Validacao local neste ciclo:

- nao foi rodado build completo porque o ambiente local ainda tem historico de problema de permissao/cache do npm em instalacao completa;
- antes do deploy, o Vercel deve instalar as novas dependencias pelo `package-lock.json`;
- apos deploy, retestar o botao/URL de PDF em producao.

Correcao complementar no mesmo ciclo:

- o deploy falhou em `src/components/PortalPaciente.tsx` porque `anamneseFull` era usado no JSX, mas nao tinha sido declarado;
- `anamneseFull` foi declarado a partir dos campos "Historia Familiar"/"História Familiar";
- `anamneseRest` agora exclui esse campo para que ele apareca apenas em linha inteira, abaixo dos cards menores.

Nova correcao complementar:

- o PDF em producao passou a falhar com `O diretório de entrada "/var/task/.next/server/bin" não existe`;
- `next.config.js` agora deixa `puppeteer`, `puppeteer-core` e `@sparticuz/chromium` como pacotes externos do servidor e inclui `node_modules/@sparticuz/chromium/bin/**/*` no tracing das rotas `/api/pdf` e `/api/pdf/publico`;
- a tela de revisao buscava dados dos modulos direto pelo Supabase no navegador, o que podia voltar vazio por RLS e deixar os graficos de score com "—";
- `src/app/(app)/avaliacoes/[id]/revisao/page.tsx` agora busca modulos por `buscarModulo`, usando a rota interna segura;
- composicao corporal na revisao tambem usa bioimpedancia como fallback quando antropometria nao tem `% gordura`/IMC;
- score de forca na revisao usa preensao quando existir e, se nao houver preensao, calcula um score simples a partir de dinamometria SPTech/tracao e assimetria.

Nova correcao em 04/05/2026:

- antropometria preenchida nao marcava como "Feito";
- `src/app/(app)/avaliacoes/[id]/antropometria/page.tsx` agora salva peso/estatura/dobras mesmo quando nem todos os calculos estao disponiveis;
- `src/app/(app)/avaliacoes/[id]/layout.tsx` passou a reconhecer antropometria concluida por peso, estatura, IMC, percentual de gordura, massa magra, dobras, circunferencias ou diametros;
- PDF em producao falhou com `libnss3.so`; `src/lib/pdf/browser.ts` agora define `AWS_LAMBDA_JS_RUNTIME=nodejs22.x` em Vercel antes de carregar Chromium e reforca flags serverless;
- analise IA falhou porque o modelo `claude-sonnet-4-5` nao existe na API Anthropic;
- `src/lib/ai/client.ts` agora usa `claude-sonnet-4-20250514` como padrao, normaliza `claude-sonnet-4-5` para esse modelo e tenta fallback para `claude-3-5-sonnet-20241022` em erro 404;
- `scripts/check-env.js` foi atualizado para o mesmo modelo padrao.

Correcao complementar da IA:

- a chave Anthropic em producao tambem retornou 404 para `claude-3-5-sonnet-20241022`;
- `src/lib/ai/client.ts` agora tenta, em ordem, o modelo definido em `ANTHROPIC_MODEL`, `claude-sonnet-4-20250514`, `claude-3-7-sonnet-20250219`, `claude-3-5-sonnet-20241022` e `claude-3-5-haiku-20241022`;
- se todos os modelos Claude retornarem 404 e houver `OPENAI_API_KEY`, o app usa OpenAI como fallback;
- se nao houver modelo disponivel, a API retorna erro 400 com instrucao clara para remover/ajustar `ANTHROPIC_MODEL` ou configurar `OPENAI_API_KEY`;
- `src/components/AnalisesIAPanel.tsx` deixou de prefixar o alerta com `Falha:` duplicado.

## Correcao: quebra de paginas no PDF

Em 04/05/2026, apos o PDF voltar a gerar, foi identificado que modulos com muitas informacoes nao quebravam pagina corretamente e ficavam visualmente ruins.

Correcao aplicada:

- `src/lib/pdf/template.ts` deixou de renderizar as paginas de modulo como containers `flex`;
- `.page` agora usa fluxo normal de impressao (`display: block`) para permitir fragmentacao em mais de uma folha;
- `.module` passou a permitir overflow/continuidade de conteudo;
- cards pequenos, KPIs, linhas de tabela, imagens e blocos laterais foram protegidos com `break-inside: avoid`;
- grades e tabelas longas ficaram livres para quebrar entre itens/linhas;
- rodape de identificacao deixou de usar `margin-top:auto`, que dependia de flex e prejudicava paginas longas.

Validar depois do deploy:

1. gerar PDF de uma avaliacao com antropometria/forca/biomecanica cheias;
2. conferir se tabelas longas quebram entre linhas;
3. conferir se cards pequenos nao ficam cortados ao meio;
4. conferir se o rodape aparece ao final do bloco sem sobrepor conteudo.

## Correcao: dashboard publico do paciente

Em 04/05/2026, o link `/p/[token]` passou a abrir com erro client-side e mensagens React minificadas `#425`, `#418` e `#423` no console.

Causa provavel:

- o portal usava `new Date(...).toLocaleDateString(...)` dentro do componente client;
- no SSR da Vercel e no navegador do usuario, datas ISO podem ser formatadas com fuso/locale diferente, gerando HTML diferente na hidratacao.

Correcao aplicada:

- `src/components/PortalPaciente.tsx` agora usa `dataCurtaBR()` e `dataLongaBR()` deterministicas, baseadas em split da string `YYYY-MM-DD`;
- removidas as chamadas `new Date(...).toLocaleDateString(...)` do componente do portal.

Validar depois do deploy:

1. abrir o mesmo link publico `/p/[token]`;
2. confirmar que a pagina nao mostra mais erro client-side;
3. conferir se as datas aparecem corretamente em formato curto e longo.

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

## Correcao: rodape e quebras de pagina do PDF

Em 05/05/2026 foi revisado o problema de rodape e quebra de paginas no PDF.

Problema observado:

- quando um modulo tinha muita informacao, os cards podiam ser cortados no meio;
- o rodape era inserido como bloco HTML dentro da pagina, entao era empurrado pelo conteudo e podia sair da posicao correta;
- apos ajustes anteriores, o PDF ganhou mais quebras e o rodape ficou visualmente instavel.

Causa tecnica:

- `src/lib/pdf/template.ts` injetava o rodape dentro de cada `<section class="page">`, antes do `</section>`;
- isso fazia o rodape participar do fluxo normal do documento, em vez de ser um rodape real de pagina;
- quando o conteudo ultrapassava a altura util da folha, o navegador paginava o conteudo e o rodape podia ficar fora do lugar.

Correcao aplicada:

- criado `renderLaudoFooterHTML(d)` em `src/lib/pdf/template.ts`;
- removida a injecao do rodape dentro do HTML das paginas;
- `src/app/api/pdf/route.ts` e `src/app/api/pdf/publico/route.ts` agora usam `displayHeaderFooter: true`, `footerTemplate` e margem inferior de `11mm`;
- o rodape passou a ser renderizado pelo Puppeteer fora do fluxo do conteudo, com clinica, avaliador, paciente e numeracao `pagina/total`;
- o CSS do PDF foi ajustado para reduzir excesso de altura fixa e melhorar `break-inside/page-break-inside` em cards, KPIs, tabelas, imagens e blocos com borda/arredondamento.

Validacao local:

- `npm run test:full` passou;
- `npm run predeploy` passou;
- tentativa de gerar PDF local diretamente falhou porque esta maquina nao tem Chrome do Puppeteer instalado no cache local, mas a rota de producao usa `@sparticuz/chromium` no Vercel.

Reteste recomendado em producao apos deploy:

1. Gerar PDF de uma avaliacao com bastante informacao em forca, antropometria, cardio e biomecanica.
2. Conferir se os cards nao sao cortados no meio quando couberem inteiros na pagina.
3. Conferir se o rodape fica sempre na margem inferior, com alinhamento uniforme.
4. Conferir se a numeracao de paginas aparece corretamente.

## Correcao: painel clinico sem dados e paginacao rigorosa do PDF

Em 05/05/2026 foram feitos ajustes adicionais apos o painel clinico aparecer apenas com a estrutura visual, sem os dados da avaliacao, e apos nova revisao das quebras do PDF.

Painel clinico:

- arquivo alterado: `src/app/(app)/pacientes/[id]/page.tsx`;
- a pagina continua validando o acesso ao paciente com o cliente normal do Supabase, respeitando a seguranca;
- depois da validacao, os dados completos usados no painel de apresentacao clinica sao carregados com `createAdminClient()`;
- isso inclui avaliacoes finalizadas, scores, anamnese, sinais vitais, posturografia, antropometria, bioimpedancia, flexibilidade, forca, RML, cardiorrespiratorio, biomecanica e analises de IA;
- objetivo: o painel do profissional deve exibir os dados consolidados da avaliacao para retorno/consulta online, diferente da edicao individual dos modulos.

PDF:

- arquivo novo: `src/lib/pdf/pagination.ts`;
- rotas alteradas: `src/app/api/pdf/route.ts` e `src/app/api/pdf/publico/route.ts`;
- antes de gerar o PDF, `prepararPaginacaoLaudo(page)` divide modulos muito longos em fragmentos de pagina;
- a divisao move blocos inteiros para evitar corte de cards e informacoes no meio;
- em paginas de continuacao, o cabecalho do modulo e repetido com visual mais suave e marcador de continuacao;
- o rodape permanece renderizado pelo Puppeteer como footer real, fora do fluxo do HTML.

Validacao local em 05/05/2026:

- `npm run predeploy` passou;
- auditoria do banco passou;
- smoke test passou e gerou previews HTML;
- TypeScript passou;
- lint passou com apenas avisos antigos nao bloqueantes de `<img>` e dependencias de hooks.

## Correcao: numero 0 solto em sinais vitais

Em 05/05/2026 foi corrigido um `0` que aparecia solto fora dos cards na secao de sinais vitais.

Causa:

- alguns campos opcionais de sinais vitais usavam renderizacao condicional com `&&`;
- quando o valor era `0`, o React renderizava o proprio numero `0` em vez de esconder o card.

Correcoes aplicadas:

- `src/components/PatientDashboard.tsx` passou a checar `!= null` para pressao arterial, FC repouso e SpO2;
- frequencia respiratoria agora so renderiza quando existe valor diferente de string vazia;
- `src/components/PortalPaciente.tsx` recebeu o mesmo padrao nos blocos de sinais vitais e cardiorrespiratorio.

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco, smoke test, TypeScript e lint passaram;
- lint manteve apenas avisos antigos nao bloqueantes.

## Correcao: textos de biomecanica fora da caixa

Em 05/05/2026 foi corrigido texto solto no bloco de biomecanica do dashboard clinico.

Problema observado:

- `achados.comentarios_risco` aparecia em uma caixa, mas `achados.observacoes` era exibido como paragrafo solto logo abaixo;
- textos longos ou sem espaco podiam sair visualmente da area do card.

Correcao aplicada:

- `src/components/PatientDashboard.tsx` agora renderiza `achados.observacoes` em uma caixa propria, com fundo claro e borda;
- comentarios de angulos, comentarios de risco e observacoes receberam `overflowWrap: anywhere`;
- isso mantem textos longos dentro do card e preserva o alinhamento do dashboard.

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco, smoke test, TypeScript e lint passaram;
- lint manteve apenas avisos antigos nao bloqueantes.

## Refinamento: dashboard do cliente com identidade, textos e referencias

Em 05/05/2026 foi refinado o dashboard publico do paciente.

Problemas observados:

- anamnese no dashboard do cliente tinha cards desproporcionais e exibia campos tecnicos como `avaliacao_id` e `updated_at`;
- textos longos quebravam a estetica do painel;
- sinais vitais nao ficavam harmonicos em linha;
- analises de IA nao apareciam de forma clara no dashboard do cliente;
- cabecalho do portal nao usava logomarca nem nome da clinica;
- faltava area de referencias antes do historico e um rodape institucional apos o historico;
- em Dados corporais, Somatotipo ficava no lado direito e Metabolismo basal vinha abreviado.

Correcoes aplicadas:

- `src/app/p/[token]/page.tsx` agora busca dados da clinica do paciente e envia para o portal;
- o cabecalho do portal publico passa a usar logomarca da clinica quando cadastrada e mostra o nome da clinica no lado direito;
- `src/components/PortalPaciente.tsx` remove campos tecnicos da anamnese e exibe todos os itens em cards horizontais de largura completa;
- cards de texto longo agora usam reticencias e icone de informacao; ao passar o mouse, abre uma caixa flutuante com o texto completo;
- sinais vitais foram ajustados para cards menores em linha;
- foi criada uma secao `Analises clinicas`, com uma linha por modulo e popup para leitura completa;
- foi criada uma secao `Referencias`, usando `src/lib/clinical/references.ts` e popup com as referencias cadastradas;
- abaixo do historico foi criado um rodape institucional com clinica, avaliador, especialidade, conselho e links clicaveis para WhatsApp, site e endereco;
- `src/components/ui/SilhuetaCircunferencias.tsx` passou a exibir `Somatotipo` do lado esquerdo e `Metabolismo basal` sem abreviacao.

Observacao:

- o campo Instagram ainda depende de coluna propria no Supabase; para nao quebrar a leitura da clinica em producao, o portal continua buscando apenas colunas ja existentes (`nome`, `logo_url`, `telefone`, `email`, `endereco`, `site`).

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco, smoke test, TypeScript e lint passaram;
- lint manteve apenas avisos antigos nao bloqueantes de hooks e uso de `<img>`.

## Ajuste: analise clinica em popup no dashboard clinico

Em 05/05/2026 foi ajustada a exibicao da analise clinica no dashboard do profissional.

Problema observado:

- no bloco de RML, a faixa `Analise clinica` aparecia, mas o texto da IA podia nao ser exibido;
- quando a IA vinha em formato estruturado, o componente tentava ler apenas `texto_editado`.

Correcao aplicada:

- `src/components/PatientDashboard.tsx` recebeu `textoAnaliseClinica()`, que aceita texto simples, `texto_editado`, `texto` ou conteudo estruturado renderizado por `renderAiText()`;
- foi criado `AnaliseInfoTooltip()`;
- no modulo RML, a analise deixou de ocupar uma faixa vazia e passou a aparecer em um icone de informacao ao lado do titulo;
- ao passar o mouse ou focar no icone, abre uma caixa flutuante com o texto completo da analise clinica.

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco, smoke test, TypeScript e lint passaram;
- lint manteve apenas avisos antigos nao bloqueantes.

## Correcao: FFMI sem numero no painel clinico

Em 05/05/2026 foi corrigido o card de FFMI no painel clinico.

Problema observado:

- o card mostrava a barra de potencial muscular, mas o numero principal do FFMI ficava vazio;
- isso acontecia quando o banco nao retornava `antropometria.ffmi` em formato numerico ou nos nomes esperados, mesmo havendo massa magra e estatura suficientes para calcular.

Correcao aplicada:

- `src/components/PatientDashboard.tsx` recebeu `parseNumeroSeguro()`;
- o painel agora tenta ler FFMI salvo em `ffmi`, `ffmiNorm`, `valor` ou `resultado`;
- quando nao houver valor salvo, calcula automaticamente `massa_magra / altura_m²`;
- com massa magra `65.12 kg` e estatura `170 cm`, o painel passa a exibir aproximadamente `22.5`.

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco, smoke test, TypeScript e lint passaram;
- lint manteve apenas avisos antigos nao bloqueantes.

## Refinamento: rodape do PDF e subtitulos orfaos

Em 05/05/2026 foi feito novo ajuste no PDF apos teste visual do laudo real.

Problemas observados:

- em Antropometria, o subtitulo `Circunferencias` podia ficar no fim de uma pagina enquanto os dados iam para a pagina seguinte;
- o rodape estava funcional, mas ainda simples para o padrao visual esperado do relatorio.

Correcoes aplicadas:

- `src/lib/pdf/pagination.ts` agora agrupa subtitulos `.sec-sub` com os blocos/tabelas imediatamente seguintes;
- esse agrupamento recebe `break-inside: avoid`, reduzindo o risco de titulo solto sem conteudo;
- `src/lib/pdf/template.ts` recebeu a classe `.pdf-keep-group` no CSS do PDF;
- `renderLaudoFooterHTML()` foi refinado com faixa de identidade visual, corpo em capsula, sombra leve, informacoes em colunas e numeracao destacada;
- as rotas `src/app/api/pdf/route.ts` e `src/app/api/pdf/publico/route.ts` passaram a usar margem inferior de `13mm` para acomodar o rodape mais refinado.

Validacao local:

- `npm run predeploy` passou;
- smoke test gerou novamente os previews HTML;
- lint permaneceu apenas com avisos antigos nao bloqueantes.

## Correcao: portal do paciente e velocimetro do painel clinico

Em 05/05/2026 foram feitos ajustes apos novo teste em producao.

Problemas observados:

- o portal publico do paciente em `/p/[token]` podia abrir em tela branca com erro de excecao no cliente;
- o numero do score global no painel clinico ficava sobreposto ao ponteiro do velocimetro;
- durante a recuperacao local de arquivo foi criada uma pasta temporaria `.tmp-portal-restore*`, agora ignorada pelo Git.

Correcoes aplicadas:

- `src/components/PortalPaciente.tsx` recebeu `valorParaTela()`;
- `Metrica` e `MetricaHorizontal` agora convertem valores compostos em texto seguro antes de renderizar;
- isso evita quebra quando o banco retorna objetos reais em campos de medida, como dobras ou estruturas com `media`, `valor`, `resultado`, `kg` ou `pct`;
- `src/components/PatientDashboard.tsx` ajustou o `GaugeSVG` do score global, aumentando a area vertical e movendo o numero para baixo do ponteiro;
- `.gitignore` passou a ignorar `.tmp-portal-restore*` para impedir que arquivos temporarios sejam enviados por engano.

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco passou;
- smoke test gerou novamente `preview-laudo.html`, `preview-dashboard-cliente.html`, `preview-dashboard-clinico.html` e `preview-laudo-full-smoke.html`;
- TypeScript passou;
- lint passou com apenas avisos antigos nao bloqueantes de `<img>` e dependencias de hooks.
## Refinamento: padronizacao dos dashboards e popups

Em 05/05/2026 foram aplicados novos ajustes visuais e de consistencia entre o painel clinico e o dashboard do paciente.

Problemas observados:

- campos de anamnese no painel clinico apareciam como JSON/codigo em vez de texto legivel;
- sinais vitais precisavam ocupar melhor a linha com cards menores;
- o score de postura ficava distante do rotulo, dificultando a leitura;
- o somatotipo precisava voltar para o lado direito da silhueta;
- RML do painel clinico estava com visual diferente do dashboard do paciente;
- popups de analises e referencias abriam para baixo perto do fim da pagina, ficando limitados pela tela;
- o grafico de zonas tinha barras/bolhas grandes demais em relacao ao card;
- o rodape do portal precisava ficar mais robusto quando o paciente nao tem `clinica_id`, mas a avaliacao tem.

Correcoes aplicadas:

- `src/components/PatientDashboard.tsx` passou a formatar objetos e arrays de anamnese como texto limpo, com popup para detalhes;
- os popups de anamnese e analises no painel clinico agora abrem para cima e possuem altura maxima com rolagem;
- o bloco de sinais vitais usa grid responsivo com cards menores, permitindo quatro informacoes em linha quando houver espaco;
- o score de postura fica ao lado do texto `Score postura`;
- o RML do painel clinico usa o mesmo conceito de cards numericos do dashboard do paciente;
- `src/components/PortalPaciente.tsx` limita os popups de analises e referencias, abrindo para cima nas secoes finais;
- as referencias agora aparecem numeradas e separadas por linhas, com rolagem dentro da caixa;
- `src/components/ui/SilhuetaCircunferencias.tsx` manteve indicadores principais do lado esquerdo e moveu Somatotipo para os demais dados do lado direito;
- `src/components/ui/ZonasChart.tsx` reduziu a largura das barras, aumentou respiros internos e refinou a posicao dos rotulos;
- `src/app/p/[token]/page.tsx` passou a buscar a clinica tambem pelo `clinica_id` da avaliacao quando o paciente antigo nao tiver esse campo preenchido.

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco passou;
- smoke test gerou novamente os previews do laudo, dashboard do cliente e dashboard clinico;
- TypeScript passou;
- lint passou com apenas avisos antigos nao bloqueantes de hooks e uso de `<img>`.

## Refinamento: leitura dos cards e analises por clique

Em 05/05/2026 foram feitos ajustes finos apos revisao visual dos dashboards.

Problemas observados:

- valores de anamnese e sinais vitais ficavam pesados, em negrito e muito afastados do titulo;
- pressao arterial podia ser cortada em cards estreitos;
- o card de pontos de atencao e risco da biomecanica ficava grudado nos cards de angulo;
- textos de analise ficavam embolados e o balao por hover podia desaparecer durante a leitura;
- flexibilidade no painel clinico ainda usava modelo antigo;
- metricas da biomecanica estavam simplificadas demais;
- alguns modulos do painel clinico nao tinham ponto preparado para mostrar analise de IA.

Correcoes aplicadas:

- `src/components/PortalPaciente.tsx` reduziu peso/tamanho dos valores em `MetricaHorizontal`, aproximando valor e rotulo e evitando corte da pressao arterial;
- o tooltip do portal passou a abrir/fechar por clique, com caixa rolavel e mais controlada;
- o card de `Pontos de atencao e risco` recebeu margem superior para nao ficar colado aos cards anteriores;
- `src/components/PatientDashboard.tsx` passou a abrir os popups de anamnese e analises por clique, com linha de leitura maior e texto menos pesado;
- o RML manteve o padrao de cards numericos aprovado;
- a flexibilidade do painel clinico foi refeita no mesmo conceito visual do dashboard cliente, com numero principal lateral e tentativas em cards;
- a saude cardiovascular foi adicionada ao painel clinico com VO2max, classificacao, FCs, PA, SpO2 e protocolo;
- titulos dos principais modulos no painel clinico receberam ponto de analise por IA, mas o icone so aparece quando ha texto salvo;
- metricas da biomecanica passaram a usar nomes completos, como `Frequencia de passos`, `passos por minuto`, `Tempo de contato com o solo` e `segundos`.

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco passou;
- smoke test gerou novamente os previews do laudo, dashboard cliente e dashboard clinico;
- TypeScript passou;
- lint passou com apenas avisos antigos nao bloqueantes.

## Refinamento: FFMI, RML e biomecanica grafica

Em 05/05/2026 foram aplicados ajustes adicionais solicitados no dashboard do cliente e no painel clinico.

Problemas observados:

- o rodape/contato do portal precisava continuar puxando os dados cadastrados da clinica, incluindo suporte para Instagram;
- os valores de massa magra e massa ossea no card de FFMI estavam sendo cortados com reticencias;
- os cinco cards de RML ficavam quebrando para a segunda linha mesmo quando havia espaco horizontal;
- a biomecanica da corrida no painel clinico ainda usava cards textuais antigos em vez do modelo grafico usado no dashboard do cliente.

Correcoes aplicadas:

- `src/components/PortalPaciente.tsx` ajustou `MetricaHorizontal` para nao truncar valores quando o campo exige `nowrapValor`, corrigindo os numeros do FFMI;
- `src/components/PatientDashboard.tsx` reduziu a largura minima dos cards de RML para permitir cinco cards na mesma linha em telas largas;
- `src/components/PatientDashboard.tsx` passou a renderizar os angulos da biomecanica com o componente grafico `BiomecanicaRunnerCompare`, mantendo comentarios dos achados logo abaixo;
- `src/app/p/[token]/page.tsx` passou a buscar tambem o campo `instagram` da clinica para o rodape clicavel do portal;
- `src/components/forms/ClinicaBrandingForm.tsx` ganhou campo de Instagram na identidade da clinica;
- `supabase/migrations/028_clinica_instagram.sql` adiciona a coluna `instagram` em `clinicas`.

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco passou com 28 migrations, 22 tabelas com RLS e buckets criticos presentes;
- smoke test gerou novamente os previews do laudo, dashboard cliente e dashboard clinico;
- TypeScript passou;
- lint passou com apenas avisos antigos nao bloqueantes de hooks e uso de `<img>`.

## Ajuste: favicon e icone mobile

Em 06/05/2026 foi adicionado o icone oficial do app para navegador e atalhos mobile.

Correcoes aplicadas:

- `public/favicon.png` foi criado a partir da imagem enviada pelo usuario;
- `public/apple-touch-icon.png` foi criado com a mesma identidade visual para atalhos em iPhone/iPad;
- `public/site.webmanifest` foi adicionado para suporte a instalacao/atalho mobile em modo standalone;
- `src/app/layout.tsx` passou a declarar `icons`, `shortcut`, `apple` e `manifest` no metadata global do Next.js.

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco passou;
- smoke test gerou novamente os previews do laudo, dashboard cliente e dashboard clinico;
- TypeScript passou;
- lint passou com apenas avisos antigos nao bloqueantes de hooks e uso de `<img>`.

## Correcao: dashboard principal em branco

Em 06/05/2026 foi corrigida uma falha que podia derrubar `/dashboard` em producao com erro minificado do React.

Problema observado:

- o dashboard principal ficava em branco e o console mostrava `Minified React error #31`, indicando tentativa de renderizar um objeto diretamente na tela;
- a causa mais provavel era algum campo relacional/JSON vindo do Supabase em formato de objeto ou lista na area de ultimas avaliacoes.

Correcoes aplicadas:

- `src/app/(app)/dashboard/page.tsx` passou a normalizar textos com `textoSeguro`, aceitando string, numero, booleano, objeto, lista ou nulo sem quebrar a interface;
- a relacao `pacientes` agora e normalizada por `pacienteDaAvaliacao`, suportando retorno como objeto ou array;
- tipo, status, nome do paciente e data das ultimas avaliacoes passaram a ter fallback seguro;
- textos com caracteres quebrados nessa tela foram simplificados para ASCII, evitando problemas de codificacao no dashboard.

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco passou;
- smoke test gerou novamente os previews do laudo, dashboard cliente e dashboard clinico;
- TypeScript passou;
- lint passou com apenas avisos antigos nao bloqueantes de hooks e uso de `<img>`.

## Correcao: clinica e abertura da avaliacao em producao

Em 06/05/2026 foram aplicadas protecoes adicionais para erros em producao apos navegar para Clinica e para uma avaliacao.

Problemas observados:

- a aba Clinica mostrava erro 400 no console ao buscar `clinica_membros` com relacionamento direto para `avaliadores`;
- ao entrar em uma avaliacao, a tela podia quebrar com `Minified React error #31`, indicando algum objeto sendo renderizado diretamente;
- templates dinamicos de anamnese ou relacionamentos do Supabase poderiam chegar como objeto/lista, especialmente em producao.

Correcoes aplicadas:

- `src/components/ClinicaMembrosPanel.tsx` deixou de usar select relacional direto e passou a carregar membros e nomes de avaliadores em duas consultas simples;
- `src/app/(app)/avaliacoes/[id]/layout.tsx` passou a normalizar paciente, sexo, tipo da avaliacao e dados relacionais antes de renderizar o cabecalho;
- `src/components/ui/StepNav.tsx` passou a transformar labels inesperados em texto seguro antes de mostrar os passos;
- `src/components/ui/Input.tsx` passou a proteger `Field`, `hint` e `error` contra objetos/listas vindos de configuracoes ou banco;
- `src/app/(app)/avaliacoes/[id]/anamnese/page.tsx` passou a proteger labels, placeholders, unidades, opcoes e valores dinamicos do template de anamnese.

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco passou;
- smoke test gerou novamente os previews do laudo, dashboard cliente e dashboard clinico;
- TypeScript passou;
- lint passou com apenas avisos antigos nao bloqueantes de hooks e uso de `<img>`.

## Correcao: contato da clinica e rodape do PDF

Em 06/05/2026 foram corrigidos pontos de identificacao no portal do paciente e no PDF.

Problemas observados:

- o dashboard do paciente buscava o e-mail da clinica, mas nao mostrava esse contato no rodape clicavel;
- o PDF podia usar um avaliador antigo/generico quando a avaliacao ou o token apontava para cadastro incompleto ou ficticio;
- o rodape do PDF nao passava pela mesma limpeza de caracteres aplicada ao corpo do laudo, podendo deixar caracteres quebrados no PDF final.

Correcoes aplicadas:

- `src/components/PortalPaciente.tsx` adicionou botao clicavel de E-mail no rodape do portal, usando o e-mail cadastrado na clinica;
- `src/app/api/pdf/route.ts` passou a buscar tambem o perfil do usuario logado e a escolher um avaliador valido quando o avaliador salvo na avaliacao for generico/incompleto;
- `src/app/api/pdf/publico/route.ts` passou a comparar avaliador do token e avaliador da avaliacao, evitando nomes genericos/ficticios no PDF publico;
- `src/app/api/pdf/publico/route.ts` tambem passou CPF do paciente ao template, mantendo o rodape publico no mesmo padrao do PDF interno;
- `src/lib/pdf/template.ts` passou a aplicar `limparTextoHTML` tambem no `renderLaudoFooterHTML`, corrigindo caracteres quebrados no rodape do PDF.

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco passou;
- smoke test gerou novamente os previews do laudo, dashboard cliente e dashboard clinico;
- TypeScript passou;
- lint passou com apenas avisos antigos nao bloqueantes de hooks e uso de `<img>`.

## Correcao: modulos no painel, portal revogado e biomecanica do PDF

Em 06/05/2026 foram aplicadas correcoes para alinhar os dashboards, o portal do paciente e o PDF final.

Problemas observados:

- no painel clinico faltavam secoes explicitas de bioimpedancia, antropometria e forca muscular;
- links revogados do dashboard do paciente ainda podiam continuar abrindo por cache;
- a capa do PDF quebrava nomes longos de pacientes em duas linhas;
- o PDF interno ainda podia priorizar um avaliador antigo/ficticio salvo na avaliacao;
- a biomecanica do PDF duplicava a analise cinematica, mantendo uma pagina com barras antigas alem do layout aprovado;
- os tres graficos de angulos articulares precisavam permanecer no relatorio, sem retornar ao grafico antigo duplicado.

Correcoes aplicadas:

- `src/components/PatientDashboard.tsx` recebeu secoes proprias para bioimpedancia, antropometria e forca muscular, na ordem cronologica dos modulos da avaliacao;
- a ordem visual do painel clinico foi ajustada para manter cardiovascular e zonas de treino depois de RML e antes da biomecanica;
- `src/app/p/[token]/page.tsx` passou a usar `noStore`, `revalidate = 0` e `fetchCache = 'force-no-store'`, garantindo que token revogado nao continue valido em novas aberturas/atualizacoes da pagina;
- `src/lib/pdf/template.ts` passou a reduzir automaticamente a fonte do nome do paciente na capa para caber em uma linha, sem ficar pequeno demais;
- `src/app/api/pdf/route.ts` passou a priorizar o avaliador cadastrado do usuario logado no PDF interno, evitando nomes ficticios na capa e no rodape;
- `src/lib/pdf/template.ts` removeu a renderizacao duplicada dos graficos antigos de barras horizontais na analise cinematica da biomecanica;
- o PDF manteve a pagina aprovada da biomecanica e os tres graficos enviados de joelho, quadril e cotovelo quando houver imagem cadastrada.

Validacao local:

- `npm run predeploy` passou;
- auditoria do banco passou com 28 migrations, 22 tabelas com RLS e buckets criticos presentes;
- smoke test gerou novamente os previews do laudo, dashboard cliente e dashboard clinico;
- TypeScript passou;
- lint passou com apenas avisos antigos nao bloqueantes de hooks e uso de `<img>`.
