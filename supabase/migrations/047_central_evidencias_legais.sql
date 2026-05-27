-- 047 - Central de evidencias legais para consentimentos e TCLE

create extension if not exists pgcrypto;

alter table public.consentimento_aceites
  add column if not exists texto_hash text,
  add column if not exists comprovante_codigo text;

update public.consentimento_aceites
set
  texto_hash = coalesce(
    texto_hash,
    encode(
      digest(
        coalesce(texto_aceito, '') || '|' ||
        coalesce(token, '') || '|' ||
        coalesce(aceito_em::text, '') || '|' ||
        coalesce(paciente_id::text, ''),
        'sha256'
      ),
      'hex'
    )
  ),
  comprovante_codigo = coalesce(
    comprovante_codigo,
    'TCLE-' || upper(left(replace(id::text, '-', ''), 8))
  );

create unique index if not exists idx_consentimento_aceites_comprovante_codigo
  on public.consentimento_aceites(comprovante_codigo)
  where comprovante_codigo is not null;

create index if not exists idx_consentimento_aceites_texto_hash
  on public.consentimento_aceites(texto_hash)
  where texto_hash is not null;
