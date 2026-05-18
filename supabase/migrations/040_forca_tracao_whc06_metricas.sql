-- 040 - Estrutura auditavel para dinamometria de tracao WHC-06/BLE
-- O hardware WHC-06 envia apenas leituras brutas em kgf; as demais metricas
-- ficam calculadas e armazenadas dentro de public.forca.tracao_testes (JSONB).

alter table public.forca
  add column if not exists modelo_dinamometria text not null default 'medeor',
  add column if not exists tracao_testes jsonb default '[]'::jsonb,
  add column if not exists tracao_schema_versao integer not null default 1;

update public.forca
set tracao_testes = '[]'::jsonb
where tracao_testes is null;

alter table public.forca
  alter column tracao_testes set default '[]'::jsonb,
  alter column tracao_testes set not null;

alter table public.forca
  drop constraint if exists forca_modelo_dinamometria_check;

alter table public.forca
  add constraint forca_modelo_dinamometria_check
  check (modelo_dinamometria in ('medeor', 'tracao'));

alter table public.forca
  drop constraint if exists forca_tracao_testes_jsonb_array_check;

alter table public.forca
  add constraint forca_tracao_testes_jsonb_array_check
  check (jsonb_typeof(tracao_testes) = 'array');

alter table public.forca
  drop constraint if exists forca_tracao_schema_versao_check;

alter table public.forca
  add constraint forca_tracao_schema_versao_check
  check (tracao_schema_versao >= 1);

create or replace function public.validar_forca_tracao_testes_whc06(payload jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  item jsonb;
  modo text;
begin
  if payload is null then
    return true;
  end if;

  if jsonb_typeof(payload) <> 'array' then
    return false;
  end if;

  for item in select value from jsonb_array_elements(payload)
  loop
    if jsonb_typeof(item) <> 'object' then
      return false;
    end if;

    modo := coalesce(item->>'modo_coleta', 'manual');
    if modo not in ('manual', 'bluetooth') then
      return false;
    end if;

    if item ? 'lado_d' and jsonb_typeof(item->'lado_d') <> 'object' then
      return false;
    end if;

    if item ? 'lado_e' and jsonb_typeof(item->'lado_e') <> 'object' then
      return false;
    end if;

    if item ? 'fator' and nullif(item->>'fator', '') is not null and (item->>'fator') !~ '^-?[0-9]+([.,][0-9]+)?$' then
      return false;
    end if;

    if item ? 'peso_corporal_kg' and nullif(item->>'peso_corporal_kg', '') is not null and (item->>'peso_corporal_kg') !~ '^-?[0-9]+([.,][0-9]+)?$' then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

alter table public.forca
  drop constraint if exists forca_tracao_testes_whc06_shape_check;

alter table public.forca
  add constraint forca_tracao_testes_whc06_shape_check
  check (public.validar_forca_tracao_testes_whc06(tracao_testes));

create index if not exists idx_forca_modelo_dinamometria
  on public.forca(modelo_dinamometria);

create index if not exists idx_forca_tracao_testes_gin
  on public.forca using gin (tracao_testes);

comment on column public.forca.modelo_dinamometria is
  'Modelo usado na dinamometria isometrica manual: medeor/sptech por pressao ou tracao WHC-06/BLE.';

comment on column public.forca.tracao_testes is
  'Array JSONB de testes de tracao WHC-06/BLE. Estrutura esperada: modo_coleta, teste, musculo, exercicio_ref, fator, peso_corporal_kg, numero_tentativas, tentativas_fim_kgf, lados D/E com FIM kgf, FIM N, forca inicial, TPF, RFD global, RFD 50/100/200 ms, impulso, sustentacao 80%, duracao, 1RM, forca relativa, alem de media de tentativas, fadiga, LSI, assimetria e diferenca absoluta.';

comment on column public.forca.tracao_schema_versao is
  'Versao da estrutura JSONB usada em tracao_testes. Versao 1 contempla WHC-06/BLE manual ou bluetooth.';

comment on function public.validar_forca_tracao_testes_whc06(jsonb) is
  'Valida a estrutura basica do array JSONB de dinamometria de tracao WHC-06/BLE sem bloquear registros antigos com poucos campos.';
