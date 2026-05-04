# Diagnostico Fisiometabolico - Continuidade do Projeto

Este arquivo serve para continuar o trabalho em outro computador ou em uma nova conversa.

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
