-- 046 - Textos configuraveis da vitrine publica de produtos

alter table if exists public.clinicas
  add column if not exists catalogo_titulo text,
  add column if not exists catalogo_subtitulo text,
  add column if not exists catalogo_rodape_titulo text,
  add column if not exists catalogo_rodape_texto text;

update public.clinicas
set instagram = 'www.instagram.com/medfitsaude'
where nome ilike '%medfit%'
  and (
    instagram is null
    or trim(instagram) = ''
    or lower(instagram) in ('medfit', '@medfit', 'medfit.com.br', 'www.medfit.com.br')
  );
