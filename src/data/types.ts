/**
 * Tipos do domínio ScolioScan.
 *
 * Espelham o diagrama de classes SGE_Escoliose_v4_1.puml.
 * Esta versão inicial cobre apenas a hierarquia de Utilizador, suficiente
 * para o fluxo de autenticação. As restantes entidades (Estudo, Resultado,
 * ImagemEstudo, AuditLog, Notificacao, etc.) serão adicionadas quando
 * migrarmos os mocks dos ecrãs para esta camada.
 */

// ─── Perfis ─────────────────────────────────────────────────────────────────

export type Perfil = 'ADMIN' | 'MEDICO' | 'TECNICO' | 'PACIENTE';

// ─── Utilizador (classe abstrata) ───────────────────────────────────────────

export interface Utilizador {
  id: string;
  nomeCompleto: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  dataCriacao: string;          // ISO 8601
  ultimoLogin?: string;         // ISO 8601
  idioma: string;               // default 'pt'
  twoFactorAtivo: boolean;
  contaBloqueada: boolean;
  // Nota: passwordHash, secretoTOTP, tokenRecuperacao e tentativasLoginFalhadas
  // não são expostos ao cliente. Existem apenas no backend real; no mock
  // tratamos a password à parte (ver auth.ts).
}

// ─── Especializações ───────────────────────────────────────────────────────

export interface Administrador extends Utilizador {
  perfil: 'ADMIN';
}

export interface MedicoEspecialista extends Utilizador {
  perfil: 'MEDICO';
  cedulaProfissional: string;
  especialidade: string;
  certDigitalEntidade?: string;
  certDigitalExpiracao?: string;
}

export interface TecnicoSaude extends Utilizador {
  perfil: 'TECNICO';
  codigoFuncionario: string;
  departamento: string;
}

export interface Paciente extends Utilizador {
  perfil: 'PACIENTE';
  dataNascimento: string;       // ISO 8601 (YYYY-MM-DD)
  genero: string;
  numeroUtente: string;
  contacto?: string;
  morada?: string;
  cartaoCidadao?: string;
  contaAtivada: boolean;
}

// ─── União discriminada ────────────────────────────────────────────────────

export type UtilizadorAutenticado =
  | Administrador
  | MedicoEspecialista
  | TecnicoSaude;

// ─── Estudos ───────────────────────────────────────────────────────────────

export type EstadoEstudo =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'PENDING_VALIDATION'
  | 'VALIDATED'
  | 'DIAGNOSED'
  | 'SENT'
  | 'ARCHIVED';

export interface EstudoResumo {
  id: string;
  pacienteNome: string;
  dataSubmissao: string;   // ISO 8601
  estado: EstadoEstudo;
}

export interface DadosSemanais {
  semana: string;
  exames: number;
}

export interface AtividadeResumo {
  id: string;
  estadoNovo: EstadoEstudo;
  dataTransicao: string;   // ISO 8601
  utilizadorNome: string;
  pacienteNome: string;
}

// ─── Pacientes ─────────────────────────────────────────────────────────────

export interface PacienteResumo {
  id: string;
  nomeCompleto: string;
  numeroUtente: string;
  dataAssociacao: string;  // ISO 8601
}

export interface PacienteListagem {
  id: string;
  nomeCompleto: string;
  numeroUtente: string;
  dataNascimento: string | null;   // ISO 8601 date
  genero: string | null;
  totalExames: number;
  ultimoExame: string | null;      // ISO 8601 date
  estadoUltimoExame: EstadoEstudo | null;
}

// ─── Dashboard médico ──────────────────────────────────────────────────────

export interface MetricasDashboardMedico {
  totalPacientes: number;
  examesPendentesValidacao: number;
  examesAnalisadosEstaSemana: number;
  relatoriosGeradosEsteMes: number;
}

// ─── Ficha de Paciente ─────────────────────────────────────────────────────

export interface PacienteDetalhe {
  id: string;
  nomeCompleto: string;
  dataNascimento: string | null;
  genero: string | null;
  numeroUtente: string | null;
  contacto: string | null;
  morada: string | null;
  cartaoCidadao: string | null;
}

export interface ResultadoEstudo {
  id: string;
  anguloCobb: number;
  anguloCobbCorrigido: number | null;
  grauCurvatura: string;
  localizacaoCurva: string | null;
}

export interface EstudoComResultado {
  id: string;
  dataEstudo: string;          // ISO date
  estado: EstadoEstudo;
  notasClinicas: string | null;
  ficheiroPdf: string | null;
  resultado: ResultadoEstudo | null;
  thumbnailPath: string | null; // caminho da primeira imagem em Storage (sem URL assinada)
}

export interface WellnessLogEntry {
  id: string;
  dataRegisto: string;         // ISO date
  nivelDor: number;            // 0-10
  desconforto: string | null;  // 'none' | 'mild' | 'moderate' | 'intense'
  notas: string | null;
}

export interface MedidaPaciente {
  id: string;
  dataRegisto: string;         // ISO datetime
  peso: number;                // kg
  altura: number;              // cm
  registadoPorNome: string;
}

export interface HistoricoEstadoEntry {
  id: string;
  dataTransicao: string;       // ISO datetime
  utilizadorNome: string;
  utilizadorPerfil: string;
  estadoAnterior: string | null;
  estadoNovo: string;
  observacao: string | null;
}

// ─── ExamViewer — dados completos de um estudo ─────────────────────────────

export type DecisaoResultado = 'ACEITE' | 'CORRIGIDO' | 'REJEITADO';

export interface ImagemEstudoInfo {
  id: string;
  /** Path dentro do bucket Supabase Storage (usar getUrlImagemEstudo para obter URL assinada) */
  caminhoArmazenamento: string;
  projecao: string | null;
  formato: string;
}

/** Resultado produzido pelo modelo ML e opcionalmente corrigido pelo médico */
export interface ResultadoCompleto {
  id: string;
  // ── Métricas ML ──────────────────────────────────────────────────────
  anguloCobb: number;
  grauCurvatura: string;
  localizacaoCurva: string | null;
  confiancaModelo: number;       // 0.0 – 1.0
  versaoModelo: string;
  overlayJson: unknown | null;   // coordenadas/anotações do modelo para o overlay SVG
  /** Lista de vértebras detetadas (formato VertebraDetetada). Pode ser null. */
  pontosAnatomicos: VertebraDetetada[] | null;
  /** Estrutura com main/upper/lower + measurement (índices das vértebras usadas no Cobb) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cobbAnglesData: any | null;
  // ── Validação médica ─────────────────────────────────────────────────
  decisao: DecisaoResultado | null;
  anguloCobbCorrigido: number | null;
  justificacaoValidacao: string | null;
  dataValidacao: string | null;  // ISO datetime
  concluido: boolean;
  observacoesMedico: string | null;
}

// ─── Dashboard Técnico ─────────────────────────────────────────────────────

export interface MetricasDashboardTecnico {
  carregadosHoje: number;
  emProcessamento: number;
  prontoValidacao: number;
  arquivados: number;
}

export interface EstudoFilaItem {
  id: string;
  pacienteNome: string;
  pacienteId: string;
  dataSubmissao: string;   // ISO datetime
  dataEstudo: string;      // ISO date
  estado: EstadoEstudo;
  confiancaModelo: number | null;
  medicoNome: string | null;
}

// ─── Auditoria (Admin) ────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  utilizadorSnapshot: { nome?: string; perfil?: string; email?: string } | null;
  tipoAcao: string;
  entidadeAfetada: string;
  entidadeId: string | null;
  detalhe: Record<string, unknown> | null;
  dataHora: string;
}

// ─── Utilizadores (Admin) ─────────────────────────────────────────────────

export interface UtilizadorAdmin {
  id: string;
  nomeCompleto: string;
  perfil: string;
  ativo: boolean;
  contaBloqueada: boolean;
  twoFactorAtivo: boolean;
  ultimoLogin: string | null;
  dataCriacao: string;
}

/** Extensão com campos editáveis específicos por perfil */
export interface UtilizadorAdminCompleto extends UtilizadorAdmin {
  // MEDICO
  cedulaProfissional?: string | null;
  especialidade?: string | null;
  // TECNICO
  codigoFuncionario?: string | null;
  departamento?: string | null;
  // PACIENTE
  dataNascimento?: string | null;
  genero?: string | null;
  numeroUtente?: string | null;
  contacto?: string | null;
  morada?: string | null;
  cartaoCidadao?: string | null;
}

export interface MetricasDashboardAdmin {
  totalUtilizadoresAtivos: number;
  examesUltimas24h: number;
  glassbreakAtivos: number;
  alertasSeguranca: number;
}

// ─── Avaliação de comparação de exames ───────────────────────────────────

export type TipoAvaliacao = 'CONFIRMADO_IA' | 'AVALIACAO_PROPRIA';

export interface AvaliacaoComparacao {
  id: string;
  medicoNome: string;
  tipo: TipoAvaliacao;
  texto: string | null;
  variacaoAngulo: number | null;
  dataCriacao: string;  // ISO datetime
}

// ─── Notas por paciente ───────────────────────────────────────────────────

export interface NotaPaciente {
  id: string;
  medicoNome: string;
  conteudo: string;
  dataCriacao: string;    // ISO datetime
  eMinhaAutoria: boolean; // true se o médico autenticado é o autor
}

// ─── Edição de paciente ───────────────────────────────────────────────────

export interface DadosAtualizacaoPaciente {
  pacienteId: string;
  nomeCompleto: string;
  dataNascimento: string;
  genero: string;
  numeroUtente: string;
  contacto: string;
  morada: string;
  cartaoCidadao?: string;
}

// ─── Comparação de exames ─────────────────────────────────────────────────

export interface EstudoComparacao {
  id: string;
  dataEstudo: string;          // ISO date
  anguloCobb: number;          // valor corrigido se existir, senão o da IA
  urlImagem: string | null;    // URL assinada da primeira imagem (ou null)
  vertebrae: VertebraDetetada[] | null;
  cobbMeasurement: CobbMeasurementData | null;
}

// ─── Médicos ──────────────────────────────────────────────────────────────

export interface MedicoResumo {
  id: string;
  nomeCompleto: string;
  especialidade: string;
}

// ─── Pacientes (Técnico — vista operacional) ─────────────────────────────

export interface PacienteTecnico {
  id: string;
  nomeCompleto: string;
  numeroUtente: string | null;
  dataNascimento: string | null;
  genero: string | null;
  totalExames: number;
  ultimoExame: string | null;
  medicoId: string | null;
  medicoNome: string | null;
  contaAtivada: boolean;
}

// ─── ML API ──────────────────────────────────────────────────────────────────

/**
 * Configuração de um modelo ML disponível no sistema.
 * Cada modelo corre num servidor local diferente (porta diferente) e tem o
 * seu próprio formato de resposta. O parser converte essa resposta para
 * ResultadoAnaliseIA (formato unificado interno).
 */
export interface ModeloIA {
  id: string;                  // identificador interno (ex: 'maskrcnn-seg')
  nome: string;                // nome legível (ex: 'Mask R-CNN — Segmentação')
  descricao: string;           // o que o modelo faz
  urlBase: string;             // URL do servidor local (ex: 'http://localhost:8000')
  endpointAnalyse: string;     // path do endpoint de análise (ex: '/analyze')
  endpointHealth: string | null; // path do endpoint de health-check (null = não verificar)
  versaoEsperada: string;      // versão atual conhecida (informativo)
  capacidades: string[];       // ex: ['segmentação', 'Cobb', 'classificação']
  ativo: boolean;              // se está habilitado para uso
}

export interface InfoModelo {
  nome: string;
  versao: string;
  formatosInput: string[];
  outputsDisponiveis: string[];
}

/** Dados da medição de Cobb: quais vértebras foram usadas + ângulos das plates. */
export interface CobbMeasurementData {
  upperVertebraIndex: number;
  lowerVertebraIndex: number;
  upperVertebraLabel?: string;
  lowerVertebraLabel?: string;
  upperPlateAngleDeg?: number;
  lowerPlateAngleDeg?: number;
}

/**
 * Detalhe de uma vértebra detetada pelo modelo de segmentação.
 * Nem todos os campos são preenchidos por todos os modelos.
 */
export interface VertebraDetetada {
  id: number;
  label: string;
  score: number;                            // 0.0 – 1.0
  bbox: [number, number, number, number] | null;       // [x1, y1, x2, y2]
  polygon: [number, number][] | null;                  // quadrilátero aproximado
  center: [number, number] | null;                     // centro [cx, cy]
  angleDeg: number | null;                             // inclinação estimada (pós-processamento)
}

/**
 * Resultado unificado de uma análise de IA (formato interno do frontend).
 * Cada modelo tem o seu formato próprio; o parser de cada modelo converte
 * para esta estrutura. Campos opcionais quando o modelo não os produz.
 */
export interface ResultadoAnaliseIA {
  // ── Metadados ────────────────────────────────────────────────────────────
  modeloId: string;                // id do modelo que produziu este resultado
  versaoModelo: string;            // versão específica (ex: 'maskrcnn_full_epoch4_best')
  status: 'success' | 'failed' | 'processing';
  tempoProcessamentoMs: number;

  // ── Ângulos de Cobb (qualquer subset pode estar preenchido) ──────────────
  anguloCobbPrincipal: number | null;        // ângulo principal (graus)
  cobbAngles: {
    upper: number | null;
    main: number | null;
    lower: number | null;
  } | null;

  // ── Classificação clínica ─────────────────────────────────────────────────
  grauCurvatura: 'LEVE' | 'MODERADA' | 'GRAVE' | null;
  confianca: number;                          // 0.0 – 1.0

  // ── Estruturas detetadas (depende do modelo) ─────────────────────────────
  vertebrae: VertebraDetetada[] | null;
  centerlinePoints: { x: number; y: number }[] | null;

  // ── Overlay (radiografia com marcações) ──────────────────────────────────
  overlayUrl: string | null;                  // URL servida pelo modelo (ex: localhost:8000/.../overlay)
  overlayBase64: string | null;               // PNG inline em base64 (alternativa)

  // ── Avisos do modelo ─────────────────────────────────────────────────────
  warnings: string[];

  // ── Campos opcionais específicos de alguns modelos ───────────────────────
  /** Detalhe das vértebras usadas no cálculo do Cobb (Spinal-AI 2024) */
  cobbMeasurement?: {
    upperVertebraIndex: number;
    lowerVertebraIndex: number;
    upperVertebraLabel: string;
    lowerVertebraLabel: string;
    upperPlateAngleDeg: number;
    lowerPlateAngleDeg: number;
  } | null;
  /** Ângulo de Cobb antes de correção residual (Spinal-AI 2024) */
  rawGeometricCobbAngleDeg?: number | null;
  /** Correção aplicada pelo MLP residual (Spinal-AI 2024) */
  appliedCorrectionDeg?: number | null;
}

/** Estudo com todas as relações necessárias para o ExamViewerScreen */
export interface EstudoCompleto {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  tecnicoId: string | null;      // quem submeteu o exame
  dataEstudo: string;            // ISO date
  tipoEstudo: string;
  estado: EstadoEstudo;
  notasClinicas: string | null;
  ficheiroPdf: string | null;
  hashDocumento: string | null;
  assinaturaDigital: string | null;
  dataAssinatura: string | null;
  arquivado: boolean;
  geradoPorIA: boolean;
  resultado: ResultadoCompleto | null;
  imagens: ImagemEstudoInfo[];
}
