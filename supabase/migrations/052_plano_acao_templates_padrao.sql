-- 052 - Templates padrao de plano de acao por clinica

create or replace function public.seed_plano_acao_modelos_padrao(p_clinica_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.plano_acao_modelos (
    clinica_id,
    objetivo,
    nome,
    descricao,
    prioridades,
    metas_30_dias,
    metas_60_dias,
    metas_90_dias,
    recomendacoes,
    alertas_encaminhamento,
    ativo,
    padrao
  )
  select
    p_clinica_id,
    v.objetivo,
    v.nome,
    v.descricao,
    v.prioridades,
    v.metas_30_dias,
    v.metas_60_dias,
    v.metas_90_dias,
    v.recomendacoes::jsonb,
    v.alertas_encaminhamento,
    true,
    v.padrao
  from (
    values
      (
        'recomposicao',
        'Recomposicao corporal',
        'Plano inicial para reduzir gordura, preservar massa magra e melhorar capacidade funcional.',
        'Priorizar consistencia semanal, controle de gordura corporal, manutencao de massa magra e progressao segura de treino.',
        'Organizar rotina de treino, revisar ingestao proteica, ajustar sono e iniciar monitoramento de peso, cintura e desempenho.',
        'Progredir cargas e volume de treino, reavaliar circunferencias e ajustar estrategia conforme adesao e resposta corporal.',
        'Reavaliar composicao corporal, capacidade cardiorrespiratoria e forca para redefinir metas da proxima etapa.',
        '{"composicao_corporal":"Definir meta realista de reducao de gordura e acompanhar medidas-chave sem usar peso isolado como unico indicador.","forca":"Manter treino resistido progressivo, com foco em grandes grupos musculares e tecnica.","flexibilidade":"Inserir mobilidade direcionada aos pontos limitantes encontrados.","cardiorrespiratorio":"Usar zonas de treino para melhorar condicionamento e gasto energetico com seguranca.","rml":"Trabalhar endurance muscular de core e membros conforme testes com menor desempenho.","postura":"Corrigir compensacoes posturais que possam limitar movimento e treino.","biomecanica":"Ajustar padrao de corrida ou movimento quando houver achados relevantes."}',
        'Encaminhar para avaliacao medica, fisioterapeutica ou nutricional quando houver dor persistente, sinais clinicos relevantes ou necessidade de conduta especifica.',
        true
      ),
      (
        'emagrecimento',
        'Emagrecimento e saude metabolica',
        'Plano para reducao gradual de gordura corporal com preservacao de massa magra.',
        'Priorizar deficit sustentavel, aumento de gasto energetico, protecao de massa magra e acompanhamento de sinais vitais.',
        'Definir rotina alimentar e de treino, iniciar caminhada/zonas leves quando indicado e registrar medidas corporais.',
        'Aumentar gradualmente intensidade cardiorrespiratoria e manter treino de forca para preservar massa magra.',
        'Reavaliar percentual de gordura, cintura, VO2max estimado e aderencia para nova progressao.',
        '{"composicao_corporal":"Focar reducao de gordura com acompanhamento por cintura, RCQ, percentual de gordura e massa magra.","forca":"Usar treino de forca para preservar massa magra durante o deficit energetico.","flexibilidade":"Manter mobilidade para favorecer tecnica e conforto nos exercicios.","cardiorrespiratorio":"Iniciar em zonas toleraveis e progredir conforme recuperacao e sinais vitais.","rml":"Fortalecer core e resistencia localizada para sustentar exercicios repetidos.","postura":"Observar compensacoes que possam limitar exercicios de membros inferiores.","biomecanica":"Ajustar corrida ou caminhada quando houver sobrecarga articular."}',
        'Encaminhar quando houver hipertensao nao controlada, sintomas cardiometabolicos, dor limitante ou necessidade de conduta nutricional individualizada.',
        false
      ),
      (
        'hipertrofia',
        'Hipertrofia e ganho de massa magra',
        'Plano para ganho de massa magra com controle de assimetrias e capacidade de recuperacao.',
        'Priorizar progressao de carga, volume adequado, ingestao energetica suficiente e controle de assimetrias.',
        'Organizar periodizacao inicial, padronizar tecnica, registrar cargas e garantir aporte energetico e proteico.',
        'Progredir volume e intensidade, revisar assimetrias e monitorar fadiga entre sessoes.',
        'Reavaliar massa magra, forca, FFMI e circunferencias para ajustar o novo bloco.',
        '{"composicao_corporal":"Monitorar ganho de massa magra evitando aumento excessivo de gordura.","forca":"Priorizar progressao estruturada e corrigir assimetrias relevantes.","flexibilidade":"Preservar amplitude de movimento nos principais padroes de treino.","cardiorrespiratorio":"Manter condicionamento minimo para recuperacao sem comprometer hipertrofia.","rml":"Usar resistencia localizada como suporte, especialmente em core e estabilizadores.","postura":"Corrigir desalinhamentos que reduzam eficiencia tecnica.","biomecanica":"Avaliar padroes de movimento caso haja dor, perda de performance ou compensacoes."}',
        'Encaminhar se houver dor persistente, assimetrias importantes, fadiga desproporcional ou suspeita de lesao.',
        false
      ),
      (
        'corrida',
        'Corrida e performance',
        'Plano para melhorar eficiencia de corrida, condicionamento e controle biomecanico.',
        'Priorizar tecnica de corrida, progressao de carga, zonas de treino, recuperacao e controle de sobrecarga.',
        'Ajustar volume inicial, definir zonas, revisar cadencia/padroes e iniciar exercicios corretivos.',
        'Progredir intensidade por zonas, incluir treino de forca especifico e reavaliar sintomas.',
        'Reavaliar biomecanica, VO2max estimado, limiar e resistencia muscular para nova periodizacao.',
        '{"composicao_corporal":"Acompanhar composicao corporal sem comprometer disponibilidade energetica.","forca":"Fortalecer quadril, joelho, panturrilha e core para reduzir sobrecarga.","flexibilidade":"Trabalhar mobilidade de tornozelo, quadril e cadeia posterior quando limitantes.","cardiorrespiratorio":"Usar zonas de treino para distribuir intensidade e recuperar melhor.","rml":"Aumentar tolerancia muscular para repeticao de passada e estabilizacao.","postura":"Observar postura dinamica e controle de tronco durante corrida.","biomecanica":"Corrigir achados de passada, pelve, joelho e pe conforme analise cinematica."}',
        'Encaminhar se houver dor durante corrida, perda funcional, assimetria importante ou suspeita de lesao por sobrecarga.',
        false
      ),
      (
        'dor',
        'Dor e retorno funcional',
        'Plano conservador para retomar funcao com seguranca e reduzir fatores de sobrecarga.',
        'Priorizar reducao de sintomas, controle motor, amplitude funcional e progressao sem piora de dor.',
        'Identificar gatilhos, reduzir sobrecarga, iniciar mobilidade e exercicios leves tolerados.',
        'Progredir controle motor, resistencia local e forca conforme tolerancia.',
        'Reavaliar dor, funcao, postura e desempenho para liberar novas demandas.',
        '{"composicao_corporal":"Usar dados corporais como apoio, sem foco primario se houver dor limitante.","forca":"Treinar em faixas toleradas, priorizando controle e simetria.","flexibilidade":"Trabalhar mobilidade especifica sem provocar dor relevante.","cardiorrespiratorio":"Escolher modalidades de baixo impacto quando necessario.","rml":"Usar resistencia localizada para estabilizacao e tolerancia funcional.","postura":"Corrigir compensacoes associadas ao quadro doloroso.","biomecanica":"Revisar padroes que aumentem carga articular ou muscular."}',
        'Encaminhar para fisioterapia ou medicina quando houver dor persistente, sintomas neurologicos, limitacao funcional importante ou piora progressiva.',
        false
      ),
      (
        'performance',
        'Performance esportiva',
        'Plano para otimizar desempenho com base nos pontos fortes e limitantes da avaliacao.',
        'Priorizar metricas que mais interferem no esporte, corrigir gargalos e monitorar carga.',
        'Definir indicadores-alvo, corrigir deficits principais e padronizar rotina de treino.',
        'Aumentar especificidade esportiva e acompanhar resposta de forca, resistencia e cardio.',
        'Reavaliar desempenho, assimetrias, zonas e biomecanica para novo ciclo.',
        '{"composicao_corporal":"Ajustar composicao de acordo com a modalidade, sem comprometer desempenho.","forca":"Treinar os grupos e relacoes musculares mais importantes para o esporte.","flexibilidade":"Preservar mobilidade necessaria ao gesto esportivo.","cardiorrespiratorio":"Usar zonas e limiares para melhorar tolerancia ao esforco.","rml":"Desenvolver resistencia muscular nos padroes mais demandados.","postura":"Melhorar estabilidade e alinhamento para transferencia de forca.","biomecanica":"Usar analise do gesto para corrigir perdas de eficiencia."}',
        'Encaminhar quando houver lesao, queda abrupta de desempenho, assimetria grave ou sinais de overtraining.',
        false
      )
  ) as v(
    objetivo,
    nome,
    descricao,
    prioridades,
    metas_30_dias,
    metas_60_dias,
    metas_90_dias,
    recomendacoes,
    alertas_encaminhamento,
    padrao
  )
  where not exists (
    select 1
    from public.plano_acao_modelos m
    where m.clinica_id = p_clinica_id
      and lower(m.nome) = lower(v.nome)
  );
end;
$$;

select public.seed_plano_acao_modelos_padrao(id)
from public.clinicas;

create or replace function public.seed_plano_acao_modelos_padrao_nova_clinica()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_plano_acao_modelos_padrao(new.id);
  return new;
end;
$$;

drop trigger if exists trg_seed_plano_acao_modelos_padrao on public.clinicas;
create trigger trg_seed_plano_acao_modelos_padrao
after insert on public.clinicas
for each row
execute function public.seed_plano_acao_modelos_padrao_nova_clinica();
