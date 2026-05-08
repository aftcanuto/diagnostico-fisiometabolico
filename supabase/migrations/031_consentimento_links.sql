create table if not exists public.consentimento_links (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  avaliacao_id uuid references public.avaliacoes(id) on delete set null,
  modelo_id uuid not null references public.consentimento_modelos(id) on delete restrict,
  token text not null unique,
  expira_em timestamptz not null default (now() + interval '30 days'),
  revogado boolean not null default false,
  aceito_em timestamptz,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_consentimento_links_paciente on public.consentimento_links(paciente_id, created_at desc);
create index if not exists idx_consentimento_links_token on public.consentimento_links(token);

alter table public.consentimento_links enable row level security;

drop policy if exists "consentimento_links_clinica_select" on public.consentimento_links;
create policy "consentimento_links_clinica_select" on public.consentimento_links
for select using (clinica_id = public.current_clinica_id());

drop policy if exists "consentimento_links_clinica_insert" on public.consentimento_links;
create policy "consentimento_links_clinica_insert" on public.consentimento_links
for insert with check (clinica_id = public.current_clinica_id());

drop policy if exists "consentimento_links_clinica_update" on public.consentimento_links;
create policy "consentimento_links_clinica_update" on public.consentimento_links
for update using (clinica_id = public.current_clinica_id())
with check (clinica_id = public.current_clinica_id());
