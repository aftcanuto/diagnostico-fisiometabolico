# Auditoria sistematica de formulas

Revisao: 09/10/2026.

## Regra de interpretacao

O sistema distingue quatro origens de resultado:

1. medida informada pelo equipamento ou profissional;
2. equacao publicada, aplicada somente quando todos os insumos existem;
3. metrica descritiva derivada, como razao, delta ou assimetria;
4. indice operacional MedFit de 0 a 100.

Os indices MedFit servem para acompanhamento longitudinal interno. Eles nao sao
percentis, normas populacionais, diagnosticos ou estimativas de risco. O aviso e
compartilhado por IA, portal, painel e PDF em `src/lib/clinical/formulas.ts`.

## Matriz auditada

| Dominio | Calculo ou classificacao | Situacao | Uso |
| --- | --- | --- | --- |
| Antropometria | IMC, Durnin-Rahaman/Womersley + Siri, Martin, Lee, Kerr, Rocha, Heath-Carter, Phantom, Mirwald e Du Bois | Motor V2 versionado, referencias por resultado selecionado e estados disponivel/revisar/invalido | Modulo, IA, PDF e portal |
| Antropometria legada | Jackson-Pollock 7 dobras | Mantido para registros antigos; exige sete sitios e idade compativel | Compatibilidade historica |
| Cardio | Zonas pela FC de limiar | Metodo de Joe Friel, com faixas especificas para corrida e ciclismo; nao usa FCmax prevista pela idade | Modulo, PDF, portal e IA |
| Cardio | Zonas por percentual da FCmax | Faixas genericas descritivas; nao substituem limiares medidos | Modulo, PDF, portal e IA |
| Cardio | Recuperacao da FC | Variacao assinada preservada: queda negativa e subida positiva | Modulo, PDF, portal e IA |
| Cardio | VO2max previsto FRIEND 2018 | Equacao aplicada dos 20 aos 85 anos com idade, sexo, peso, estatura e modalidade; fornece percentual do previsto, nao percentil | Modulo, PDF, portal, painel e IA |
| Cardio | Classificacao e indice de VO2 | Novas classificacoes sao profissionais e dependem do protocolo; classificacoes historicas e o indice MedFit nao sao percentis FRIEND | Modulo, score, PDF, portal e IA |
| Flexibilidade | Banco de Wells | Tabela por sexo/idade; removidos rotulos de percentil nao demonstrados | Modulo, score, PDF, portal e IA |
| Forca | kgf para N, forca relativa, LSI, assimetria, RFD, fadiga e relacoes | Metricas descritivas; RFD depende de amostragem e processamento | Modulo, PDF, portal e IA |
| Forca | Preensao e indice 0-100 | Indice MedFit separado das normas populacionais; tabelas artificiais para ativos/atletas removidas | Score, PDF, portal e IA |
| RML | Flexao/abdominal e Senior Fitness Test | Classificacoes preservadas quando ha protocolo/tabela configurados | Modulo, PDF, portal e IA |
| RML | Prancha, agachamento de 1 min e wall sit | Valores brutos preservados; classificacao automatica retirada por falta de tabela rastreavel compativel | Modulo, PDF, portal e IA |
| Jump Test | altura por voo, RSI, EUR, assimetria e CV | Metricas descritivas com limitacoes de tecnica, equipamento e protocolo | Modulo, PDF, portal e IA |
| Termografia | delta bilateral de temperatura media | Diferenca absoluta; sinalizacao de triagem, sem diagnostico isolado | Modulo, PDF, portal e IA |
| Biomecanica | faixas angulares | Faixas operacionais importadas do aplicativo de captura; fontes gerais nao sao apresentadas como origem dos numeros | Modulo, PDF, portal e IA |
| Bioimpedancia | composicao e dados segmentares | Valores do equipamento; metodo e condicoes de coleta devem acompanhar a interpretacao | Modulo, PDF, portal e IA |
| Composicao corporal | faixa visual e indice | IMC nao sobrescreve mais a faixa baseada em percentual de gordura; indice permanece operacional | Resumo, PDF, portal e painel |
| Posturografia | indice postural | Heuristica MedFit explicitamente operacional | Score, PDF, portal e IA |
| Global | media ponderada dos dominios disponiveis | Heuristica MedFit explicitamente operacional; peso renormalizado quando faltam dominios | PDF, portal, painel, historico e IA |
| Plano alimentar | Mifflin-St Jeor, VET e macros | Mifflin e publicada; fator de atividade, ajuste, proteina, gordura, agua e fibras sao parametros editaveis do template | Configuracao, PDF e painel |

## Correcoes desta revisao

- Recuperacao cardiaca preserva o sinal fornecido: valores negativos representam
  queda e positivos indicam que a FC continuou subindo. A IA recebe a mesma regra.
- Adicionadas as referencias Cole 1999, FRIEND 2018 e Schlussel 2008 ao registro
  unico usado por IA, portal e PDF.
- Banco de Wells deixou de exibir percentis inferidos a partir de categorias.
- O app deixou de preencher automaticamente uma classificacao de VO2 sem os
  insumos de uma referencia compativel; classificacoes antigas foram preservadas.
- A equacao FRIEND 2018 passou a cruzar os dados ja existentes da avaliacao e
  publicar VO2 previsto, percentual do previsto e faixa aproximada pelo erro-padrao.
  O sistema nao rotula esse percentual como percentil populacional.
- Removidas tabelas artificiais de preensao para populacao ativa e atleta.
- Prancha, agachamento de 1 minuto e wall sit deixaram de receber classificacao
  normativa sem fonte compativel; os valores brutos continuam disponiveis.
- IMC deixou de substituir a leitura de composicao quando ha percentual de
  gordura medido ou estimado.
- Para a IA, o percentual de gordura global vem exclusivamente da antropometria;
  a bioimpedancia permanece como fonte de agua corporal, distribuicao segmentar,
  assimetrias e indicadores proprios do equipamento.
- Prompts de IA agora recebem regra unica para nao converter indices internos,
  ausencias ou metricas descritivas em normas, diagnosticos ou causalidade.

## Pendencias deliberadas

- O indice cardio historico continua preservado como indice operacional e nao
  foi substituido pela equacao FRIEND. Percentis populacionais exigem tabelas
  normativas especificas e permanecem separados do percentual do previsto.
- As classificacoes de flexao e abdominal devem ser conferidas contra a edicao
  licenciada efetivamente adotada antes de qualquer alteracao de limites.
- Relacoes de forca e assimetria nao possuem corte universal. O sistema deve
  preservar protocolo, unidade, lado dominante, modalidade e finalidade.
- Os parametros nutricionais padrao sao pontos de partida editaveis e exigem
  validacao do profissional; nao constituem prescricao universal.

## Validacao automatica

- `npm run test:calculations` cobre as equacoes e as correcoes de semantica.
- `npm run test:references` garante paridade das fontes entre IA, PDF, portal e
  relatorio evolutivo.
- O inventario em `src/lib/clinical/formulas.ts` impede que indices internos
  voltem a ser descritos como normas por novos prompts ou componentes.

