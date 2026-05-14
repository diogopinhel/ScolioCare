import { supabase } from '../../lib/supabase';
import type { UtilizadorAutenticado, Perfil } from '../types';
import { registarAcao } from './audit';

// ─── Erros de autenticação ──────────────────────────────────────────────────

export type AuthError =
  | 'EMAIL_NAO_ENCONTRADO'
  | 'PASSWORD_INCORRETA'
  | 'CONTA_BLOQUEADA'
  | 'CONTA_INATIVA'
  | 'ERRO_SERVIDOR';

export class AuthenticationError extends Error {
  constructor(public code: AuthError, message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// ─── Mapeamento DB → tipos TS ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUtilizadorDoBD(row: Record<string, any>, email: string): UtilizadorAutenticado {
  const base = {
    id: row.id as string,
    nomeCompleto: row.nome_completo as string,
    email,
    perfil: row.perfil as Perfil,
    ativo: row.ativo as boolean,
    dataCriacao: row.data_criacao as string,
    ultimoLogin: (row.ultimo_login ?? undefined) as string | undefined,
    idioma: (row.idioma ?? 'pt') as string,
    twoFactorAtivo: row.two_factor_ativo as boolean,
    contaBloqueada: row.conta_bloqueada as boolean,
  };

  switch (base.perfil) {
    case 'ADMIN':
      return { ...base, perfil: 'ADMIN' };

    case 'MEDICO':
      return {
        ...base,
        perfil: 'MEDICO',
        cedulaProfissional: (row.cedula_profissional ?? '') as string,
        especialidade: (row.especialidade ?? '') as string,
        certDigitalEntidade: (row.cert_digital_entidade ?? undefined) as string | undefined,
        certDigitalExpiracao: (row.cert_digital_expiracao ?? undefined) as string | undefined,
      };

    case 'TECNICO':
      return {
        ...base,
        perfil: 'TECNICO',
        codigoFuncionario: (row.codigo_funcionario ?? '') as string,
        departamento: (row.departamento ?? '') as string,
      };

    case 'PACIENTE':
      throw new AuthenticationError(
        'CONTA_INATIVA',
        'O acesso de pacientes está disponível apenas na aplicação móvel.',
      );

    default:
      throw new AuthenticationError('ERRO_SERVIDOR', 'Perfil de utilizador desconhecido.');
  }
}

// ─── Fetch do perfil completo ───────────────────────────────────────────────

async function fetchPerfil(userId: string, email: string): Promise<UtilizadorAutenticado> {
  const { data, error } = await supabase
    .from('utilizadores')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new AuthenticationError('ERRO_SERVIDOR', 'Não foi possível carregar o perfil.');
  }

  if (!data.ativo) {
    throw new AuthenticationError(
      'CONTA_INATIVA',
      'A sua conta está inativa. Contacte o administrador.',
    );
  }

  if (data.conta_bloqueada) {
    throw new AuthenticationError(
      'CONTA_BLOQUEADA',
      'A sua conta foi bloqueada. Contacte o administrador.',
    );
  }

  return mapUtilizadorDoBD(data, email);
}

// ─── API pública ────────────────────────────────────────────────────────────

/**
 * Autentica um utilizador via Supabase Auth e devolve o perfil completo.
 */
export async function login(
  email: string,
  password: string,
): Promise<UtilizadorAutenticado> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes('invalid login')) {
      throw new AuthenticationError('PASSWORD_INCORRETA', 'Email ou password incorretos.');
    }
    if (error.message.toLowerCase().includes('email not confirmed')) {
      throw new AuthenticationError('CONTA_INATIVA', 'A conta ainda não foi confirmada.');
    }
    throw new AuthenticationError('ERRO_SERVIDOR', 'Erro ao autenticar. Tente novamente.');
  }

  const utilizador = await fetchPerfil(data.user.id, data.user.email!);
  supabase.rpc('registar_ultimo_login').then(() => undefined, () => undefined);
  registarAcao('LOGIN', 'utilizadores', data.user.id);
  return utilizador;
}

/**
 * Termina a sessão no Supabase.
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Subscreve mudanças de autenticação (restauro de sessão, logout externo, etc.).
 * Devolve uma função de cancelamento.
 */
export function subscribeToMudancasAuth(
  callback: (utilizador: UtilizadorAutenticado | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    // SIGNED_OUT: limpar sessão
    if (event === 'SIGNED_OUT') {
      callback(null);
      return;
    }

    // INITIAL_SESSION: restauro de sessão ao (re)carregar a página.
    // É o único caso em que o subscriber precisa de buscar o perfil,
    // porque authRepo.login() ainda não foi chamado.
    if (event === 'INITIAL_SESSION') {
      if (!session) {
        callback(null);
      } else {
        try {
          const utilizador = await fetchPerfil(session.user.id, session.user.email!);
          callback(utilizador);
        } catch {
          callback(null);
        }
      }
      return;
    }

    // SIGNED_IN: tratado diretamente por authRepo.login() — ignorar aqui
    // para evitar dois fetchPerfil concorrentes que causam race condition.
    // TOKEN_REFRESHED / USER_UPDATED: o perfil não muda com um refresh de token.
  });

  return () => subscription.unsubscribe();
}
