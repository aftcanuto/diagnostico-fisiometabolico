# Referencias clinicas

Revisao bibliografica: 24/09/2026.

## Fonte unica

`src/lib/clinical/references.ts` concentra 25 fontes para 11 modulos. Anamnese nao possui bibliografia. Portal e PDF apresentam automaticamente as fontes dos modulos selecionados; referencias compartilhadas aparecem uma unica vez. Relatorio evolutivo e IA evolutiva usam a uniao dos modulos selecionados nas avaliacoes do historico. Avaliacoes antigas sem mapa de selecao usam os dados presentes; uma selecao explicitamente falsa nao e reativada.

Os prompts individuais e integrados recebem as mesmas fontes, incluindo notas de escopo e links. Conclusoes de IA ja salvas nao sao regeneradas por esta alteracao. A bibliografia fornecida ao modelo nao garante, por si so, a validade de todas as afirmacoes geradas.

A antiga bibliografia personalizada permanece arquivada na configuracao, sem publicacao. Protocolos e outros textos configuraveis continuam independentes. Nao houve alteracao dos valores de referencia, formulas, limiares ou registros clinicos nesta revisao.

## Atualizacoes verificadas

- ACSM: 12a edicao (2025), conforme https://acsm.org/education-resources/books/guidelines-exercise-testing-prescription/.
- Kendall: 6a edicao (2023), conforme https://shop.lww.com/Kendall-s-Muscles/p/9781975159894.
- ISAK: manual de 2019, conforme https://www.ausport.gov.au/ais/performance-support/anthropometry/additional-info/recommended-course-text.
- McGill: 3a edicao (2016), conforme catalogo Human Kinetics.
- Pressao arterial: diretriz AHA/ACC de 2025, DOI 10.1161/CIR.0000000000001356.
- Jump Test: fontes especificas para RSI, EUR e saltos repetidos, sem extrapolar medias de grupos esportivos para diagnostico ou risco individual de lesao.
- Termografia: consenso TISEM e revisao de fatores de controle. A citacao Bunn 2020 foi retirada da lista ativa por verificacao bibliografica inconclusiva nesta etapa, nao por demonstracao de invalidade.
- Mantidas publicacoes originais pertinentes a equacoes antropometricas, frequencia cardiaca e outros metodos implementados. Antiguidade isolada nao torna uma fonte obsoleta.

## Validacao

`npm run test:references` compara identificadores e textos entre registro, portal, PDF, relatorio evolutivo e prompts, incluindo selecao vazia, anamnese e modulos desmarcados. Este teste integra `predeploy`.

`npm run test:references-browser` verifica largura do portal em 320, 390, 768 e 1280 pixels e limites das referencias no PDF. Usa fixtures isoladas, sem enviar dados de pacientes ao provedor de IA.

Sem migration de banco de dados. A publicacao exige novo deploy.
