alter table if exists public.catalogo_produtos
  add column if not exists checkout_resumo_texto text,
  add column if not exists politica_pagamento text,
  add column if not exists mensagem_pos_pagamento text;

alter table if exists public.catalogo_agendamentos
  add column if not exists expires_at timestamptz,
  add column if not exists mercado_pago_status text,
  add column if not exists mercado_pago_status_detail text,
  add column if not exists mercado_pago_raw jsonb,
  add column if not exists mercado_pago_updated_at timestamptz;

create index if not exists idx_catalogo_agendamentos_expiracao
  on public.catalogo_agendamentos(status, expires_at)
  where status = 'aguardando_pagamento';

create index if not exists idx_catalogo_agendamentos_pagamento
  on public.catalogo_agendamentos(mercado_pago_payment_id);

update public.catalogo_agendamentos
set expires_at = created_at + interval '15 minutes'
where expires_at is null
  and status = 'aguardando_pagamento';

notify pgrst, 'reload schema';
