create unique index if not exists idx_catalogo_agendamento_horario_unico
  on public.catalogo_agendamentos(catalogo_produto_id, data_preferida, horario_preferido)
  where data_preferida is not null
    and horario_preferido is not null
    and status in ('aguardando_pagamento','pagamento_recebido','confirmado');

notify pgrst, 'reload schema';
