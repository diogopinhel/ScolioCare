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
  contaAtivada: boolean;
}

// ─── União discriminada ────────────────────────────────────────────────────

export type UtilizadorAutenticado =
  | Administrador
  | MedicoEspecialista
  | TecnicoSaude
  | Paciente;

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
