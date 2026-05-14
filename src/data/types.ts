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
  nivelAdmin: number;           // default 1
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
  nivelVertebras: string | null;
}

export interface EstudoComResultado {
  id: string;
  dataEstudo: string;          // ISO date
  estado: EstadoEstudo;
  notasClinicas: string | null;
  ficheiroPdf: string | null;
  resultado: ResultadoEstudo | null;
}

export interface WellnessLogEntry {
  id: string;
  dataRegisto: string;         // ISO date
  nivelDor: number;            // 0-9
  desconforto: string | null;  // 'none' | 'mild' | 'moderate' | 'intense'
  notas: string | null;
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
  nivelVertebras: string | null;
  confiancaModelo: number;       // 0.0 – 1.0
  versaoModelo: string;
  overlayJson: unknown | null;   // coordenadas/anotações do modelo para o overlay SVG
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
  ipOrigem: string | null;
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
  nivelVertebras: string | null;
  urlImagem: string | null;    // URL assinada da primeira imagem (ou null)
}

// ─── Criação de paciente ──────────────────────────────────────────────────

export interface DadosCriacaoPaciente {
  nomeCompleto: string;
  email: string;
  dataNascimento: string;
  genero: string;
  numeroUtente: string;
  medicoId: string;
  contacto?: string;
  morada?: string;
  cartaoCidadao?: string;
}

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
}

/** Estudo com todas as relações necessárias para o ExamViewerScreen */
export interface EstudoCompleto {
  id: string;
  pacienteId: string;
  pacienteNome: string;
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
