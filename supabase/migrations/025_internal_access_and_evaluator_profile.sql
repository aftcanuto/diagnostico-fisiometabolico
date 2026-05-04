-- 025 - Ajustes para uso interno, convites e perfil do avaliador

alter table if exists public.avaliadores
  add column if not exists especialidade text;

create or replace function public.handle_new_user() returns trigger
security definer set search_path = public
language plpgsql as $$
declare
  nova_clinica uuid;
  convite_clinica uuid;
  convite_papel text;
  nome_user text;
  todos_modulos jsonb;
begin
  nome_user := coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1));
  convite_clinica := nullif(new.raw_user_meta_data->>'clinica_convite_id', '')::uuid;
  convite_papel := coalesce(nullif(new.raw_user_meta_data->>'papel_convite', ''), 'avaliador');
  todos_modulos := jsonb_build_object(
    'anamnese', true,
    'sinais_vitais', true,
    'posturografia', true,
    'bioimpedancia', true,
    'antropometria', true,
    'flexibilidade', true,
    'forca', true,
    'rml', true,
    'cardiorrespiratorio', true,
    'biomecanica_corrida', true
  );

  insert into public.avaliadores (id, nome)
  values (new.id, nome_user)
  on conflict (id) do update set nome = coalesce(public.avaliadores.nome, excluded.nome);

  if convite_clinica is not null then
    insert into public.clinica_membros (clinica_id, user_id, papel, ativo)
    values (convite_clinica, new.id, convite_papel, true)
    on conflict do nothing;
    return new;
  end if;

  if not exists (select 1 from public.clinica_membros where user_id = new.id) then
    insert into public.clinicas (nome)
    values (coalesce(new.raw_user_meta_data->>'clinica', nome_user || ' - Clínica'))
    returning id into nova_clinica;

    insert into public.clinica_membros (clinica_id, user_id, papel, ativo)
    values (nova_clinica, new.id, 'owner', true);

    insert into public.produtos (clinica_id, nome, descricao, padrao, ativo, modulos)
    values (nova_clinica, 'Diagnóstico Completo', 'Avaliação completa com todos os módulos.', true, true, todos_modulos);
  end if;

  return new;
end $$;

update public.produtos
set modulos = coalesce(modulos, '{}'::jsonb) || jsonb_build_object(
  'anamnese', true,
  'sinais_vitais', true,
  'posturografia', true,
  'bioimpedancia', true,
  'antropometria', true,
  'flexibilidade', true,
  'forca', true,
  'rml', true,
  'cardiorrespiratorio', true,
  'biomecanica_corrida', true
)
where padrao = true;
