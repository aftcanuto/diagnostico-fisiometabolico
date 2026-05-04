-- 023 - Comentário geral dos gráficos cinemáticos

alter table if exists public.biomecanica_corrida
  add column if not exists comentarios_graficos jsonb default '{}'::jsonb;

