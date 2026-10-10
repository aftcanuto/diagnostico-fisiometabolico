import { MEASUREMENTS, calculateAnthropometry, legacyProjection, newAnthropometry } from '../../src/lib/anthropometry';
import type { JumpData, JumpProtocol, JumpTrial } from '../../src/lib/jump-test';

const svgDataUrl = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

function thermogram(title: string, hue: number) {
  return svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640" viewBox="0 0 480 640">
    <defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 90% 20%)"/><stop offset=".45" stop-color="#7c3aed"/><stop offset=".72" stop-color="#ef4444"/><stop offset="1" stop-color="#fde047"/></linearGradient></defs>
    <rect width="480" height="640" fill="#160b2d"/><ellipse cx="240" cy="132" rx="58" ry="72" fill="url(#t)"/><path d="M176 205 Q240 170 304 205 L330 430 Q292 472 276 590 L204 590 Q188 472 150 430Z" fill="url(#t)"/><path d="M170 226 L88 440" stroke="url(#t)" stroke-width="44" stroke-linecap="round"/><path d="M310 226 L392 440" stroke="url(#t)" stroke-width="44" stroke-linecap="round"/><text x="20" y="35" fill="#fff" font-family="Arial" font-size="18" font-weight="700">${title}</text><text x="20" y="60" fill="#fde047" font-family="Arial" font-size="14">Média 33,4 °C</text>
  </svg>`);
}

export function completeThermography() {
  const extras = ['Posterior de coxas', 'Panturrilhas', 'Joelho direito', 'Joelho esquerdo'];
  return {
    temperatura_ambiente: 22.4, umidade_relativa: 48, tempo_aclimatacao_min: 15, distancia_cm: 100,
    emissividade: 0.98, recomendacoes_seguidas: true, ambiente_estavel: true, sem_corrente_ar: true,
    sem_sol_direto: true, sem_fonte_calor: true, regiao_exposta: true,
    equipamento_fabricante: 'HIKMICRO', equipamento_modelo: 'Pocket2', equipamento_software: 'HIKMICRO Analyzer',
    foto_anterior: thermogram('Anterior', 258), foto_posterior: thermogram('Posterior', 276),
    foto_lateral_dir: thermogram('Lateral direita', 294), foto_lateral_esq: thermogram('Lateral esquerda', 312),
    rois: [
      { regiao:'Ombro/Deltoide', lado:'D', temp_media:33.8, temp_min:31.2, temp_max:35.1, dor:false, intensidade_dor:'', observacao:'' },
      { regiao:'Ombro/Deltoide', lado:'E', temp_media:33.2, temp_min:30.9, temp_max:34.8, dor:false, intensidade_dor:'', observacao:'' },
      { regiao:'Joelho', lado:'D', temp_media:32.9, temp_min:30.4, temp_max:34.2, dor:true, intensidade_dor:'2', observacao:'Desconforto leve apos corrida.' },
      { regiao:'Joelho', lado:'E', temp_media:32.3, temp_min:30.1, temp_max:33.8, dor:false, intensidade_dor:'', observacao:'' },
      { regiao:'Panturrilha', lado:'D', temp_media:33.1, temp_min:30.7, temp_max:34.6, dor:false, intensidade_dor:'', observacao:'' },
      { regiao:'Panturrilha', lado:'E', temp_media:32.8, temp_min:30.5, temp_max:34.1, dor:false, intensidade_dor:'', observacao:'' },
    ],
    imagens_complementares: extras.map((titulo, index) => ({ url:thermogram(titulo, 220 + index * 24), titulo, regiao:titulo, lado:'central', momento:'basal', observacao:'' })),
    achados_termicos: 'Assimetrias discretas para acompanhamento longitudinal, sem valor diagnostico isolado.',
    conclusao_funcional: 'Padrao termico globalmente homogeneo, com discreta diferenca bilateral em joelhos e ombros. Correlacionar com avaliacao funcional e sintomas.',
  };
}

function flightMs(heightCm: number) {
  return Math.round(Math.sqrt((8 * heightCm / 100) / 9.80665) * 1000);
}

export function completeJumpTest(scale = 1): JumpData {
  const protocols: JumpProtocol[] = ['sj','vj','cmj','dj','unilateral_d','unilateral_e','repetidos'];
  const base: Record<JumpProtocol, number[]> = {
    sj:[28,29,29.5], vj:[31,32,31.5], cmj:[34,35,34.5], dj:[27,28,28.5],
    unilateral_d:[20,21,20.5], unilateral_e:[19,19.5,20], repetidos:[28,27.5,27,26.5,26,25.5],
  };
  const trials: JumpTrial[] = protocols.flatMap(protocol => base[protocol].map((raw, index) => {
    const height = +(raw * scale).toFixed(1);
    return {
      id:`${protocol}-${index + 1}`, protocolo:protocol, tecnica_bracos:protocol === 'vj' ? 'cintura' : protocol === 'cmj' ? 'livres' : undefined, altura_cm:height, voo_ms:flightMs(height),
      contato_ms:protocol === 'dj' ? 205 + index * 6 : protocol === 'repetidos' ? 220 + index * 5 : 310 + index * 4,
      potencia_w:Math.round((protocol.startsWith('unilateral') ? 1650 : 2850) * scale + index * 24), status:'valida' as const, justificativa:'',
    };
  }));
  return {
    versao:1, peso_kg:68.4, esporte:'Corrida recreativa', nivel:'Intermediario', equipamento:'JumpTest - 2 placas',
    software:'JumpTest Desktop 2026', metodo_potencia:'Pico de potencia informado pelo equipamento; algoritmo do fabricante',
    altura_queda_cm:30, duracao_s:15, bracos:'cintura', descanso_s:60, familiarizacao:true, apto:true,
    repetidos_serie_completa:true, protocolos:protocols, tentativas:trials, observacoes:'Coleta completa para auditoria visual do software.',
    conclusao:'Desempenho consistente entre tentativas, com VJ na cintura, CMJ com bracos livres, pequena assimetria entre membros e RSI registrado no Drop Jump.',
    referencia:'nenhuma', referencia_justificativa:'', documento_path:null,
  };
}

const anthropometryValues: Record<string, number> = {
  mass:68.4, height:166, sittingHeight:86, armSpan:168,
  triceps:18, subscapular:15, biceps:8, iliacCrest:20, supraspinale:16, abdominal:24, thighSkinfold:27, calfSkinfold:17,
  armRelaxed:28.5, armFlexed:31, forearm:24, chest:88, waist:72, abdomen:84, hip:92, thighMax:56, thighMid:53, calf:36,
  humerus:6.2, femur:8.9, wrist:5.4, bimalleolar:6.8,
};

export function completeAnthropometry(scale = 1) {
  const input = newAnthropometry();
  for (const measurement of MEASUREMENTS) {
    const base = anthropometryValues[measurement.id];
    const value = measurement.id === 'height' || measurement.id === 'sittingHeight' || measurement.id === 'armSpan'
      ? base : +(base * scale).toFixed(2);
    input.measurements[measurement.id].readings = [value, +(value * 1.002).toFixed(2), null];
  }
  input.collectionProtocol = 'ISAK - conjunto estrito de 26 medidas';
  input.manualEdition = 'Edicao adotada pela clinica';
  input.methods = ['direct','indices','martin1990','lee2000','kerrMuscle1988','kerrAdipose1988','martinBone1991','rocha1975','heathCarter','phantom','durninWomersley1974','siri1961','bmiWHO','dubois1916','harrisBenedict1919'];
  input.populationCategory = 'whiteHispanic';
  input.instruments = [{ name:'Adipometro Cescorf Clinico - auditoria', resolution:0.1, unit:'mm' }];
  const results = calculateAnthropometry(input, { date:'2026-04-27', birthDate:'1989-08-12', sex:'F' });
  return {
    ...legacyProjection(input, results), registro_v2:input,
    resultados_v2:{ ...results, professional:{ name:'Dr. Rafael Almeida', qualification:{ status:'pending', level:1 } } },
    revision_v2:1,
  };
}
