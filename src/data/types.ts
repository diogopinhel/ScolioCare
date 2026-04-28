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
