# BACKUP E RESTAURACAO - Diagnostico Fisiometabolico

Este documento explica como recuperar o sistema em outro computador caso o computador atual seja perdido, danificado ou fique inacessivel.

Importante: este arquivo deve ficar junto do projeto, mas as chaves reais devem ser guardadas tambem em um local seguro, como Bitwarden, 1Password, Google Password Manager, cofre do Google Drive ou outro gerenciador de senhas. Nao e recomendado colocar `SUPABASE_SERVICE_ROLE_KEY` ou `ANTHROPIC_API_KEY` em arquivo versionado no GitHub.

## 1. O que precisa estar salvo

Para restaurar o sistema completo, voce precisa de quatro coisas:

1. Codigo-fonte do sistema.
2. Banco de dados e arquivos do Supabase.
3. Variaveis de ambiente.
4. Acesso as contas GitHub, Vercel e Supabase.

## 2. Local do projeto neste computador

```powershell
C:\Users\canut\Documents\Codex\2026-04-27\files-mentioned-by-the-user-diagnostico\unzipped\diagnostico-fisiometabolico
```

## 3. Repositorio GitHub

Repositorio:

```text
https://github.com/aftcanuto/diagnostico-fisiometabolico.git
```

Para subir uma copia atualizada:

```powershell
cd "C:\Users\canut\Documents\Codex\2026-04-27\files-mentioned-by-the-user-diagnostico\unzipped\diagnostico-fisiometabolico"
git status
git add .
git commit -m "Backup do projeto"
git push
```

Se aparecer `nothing to commit`, o GitHub ja esta com a ultima versao dos arquivos rastreados.

## 4. Restaurar em outro computador

### 4.1 Instalar programas

No computador novo, instale:

- Git
- Node.js LTS
- VS Code ou Cursor, se desejar editar codigo
- Conta GitHub logada

### 4.2 Baixar o sistema

```powershell
cd "$env:USERPROFILE\Documents"
git clone https://github.com/aftcanuto/diagnostico-fisiometabolico.git
cd diagnostico-fisiometabolico
npm install --cache .npm-cache --prefer-online
```

### 4.3 Criar o arquivo `.env.local`

Crie um arquivo chamado `.env.local` na raiz do projeto e preencha com as chaves reais.

Modelo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=COLE_AQUI_A_CHAVE_ANON
SUPABASE_SERVICE_ROLE_KEY=COLE_AQUI_A_CHAVE_SERVICE_ROLE
ANTHROPIC_API_KEY=COLE_AQUI_A_CHAVE_ANTHROPIC
ANTHROPIC_MODEL=claude-sonnet-4-5
NEXT_PUBLIC_APP_URL=https://diagnostico-fisiometabolico.vercel.app
```

Observacoes:

- `NEXT_PUBLIC_SUPABASE_URL` deve ficar sem `/rest/v1`.
- `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser exibida ao paciente ou enviada para frontend.
- `ANTHROPIC_API_KEY` deve ficar somente em variavel de ambiente.

## 5. Contas e acessos que precisam estar guardados

Guarde estes acessos em um gerenciador de senhas:

```text
GitHub
- URL: https://github.com
- Usuario: aftcanuto
- Repositorio: aftcanuto/diagnostico-fisiometabolico

Vercel
- URL: https://vercel.com
- Projeto: diagnostico-fisiometabolico
- Dominio de producao: https://diagnostico-fisiometabolico.vercel.app

Supabase
- URL: https://supabase.com
- Projeto: diagnostico-fisiometabolico
- Project ref: kjfhhrdfsgvdqygbvmwb

Anthropic
- URL: https://console.anthropic.com
- API key: guardar no cofre de senhas
```

## 6. Variaveis de ambiente a conferir na Vercel

Na Vercel, abra:

`Project Settings` -> `Environment Variables`

As variaveis obrigatorias sao:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
ANTHROPIC_MODEL
NEXT_PUBLIC_APP_URL
```

Depois de alterar qualquer variavel na Vercel, fazer redeploy.

## 7. Backup do Supabase

O codigo fica no GitHub, mas os dados dos pacientes ficam no Supabase.

No Supabase:

1. Acesse o projeto.
2. Va em `Project Settings`.
3. Abra `Database`.
4. Verifique a area de backups.
5. Se necessario, exporte os dados manualmente pelo SQL Editor ou painel de backup.

Tabelas criticas:

```text
clinicas
clinica_membros
pacientes
avaliacoes
scores
anamnese
sinais_vitais
posturografia
bioimpedancia
antropometria
flexibilidade
forca
rml
cardiorrespiratorio
biomecanica_corrida
analises_ia
paciente_tokens
consentimento_modelos
consentimento_links
consentimento_aceites
protocolo_recomendacoes
protocolo_envios
prontuario_eventos
produtos
pdf_config
```

## 8. Buckets de arquivos no Supabase

Conferir estes buckets:

```text
posturografia
branding
biomecanica
produto-imagens
```

Eles guardam fotos, logomarcas, imagens de biomecanica e imagens comerciais dos produtos.

## 9. Migrations

As migrations ficam em:

```text
supabase/migrations
```

Ao restaurar em um Supabase novo, aplicar as migrations em ordem numerica.

Depois conferir no sistema:

`Configuracoes` -> `Saude do sistema`

O painel deve mostrar:

- Banco OK
- Storage OK
- IA OK
- PDF OK
- Env vars OK
- Migrations OK

## 10. Testar localmente depois da restauracao

```powershell
cd "CAMINHO_DO_PROJETO"
npm install --cache .npm-cache --prefer-online
npm.cmd run predeploy
npm.cmd run dev
```

Depois abrir:

```text
http://localhost:3000
```

Checklist manual:

- Login funciona.
- Pacientes aparecem.
- Avaliacao abre.
- Modulos salvam.
- IA gera analise.
- PDF baixa.
- Portal do paciente abre por link.
- TCLE gera aceite e comprovante.
- Upload de fotos funciona.
- Catalogo de produtos abre.
- Painel de saude fica sem alertas criticos.

## 11. Deploy em producao

Para enviar alteracoes para producao:

```powershell
cd "C:\Users\canut\Documents\Codex\2026-04-27\files-mentioned-by-the-user-diagnostico\unzipped\diagnostico-fisiometabolico"
git status
git add .
git commit -m "Mensagem objetiva da alteracao"
git push
```

A Vercel faz o deploy automaticamente apos o `git push`.

## 12. Restauracao emergencial resumida

Se precisar restaurar rapido:

```powershell
cd "$env:USERPROFILE\Documents"
git clone https://github.com/aftcanuto/diagnostico-fisiometabolico.git
cd diagnostico-fisiometabolico
npm install --cache .npm-cache --prefer-online
```

Depois:

1. Criar `.env.local`.
2. Conferir variaveis na Vercel.
3. Conferir Supabase.
4. Rodar `npm.cmd run predeploy`.
5. Rodar `npm.cmd run dev`.

## 13. Onde guardar as chaves reais

Recomendacao minima:

- Guardar as chaves em um cofre de senhas.
- Guardar uma copia do `.env.local` em um arquivo criptografado no Google Drive ou OneDrive.
- Nao publicar chaves em repositorio GitHub.

Campos para preencher no cofre:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
NEXT_PUBLIC_APP_URL=
```

## 14. Data deste backup

Atualizado em: 2026-06-03.
