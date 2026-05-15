-- 038 - Reposiciona historico familiar dentro de historico medico

update public.anamnese_templates t
set campos = reorganizado.campos
from (
  select
    template_id,
    jsonb_agg(campo order by sort_ord) as campos
  from (
    select
      t.id as template_id,
      case
        when e.campo ->> 'id' = 'historia_familiar' then
          jsonb_set(
            e.campo,
            '{label}',
            to_jsonb('Histórico de doença na família'::text),
            true
          )
        else e.campo
      end as campo,
      case
        when e.campo ->> 'id' = 'historia_familiar' then coalesce(sec.sec_ord + 0.1, e.ord::numeric)
        when sec.sec_ord is not null and e.ord::numeric > sec.sec_ord then e.ord::numeric + 1
        else e.ord::numeric
      end as sort_ord
    from public.anamnese_templates t
    cross join lateral jsonb_array_elements(t.campos) with ordinality as e(campo, ord)
    left join lateral (
      select s.ord::numeric as sec_ord
      from jsonb_array_elements(t.campos) with ordinality as s(campo, ord)
      where s.campo ->> 'id' = 'sec_medico'
      order by s.ord
      limit 1
    ) sec on true
    where jsonb_typeof(t.campos) = 'array'
  ) ordenado
  group by template_id
) reorganizado
where t.id = reorganizado.template_id
  and jsonb_typeof(t.campos) = 'array'
  and exists (
    select 1
    from jsonb_array_elements(t.campos) as campo
    where campo ->> 'id' = 'historia_familiar'
  );
