-- 039 - Contexto esportivo e finalidade para interpretacao da forca

alter table public.forca
  add column if not exists esporte_contexto text default 'saude_geral',
  add column if not exists finalidade_teste text default 'triagem',
  add column if not exists lado_dominante text default 'direito';

alter table public.forca
  drop constraint if exists forca_esporte_contexto_check;

alter table public.forca
  add constraint forca_esporte_contexto_check
  check (esporte_contexto in (
    'saude_geral',
    'corrida',
    'musculacao',
    'beach_tennis',
    'tenis',
    'tenis_mesa',
    'volei',
    'natacao',
    'lutas',
    'futebol',
    'ciclismo',
    'outro'
  ));

alter table public.forca
  drop constraint if exists forca_finalidade_teste_check;

alter table public.forca
  add constraint forca_finalidade_teste_check
  check (finalidade_teste in (
    'triagem',
    'performance',
    'retorno_esporte',
    'prevencao',
    'dor',
    'reabilitacao',
    'hipertrofia',
    'emagrecimento'
  ));

alter table public.forca
  drop constraint if exists forca_lado_dominante_check;

alter table public.forca
  add constraint forca_lado_dominante_check
  check (lado_dominante in ('direito', 'esquerdo', 'ambidestro'));
