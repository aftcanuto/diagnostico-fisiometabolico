-- 049 - Templates padrao de plano alimentar por clinica

create or replace function public.seed_plano_alimentar_modelos_padrao(p_clinica_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.plano_alimentar_modelos (
    clinica_id,
    objetivo,
    nome,
    descricao,
    fator_atividade,
    ajuste_calorico_kcal,
    proteina_g_kg,
    gordura_pct,
    agua_ml_kg,
    fibras_g,
    refeicoes,
    observacoes,
    referencias,
    ativo,
    padrao
  )
  select
    p_clinica_id,
    v.objetivo,
    v.nome,
    v.descricao,
    v.fator_atividade,
    v.ajuste_calorico_kcal,
    v.proteina_g_kg,
    v.gordura_pct,
    v.agua_ml_kg,
    v.fibras_g,
    v.refeicoes::jsonb,
    v.observacoes,
    v.referencias,
    true,
    v.padrao
  from (
    values
      (
        'emagrecimento',
        'Emagrecimento gradual',
        'Deficit moderado para reducao de gordura preservando massa magra.',
        1.45::numeric,
        -300,
        1.80::numeric,
        28::numeric,
        35,
        30,
        '[{"nome":"Cafe da manha","foco":"proteina + carboidrato de boa qualidade"},{"nome":"Almoco","foco":"proteina magra + vegetais + carboidrato ajustado"},{"nome":"Lanche","foco":"controle de fome e aporte proteico"},{"nome":"Jantar","foco":"proteina + vegetais + gordura boa"}]',
        'Usar como ponto de partida para reducao de gordura. Ajustar conforme adesao, rotina, treino, exames e sintomas.',
        'Mifflin-St Jeor et al., 1990; Institute of Medicine, Dietary Reference Intakes, 2005; ACSM Guidelines for Exercise Testing and Prescription, 12th ed.',
        false
      ),
      (
        'recomposicao',
        'Recomposicao corporal',
        'Plano equilibrado para reduzir gordura e sustentar ou elevar massa magra.',
        1.50::numeric,
        -100,
        1.90::numeric,
        30::numeric,
        35,
        30,
        '[{"nome":"Cafe da manha","foco":"proteina + carboidrato conforme treino"},{"nome":"Almoco","foco":"refeicao completa com alta densidade nutricional"},{"nome":"Pre/pos-treino","foco":"carboidrato e proteina conforme horario"},{"nome":"Jantar","foco":"proteina e micronutrientes"}]',
        'Modelo inicial para composicao corporal. Individualizar distribuicao por horario de treino e preferencias alimentares.',
        'Mifflin-St Jeor et al., 1990; Institute of Medicine, Dietary Reference Intakes, 2005; ACSM Guidelines for Exercise Testing and Prescription, 12th ed.',
        true
      ),
      (
        'hipertrofia',
        'Hipertrofia muscular',
        'Superavit leve para ganho de massa magra com controle de gordura.',
        1.55::numeric,
        250,
        1.80::numeric,
        25::numeric,
        40,
        30,
        '[{"nome":"Cafe da manha","foco":"energia e proteina"},{"nome":"Almoco","foco":"carboidrato suficiente + proteina"},{"nome":"Pre-treino","foco":"carboidrato de boa tolerancia"},{"nome":"Pos-treino/jantar","foco":"proteina + reposicao energetica"}]',
        'Monitorar ganho de peso, circunferencias e desempenho para ajustar superavit.',
        'Mifflin-St Jeor et al., 1990; Institute of Medicine, Dietary Reference Intakes, 2005; ACSM Guidelines for Exercise Testing and Prescription, 12th ed.',
        false
      ),
      (
        'corrida',
        'Performance em corrida',
        'Maior disponibilidade energetica para treinos e recuperacao.',
        1.65::numeric,
        150,
        1.60::numeric,
        25::numeric,
        40,
        30,
        '[{"nome":"Cafe da manha","foco":"energia sustentada"},{"nome":"Pre-treino","foco":"carboidrato conforme intensidade"},{"nome":"Almoco","foco":"reposicao de glicogenio + proteina"},{"nome":"Jantar","foco":"recuperacao e micronutrientes"}]',
        'Ajustar carboidratos em dias de treino intenso, longao e competicao.',
        'Institute of Medicine, Dietary Reference Intakes, 2005; ACSM Guidelines for Exercise Testing and Prescription, 12th ed.',
        false
      ),
      (
        'saude',
        'Saude metabolica',
        'Distribuicao conservadora para melhora de marcadores metabolicos e adesao.',
        1.40::numeric,
        0,
        1.40::numeric,
        30::numeric,
        35,
        30,
        '[{"nome":"Cafe da manha","foco":"saciedade e fibras"},{"nome":"Almoco","foco":"vegetais + proteina + carboidrato integral"},{"nome":"Lanche","foco":"qualidade alimentar"},{"nome":"Jantar","foco":"refeicao leve e completa"}]',
        'Adequar a condicoes clinicas, medicacoes, exames laboratoriais e conduta multiprofissional.',
        'Mifflin-St Jeor et al., 1990; Institute of Medicine, Dietary Reference Intakes, 2005.',
        false
      ),
      (
        'personalizado',
        'Manutencao e qualidade de vida',
        'Modelo neutro para manutencao, educacao alimentar e rotina sustentavel.',
        1.45::numeric,
        0,
        1.60::numeric,
        30::numeric,
        35,
        25,
        '[{"nome":"Cafe da manha","foco":"refeicao base equilibrada"},{"nome":"Almoco","foco":"prato completo"},{"nome":"Lanche","foco":"praticidade e proteina quando necessario"},{"nome":"Jantar","foco":"equilibrio e digestibilidade"}]',
        'Ponto de partida para personalizacao individual na finalizacao da avaliacao.',
        'Mifflin-St Jeor et al., 1990; Institute of Medicine, Dietary Reference Intakes, 2005.',
        false
      )
  ) as v(
    objetivo,
    nome,
    descricao,
    fator_atividade,
    ajuste_calorico_kcal,
    proteina_g_kg,
    gordura_pct,
    agua_ml_kg,
    fibras_g,
    refeicoes,
    observacoes,
    referencias,
    padrao
  )
  where not exists (
    select 1
    from public.plano_alimentar_modelos m
    where m.clinica_id = p_clinica_id
      and lower(m.nome) = lower(v.nome)
  );
end;
$$;

select public.seed_plano_alimentar_modelos_padrao(id)
from public.clinicas;

create or replace function public.seed_plano_alimentar_modelos_padrao_nova_clinica()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_plano_alimentar_modelos_padrao(new.id);
  return new;
end;
$$;

drop trigger if exists trg_seed_plano_alimentar_modelos_padrao on public.clinicas;
create trigger trg_seed_plano_alimentar_modelos_padrao
after insert on public.clinicas
for each row
execute function public.seed_plano_alimentar_modelos_padrao_nova_clinica();
