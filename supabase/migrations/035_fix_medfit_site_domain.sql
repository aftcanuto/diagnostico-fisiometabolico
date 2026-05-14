-- 035 - Corrige dominio legado da MedFit no cadastro da clinica

update public.clinicas
set site = 'medfit.med.br'
where lower(regexp_replace(coalesce(site, ''), '^https?://(www\.)?', '', 'i')) in ('medfit.com.br', 'medfit.com.br/');
