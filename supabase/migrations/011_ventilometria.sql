-- ============================================================
--  011 - Cardiorrespiratório expandido (Ventilometria FitCheck)
-- ============================================================

alter table public.cardiorrespiratorio
  -- Novos campos da ventilometria
  add column if not exists protocolo              text,           -- 'Esteira', 'Bike', etc
  add column if not exists fc_limiar              numeric(5,1),   -- FC no ponto de limiar
  add column if not exists carga_limiar           numeric(5,1),   -- km/h no limiar
  add column if not exists carga_max              numeric(5,1),   -- km/h máximo
  add column if not exists ve_max                 numeric(6,1),   -- Ventilação máx (l/min)
  add column if not exists ponto_limiar_tempo     text,           -- '06:25' (mm:ss)
  add column if not exists classificacao_vo2      text,           -- 'Razoável', 'Boa', etc

  -- Recuperação FC por segundo
  add column if not exists rec_fc                 jsonb default '{}'::jsonb,
  /*
    { "5": -1, "10": -2, "15": -4, "20": -4, "25": -4,
      "30": -6, "35": -23, "40": -27, "45": -30,
      "50": -34, "55": -36, "60": -37 }
  */

  -- Zonas de treino por % (60% a 115%) com BPM
  add column if not exists zonas_percentual       jsonb default '[]'::jsonb,
  /*
    [
      { "pct": 60, "bpm": 86 },
      { "pct": 65, "bpm": 94 },
      ...
      { "pct": 115, "bpm": 166 }
    ]
  */

  -- Velocidades por intensidade
  add column if not exists velocidades_treino     jsonb default '[]'::jsonb,
  /*
    [
      { "intensidade": 60, "velocidade": 7.9,  "pace": "07:35" },
      { "intensidade": 65, "velocidade": 8.55, "pace": "07:01" },
      ...
      { "intensidade": 100, "velocidade": 13.16, "pace": "04:33" }
    ]
  */

  -- Zonas por ponto de limiar (FitCheck)
  add column if not exists zonas_limiar           jsonb default '[]'::jsonb;
  /*
    [
      { "nome": "Saúde Cardiovascular", "pct_min": 50,  "pct_max": 72,  "bpm_min": 72,  "bpm_max": 104 },
      { "nome": "Emagrecimento",        "pct_min": 72,  "pct_max": 99,  "bpm_min": 104, "bpm_max": 143 },
      { "nome": "Performance",          "pct_min": 100, "pct_max": 110, "bpm_min": 144, "bpm_max": 158 },
      { "nome": "Esforço máximo",       "pct_min": 110, "pct_max": 120, "bpm_min": 158, "bpm_max": 173 }
    ]
  */
