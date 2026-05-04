export type Sexo = 'M' | 'F';

export interface Paciente {
  id: string;
  avaliador_id: string;
  clinica_id?: string;
  nome: string;
  sexo: Sexo;
  data_nascimento: string;
  telefone?: string | null;
  email?: string | null;
  observacoes?: string | null;
  created_at: string;
}

export interface ModulosSelecionados {
  anamnese: boolean;
  sinais_vitais: boolean;
  posturografia: boolean;
  bioimpedancia: boolean;
  antropometria: boolean;
  flexibilidade: boolean;
  forca: boolean;
  cardiorrespiratorio: boolean;
  rml: boolean;
  biomecanica_corrida?: boolean;
}

export interface Avaliacao {
  id: string;
  paciente_id: string;
  avaliador_id: string;
  clinica_id?: string;
  data: string;
  tipo: 'completo' | 'personalizado';
  status: 'em_andamento' | 'finalizada' | 'arquivada';
  modulos_selecionados: ModulosSelecionados;
  produto_id?: string | null;
}

export interface DobraMedida {
  m1: number | null;
  m2: number | null;
  m3: number | null;
  media: number | null;
}

export type DobrasKey =
  | 'triceps' | 'subescapular' | 'peitoral' | 'axilar_media'
  | 'supra_iliaca' | 'abdominal' | 'coxa';

export type Dobras = Record<DobrasKey, DobraMedida>;

export interface Circunferencias {
  braco_relaxado?: number;
  braco_contraido?: number;
  antebraco?: number;
  cintura?: number;
  abdome?: number;
  quadril?: number;
  coxa_proximal?: number;
  coxa_medial?: number;
  panturrilha?: number;
  torax?: number;
}

export interface Diametros {
  umero?: number;
  femur?: number;
  biacromial?: number;
  biiliocristal?: number;
}

export interface Somatotipo {
  endomorfia: number;
  mesomorfia: number;
  ectomorfia: number;
  classificacao: string;
}

export interface ZonaFC { min: number; max: number; }
export interface ZonasTreino {
  z1: ZonaFC; z2: ZonaFC; z3: ZonaFC; z4: ZonaFC; z5: ZonaFC;
}

export interface DinamometriaItem {
  grupo_muscular: string;
  valor_kgf: number | null;
  valor_nm?: number | null;
  observacao?: string;
}

export interface Scores {
  postura: number | null;
  composicao_corporal: number | null;
  forca: number | null;
  flexibilidade: number | null;
  cardiorrespiratorio: number | null;
  global: number | null;
}
