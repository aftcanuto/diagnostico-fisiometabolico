-- 041 - Dados corporais base no cadastro do paciente
-- Permite reaproveitar peso e altura automaticamente nos modulos que dependem destes dados.

alter table public.pacientes
  add column if not exists peso_base_kg numeric(5,2),
  add column if not exists altura_cm numeric(5,2);

comment on column public.pacientes.peso_base_kg is
  'Peso corporal de referencia do paciente em kg, usado para pre-preencher modulos quando ainda nao houver medida especifica da avaliacao.';

comment on column public.pacientes.altura_cm is
  'Altura/estatura de referencia do paciente em centimetros, usada para pre-preencher modulos quando ainda nao houver medida especifica da avaliacao.';

alter table public.pacientes
  drop constraint if exists pacientes_peso_base_kg_range;
alter table public.pacientes
  add constraint pacientes_peso_base_kg_range
  check (peso_base_kg is null or (peso_base_kg >= 25 and peso_base_kg <= 350));

alter table public.pacientes
  drop constraint if exists pacientes_altura_cm_range;
alter table public.pacientes
  add constraint pacientes_altura_cm_range
  check (altura_cm is null or (altura_cm >= 80 and altura_cm <= 230));

alter table public.bioimpedancia
  add column if not exists altura_cm numeric(5,2);

comment on column public.bioimpedancia.altura_cm is
  'Altura/estatura usada no exame de bioimpedancia. Quando vazio, o formulario preenche com o cadastro do paciente ou antropometria.';

alter table public.bioimpedancia
  drop constraint if exists bioimpedancia_altura_cm_range;
alter table public.bioimpedancia
  add constraint bioimpedancia_altura_cm_range
  check (altura_cm is null or (altura_cm >= 80 and altura_cm <= 230));
