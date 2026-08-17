# HANDOFF - Diagnostico Fisiometabolico

Documento de continuidade do projeto. Leia este arquivo antes de continuar em outro computador, outra conversa ou outro agente.

## Atualizacoes recentes

### 2026-06-08 - Antropometria sem dobras cutaneas

- PDF, portal do paciente e dashboard clinico exibem dobras somente quando existe ao menos uma medida numerica valida.
- Estruturas vazias de medicao deixam de aparecer como `[object Object]`.
- Campos derivados ausentes, como percentual de gordura, massa magra e massa ossea, deixam de gerar cards vazios no PDF.
- Nao exige migration.

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

## Backup e restauracao

Foi criado o arquivo `BACKUP.md` com o roteiro completo para restaurar o projeto em outro computador, incluindo:

- repositorio GitHub;
- variaveis de ambiente esperadas;
- contas e acessos que precisam ficar guardados;
- buckets e tabelas criticas do Supabase;
- fluxo de restauracao local;
- deploy em producao;
- checklist manual apos restauracao.

As chaves reais nao devem ser gravadas em arquivo versionado. Guardar `SUPABASE_SERVICE_ROLE_KEY` e `ANTHROPIC_API_KEY` em cofre de senhas ou arquivo criptografado externo.

## Ultima atualizacao deste handoff

2026-06-08: corrigida a exibicao de antropometria quando as dobras cutaneas nao foram realizadas.
2026-06-08: recomendacoes pre-teste agora geram link publico com validade de 30 dias, visualizacao sem login e controles para copiar, abrir e revogar. Adicionada migration 053_protocolo_recomendacoes_links.sql.
2026-06-08: atualizada a referencia de queda pelvica na biomecanica para 0 a 2 graus. Avaliacoes antigas sao normalizadas nos dashboards, portal do paciente, PDF e prompts clinicos. Sem migration.
2026-06-10: removida a duplicidade do titulo Flexibilidade no PDF quando o modulo e exibido em pagina propria, preservando o badge do score. Sem migration.
## 2026-06-10 - Padronizacao do score de Flexibilidade no PDF

- O score da pagina exclusiva de Flexibilidade agora usa o mesmo badge de cabecalho dos demais modulos.
- Removido o selo pequeno e deslocado que deixava o score visualmente diferente.
- Mantida a exibicao interna somente no caso legado em que Posturografia e Flexibilidade compartilham a mesma pagina.

## 2026-06-10 - Score da continuacao de Antropometria no PDF

- A pagina de circunferencias passou a ser gerada explicitamente como continuacao de Antropometria.
- O cabecalho da continuacao repete corretamente o score do modulo.
- A analise clinica aparece apenas uma vez, ao final da ultima pagina do modulo.
- Sem migration.

## 2026-06-11 - Botoes de video da Biomecanica no PDF

- Os links dos videos sagital e posterior foram retirados do cabecalho repetido pela paginacao.
- Os botoes agora ficam em um bloco proprio, flexivel e protegido contra quebra entre paginas.
- Evitada a repeticao e a sobreposicao dos botoes nas paginas de continuacao, especialmente em leitores de PDF no celular.
- Sem migration.

## 2026-06-11 - Acentuacao do titulo Plano de acao no PDF

- O titulo da pagina passou de `Plano de acao` para `Plano de ação`.
- Sem alteracao no conteudo clinico ou na estrutura do relatorio.
- Sem migration.

## 2026-06-11 - Acentuacao de Recomendacoes no PDF

- Os rotulos visiveis passaram a exibir `RECOMENDAÇÕES` e `RECOMENDAÇÕES PRÁTICAS`.
- A introducao do plano de acao agora exibe `recomendações para a próxima etapa`.
- Os nomes tecnicos dos campos de dados foram preservados.
- Sem migration.

## 2026-06-11 - Compatibilidade visual do PDF em celulares

- Removidas as sombras coloridas dos badges de score e dos botoes de video da Biomecanica.
- Alguns leitores de PDF em celulares rasterizavam essas sombras como retangulos translucidos ao redor dos elementos.
- Bordas solidas foram mantidas para preservar a definicao visual sem alterar cores, dimensoes ou links.
- Sem migration.

## 2026-06-11 - Posicao do score de Posturografia no PDF

- Quando a Posturografia aparece em pagina propria, o score agora fica no canto superior direito do cabecalho.
- Removido o score duplicado/deslocado do final do conteudo nesse caso.
- Quando Posturografia e Flexibilidade compartilham a pagina, os scores internos continuam identificando cada modulo.
- Sem migration.

## 2026-06-13 - Modernizacao tecnica controlada

- Trabalho realizado na branch `modernizacao-dependencias`, criada a partir do commit estavel `1b23a89`.
- A branch `main` permaneceu intacta como ponto de retorno.
- Next.js atualizado de `14.2.15` para `15.5.19`.
- React e React DOM atualizados de `18.3.1` para `19.2.7`.
- Puppeteer e Puppeteer Core atualizados de `23.11.1` para `24.2.1`.
- Chromium serverless atualizado de `131.0.1` para `133.0.0`, mantendo alinhamento com o gerador de PDF.
- Atualizados tambem Supabase JS, React Hook Form, PostCSS, TSX e tipos do React.
- Rotas e paginas dinamicas adaptadas para `params` assincronos do Next 15.
- Configuracao de pacotes externos e rastreamento do Chromium migrada para as chaves estaveis do Next 15.
- Smoke test atualizado para validar o texto atual `Ver vídeo`.
- Auditoria npm reduziu de 11 alertas, incluindo 1 critico, para 2 alertas moderados internos do PostCSS empacotado pelo Next 15.
- Nao executar `npm audit fix --force`: o npm sugere downgrade incorreto para Next 9.
- Validacoes concluidas:
  - `npm run predeploy` aprovado;
  - build de producao aprovado;
  - 53 migrations e 35 tabelas auditadas;
  - teste visual do PDF aprovado com 25 paginas, 0 imagens quebradas e 0 cards cortados;
  - TypeScript e lint aprovados.
- Retorno imediato, se necessario: trocar novamente para a branch `main`, que permanece no estado estavel anterior.
- Sem migration e sem SQL do Supabase.

## 2026-06-13 - Relatorio comparativo de evolucao

- Criado PDF independente em `/api/pdf/evolucao?pacienteId=...`.
- O botao `Relatório de evolução` aparece no cabecalho da ficha do paciente quando existem ao menos duas avaliacoes finalizadas.
- A comparacao principal usa automaticamente a avaliacao finalizada mais recente e a imediatamente anterior.
- O relatorio inclui:
  - score global;
  - peso, gordura corporal, massa magra e FFMI;
  - forca, flexibilidade, RML e capacidade cardiorrespiratoria;
  - VO2max;
  - deltas entre antes e depois;
  - evolucao dos scores por dominio;
  - linha do tempo com todas as avaliacoes finalizadas;
  - comparativo de fotografias posturais quando disponiveis;
  - analise de evolucao revisada, quando ja existir na avaliacao mais recente.
- O acesso respeita a permissao do profissional sobre o paciente.
- Criado teste automatizado `npm run test:evolution-report`, incluido no `predeploy`.
- `npm run predeploy` e build de producao aprovados.
- Sem migration e sem SQL do Supabase.

## 2026-06-15 - Revisao ortografica e acentuacao

- Corrigidos textos visiveis sem acentuacao na revisao da avaliacao, incluindo os alertas de forca por preensao palmar, analises clinicas e orientacao nutricional.
- Revisados tambem prontuario, painel do paciente, formulario de forca, catalogo publico, consentimento, compartilhamento, mensagens de backup e relatorio PDF.
- Nomes tecnicos, chaves internas, rotas e campos do banco foram preservados.
- A verificacao de integridade textual agora bloqueia a reintroducao das principais frases incorretas.
- `node scripts/check-text-integrity.js` aprovado.
- O build compilou e validou os tipos, mas a geracao final local parou na pagina de login porque as variaveis publicas do Supabase nao estao disponiveis nesta copia do ambiente.
- Sem migration e sem SQL do Supabase.

## 2026-06-15 - Correcao ao aplicar plano de acao

- Corrigida a rota `/api/ia/editar` para salvar o plano de acao mesmo quando a coluna `analises_ia.plano_acao` ainda nao estiver sincronizada no cache do Supabase.
- Adicionado fallback compativel com bancos antigos, armazenando e lendo temporariamente o plano dentro de `conteudo.plano_acao`.
- A tela de revisao agora reconhece tanto o formato atual quanto o formato legado.
- Criada a migration `054_ensure_plano_acao_analises_ia.sql`, que garante a coluna, o indice unico usado pelo upsert e recarrega o schema do PostgREST.
- TypeScript e verificacao de integridade textual aprovados.
- Esta correcao possui SQL do Supabase.

## 2026-06-15 - Evolucao longitudinal vazia no PDF

- Corrigida a pagina de evolucao longitudinal do laudo, que era criada apenas com o texto introdutorio.
- O PDF agora renderiza a analise estruturada com tendencias, progressos, regressoes e proximos passos.
- Quando nao existe conteudo util de evolucao, a pagina deixa de ser gerada para evitar folha em branco.
- TypeScript, integridade textual e teste visual do PDF aprovados.
- Teste visual: 25 paginas, nenhuma imagem quebrada e nenhum card cortado.
- Sem migration e sem SQL do Supabase.

## 2026-06-15 - Revisao obrigatoria e paginacao do relatorio de evolucao

- O relatorio comparativo de evolucao agora exige que a analise de evolucao tenha sido revisada e salva pelo profissional.
- Enquanto nao houver texto revisado, a ficha do paciente exibe `Revisar evolucao` e direciona para a area de Analises com IA da avaliacao mais recente.
- Depois da revisao, o botao `Relatorio de evolucao` e liberado.
- A API do PDF tambem bloqueia geracao direta sem validacao, retornando orientacao para revisar e salvar.
- O texto revisado saiu da pagina de metricas e passou a ocupar paginas proprias, com divisao por paragrafos e frases para evitar cortes.
- TypeScript, teste do relatorio de evolucao, integridade textual e teste visual do PDF aprovados.
- Sem migration e sem SQL do Supabase.

## 2026-06-15 - Manifesto publico e ortografia da revisao

- Corrigido o erro `Manifest: Line 1, column 1, Syntax error`.
- A causa era o middleware redirecionando `site.webmanifest` para o login, fazendo o navegador receber texto em vez de JSON.
- Manifesto, favicon e icone Apple agora sao recursos publicos mesmo sem sessao.
- Nome, descricao e titulo do aplicativo foram corrigidos para `Diagnostico Fisiometabolico` com acentuacao.
- Revisados botoes, titulos, estados, mensagens, campos e placeholders da aba de revisao.
- Incluidos no teste de integridade textual os principais textos corrigidos da revisao.
- Sem migration e sem SQL do Supabase.

## 2026-06-15 - Evolucao longitudinal compacta no laudo

- Removida a pagina exclusiva de evolucao longitudinal que deixava uma folha praticamente vazia no final do laudo.
- A informacao de evolucao agora aparece em fonte pequena no cabecalho da pagina final de Protocolos e referencias.
- O texto e resumido com limite seguro para nao deslocar o conteudo nem criar uma pagina adicional.
- Sem migration e sem SQL do Supabase.

## 2026-06-15 - Fluxo de geracao e revisao da evolucao

- Restaurados os tres estados do botao de evolucao na ficha do paciente.
- Sem analise gerada: `Gerar evolucao`, com geracao direta pela IA.
- Analise gerada e ainda nao validada: `Revisar evolucao`.
- Analise revisada e salva: `Relatorio de evolucao`.
- Apos gerar, o sistema direciona automaticamente para a area de revisao da analise.
- Sem migration e sem SQL do Supabase.

## 2026-06-15 - Comparativo postural completo no relatorio de evolucao

- O comparativo postural deixou de exibir apenas uma fotografia por avaliacao.
- A pagina agora apresenta anterior, posterior, lateral direita e lateral esquerda da avaliacao anterior e da avaliacao atual.
- As oito posicoes ficam organizadas na mesma pagina, em duas linhas de quatro imagens.
- Vistas ausentes permanecem identificadas como `Sem fotografia`, sem quebrar o alinhamento.
- O teste automatizado do relatorio agora exige as oito posicoes posturais.
- Sem migration e sem SQL do Supabase.

## 2026-06-15 - Documentos pre-teste avulsos no Dashboard

- Criada no Dashboard a secao `Documentos pre-teste avulsos`.
- Permite usar modelos do sistema sem cadastrar previamente um paciente ou criar uma avaliacao.
- Tipos disponiveis:
  - anamnese;
  - consentimento ou TCLE;
  - recomendacoes pre-teste.
- Nome e contato do destinatario sao opcionais.
- O sistema gera um link publico com validade de 30 dias e o copia automaticamente.
- Links recentes podem ser copiados novamente ou revogados pelo Dashboard.
- A anamnese avulsa registra respostas; o consentimento registra o aceite; recomendacoes sao exibidas em modo leitura.
- Criada a migration `055_documentos_pre_teste_avulsos.sql`.
- Esta implementacao possui SQL do Supabase.

## 2026-06-15 - Revogacao e personalizacao dos documentos avulsos

- Corrigida a revogacao que mantinha o link na lista com status `Aguardando`.
- Links revogados deixam de aparecer imediatamente e o botao mostra progresso e erros.
- Adicionada personalizacao por envio:
  - titulo;
  - mensagem de abertura;
  - cor principal;
  - fonte Inter, Arial ou Georgia;
  - texto pequeno, medio ou grande.
- A mensagem e os textos aceitam emojis, titulos com `#`, listas com `-` e negrito com `**texto**`.
- A formatacao e renderizada sem HTML livre, preservando a seguranca da pagina publica.
- Criada a migration `056_personalizacao_documentos_pre_teste.sql`.
- Esta melhoria possui SQL do Supabase.

## 2026-06-15 - Editor global dos documentos pre-teste

- Removido o texto `Documento avulso pre-teste` do cabecalho publico.
- A personalizacao deixou o Dashboard, que agora serve apenas para escolher destinatario, documento e gerar o link.
- Criada em Configuracoes a secao `Aparencia dos documentos pre-teste`.
- Adicionada barra de ferramentas visual estilo Word com:
  - negrito;
  - italico;
  - sublinhado;
  - titulos;
  - listas simples e numeradas;
  - linha divisoria;
  - tres tamanhos de fonte.
- A configuracao global tambem permite escolher titulo padrao, cor, familia de fonte e tamanho geral.
- Novos envios recebem automaticamente uma copia da configuracao vigente.
- O HTML do editor e filtrado no servidor antes de ser salvo.
- Criada a migration `057_config_documentos_pre_teste.sql`.
- Esta melhoria possui SQL do Supabase.

## 2026-06-15 - Formatacao individual por modelo

- Removido da interface o editor global de documentos pre-teste.
- A edicao visual passou a ficar dentro de cada card de TCLE, consentimento e recomendacao.
- Cada modelo possui seu proprio:
  - texto formatado;
  - negrito, italico e sublinhado;
  - titulos, listas e linha divisoria;
  - tamanho de trechos selecionados;
  - cor de destaque;
  - familia e tamanho geral da fonte.
- A formatacao individual e aplicada aos documentos avulsos e aos links associados a pacientes.
- O Dashboard permanece somente com a selecao do documento, destinatario e geracao do link.
- O conteudo HTML e filtrado antes de ser exibido publicamente.
- A tabela criada pela migration `057` permanece sem uso para manter compatibilidade com ambientes onde ela ja foi aplicada.
- Criada a migration `058_formatacao_individual_documentos.sql`.
- Esta melhoria possui SQL do Supabase.

## 2026-06-16 - Correcao das listas no editor individual

- Corrigido o comportamento dos botoes de lista simples e lista numerada no editor visual dos modelos.
- O editor agora preserva o cursor/selecionado ao clicar na barra de ferramentas.
- Listas simples e numeradas tambem receberam estilo visual dentro do campo de edicao.
- Sem migration e sem SQL do Supabase.

## 2026-06-16 - Titulos e modulos livres nos documentos

- Recomendacoes agora possuem `Titulo do documento`, permitindo trocar o cabecalho publico antes fixo como `Recomendacoes pre-teste`.
- O campo de modulo/categoria deixou de ser uma lista travada e passou a ser texto livre opcional.
- Documentos sem modulo nao exibem categoria no card publico.
- Os cards de recomendacoes e termos ganharam uma previa visual em tempo real dentro das configuracoes.
- Os links publicos usam o titulo editado no modelo selecionado.
- Criada a migration `059_documentos_titulos_modulos_livres.sql`.
- Esta melhoria possui SQL do Supabase.

## 2026-06-16 - Rodape institucional nos documentos publicos

- Criado rodape institucional reutilizavel para documentos enviados ao paciente.
- O rodape mostra nome da clinica, endereco, telefone, e-mail, site e Instagram quando esses campos estiverem cadastrados.
- Aplicado em documentos avulsos, consentimento/TCLE e recomendacoes vinculadas a paciente.
- O rodape tambem mantem a informacao de validade do link.
- Sem migration e sem SQL do Supabase, pois os campos ja existiam em `clinicas`.

## 2026-06-16 - Listas visiveis na previa dos documentos

- Corrigida a previa visual dos cards de recomendacoes e termos para exibir listas simples e numeradas.
- Adicionados estilos locais para `ul`, `ol` e `li` dentro da previa.
- Sem migration e sem SQL do Supabase.

## 2026-06-16 - Remocao do Instagram no rodape dos documentos

- Removido o campo de Instagram do rodape institucional dos documentos publicos.
- Permanecem no rodape: nome da clinica, endereco, telefone, e-mail, site e validade do link.
- Sem migration e sem SQL do Supabase.

## 2026-06-16 - Alinhamento no editor de documentos

- Adicionados botoes de alinhamento no editor visual:
  - esquerda;
  - centralizado;
  - direita;
  - justificado.
- O filtro de HTML seguro passou a preservar apenas `text-align` valido nos blocos do documento.
- A previa e as paginas publicas mantem o alinhamento salvo.
- Sem migration e sem SQL do Supabase.

## 2026-06-17 - Produtos comerciais independentes da vitrine

- Criada uma nova area em Produtos: `Produtos da vitrine`.
- Os produtos comerciais da vitrine agora ficam separados dos produtos usados para criar avaliacoes.
- Criada a tabela `catalogo_produtos` com campos comerciais:
  - nome;
  - subtitulo;
  - descricao;
  - selo;
  - imagem;
  - itens inclusos;
  - beneficios;
  - duracao;
  - preco;
  - percentual do sinal;
  - texto padrao para WhatsApp;
  - destaque;
  - ordem;
  - ativo/inativo.
- A vitrine publica `/catalogo/[clinicaId]` passou a ler `catalogo_produtos`.
- O card mostra o valor do sinal calculado a partir do preco e percentual configurado.
- O botao comercial abre WhatsApp com texto do produto.
- Criada a migration `060_catalogo_produtos_independentes.sql`.
- Esta melhoria possui SQL do Supabase.

## 2026-06-17 - Correcao da policy da migration 060

- Corrigida a migration `060_catalogo_produtos_independentes.sql`.
- A policy deixou de usar `public.is_admin_clinica`, que nao existe no banco atual.
- Agora usa `public.is_membro_clinica(clinica_id)` com `public.current_papel() in ('owner','admin')`, seguindo o padrao das migrations anteriores.
- Esta correcao possui SQL do Supabase.

## 2026-06-17 - Upload de imagem nos produtos da vitrine

- O cadastro de produtos comerciais da vitrine deixou de depender apenas de URL manual.
- Adicionado upload de imagem usando o bucket existente `produto-imagens`.
- O campo ainda permite editar/remover a URL gerada, caso seja necessario.
- Sem migration e sem SQL do Supabase, pois o bucket e policies ja existiam.

## 2026-06-17 - Agendamento pago pela vitrine

- Adicionado formulario de agendamento nos cards da vitrine publica.
- O agendamento online exige produto com preco e percentual de sinal configurados.
- Ao enviar, cria registro em `catalogo_agendamentos` com status `aguardando_pagamento`.
- Preparada integracao com Mercado Pago usando `MERCADO_PAGO_ACCESS_TOKEN`.
- Quando configurado, o sistema cria uma preferencia de pagamento do sinal e redireciona o cliente ao checkout.
- Criado webhook `/api/catalogo/mercado-pago/webhook` para marcar pagamento aprovado como `pagamento_recebido`.
- Criada pagina de retorno `/catalogo/agendamento/[id]`.
- Criada a migration `061_catalogo_agendamentos_pagamento.sql`.
- Esta melhoria possui SQL do Supabase.

## 2026-06-17 - Disponibilidade por produto no agendamento online

- Adicionados campos de disponibilidade em `catalogo_produtos`:
  - dias da semana disponiveis;
  - periodos disponiveis: manha, tarde e noite.
- O cadastro de produtos da vitrine permite marcar os dias e periodos aceitos para cada produto.
- A vitrine publica passa essas regras para o modal de agendamento.
- O formulario de agendamento exige data e periodo, mostra apenas periodos liberados e alerta quando a data escolhida nao esta disponivel.
- A API `/api/catalogo/agendamentos` tambem valida data e periodo antes de criar o agendamento, impedindo envio manual invalido.
- Criada a migration `062_catalogo_produtos_disponibilidade.sql`.
- Esta melhoria possui SQL do Supabase.

## 2026-06-17 - Pagamento de produto sem data de agendamento

- Adicionada opcao por produto para exigir ou nao data no pagamento.
- Quando `Exigir data no pagamento` estiver ligado, o fluxo continua como agendamento online com data e periodo.
- Quando estiver desligado, o cliente informa apenas nome, telefone, e-mail e observacoes, paga online e combina o horario pelo WhatsApp depois.
- A API respeita a configuracao do produto e so valida data/periodo quando essa opcao estiver ligada.
- A pagina de retorno do pagamento mostra o proximo passo e botao para chamar a clinica no WhatsApp quando nao houver data escolhida.
- Criada a migration `063_catalogo_pagamento_sem_agendamento.sql`.
- Esta melhoria possui SQL do Supabase.

## 2026-06-17 - Horarios especificos por dia no catalogo

- A disponibilidade do produto deixou de ser apenas por dia/periodo e passou a aceitar horarios especificos por dia da semana.
- No cadastro do produto, cada dia possui um campo para horarios separados por virgula.
- Exemplo: quarta com `14:00, 16:00` e quinta com `18:30, 20:00`.
- Na vitrine, ao escolher uma data, o cliente ve somente os horarios cadastrados para aquele dia da semana.
- A API valida o horario escolhido contra a agenda do produto antes de criar o pagamento.
- A pagina de retorno passou a exibir o horario selecionado.
- Criada a migration `064_catalogo_horarios_por_dia.sql`.
- Esta melhoria possui SQL do Supabase.

## 2026-06-17 - Correcao da digitacao de horarios no produto

- Corrigido o campo de horarios no cadastro de produtos da vitrine.
- Antes, o texto era normalizado enquanto o usuario digitava, impedindo inserir valores parciais como `14` ou `14:`.
- Agora o campo aceita digitacao livre e normaliza apenas ao salvar.
- Sem migration e sem SQL do Supabase.

## 2026-06-17 - Gestao de agendamentos e bloqueio de horarios

- Criada a pagina administrativa `/produtos/agendamentos`.
- A pagina lista pedidos da vitrine com produto, cliente, telefone, e-mail, valor, data, horario, observacoes e status.
- Adicionados filtros por status e botao de atualizacao.
- Adicionados atalhos para WhatsApp, link de pagamento, confirmar e cancelar.
- Criada API publica de disponibilidade `/api/catalogo/disponibilidade`.
- O modal da vitrine consulta a disponibilidade em tempo real e oculta horarios ja reservados.
- A API de criacao tambem bloqueia horarios ocupados antes de criar o pagamento.
- Criado indice unico parcial para impedir duplicidade de produto/data/horario enquanto o status estiver aguardando pagamento, pago ou confirmado.
- Webhook do Mercado Pago passou a reconhecer mais formatos de notificacao e status cancelado/expirado.
- Criada a migration `065_catalogo_bloqueio_horario_unico.sql`.
- Esta melhoria possui SQL do Supabase.

## 2026-06-17 - Limpeza de pedidos cancelados da vitrine

- A tela `/produtos/agendamentos` agora abre na visao `Todos ativos`, ocultando pedidos cancelados e expirados.
- O filtro `Cancelados` passou a reunir pedidos cancelados e expirados.
- Adicionado botao `Limpar cancelados` para excluir todos os cancelados/expirados da clinica.
- Adicionado botao `Excluir` em cada pedido cancelado ou expirado.
- Pedidos cancelados/expirados nao exibem mais o link de pagamento.
- Sem migration e sem SQL do Supabase, pois a policy de delete ja existe na migration `061_catalogo_agendamentos_pagamento.sql`.

## 2026-06-17 - Correcao da digitacao de horarios de pagamento

- Corrigido o campo de horarios disponiveis no cadastro de produtos da vitrine.
- O campo agora exibe o texto que esta sendo digitado, permitindo informar horarios como `14:00, 16:00` antes de salvar.
- A normalizacao continua acontecendo apenas no salvamento do produto.
- Sem migration e sem SQL do Supabase.

## 2026-06-17 - Agenda da vitrine por data especifica

- A agenda de pagamento/agendamento da vitrine deixou de ser recorrente por dia da semana.
- O cadastro de produto agora aceita horarios por data especifica no formato `24/06/2026: 14:00, 16:00`.
- A vitrine so mostra horarios cadastrados exatamente para a data escolhida.
- A API de disponibilidade e a API de criacao do pagamento tambem validam pela data exata.
- Horarios ja reservados continuam sendo ocultados automaticamente.
- Sem migration e sem SQL do Supabase, pois foi reaproveitado o campo `catalogo_produtos.agenda_horarios` ja existente.

## 2026-06-17 - Editor guiado de datas da agenda

- O cadastro de produtos da vitrine ganhou um editor guiado para agenda:
  - campo de data;
  - campo de horarios separados por virgula;
  - botao `Adicionar`;
  - lista das datas cadastradas;
  - botao para remover uma data.
- O campo de texto livre permanece disponivel para ajustes rapidos, mas nao e mais a unica forma de cadastrar a agenda.
- Sem migration e sem SQL do Supabase.

## 2026-06-17 - Datas abertas no modal publico da vitrine

- O modal publico de agendamento agora mostra botoes com as datas abertas cadastradas no produto.
- O cliente pode clicar diretamente em uma data disponivel, sem precisar procurar no calendario.
- O campo de data recebeu limite minimo para evitar escolha de datas passadas.
- Quando nao houver datas futuras abertas, o modal informa que o produto ainda nao possui datas para agendamento.
- Sem migration e sem SQL do Supabase.

## 2026-06-17 - Operacao de pagamento da vitrine

- Adicionada expiracao de pedidos aguardando pagamento em 15 minutos.
- Pedidos expirados deixam de bloquear horarios na vitrine.
- A expiracao roda ao consultar disponibilidade, criar novo pedido, abrir a tela administrativa e atualizar a lista.
- Adicionados detalhes operacionais do Mercado Pago em `catalogo_agendamentos`:
  - status bruto;
  - detalhe do status;
  - payload bruto;
  - data de atualizacao;
  - indices para expiracao e ID de pagamento.
- O webhook passou a gravar esses detalhes para auditoria.
- A tela `/produtos/agendamentos` ganhou resumo financeiro com:
  - total recebido;
  - valor aguardando pagamento;
  - quantidade de pedidos pagos;
  - ticket medio;
  - cancelados/expirados.
- Cada pedido passou a exibir expiracao, pagamento, IDs do Mercado Pago e status do gateway.
- O WhatsApp do pedido usa mensagem mais completa com produto, data, horario e status.
- Produtos da vitrine ganharam textos editaveis:
  - resumo antes do pagamento;
  - politica de pagamento/cancelamento;
  - mensagem apos pagamento.
- O modal publico mostra o resumo antes do pagamento e a politica definida por produto.
- A pagina de retorno do pagamento usa a mensagem apos pagamento e mostra a politica do produto.
- Criada a migration `066_catalogo_pagamento_operacional.sql`.
- Esta melhoria possui SQL do Supabase.

## 2026-06-17 - Vitrine publica sem login

- Corrigido o middleware que redirecionava links da vitrine para `/login`.
- As rotas `/catalogo/...` agora sao publicas para qualquer pessoa acessar o catalogo compartilhado.
- As APIs publicas usadas pela vitrine em `/api/catalogo/...` tambem foram liberadas do login.
- Sem migration e sem SQL do Supabase.

## 2026-06-17 - Obrigado, PDF, cupons e pacotes da vitrine

- Produtos da vitrine passaram a aceitar `Avaliacoes do pacote`, exibidas no card publico e no comprovante.
- Adicionado cupom por produto:
  - codigo;
  - percentual ou valor fixo;
  - validade;
  - limite de usos;
  - ativo/inativo.
- O modal publico aceita cupom de desconto e envia o codigo para a API.
- A API aplica o desconto no valor do sinal antes de criar a preferencia do Mercado Pago.
- O pedido grava valor original do sinal, desconto aplicado e codigo do cupom.
- O uso do cupom e incrementado apos criar a preferencia de pagamento.
- A pagina de obrigado passou a mostrar desconto/cupom, pacote incluso e botoes para WhatsApp, Google Calendar e PDF.
- Criada rota publica `/api/catalogo/agendamentos/[id]/pdf` para gerar comprovante PDF do pedido.
- Criada a migration `067_catalogo_cupons_pacotes_pdf.sql`.
- Esta melhoria possui SQL do Supabase.

## 2026-06-18 - Modelos de interpretacao por modulo

- Adicionado cadastro de modelos de interpretacao por modulo em Configuracoes.
- Cada modelo permite definir:
  - modulo;
  - titulo;
  - condicao de uso;
  - interpretacao padrao;
  - riscos e pontos de atencao;
  - recomendacoes;
  - ordem;
  - ativo/inativo.
- A geracao de IA por modulo agora consulta os modelos ativos da clinica e usa esses textos como guia clinico quando forem compativeis com os dados.
- Os modelos nao substituem a revisao humana: continuam passando pela tela de revisao/edicao antes de entrar no relatorio.
- Criada a migration `068_modelos_interpretacao_modulos.sql`.
- Esta melhoria possui SQL do Supabase.

## 2026-06-18 - Modelos-base de interpretacao clinica

- O painel de modelos de interpretacao ganhou o botao `Carregar modelos-base`.
- O botao adiciona modelos iniciais editaveis para:
  - anamnese;
  - sinais vitais;
  - antropometria;
  - bioimpedancia;
  - posturografia;
  - forca;
  - flexibilidade;
  - RML;
  - cardiorrespiratorio;
  - biomecanica da corrida.
- A carga evita duplicar modelos que ja existem com o mesmo modulo e titulo.
- Os textos entram como base inicial da clinica e podem ser editados livremente.
- Sem migration nova e sem SQL do Supabase, pois usa a tabela `modelos_interpretacao_modulos` criada na migration `068`.

## 2026-06-25 - URL limpa da vitrine publica

- Criada a rota publica `/catalogo`, permitindo compartilhar a vitrine como `https://avaliacao.medfit.med.br/catalogo`.
- A rota antiga `/catalogo/[clinicaId]` continua funcionando para compatibilidade com links ja enviados.
- O middleware passou a liberar `/catalogo` sem login.
- Os botoes internos de abrir/compartilhar vitrine passaram a usar `/catalogo`.
- Os links de compartilhamento de produto agora usam ancora em `/catalogo#produto-{id}`.
- A rota limpa usa `CATALOGO_CLINICA_ID`/`NEXT_PUBLIC_CATALOGO_CLINICA_ID` quando configurado; se nao houver variavel, usa a primeira clinica ativa.
- Sem migration nova e sem SQL do Supabase.

## 2026-07-06 - Modulo de termografia funcional

- Criado o modulo `Termografia funcional` no fluxo da avaliacao.
- A ordem clinica passou a ser Posturografia, Termografia, Antropometria e Bioimpedancia.
- A coleta registra manualmente:
  - temperatura ambiente;
  - umidade relativa;
  - tempo de aclimatacao;
  - distancia da camera;
  - data e horario;
  - adesao as recomendacoes pre-teste;
  - condicoes da sala;
  - observacoes tecnicas.
- A emissividade fica fixa em `0,98`.
- Criada configuracao editavel por clinica para fabricante, modelo e software, com defaults:
  - HIKMICRO;
  - Pocket2;
  - HIKMICRO Analyzer.
- Cada coleta preserva uma copia do equipamento utilizado.
- Implementado upload privado das quatro vistas basais obrigatorias:
  - anterior;
  - posterior;
  - lateral direita;
  - lateral esquerda.
- Implementadas imagens complementares opcionais.
- Implementado cadastro de ROIs predefinidas e personalizadas, com temperaturas
  minima, media e maxima, lateralidade, dor e observacao.
- A comparacao bilateral calcula automaticamente a diferenca absoluta das
  temperaturas medias e sinaliza diferencas acima de 0,5 C apenas para revisao,
  sem diagnostico automatico.
- Adicionados campos de interpretacao profissional.
- Integrado o modulo ao checklist de revisao e finalizacao.
- Integrada a geracao, edicao e validacao da analise com IA, com linguagem
  obrigatoriamente complementar e nao diagnostica.
- Integrado ao PDF clinico, PDF publico e relatorio longitudinal.
- O PDF apresenta protocolo, equipamento, quatro termogramas no mesmo arranjo da
  posturografia, ROIs, assimetrias, imagens opcionais e texto validado.
- O relatorio longitudinal ganhou comparativo das quatro vistas termograficas.
- Criada a migration completa `069_termografia_funcional.sql`, incluindo tabelas,
  RLS, bucket privado, policies e suporte ao tipo de analise de IA.
- Esta melhoria possui SQL do Supabase.

## 2026-07-06 - Correcao da selecao de modelo Anthropic

- Corrigido erro ao gerar analise de IA da termografia causado por IDs antigos
  de modelos Claude.
- O backend agora consulta a API de modelos da Anthropic e usa um modelo
  realmente disponivel para a chave configurada.
- Atualizados os fallbacks para Claude Sonnet 5, Sonnet 4.6 e Haiku 4.5,
  preservando compatibilidade com modelos anteriores quando ainda liberados.
- `ANTHROPIC_MODEL` continua sendo respeitado quando configurado.
- Mantido fallback para OpenAI quando `OPENAI_API_KEY` estiver configurada.
- Atualizados README e verificador de ambiente para `claude-sonnet-5`.
- Sem migration nova e sem SQL do Supabase.

## 2026-07-06 - Compatibilidade com parametros do Claude Sonnet 5

- Corrigido erro `temperature is deprecated for this model` ao gerar analises.
- O cliente de IA agora omite `temperature` no Claude Sonnet 5 e nos modelos
  Opus 4.7 ou posteriores, conforme a API atual da Anthropic.
- Modelos que ainda aceitam o parametro mantem o comportamento anterior.
- Sem migration nova e sem SQL do Supabase.

## 2026-07-06 - Laudo adaptativo para exame isolado

- O resumo do laudo agora exibe somente scores efetivamente calculados.
- Avaliacoes sem dominios pontuaveis, como Termografia funcional isolada, nao
  mostram score global nem velocimetros vazios.
- Quando nenhum score for aplicavel, a pagina de resumo e
  omitida integralmente; a capa segue diretamente para o exame realizado.
- Quando apenas um modulo estiver ativo, a capa usa o nome do modulo como tipo
  da avaliacao. Com mais de um modulo, preserva `personalizado` ou o tipo salvo.
- A capa tambem usa o modulo unico no selo principal.
- Laudos com Termografia ativa passam a incluir automaticamente:
  - protocolo TISEM;
  - referencia do consenso TISEM;
  - revisao sistematica de lesoes musculoesqueleticas;
  - revisao sobre controle de variaveis em reabilitacao.
- Os mesmos itens foram adicionados aos valores padrao editaveis da configuracao
  do PDF.
- Adicionado teste automatizado especifico para laudo isolado de termografia.
- Sem migration nova e sem SQL do Supabase.

## 2026-07-06 - Multiplas imagens termograficas complementares

- O upload complementar passou a aceitar varias imagens na mesma selecao.
- O seletor e limpo depois do envio, permitindo novos anexos sucessivos,
  inclusive do mesmo arquivo.
- Nao ha limite fixo de imagens complementares no modulo.
- A interface informa a quantidade anexada.
- Adicionada exclusao individual da imagem e do arquivo no Storage.
- Sem migration nova e sem SQL do Supabase.

## 2026-07-07 - Refinamento visual da vitrine publica MedFit

- Ajustada apenas a apresentacao visual do catalogo publico, mantendo estrutura,
  conteudo, agendamento, pagamento e compartilhamento sem mudancas funcionais.
- A vitrine passou a usar fundo bege quente, cards claros, acentos em verde
  MedFit, badges suaves, cantos mais arredondados e sombras discretas.
- O banner deixou de usar bloco verde escuro dominante e passou a ter linguagem
  mais clinica, premium e acolhedora.
- Titulos principais e nomes dos produtos passaram a usar fonte serifada de
  sistema, preservando texto de corpo em sans-serif limpa.
- A logomarca cadastrada da clinica continua sendo usada no topo da vitrine; o
  fallback com inicial so aparece se nao houver logo cadastrada.
- Sem migration nova e sem SQL do Supabase.

## 2026-07-08 - Refinamento visual dos documentos pre-teste publicos

- Aplicado o mesmo padrao visual premium da vitrine aos documentos pre-teste
  publicos.
- Foram ajustados:
  - documento avulso unificado;
  - recomendacoes pre-teste vinculadas ao paciente;
  - consentimento/TCLE publico;
  - anamnese publica vinculada ao paciente.
- O layout agora usa fundo bege quente, cards claros, acentos em verde MedFit,
  titulos serifados, cantos arredondados e sombras discretas.
- O bloco lateral usado no preview nao foi implementado no documento final.
- A logomarca cadastrada da clinica continua sendo exibida no cabecalho quando
  disponivel.
- Formularios, checkboxes, mensagens de sucesso, aceite digital e rodape
  institucional foram refinados visualmente sem alterar comportamento de envio,
  aceite, validacao, gravacao ou expiracao de links.
- Sem migration nova e sem SQL do Supabase.

## 2026-07-08 - Layout hibrido do PDF do relatorio final

- Implementado o visual hibrido aprovado para o PDF do laudo final.
- A capa passou a ter moldura bege externa com cantos arredondados, mantendo o
  miolo verde/azulado configurado pela clinica.
- As paginas internas passaram a usar moldura bege, area de leitura clara no
  padrao tecnico anterior e cards em tom bege suave.
- Cards, metricas, KPIs, blocos de IA, referencias e laterais receberam cantos
  mais arredondados, sombras discretas e contraste visual mais premium.
- Os titulos das paginas internas usam fonte serifada de sistema para aproximar
  o relatorio da identidade visual aprovada.
- A mudanca foi apenas visual; estrutura, dados, modulos, scores, termografia,
  referencias e fluxo de geracao do PDF foram preservados.
- Sem migration nova e sem SQL do Supabase.

## 2026-07-08 - Ajuste fino do rodape e cards do PDF

- Revisado visualmente o PDF gerado apos o novo layout.
- Corrigido o rodape que estava entrando no fluxo do conteudo e ficando no meio
  das paginas internas.
- O rodape voltou a ficar fixo no fim da moldura das paginas do laudo.
- Adicionadas regras especificas para cards com estilos inline antigos, evitando
  que blocos brancos/azulados escapem do novo padrao bege.
- Validado em PDF real gerado com a mesma sequencia da API: renderizacao HTML,
  paginacao, injecao do rodape e geracao A4.
- Sem migration nova e sem SQL do Supabase.

## 2026-07-11 - Compatibilidade visual do PDF em mobile

- Revisadas as capturas do PDF aberto no telefone apos a atualizacao visual.
- Identificado que visualizadores mobile rasterizavam sombras e transparencias
  como faixas, bordas fantasmas e blocos translucidos sobre os cards.
- As paginas internas do laudo agora usam modo mais robusto para PDF/mobile:
  preenchimentos solidos, bordas leves e sem sombras internas.
- Mantida a identidade visual premium do layout, mas com menos efeitos
  translucidos nas paginas internas para evitar artefatos em WhatsApp/iOS.
- Rodape, cards de score, cards de metricas, tabelas e blocos inline passam a
  renderizar sem `box-shadow` nas paginas internas.
- Validado com TypeScript, checagem de textos e teste visual do PDF.
- Sem migration nova e sem SQL do Supabase.

## 2026-08-17 - Correcao responsiva do cabecalho dos documentos publicos

- Corrigido o cabecalho compartilhado dos documentos pre-teste em telas de celular.
- Logo e bloco de texto agora ficam empilhados no mobile, preservando toda a largura util para titulos longos como `VENTILOMETRIA ESPORTIVA`.
- Titulo, nome da clinica e subtitulo passaram a respeitar a largura do card e quebrar palavras apenas quando realmente necessario.
- Removido o efeito circular desfocado que podia vazar do recorte arredondado no Safari e aparecer como uma sombra quadrada no lado direito.
- A sombra do cabecalho foi substituida por uma sombra neutra e mais curta.
- O ajuste afeta todos os documentos publicos que usam `PublicDocumentLayout`, sem alterar conteudo, links ou persistencia.
- Sem migration nova e sem SQL do Supabase.
