# HANDOFF - Diagnostico Fisiometabolico

Documento de continuidade do projeto. Leia este arquivo antes de continuar em outro computador, outra conversa ou outro agente.

## Atualizacoes recentes

### 2026-10-09 - Perimetros corrigidos e mensuracoes derivadas visiveis

- Confirmado o conjunto estrito de 26 medidas diretas: quatro basicas, oito dobras cutaneas, dez perimetros e quatro diametros osseos.
- Confirmados cinco perimetros corrigidos no motor: braco relaxado por triceps, torax por subescapular, coxa maxima e coxa media por coxa anterior, e panturrilha por panturrilha medial, todos pela expressao `perimetro - pi x dobra/10`.
- O antebraco permanece sem correcao porque o protocolo nao possui dobra correspondente. Para Heath-Carter, braco flexionado e panturrilha usam a correcao especifica do somatotipo, `perimetro - dobra/10`, sem pi.
- Modulo, painel do avaliador e portal do paciente agora apresentam um bloco explicito de `Perimetros corrigidos`; o PDF integrado apresenta a mesma secao quando o metodo de indices estiver selecionado.
- Medidas brutas permanecem preservadas e separadas dos derivados. Dependencias ausentes continuam como ausentes, nunca como zero.
- Nao requer migration.

### 2026-10-09 - Auditoria integral das equacoes antropometricas

- Reauditados os kernels de Durnin-Rahaman/Womersley, Jackson-Pollock/Ward, Siri, Martin, Lee, Kerr, Rocha, Heath-Carter, Phantom, Mirwald, Du Bois e os indices geometricos, com testes numericos independentes para coeficientes, unidades e dependencias.
- Jackson-Pollock 7 dobras no formulario historico agora exige peitoral, axilar media, triceps, subescapular, abdominal, suprailiaca e coxa completas; medida ausente nao e mais somada como zero. Mantidas as faixas originais de 18-61 anos para homens e 18-55 para mulheres.
- O conjunto V2 nao calcula Jackson-Pollock nem Petroski porque nao coleta peitoral, axilar media ou seus locais suprailiacos especificos. As oito dobras ISAK nao sao substituidas silenciosamente por pontos de outro protocolo.
- Corrigida a atribuicao da faixa de 16 anos: coeficientes juvenis agora citam Durnin-Rahaman 1967; Durnin-Womersley permanece dos 17 aos 72 anos. Ambos usam biceps, triceps, subescapular e crista iliaca, seguidos por Siri.
- Avaliacoes historicas deixam de recalcular massa ossea com diametro do umero no lugar do punho. Resultado ja emitido e preservado; Rocha V2 continua usando punho e femur, e Martin usa umero, femur, punho e bimaleolar.
- Removidas das telas, PDF e IA as alegacoes de `potencial genetico`, `limite natural`, suspeita de substancias e `massa ossea ideal`, que vinham de heuristicas Berkhan/McDonald e percentuais fixos sem validacao equivalente. O FFMI historico permanece apenas como indice descritivo e a massa ossea antropometrica nao e tratada como DXA.
- Textos padrao de configuracao, PDF, README e IA foram alinhados ao metodo realmente utilizado em cada versao da avaliacao.
- Validacoes aprovadas: testes numericos das equacoes, suite de Antropometria, calculos clinicos, paridade de referencias, TypeScript, build de producao e navegador/PDF em 320/390/768 px com oito paginas sem overflow.
- Motor atualizado para `anthropometry-2.2.0` e catalogo para `medfit-strict26-2026-10-09.3`. Sem migration.

### 2026-10-09 - Percentual de gordura sem medida abdominal

- Corrigida a premissa anatomica que bloqueava o percentual de gordura na Antropometria V2: a dobra da crista iliaca ISAK e equivalente a suprailiaca descrita por Durnin-Womersley, embora continue nao intercambiavel com os pontos especificos de Petroski/Jackson.
- Adicionada a densidade corporal de Durnin-Womersley 1974 por sexo e faixa etaria (16-72 anos), usando biceps, triceps, subescapular e crista iliaca; o percentual e convertido pela equacao de Siri.
- A dobra abdominal e o perimetro abdominal nao participam desse calculo. Se estiverem ausentes ou marcados como nao aplicaveis, o percentual permanece disponivel quando as quatro dobras exigidas, idade e sexo estiverem validos.
- Kerr continua separado: estima massa adiposa anatomica e depende da dobra abdominal; nao e usado como substituto do percentual de gordura quimica.
- Auditoria das dependencias confirmou que o perimetro abdominal nao alimenta Durnin-Womersley, Siri ou Kerr adiposo. Corrigido tambem o coeficiente da massa muscular de Kerr de `5.4 x Z` para `4.4 x Z`, conforme a equacao publicada.
- Motor atualizado para `anthropometry-2.1.0` e catalogo para `medfit-strict26-2026-10-09.2`; snapshots anteriores sao preservados e precisam ser salvos novamente para receber o novo calculo.
- Referencias e regras da IA atualizadas para identificar o metodo efetivamente utilizado. Nao requer migration.

### 2026-10-09 - Composicao corporal parcial e medidas nao aplicaveis

- O score de composicao corporal agora usa os marcadores disponiveis: mantem os pesos de 65% para percentual de gordura e 35% para IMC quando ambos existem, e normaliza pelo marcador remanescente quando apenas um foi coletado. Sem ambos, o score continua ausente.
- A revisao identifica o gauge como `Composicao*`, exibe aviso junto aos scores e inclui alerta no checklist quando a quantificacao e parcial; o score global passa a incorporar esse valor parcial sem tratar marcador ausente como zero.
- Cada uma das 26 medidas antropometricas ganhou a confirmacao `Nao se aplica a esta avaliacao` e motivo opcional. Ao confirmar, as leituras sao limpas e bloqueadas, a medida deixa de contar como pendencia e permanece ausente nos calculos dependentes.
- Medidas vazias sem confirmacao continuam gerando alerta no formulario e no checklist de revisao. A IA foi instruida a diferenciar ausencia pendente de exclusao deliberada e a nunca inventar substitutos.
- O estado e armazenado dentro de `registro_v2.measurements` em JSONB, preservando compatibilidade com coletas anteriores por defaults do schema; nao requer migration.
- Validacoes aprovadas: calculos clinicos, suite completa de Antropometria, TypeScript e navegador com Abdomen nao aplicavel, salvamento, mobile 320/390/768 e PDF de 8 paginas sem overflow.
- Publicado no commit `3d6ddcc`, deployment `dpl_2n6juhwzsGDDheZd6FgZNEyHVPia`, estado `READY`, com alias `https://avaliacao.medfit.med.br` atualizado.

### 2026-10-09 - Vertical Jump separado do CMJ

- Acrescentado `Vertical Jump (VJ)` ao modulo Jump Test, com tres tentativas e os mesmos campos de altura, voo e potencia exportados pelo equipamento.
- Tecnica separada por protocolo: VJ com contramovimento e maos na cintura; CMJ com contramovimento e bracos livres.
- Novas tentativas registram a tecnica dos bracos no proprio JSON; coletas antigas sem esse campo continuam usando a posicao global previamente salva.
- EUR passa a usar VJ/SJ nas coletas atuais; CMJ/SJ permanece apenas como compatibilidade para registros legados sem VJ.
- Modulo, painel/portal, PDF, evolucao e prompts de IA distinguem VJ e CMJ. A referencia de CMJ sem bracos deixa explicita a correspondencia tecnica com o VJ do equipamento e nao com o CMJ de bracos livres.
- PDF compactado sem remover dados clinicos: notas repetidas de altura informada pelo equipamento foram omitidas; estimativas, alertas e justificativas permanecem visiveis. SJ, VJ, CMJ e DJ com tres tentativas cabem na mesma pagina.
- Relatorios originais revisados: `vj.pdf`, `cmj.pdf`, `SJ.pdf` e `cdrop.pdf`. O reel informado nao ficou acessivel por consulta automatizada; a implementacao usa a descricao aprovada pelo usuario e os relatorios do equipamento.
- Nao requer migration: `protocolos` e `tentativas` ja sao JSONB. Avaliacoes existentes permanecem validas.
- Validacoes aprovadas: suite de Jump Test, paridade de referencias, TypeScript, build de producao e navegador/PDF em 320/390/768/1280 px.
- Publicado no commit `9b9b983`, deployment `dpl_Fp6vNjqpmMVadvEkvtYZn3o6VVQ3`, estado `READY`, com alias `https://avaliacao.medfit.med.br` atualizado.

### 2026-10-09 - Rascunho parcial da antropometria

- Corrigido o erro ao salvar a primeira coleta V2 com uma unica leitura ou medidas ausentes.
- A validacao ja permitia rascunhos parciais; a falha real era `PGRST204` no Supabase porque a projecao legada enviava `rcq` e `observacoes`, colunas inexistentes em `public.antropometria`.
- `rcq`, notas e demais detalhes continuam preservados integralmente em `registro_v2` e `resultados_v2`; apenas deixaram de ser duplicados em colunas legadas inexistentes.
- O alerta de pendencias permanece informativo e nao bloqueia `Salvar rascunho` nem `Salvar e continuar`.
- O servidor agora registra o objeto completo do erro do Supabase e retorna mensagem especifica para incompatibilidade de schema.
- Validacoes aprovadas: suite de Antropometria, TypeScript e navegador com apenas a primeira leitura de massa (`84 kg`), demais medidas ausentes, alerta mantido, salvamento confirmado, mobile 320/390/768 e PDF de 8 paginas sem overflow.
- Nao requer migration nem altera registros clinicos existentes.
- Publicado no commit `8ab8801`, deployment `dpl_A5yBoZhaCCyk9dVWhN2MTQfeWDwX`, estado `READY`, com alias `https://avaliacao.medfit.med.br` atualizado.

### 2026-10-05 - Contatos do rodape em uma linha no mobile

- Os cinco contatos do rodape agora permanecem em uma unica linha no celular, com icones de 10 px, botoes de 28 px e tipografia compacta.
- O rotulo `Como chegar` e exibido como `Mapa` apenas no mobile; o texto completo foi preservado a partir do breakpoint `sm`.
- Abaixo de 360 px, margens e espacos internos recebem compactacao adicional; a rolagem horizontal sem barra fica apenas como protecao para larguras excepcionais.
- O layout desktop foi preservado.
- Validacao visual aprovada em 320 px e 390 px: cinco contatos completos, uma unica linha, botoes com 28 px, sem overflow horizontal da pagina e sem erros no console.
- Validacoes aprovadas: teste dedicado da vitrine, TypeScript sem cache e build de producao.
- Nao requer migration.
- Publicado no commit `c23e5f6`, deployment `dpl_BSRiivvqwCpvaDatn7FHTpuRg41u`, estado `READY`, com alias `https://avaliacao.medfit.med.br` atualizado.
- Verificacao final em producao aprovada em 320 px: cinco contatos completos em uma unica linha, sem overflow horizontal ou erros no console.

### 2026-10-05 - Progressao proporcional do zoom da vitrine

- Corrigido o salto visual entre 95% e 100%, causado pela troca abrupta entre `contain` e `cover`.
- Criado `CatalogoImagemEnquadrada`, componente unico usado no card publico e na previa administrativa.
- A escala de cobertura agora e calculada pela proporcao natural de cada foto em relacao a moldura 16:9.
- Entre 60% e 100%, a escala progride continuamente da imagem inteira ate o preenchimento exato; acima de 100%, o zoom parte da escala de cobertura.
- Testes numericos cobrem os pontos 60%, 95%, 100% e 180%, incluindo a proximidade proporcional entre 95% e 100%.
- Comparacao visual com a foto real de Antropometria (`3024 x 4032`) confirmou escala `2,199x` em 95% e `2,370x` em 100%, diferenca progressiva de 7,23%, sem troca de modo.
- A troca de arquivo na previa remonta o componente pelo `key` da URL; imagens ja presentes no cache tambem sao medidas apos a montagem, sem depender apenas de `onLoad` e sem ocultar a camada principal.
- A verificacao do primeiro deployment detectou a camada principal invisivel por uma disputa de estado; o hotfix removeu a opacidade condicional e confirmou localmente opacidade 1 com escala proporcional calculada.
- Validacoes aprovadas: teste dedicado da vitrine com calculos proporcionais, TypeScript sem cache, comparacao visual lado a lado e build de producao limpo.
- Suite `npm run predeploy` aprovada antes da publicacao, incluindo auditoria das 75 migrations, smoke test, referencias, PDF visual, calculos, Jump Test, Antropometria, consentimento, vitrine, TypeScript e lint.
- Nao requer migration.
- O deployment inicial `dpl_GGZLHEqUNvEB9qJd5Uziawv9ySyb` foi substituido apos a verificacao detectar a camada principal invisivel.
- Hotfix publicado no commit `3d6d471`, deployment `dpl_Gcpcaau6jjJczHXqrU1XMEH435cR`, estado `READY`, com alias `https://avaliacao.medfit.med.br` atualizado.
- Verificacao final em producao mobile aprovada: foto principal com opacidade 1 e escala `2,370x`, fundo em `cover`, 14 imagens carregadas, sem overflow horizontal ou erros de console.

### 2026-10-05 - Zoom out real com preenchimento integral

- O controle de zoom da vitrine voltou ao intervalo de 60% a 180%.
- Abaixo de 100%, a foto principal usa enquadramento `contain` e escala real para revelar mais do campo original.
- Uma segunda camada decorativa da mesma foto, com `cover`, desfoque e leve sobreposicao institucional, preenche toda a moldura 16:9 sem faixas cinzas.
- Para evitar uma miniatura excessivamente pequena, a faixa de zoom out de 60% a 100% e mapeada visualmente para escala de 85% a 100%; o `contain` ainda revela a imagem completa.
- Acima de 100%, o comportamento de aproximacao com `cover` foi preservado.
- A previa administrativa replica exatamente as duas camadas e o enquadramento do card publico.
- Nao requer migration; a constraint existente ja aceita valores entre 60% e 180%.
- Validacao visual aprovada em desktop e mobile com os sete produtos reais: Antropometria em 60% exibiu a foto vertical completa sobre o preenchimento desfocado; 14 camadas de imagem carregadas, sem overflow horizontal ou erros de console.
- Validacoes aprovadas: teste dedicado da vitrine, TypeScript sem cache e build de producao.
- Suite `npm run predeploy` aprovada antes da publicacao, incluindo auditoria das 75 migrations, smoke test, referencias, PDF visual, calculos, Jump Test, Antropometria, consentimento, vitrine, TypeScript e lint.
- Publicado no commit `34f3703`, deployment `dpl_4WckgqviVMrWaJFuD4n1G7oDu186`, estado `READY`, com alias `https://avaliacao.medfit.med.br` atualizado.
- Verificacao final em producao mobile aprovada: sete cards, 14 camadas carregadas, Antropometria em `contain` com escala 85%, fundo em `cover`, sem overflow horizontal ou erros de console.

### 2026-10-05 - Fotos da vitrine sem faixas vazias

- O zoom minimo da vitrine passou a ser o enquadramento `cover` de 100%, que representa o maior campo de visao possivel sem deixar areas vazias no quadro 16:9.
- Fotos com valores antigos abaixo de 100% sao normalizadas visualmente para 100%, sem migration nem alteracao destrutiva dos dados existentes.
- Foco horizontal e vertical foram preservados e agora controlam `object-position`; o zoom de 100% a 180% usa escala com origem no ponto focal.
- A previa administrativa usa exatamente a mesma regra visual do card publico.
- Validacao local confirmou as sete fotos carregadas com `object-fit: cover`, molduras totalmente preenchidas e nenhum erro de console; Antropometria e Bioimpedancia foram conferidas visualmente.
- Suite `npm run predeploy` aprovada, incluindo auditoria das 75 migrations, smoke test, referencias, PDF visual, calculos, Jump Test, Antropometria, consentimento, vitrine, TypeScript e lint.
- Publicado no commit `a6e5c25`, deployment `dpl_5s99zsNGGtdinidnS2HoSyM34W3M`, estado `READY`, com alias `https://avaliacao.medfit.med.br` atualizado.
- Verificacao final em producao aprovada em desktop e mobile: sete cards, sete imagens carregadas em `cover`, cinco links no rodape, alturas de 166 px e 237 px, sem overflow horizontal ou erros de console.

### 2026-10-05 - Rodape compacto da vitrine

- O rodape publico do catalogo foi reduzido para ocupar menos altura em desktop e mobile.
- Icones, botoes, textos e espacamentos foram refinados; as setas externas redundantes foram removidas.
- Os contatos passaram a usar largura natural: duas linhas no celular e uma no desktop, sem blocos largos desnecessarios.
- Validacao visual aprovada em 1440x1000 e 390x844: rodape com 166 px e 237 px, respectivamente; cinco links de 32 px, icones de 12 px, sem overflow horizontal ou erros de console.
- Publicado junto ao commit `a6e5c25` no deployment `dpl_5s99zsNGGtdinidnS2HoSyM34W3M`.

### 2026-10-05 - Zoom real das fotos e novo rodape da vitrine

- Adicionado zoom configuravel por produto entre 60% e 180%, com foco horizontal e vertical. A imagem deixou de depender de `object-cover`: reduzir o zoom agora revela mais da foto e ampliar cria recorte controlado pelo ponto X/Y.
- O formulario administrativo ganhou slider de zoom, previa imediata e acao `Restaurar enquadramento`, que volta para foco 50%/50% e zoom 100%.
- O rodape publico foi reconstruido como faixa institucional de largura total, com hierarquia editorial, contraste mais elegante, cinco contatos organizados, microinteracoes e assinatura MedFit responsiva.
- Migration `20261005034529_catalogo_imagem_zoom.sql` criada pelo Supabase CLI e aplicada no projeto `kjfhhrdfsgvdqygbvmwb`. Coluna, constraint 60-180, registro e sete produtos preservados em 100% foram confirmados.
- Validacao visual aprovada em 1440x1000 e 390x844: zoom real medido em 0,60x e 1,80x, sete cards uniformes, cinco links no rodape, nenhuma imagem quebrada, overflow horizontal, elemento fora da tela ou erro de console.
- Validacoes aprovadas: integridade textual, auditoria das 75 migrations, smoke test completo, referencias, PDF visual, calculos, backup, nutricao, evolucao, Jump Test, Antropometria, comprovantes de consentimento, teste dedicado da vitrine, TypeScript sem cache, lint e build de producao.
- Advisors nao apontaram alerta novo relacionado a esta migration; permanecem os avisos preexistentes de seguranca e desempenho ja documentados.
- Publicado no commit `221006b`, deployment `dpl_8dtFpWuzc1Myv2V8CcC6B7HyFcgC`, estado `READY`, com alias `https://avaliacao.medfit.med.br` atualizado.
- Verificacao final em producao aprovada em desktop e mobile: HTTP 200, sete cards com 432 px, zoom 100% lido do banco, posicoes preservadas, cinco links no rodape, zero overflow, imagem quebrada, elemento fora da tela ou erro de console.

### 2026-10-05 - Refinamento visual e uniformidade dos cards da vitrine

- Todos os cards fechados da vitrine passaram a ter altura uniforme de 27 rem, com areas reservadas para titulo, subtitulo e duracao. Ao abrir `Saiba mais`, apenas o card escolhido retorna a altura automatica.
- O visual recebeu sombra mais presente, borda refinada, elevacao de 4 px no hover, ampliacao suave da imagem, selo flutuante, preco destacado e controle de expansao circular.
- As animacoes respeitam a preferencia de reducao de movimento do sistema; nenhuma informacao, acao, enquadramento ou comportamento de pagamento foi alterado.
- Verificacao local aprovada com os sete produtos reais em 1440x1000 e 390x844: todos os cards fechados mediram exatamente 432 px, expansao isolada, zero overflow horizontal, zero imagem quebrada e nenhum erro de console.
- Teste dedicado e build de producao aprovados. Sem migration ou alteracao de dados.
- Publicado no commit `cbb227b`, deployment `dpl_4aRZTJkcAUo8uHAbWgR99DLqHETg`, estado `READY`, com alias `https://avaliacao.medfit.med.br` atualizado.
- Verificacao final em producao confirmou HTTP 200, sete cards fechados com 432 px e diferenca zero, elevacao de 4 px no hover, expansao isolada, zero overflow horizontal, zero imagem quebrada e nenhum erro de console.

### 2026-10-05 - Publicacao da vitrine compacta

- Refinamento da vitrine publicado nos commits `f30a048` e `08f0aca`; migration `20261005043000_catalogo_cards_compactos.sql` aplicada e registrada no Supabase.
- O conteudo expandido passou a ter altura maxima de 28 rem em tablet/desktop, com rolagem interna e acoes fora da area rolavel. No celular, a expansao continua integral para evitar rolagem aninhada.
- Deploy de producao `dpl_2gKNZcFdjoYy9unUgNkcLhCeVCa3` concluido como `READY`; alias `https://avaliacao.medfit.med.br` atualizado.
- Verificacao na vitrine publica aprovada em 1440x1000 e 390x844: HTTP 200, sete cards e expansores, expansao funcional, nenhuma imagem quebrada, nenhum overflow horizontal e nenhum erro de console.
- Teste dedicado `npm run test:catalogo-vitrine` e build de producao aprovados. As capturas temporarias de verificacao nao fazem parte do repositorio.

### 2026-10-01 - Auditoria integral do relatorio e portal com todos os modulos

- Publicacao concluida nos commits `c3ffec6` e `0ea505b`. Deployment de producao `dpl_CoqwvwwpjUcwf2k2szFFfJfUaz8W` em estado READY, alias `https://avaliacao.medfit.med.br` atualizado e `/login` confirmado com HTTP 200. A pasta local `output/` passou a ser ignorada pelo Git e pela Vercel para impedir o envio de PDFs e artefatos de teste.
- Corrigida a paginacao da dinamometria por tracao: o template criava uma pagina completa para cada teste muscular. Os sete testes do cenario completo agora ocupam tres paginas balanceadas (3 + 3 + 1 com analise clinica), preservando cada teste como bloco indivisivel. O relatorio completo caiu de 40 para 36 paginas e a analise de forca, antes omitida quando havia tracao, voltou a aparecer ao final da secao.
- Criado um cenario de auditoria realmente completo com todos os modulos, Antropometria V2 com 26 medidas, seis protocolos do Jump Test, termografia com quatro imagens basais e quatro complementares, referencias e analises simuladas. Os previews anteriores nao cobriam integralmente esses tres modulos.
- O portal do paciente passou a exibir o conteudo completo da termografia: condicoes tecnicas, imagens, ROIs, comparacao bilateral, imagens complementares e conclusao profissional.
- O resumo do Jump Test no portal ganhou apresentacao responsiva em linhas de metricas no mobile; a tabela completa permanece no desktop. Assim, todas as informacoes ficam visiveis em 320 e 390 px sem rolagem horizontal.
- Corrigido um overflow de 9 px nos indicadores tecnicos da termografia do painel clinico em 390 px, aumentando a largura minima real das colunas antes de formar a grade.
- A paginacao das referencias do PDF foi equilibrada quando restam apenas um ou dois itens. O relatorio completo caiu de 41 para 40 elementos de pagina (capa sem numeracao e 39 paginas numeradas), sem deixar uma pagina final quase vazia.
- Auditoria automatica aprovada no portal e painel clinico em 320, 390, 768 e 1280 px: largura exata do viewport, nenhuma imagem quebrada e nenhum elemento fora da area util. As paginas criticas de termografia, antropometria, Jump Test, protocolos e referencias foram inspecionadas visualmente.
- PDF completo aprovado sem pagina vazia, card cortado, imagem quebrada ou bloco invadindo o rodape. Tres paginas extensas de forca mantem diferenca de 6 px entre `scrollHeight` e `clientHeight` causada por efeitos CSS; a verificacao direta dos limites e as capturas confirmam que nao existe extrapolacao visual.
- Adicionado `scripts/export-full-test-pdf.cjs` para exportar de forma reproduzivel o mesmo cenario completo auditado. O arquivo de conferencia foi gerado em `output/pdf/relatorio-teste-completo-medfit.pdf`, com 40 paginas A4 e verificacao visual apos renderizacao por Poppler.
- Validacoes aprovadas: `test:full`, `test:pdf-visual`, `test:layout`, `test:references`, `test:jump`, `test:anthropometry`, TypeScript, lint e build de producao. Sem migration nova, sem alteracao de dados reais, sem envio a IA e sem deploy nesta etapa.

### 2026-09-30 - Correcao da selecao entre Antropometria V2 e formulario historico

- Corrigida a causa de avaliacoes novas exibirem o formulario antigo: linhas criadas pelo autosave apenas com a estrutura vazia de dobras nao sao mais classificadas como coleta historica.
- Um rascunho legado vazio agora pode ser iniciado e salvo como Antropometria V2. A operacao usa controle atomico para confirmar que `revision_v2` continua nula antes da conversao.
- Avaliacoes antigas com qualquer medida ou resultado real continuam preservadas no formulario legado, sem conversao ou perda de dados.
- O formulario antigo deixou de se apresentar incorretamente como "protocolo ISAK 7 pontos" e passou a informar que e um modelo historico, distinto da coleta ISAK atual.
- Consulta sem valores clinicos confirmou que a unica avaliacao em andamento possui apenas o rascunho estrutural vazio; nenhuma leitura real sera convertida. Sem migration adicional e sem alteracao automatica de registros no Supabase.
- Suite antropometrica, API simulada, TypeScript, lint, build e teste visual aprovados. O navegador confirmou 26 campos, as oito dobras ISAK corretas, salvamento, mobile em 320/390/768 px e PDF de oito paginas.

### 2026-09-29 - Publicacao da Antropometria V2

- Migration `20260928170549_anthropometry_v2.sql` aplicada no projeto Supabase `kjfhhrdfsgvdqygbvmwb` por SQL direto, devido ao historico antigo de migrations manuais. Colunas, tipos, constraints validadas e RLS ativo em `antropometria` e `avaliadores` foram confirmados; versao registrada como aplicada sem reparar ou remover entradas historicas anteriores.
- Deploy de producao concluido: `dpl_ENB1pPRUzb4YkuzajqDzaGCiW2dz`, status READY. Alias principal atualizado para https://avaliacao.medfit.med.br; login respondeu HTTP 200.
- Publicados Antropometria V2, qualificacao ISAK Nivel 1, integracao de referencias com IA/portal/PDF, compatibilidade legada e correcoes da auditoria visual responsiva. Build remoto, tipos e lint aprovados.
- Testes nao gravaram avaliacao real nem enviaram dados de paciente para IA. Diretorio `tmp/` excluido do Git e do upload da Vercel.

### 2026-09-29 - Auditoria visual completa da Antropometria V2

- Simulacao integral executada com as 26 medidas preenchidas, metodos antropometricos selecionados, instrumentos, contexto, metas, conclusao e qualificacao ISAK Nivel 1.
- PDF antropometrico corrigido: medidas agrupadas em basicas, dobras, perimetros e diametros; Phantom sem repeticao de codigos em cada linha; contexto compactado; titulo Phantom mantido junto da tabela; espacamento das tabelas ajustado para eliminar corte de 6 px identificado pelo teste reforcado.
- Fixture completo resulta em oito paginas sem overflow, corte, titulo orfao ou texto fora da area util. Todas as oito paginas foram renderizadas e inspecionadas visualmente.
- Painel corrigido em 320 px: metricas numericas arredondadas, tabelas contidas no card e resultados convertidos para linhas responsivas no mobile. Referencias por resultado exibem identificadores curtos; citacoes completas permanecem na secao de referencias.
- Validacao do painel aprovada em 320, 390, 768 e 1440 px, sem overflow horizontal, tela vazia, overlay ou erro de navegador. Aviso de acessibilidade do titulo da somatocarta tambem corrigido.
- Teste visual ampliado em `scripts/test-anthropometry-browser.ts`, com dados plausiveis completos, captura de todas as paginas do PDF e capturas do painel por viewport. Alteracoes ainda nao publicadas; nenhuma migration adicional e nenhum dado real alterado.

### 2026-09-29 - Antropometria V2 ISAK e Phantom

- Implementada uma nova coleta antropometrica versionada, com 26 medidas do protocolo definido para a clinica, todas no lado direito por padrao e com registro explicito de excecoes. Os perimetros incluem peito/torax e antebraco; o diametro bimaleolar foi incluido para os calculos de massa ossea.
- Cada medida aceita duas leituras e solicita uma terceira quando a diferenca ultrapassa 5% nas dobras ou 1% nas demais medidas. O resultado usa media para duas leituras e mediana para tres, preservando rascunhos parciais e rastreabilidade.
- Avaliacoes antropometricas antigas continuam no formulario e no formato legado. Novas avaliacoes usam `registro_v2`, `resultados_v2` e controle otimista por `revision_v2`, sem recalcular silenciosamente registros historicos.
- O avaliador escolhe os metodos e secoes durante a avaliacao. Resultados, portal, PDF e IA consomem o mesmo snapshot calculado e as mesmas referencias selecionadas; analises de IA anteriores a uma edicao V2 ficam obsoletas e nao sao exibidas como atuais.
- Incluidos somatorios, perimetros corrigidos, indices, composicao corporal compativel, somatotipo Heath-Carter, proporcionalidade Phantom, maturacao de Mirwald, comparacao longitudinal e cenarios profissionais. Resultados cuja fonte ou adaptacao ainda exige validacao ficam marcados para revisao e nao alimentam a IA como confirmados.
- Petroski, Jackson-Pollock e Siri nao foram habilitados no conjunto estrito de 26 medidas, pois dependem de pontos suprailiacos distintos dos pontos ISAK adotados. Nao ha substituicao silenciosa nem uso da bioimpedancia como percentual de gordura antropometrico.
- Perfil profissional ganhou qualificacao ISAK estruturada. A formacao informada aparece simplesmente como "ISAK Nivel 1"; o titulo de antropometrista certificado exige declaracao explicita, nivel e validade vigente.
- Migration completa criada em `supabase/migrations/20260928170549_anthropometry_v2.sql`, com preservacao das linhas legadas, restricoes de consistencia, RLS e grants existentes. Ela ainda nao foi aplicada no Supabase e esta entrega ainda nao foi publicada.
- Validacoes aprovadas: suite antropometrica (calculos, IA, API, migration local e qualificacao), navegador em 320/390/768 px, PDF integrado de 8 paginas sem cortes, Jump Test, PDF visual geral, referencias, TypeScript, lint e build de producao. Nenhum dado real de paciente foi enviado a IA ou alterado durante os testes.

### 2026-09-25 - Publicacao do PDF compacto e ordem dos modulos

- Deploy autorizado concluido: `dpl_CsnihVGZbfNiL3PPF1BCt5nCDCKM`, READY, alias https://avaliacao.medfit.med.br.
- Build remoto, tipos e lint aprovados; login do dominio confirmado com HTTP 200 apos deploy.
- Publicados Jump Test compacto, inclusao em Protocolos utilizados e nova ordem dos modulos. Esta entrada substitui o status de nao publicado da entrega abaixo.
- Sem migration nem alteracao de registros clinicos. Comando executado: `cd "C:\Users\Admin\Documents\Codex\diagnostico-fisiometabolico"` seguido de `npx.cmd vercel --prod --yes`.

### 2026-09-25 - Jump Test compacto e ordem dos modulos

- PDF sem pagina obrigatoria por protocolo de salto: resumo e tabelas seguem em fluxo, com continuacao automatica quando necessario. Fixture SJ/CMJ/DJ com tres tentativas cada confirmada em uma pagina; seis protocolos tambem testados sem ultrapassar rodape.
- Jump Test incluido automaticamente em Protocolos utilizados quando selecionado, inclusive com configuracao personalizada antiga, evitando duplicacao.
- Bioimpedancia apos sinais vitais; antropometria antes do Jump Test na selecao inicial, navegacao, PDF, painel e portal. Botoes Continuar dos modulos afetados respeitam os passos habilitados.
- Testes Jump e navegador isolado em 320/390/768/1280 aprovados. Sem migration, sem mudanca de dados clinicos e sem deploy desta alteracao.
- Build, tipos, lint, paridade de referencias e teste de inclusao de modulos aprovados. Preview compacto inspecionado visualmente em tmp/jump-test/compact.png.

### 2026-09-25 - Publicacao da entrada automatica de saltos validos

- Deploy autorizado concluido: `dpl_HdGG8YQdSW9FPLTBCVZFVdwBMYDM`, READY, alias https://avaliacao.medfit.med.br.
- Build remoto, tipos e lint aprovados. Login de producao confirmado com HTTP 200. Sem migration e sem alteracao de dados de pacientes.
- Publicados validacao automatica dos saltos completos sem alertas e controle Confirmar saltos preenchidos para pendencias antigas. Esta entrada substitui o status anterior de nao publicado.
- Comando executado: `cd "C:\Users\Admin\Documents\Codex\diagnostico-fisiometabolico"` seguido de `npx.cmd vercel --prod --yes`.

### 2026-09-24 - Entrada de saltos validos no Jump Test

- Conforme fluxo solicitado pelo usuario, editar valores passa a marcar saltos completos e sem alertas como validos automaticamente; resumo recalcula sem selecao manual de status.
- Campos vazios, numeros invalidos, inconsistencias e DJ sem contato permanecem pendentes. Tentativas excluidas nao sao reativadas.
- Botao Confirmar saltos preenchidos permite confirmar pendencias antigas sem alertas; exige salvar depois e nao modifica registros remotos automaticamente.
- Sem migration e sem deploy nesta etapa. Anexo PDF continua documental, sem extracao automatica.
- Testes Jump e TypeScript aprovados, incluindo entrada automatica, campos vazios, DJ sem contato, inconsistencias e preservacao de exclusoes.

### 2026-09-24 - Publicacao da inclusao de modulos

- Deploy autorizado e concluido: `dpl_E5cE5xpS9t7bqTWHQSza47QptMQh`, READY, alias https://avaliacao.medfit.med.br.
- Build remoto aprovado e login do dominio confirmado com HTTP 200. Teste `npm run test:add-modules` repetido e aprovado antes do envio.
- Nenhuma migration necessaria: recurso usa o campo existente `avaliacoes.modulos_selecionados`. Nenhum SQL aplicado nem paciente alterado nesta publicacao.
- Esta entrada substitui o status de nao publicado da implementacao abaixo. Fluxo autenticado com gravacao em avaliacao real nao executado; testes usam fixtures.
- Comando executado: `cd "C:\Users\Admin\Documents\Codex\diagnostico-fisiometabolico"` e `npx.cmd vercel --prod --yes`.

### 2026-09-24 - Acrescentar modulos a avaliacoes existentes

- Adicionado controle Adicionar modulos no layout da avaliacao. Exibe somente modulos nao selecionados; permite adicionar varios e abrir o primeiro, com confirmacao sobre campos ainda nao salvos.
- API autenticada usa cliente da sessao e RLS, sem service role. Aceita apenas chaves conhecidas e adicoes; preserva selecao existente e todos os dados clinicos. Comparacao atomica da selecao anterior com retry evita perder adicoes simultaneas.
- Avaliacoes finalizadas precisam ser reabertas explicitamente; arquivadas nao permitem adicao. Inclusao pode ocorrer em outro dia, sem trocar a data original da avaliacao.
- Etapas compartilhadas entre navegacao, seletor e validacao da API. Referencias de portal/PDF/IA acompanham a selecao atual automaticamente. Analises salvas nao sao regeneradas automaticamente: revisar a conclusao apos complementar.
- Sem migration, sem alteracao remota de pacientes e sem deploy nesta etapa. Teste dedicado: `npm run test:add-modules`.
- TypeScript, lint, build, testes de API com banco simulado e paridade de referencias aprovados. Teste interativo isolado em 320/390/768/1280 px aprovado (selecao, envio, navegacao, erro e estado finalizado); nao houve gravacao em avaliacao real.
- Comando de publicacao: `cd "C:\Users\Admin\Documents\Codex\diagnostico-fisiometabolico"` seguido de `npx.cmd vercel --prod --yes`.

### 2026-09-24 - Publicacao da bibliografia unificada

- Publicacao autorizada pelo usuario e concluida: `dpl_BnpZe6cYJkbSRW7q3ZVVw6Sapav7`, status READY, producao.
- Alias atualizado: https://avaliacao.medfit.med.br. Login confirmado com HTTP 200 apos a publicacao.
- Build remoto, tipos e lint aprovados. Referencias compartilhadas entre portal, PDF e prompts da IA publicadas; esta entrada substitui o status de nao publicado desta correcao.
- Comando PowerShell: `cd "C:\Users\Admin\Documents\Codex\diagnostico-fisiometabolico"` seguido de `npx.cmd vercel --prod --yes`.
- Sem migration, sem commit e sem regeneracao das analises de IA ja salvas. Arquivos .env e temporarios excluidos do envio. A pendencia anterior de acesso autenticado ao paciente de teste permanece independente deste deploy.

### 2026-09-24 - Publicacao autorizada das correcoes da auditoria

- Usuario autorizou publicar apos ser informado da divergencia de clinicas. Nenhum vinculo de paciente/avaliacao foi alterado nesta publicacao; pendencia de acesso permanece.
- Deploy de producao concluido e inspecionado com status READY: dpl_9PSvFA4QZdXDRGRPupw1s2XGfV31. Alias confirmado: https://avaliacao.medfit.med.br.
- Build remoto, tipos e lint aprovados. Login do dominio de producao verificado apos deploy. Validacao autenticada integral do portal/PDF continua pendente conforme auditoria abaixo.
- Comando executado em PowerShell: `cd "C:\Users\Admin\Documents\Codex\diagnostico-fisiometabolico"` seguido de `npx.cmd vercel --prod --yes`.
- Sem commit, sem envio de segredos, sem nova migration nesta publicacao. Esta entrada substitui o status anterior de codigo ainda nao publicado.

### 2026-09-24 - Auditoria do app, portal e PDF (em andamento)

- Corrigidas grades mobile em PatientDashboard, PortalPaciente e SilhuetaCircunferencias: composicao corporal, historico, forca e tentativas de flexibilidade. Tentativas com valor zero agora permanecem visiveis e preservam sua numeracao.
- Datas de calendario nao retrocedem um dia por fuso na avaliacao/PDF; idade do PDF calculada na data da coleta.
- Consultas de analises no PDF privado/publico e dashboard agora incluem gerado_em, necessario para validar analises apos alteracoes no Jump.
- Sintese global/evolutiva omite medicoes Jump declaradas simuladas; conclusao anterior nao e reutilizada como insumo da nova conclusao. Conclusao da avaliacao de teste autorizada regenerada e salva; verificado no navegador que exclui os saltos simulados da analise clinica.
- Cliente Supabase de servidor usa await cookies(); consumidores atualizados e TypeScript/build aprovados.
- Migration completa 20260924133821_restore_core_rls.sql APLICADA no Supabase: RLS de pacientes, avaliacoes e avaliadores restaurado, bloqueio anonimo e acesso por clinica/perfil. Testes locais PostgreSQL/PGlite de isolamento passaram.
- IMPORTANTE: teste autenticado revelou cadastro de paciente vinculado a clinica/avaliador diferentes da avaliacao de teste de 15/06/2026. RLS bloqueia corretamente a pagina do paciente para a sessao atual. Solicitada autorizacao para alinhar os vinculos; nao ampliar politicas nem mover registros sem confirmacao. Comparacao remota confirmou divergencia; usuario atual e membro da clinica da avaliacao, nao da clinica do paciente.
- npm run predeploy, npm run build, node scripts/test-core-rls.cjs e git diff --check passaram. npm run test:layout testa 320/390/768/1280 px: zero transbordamento horizontal e imagens quebradas nos dois previews. PDF com paginacao real: 27 paginas, zero blocos sobre o rodape; tres paginas tem excesso de scroll geometrico de 6px sem conteudo cortado.
- Teste PDF legado passou a usar prepararPaginacaoLaudo e geometria relativa ao rodape. Novo audit-layout falha com regressao de largura, imagens ou conteudo sobre rodape. Screenshots locais em tmp/jump-test (ignorados).
- Limites: testes responsivos usam fixtures; fluxo completo do portal real pendente de resolver vinculo da clinica. Visualizador PDF do navegador interno retornou ERR_BLOCKED_BY_CLIENT; nao concluir validacao visual integral do PDF real. Analises antigas de outros modulos ainda requerem revisao profissional; nao certificadas por estes testes.
- Alertas restantes do Supabase: funcoes com search_path mutavel, funcoes SECURITY DEFINER e protecao contra senhas vazadas precisam revisao especifica, sem revogacoes indiscriminadas de RPCs publicas.
- Estas correcoes de codigo AINDA NAO foram publicadas. Migration RLS e conclusao de teste ja persistidas remotamente. Sem commit. Nao publicar ate resolver/validar o bloqueio de acesso identificado.
- Comando de deploy, somente depois da validacao pendente: `cd "C:\Users\Admin\Documents\Codex\diagnostico-fisiometabolico"` e `npx.cmd vercel --prod --yes`.

### 2026-09-24 - Instalacao e validacao remota Jump Test

- Migration Jump Test aplicada no Supabase via conector autorizado. Confirmados RLS ativo, SELECT anonimo revogado e bucket privado.
- Inseridos saltos explicitamente simulados na avaliacao de teste autorizada pelo titular, sem substituir medicoes existentes.
- Analise Jump Test e conclusao global geradas e persistidas com claude-sonnet-4-5. PDF autenticado retornou HTTP 200.
- Validacao identificou perda de observacoes na sintese global: agora conclusao e evolucao recebem observacoes, conclusao profissional e contexto de simulacao. Prompt impede usar simulacoes como achados clinicos reais.
- Predeploy passou; fixture PDF legado registra uma pagina com overflow, sem imagens quebradas nem cards cortados. Teste especifico Jump em quatro larguras aprovado anteriormente.
- ALERTA anterior a migration: Supabase advisors aponta RLS desativado em pacientes, avaliacoes e avaliadores; requer revisao de seguranca especifica. Nao alterado nesta entrega.
- Deploy de producao concluido: dpl_GFMrNfE9vVBptsXxWu24nSBE6mQw, READY, alias https://avaliacao.medfit.med.br. Comando: `cd "C:\Users\Admin\Documents\Codex\diagnostico-fisiometabolico"` seguido de `npx.cmd vercel --prod --yes`. Nao houve commit.
- Conclusao regenerada apos correcao reconhece dados simulados; ainda usa qualificacao de capacidade preservada, portanto requer revisao profissional antes de entrega. Nao considerar a geracao como validacao clinica.
- PDF regenerado apos a nova conclusao com HTTP 200. TypeScript, lint e teste Jump passaram apos a correcao.
- Adicionado .vercelignore para excluir ambientes, temporarios, previews e arquivos locais do upload.

### 2026-09-24 - Modulo Jump Test

- Adicionado Jump Test selecionavel na nova avaliacao, navegacao, revisao e modelos de interpretacao.
- Incluido nos produtos/pacotes, lista de avaliacoes e rotulos do prontuario; botoes dos modulos vizinhos respeitam os passos habilitados.
- SJ, CMJ, DJ: tres tentativas validas; unilateral: tres por perna. DJ30 editavel; repetidos: serie unica15 s, com transcricao por salto e confirmacao de serie completa.
- Calculos compartilhados entre tela/PDF/IA: altura cm/mm, voo/contato ms, pico W e W/kg, RSI do DJ, EUR altura/potencia e assimetria unilateral. Potencia original preservada.
- Revisao obrigatoria de dados suspeitos; exclusoes justificadas preservam o original. Sem diagnostico de lesao, percentis inventados ou correcao feminina fixa.
- Duas referencias contextuais verificadas de futebol juvenil masculino. Sem extrapolacao automatica para outros esportes/idades/sexos.
- Analise individual e integrada com modulos atuais, anamnese temporal e ate dez coletas anteriores da mesma clinica. Idade na data da avaliacao. Analises anteriores a alteracoes no Jump sao ocultadas sem apagar o registro.
- PDF, portal, dashboard, evolucao e backup recebem Jump Test. Upload manual de PDF original em bucket privado; nao ha integracao direta com o equipamento nem importacao automatica.
- Migration completa: `supabase/migrations/20260924024216_jump_test.sql`. Nome gerado pelo CLI oficial, posterior a069. APLICAR MANUALMENTE ANTES DE PUBLICAR: as consultas passam a incluir a nova relacao.
- SQL testado em PostgreSQL local PGlite com autorizacao da migration027: reaplicacao, CRUD, constraints, bloqueio entre clinicas/anonimos e Storage privado. Nenhuma migration aplicada no Supabase remoto.
- Testes: `npm run test:jump`, `npm run test:jump-browser`, `node scripts/test-jump-migration.cjs`, `npm run predeploy` e `npm run build` passaram. Navegador com dados ficticios em320/390/768/1280 px e PDF com paginacao real. Gravacao remota e geracao paga de IA nao executadas.
- Guia tecnico e passos de instalacao: `docs/JUMP_TEST.md`. Sem deploy ou commit nesta etapa. Preservadas alteracoes anteriores do worktree.

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

## 2026-08-17 - Refinamento visual do cabecalho mobile

- Reorganizado apenas o cabecalho mobile dos documentos publicos para melhorar alinhamento e proporcao.
- Logo e identificacao da clinica agora compartilham a primeira linha.
- Titulo e nome do paciente usam a largura total em um bloco alinhado logo abaixo.
- Reduzidos logo, padding e espacos verticais no celular para um conjunto mais compacto e harmonico.
- O layout desktop permanece inalterado.
- Sem migration nova e sem SQL do Supabase.

## 2026-09-04 - Keepalive diario do Supabase

- Adicionada a rota protegida `/api/cron/supabase-keepalive` para gerar atividade real e somente leitura no banco.
- A rota valida `Authorization: Bearer CRON_SECRET` antes de acessar o Supabase e nunca devolve dados das tabelas.
- A verificacao executa consultas minimas nas tabelas `clinicas`, `pacientes` e `avaliacoes`.
- Adicionado `vercel.json` com execucao diaria as 12:00 UTC, aproximadamente 09:00 no horario de Brasilia.
- O middleware libera somente essa rota da sessao comum; a protecao permanece sob responsabilidade do `CRON_SECRET`.
- `CRON_SECRET` foi documentado em `.env.example`, adicionado ao monitoramento administrativo e configurado como segredo no ambiente de producao da Vercel, sem valor real no GitHub.
- A automacao reduz o risco de pausa por baixa atividade no plano gratuito, mas somente um plano pago garante que o projeto nao seja pausado.
- Sem migration nova e sem SQL do Supabase.

## 2026-09-13 - Referencias biomecanicas e contexto temporal da IA

- Os intervalos de referencia da biomecanica foram comparados com os relatorios externos dos planos sagital e posterior e centralizados em `src/lib/biomecanica/referencias.ts`.
- Novos intervalos: cabeca -8 a 2 graus; tronco 4 a 10; aterrissagem -10 a 10; joelho anterior 135 a 180; joelho posterior 0 a 101; bracos 75 a 85; pelve 0 a 2; alinhamento dos joelhos -3 a 3; pronacao/supinacao -5 a 5.
- A mesma fonte de referencia agora alimenta formulario, classificacao de registros antigos, PDF, portal, dashboard e prompt de IA, evitando divergencia futura.
- Os dados demonstrativos dos geradores de preview do laudo e do dashboard tambem foram alinhados aos novos intervalos e tiveram suas classificacoes recalculadas.
- A anamnese enviada para a IA passou a carregar os campos do template e converter IDs dinamicos em perguntas rotuladas.
- Antecedentes familiares, historico pregresso, informacao atual e uso de temporalidade mista recebem marcadores distintos. A IA foi instruida a nunca converter risco familiar ou uso passado em condicao/uso atual.
- O contexto clinico compartilhado pelos demais modulos tambem preserva esses marcadores temporais.
- A persistencia em `analises_ia` agora verifica e informa erros do Supabase; o sistema nao confirma mais uma analise que nao tenha sido salva.
- A termografia foi incluida no resumo clinico do dashboard, na edicao rapida e na lista de analises do portal do paciente. A consulta de producao confirmou 2 registros de termografia e 2 analises correspondentes.
- O modelo efetivamente registrado nas geracoes mais recentes, incluindo termografia, e `claude-sonnet-5`. O ambiente local continua configurado com `claude-sonnet-4-5`, que faz fallback para um modelo disponivel quando necessario.
- Validacoes executadas com sucesso: `npm run text:check`, `npm run db:audit`, `npm run test:full`, `npm run test:pdf-visual`, `npm run test:calculations`, `npm run test:backup`, `npm run test:nutrition`, `npm run test:evolution-report`, `npx tsc --noEmit`, `npm run lint` e `npm run build`.
- O lint manteve apenas um aviso preexistente de `alt` em imagem na pagina de termografia.
- Sem migration nova, sem SQL do Supabase e sem deploy nesta etapa.

## 2026-09-21 - Origem dos links publicos

- Centralizada a origem publica em src/lib/public-origin.ts para convites, documentos, portal, catalogo e retorno/webhook de pagamento.
- Removidos fallback localhost, dependencia da origem do navegador e do cabecalho Origin nos links externos.
- Convite verifica o redirect_to retornado pelo Supabase e informa erro de configuracao em vez de entregar link com destino incorreto.
- Supabase Auth corrigido e confirmado apos recarregar o painel: Site URL https://avaliacao.medfit.med.br e Redirect URL https://avaliacao.medfit.med.br/login. O Site URL anterior era localhost.
- A origem local restante na revisao serve apenas a uma chamada interna da API.
- Sem migration. Build validado e publicado em producao: dpl_68t4Q7GayFWJvuseD6GfEvZaz9QK, status READY, alias https://avaliacao.medfit.med.br.

## 2026-09-13 - Grade das imagens complementares da termografia

- O modulo de termografia passou a exibir as imagens complementares em quatro colunas no desktop, seguindo o mesmo alinhamento dos quatro termogramas basais.
- Em telas menores, a grade usa duas colunas para manter as miniaturas legiveis e os controles de edicao acessiveis.
- O relatorio e o PDF tambem passaram de tres para quatro imagens complementares por linha.
- Adicionado texto alternativo nas miniaturas do modulo e teste de regressao para a grade do laudo.
- Validacoes executadas com sucesso: `npm run test:full`, `npm run test:pdf-visual`, `npx tsc --noEmit`, `npm run lint` e `npm run build`.
- O PDF A4 de verificacao foi renderizado e inspecionado visualmente, sem imagens quebradas, cortes ou sobreposicoes na grade de quatro colunas.
- Sem migration nova e sem SQL do Supabase.
## 2026-09-24 - Bibliografia unica por modulo selecionado

- Centralizadas 25 fontes de 11 modulos em `src/lib/clinical/references.ts`; anamnese excluida da bibliografia.
- Portal, PDF e prompts individuais/integrados da IA compartilham fontes, notas e links. Selecao explicita de modulos prevalece sobre dados antigos; evolucao usa a uniao das selecoes do historico.
- Bibliografia personalizada antiga preservada como arquivo na configuracao, sem substituir a lista publicada. Conclusoes de IA ja salvas nao foram regeneradas.
- Atualizadas edicoes verificadas de ACSM, Kendall, ISAK e McGill; adicionadas fontes especificas de EUR, RFD e antropometria feminina. Detalhes e limites em `docs/REFERENCIAS.md`.
- Sem alteracao de formulas, valores de referencia ou registros clinicos. Sem migration e sem deploy desta correcao.
- Build de producao aprovado. Teste visual repetido em Chrome isolado apos timeout no ambiente restrito: aprovado em todas as quatro larguras e nas tres paginas de referencias.
- Testes de paridade de referencias e navegacao responsiva aprovados; predeploy aprovado com TypeScript e lint. PDF de referencias com 3 paginas, sem extrapolacao detectada. O teste visual geral ainda sinaliza 3 paginas de forca com excedente preexistente de aproximadamente 6 px.

## 2026-10-04 - Sincronizacao do registro de migrations

- Investigado o alerta de migrations pendentes exibido pelo relatorio de saude do app.
- Confirmado no Supabase que as migrations numeradas `001` a `069` ja estavam registradas e que as tres migrations recentes constavam no historico nativo do banco.
- Verificados os objetos reais de Jump Test, as politicas RLS restauradas e as colunas/constraints da Antropometria v2; nenhuma alteracao estrutural estava pendente.
- O alerta era um falso positivo: faltavam apenas os nomes completos das tres migrations recentes em `public.sistema_migrations_aplicadas`.
- Registradas de forma idempotente `20260924024216_jump_test.sql`, `20260924133821_restore_core_rls.sql` e `20260928170549_anthropometry_v2.sql`.
- Validacao final: `72/72` migrations esperadas registradas no diagnostico do app.
- Sem migration nova, sem alteracao de schema, sem alteracao de codigo e sem necessidade de deploy.

## 2026-10-04 - Comprovantes seguros para TCLE avulso

- Identificada divergencia entre os dois fluxos de consentimento: termos vinculados ao paciente ja geravam evidencia completa, enquanto documentos avulsos registravam somente `aceito_em`.
- Implementada trilha separada e somente leitura para TCLE/consentimentos avulsos, com snapshot do texto e versao, declaracao confirmada, nome do signatario, hash do CPF, quatro ultimos digitos, horario, IP, navegador, codigo unico e hashes SHA-256 do conteudo e da evidencia.
- O CPF integral nao e armazenado. A interface valida o CPF, persiste somente o hash e exibe apenas os quatro ultimos digitos no comprovante.
- O comprovante PDF e gerado no aceite, armazenado no bucket privado `consentimento-comprovantes` e entregue somente pelo backend mediante sessao da clinica ou token imprevisivel do documento. Se a geracao inicial falhar, o PDF e regenerado sob demanda sem perder o aceite.
- Links expirados ou revogados continuam permitindo visualizar o comprovante de um aceite ja registrado, sem reabrir o formulario nem alterar o conteudo aceito.
- A central de documentos avulsos passou a listar aceites concluidos, codigo do comprovante, nivel da evidencia e download autenticado do PDF. Links concluidos nao exibem mais a acao generica de revogacao do link.
- Migration criada em `20261005021118_comprovantes_tcle_avulsos.sql`: tabela com RLS, grants apenas de leitura por clinica, bucket privado sem policies publicas e backfill explicitamente parcial dos aceites anteriores. O TCLE avulso ja aceito sera preservado sem inventar IP, navegador ou CPF.
- Migration aplicada no Supabase apos autorizacao explicita. Confirmados RLS ativo, apenas `SELECT` para `authenticated`, bucket privado sem policies publicas, registro da migration e preservacao do unico aceite anterior como evidencia parcial.
- Durante a verificacao de producao, o middleware foi corrigido para liberar exclusivamente as APIs publicas de envio do aceite e entrega do comprovante. Foi adicionado teste de regressao para impedir novo bloqueio por redirecionamento ao login.
- Validacoes aprovadas: `npm run predeploy`, `npm run build`, teste dedicado de CPF/hashes/migration, auditoria do banco, TypeScript e lint. PDF geral com 34 paginas sem cortes; permanece somente a diferenca geometrica conhecida de 7 px em uma pagina de forca, sem extrapolacao visual.
- Publicado em producao no deployment `dpl_421c8XxfMtWCGUoH2FXWnyUQeTCq`, status `READY`, com alias `https://avaliacao.medfit.med.br`.
- Teste real do aceite legado em producao aprovado sem exposicao do token ou de dados pessoais: resposta `200 application/pdf`, assinatura `%PDF-`, 81.929 bytes, `Cache-Control: private, no-store`, caminho e hash persistidos e download confirmado no bucket privado. As duas APIs publicas retornam erros de validacao em JSON quando chamadas sem dados, sem redirecionamento para login.

## 2026-10-04 - Refinamento da vitrine de produtos

- A vitrine publica foi aproximada da linguagem visual do site institucional MedFit: fundo neutro claro, tipografia editorial, verde institucional, hero sem card decorativo e componentes com bordas e sombras mais discretas.
- Os produtos agora aparecem em cards compactos. No estado fechado ficam visiveis apenas imagem, selo quando aplicavel, titulo, subtitulo, preco, duracao e o controle `Saiba mais`.
- Descricao, itens, beneficios, sinal, acoes de agendamento/consulta e compartilhamento ficam dentro da expansao nativa e acessivel do card.
- O formulario administrativo ganhou previa no mesmo formato da vitrine e controles deslizantes para definir o foco horizontal e vertical da imagem entre 0% e 100%. Produtos antigos permanecem centralizados em 50%/50%.
- Adicionada a opcao `Exibir preco sob consulta`. Quando marcada, a vitrine substitui o valor por `Sob consulta`, mostra a acao direta de contato e nao inicia pagamento online.
- A API de agendamentos tambem bloqueia produtos sob consulta, impedindo a criacao de pagamento por chamada direta.
- Migration `20261005043000_catalogo_cards_compactos.sql` aplicada no Supabase, adicionando `preco_sob_consulta`, `imagem_posicao_x` e `imagem_posicao_y` com defaults retrocompativeis e constraints de 0 a 100. Confirmados os tres campos, as duas constraints, o registro no historico e os sete produtos existentes preservados em `false` e foco `50%/50%`.
- Validacao visual local aprovada em 1440x1000 e 390x844 com as imagens publicas atuais: tres cards e tres expansores renderizados, detalhes ocultos no estado fechado, expansao funcional, focos `42% 45%`, `35% 50%` e `72% 40%` respeitados, `Sob consulta` exibido e nenhum overflow horizontal.
- Validacoes aprovadas: teste dedicado da vitrine, auditoria das 74 migrations, TypeScript, lint, build e `npm run predeploy` completo. O PDF geral manteve 34 paginas sem cortes ou overflow; permanece apenas a diferenca geometrica conhecida de 7 px na pagina de forca.
- Advisors executados apos a migration sem alerta novo relacionado a vitrine; permanecem somente os avisos preexistentes de seguranca e desempenho ja documentados. Publicacao concluida conforme a entrada de 2026-10-05.
