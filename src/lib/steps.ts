import type { ModulosSelecionados } from '@/types';
import type { Step } from '@/components/ui/StepNav';

export function buildSteps(avalId: string, mods: ModulosSelecionados, statusMap: Record<string, boolean> = {}): Step[] {
  const all = [
    { key: 'anamnese',             label: 'Anamnese',       mod: 'anamnese' },
    { key: 'sinais-vitais',        label: 'Sinais vitais',  mod: 'sinais_vitais' },
    { key: 'posturografia',        label: 'Postura',        mod: 'posturografia' },
    { key: 'bioimpedancia',        label: 'Bioimpedância',  mod: 'bioimpedancia' },
    { key: 'antropometria',        label: 'Antropometria',  mod: 'antropometria' },
    { key: 'flexibilidade',        label: 'Flexibilidade',  mod: 'flexibilidade' },
    { key: 'forca',                label: 'Força',          mod: 'forca' },
    { key: 'rml',                  label: 'RML',            mod: 'rml' },
    { key: 'cardiorrespiratorio',  label: 'Cardio',         mod: 'cardiorrespiratorio' },
    { key: 'biomecanica',          label: 'Biomecânica',    mod: 'biomecanica_corrida' },
    { key: 'revisao',              label: 'Revisão',        mod: null },
  ] as const;
  return all.map(s => ({
    key: s.key,
    label: s.label,
    href: `/avaliacoes/${avalId}/${s.key}`,
    enabled: s.mod === null ? true : !!(mods as any)[s.mod],
    done: !!statusMap[s.key],
  }));
}
