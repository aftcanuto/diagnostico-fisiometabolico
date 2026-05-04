-- ============================================================
--  010 - Dinamometria SP Tech (torque, 1RM, relações, cargas)
-- ============================================================
-- Expande a tabela forca para suportar o relatório completo
-- do dinamômetro isométrico SP Tech.

alter table public.forca
  add column if not exists sptech_testes jsonb default '[]'::jsonb,
  add column if not exists sptech_relacoes jsonb default '[]'::jsonb;

/*
  sptech_testes: lista de movimentos avaliados pelo SP Tech
  [
    {
      "articulacao": "Joelho",
      "movimento": "Extensão",
      "lado_d": {
        "kgf": 38.22,
        "torque_nm": 149.9,
        "rm1_kg": 30.64,
        "cargas": {
          "resistencia_min": 12.25, "resistencia_max": 12.25,
          "forca_min": 24.51,       "forca_max": 27.57,
          "potencia_min": 13.79,    "potencia_max": 18.38,
          "hipertrofia_min": 18.38, "hipertrofia_max": 24.51,
          "velocidade_min": 9.19
        }
      },
      "lado_e": { ... mesmo schema ... },
      "assimetria_pct": 12,
      "classificacao_assimetria": "Moderada"
    }
  ]

  sptech_relacoes: relações musculares agonista/antagonista
  [
    {
      "descricao": "Flexão / Extensão de joelho esquerdo",
      "percentual": 59.31
    }
  ]
*/
