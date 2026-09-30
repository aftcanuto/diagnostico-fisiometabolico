# Jump Test MedFit

## Instalacao

1. Aplicar integralmente `supabase/migrations/20260924024216_jump_test.sql` no SQL Editor do Supabase. Requer migrations anteriores ate 069.
2. A migration cria a tabela `jump_test`, RLS por vinculo ativo com a clinica da avaliacao, bucket privado `jump-test` para PDF (10 MB) e libera o tipo de analise `jump_test`.
3. Publicar o codigo somente depois do SQL. As consultas de paciente, portal e evolucao passam a incluir a nova relacao.
4. Selecionar Jump Test ao criar uma avaliacao. Avaliacoes existentes nao sao modificadas automaticamente.
5. Validar coleta, salvar, recarregar, anexar PDF e gerar interpretacao na Revisao. Revisar a interpretacao antes de finalizar.

## Protocolo operacional v1

- Triagem e aptidao definidas pelo profissional. Dor, limitacoes ou falta de dominio tecnico podem impedir o teste; nao ha liberacao automatica.
- Registrar equipamento/software, massa corporal, esporte/nivel, observacoes e familiarizacao.
- Padrao operacional: maos na cintura e 60 s entre tentativas isoladas, editavel. Nao se trata de um consenso universal; manter a condicao nas reavaliacoes. Intervalos diferentes dos estudos devem constar como limitacao.
- SJ: salto vertical partindo da posicao agachada estabilizada, sem contramovimento preparatorio. Padronizar profundidade e pausa (aproximadamente 2 s) na familiarizacao.
- CMJ: salto vertical com contramovimento, mesma tecnica e posicao dos bracos entre tentativas.
- DJ: sair do apoio sem impulsionar-se para cima, aterrisar e realizar rebote vertical buscando contato breve. Altura inicial do cadastro 30 cm, ajustada pelo avaliador. DJ de alturas diferentes nao recebe comparacao direta.
- CMJ unilateral: tres tentativas validas de cada perna. Nao e um salto bilateral com uma placa por pe.
- SJ, CMJ e DJ: exatamente tres tentativas validas. Tentativas substitutas podem ser adicionadas; exclusoes exigem motivo e permanecem registradas.
- Repetidos: uma serie continua de 15 s de saltos verticais maximos com contramovimento. Registrar cada salto na ordem original e confirmar transcricao completa. Nao confundir com teste de rebotes rapidos 10/5. O cadastro nao cronometra nem controla o equipamento.
- Nao inclui cabo, velocidade ou agilidade. Nesta versao a entrada e manual; o PDF original e preservado como documento, sem extracao automatica ou conexao com o equipamento.

## Metricas e revisao

- Altura informada em cm, conversao para mm. Sem altura informada, estimativa pelo voo: h = 9.80665 * (voo_ms/1000)^2 / 8, em metros, depois convertida para cm. Origem identificada no relatorio.
- Pico de potencia em W preservado do equipamento, sem reproduzir algoritmo proprietario. W/kg requer massa corporal da coleta. Nao e medicao direta de forca.
- RSI do DJ: altura(m)/contato(s), em m/s. Melhor RSI preserva a tentativa correspondente. Nao calcula RSImod nem rotula voo/contato como RSI em m/s.
- EUR altura e potencia: razao CMJ/SJ das medias de tres validas. Potencia media so existe quando todas as tentativas validas possuem potencia.
- Assimetria: |media D - media E|/maior(media D, media E) * 100, identificando o lado com maior altura. Sem faixa de risco ou liberacao esportiva.
- CV amostral da altura e apenas descritivo. Nao diagnostica fadiga.
- Alturas >100 cm, voo >1000 ms e divergencia altura/voo >max(2 cm,10%) sao alertas operacionais de revisao, nao limites biologicos ou normas cientificas. Validacao de tentativa sinalizada exige justificativa, ou exclusao. DJ exige contato mesmo quando justificado.
- A geracao da interpretacao e bloqueada por pendencias, tentativas insuficientes/excedentes, familiarizacao ou aptidao nao confirmada e serie repetida nao confirmada.

## Referencias e historico

- Duas coortes descritivas de futebol masculino subelite: cadetes (n=18, idade 14.50 +/-0.51, CMJ 42 +/-5 cm) e juvenis (n=18, idade 17.05 +/-0.64, CMJ 45 +/-4 cm). Media de tres sem bracos, Sensorize, descanso30 s. Garcia-Pinillos et al., 2014, doi:10.1016/j.apunts.2014.05.002.
- Selecao manual contextual, com justificativa obrigatoria. Nao ha percentis, corte universal nem reducao fixa feminina. Sem coorte compativel, manter "Sem referencia".
- Tecnica e altura DJ: https://pmc.ncbi.nlm.nih.gov/articles/PMC5260527/
- Exemplo de repetidos15 s (nao norma): doi:10.1016/j.wem.2014.07.014.
- Analise integrada: modulos selecionados da avaliacao atual, anamnese rotulada temporalmente e ate dez avaliacoes finalizadas anteriores da mesma clinica. Datas explicitas; idade calculada na data da avaliacao.
- Historico Jump compara versao, equipamento/software, bracos, descanso, protocolos e altura DJ/duracao da serie. Comparabilidade nao equivale a confiabilidade perfeita ou mudanca clinicamente significativa.
- Interpretacoes Jump anteriores a alteracao da coleta ficam ocultas no painel/PDF/portal, preservadas no banco. Gere novamente apos alterar. Regerar Jump substitui os textos editados daquela interpretacao.
- IA nao diagnostica lesao, nao atribui uso passado de medicamento ao presente e nao transforma correlacao entre modulos em causalidade.

## Verificacao local

`npm.cmd run test:jump` e `npm.cmd run test:jump-browser` usam dados ficticios. O teste de navegador simula persistencia; nao representa gravacao remota.

Teste SQL isolado (sem Supabase remoto):

```powershell
npm.cmd install --prefix tmp/jump-validation --no-save --package-lock=false @electric-sql/pglite@0.3.14
node scripts/test-jump-migration.cjs
```

PGlite executa a migration real com tabelas-base minimas e as funcoes de autorizacao da migration027. Verifica reaplicacao, CRUD, restricoes, permissao de colega ativo, bloqueio entre clinicas e de anonimos, e acesso ao documento privado. A confirmacao final no Supabase depende da aplicacao manual.

Publicacao, depois do SQL:

```powershell
cd "C:\Users\Admin\Documents\Codex\diagnostico-fisiometabolico"
npm.cmd run verify:release
npx.cmd vercel --prod --yes
```
