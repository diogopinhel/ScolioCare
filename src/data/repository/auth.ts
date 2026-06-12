import { supabase } from '../../lib/supabase';
import type { UtilizadorAutenticado, Perfil } from '../types';
import { registarAcao } from './audit';

// ─── Erros de autenticação ──────────────────────────────────────────────────

export type AuthError =
  | 'EMAIL_NAO_ENCONTRADO'
  | 'PASSWORD_INCORRETA'
  | 'CONTA_BLOQUEADA'
  | 'CONTA_INATIVA'
  | 'OTP_INVALIDO'
  | 'OTP_NAO_ENVIADO'
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

// ─── Helper interno: marca login completo (ultimo_login + audit) ────────────

function marcarLoginCompletado(userId: string): void {
  supabase.rpc('registar_ultimo_login').then(() => undefined, () => undefined);
  registarAcao('LOGIN', 'utilizadores', userId);
}

/**
 * Como o fetchPerfil só corre DEPOIS de o Supabase ter estabelecido a sessão
 * (signInWithPassword/verifyOtp), uma conta bloqueada ou inativa ficaria com
 * uma sessão válida apesar do erro mostrado no UI. Este wrapper termina a
 * sessão nesses casos (fail-closed) antes de propagar o erro. Erros
 * transitórios (ERRO_SERVIDOR) não terminam a sessão.
 */
async function fetchPerfilOuTerminarSessao(
  userId: string,
  email: string,
): Promise<UtilizadorAutenticado> {
  try {
    return await fetchPerfil(userId, email);
  } catch (err) {
    if (
      err instanceof AuthenticationError &&
      (err.code === 'CONTA_BLOQUEADA' || err.code === 'CONTA_INATIVA')
    ) {
      await supabase.auth.signOut().catch(() => undefined);
    }
    throw err;
  }
}

// ─── API pública ────────────────────────────────────────────────────────────

/**
 * Resultado do `login`. Quando o utilizador tem 2FA ativo, o repositório
 * envia o OTP por email e devolve `needsTwoFactor: true` — a sessão Supabase
 * já está estabelecida mas o AuthContext bloqueia o acesso até ao OTP ser
 * verificado (`verificarOtpEmail`).
 */
export type LoginResult =
  | { needsTwoFactor: false; utilizador: UtilizadorAutenticado }
  | { needsTwoFactor: true; email: string };

/**
 * Autentica um utilizador via Supabase Auth.
 *
 * - Sem 2FA: devolve o perfil completo, atualiza `ultimo_login` e regista
 *   evento `LOGIN` no audit log.
 * - Com 2FA: envia OTP por email e devolve `needsTwoFactor: true`. O
 *   `ultimo_login` e o audit log só são registados quando `verificarOtpEmail`
 *   é chamado com sucesso.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
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

  const utilizador = await fetchPerfilOuTerminarSessao(data.user.id, data.user.email!);

  if (utilizador.twoFactorAtivo) {
    // Envia o OTP por email; a sessão Supabase fica estabelecida mas o
    // AuthContext bloqueia o acesso até ao código ser verificado.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (otpError) {
      // Fail-closed: sem OTP enviado a verificação nunca pode acontecer, e a
      // sessão da password já está viva — terminá-la evita que um refresh
      // entre sem segundo fator (ex: quando o rate-limit de email dispara).
      await supabase.auth.signOut().catch(() => undefined);
      throw new AuthenticationError(
        'OTP_NAO_ENVIADO',
        'Não foi possível enviar o código de verificação. Tente novamente.',
      );
    }
    return { needsTwoFactor: true, email };
  }

  marcarLoginCompletado(utilizador.id);
  return { needsTwoFactor: false, utilizador };
}

/**
 * Termina a sessão no Supabase.
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Envia um novo OTP por email. Usado tanto na ativação de 2FA como no
 * botão "reenviar código" do ecrã de verificação.
 */
export async function enviarOtpEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) {
    throw new AuthenticationError(
      'OTP_NAO_ENVIADO',
      'Não foi possível enviar o código. Tente novamente.',
    );
  }
}

/**
 * Verifica o OTP introduzido pelo utilizador.
 *
 * - `marcarComoLogin = true` (modo "login"): regista evento LOGIN no audit e
 *   atualiza `ultimo_login`. Usado quando este OTP é a segunda etapa do login.
 * - `marcarComoLogin = false` (modo "ativar"): apenas valida o código sem
 *   efeitos colaterais. Usado durante a ativação a partir do perfil.
 */
export async function verificarOtpEmail(
  email: string,
  token: string,
  options?: { marcarComoLogin?: boolean },
): Promise<UtilizadorAutenticado> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error || !data.user) {
    const msg = (error?.message ?? '').toLowerCase();
    if (msg.includes('expired') || msg.includes('invalid') || msg.includes('token')) {
      throw new AuthenticationError('OTP_INVALIDO', 'Código inválido ou expirado.');
    }
    throw new AuthenticationError('ERRO_SERVIDOR', 'Não foi possível verificar o código.');
  }

  const utilizador = await fetchPerfilOuTerminarSessao(data.user.id, data.user.email!);

  if (options?.marcarComoLogin) {
    marcarLoginCompletado(utilizador.id);
  }

  return utilizador;
}

/**
 * Ativa 2FA para o utilizador. Deve ser chamada SÓ depois de
 * `verificarOtpEmail` ter sucesso.
 */
export async function ativar2FA(userId: string): Promise<void> {
  const { error } = await supabase
    .from('utilizadores')
    .update({ two_factor_ativo: true })
    .eq('id', userId);
  if (error) {
    // Nesta altura o verifyOtp já consumiu o código — repetir o mesmo código
    // daria "inválido ou expirado", por isso a mensagem pede um código novo.
    throw new AuthenticationError(
      'ERRO_SERVIDOR',
      'Não foi possível concluir a ativação. Pede um novo código e tenta novamente.',
    );
  }
  registarAcao('ATIVAR_2FA', 'utilizadores', userId);
}

/**
 * Desativa 2FA para o utilizador. Não exige verificação OTP — apenas
 * confirmação no UI.
 */
export async function desativar2FA(userId: string): Promise<void> {
  const { error } = await supabase
    .from('utilizadores')
    .update({ two_factor_ativo: false })
    .eq('id', userId);
  if (error) {
    throw new AuthenticationError('ERRO_SERVIDOR', 'Não foi possível desativar a 2FA.');
  }
  registarAcao('DESATIVAR_2FA', 'utilizadores', userId);
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
        } catch (err) {
          // Conta bloqueada/inativa entretanto: termina a sessão restaurada
          // (fail-closed) em vez de a deixar viva mas "escondida" do UI.
          if (
            err instanceof AuthenticationError &&
            (err.code === 'CONTA_BLOQUEADA' || err.code === 'CONTA_INATIVA')
          ) {
            supabase.auth.signOut().then(() => undefined, () => undefined);
          }
          callback(null);
        }
      }
      return;
    }

    // SIGNED_IN: tratado diretamente por authRepo.login()/verificarOtpEmail()
    // — ignorar aqui. Particularmente importante para o fluxo de 2FA: o
    // verifyOtp dispara SIGNED_IN, mas o AuthContext precisa de limpar o
    // estado `pendente2FA` antes de marcar o utilizador como autenticado.
    // TOKEN_REFRESHED / USER_UPDATED: o perfil não muda com um refresh de token.
  });

  return () => subscription.unsubscribe();
}
