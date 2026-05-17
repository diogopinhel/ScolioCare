/**
 * Repositório para comunicação com os servidores locais de Machine Learning.
 *
 * Arquitetura: cada modelo ML corre num servidor local independente
 * (porta diferente). Cada modelo tem o seu próprio formato de resposta.
 * Este módulo centraliza:
 *   - Registry de modelos disponíveis (MODELOS_DISPONIVEIS)
 *   - Dispatcher (analisarExame) que escolhe o parser certo conforme o modelo
 *   - Parsers que convertem as respostas heterogéneas dos modelos para o
 *     formato unificado ResultadoAnaliseIA
 *   - Persistência: guardarResultadoIA insere em `resultados` na BD
 *
 * Cada análise de IA cria uma linha em `resultados` (vários modelos podem
 * ter corrido sobre o mesmo estudo). O médico escolhe qual aceitar ao validar.
 */

import { supabase } from '../../lib/supabase';
import type {
  ModeloIA,
  InfoModelo,
  ResultadoAnaliseIA,
  VertebraDetetada,
} from '../types';

// ═══════════════════════════════════════════════════════════════════
// Registry de modelos disponíveis
// ═══════════════════════════════════════════════════════════════════

const ML_BASE_URL_DEFAULT = import.meta.env.VITE_ML_API_URL ?? 'http://localhost:8000';

/**
 * Lista de modelos ML disponíveis. Para adicionar um modelo novo:
 *   1. Inserir aqui um entry com URL e capacidades
 *   2. Adicionar um parser na secção "Parsers" se o formato for diferente
 *   3. Mapear o id → parser na função analisarExame()
 */
export const MODELOS_DISPONIVEIS: ModeloIA[] = [
  {
    id: 'spinal-ai-2024',
    nome: 'Spinal-AI 2024 — Cobb angle completo',
    descricao: 'Deteção de vértebras + cálculo de ângulo de Cobb com correção MLP residual. MAE 2.39°, 91% accuracy a ±5°.',
    urlBase: ML_BASE_URL_DEFAULT,        // http://localhost:8000
    endpointAnalyse: '/analyze',
    endpointHealth: null,                 // não tem endpoint /health; assume online
    versaoEsperada: 'phase5_radius_hardmining_v1+phase9_cobb_residual_mlp_v2',
    capacidades: ['Cobb', 'classificação', 'vértebras', 'overlay'],
    ativo: true,
  },
  {
    id: 'maskrcnn-seg',
    nome: 'Mask R-CNN — Segmentação de Vértebras',
    descricao: 'Deteção e segmentação por instância das vértebras; cálculo de Cobb em desenvolvimento.',
    urlBase: 'http://localhost:8001',
    endpointAnalyse: '/api/v1/exams/analyse',
    endpointHealth: '/api/v1/health',
    versaoEsperada: 'maskrcnn_full_epoch4_best',
    capacidades: ['segmentação', 'bbox', 'polygon'],
    ativo: false,                         // ainda sem endpoint
  },
  {
    id: 'unet-baseline',
    nome: 'U-Net — Segmentação binária',
    descricao: 'Máscara binária da coluna (256×256). Aguarda pré/pós-processamento do colega.',
    urlBase: 'http://localhost:8002',
    endpointAnalyse: '/analyze',
    endpointHealth: '/health',
    versaoEsperada: 'unet_baseline_2000_padding',
    capacidades: ['segmentação'],
    ativo: false,                         // só temos .keras, sem inferência
  },
];

export function getModelosDisponiveis(): ModeloIA[] {
  return MODELOS_DISPONIVEIS.filter((m) => m.ativo);
}

export function getModelo(modeloId: string): ModeloIA | undefined {
  return MODELOS_DISPONIVEIS.find((m) => m.id === modeloId);
}

// ═══════════════════════════════════════════════════════════════════
// Health check & info do modelo
// ═══════════════════════════════════════════════════════════════════

export async function verificarSaudeApi(modeloId: string): Promise<boolean> {
  const modelo = getModelo(modeloId);
  if (!modelo) return false;

  // Se não houver endpoint /health, fazemos um GET à raiz como sanity check
  const url = modelo.endpointHealth
    ? `${modelo.urlBase}${modelo.endpointHealth}`
    : `${modelo.urlBase}/`;

  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
    // FastAPI sem rota / devolve 404, mas o servidor está vivo.
    // Aceitamos qualquer resposta HTTP (com ou sem corpo) como "online".
    return res.status < 500;
  } catch {
    return false;
  }
}

export async function getInfoModelo(modeloId: string): Promise<InfoModelo | null> {
  const modelo = getModelo(modeloId);
  if (!modelo) return null;
  try {
    const res = await fetch(`${modelo.urlBase}/api/v1/model/info`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return {
      nome:              d.name ?? d.model_name ?? modelo.nome,
      versao:            d.version ?? d.model_version ?? modelo.versaoEsperada,
      formatosInput:     d.input_formats ?? [],
      outputsDisponiveis: d.available_outputs ?? [],
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Dispatcher principal — analisarExame
// ═══════════════════════════════════════════════════════════════════

/**
 * Submete uma imagem ao modelo escolhido e devolve o resultado já no
 * formato unificado. Não persiste em BD — a persistência é feita
 * separadamente via guardarResultadoIA().
 */
export async function analisarExame(
  modeloId: string,
  estudoId: string,
  imageUrl: string,
): Promise<ResultadoAnaliseIA> {
  const modelo = getModelo(modeloId);
  if (!modelo) throw new Error(`Modelo desconhecido: ${modeloId}`);
  if (!modelo.ativo) throw new Error(`Modelo ${modelo.nome} não está disponível`);

  // Payload comum: estudoId + imageUrl. Cada modelo pode aceitar campos extra.
  const payload: Record<string, unknown> = { estudoId, imageUrl };
  if (modeloId === 'spinal-ai-2024') payload.includeOverlay = false;

  const res = await fetch(`${modelo.urlBase}${modelo.endpointAnalyse}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const erro = await res.text().catch(() => res.statusText);
    throw new Error(`Modelo ${modelo.nome} respondeu ${res.status}: ${erro}`);
  }

  const raw = await res.json();

  // Escolha do parser conforme o id do modelo
  switch (modeloId) {
    case 'spinal-ai-2024':
      return parserSpinalAi(raw, modeloId);
    case 'maskrcnn-seg':
      return parserMaskRcnn(raw, modeloId);
    case 'unet-baseline':
      return parserMaskRcnn(raw, modeloId); // placeholder — quando definirmos o formato, fazer parser próprio
    default:
      throw new Error(`Sem parser definido para o modelo: ${modeloId}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Parsers — convertem resposta do modelo para ResultadoAnaliseIA
// ═══════════════════════════════════════════════════════════════════

/**
 * Parser para a resposta do Spinal-AI 2024 (phase5 + phase9 residual MLP).
 * Resposta em camelCase com campos encapsulados em `result`. Output completo
 * com ângulo de Cobb, severidade já em português, vértebras detalhadas com
 * pontos (upperLeft/upperRight/lowerLeft/lowerRight) e métricas extra.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parserSpinalAi(raw: any, modeloId: string): ResultadoAnaliseIA {
  const r = raw.result ?? {};

  // Mapeamento dos vértebras: bbox {x,y,w,h} → [x1,y1,x2,y2]; points 4-corners → polygon
  const vertebrae: VertebraDetetada[] | null = Array.isArray(r.vertebrae)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.vertebrae.map((v: any) => {
        const bbox: [number, number, number, number] | null = v.bbox
          ? [v.bbox.x, v.bbox.y, v.bbox.x + v.bbox.width, v.bbox.y + v.bbox.height]
          : null;

        const polygon: [number, number][] | null = v.points
          ? [
              [v.points.upperLeft.x,  v.points.upperLeft.y],
              [v.points.upperRight.x, v.points.upperRight.y],
              [v.points.lowerRight.x, v.points.lowerRight.y],
              [v.points.lowerLeft.x,  v.points.lowerLeft.y],
            ]
          : null;

        // Centro = média dos 4 cantos, se existirem
        const center: [number, number] | null = v.points
          ? [
              (v.points.upperLeft.x + v.points.upperRight.x + v.points.lowerLeft.x + v.points.lowerRight.x) / 4,
              (v.points.upperLeft.y + v.points.upperRight.y + v.points.lowerLeft.y + v.points.lowerRight.y) / 4,
            ]
          : null;

        return {
          id:       Number(v.index ?? 0),
          label:    String(v.label ?? 'vertebra'),
          score:    Number(v.score ?? 0),
          bbox,
          polygon,
          center,
          angleDeg: null,
        };
      })
    : null;

  const cobbDeg = r.cobbAngleDeg != null ? Number(r.cobbAngleDeg) : null;
  const cobbAngles = cobbDeg != null ? { upper: null, main: cobbDeg, lower: null } : null;

  // Overlay vem em base64 se includeOverlay=true e o modelo a tiver gerado
  const overlayBase64 = raw.overlay?.encoding === 'base64' && raw.overlay?.data
    ? `data:image/${raw.overlay.format ?? 'png'};base64,${raw.overlay.data}`
    : null;

  return {
    modeloId,
    versaoModelo:         String(raw.modelVersion ?? '—'),
    status:               normalizarStatus(raw.status),
    tempoProcessamentoMs: Number(raw.processingTimeMs ?? r.processingTimeMs ?? 0),
    anguloCobbPrincipal:  cobbDeg,
    cobbAngles,
    grauCurvatura:        normalizarClassificacao(r.severity),
    confianca:            Number(r.confidence ?? 0),
    vertebrae,
    centerlinePoints:     null,
    overlayUrl:           null,
    overlayBase64,
    warnings:             Array.isArray(r.qualityFlags) ? r.qualityFlags : [],
    cobbMeasurement:      r.cobbMeasurement ?? null,
    rawGeometricCobbAngleDeg: r.rawGeometricCobbAngleDeg != null ? Number(r.rawGeometricCobbAngleDeg) : null,
    appliedCorrectionDeg:     r.appliedCorrectionDeg != null ? Number(r.appliedCorrectionDeg) : null,
  };
}

/**
 * Parser para a resposta do modelo Mask R-CNN (camelCase, vértebras detalhadas).
 * Formato de input esperado: ver INTEGRACAO_ML.md secção do colega 2.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parserMaskRcnn(raw: any, modeloId: string): ResultadoAnaliseIA {
  const vertebrae: VertebraDetetada[] | null = Array.isArray(raw.vertebrae)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      raw.vertebrae.map((v: any) => ({
        id:       Number(v.id),
        label:    String(v.label ?? 'vertebra'),
        score:    Number(v.score ?? 0),
        bbox:     Array.isArray(v.bbox) && v.bbox.length === 4 ? (v.bbox as [number, number, number, number]) : null,
        polygon:  Array.isArray(v.polygon) ? (v.polygon as [number, number][]) : null,
        center:   Array.isArray(v.center) && v.center.length === 2 ? (v.center as [number, number]) : null,
        angleDeg: v.angleDeg != null ? Number(v.angleDeg) : null,
      }))
    : null;

  const cobbAngles = raw.cobbAngles ? {
    upper: raw.cobbAngles.upper != null ? Number(raw.cobbAngles.upper) : null,
    main:  raw.cobbAngles.main  != null ? Number(raw.cobbAngles.main)  : null,
    lower: raw.cobbAngles.lower != null ? Number(raw.cobbAngles.lower) : null,
  } : null;

  const anguloPrincipal = cobbAngles?.main ?? null;
  const grauCurvatura = normalizarClassificacao(
    raw.classification ?? deriveGrauFromAngle(anguloPrincipal),
  );

  const overlayBase64 = raw.overlay?.encoding === 'base64' && raw.overlay?.data
    ? `data:image/${raw.overlay.format ?? 'png'};base64,${raw.overlay.data}`
    : null;

  return {
    modeloId,
    versaoModelo:         String(raw.modelVersion ?? raw.model_version ?? '—'),
    status:               normalizarStatus(raw.status),
    tempoProcessamentoMs: Number(raw.processingTimeMs ?? raw.processing_time_ms ?? 0),
    anguloCobbPrincipal:  anguloPrincipal,
    cobbAngles,
    grauCurvatura,
    confianca:            Number(raw.confidence ?? 0),
    vertebrae,
    centerlinePoints:     null,
    overlayUrl:           raw.overlayUrl ?? null,
    overlayBase64,
    warnings:             Array.isArray(raw.warnings) ? raw.warnings : [],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Helpers de normalização
// ═══════════════════════════════════════════════════════════════════

function normalizarStatus(s: unknown): ResultadoAnaliseIA['status'] {
  const v = String(s ?? '').toLowerCase();
  if (v === 'ok' || v === 'success' || v === 'completed') return 'success';
  if (v === 'failed' || v === 'error')      return 'failed';
  if (v === 'processing' || v === 'pending') return 'processing';
  return 'success'; // default optimista
}

function normalizarClassificacao(c: unknown): ResultadoAnaliseIA['grauCurvatura'] {
  if (c == null) return null;
  const v = String(c).trim().toUpperCase();
  if (v === 'LEVE' || v === 'MODERADA' || v === 'GRAVE') return v;
  // Spinal-AI pode devolver "SEM_ESCOLIOSE" ou "NAO_SIGNIFICATIVA" para <10° — mapeamos para LEVE
  if (v === 'SEM_ESCOLIOSE' || v === 'NAO_SIGNIFICATIVA') return 'LEVE';
  return normalizarSeverity(c); // tentar como severity inglês
}

function normalizarSeverity(s: unknown): ResultadoAnaliseIA['grauCurvatura'] {
  const v = String(s ?? '').toLowerCase();
  if (v === 'normal' || v === 'mild') return 'LEVE';
  if (v === 'moderate')              return 'MODERADA';
  if (v === 'severe')                return 'GRAVE';
  return null;
}

function deriveGrauFromAngle(angle: number | null): string | null {
  if (angle == null) return null;
  if (angle < 25) return 'LEVE';
  if (angle <= 45) return 'MODERADA';
  return 'GRAVE';
}

// ═══════════════════════════════════════════════════════════════════
// Persistência — guardar resultado em `resultados`
// ═══════════════════════════════════════════════════════════════════

/**
 * Insere um ResultadoAnaliseIA em `resultados`, mapeando os campos para o
 * schema da BD. Cada chamada cria uma nova linha — vários modelos podem
 * ter resultados sobre o mesmo estudo.
 *
 * Retorna o id (uuid) do registo criado.
 */
export async function guardarResultadoIA(
  estudoId: string,
  resultado: ResultadoAnaliseIA,
): Promise<string> {
  // Construir o conteúdo de cobb_angles: combina os 3 valores + extras do Spinal-AI
  const cobbAnglesPayload: Record<string, unknown> = {
    ...(resultado.cobbAngles ?? {}),
  };
  if (resultado.cobbMeasurement)         cobbAnglesPayload.measurement       = resultado.cobbMeasurement;
  if (resultado.rawGeometricCobbAngleDeg != null) cobbAnglesPayload.rawGeometric  = resultado.rawGeometricCobbAngleDeg;
  if (resultado.appliedCorrectionDeg    != null) cobbAnglesPayload.appliedCorrection = resultado.appliedCorrectionDeg;

  const payload: Record<string, unknown> = {
    estudo_id:                estudoId,
    angulo_cobb:              resultado.anguloCobbPrincipal,
    grau_curvatura:           resultado.grauCurvatura,
    confianca_modelo:         resultado.confianca,
    versao_modelo:            resultado.versaoModelo,
    tempo_processamento_ms:   resultado.tempoProcessamentoMs,
    cobb_angles:              Object.keys(cobbAnglesPayload).length > 0 ? cobbAnglesPayload : null,
    pontos_anatomicos:        resultado.vertebrae ?? resultado.centerlinePoints,
    artifacts:                {
      overlay_url:    resultado.overlayUrl,
      overlay_base64: resultado.overlayBase64 ? '[present]' : null, // não guardar o base64 inteiro
    },
    warnings:                 resultado.warnings,
    decisao:                  null,
    concluido:                false,
  };

  const { data, error } = await supabase
    .from('resultados')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return (data as { id: string }).id;
}

// ═══════════════════════════════════════════════════════════════════
// Helpers de URL para artefactos
// ═══════════════════════════════════════════════════════════════════

export function getUrlOverlay(modeloId: string, analysisId: string): string | null {
  const modelo = getModelo(modeloId);
  if (!modelo) return null;
  return `${modelo.urlBase}/api/v1/exams/${analysisId}/overlay`;
}

export function getUrlMask(modeloId: string, analysisId: string): string | null {
  const modelo = getModelo(modeloId);
  if (!modelo) return null;
  return `${modelo.urlBase}/api/v1/exams/${analysisId}/mask`;
}
