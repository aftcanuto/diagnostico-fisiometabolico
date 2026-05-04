-- Migration 012 — CPF do paciente + campo conselho para avaliador
-- Necessário para identificação no rodapé do laudo

-- Adicionar CPF ao paciente (campo opcional para não quebrar registros existentes)
alter table public.pacientes
  add column if not exists cpf text;

-- Garantir que crefito_crm existe em avaliadores (já estava, mas por segurança)
alter table public.avaliadores
  add column if not exists crefito_crm text;

-- Índice para busca por CPF (útil para evitar duplicatas no futuro)
create index if not exists idx_pacientes_cpf on public.pacientes(cpf) where cpf is not null;
