-- Comprovantes auditaveis para TCLE/consentimentos enviados como documentos avulsos.
-- Preserva o aceite mesmo se o link for posteriormente revogado.
begin;

create extension if not exists pgcrypto;

create table if not exists public.documentos_pre_teste_aceites (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null unique references public.documentos_pre_teste_avulsos(id) on delete restrict,
  clinica_id uuid not null references public.clinicas(id) on delete restrict,
  modelo_id uuid references public.consentimento_modelos(id) on delete restrict,
  modelo_nome text not null,
  modelo_tipo text not null,
  texto_versao integer not null check (texto_versao > 0),
  texto_aceito text not null,
  texto_html_aceito text,
  declaracao_aceite text not null,
  signatario_nome text,
  signatario_cpf_hash text check (signatario_cpf_hash is null or signatario_cpf_hash ~ '^[0-9a-f]{64}$'),
  signatario_cpf_final text check (signatario_cpf_final is null or signatario_cpf_final ~ '^[0-9]{4}$'),
  destinatario_nome text,
  destinatario_contato text,
  aceito_em timestamptz not null,
  ip text,
  user_agent text,
  conteudo_hash text not null check (conteudo_hash ~ '^[0-9a-f]{64}$'),
  evidencia_hash text not null unique check (evidencia_hash ~ '^[0-9a-f]{64}$'),
  comprovante_codigo text not null unique,
  nivel_evidencia text not null default 'completo' check (nivel_evidencia in ('completo', 'parcial_legado')),
  observacao_evidencia text,
  pdf_path text,
  pdf_hash text check (pdf_hash is null or pdf_hash ~ '^[0-9a-f]{64}$'),
  revogado boolean not null default false,
  revogado_em timestamptz,
  revogado_por uuid references auth.users(id),
  motivo_revogacao text,
  created_at timestamptz not null default now(),
  constraint documentos_pre_teste_aceites_pdf_path check (
    pdf_path is null or split_part(pdf_path, '/', 1) = clinica_id::text
  ),
  constraint documentos_pre_teste_aceites_revogacao check (
    (not revogado and revogado_em is null)
    or (revogado and revogado_em is not null)
  )
);

create index if not exists idx_documentos_pre_teste_aceites_clinica
  on public.documentos_pre_teste_aceites(clinica_id, aceito_em desc);

create index if not exists idx_documentos_pre_teste_aceites_codigo
  on public.documentos_pre_teste_aceites(comprovante_codigo);

alter table public.documentos_pre_teste_aceites enable row level security;
revoke all on public.documentos_pre_teste_aceites from anon, authenticated;
grant select on public.documentos_pre_teste_aceites to authenticated;

drop policy if exists documentos_pre_teste_aceites_clinica_select
  on public.documentos_pre_teste_aceites;
create policy documentos_pre_teste_aceites_clinica_select
  on public.documentos_pre_teste_aceites
  for select
  to authenticated
  using (public.is_membro_clinica(clinica_id));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'consentimento-comprovantes',
  'consentimento-comprovantes',
  false,
  5242880,
  array['application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['application/pdf'];

-- Sem policies em storage.objects: somente o backend com credencial de servico
-- pode gravar ou ler os PDFs. A entrega passa por rota autenticada ou token.

-- Aceites avulsos anteriores nao recebem dados tecnicos retroativos. O snapshot
-- usa o modelo atual e fica explicitamente marcado como evidencia parcial.
insert into public.documentos_pre_teste_aceites (
  documento_id,
  clinica_id,
  modelo_id,
  modelo_nome,
  modelo_tipo,
  texto_versao,
  texto_aceito,
  texto_html_aceito,
  declaracao_aceite,
  signatario_nome,
  destinatario_nome,
  destinatario_contato,
  aceito_em,
  conteudo_hash,
  evidencia_hash,
  comprovante_codigo,
  nivel_evidencia,
  observacao_evidencia
)
select
  d.id,
  d.clinica_id,
  d.modelo_id,
  coalesce(m.nome, 'Consentimento / TCLE'),
  coalesce(m.tipo, 'tcle'),
  greatest(coalesce(m.versao, 1), 1),
  coalesce(m.texto, ''),
  m.texto_html,
  'Li e concordo com o conteudo apresentado.',
  d.destinatario_nome,
  d.destinatario_nome,
  d.destinatario_contato,
  d.aceito_em,
  encode(digest(
    coalesce(m.nome, '') || '|' || coalesce(m.tipo, '') || '|' ||
    coalesce(m.versao::text, '1') || '|' || coalesce(m.texto, '') || '|' ||
    coalesce(m.texto_html, ''),
    'sha256'
  ), 'hex'),
  encode(digest(
    d.id::text || '|' || d.clinica_id::text || '|' ||
    coalesce(d.modelo_id::text, '') || '|' || d.aceito_em::text || '|' ||
    coalesce(d.destinatario_nome, '') || '|' || coalesce(d.destinatario_contato, '') || '|' ||
    coalesce(m.texto, '') || '|' || coalesce(m.texto_html, ''),
    'sha256'
  ), 'hex'),
  'TCLE-AV-' || upper(left(replace(d.id::text, '-', ''), 10)),
  'parcial_legado',
  'Aceite anterior a trilha completa. IP, navegador e CPF nao foram coletados; o conteudo foi recuperado do modelo vigente durante a migracao.'
from public.documentos_pre_teste_avulsos d
left join public.consentimento_modelos m on m.id = d.modelo_id
where d.tipo = 'consentimento'
  and d.aceito_em is not null
on conflict (documento_id) do nothing;

insert into public.sistema_migrations_aplicadas(nome, origem, observacao)
values (
  '20261005021118_comprovantes_tcle_avulsos.sql',
  'migration',
  'Comprovantes auditaveis e bucket privado para TCLE avulso'
)
on conflict (nome) do nothing;

notify pgrst, 'reload schema';
commit;
