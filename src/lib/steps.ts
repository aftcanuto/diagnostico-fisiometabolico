import type { ModulosSelecionados } from '@/types';
import type { Step } from '@/components/ui/StepNav';

export const ETAPAS_AVALIACAO = [
    { key: 'anamnese',             label: 'Anamnese',       mod: 'anamnese' },
    { key: 'sinais-vitais',        label: 'Sinais vitais',  mod: 'sinais_vitais' },
    { key: 'bioimpedancia',        label: 'Bioimpedância',  mod: 'bioimpedancia' },
    { key: 'posturografia',        label: 'Postura',        mod: 'posturografia' },
    { key: 'termografia',          label: 'Termografia',    mod: 'termografia' },
    { key: 'antropometria',        label: 'Antropometria',  mod: 'antropometria' },
    { key: 'jump-test',           label: 'Jump Test',      mod: 'jump_test' },
    { key: 'flexibilidade',        label: 'Flexibilidade',  mod: 'flexibilidade' },
    { key: 'forca',                label: 'Força',          mod: 'forca' },
    { key: 'rml',                  label: 'RML',            mod: 'rml' },
    { key: 'cardiorrespiratorio',  label: 'Cardio',         mod: 'cardiorrespiratorio' },
    { key: 'biomecanica',          label: 'Biomecânica',    mod: 'biomecanica_corrida' },
    { key: 'revisao',              label: 'Revisão',        mod: null },
  ] as const;

export function buildSteps(avalId: string, mods: ModulosSelecionados, statusMap: Record<string, boolean> = {}): Step[] {
  return ETAPAS_AVALIACAO.map(s => ({
    key: s.key,
    label: s.label,
    href: `/avaliacoes/${avalId}/${s.key}`,
    enabled: s.mod === null ? true : !!(mods as any)[s.mod],
    done: !!statusMap[s.key],
  }));
}
