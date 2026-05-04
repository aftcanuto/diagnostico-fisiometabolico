-- Migration 013 — Configurações do PDF por clínica
-- Permite editar protocolos, referências e textos do laudo sem alterar código

create table if not exists public.pdf_config (
  id uuid primary key default uuid_generate_v4(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  -- Protocolos (lista editável)
  protocolos jsonb not null default '[
    {"id":"antropometria","label":"Antropometria","texto":"Padrão ISAK"},
    {"id":"gordura","label":"% Gordura","texto":"Jackson & Pollock 7 dobras + Siri"},
    {"id":"ossea","label":"Massa óssea","texto":"Von Döbeln (Rocha, 1974)"},
    {"id":"somatotipo","label":"Somatotipo","texto":"Heath-Carter"},
    {"id":"preensao","label":"Preensão palmar","texto":"Dinamômetro Medeor (Massy-Westropp, 2011)"},
    {"id":"dinamometria","label":"Dinamometria isométrica","texto":"SP Tech / Medeor (protocolo interno)"},
    {"id":"flexibilidade","label":"Flexibilidade","texto":"Banco de Wells (ACSM)"},
    {"id":"aerobico","label":"Aeróbico","texto":"Zonas % FCmáx (Tanaka, 2001)"},
    {"id":"ffmi","label":"FFMI","texto":"Schutz 2002; limite: Berkhan/McDonald"}
  ]'::jsonb,
  -- Referências bibliográficas (lista editável)
  referencias jsonb not null default '[
    {"id":"jackson","texto":"Jackson & Pollock. Br J Nutr. 1978;40(3):497–504."},
    {"id":"siri","texto":"Siri WE. Univ. of California; 1961."},
    {"id":"carter","texto":"Carter & Heath. Somatotyping. Cambridge; 1990."},
    {"id":"tanaka","texto":"Tanaka et al. J Am Coll Cardiol. 2001;37(1):153–6."},
    {"id":"stewart","texto":"Stewart et al. ISAK Standards; 2011."},
    {"id":"leong","texto":"Leong et al. Lancet. 2015;386:266–273."},
    {"id":"medeor","texto":"Medeor Ltda. Manual técnico do dinamômetro isométrico Medeor. São Paulo; 2019."},
    {"id":"massy","texto":"Massy-Westropp NM et al. Hand Grip Strength normative data. BMC Res Notes. 2011;4:127."}
  ]'::jsonb,
  -- Texto do rodapé legal
  texto_legal text not null default 'Este documento é um relatório técnico e não substitui diagnóstico ou prescrição médica.',
  -- Nota sobre equipamentos/aparelhos
  nota_equipamentos text default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(clinica_id)
);

-- RLS
alter table public.pdf_config enable row level security;

drop policy if exists "pdf_config_clinica_read" on public.pdf_config;
create policy "pdf_config_clinica_read" on public.pdf_config
  for select using (
    clinica_id = public.current_clinica_id()
  );

drop policy if exists "pdf_config_clinica_write" on public.pdf_config;
create policy "pdf_config_clinica_write" on public.pdf_config
  for all using (
    clinica_id = public.current_clinica_id()
    and public.current_papel() in ('owner', 'admin')
  )
  with check (
    clinica_id = public.current_clinica_id()
    and public.current_papel() in ('owner', 'admin')
  );
