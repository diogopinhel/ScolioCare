import type { UtilizadorAutenticado } from '../types';
import { utilizadoresMock } from '../mocks/utilizadores';

/**
 * Camada de autenticação.
 *
 * Quando a BD estiver ligada, são estas funções (e só estas) que mudam:
 * trocam-se as buscas em memória por chamadas HTTP. Todos os ecrãs e o
 * AuthContext continuam a usar a mesma assinatura.
 */

// ─── Credenciais mock ───────────────────────────────────────────────────────
// Em produção isto vive no backend hashed. Aqui é só para a demo correr.

const credenciaisMock: Record<string, string> = {
  'paulo.oliveira@scolio.pt': 'admin123',
  'ana.martins@scolio.pt': 'medico123',
  'ricardo.sousa@scolio.pt': 'tecnico123',
  'maria.silva@scolio.pt': 'paciente123',
};

// ─── Erros de autenticação ──────────────────────────────────────────────────

export type AuthError =
  | 'EMAIL_NAO_ENCONTRADO'
  | 'PASSWORD_INCORRETA'
  | 'CONTA_BLOQUEADA'
  | 'CONTA_INATIVA';

export class AuthenticationError extends Error {
  constructor(public code: AuthError, message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// ─── API mock ──────────────────────────────────────────────────────────────

/**
 * Autentica um utilizador. Devolve o utilizador em caso de sucesso ou lança
 * AuthenticationError em caso de falha.
 *
 * Latência simulada de 400 ms para a UI ter um estado de "a entrar..."
 * minimamente realista durante a demo.
 */
export async function login(
  email: string,
  password: string,
): Promise<UtilizadorAutenticado> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const emailNormalizado = email.trim().toLowerCase();
  const utilizador = utilizadoresMock.find(
    (u) => u.email.toLowerCase() === emailNormalizado,
  );

  if (!utilizador) {
    throw new AuthenticationError(
      'EMAIL_NAO_ENCONTRADO',
      'Não existe nenhuma conta associada a este email.',
    );
  }

  if (!utilizador.ativo) {
    throw new AuthenticationError(
      'CONTA_INATIVA',
      'A sua conta está inativa. Contacte o administrador.',
    );
  }

  if (utilizador.contaBloqueada) {
    throw new AuthenticationError(
      'CONTA_BLOQUEADA',
      'A sua conta foi bloqueada. Contacte o administrador.',
    );
  }

  const passwordEsperada = credenciaisMock[emailNormalizado];
  if (password !== passwordEsperada) {
    throw new AuthenticationError(
      'PASSWORD_INCORRETA',
      'Email ou password incorretos.',
    );
  }

  return utilizador;
}

/**
 * Logout. No mock só limpa storage local; em produção invalidará o token
 * no servidor.
 */
export async function logout(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 100));
}
