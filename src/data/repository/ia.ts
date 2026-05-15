/**
 * Repositório para comunicação com o servidor local de Machine Learning.
 *
 * A URL base é configurada via variável de ambiente VITE_ML_API_URL
 * (default: http://localhost:8000).
 *
 * Endpoints disponíveis no servidor do colega:
 *   GET  /api/v1/health                         → estado da API
 *   GET  /api/v1/model/info                     → informação do modelo
 *   POST /api/v1/exams/analyse                  → análise por ficheiro
 *   POST /api/v1/exams/analyse-base64           → análise por base64
 *   GET  /api/v1/exams/{analysis_id}/result     → resultado de uma análise
 *   GET  /api/v1/exams/{analysis_id}/overlay    → imagem com marcações
 *   GET  /api/v1/exams/{analysis_id}/mask       → máscara de segmentação
 *
 * Nota: analisarExame() e guardarResultadoIA() serão implementados após
 * confirmação do formato síncrono/assíncrono e mapeamento de severity.
 */

import type { InfoModelo, ResultadoAnaliseIA } from '../types';

const ML_BASE_URL = import.meta.env.VITE_ML_API_URL ?? 'http://localhost:8000';

// ═══════════════════════════════════════════════════════════════════
// Health check
// ═══════════════════════════════════════════════════════════════════

/**
 * Verifica se o servidor ML está online e com o modelo carregado.
 * Retorna true se estiver disponível, false caso contrário.
 */
export async function verificarSaudeApi(): Promise<boolean> {
  try {
    const res = await fetch(`${ML_BASE_URL}/api/v1/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Informação do modelo
// ═══════════════════════════════════════════════════════════════════

/**
 * Obtém metadados do modelo ML em uso (nome, versão, formatos, outputs).
 * Retorna null se o servidor não estiver disponível.
 */
export async function getInfoModelo(): Promise<InfoModelo | null> {
  try {
    const res = await fetch(`${ML_BASE_URL}/api/v1/model/info`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      nome:              data.name ?? data.model_name ?? '—',
      versao:            data.version ?? data.model_version ?? '—',
      formatosInput:     data.input_formats ?? [],
      outputsDisponiveis: data.available_outputs ?? [],
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// URLs de artefactos (overlay / mask)
// ═══════════════════════════════════════════════════════════════════

/**
 * Devolve a URL local do overlay (radiografia com marcações)
 * para um analysis_id. Não faz download — é só a URL.
 */
export function getUrlOverlay(analysisId: string): string {
  return `${ML_BASE_URL}/api/v1/exams/${analysisId}/overlay`;
}

/**
 * Devolve a URL local da máscara de segmentação para um analysis_id.
 */
export function getUrlMask(analysisId: string): string {
  return `${ML_BASE_URL}/api/v1/exams/${analysisId}/mask`;
}

// ═══════════════════════════════════════════════════════════════════
// Análise de exame — pendente de especificação
// ═══════════════════════════════════════════════════════════════════

/**
 * TODO: implementar após resposta do colega sobre:
 *   1. Síncrono (devolve resultado direto) ou assíncrono (devolve analysis_id + polling)?
 *   2. Mapeamento severity: normal/mild/moderate/severe → LEVE/MODERADA/GRAVE
 *
 * Assinatura prevista:
 *   analisarExame(imagemBlob, estudoId, pacienteId, view?, opções?) → ResultadoAnaliseIA
 */
export async function analisarExame(
  _imagemBlob: Blob,
  _estudoId: string,
  _pacienteId: string,
): Promise<ResultadoAnaliseIA> {
  throw new Error('analisarExame: não implementado — aguarda especificação do colega ML');
}
